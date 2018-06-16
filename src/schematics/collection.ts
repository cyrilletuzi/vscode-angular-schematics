import * as vscode from 'vscode';
import * as path from 'path';

import { Utils } from './utils';
import { Schema } from './shema';

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
    data: CollectionData | null = null;

    constructor(name: string) {
        this.name = name;
    }

    async load(): Promise<void> {

        if (!vscode.workspace.rootPath) {
            return;
        }

        const collectionPath = path.join(vscode.workspace.rootPath, 'node_modules', this.name, 'collection.json');

        this.data = await Utils.parseJSONFile<CollectionData>(collectionPath);

    }

    createSchema(name: string) {

        return new Schema(name, this);

    }

    getSchemasNames(): string[] {

        if (!this.data) {
            return [];
        }

        return Object.keys(this.data.schematics)
            .filter((schema) => !(this.data as CollectionData).schematics[schema].hidden);
    
    }

    async askSchema(schemasNames?: string[]) {

        /** @todo Localization */
        return vscode.window.showQuickPick(schemasNames || this.getSchemasNames(), { placeHolder: `What do you want to generate?` });

    }

}
