import * as vscode from 'vscode';

export interface ExplorerMenuContext {
    path: string;
}

export class Workspace {

    static getContextPath(context?: ExplorerMenuContext): string {

        /* Check if there is an Explorer context (command could be launched from Palette too, where there is no context) */
        return (typeof context === 'object') && (context !== null) && ('path' in context) ? context.path : '';

    }

    static getDefaultWorkspace(): vscode.WorkspaceFolder | null {

        if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length === 1) {
            return vscode.workspace.workspaceFolders[0];
        }

        return null;

    }

    static async getWorkspaceFolderPath(path = ''): Promise<string> {

        const workspaceFolder = path ?
            vscode.workspace.getWorkspaceFolder(vscode.Uri.file(path)) :
            (this.getDefaultWorkspace() || await vscode.window.showWorkspaceFolderPick());

        return workspaceFolder ? workspaceFolder.uri.fsPath : '';

    }

} 