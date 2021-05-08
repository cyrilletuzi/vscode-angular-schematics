import * as vscode from 'vscode';

export const rootProjectName = 'my-app';
export const libProjectName = 'my-lib';
export const subAppProjectName = 'other-app';
export const ionicCollectionName = '@ionic/angular-toolkit';
export const materialCollectionName = '@angular/material';
export const userComponentTypeLabel = `Custom component type`;
export const defaultsWorkspaceFolderUri = vscode.Uri.joinPath(vscode.Uri.parse(__dirname), '..', '..', '..', 'test-workspaces', 'defaults');
export const customizedWorkspaceFolderUri = vscode.Uri.joinPath(vscode.Uri.parse(__dirname), '..', '..', '..', 'test-workspaces', 'customized');
export const angularEslintWorkspaceFolderUri = vscode.Uri.joinPath(vscode.Uri.parse(__dirname), '..', '..', '..', 'test-workspaces', 'angulareslint');
