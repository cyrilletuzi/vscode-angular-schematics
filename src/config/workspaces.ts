import * as vscode from 'vscode';

import { Output } from '../utils';

import { WorkspaceConfig } from './workspace';

export class Workspaces {

    /**
     * List of all the opened workspaces.
     * The map key is the workspace's name.
     */
    private static workspaces = new Map<string, WorkspaceConfig>();
    private static stable = false;

    /**
     * Initialize configuration of all opened workspaces.
     */
    static async init(): Promise<void> {

        const workspaces = vscode.workspace.workspaceFolders ?? [];

        Output.logInfo(`Loading configuration of ${workspaces.length} workspace(s).`);

        // TODO: check if non-Angular workspaces are included or not
        /* Default array is just for type-safety, it cannot happen as the extension can only be activated inside a workspace */
        for (const workspace of workspaces) {
            await this.add(workspace);
        }

        /* All configuration is ready */
        this.stable = true;

        Output.logInfo(`Configurations of all workspaces are now ready.`);

        /* Listen if a workspace is added or removed */
        vscode.workspace.onDidChangeWorkspaceFolders((event) => {

            for (const workspace of event.added) {
                Output.logInfo(`Loading configuration of new "${workspace.name}" workspace.`);
                this.add(workspace);
            }

            for (const workspace of event.removed) {
                Output.logInfo(`Unloading configuration of removed "${workspace.name}" workspace.`);
                this.workspaces.delete(workspace.name);
            }

        });

    }

    /**
     * Get a workspace configuration, or `undefined`.
     */
    static get(workspace: vscode.WorkspaceFolder): WorkspaceConfig | undefined {

        return this.workspaces.get(workspace.name);

    }

    /**
     * Get a workspace based on a file system path configuration, or `undefined`.
     */
    static getFromPath(fsPath: string): vscode.WorkspaceFolder | undefined {
        
        const contextPathUri = vscode.Uri.file(fsPath);

        return vscode.workspace.getWorkspaceFolder(contextPathUri);

    }

    /**
     * Try to resolve the current workspace directory, or ask the user for it.
     * @param contextPath Uri of any file in the current workspace
     */
    static async getCurrent(contextPath?: vscode.Uri): Promise<vscode.WorkspaceFolder | undefined> {

        let workspace: vscode.WorkspaceFolder | undefined;

        if (contextPath) {

            Output.logInfo(`Context path detected: resolving current workspace from it.`);

            /* If there is a context path, current workspace can be resolved from it */
            workspace = vscode.workspace.getWorkspaceFolder(contextPath);

        }

        if (!workspace) {
        
            if (vscode.workspace.workspaceFolders?.length === 1) {

                Output.logInfo(`There is only one workspace opened, default to it.`);

                /* If there is just one workspace, take it directly */
                workspace = vscode.workspace.workspaceFolders[0];

            } else {

                Output.logInfo(`There are multiple workspaces opened, ask the user which one we should use.`);

                /* Otherwise the user must be asked */
                workspace = await vscode.window.showWorkspaceFolderPick();

            }

        }

        return workspace;

    }

    // TODO: find another solution for view
    static getFirst(): vscode.WorkspaceFolder {
        return vscode.workspace.workspaceFolders![0];
    }

    /**
     * Wait for the config to be fully loaded.
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
     * Check if the config is fully loaded, or retry every 1 second.
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
     * Initialize a workspace configuration
     */
    private static async add(workspace: vscode.WorkspaceFolder): Promise<void> {

        Output.logInfo(`Loading configuration of "${workspace.name}" workspace.`);

        const workspaceConfig = new WorkspaceConfig(workspace);

        await workspaceConfig.init();

    }

}
