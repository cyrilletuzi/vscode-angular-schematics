import * as vscode from 'vscode';

import { Utils } from './utils';
import { Schema } from './shema';

interface PackageJSON {
    schematics?: string;
}

export interface CollectionDataSchema {
    schema: string;
    description: string;
    hidden?: boolean;
}

export interface CollectionData {
    schematics: {
        [key: string]: CollectionDataSchema;
    };
}

export class Collection {

    name: string;
    path = '';
    schemas = new Map<string, CollectionDataSchema>();
    get schemasNames(): string[] {
        return Array.from(this.schemas.keys()).sort();
    }
    static cache = new Map<string, CollectionData>();

    constructor(name: string) {
        this.name = name;
    }

    async load(cwd: string): Promise<boolean> {

        let collection: CollectionData | null = null;

        const cachedCollection = Collection.cache.get(this.name);

        if (cachedCollection) {

            collection = cachedCollection;

        } else {

            const collectionPackage = await Utils.getSchemaFromNodeModules<PackageJSON>(cwd, this.name, 'package.json');

            if (!collectionPackage || !collectionPackage.schematics) {
                return false;
            }

            this.path = Utils.pathTrimRelative(collectionPackage.schematics);

            collection = await Utils.getSchemaFromNodeModules<CollectionData>(cwd, this.name, this.path);

        }

        if (collection) {
            this.initSchemasMap(collection);
            return true;
        }
        
        return false;

    }

    createSchema(name: string): Schema {

        return new Schema(name, this);

    }

    async askSchema(): Promise<string | null> {

        const choices: vscode.QuickPickItem[] = this.schemasNames
            .map((schemaName) => ({
                label: schemaName,
                description: (this.schemas.get(schemaName) as CollectionDataSchema).description
            }));

        const choice = await vscode.window.showQuickPick(choices, { placeHolder: `What do you want to generate?` });

        return choice ? choice.label : null;

    }

    protected initSchemasMap(collection: CollectionData): void {

        for (let schemaName in collection.schematics) {

            if (collection.schematics.hasOwnProperty(schemaName)
                && !collection.schematics[schemaName].hidden
                && (schemaName !== 'ng-add')) {

                this.schemas.set(schemaName, collection.schematics[schemaName]);

            }

        }

    }

}
