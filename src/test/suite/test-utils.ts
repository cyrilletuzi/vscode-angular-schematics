import * as vscode from 'vscode';

export function getTestWorkspaceFolderFsPath(): string {

    return vscode.workspace.workspaceFolders![0].uri.fsPath;

}
