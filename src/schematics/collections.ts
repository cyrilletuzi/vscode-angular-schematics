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
    list = new Map<string, Collection>();
    /**
     * List of shortchuts
     */
    shortcuts!: Shortcuts;

    /**
     * Initialize collections.
     * **Must** be called after each `new Collections()`
     * (delegated because `async` is not possible on a constructor).
     */
    async init(workspaceFolder: vscode.WorkspaceFolder, userDefaultCollections: string[]): Promise<void> {

        await this.set(workspaceFolder, userDefaultCollections);

        await this.setShortcuts(workspaceFolder);

        Watchers.watchCodePreferences('userCollections', () => {
            this.init(workspaceFolder, userDefaultCollections);
        });

    }

    /**
     * Get all collections' names.
     */
    getCollectionsNames(): string[] {
        return Array.from(this.list.keys());
    }

    /**
     * Get collection from cache.
     * @param name 
     */
    getCollection(name: string): Collection | undefined {

        return this.list.get(name);

    }

    /**
     * Validate "ngschematics.schematics" user preference
     */
    private validateSchematicsPreference(values: unknown): string[] {

        const errorMessage = `Your "ngschematics.schematics" preference is invalid.`;

        if (values === '') {
            return [];
        }

        if (!Array.isArray(values)) {
            Output.logWarning(errorMessage);
            return [];
        }
        for (const value of values) {
            if (typeof value !== 'string') {
                Output.logWarning(errorMessage);
                return [];
            }
        }

        return values;

    }

    /**
     * Set collections names and preload official collections.
     */
    private async set(workspaceFolder: vscode.WorkspaceFolder, userDefaultCollections: string[]): Promise<void> {

        Output.logInfo(`Loading the list of collections.`);

        /* Configuration key is configured in `package.json` */
        const userPreference = vscode.workspace.getConfiguration('ngschematics', workspaceFolder.uri).get<string[]>(`schematics`, []);

        /* Validate user input */
        const userCollectionsNames = this.validateSchematicsPreference(userPreference);

        Output.logInfo(`${userCollectionsNames.length} user collection(s) detected in Code preferences${userCollectionsNames.length > 0 ? `: ${userCollectionsNames.join(', ')}` : ''}`);

        /* `Set` removes duplicate.
         * Default collections are set first as they are the most used */
        const collectionsNames = Array.from(new Set([...userDefaultCollections, ...defaultCollectionsNames, ...userCollectionsNames]));

        const existingCollectionsNames = [];

        /* Check the collections exist.
         * `.filter()` is not possible here as there is an async operation */
        for (const name of collectionsNames) {
            if (await this.isCollectionExisting(workspaceFolder.uri.fsPath, name)) {
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
                await collection.init(workspaceFolder.uri.fsPath);
                this.list.set(name, collection);
            } catch {
                Output.logError(`Loading of "${name}" collection failed.`);
            }

        }

    }

    /**
     * Set shortcuts for component and module types
     */
    private async setShortcuts(workspaceFolder: vscode.WorkspaceFolder): Promise<void> {

        const shortcuts = new Shortcuts();

        await shortcuts.init(workspaceFolder);

        this.shortcuts = shortcuts;

    }

    /**
     * Check if a collection exists
     */
    private async isCollectionExisting(workspaceFolderFsPath: string, name: string): Promise<boolean> {

        let fsPath = '';

        /* Local schematics */
        if (name.startsWith('.') && name.endsWith('.json')) {

            fsPath = path.join(workspaceFolderFsPath, name);

        }
        /* Package schematics */
        else {
            
            fsPath = path.join(workspaceFolderFsPath, 'node_modules', name);

        }

        /* It's normal that not all collections exist, so we want to be silent here */
        return await FileSystem.isReadable(fsPath, { silent: true });

    }

}
