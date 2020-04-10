import * as vscode from 'vscode';
import * as path from 'path';

import { FileSystem, Output, JsonValidator } from '../../utils';

import { Schematic, SchematicConfig } from './schematic';
import { CollectionJsonSchema, CollectionSchematicJsonSchema } from './json-schemas';
import { findCollectionFsPath } from './find-collection';

export class Collection {

    schematicsChoices: vscode.QuickPickItem[] = [];
    private name: string;
    private fsPath!: string;
    private config!: CollectionJsonSchema;
    private schematics = new Map<string, Schematic | undefined>();

    constructor(name: string) {
        this.name = name;
    }

    /**
     * Load the collection.
     * **Must** be called after each `new Collection()`
     * (delegated because `async` is not possible on a constructor).
     */
    async init(workspaceFolder: vscode.WorkspaceFolder, collectionFsPath: string): Promise<vscode.FileSystemWatcher | undefined> {

        this.fsPath = collectionFsPath;

        this.config = this.validateConfig(await FileSystem.parseJsonFile(collectionFsPath));

        await this.setSchematics(workspaceFolder);

        /* Only watch local schematics */
        return !collectionFsPath.includes('node_modules') ? vscode.workspace.createFileSystemWatcher(collectionFsPath) : undefined;

    }

    /**
     * Get collection's name
     */
    getName(): string {
        return this.name;
    }

    /**
     * Get all collection's schematics' names
     */
    getSchematicsNames(): string[] {
        return Array.from(this.schematics.keys()).sort();
    }

    /**
     * Get a schematic from cache, or load it.
     */
    getSchematic(name: string): Schematic | undefined {
        
        return this.schematics.get(name);

    }

    /**
     * Get full schematic name (eg. `@schematics/angular:component`)
     */
    private getFullSchematicName(name: string): string {
        return `${this.name}:${name}`;
    }

    /**
     * Validate collection.json
     */
    private validateConfig(config: unknown): CollectionJsonSchema {

        const schematics = new Map(Object.entries(JsonValidator.object(JsonValidator.object(config)?.schematics) ?? {})
            .map(([name, rawConfig]) => {

                const config = JsonValidator.object(rawConfig);

                return [name, {
                    schema: JsonValidator.string(config?.schema),
                    description: JsonValidator.string(config?.description),
                    hidden: JsonValidator.boolean(config?.hidden),
                    extends: JsonValidator.string(config?.extends),
                }] as [string, CollectionSchematicJsonSchema];

            })
            .filter(([name, config]) => {
                if (!config.schema && !config?.extends) {
                    Output.logWarning(`"${this.name}:${name}" schematic does not have a "schema" string property, so it is dropped.`);
                    return false;
                }
                return true;
            }));

        if (schematics.size === 0) {
            throw new Error(`No schematic found for "${this.name}" collection, so it is dropped.`);
        }

        return {
            schematics,
        };

    }

    /**
     * Set all schematics' configuration of the collection.
     */
    private async setSchematics(workspaceFolder: vscode.WorkspaceFolder): Promise<void> {

        /* Start from scratch as the function can be called again via watcher */
        this.schematics.clear();
        this.schematicsChoices = [];

        const allSchematics = Array.from(this.config.schematics);

        Output.logInfo(`${allSchematics.length} schematic(s) detected for "${this.name}" collection: ${allSchematics.map(([name]) => name).join(', ')}`);

        const schematics = allSchematics
            /* Remove internal schematics */
            .filter(([_, config]) => !config.hidden)
            /* Remove `ng-add` schematics are they are not relevant for the extension */
            .filter(([name]) => (name !== 'ng-add'));

        if (schematics.length === 0) {
            throw new Error(`No public generation schematic found for "${this.name}" collection, so it is dropped.`);
        }

        Output.logInfo(`${schematics.length} filtered schematic(s) keeped for "${this.name}" collection: ${schematics.map(([name]) => name).join(', ')}`);

        for (const [name, config] of schematics) {

            const schematicFullName = this.getFullSchematicName(name);

            Output.logInfo(`Loading "${schematicFullName}" schematic`);

            let schematicConfig: SchematicConfig | undefined = undefined;

            /* Some collection extends another one */
            if (config.extends) {

                const [collectionName] = config.extends.split(':');

                const collectionFsPath = await findCollectionFsPath(workspaceFolder, collectionName);

                if (!collectionFsPath) {
                    Output.logWarning(`"${this.name}" collection wants to inherit "${name}" schematic from "${config.extends}" collection, but the latest cannot be found.`);
                } else {

                    schematicConfig = {
                        name,
                        collectionName: this.name,
                        description: `Schematic herited from "${collectionName}"`,
                        collectionFsPath,
                    };

                }

            } else if (config.schema) {

                const fsPath = path.join(path.dirname(this.fsPath), config.schema);

                schematicConfig = {
                    name,
                    collectionName: this.name,
                    description: config.description,
                    fsPath,
                };

            }

            if (schematicConfig) {

                const schematicInstance = new Schematic(schematicConfig);

                try {
                    await schematicInstance.init();
                    this.schematics.set(name, schematicInstance);
                    this.setSchematicChoice(schematicConfig);
                } catch {
                    Output.logError(`"${schematicFullName}" schematic loading failed.`);
                }

            }

        }

    }

    /**
     * Add schematic's choice (for caching)
     */
    private setSchematicChoice(schematicConfig: SchematicConfig): void {

        this.schematicsChoices.push({
            label: schematicConfig.name,
            description: schematicConfig.description,
        });

    }

}
