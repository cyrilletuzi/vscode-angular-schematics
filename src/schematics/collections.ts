import * as vscode from 'vscode';

import { defaultCollectionsNames } from '../defaults';
import { Output, Watchers } from '../utils';
import { WorkspaceConfig } from '../config';

import { Collection } from './collection';

export class Collections {

    /**
     * List of collections existing in the workspace
     */
    private collections = new Map<string, Collection | undefined>();
    private watcher: vscode.Disposable | undefined;

    constructor(private workspace: WorkspaceConfig) {}

    /**
     * Initialize collections.
     * **Must** be called after each `new Collections()`
     * (delegated because `async` is not possible on a constructor).
     */
    async init(): Promise<void> {

        await this.set();

        /* Watcher must be set just once */
        if (!this.watcher) {

            this.watcher = Watchers.watchCodePreferences(() => {
                this.set();
            });

        }

    }

    /**
     * Get all collections' names.
     */
    getNames(): string[] {
        return Array.from(this.collections.keys());
    }

    /**
     * Get collection from cache, or load it. Can throw.
     * @param name 
     */
    async get(name: string): Promise<Collection | undefined> {

        /* Not all collections are preloaded */
        if (!this.collections.get(name)) {

            const collection = await this.loadCollection(name);

            this.collections.set(name, collection);
            
        }
        
        return this.collections.get(name);

    }

    /**
     * Set collections names and preload official collections.
     */
    private async set(): Promise<void> {

        Output.logInfo(`Loading the list of collections.`);

        // TODO: check VS Code is verifying JSON schema
        /* Configuration key is configured in `package.json` */
        const userCollectionsNames = vscode.workspace.getConfiguration().get<string[]>(`ngschematics.schematics`, []);

        Output.logInfo(`User collections defined in Code preferences detected: ${userCollectionsNames.join(', ')}`);

        /* `Set` removes duplicate.
         * Default collections are set first as they are the most used */
        const collectionsNames = Array.from(new Set([...this.workspace.angularConfig.getDefaultCollections(), ...defaultCollectionsNames, ...userCollectionsNames]));

        Output.logInfo(`All collections detected: ${userCollectionsNames.join(', ')}`);
        
        /* `.filter()` is not possible here as there is an async operation */
        for (const name of collectionsNames) {

            let collection: Collection | undefined = undefined;

            /* Preload only defaut collections for performance */
            if (this.workspace.angularConfig.getDefaultCollections().includes(name)) {

                Output.logInfo(`Preloading some default collections.`);

                collection = await this.loadCollection(name);

            }

            this.collections.set(name, collection);

        }

    }

    /**
     * Load a collection
     */
    private async loadCollection(name: string): Promise<Collection | undefined> {

        Output.logInfo(`Loading "${name}" collection.`);

        const collectionInstance = new Collection(name, this.workspace);
                
        try {
            await collectionInstance.init();
        } catch {
            Output.logError(`Loading of "${name}" collection failed.`);
            return undefined;
        }

        return collectionInstance;

    }

}
