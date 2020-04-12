import * as vscode from 'vscode';

export function getDefaultsWorkspaceFolderFsPath(): string {

    return vscode.workspace.workspaceFolders![0].uri.fsPath;

}

export function getCustomizedWorkspaceFolderFsPath(): string {

    return vscode.workspace.workspaceFolders![1].uri.fsPath;

}
