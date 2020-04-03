import * as vscode from 'vscode';
import * as path from 'path';

import { defaultCollectionsNames, defaultAngularCollection } from '../defaults';
import { Output, Watchers, FileSystem } from '../utils';

import { Collection } from './collection';
import { Shortcuts } from './shortcuts';

export class Collections {

    /**
     * List of collections existing in the workspace
     */
    collections = new Map<string, Collection>();
    /**
     * List of shortchuts
     */
    shortcuts!: Shortcuts;
    private watcher: vscode.Disposable | undefined;

    constructor() {}

    /**
     * Initialize collections.
     * **Must** be called after each `new Collections()`
     * (delegated because `async` is not possible on a constructor).
     */
    async init(workspaceFsPath: string, userDefaultCollections: string[]): Promise<void> {

        await this.set(workspaceFsPath, userDefaultCollections);

        await this.setShortcuts(workspaceFsPath);

        /* Watcher must be set just once */
        if (!this.watcher) {

            this.watcher = Watchers.watchCodePreferences(() => {
                this.init(workspaceFsPath, userDefaultCollections);
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
     * Get collection from cache.
     * @param name 
     */
    get(name: string): Collection | undefined {

        return this.collections.get(name);

    }

    /**
     * Set collections names and preload official collections.
     */
    private async set(workspaceFsPath: string, userDefaultCollections: string[]): Promise<void> {

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
            if (await this.isCollectionExisting(workspaceFsPath, name)) {
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

            Output.logInfo(`Loading "${name}" collection.`);

            const collection = new Collection(name);
                    
            try {
                await collection.init(workspaceFsPath);
                this.collections.set(name, collection);
            } catch {
                Output.logError(`Loading of "${name}" collection failed.`);
            }

        }

    }

    /**
     * Set shortcuts for component and module types
     */
    private async setShortcuts(workspaceFsPath: string): Promise<void> {

        const shortcuts = new Shortcuts();

        await shortcuts.init(workspaceFsPath);

        this.shortcuts = shortcuts;

    }

    /**
     * Check if a collection exists
     */
    private async isCollectionExisting(workspaceFsPath: string, name: string): Promise<boolean> {

        let fsPath = '';

        /* Local schematics */
        if (name.startsWith('.') && name.endsWith('.json')) {

            fsPath = path.join(workspaceFsPath, name);

        }
        /* Package schematics */
        else {
            
            fsPath = path.join(workspaceFsPath, 'node_modules', name);

        }

        /* It's normal that not all collections exist, so we want to be silent here */
        return await FileSystem.isReadable(fsPath, { silent: true });

    }

}
