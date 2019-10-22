import * as path from 'path';
import * as vscode from 'vscode';
import { Utils } from './utils';
import { AngularConfig } from './angular-config';
import { UserPreferences } from './preferences';
import { defaultSchematics } from './defaults';


export class Schematics {

    static commonCollections: string[] = defaultSchematics;
    static collections: Set<string> = new Set();

    static async load(cwd: string) {

        const collectionsNames: string[] = [...this.commonCollections];

        const userSchematics = UserPreferences.getSchematics();

        collectionsNames.push(...userSchematics);

        const existingCollections: string[] = [];

        for (let collectionName of collectionsNames) {

            if (this.collections.has(collectionName)) {

                existingCollections.push(collectionName);

            } else {

                let collectionExists = false;

                if (Utils.isSchemaLocal(collectionName)) {
                    collectionExists = await Utils.existsAsync(path.join(cwd, collectionName));
                } else {
                    collectionExists = await Utils.existsAsync(Utils.getNodeModulesPath(cwd, collectionName));
                }

                if (collectionExists) {
                    existingCollections.push(collectionName);
                }

            }

        }

        this.collections = new Set([AngularConfig.defaultCollection, AngularConfig.cliCollection, ...existingCollections]);

    }

    static async askSchematic(): Promise<string | undefined> {

        if  (this.collections.size === 1) {

            return AngularConfig.cliCollection;

        } else {

            return vscode.window.showQuickPick(Array.from(this.collections), {
                placeHolder: `From which schematics collection?`,
                ignoreFocusOut: true,
            });

        }

    }

}
