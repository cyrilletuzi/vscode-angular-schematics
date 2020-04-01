import * as vscode from 'vscode';

import { AngularConfig } from '../config/angular';
import { Watchers } from '../utils/watchers';
import { defaultSchematicsNames } from '../defaults';
import { Collection } from './collection';
import { TslintConfig } from '../config/tslint';

export class Schematics {

    private collections = new Map<string, Collection | undefined>();

    constructor(
        private workspace: vscode.WorkspaceFolder,
        private angularConfig: AngularConfig,
        private tslintConfig: TslintConfig,
    ) {}

    async init(): Promise<void> {

        await this.setConfig();

        Watchers.watchCodePreferences(() => {
            this.setConfig();
        });

    }

    getCollectionsNames(): string[] {
        return Array.from(this.collections.keys());
    }

    // TODO: watcher on collection
    async getCollection(name: string): Promise<Collection | undefined> {

        /* Not all collections are preloaded */
        if (!this.collections.has(name)) {
            const collectionInstance = new Collection(name, this.workspace, this.angularConfig, this.tslintConfig);
            try {
                await collectionInstance.init();
                this.collections.set(name, collectionInstance);
            } catch {}
            
        }
        
        return this.collections.get(name);

    }

    private async setConfig(): Promise<void> {

        await this.setCollections();

    }

    private async setCollections(): Promise<void> {

        /* Configuration key is configured in `package.json` */
        const userSchematicsNames = vscode.workspace.getConfiguration().get<string[]>(`ngschematics.schematics`, []);

        /* `Set` removes duplicate.
         * Default collections are set first as they are the most used */
        const collectionsNames = Array.from(new Set([...this.angularConfig.getDefaultCollections(), ...defaultSchematicsNames, ...userSchematicsNames]));
        
        /* `.filter()` is not possible here as there is an async operation */
        for (const name of collectionsNames) {

            let collection: Collection | undefined = undefined;

            /* Preload only defaut schematics for performance */
            if (this.angularConfig.getDefaultCollections().includes(name)) {

                const collectionInstance = new Collection(name, this.workspace, this.angularConfig, this.tslintConfig);
                
                try {
                    await collectionInstance.init({ silent: true });
                    collection = collectionInstance;
                } catch {}

            }

            this.collections.set(name, collection);

        }

    }

}
