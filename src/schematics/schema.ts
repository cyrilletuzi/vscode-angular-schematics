import * as vscode from 'vscode';

import { FileSystem } from './file-system';

export interface SchemaConfig {
    name: string;
    collectionName: string;
    description: string;
    fsPath: string;
}

interface SchemaDataDefaultOption {
    $source: 'argv' | 'projectName';
    index?: number;
}

interface SchemaDataOptions {
    type: 'string' | 'boolean' | 'array';
    description: string;
    enum?: string[];
    visible?: boolean;
    default?: string | boolean;
    $default?: SchemaDataDefaultOption;
    extends?: string;
    items?: {
        enum?: string[];
    };
    'x-deprecated'?: string;
    'x-prompt'?: {
        message?: string;
        multiselect?: boolean;
        items?: string[];
    };
}

interface SchemaData {
    properties: {
        [key: string]: SchemaDataOptions;
    };
    required?: string[];
}

export class Schema {

    private name: string;
    private fsPath: string;
    private config!: SchemaData;
    private requiredOptions: string[] = [];
    private options = new Map<string, SchemaDataOptions>();
    get optionsNames(): string[] {
        return Array.from(this.options.keys()).sort();
    }
    static cache = new Map<string, SchemaData>();

    constructor(
        config: SchemaConfig,
        private workspace: vscode.WorkspaceFolder,
    ) {

        this.name = config.name;
        this.fsPath = config.fsPath;

    }

    async init(): Promise<void> {

        if (!await FileSystem.isReadable(this.fsPath, this.workspace)) {
            throw new Error(`${this.name} schematics schema can not be found or read.`);
        }

        const config = await FileSystem.parseJsonFile<SchemaData>(this.fsPath);

        if (!config) {
            throw new Error(`${this.name} schematics collection can not be parsed.`);
        }

        this.setOptions();

    }

    /**
     * Get schema's name without collection
     */
    getName(): string {
        return this.name;
    }

    /**
     * Tells if the schema requires a path/to/name as first command line argument
     */
    hasNameAsFirstArg(): boolean {

        for (const [name, option] of this.options.entries()) {

            /* `argv[0]` means it is the first argument in command line after `ng g <some-schema>` */
            if ((name === 'name') && (option.$default?.$source === 'argv') && (option.$default?.index === 0)) {
                return true;
            }

        }

        return false;
    
    }

    hasPath(): boolean {

        return this.options.has('path');
    
    }

    async askOptions(): Promise<string[]> {

        const choices: vscode.QuickPickItem[] = [];

        this.options.forEach((option, optionName) => {

            /* Do not keep:
             * - options marked as not visible (internal options for the CLI)
             * - deprecated options
             * - option already managed by command line args (like name)
             */
            if (option.visible !== false && !('x-deprecated' in option) &&
                !(option.$default && option.$default.$source === 'argv')) {

                const picked = !!
                /* Do not pre-select options with defaults values, as the CLI will take care of them */
                (!('$default' in option) && (
                    /* Pre-select required and suggested (x-prompt) properties */
                    (this.requiredOptions.includes(optionName)) || ('x-prompt' in option)
                ));

                /* UX: inform the user why some options are pre-select */
                const requiredTip = (!('$default' in option) && (this.requiredOptions.includes(optionName))) ? '(required) ' : '';
                const suggestedTip = (!('$default' in option) && !requiredTip && ('x-prompt' in option)) ? '(suggested) ' : '';

                choices.push({
                    label: optionName,
                    description: `${requiredTip}${suggestedTip}${option.description}`,
                    picked
                });

            }

        });

        /* Sort in alphabetical order */
        const sortedPickedChoices = choices
        .filter((choice) => choice.picked)
        .sort((a, b) => a.label.localeCompare(b.label));

        const sortedOptionalChoices = choices
        .filter((choice) => !choice.picked)
        .sort((a, b) => a.label.localeCompare(b.label));

        /* Required and suggested options first */
        const sortedChoices = [...sortedPickedChoices, ...sortedOptionalChoices];

        const selectedOptions = await vscode.window.showQuickPick(sortedChoices, {
            canPickMany: true,
            placeHolder: `Do you need some options? (if not, just press Enter to skip this step)`,
            ignoreFocusOut: true,
        }) || [];

        return selectedOptions.map((selectedOption) => selectedOption.label);

    }

