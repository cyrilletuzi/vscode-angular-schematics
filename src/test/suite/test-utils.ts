import * as vscode from 'vscode';

export function getDefaultsWorkspaceFolder(): vscode.WorkspaceFolder {

    return vscode.workspace.workspaceFolders![0];

}

export function getCustomizedWorkspaceFolder(): vscode.WorkspaceFolder {

    return vscode.workspace.workspaceFolders![1];

}
