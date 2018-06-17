import * as vscode from 'vscode';

import { Utils } from './utils';

interface SettingSchematics {
    schematics?: string[];
}

export class Schematics {

    static defaultCollection = '@schematics/angular';
    commonCollections: string[] = [
        '@angular/material',
        '@ngrx/schematics'
    ];
    collections: Set<string> = new Set([Schematics.defaultCollection]);

    constructor() {

        this.commonCollections.filter(() => {});

    }

    async load() {

        const collectionsNames: string[] = [...this.commonCollections];

        const userConfiguration: SettingSchematics | undefined = vscode.workspace.getConfiguration().get('ngschematics');

        if (userConfiguration && userConfiguration.schematics) {

            collectionsNames.push(...userConfiguration.schematics);

        }

        for (let collectionName of collectionsNames) {

            const collectionExists = await Utils.existsAsync(Utils.getNodeModulesPath(collectionName));

            if (collectionExists) {
                this.collections.add(collectionName);
            }

        }

    }

    async askSchematic(): Promise<string | undefined> {

        if  (this.collections.size === 1) {

            return Schematics.defaultCollection;

        } else {

            return vscode.window.showQuickPick(Array.from(this.collections), { placeHolder: `From which shematics collection?` });

        }

    }

}