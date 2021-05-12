import * as vscode from 'vscode';

function getWorkspaceUri(workspaceName: string): vscode.Uri {

    const dirnameUri = vscode.Uri.file(__dirname);

    return vscode.Uri.joinPath(dirnameUri, '..', '..', '..', 'test-workspaces', workspaceName);

}

export const rootProjectName = 'my-app';
export const libProjectName = 'my-lib';
export const subAppProjectName = 'other-app';
export const ionicCollectionName = '@ionic/angular-toolkit';
export const materialCollectionName = '@angular/material';
export const userComponentTypeLabel = `Custom component type`;
export const defaultsWorkspaceFolderUri = getWorkspaceUri('defaults');
export const customizedWorkspaceFolderUri = getWorkspaceUri('customized');
export const angularEslintWorkspaceFolderUri = getWorkspaceUri('angulareslint');
