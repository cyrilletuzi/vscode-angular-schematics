import * as vscode from 'vscode';
import * as path from 'path';

import { defaultCollectionsNames, defaultAngularCollection } from '../defaults';
import { Output, Watchers, FileSystem } from '../utils';

import { Collection } from './collection';
import { Shortcuts } from './shortcuts';

export class Collections {

    /**
     * List of shortchuts
     */
    shortcuts!: Shortcuts;
    /**
     * List of collections existing in the workspace
     */
    private collections = new Map<string, Collection | undefined>();
    private watcher: vscode.Disposable | undefined;

    constructor(private workspaceFsPath: string) {}

    /**
     * Initialize collections.
     * **Must** be called after each `new Collections()`
     * (delegated because `async` is not possible on a constructor).
     */
    async init(userDefaultCollections: string[]): Promise<void> {

        await this.set(userDefaultCollections);

        this.setShortcuts();

        /* Watcher must be set just once */
        if (!this.watcher) {

            this.watcher = Watchers.watchCodePreferences(() => {
                this.init(userDefaultCollections);
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
    private async set(userDefaultCollections: string[]): Promise<void> {

        Output.logInfo(`Loading the list of collections.`);

        /* Configuration key is configured in `package.json` */
        const userCollectionsNames = vscode.workspace.getConfiguration().get<string[]>(`ngschematics.schematics`, []);

        Output.logInfo(`${userCollectionsNames.length} user collection(s) detected in Code preferences${userCollectionsNames.length > 0 ? `: ${userCollectionsNames.join(', ')}` : ''}`);

        /* `Set` removes duplicate.
         * Default collections are set first as they are the most used */
        const collectionsNames = Array.from(new Set([...userDefaultCollections, ...defaultCollectionsNames, ...userCollectionsNames]));

        const existingCollectionsNames = [];

        /* Check the collections exist.
         * `.filter()` is not possible here as there is an async operation */
        for (const name of collectionsNames) {
            if (await this.isCollectionExisting(name)) {
                existingCollectionsNames.push(name);
            }
        }

        if (existingCollectionsNames.length > 0) {
            Output.logInfo(`${existingCollectionsNames.length} installed collection(s) detected: ${existingCollectionsNames.join(', ')}`);
        } else {
            Output.logWarning(`No collection found. "${defaultAngularCollection}" should be present in a correctly installed Angular CLI project.`);
        }
        
        /* `.filter()` is not possible here as there is an async operation */
        for (const name of existingCollectionsNames) {

            let collection: Collection | undefined = undefined;

            /* Preload only defaut collections for performance */
            if (userDefaultCollections.includes(name)) {

                Output.logInfo(`Preloading default collection(s).`);

                collection = await this.loadCollection(name);

            }

            this.collections.set(name, collection);

        }

    }

    /**
     * Set shortcuts for component and module types
     */
    private setShortcuts(): void {

        this.shortcuts = new Shortcuts(this.getNames());

    }

    /**
     * Check if a collection exists
     */
    private async isCollectionExisting(name: string): Promise<boolean> {

        let fsPath = '';

        /* Local schematics */
        if (name.startsWith('.') && name.endsWith('.json')) {

            fsPath = path.join(this.workspaceFsPath, name);

        }
        /* Package schematics */
        else {
            
            fsPath = path.join(this.workspaceFsPath, 'node_modules', name);

        }

        /* It's normal that not all collections exist, so we want to be silent here */
        return await FileSystem.isReadable(fsPath, { silent: true });

    }

    /**
     * Load a collection
     */
    private async loadCollection(name: string): Promise<Collection | undefined> {

        Output.logInfo(`Loading "${name}" collection.`);

        const collectionInstance = new Collection(name);
                
        try {
            await collectionInstance.init(this.workspaceFsPath);
        } catch {
            Output.logError(`Loading of "${name}" collection failed.`);
            return undefined;
        }

        return collectionInstance;

    }

}
