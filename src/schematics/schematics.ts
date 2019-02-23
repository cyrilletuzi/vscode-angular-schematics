import * as path from 'path';
import * as vscode from 'vscode';
import { Utils } from './utils';
import { AngularConfig } from './angular-config';


interface SettingSchematics {
    schematics?: string[];
}

export class Schematics {

    static defaultCollection = '';
    static commonCollections: string[] = [
        '@angular/material',
        '@ionic/angular-toolkit',
        '@ngrx/schematics',
        '@nrwl/schematics',
        '@nstudio/schematics',
        './schematics/collection.json'
    ];
    static collections: Set<string> = new Set();

    static async load(cwd: string) {

        const collectionsNames: string[] = [...this.commonCollections];

        const userConfiguration: SettingSchematics | undefined = vscode.workspace.getConfiguration().get('ngschematics');

        if (userConfiguration && userConfiguration.schematics) {

            collectionsNames.push(...userConfiguration.schematics);

        }

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

        if (!this.defaultCollection) {

            this.defaultCollection = AngularConfig.defaultCollection;

        }

        this.collections = new Set([this.defaultCollection, AngularConfig.cliCollection, ...existingCollections]);

    }

    static async askSchematic(): Promise<string | undefined> {

        if  (this.collections.size === 1) {

            return AngularConfig.cliCollection;

        } else {

            return vscode.window.showQuickPick(Array.from(this.collections), { placeHolder: `From which schematics collection?` });

        }

    }

}
