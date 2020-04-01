import * as vscode from 'vscode';

import { Schematics } from '../schematics';

import { PackageJsonConfig } from './package-json';
import { TypescriptConfig } from './typescript';
import { AngularConfig } from './angular';
import { TslintConfig } from './tslint';
import { WorkspaceExtended } from './workspace-extended';

export class Workspaces {

    /**
     * List of all the opened workspaces.
     * The map key is the workspace's name.
     */
    private static workspaces = new Map<string, WorkspaceExtended>();
    private static stable = false;

    /**
     * Initialize configuration of all opened workspaces.
     */
    static init(): void {

        // TODO: check if non-Angular workspaces are included or not
        /* Default array is just for type-safety, it cannot happen as the extension can only be activated inside a workspace */
        for (const workspace of (vscode.workspace.workspaceFolders ?? [])) {
            this.add(workspace);
        }

        /* Listen if a workspace is added or removed */
        vscode.workspace.onDidChangeWorkspaceFolders((event) => {

            for (const workspace of event.added) {
                this.add(workspace);
            }

            for (const workspace of event.removed) {
                this.workspaces.delete(workspace.name);
            }

        });

    }

    /**
     * Get a workspace configuration, or `undefined`.
     */
    static get(workspace: vscode.WorkspaceFolder): WorkspaceExtended | undefined {

        return this.workspaces.get(workspace.name);

    }

    /**
     * Try to resolve the current workspace directory, or ask the user for it.
     * @param contextPath Uri of any file in the current workspace
     */
    static async getCurrent(contextPath?: vscode.Uri): Promise<vscode.WorkspaceFolder | undefined> {

        let workspace: vscode.WorkspaceFolder | undefined;

        if (contextPath) {

            /* If there is a context path, current workspace can be resolved from it */
            workspace = vscode.workspace.getWorkspaceFolder(contextPath);

        }

        if (!workspace) {
        
            if (vscode.workspace.workspaceFolders?.length === 1) {

                /* If there is just one workspace, take it directly */
                workspace = vscode.workspace.workspaceFolders[0];

            } else {

                /* Otherwise the user must be asked */
                workspace = await vscode.window.showWorkspaceFolderPick();

            }

        }

        return workspace;

    }

    // TODO: find another solution for view
    static getFirstWorkspace(): vscode.WorkspaceFolder {
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

    private static async add(workspace: vscode.WorkspaceFolder): Promise<void> {

        const packageJsonConfig = new PackageJsonConfig(workspace);
        await packageJsonConfig.init();

        const typescriptConfig = new TypescriptConfig(workspace);
        await typescriptConfig.init();

        const tslintConfig = new TslintConfig(workspace);
        await tslintConfig.init();

        const workspaceExtented1 = { ...workspace, packageJsonConfig, typescriptConfig, tslintConfig };

        const angularConfig = new AngularConfig(workspaceExtented1);
        await angularConfig.init();

        const workspaceExtented2 = { ...workspaceExtented1, angularConfig };

        const schematics = new Schematics(workspaceExtented2);
        await schematics.init();

        this.workspaces.set(workspace.name, {
            ...workspaceExtented2,
            schematics,
        });

        this.stable = true;

    }

}
