import * as path from 'path';
import * as vscode from 'vscode';
import { Utils } from './utils';


interface SettingSchematics {
    schematics?: string[];
}

interface AngularConfig {
    cli?: {
        defaultCollection?: string;
        schematics?: {
            defaultCollection?: string;
        };
    };
}

export class Schematics {

    static angularCollection = '@schematics/angular';
    static defaultCollection = '';
    static commonCollections: string[] = [
        '@angular/material',
        '@ionic/angular-toolkit',
        '@ngrx/schematics',
        '@nrwl/schematics',
        '@nstudio/schematics',
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

            this.defaultCollection = await this.getDefaultCollection(cwd);

        }

        this.collections = new Set([this.defaultCollection, this.angularCollection, ...existingCollections]);

    }

    static async askSchematic(): Promise<string | undefined> {

        if  (this.collections.size === 1) {

            return this.angularCollection;

        } else {

            return vscode.window.showQuickPick(Array.from(this.collections), { placeHolder: `From which schematics collection?` });

        }

    }

    private static async getDefaultCollection(cwd: string): Promise<string> {

        const angularConfigPath = path.join(cwd, 'angular.json');

        if (await Utils.existsAsync(angularConfigPath)) {

            const angularConfig = await Utils.parseJSONFile(angularConfigPath) as AngularConfig;

            if (angularConfig.cli) {

                if (angularConfig.cli.defaultCollection) {
                    return angularConfig.cli.defaultCollection;
                } else if (angularConfig.cli.schematics && angularConfig.cli.schematics.defaultCollection) {
                    return angularConfig.cli.schematics.defaultCollection;
                }

            }

        }

        return this.angularCollection;

    }

}
