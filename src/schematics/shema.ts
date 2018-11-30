import * as path from 'path';
import * as vscode from 'vscode';
import { Collection, CollectionDataSchema } from './collection';
import { Utils } from './utils';


export interface SchemaDataDefaultOption {
    $source: 'argv' | 'projectName';
    index?: number;
}

export interface SchemaDataOptions {
    type: 'string' | 'boolean';
    description: string;
    enum?: string[];
    visible?: boolean;
    default?: string | boolean;
    $default?: SchemaDataDefaultOption;
    extends?: string;
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

            if (this.collection.name.startsWith(".") && this.collection.name.endsWith(".json")) {
                schema = await Utils.getSchemaFromPath<SchemaData>(cwd, "", this.path); 
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
            || (this.requiredOptions.indexOf('name') !== -1)) {
                return true;
            }
        }

        return false;
    
    }

    hasPath(): boolean {

        return this.options.has('path');
    
    }

    async askDefaultOption(contextPath = '', project = ''): Promise<string | undefined> {

        /** @todo Investigate if there could be other default option than name */
        return vscode.window.showInputBox({
            prompt: `Name or pathname${project ? ` in project ${project}` : ''}?`,
            value: contextPath,
            valueSelection: [contextPath.length, contextPath.length]
        });

    }

    async askOptions(): Promise<string[]> {

        const choices: vscode.QuickPickItem[] = [];

        this.options.forEach((option, optionName) => {

            if (option.visible !== false) {

                choices.push({ label: optionName, description: option.description });

            }

        });

        const sortedChoices = choices.sort((a, b) => a.label.localeCompare(b.label));

        const selectedOptions = await vscode.window.showQuickPick(sortedChoices, {
            canPickMany: true,
            placeHolder: `Do you need some options?`
        }) || [];

        return selectedOptions.map((selectedOption) => selectedOption.label);

    }

    async askOptionsValues(optionsNames: string[]): Promise<Map<string, string>> {

        const options = this.filterSelectedOptions(optionsNames);

        const filledOptions = new Map();
    
        for (let [optionName, option] of options) {

            let choice: string | undefined = '';
    
            if (option.enum !== undefined) {
    
                /** @todo Put default value last in choices */
                /** @todo Take user defaults in angular.json into account in ordering */
                choice = await this.askEnumOption(optionName, option.enum, option.description);
    
            } else if (option.type === 'boolean') {
    
                /** @todo Take user defaults in angular.json into account in ordering */
                const choices = (option.default === true) ? ['false', 'true'] : ['true', 'false'];
    
                choice = await this.askEnumOption(optionName, choices, option.description);
    
            } else {
    
                choice = await vscode.window.showInputBox({ placeHolder: `--${optionName}`, prompt: option.description });
    
            }
    
            if (choice) {
                filledOptions.set(optionName, choice);
            }

        }
    
        return filledOptions;
    
    }

    protected async askEnumOption(optionName: string, choices: string[], placeholder = '') {

        return vscode.window.showQuickPick(choices, { placeHolder: `--${optionName}${placeholder ? `: ${placeholder}` : ''}` });

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
            if (requiredOptionName !== 'name') {
                selectedOptions.set(requiredOptionName, this.options.get(requiredOptionName) as SchemaDataOptions);
            }
        });

        return selectedOptions;

    }

}
