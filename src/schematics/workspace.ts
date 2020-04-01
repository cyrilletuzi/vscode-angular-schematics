import * as vscode from 'vscode';

export class ExtendedWorkspace implements vscode.WorkspaceFolder {

    uri: vscode.Uri;
    name: string;
    index: number;

    constructor(workspace: vscode.WorkspaceFolder) {

        this.uri = workspace.uri;
        this.name = workspace.name;
        this.index = workspace.index;

    }

    async init(): Promise<void> {
        
    }

}