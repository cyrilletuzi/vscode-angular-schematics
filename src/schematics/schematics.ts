import * as path from 'path';
import * as vscode from 'vscode';

import { Utils } from './utils';
import { AngularConfig } from './config-angular';
import { Preferences } from './preferences';


export class Schematics {

    static collections: Set<string> = new Set();

    static async load(workspace: vscode.WorkspaceFolder): Promise<void> {

        const collectionsNames: string[] = Preferences.getSchematics();

        const existingCollections: string[] = [];

        for (let collectionName of collectionsNames) {

            if (this.collections.has(collectionName)) {

                existingCollections.push(collectionName);

            } else {

                let collectionExists = false;

                if (Utils.isSchemaLocal(collectionName)) {
                    collectionExists = await Utils.existsAsync(path.join(workspace.uri.fsPath, collectionName));
                } else {
                    collectionExists = await Utils.existsAsync(Utils.getNodeModulesPath(workspace.uri.fsPath, collectionName));
                }

                if (collectionExists) {
                    existingCollections.push(collectionName);
                }

            }

        }

        // TODO: reintroduce defaultCollection
        this.collections = new Set([/* AngularConfig.defaultCollection, */AngularConfig.defaultAngularCollection, ...existingCollections]);

    }

    static async askSchematic(): Promise<string | undefined> {

        if  (this.collections.size === 1) {

            return AngularConfig.defaultAngularCollection;

        } else {

            return vscode.window.showQuickPick(Array.from(this.collections), {
                placeHolder: `From which schematics collection?`,
                ignoreFocusOut: true,
            });

        }

    }

}