    async askOptionsValues(optionsNames: string[]): Promise<Map<string, string | string[]>> {

        const options = this.filterSelectedOptions(optionsNames);

        const filledOptions = new Map<string, string | string[]>();
    
        for (let [optionName, option] of options) {

            let choice: string | string[] | undefined = '';
            const promptSchema = option['x-prompt'];
            const prompt = (promptSchema && promptSchema.message) ? promptSchema.message : option.description;
    
            if (option.enum !== undefined) {
    
                /** @todo Put default value last in choices */
                /** @todo Take user defaults in angular.json into account in ordering */
                choice = await this.askEnumOption(optionName, option.enum, prompt);
    
            } else if (option.type === 'boolean') {
    
                /** @todo Take user defaults in angular.json into account in ordering */
                const choices = (option.default === true) ? ['false', 'true'] : ['true', 'false'];
    
                choice = await this.askEnumOption(optionName, choices, prompt);
    
            }
            /* Only makes sense if the option is an array AND have suggestions,
             * otherwise the user must manually type the value in a classic text input box */
            else if ((option.type === 'array')) {

                if (promptSchema && promptSchema.multiselect && promptSchema.items) {
                    choice = await this.askMultiselectOption(optionName, promptSchema.items, prompt);
                } else if (option.items && option.items.enum) {
                    choice = await this.askMultiselectOption(optionName, option.items.enum, prompt);
                } else {
                    choice = await vscode.window.showInputBox({
                        placeHolder: `--${optionName}`,
                        prompt,
                        ignoreFocusOut: true,
                    });
                }
    
            } else {
    
                choice = await vscode.window.showInputBox({
                    placeHolder: `--${optionName}`,
                    prompt,
                    ignoreFocusOut: true,
                });
    
            }
    
            if (choice) {
                filledOptions.set(optionName, choice);
            }

        }
    
        return filledOptions;
    
    }

    protected async askEnumOption(optionName: string, choices: string[], placeholder = ''): Promise<string | undefined> {

        return vscode.window.showQuickPick(choices, {
            placeHolder: `--${optionName}${placeholder ? `: ${placeholder}` : ''}`,
            ignoreFocusOut: true,
        });

    }

    protected async askMultiselectOption(optionName: string, choices: string[], placeholder = ''): Promise<string[] | undefined> {

        return vscode.window.showQuickPick(choices, {
            placeHolder: `--${optionName}${placeholder ? `: ${placeholder}` : ''}`,
            canPickMany: true,
            ignoreFocusOut: true,
        });

    }

    private setOptions(): void {

        const options = Object.entries(this.config.properties);

        for (const [name, option] of options) {
            this.options.set(name, option);
        }

        this.requiredOptions = this.config.required ?? [];

    }

    protected filterSelectedOptions(selectedOptionsNames: string[]): Map<string, SchemaDataOptions> {

        const selectedOptions = new Map<string, SchemaDataOptions>();

        selectedOptionsNames.forEach((selectedOptionName) => {
            const option = this.options.get(selectedOptionName);
            if (option) {
                selectedOptions.set(selectedOptionName, option);
            }
        });

        this.requiredOptions.forEach((requiredOptionName) => {

            const requiredOptionData = this.options.get(requiredOptionName);

            /* Filter options with $default values already managed by the CLI */
            if (requiredOptionName !== 'name' && requiredOptionData && !('$default' in requiredOptionData)) {
                selectedOptions.set(requiredOptionName, this.options.get(requiredOptionName) as SchemaDataOptions);
            }

        });

        return selectedOptions;

    }

}
