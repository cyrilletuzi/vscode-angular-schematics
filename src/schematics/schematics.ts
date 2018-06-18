import * as vscode from 'vscode';

import { Utils } from './utils';

interface SettingSchematics {
    schematics?: string[];
}

export class Schematics {

    static defaultCollection = '@schematics/angular';
    static commonCollections: string[] = [
        '@angular/material',
        '@ngrx/schematics'
    ];
    static collections: Set<string> = new Set([Schematics.defaultCollection]);

    static async load() {

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

                const collectionExists = await Utils.existsAsync(Utils.getNodeModulesPath(collectionName));

                if (collectionExists) {
                    existingCollections.push(collectionName);
                }

            }

        }

        this.collections = new Set([this.defaultCollection, ...existingCollections]);

    }

    static async askSchematic(): Promise<string | undefined> {

        if  (this.collections.size === 1) {

            return this.defaultCollection;

        } else {

            return vscode.window.showQuickPick(Array.from(this.collections), { placeHolder: `From which shematics collection?` });

        }

    }

}