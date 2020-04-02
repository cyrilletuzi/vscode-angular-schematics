import * as vscode from 'vscode';
import * as path from 'path';

import { FileSystem, Watchers, Output } from '../utils';
import { WorkspaceConfig } from '../config';

import { Schema, SchemaConfig } from './schema';

interface PackageJsonSchema {
    /**
     * Schematics `package.json` should have a `schematics` property
     * with the relative path to `collection.json`
     */
    schematics?: string;
}

interface CollectionJsonSchema {
    schematics: {
        /** Key is the schema's name */
        [key: string]: {
            /** Relative path to `schema.json` */
            schema: string;
            description: string;
            /** Some schemas are internal for Angular CLI */
            hidden?: boolean;
            /** Some schemas extend another one */
            extends?: string;
        };
    };
}

export class Collection {

    private name: string;
    private fsPath!: string;
    private config!: CollectionJsonSchema;
    private schemasConfigs = new Map<string, SchemaConfig>();
    private schemas = new Map<string, Schema | undefined>();
    private schemasChoices: vscode.QuickPickItem[] = [];
    private watcher: vscode.FileSystemWatcher | undefined;

    constructor(
        name: string,
        private workspace: Omit<WorkspaceConfig, 'schematics'>,
    ) {
        this.name = name;
    }

    /**
     * Load the collection.
     * **Must** be called after each `new Collection()`
     * (delegated because `async` is not possible on a constructor).
     */
    async init(): Promise<void> {

        /* Can throw */
        this.fsPath = await this.getSchematicsFsPath(this.name);

        Output.logInfo(`"${this.name}" collection path detected: ${this.fsPath}`);

        const config = await FileSystem.parseJsonFile<CollectionJsonSchema>(this.fsPath);

        if (!config) {
            throw new Error(`"${this.name}" collection can not be loaded.`);
        }

        this.config = config;

        await this.setSchemas();

        /* Watcher must be set just once */
        if (!this.watcher) {

            this.watcher = Watchers.watchFile(this.fsPath, () => {
                this.init();
            });

        }

    }

    // TODO: use only by view, check it's still usefull
    /**
     * Get collection's name
     */
    getName(): string {
        return this.name;
    }

    // TODO: use only by view, check it's still usefull
    /**
     * Get all collection's schemas' names
     */
    getSchemasNames(): string[] {
        return Array.from(this.schemasConfigs.keys()).sort();
    }

    /**
     * Get a schema from cache, or load it.
     */
    async getSchema(name: string): Promise<Schema | undefined> {

        const fullName = this.getFullSchemaName(name);

        Output.logInfo(`Loading "${fullName}" schematics`);

        if (!this.schemasConfigs.has(fullName)) {
            Output.logError(`"${fullName}" schematics configuration not found.`);
            return undefined;
        }

        const schemaConfig = this.schemasConfigs.get(fullName)!;

        /* Schemas are not preloaded */
        if (!this.schemas.has(fullName)) {

            const schemaInstance = new Schema(schemaConfig, this.workspace);

            try {
                await schemaInstance.init();
                this.schemas.set(fullName, schemaInstance);
            } catch {
                Output.logError(`"${fullName}" schematics loading failed.`);
            }

        }
        
        return this.schemas.get(fullName);

    }

    /**
     * Get schemas choices
     */
    getSchemasChoices(): vscode.QuickPickItem[] {
        return this.schemasChoices;
    }

    /**
     * Get the collection filesystem path.
     */
    private async getSchematicsFsPath(name: string): Promise<string> {

        /* Local schematics */
        if (name.startsWith('.') && name.endsWith('.json')) {

            Output.logInfo(`"${name}" collection has been detected as a local user collection.`);

            return path.join(this.workspace.uri.fsPath, name);
    
        }

        /* Package schematics */
        else {

            Output.logInfo(`"${name}" collection has been detected as a library, looking in "node_modules".`);

            // TODO: handle custom node_modules folder
            /* `collection.json` path is defined in `package.json` */
            const packageJsonFsPath = path.join(this.workspace.uri.fsPath, 'node_modules', name, 'package.json');

            const packageJsonConfig = await FileSystem.parseJsonFile<PackageJsonSchema>(packageJsonFsPath);

            /* `package.json` should have a `schematics` property with relative path to `collection.json` */
            if (!packageJsonConfig?.schematics) {
                throw new Error(`${this.name} schematics collection can not be found or read.`);
            }

            return path.join(path.dirname(packageJsonFsPath), packageJsonConfig.schematics);

        }

    }

    /**
     * Get full schema name (eg. `@schematics/angular:component`)
     */
    private getFullSchemaName(name: string): string {
        return `${this.name}:${name}`;
    }

    /**
     * Set all schemas of the collection.
     */
    private async setSchemas(): Promise<void> {

        const allSchemas = Object.entries(this.config.schematics);

        Output.logInfo(`All schematics detected for "${this.name}" collection: ${allSchemas.map(([name]) => name).join(', ')}`);

        const schemas = allSchemas
            /* Remove internal schematics */
            .filter(([_, config]) => !config.hidden)
            /* Remove `ng-add` schematics are they are not relevant for the extension */
            .filter(([name]) => (name !== 'ng-add'));

        Output.logInfo(`Filtered schematics keeped for "${this.name}" collection: ${schemas.map(([name]) => name).join(', ')}`);

        for (const [name, config] of schemas) {

            const fsPath = path.join(path.basename(this.fsPath), config.schema);

            Output.logInfo(`"${this.name}:${name}" path detected: ${fsPath}`);

            // TODO: manage `extends`
            this.schemasConfigs.set(this.getFullSchemaName(name), {
                name,
                collectionName: this.name,
                description: config.description,
                fsPath,
            });

        }

        this.setSchemasChoices();

    }

    /**
     * Set schemas choice (for caching)
     */
    private setSchemasChoices(): void {

        this.schemasChoices = Array.from(this.schemasConfigs).map(([label, config]) => ({
            label,
            description: config.description,
        }));

    }

    // protected async initSchemasMap(collection: CollectionData): Promise<void> {

    //     for (let schemaName in collection.schematics) {

    //         if (collection.schematics.hasOwnProperty(schemaName)
    //             && !collection.schematics[schemaName].hidden
    //             && (schemaName !== 'ng-add')) {

    //             const schema = collection.schematics[schemaName];

    //             if (schema.extends) {

    //                 const [parentCollectionName, parentSchemaName] = schema.extends.split(':');

                    

    //             } else {

    //                 this.schemas.set(schemaName, collection.schematics[schemaName]);

    //             }

    //         }

    //     }

    // }

        // async createSchema(name: string): Promise<Schema> {

    //     let collection: Collection = this;

    //     const schema = this.schemas.get(name) as CollectionDataSchema;

    //     if (schema.extends) {

    //         const [parentCollectionName] = schema.extends.split(':');

    //         collection = new Collection(parentCollectionName, this.workspace);
    //         await collection.init();

    //     }

    //     return new Schema(name, collection);

    // }

}
