import * as vscode from 'vscode';

import { Output } from '../utils';

import { WorkspaceFolderConfig } from './workspace-folder';

export class Workspace {

    /**
     * List of all the opened workspace folders.
     * The map key is the workspace folder's name.
     */
    static folders = new Map<string, WorkspaceFolderConfig>();
    static watcher: vscode.Disposable;
    /**
     * Tells if the initial configuration loading is complete.
     */
    private static stable = false;

    /**
     * Initialize configuration of all opened workspace folders.
     */
    static async init(): Promise<void> {

        const startTime = Date.now();

        /* Default array is just for type-safety, it cannot happen
         * as the extension can only be activated inside a workspace folder */
        const folders = vscode.workspace.workspaceFolders ?? [];

        if (folders.length > 0) {
            Output.logInfo(`${folders.length} workspace folder(s) detected.`);
        } else {
            Output.logError(`No workspace folder detected.`);
        }

        for (const folder of folders) {
            await this.add(folder);
        }

        /* All configuration is ready */
        this.stable = true;

        const endTime = Date.now();
        const durationTime = (endTime - startTime);

        Output.logInfo(`Configurations of all workspace folders are now ready. Duration: ${durationTime}ms.`);

        /* Listen if a workspace folder is added or removed */
        this.watcher = vscode.workspace.onDidChangeWorkspaceFolders((event) => {

            for (const folder of event.added) {
                Output.logInfo(`Loading configuration of new "${folder.name}" workspace folder.`);
                this.add(folder);
            }

            for (const folder of event.removed) {
                Output.logInfo(`Unloading configuration of removed "${folder.name}" workspace folder.`);
                this.folders.delete(folder.name);
            }

        });

    }

    /**
     * Get a workspace folder's configuration, or `undefined`.
     */
    static getFolderConfig(workspaceFolder: vscode.WorkspaceFolder): WorkspaceFolderConfig | undefined {

        return this.folders.get(workspaceFolder.name);

    }

    /**
     * Get a workspace folder based on a file system path, or `undefined`.
     */
    static getFolderFromPath(contextFsPath: string): vscode.WorkspaceFolder | undefined {
        
        const contextPathUri = vscode.Uri.file(contextFsPath);

        return vscode.workspace.getWorkspaceFolder(contextPathUri);

    }

    /**
     * Try to resolve the current workspace folder, or ask the user for it.
     * @param contextUri URI of any file in the current workspace folder
     */
    static async getCurrentFolder(contextUri?: vscode.Uri): Promise<vscode.WorkspaceFolder | undefined> {

        let folder: vscode.WorkspaceFolder | undefined;

        if (contextUri) {

            Output.logInfo(`Context path detected: resolving current workspace folder from it.`);

            /* If there is a context URI, current workspace folder can be resolved from it */
            folder = vscode.workspace.getWorkspaceFolder(contextUri);

        }

        if (!folder) {
        
            if (vscode.workspace.workspaceFolders?.length === 1) {

                Output.logInfo(`There is only one workspace folder opened, default to it.`);

                /* If there is just one workspace folder, take it directly */
                folder = vscode.workspace.workspaceFolders[0];

            } else {

                Output.logInfo(`There are multiple Code workspaces opened, ask the user which one we should use.`);

                /* Otherwise the user must be asked */
                folder = await vscode.window.showWorkspaceFolderPick();

            }

        }

        return folder;

    }

    /**
     * Wait for the configuration to be fully loaded.
     * Throw if it takes more than 10 seconds.
     */
    static async whenStable(): Promise<unknown> {

        if (!this.stable) {

            const isStable = new Promise<void>((resolve) => {
                this.isStable(resolve);
            });

            const timeout = new Promise<void>((_, reject) => {
                setTimeout(() => {
                    reject();
                }, 10000);
            });

            return Promise.race([isStable, timeout]);

        } else {
            return;
        }

    }

    /**
     * Check if the configuration is fully loaded, or retry every 1 second.
     * **Must be used with something to stop the loop.**
     */
    private static isStable(resolve: () => void): void {

        if (this.stable) {
            resolve();
        } else {
            setTimeout(() => {
                this.isStable(resolve);
            }, 1000);
        }

    }

    /**
     * Initialize a workspace folder configuration
     */
    private static async add(workspaceFolder: vscode.WorkspaceFolder): Promise<void> {

        Output.logInfo(`Loading configuration of "${workspaceFolder.name}" workspace folder.`);

        const folderConfig = new WorkspaceFolderConfig(workspaceFolder);

        try {
            await folderConfig.init();
            this.folders.set(workspaceFolder.name, folderConfig);
        } catch {
            Output.logWarning(`"${workspaceFolder.name}" workspace folder configuration has not been loaded as it does not seem to be an Angular project. A "angular.json" file should be present at the root of the workspace folder.`);
        }

    }

}
