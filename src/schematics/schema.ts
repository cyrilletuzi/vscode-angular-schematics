import * as path from 'path';
import * as vscode from 'vscode';
import { Collection, CollectionDataSchema } from './collection';
import { Utils } from './utils';


export interface SchemaDataDefaultOption {
    $source: 'argv' | 'projectName';
    index?: number;
}

export interface SchemaDataOptions {
    type: 'string' | 'boolean' | 'array';
    description: string;
    enum?: string[];
    visible?: boolean;
    default?: string | boolean;
    $default?: SchemaDataDefaultOption;
    extends?: string;
    'x-deprecated'?: string;
    'x-prompt'?: {
        message?: string;
        multiselect?: boolean;
        items?: string[];
    };
}

export interface SchemaData {
    properties: {
        [key: string]: SchemaDataOptions;
    };
    required?: string[];
}

export class Schema {

    collection: Collection;
    name: string;
    path = '';
    requiredOptions: string[] = [];
    options = new Map<string, SchemaDataOptions>();
    get optionsNames(): string[] {
        return Array.from(this.options.keys()).sort();
    }
    static cache = new Map<string, SchemaData>();

    constructor(name: string, collection: Collection) {
        this.name = name;
        this.collection = collection;
    }

    async load(cwd: string): Promise<boolean> {

        let schema: SchemaData | null = null;

        const cachedSchema = Schema.cache.get(`${this.collection}:${this.name}`);

        if (cachedSchema) {

            schema = cachedSchema;

        } else {

            this.path = path.join(
                Utils.getDirectoryFromFilename(this.collection.path),
                Utils.pathTrimRelative((this.collection.schemas.get(this.name) as CollectionDataSchema).schema)
            );

            if (Utils.isSchemaLocal(this.collection.name)) {
                schema = await Utils.getSchemaFromLocal<SchemaData>(cwd, this.path); 
            } else {
                schema = await Utils.getSchemaFromNodeModules<SchemaData>(cwd, this.collection.name, this.path);
            }

        }

        if (schema) {

            this.initOptionsMap(schema);

            this.requiredOptions = schema.required || [];

            Schema.cache.set(`${this.collection}:${this.name}`, schema);

            return true;
        }

        return false;

    }

    hasDefaultOption(): boolean {

        for (let option of this.options.values()) {
            if ((option.$default && (option.$default.$source === 'argv') && (option.$default.index === 0))
            || (this.requiredOptions.includes('name'))) {
                return true;
            }
        }

        return false;
    
    }

    hasPath(): boolean {

        return this.options.has('path');
    
    }

    async askDefaultOption(contextPath = '', project = ''): Promise<string | undefined> {

        let prompt = `Name or path/name ${project ? `in project '${project}'` : 'in default project'}?`;

        if (!contextPath || !project) {
            prompt = `${prompt} Pro-tip: the path and project can be auto-inferred if you launch the command with a right-click on the directory where you want to generate.`;
        }

        /** @todo Investigate if there could be other default option than name */
        return vscode.window.showInputBox({
            prompt,
            value: contextPath,
            valueSelection: [contextPath.length, contextPath.length],
            ignoreFocusOut: true,
        });

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
            else if ((option.type === 'array') && promptSchema && promptSchema.items) {

                if (promptSchema.multiselect) {
                    choice = await this.askMultiselectOption(optionName, promptSchema.items, prompt);
                } else {
                    choice = await this.askEnumOption(optionName, promptSchema.items as string[], prompt);
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

    protected initOptionsMap(schema: SchemaData): void {

        for (let optionName in schema.properties) {

            if (schema.properties.hasOwnProperty(optionName)) {

                this.options.set(optionName, schema.properties[optionName]);

            }

        }

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
