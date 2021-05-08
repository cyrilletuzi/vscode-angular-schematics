import * as vscode from 'vscode';

import { defaultCollectionsNames, angularCollectionName } from '../../defaults';
import { Output, JsonValidator } from '../../utils';

import { Collection } from './collection';
import { findCollectionUri } from './find-collection';

export class Collections {

    /**
     * List of collections existing in the workspace
     */
    list = new Map<string, Collection>();

    /**
     * Initialize collections.
     * **Must** be called after each `new Collections()`
     * (delegated because `async` is not possible on a constructor).
     */
    async init(workspaceFolder: vscode.WorkspaceFolder, userDefaultCollections: string[]): Promise<vscode.FileSystemWatcher[]> {

        return await this.setList(workspaceFolder, userDefaultCollections);

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
     * Set collections names and preload official collections.
     */
    private async setList(workspaceFolder: vscode.WorkspaceFolder, userDefaultCollections: string[]): Promise<vscode.FileSystemWatcher[]> {

        Output.logInfo(`Loading the list of schematics collections.`);

        /* Start from scratch as the function can be called again via watcher */
        this.list.clear();
        const watchers = [];

        /* Configuration key is configured in `package.json` */
        const userPreference = vscode.workspace.getConfiguration('ngschematics', workspaceFolder.uri).get<string[]>(`schematics`, []);

        /* Validate user input */
        const userCollectionsNames = JsonValidator.array(userPreference, 'string') ?? [];

        Output.logInfo(`${userCollectionsNames.length} user schematics collection(s) detected in Code preferences${userCollectionsNames.length > 0 ? `: ${userCollectionsNames.join(', ')}` : ''}`);

        /* `Set` removes duplicate.
         * Default collections are set first as they are the most used */
        const collectionsNames = Array.from(new Set([...userDefaultCollections, ...defaultCollectionsNames, ...userCollectionsNames]));

        const existingCollections: { name: string; uri: vscode.Uri; }[] = [];

        /* Check the collections exist.
         * `.filter()` is not possible here as there is an async operation */
        for (const name of collectionsNames) {

            /* Be silent on extension defaults, be not on user defined collections */
            const silent = (userDefaultCollections.includes(name) || userCollectionsNames.includes(name)) ? false : true;

            const uri = await findCollectionUri(workspaceFolder, name, { silent });

            if (uri) {
                existingCollections.push({ name, uri });
            }

        }

        if (existingCollections.length > 0) {
            Output.logInfo(`${existingCollections.length} installed collection(s) detected: ${existingCollections.map((collection) => collection.name).join(', ')}`);
        } else {
            Output.logError(`No collection found. "${angularCollectionName}" should be present in a correctly installed Angular CLI project. If you are in a non-Angular CLI project, try to run in the Terminal: "npm install ${angularCollectionName} --save-dev"`);
        }

        /* `.filter()` is not possible here as there is an async operation */
        for (const existingCollection of existingCollections) {

            Output.logInfo(`Loading "${existingCollection.name}" collection.`);

            const collection = new Collection(existingCollection.name);

            try {

                const watcher = await collection.init(workspaceFolder, existingCollection.uri);
                this.list.set(existingCollection.name, collection);

                if (watcher) {
                    watchers.push(watcher);
                }

            } catch (error) {
                Output.logError((error as Error).message);
            }

        }

        return watchers;

    }

}
