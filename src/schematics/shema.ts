import * as vscode from 'vscode';
import * as path from 'path';

import { Utils } from './utils';
import { Collection } from './collection';

export interface SchemaDataOptionDetails {
    type: 'string' | 'boolean';
    description: string;
    enum?: string[];
    visible?: boolean;
    default?: string | boolean;
    $default?: {
        $source: 'argv' | 'projectName';
        index?: number;
    };
}

export interface SchemaDataOptions {
    [key: string]: SchemaDataOptionDetails;
}

export interface SchemaData {
    properties: SchemaDataOptions;
    required?: string[];
}

export class Schema {

    collection: Collection;
    name: string;
    data: SchemaData | null = null;
    options: SchemaDataOptions | null = null;

    constructor(name: string, collection: Collection) {
        this.name = name;
        this.collection = collection;
    }

    async load(): Promise<void> {

        if (!vscode.workspace.rootPath || !this.collection.data) {
            return;
        }

        const schemaPath = path.join(
            vscode.workspace.rootPath,
            'node_modules',
            this.collection.name,
            this.collection.data.schematics[this.name].schema.replace('./', '')
        );

        this.data = await Utils.parseJSONFile<SchemaData>(schemaPath);

        if (this.data) {

            this.options = this.data.properties;

        }

    }

    getOptionsNames(): string[] {
        return this.options ? Object.keys(this.options) : [];
    }

    hasDefaultOption(): boolean {

        if (this.options) {

            for (let optionName in this.options) {

                const option = this.options[optionName];

                if (
                    (option.$default !== undefined)
                    && (option.$default.$source === 'argv')
                    && (option.$default.index === 0)
                ) {
                    return true;
                }

            }

        }

        return false;
    
    }

    hasPath(): boolean {

        return this.options ? (this.getOptionsNames().indexOf('path') !== -1) : false;
    
    }

    filterSelectedOptions(selectedOptionsNames: string[]): SchemaDataOptions {

        const selectedOptions: SchemaDataOptions = {};

        if (this.data && this.options) {

            for (let selectedOptionName of selectedOptionsNames) {

                selectedOptions[selectedOptionName] = this.options[selectedOptionName];

            }

            if (this.data.required) {

                for (let requiredOptionName of this.data.required) {

                    if (!(requiredOptionName in selectedOptions)) {

                        selectedOptions[requiredOptionName] = this.options[requiredOptionName];

                    }

                }

            } 

        }

        return selectedOptions;

    }

    async askDefaultOption(): Promise<string | undefined> {

        /**
         * @todo Investigate if there could be other default option than name
         * @todo Localization
         */
        return vscode.window.showInputBox({ prompt: `Name or pathname?` });

    }

    async askOptions(options: SchemaDataOptions): Promise<string[]> {

        const optionsArg = [];
    
        for (let optionName in options) {
    
            const option = options[optionName];

            let choice: string | undefined = '';
    
            if (option.enum !== undefined) {
    
                /** @todo Put default value last in choices */
                /** @todo Take user defaults in angular.json into account in ordering */
                choice = await this.askEnumOption(optionName, option.enum);
    
            } else if (option.type === 'string') {
    
                choice = await vscode.window.showInputBox({ placeHolder: `--${optionName}`, prompt: option.description });
    
            } else if (option.type === 'boolean') {
    
                /** @todo Take user defaults in angular.json into account in ordering */
                const choices = (option.default === true) ? ['false', 'true'] : ['true', 'false'];
    
                choice = await this.askEnumOption(optionName, choices);
    
            }
    
            if (choice) {
                optionsArg.push(`--${optionName} ${choice}`);
            }
    
        }
    
        return optionsArg;
    
    }

    protected async askEnumOption(optionName: string, choices: string[]) {

        return vscode.window.showQuickPick(choices, { placeHolder: `--${optionName}` });

    }

}
