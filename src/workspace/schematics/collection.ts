import * as vscode from 'vscode';
import * as path from 'path';

import { FileSystem, Watchers, Output } from '../../utils';

import { Schematic, SchematicConfig } from './schematic';
import { PackageJsonSchema, CollectionJsonSchema } from './json-schemas';

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
    async init(workspaceFolderFsPath: string): Promise<void> {

        /* Can throw */
        this.fsPath = await this.getFsPath(workspaceFolderFsPath, this.name);

        const config = await FileSystem.parseJsonFile<CollectionJsonSchema>(this.fsPath);

        if (!config) {
            throw new Error(`"${this.name}" collection can not be loaded.`);
        }

        this.config = config;

        await this.setSchematics(workspaceFolderFsPath);

        Watchers.watchFile(this.fsPath, () => {
            this.init(workspaceFolderFsPath);
        });

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
     * Get the collection filesystem path.
     */
    private async getFsPath(workspaceFolderFsPath: string, name: string): Promise<string> {

        /* Local schematics */
        if (name.startsWith('.') && name.endsWith('.json')) {

            return path.join(workspaceFolderFsPath, name);
    
        }

        /* Package schematics */
        else {

            /* `collection.json` path is defined in `package.json` */
            const packageJsonFsPath = path.join(workspaceFolderFsPath, 'node_modules', name, 'package.json');

            const packageJsonConfig = await FileSystem.parseJsonFile<PackageJsonSchema>(packageJsonFsPath);

            /* `package.json` should have a `schematics` property with relative path to `collection.json` */
            if (!packageJsonConfig?.schematics) {
                throw new Error(`"${this.name}" collection can not be found or read.`);
            }

            return path.join(path.dirname(packageJsonFsPath), packageJsonConfig.schematics);

        }

    }

    /**
     * Get full schematic name (eg. `@schematics/angular:component`)
     */
    private getFullSchematicName(name: string): string {
        return `${this.name}:${name}`;
    }

    /**
     * Set all schematics' configuration of the collection.
     */
    private async setSchematics(workspaceFolderFsPath: string): Promise<void> {

        /* Start from scratch as the function can be called again via watcher */
        this.schematics.clear();
        this.schematicsChoices = [];

        const allSchematics = Object.entries(this.config.schematics);

        Output.logInfo(`${allSchematics.length} schematic(s) detected for "${this.name}" collection: ${allSchematics.map(([name]) => name).join(', ')}`);

        const schematics = allSchematics
            /* Remove internal schematics */
            .filter(([_, config]) => !config.hidden)
            /* Remove `ng-add` schematics are they are not relevant for the extension */
            .filter(([name]) => (name !== 'ng-add'));

        Output.logInfo(`${schematics.length} filtered schematic(s) keeped for "${this.name}" collection: ${schematics.map(([name]) => name).join(', ')}`);

        for (const [name, config] of schematics) {

            const schematicFullName = this.getFullSchematicName(name);

            Output.logInfo(`Loading "${schematicFullName}" schematic`);

            let schematicConfig: SchematicConfig | undefined = undefined;

            /* Some collection extends another one */
            if (config.extends) {

                const [collectionName] = config.extends.split(':');

                try {

                    /* Can fail */
                    const collectionFsPath = await this.getFsPath(workspaceFolderFsPath, collectionName);

                    schematicConfig = {
                        name,
                        collectionName: this.name,
                        description: `Schematic herited from "${collectionName}"`,
                        collectionFsPath,
                    };

                } catch {
                    Output.logWarning(`"${this.name}" collection wants to inherit "${name}" schematic from "${config.extends}" collection, but the latest cannot be found.`);
                }

            } else {

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
