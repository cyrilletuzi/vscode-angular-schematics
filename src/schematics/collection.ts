import * as vscode from 'vscode';

import { Utils } from './utils';
import { Schema } from './shema';

interface PackageJSON {
    schematics?: string;
}

export interface CollectionData {
    schematics: {
        [key: string]: {
            schema: string;
            description: string;
            hidden?: boolean;
        };
    };
}

export class Collection {

    name: string;
    path = '';
    data: CollectionData | null = null;
    static cache = new Map<string, CollectionData>();

    constructor(name: string) {
        this.name = name;
    }

    async load(): Promise<void> {

        const cachedCollection = Collection.cache.get(this.name);

        if (cachedCollection) {

            this.data = cachedCollection;

        } else {

            const collectionPackage = await Utils.getSchemaFromNodeModules<PackageJSON>(this.name, 'package.json');

            if (!collectionPackage || !collectionPackage.schematics) {
                return;
            }

            this.path = Utils.pathTrimRelative(collectionPackage.schematics);

            this.data = await Utils.getSchemaFromNodeModules<CollectionData>(this.name, this.path);

        }

    }

    createSchema(name: string) {

        return new Schema(name, this);

    }

    getSchemasNames(): string[] {

        if (!this.data) {
            return [];
        }

        return Object.keys(this.data.schematics)
            .filter((schema) => !(this.data as CollectionData).schematics[schema].hidden && (schema !== 'ng-add'))
            .sort();
    
    }

    async askSchema(schemasNames?: string[]) {

        /** @todo Localization */
        return vscode.window.showQuickPick(schemasNames || this.getSchemasNames(), { placeHolder: `What do you want to generate?` });

    }

}
