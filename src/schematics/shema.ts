import * as vscode from 'vscode';
import * as path from 'path';

import { Utils } from './utils';
import { Collection, CollectionData } from './collection';

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
    path = '';
    data: SchemaData | null = null;
    options: SchemaDataOptions | null = null;
    static cache = new Map<string, SchemaData>();

    constructor(name: string, collection: Collection) {
        this.name = name;
        this.collection = collection;
    }

    async load(): Promise<void> {

        const cachedSchema = Schema.cache.get(this.name);

        if (cachedSchema) {

            this.data = cachedSchema;

        } else {

            this.path = path.join(
                Utils.getDirectoryFromFilename(this.collection.path),
                Utils.pathTrimRelative((this.collection.data as CollectionData).schematics[this.name].schema)
            );

            this.data = await Utils.getSchemaFromNodeModules<SchemaData>(this.collection.name, this.path);

        }

        if (this.data) {

            this.options = this.data.properties;

        }

    }

    getOptionsNames(): string[] {
        return this.options ? Object.keys(this.options).sort() : [];
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

        /** @todo Investigate if there could be other default option than name */
        return vscode.window.showInputBox({ prompt: `Name or pathname?` });

    }

    async askOptions(): Promise<string[] | undefined> {

        return vscode.window.showQuickPick(this.getOptionsNames(), {
            canPickMany: true,
            placeHolder: `Do you need some options?`
        });

    }

    async askOptionsValues(optionsNames: string[]): Promise<Map<string, string>> {

        const options = this.filterSelectedOptions(optionsNames);

        const optionsMap = new Map();
    
        for (let optionName in options) {
    
            const option = options[optionName];

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
                optionsMap.set(optionName, choice);
            }
    
        }
    
        return optionsMap;
    
    }

    protected async askEnumOption(optionName: string, choices: string[], placeholder = '') {

        return vscode.window.showQuickPick(choices, { placeHolder: `--${optionName}${placeholder ? `: ${placeholder}` : ''}` });

    }

}
