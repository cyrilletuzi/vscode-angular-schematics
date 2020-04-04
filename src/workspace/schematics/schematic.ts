import * as vscode from 'vscode';
import * as path from 'path';

import { FileSystem, Output } from '../../utils';
import { SchematicJsonSchema, SchematicOptionJsonSchema, CollectionJsonSchema } from './json-schemas';

/** Configuration needed to load a schematic */
export interface SchematicConfig {
    name: string;
    collectionName: string;
    description: string;
    fsPath?: string;
    collectionFsPath?: string;
}

export class Schematic {

    optionsChoices: vscode.QuickPickItem[] = [];
    private name: string;
    private collectionName: string;
    private fsPath: string | undefined;
    private collectionFsPath: string | undefined;
    private config!: SchematicJsonSchema;
    private options = new Map<string, SchematicOptionJsonSchema>();
    private requiredOptionsNames: string[] = [];

    constructor(config: SchematicConfig) {
        this.name = config.name;
        this.collectionName = config.collectionName;
        this.fsPath = config.fsPath;
        this.collectionFsPath = config.collectionFsPath;
    }

    /**
     * Load the schematic.
     * **Must** be called after each `new Collection()`
     * (delegated because `async` is not possible on a constructor).
     */
    async init(): Promise<void> {

        /* Schematics extended from another collection needs to get back the schema path */
        if (!this.fsPath) {
            if (!this.collectionFsPath) {
                throw new Error(`"${this.collectionName}:${this.name}" schematic cannot be extended.`);
            }
            this.fsPath = await this.getFsPath(this.collectionFsPath);
        }
        
        const config = await FileSystem.parseJsonFile<SchematicJsonSchema>(this.fsPath);

        if (!config) {
            throw new Error(`"${this.collectionName}:${this.name}" schematic cannot be loaded.`);
        }

        this.config = config;

        await this.setOptions();

    }

    /**
     * Get schema's name without collection
     */
    getName(): string {
        return this.name;
    }

    /**
     * Get options' details from their names
     */
    getSomeOptions(names: string[]): Map<string, SchematicOptionJsonSchema> {

        return new Map(names
            .filter((name) => this.options.has(name))
            .map((name) => [name, this.options.get(name)!])
        );

    }

    /**
     * Get required options details
     */
    getRequiredOptions(): Map<string, SchematicOptionJsonSchema> {

        return new Map(this.requiredOptionsNames
            .map((name) => [name, this.options.get(name)!])
        );

    }

    /**
     * Get the default value of an option, or `undefined`.
     */
    getOptionDefaultValue(name: string): SchematicOptionJsonSchema['default'] {
        return this.options.get(name)?.default;
    }

    /**
     * Tells if an option exists in the schematic.
     */
    hasOption(name: string): boolean {
        return this.options.has(name);
    }

    /**
     * Tells if the schematic requires a path/to/name as first command line argument
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

    /**
     * Get the schema filesystem path.
     */
    private async getFsPath(collectionFsPath: string): Promise<string> {

        const collectionJsonConfig = await FileSystem.parseJsonFile<CollectionJsonSchema>(collectionFsPath);

        const schemaPath = collectionJsonConfig?.schematics?.[this.name]?.schema;

        /* `package.json` should have a `schematics` property with relative path to `collection.json` */
        if (!schemaPath) {
            throw new Error(`"${this.collectionName}:${this.name}" can not be extended.`);
        }

        return path.join(path.dirname(collectionFsPath), schemaPath);

    }

    private async setOptions(): Promise<void> {

        const options = Object.entries(this.config.properties);

        Output.logInfo(`${options.length} options detected for "${this.name}" schematic: ${options.map(([name]) => name).join(', ')}`);

        /* Set all options */
        for (const [name, option] of options) {
            this.options.set(name, option);
        }

        /* Set required options' names */
        this.requiredOptionsNames = (this.config.required ?? [])
            /* Options which have a `$default` will be taken care by the CLI, so they are not required */
            .filter((name) => !(('$default') in this.options.get(name)!));

        Output.logInfo(`${this.requiredOptionsNames.length} required option(s) detected for "${this.name}" schematic${this.requiredOptionsNames.length > 0 ? `: ${this.requiredOptionsNames.join(', ')}` : ``}`);
        
        this.setOptionsChoices();

    }

    /**
     * Cache options choices
     */
    private setOptionsChoices(): void {

        const choices: vscode.QuickPickItem[] = [];

        const filteredOptionsNames = Array.from(this.options.entries())
            /* Do not keep options marked as not visible (internal options for the CLI) */
            .filter(([_, option]) => (option.visible !== false))
            /* Do not keep deprecated options */
            .filter(([_, option]) => !('x-deprecated' in option))
            /* Do not keep option already managed by first command line arg (name) */
            .filter(([_, option]) => !(option.$default && (option.$default.$source === 'argv') && (option.$default.index === 0)));

        for (const [label, option] of filteredOptionsNames) {

            let picked = false;

            /* UX: inform the user why some options are pre-select */
            let requiredOrSuggestedInfo = '';

            /* Do not pre-select options with defaults values, as the CLI will take care of them */
            if (!('$default' in option)) {

                /* Required options */
                if (this.requiredOptionsNames.includes(label)) {
                    picked = true;
                    requiredOrSuggestedInfo = `(required) `;
                }
                /* Suggested options (because they have a prompt) */
                else if ('x-prompt' in option) {
                    picked = true;
                    requiredOrSuggestedInfo = `(suggested) `;
                }

            }

            choices.push({
                label,
                description: `${requiredOrSuggestedInfo}${option.description}`,
                picked
            });

        }

        /* Sort required first, then in alphabetical order */
        const sortedPickedChoices = choices
            .filter((choice) => choice.picked)
            .sort((a, b) => a.label.localeCompare(b.label));

        const sortedOptionalChoices = choices
            .filter((choice) => !choice.picked)
            .sort((a, b) => a.label.localeCompare(b.label));

        /* Required and suggested options first */
        this.optionsChoices = [...sortedPickedChoices, ...sortedOptionalChoices];

    } 

}
