import * as vscode from 'vscode';

import { defaultSchematicsNames } from '../defaults';
import { Watchers } from '../utils/watchers';
import { WorkspaceExtended } from '../config';

import { Collection } from './collection';

export class Schematics {

    /**
     * List of collections existing in the workspace
     */
    private collections = new Map<string, Collection | undefined>();
    private watcher: vscode.Disposable | undefined;

    constructor(private workspace: Omit<WorkspaceExtended, 'schematics'>) {}

    /**
     * Initializes schematics collections.
     * **Must** be called after each `new Schematics()`
     * (delegated because `async` is not possible on a constructor).
     */
    async init(): Promise<void> {

        await this.setCollections();

        /* Watcher must be set just once */
        if (!this.watcher) {

            this.watcher = Watchers.watchCodePreferences(() => {
                this.setCollections();
            });

        }

    }

    /**
     * Get all collections' names.
     */
    getCollectionsNames(): string[] {
        return Array.from(this.collections.keys());
    }

    /**
     * Get collection from cache, or load it. Can throw.
     * @param name 
     */
    async getCollection(name: string): Promise<Collection | undefined> {

        /* Not all collections are preloaded */
        if (!this.collections.get(name)) {

            const collection = await this.loadCollection(name);

            this.collections.set(name, collection);
            
        }
        
        return this.collections.get(name);

    }

    /**
     * Set schematics collections names and preload official collections.
     */
    private async setCollections(): Promise<void> {

        // TODO: check VS Code is verifying JSON schema
        /* Configuration key is configured in `package.json` */
        const userSchematicsNames = vscode.workspace.getConfiguration().get<string[]>(`ngschematics.schematics`, []);

        /* `Set` removes duplicate.
         * Default collections are set first as they are the most used */
        const collectionsNames = Array.from(new Set([...this.workspace.angularConfig.getDefaultCollections(), ...defaultSchematicsNames, ...userSchematicsNames]));
        
        /* `.filter()` is not possible here as there is an async operation */
        for (const name of collectionsNames) {

            let collection: Collection | undefined = undefined;

            /* Preload only defaut schematics for performance */
            if (this.workspace.angularConfig.getDefaultCollections().includes(name)) {

                collection = await this.loadCollection(name);

            }

            this.collections.set(name, collection);

        }

    }

    /**
     * Load a collection
     */
    private async loadCollection(name: string): Promise<Collection | undefined> {

        const collectionInstance = new Collection(name, this.workspace);
                
        try {
            await collectionInstance.init();
        } catch {
            return undefined;
        }

        return collectionInstance;

    }

}
