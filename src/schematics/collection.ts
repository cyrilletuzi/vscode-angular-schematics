import * as vscode from 'vscode';
import * as path from 'path';

import { Schema, SchemaConfig } from './schema';
import { FileSystem } from '../utils/file-system';
import { AngularConfig } from '../config/angular';
import { TslintConfig } from '../config/tslint';

interface PackageJsonSchema {
    schematics?: string;
}

interface SchemaData {
    schema: string;
    description: string;
    hidden?: boolean;
    extends?: string;
}

interface CollectionData {
    // path: string;
    schematics: {
        [key: string]: SchemaData;
    };
}

export class Collection {

    private fsPath!: string;
    private config!: CollectionData;
    private schemasConfigs = new Map<string, SchemaConfig>();
    private schemas = new Map<string, Schema | undefined>();
    private schemasChoices: vscode.QuickPickItem[] = [];

    constructor(
        private name: string,
        private workspace: vscode.WorkspaceFolder,
        private angularConfig: AngularConfig,
        private tslintConfig: TslintConfig,
    ) {

    }

    async init({ silent = false } = {}): Promise<void> {

        const fsPath = await this.getSchematicsFsPath(this.name);

        if (!fsPath || !await FileSystem.isReadable(fsPath, this.workspace, silent)) {
            throw new Error(`${this.name} schematics collection can not be found or read.`);
        }

        const config = await FileSystem.parseJsonFile<CollectionData>(this.fsPath);

        if (!config) {
            throw new Error(`${this.name} schematics collection can not be parsed.`);
        }

        this.config = config;

        await this.setSchemas();

    }

    getName(): string {
        return this.name;
    }

    getSchemasNames(): string[] {
        return Array.from(this.schemasConfigs.keys()).sort();
    }

    // TODO: watcher on collection
    async getSchema(name: string): Promise<Schema | undefined> {

        const fullName = this.getFullSchemaName(name);

        if (!this.schemasConfigs.has(fullName)) {
            return undefined;
        }

        const schemaConfig = this.schemasConfigs.get(fullName)!;

        /* Schemas are not preloaded */
        if (!this.schemas.has(fullName)) {

            const schemaInstance = new Schema(schemaConfig, this.workspace, this.angularConfig, this.tslintConfig);

            try {
                await schemaInstance.init();
                this.schemas.set(fullName, schemaInstance);
            } catch {}

        }
        
        return this.schemas.get(fullName);

    }

    getSchemasChoices(): vscode.QuickPickItem[] {
        return this.schemasChoices;
    }

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

    private async setSchemas(): Promise<void> {

        const schemas = Object.entries(this.config.schematics)
            /* Remove internal schematics */
            .filter(([_, schemaConfig]) => !schemaConfig.hidden)
            /* Remove `ng-add` schematics are they are not relevant for the extension */
            .filter(([schemaName]) => (schemaName !== 'ng-add'));

        for (const [schemaName, schemaConfig] of schemas) {

            const schemaFsPath = path.join(path.basename(this.fsPath), schemaConfig.schema);

            if (await FileSystem.isReadable(schemaFsPath)) {

                // TODO: manage `extends`
                this.schemasConfigs.set(this.getFullSchemaName(schemaName), {
                    name: schemaName,
                    collectionName: this.name,
                    description: schemaConfig.description,
                    fsPath: path.join(path.basename(this.fsPath), schemaConfig.schema),
                });

            }

        }

        this.setSchemasChoices();

    }

    private setSchemasChoices(): void {

        this.schemasChoices = Array.from(this.schemasConfigs).map(([label, config]) => ({
            label,
            description: config.description,
        }));

    }

    private getFullSchemaName(name: string): string {
        return `${this.name}:${name}`;
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

    private async getSchematicsFsPath(name: string): Promise<string | undefined> {

        /* Local schematics */
        if (name.startsWith('.') && name.endsWith('.json')) {
            return path.join(this.workspace.uri.fsPath, name);
        }
        
        /* Package schematics */

        // TODO: handle custom node_modules folder
        const packageJsonFsPath = path.join(this.workspace.uri.fsPath, 'node_modules', name, 'package.json');

        const packageJsonConfig = await FileSystem.parseJsonFile<PackageJsonSchema>(packageJsonFsPath, this.workspace);

        if (!packageJsonConfig?.schematics) {
            return undefined;
        }

        return path.join(path.dirname(packageJsonFsPath), packageJsonConfig.schematics);

    }

}
