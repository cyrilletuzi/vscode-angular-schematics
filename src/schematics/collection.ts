import * as vscode from 'vscode';
import * as path from 'path';

import { FileSystem, Watchers, Output } from '../utils';
import { WorkspaceConfig } from '../config';

import { Schematic, SchematicConfig } from './schematic';

interface PackageJsonSchema {
    /**
     * `package.json` should have a `schematics` property with the relative path to `collection.json`
     */
    schematics?: string;
}

interface CollectionJsonSchema {
    schematics: {
        /** Key is the schematic's name */
        [key: string]: {
            /** Relative path to `schema.json` */
            schema: string;
            description: string;
            /** Some schematics are internal for Angular CLI */
            hidden?: boolean;
            /** Some schematics extend another one */
            extends?: string;
        };
    };
}

export class Collection {

    private name: string;
    private fsPath!: string;
    private config!: CollectionJsonSchema;
    private schematicsConfigs = new Map<string, SchematicConfig>();
    private schematics = new Map<string, Schematic | undefined>();
    private schematicsChoices: vscode.QuickPickItem[] = [];
    private watcher: vscode.FileSystemWatcher | undefined;

    constructor(
        name: string,
        private workspace: WorkspaceConfig,
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
        this.fsPath = await this.getFsPath(this.name);

        Output.logInfo(`"${this.name}" collection path detected: ${this.fsPath}`);

        const config = await FileSystem.parseJsonFile<CollectionJsonSchema>(this.fsPath);

        if (!config) {
            throw new Error(`"${this.name}" collection can not be loaded.`);
        }

        this.config = config;

        await this.setSchematicsConfigs();

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
     * Get all collection's schematics' names
     */
    getSchematicsNames(): string[] {
        return Array.from(this.schematicsConfigs.keys()).sort();
    }

    /**
     * Get a schematic from cache, or load it.
     */
    async getSchematic(name: string): Promise<Schematic | undefined> {

        const fullName = this.getFullSchematicName(name);

        Output.logInfo(`Loading "${fullName}" schematic`);

        if (!this.schematicsConfigs.has(fullName)) {
            Output.logError(`"${fullName}" schematic configuration not found.`);
            return undefined;
        }

        const schematicConfig = this.schematicsConfigs.get(fullName)!;

        /* Schematics are not preloaded */
        if (!this.schematics.has(fullName)) {

            const schematicInstance = new Schematic(schematicConfig, this.workspace);

            try {
                await schematicInstance.init();
                this.schematics.set(fullName, schematicInstance);
            } catch {
                Output.logError(`"${fullName}" schematic loading failed.`);
            }

        }
        
        return this.schematics.get(fullName);

    }

    /**
     * Get schematics choices
     */
    getSchematicsChoices(): vscode.QuickPickItem[] {
        return this.schematicsChoices;
    }

    /**
     * Get the collection filesystem path.
     */
    private async getFsPath(name: string): Promise<string> {

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
    private async setSchematicsConfigs(): Promise<void> {

        const allSchematics = Object.entries(this.config.schematics);

        Output.logInfo(`All schematics detected for "${this.name}" collection: ${allSchematics.map(([name]) => name).join(', ')}`);

        const schematics = allSchematics
            /* Remove internal schematics */
            .filter(([_, config]) => !config.hidden)
            /* Remove `ng-add` schematics are they are not relevant for the extension */
            .filter(([name]) => (name !== 'ng-add'));

        Output.logInfo(`Filtered schematics keeped for "${this.name}" collection: ${schematics.map(([name]) => name).join(', ')}`);

        for (const [name, config] of schematics) {

            const fsPath = path.join(path.basename(this.fsPath), config.schema);

            Output.logInfo(`"${this.name}:${name}" path detected: ${fsPath}`);

            // TODO: manage `extends`
            this.schematicsConfigs.set(this.getFullSchematicName(name), {
                name,
                collectionName: this.name,
                description: config.description,
                fsPath,
            });

        }

        this.setSchematicsChoices();

    }

    /**
     * Set schematics choice (for caching)
     */
    private setSchematicsChoices(): void {

        this.schematicsChoices = Array.from(this.schematicsConfigs).map(([label, config]) => ({
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
