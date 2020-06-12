import * as vscode from 'vscode';
import * as path from 'path';

import { FileSystem, Output, JsonValidator } from '../../utils';
import { SchematicJsonSchema, SchematicOptionJsonSchema } from './json-schemas';

export class Schematic {

    optionsChoices: vscode.QuickPickItem[] = [];
    private name: string;
    private collectionName: string;
    private options = new Map<string, SchematicOptionJsonSchema>();
    private requiredOptionsNames: string[] = [];

    constructor(name: string, collectionName: string) {
        this.name = name;
        this.collectionName = collectionName;
    }

    /**
     * Load the schematic.
     * **Must** be called after each `new Collection()`
     * (delegated because `async` is not possible on a constructor).
     */
    async init({ fsPath, collectionFsPath }: { fsPath?: string; collectionFsPath?: string; }): Promise<void> {

        /* Schematics extended from another collection needs to get back the schema path */
        if (!fsPath) {
            if (!collectionFsPath) {
                throw new Error(`"${this.collectionName}:${this.name}" schematic cannot be extended.`);
            }
            try {
                fsPath = await this.getFsPathFromCollection(collectionFsPath);
            } catch {
                throw new Error(`"${this.collectionName}:${this.name}" can not be extended.`);
            }
        }
        
        const unsafeConfig = await FileSystem.parseJsonFile(fsPath);

        if (!unsafeConfig) {
            throw new Error(`"${this.collectionName}:${this.name}" schematic cannot be loaded.`);
        }

        const config = this.validateConfig(unsafeConfig);

        /* Set all options */
        this.options = config.properties;

        Output.logInfo(`${this.options.size} options detected for "${this.name}" schematic: ${Array.from(this.options.keys()).join(', ')}`);

        this.initGlobalOptions();

        this.requiredOptionsNames = this.initRequiredOptions(config);

        Output.logInfo(`${this.requiredOptionsNames.length} required option(s) detected for "${this.name}" schematic${this.requiredOptionsNames.length > 0 ? `: ${this.requiredOptionsNames.join(', ')}` : ``}`);
        
        this.optionsChoices = this.initOptionsChoices(config, this.requiredOptionsNames);

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

        for (const [name, option] of this.options) {

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
    private async getFsPathFromCollection(collectionFsPath: string): Promise<string> {

        const collectionJsonConfig = await FileSystem.parseJsonFile(collectionFsPath);

        const schemaPath = JsonValidator.string(JsonValidator.object(JsonValidator.object(JsonValidator.object(collectionJsonConfig)?.schematics)?.[this.name])?.schema);

        /* `package.json` should have a `schematics` property with relative path to `collection.json` */
        if (!schemaPath) {
            throw new Error();
        }

        return path.join(path.dirname(collectionFsPath), schemaPath);

    }

    /**
     * Validate schema.json
     */
    private validateConfig(rawConfig: unknown): SchematicJsonSchema {

        const config = JsonValidator.object(rawConfig);

        const properties = new Map(Object.entries(JsonValidator.object(config?.properties) ?? {})
            .map(([name, rawConfig]) => {

                const config = JsonValidator.object(rawConfig);

                const $default = JsonValidator.object(config?.$default);
                if ($default) {
                    $default.$source = JsonValidator.string($default.$source);
                    $default.index = JsonValidator.number($default.index);
                }

                let items = JsonValidator.object(config?.items);

                const xPromptString = JsonValidator.string(config?.['x-prompt']);
                const xPromptObject = JsonValidator.object(config?.['x-prompt']);

                if (items) {
                    items.enum = this.validateConfigArrayChoices(JsonValidator.array(items.enum));
                }
                /** Deprecated, Angular >= 8.3 uses `items.enum` instead */
                else if (xPromptObject) {
                    const multiselect = JsonValidator.boolean(xPromptObject.multiselect);
                    if (multiselect === true) {
                        items = {};
                        items.enum = this.validateConfigArrayChoices(JsonValidator.array(xPromptObject.items));
                    }
                }

                return [name, {
                    type: JsonValidator.string(config?.type),
                    description: JsonValidator.string(config?.description),
                    visible: JsonValidator.boolean(config?.visible),
                    default: config?.default,
                    $default,
                    enum: this.validateConfigArrayChoices(JsonValidator.array(config?.enum)),
                    items,
                    ['x-deprecated']: JsonValidator.string(config?.['x-deprecated']),
                    ['x-prompt']: xPromptString ?? JsonValidator.string(xPromptObject?.message),
                }] as [string, SchematicOptionJsonSchema];

            }));

        return {
            properties,
            required: JsonValidator.array(config?.required, 'string'), 
        };

    }

    /**
     * Convert array of choices into strings for user input
     */
    private validateConfigArrayChoices(list: unknown[] | undefined): string[] | undefined {

        if (list === undefined) {
            return undefined;
        }

        return list
            .map((item) => JsonValidator.string(item) ?? JsonValidator.number(item) ?? JsonValidator.boolean(item))
            .map((item) => (item ?? '').toString())
            .filter((item) => item);

    }

    /**
     * Add global CLI options
     */
    private initGlobalOptions(): void {

        this.options.set('force', {
            type: 'boolean',
            default: false,
            description: `Forces overwriting of existing files.`,
        });

    }

    /** 
     * Initialize required options' names
     */
    private initRequiredOptions(config: Pick<SchematicJsonSchema, 'required' | 'properties'>): string[] {

        /* Set required options' names */
        return (config.required ?? [])
            /* Options which have a `$default` will be taken care by the CLI, so they are not required */
            .filter((name) => (config.properties.get(name)!.$default === undefined));

    }

    /**
     * Cache options choices
     */
    private initOptionsChoices(config: Pick<SchematicJsonSchema, 'properties'>, requiredOptionsNames: string[]): vscode.QuickPickItem[] {

        const choices: vscode.QuickPickItem[] = [];

        const filteredOptionsNames = Array.from(config.properties)
            /* Project is already managed by the extension */
            .filter(([name]) => (name !== 'project'))
            /* Do not keep options marked as not visible (internal options for the CLI) */
            .filter(([_, option]) => (option.visible !== false))
            /* Do not keep deprecated options */
            .filter(([_, option]) => (option['x-deprecated'] === undefined))
            /* Do not keep option already managed by first command line arg (name) */
            .filter(([_, option]) => !(option.$default && (option.$default.$source === 'argv') && (option.$default.index === 0)));

        for (const [label, option] of filteredOptionsNames) {

            let picked = false;

            /* UX: inform the user why some options are pre-select */
            let requiredOrSuggestedInfo = '';

            /* Do not pre-select options with defaults values, as the CLI will take care of them */
            if (option.$default === undefined) {

                /* Required options */
                if (requiredOptionsNames.includes(label)) {
                    picked = true;
                    requiredOrSuggestedInfo = `(required) `;
                }
                /* Suggested options (because they have a prompt) */
                else if (option['x-prompt'] !== undefined) {
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
        return [...sortedPickedChoices, ...sortedOptionalChoices];

    } 

}
