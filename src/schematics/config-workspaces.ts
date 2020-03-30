import * as vscode from 'vscode';

import { AngularConfig } from './config-angular';
import { TypescriptConfig } from './config-typescript';
import { PackageJsonConfig } from './config-package-json';
import { TSLintConfig } from './config-tslint';

export interface WorkspaceExtended extends vscode.WorkspaceFolder {
    angularConfig: AngularConfig;
    typescriptConfig: TypescriptConfig;
    packageJsonConfig: PackageJsonConfig;
    tsLintConfig: TSLintConfig;
}

export class WorkspacesConfig {

    /** Map of all the opened workspaces. The map key is the workspace's name. */
    private static workspaces: Map<string, WorkspaceExtended>;

    // TODO: manage async
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

    static getWorkspaceExtended(workspace: vscode.WorkspaceFolder): WorkspaceExtended | undefined {

        return this.workspaces.get(workspace.name);

    }

    /**
     * Try to resolve the current workspace directory, or ask the user for it.
     * @param contextPath Uri of any file in the current workspace
     */
    static async getCurrentWorkspace(contextPath?: vscode.Uri): Promise<vscode.WorkspaceFolder | undefined> {

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

    private static async add(workspace: vscode.WorkspaceFolder): Promise<void> {

        const packageJsonConfig = new PackageJsonConfig(workspace);
        await packageJsonConfig.init();

        const typescriptConfig = new TypescriptConfig(workspace);
        await typescriptConfig.init();

        const angularConfig = new AngularConfig(workspace, typescriptConfig, packageJsonConfig);
        await angularConfig.init();

        const tsLintConfig = new TSLintConfig(workspace, angularConfig);
        await tsLintConfig.init();

        this.workspaces.set(workspace.name, {
            ...workspace,
            packageJsonConfig,
            typescriptConfig,
            angularConfig,
            tsLintConfig,
        });

    }

}