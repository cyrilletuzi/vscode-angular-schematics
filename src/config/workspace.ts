import * as vscode from 'vscode';

import { Output } from '../utils';
import { Collections } from '../schematics';

import { TslintConfig } from './tslint';
import { AngularConfig } from './angular';

export class WorkspaceConfig implements vscode.WorkspaceFolder {

    uri: vscode.Uri;
    name: string;
    index: number;

    tslintConfig!: TslintConfig;
    angularConfig!: AngularConfig;
    collections!: Collections;

    constructor(workspace: vscode.WorkspaceFolder) {
        this.uri = workspace.uri;
        this.name = workspace.name;
        this.index = workspace.index;
    }

    /**
     * Initializes `tsconfig.json` configuration.
     * **Must** be called after each `new WorkspaceConfig()`
     * (delegated because `async` is not possible on a constructor).
     */
    async init(): Promise<void> {

        // TODO: configs could be in parent or subdirectories
        // TODO: handle custom node_modules folder

        Output.logInfo(`Loading Angular configuration.`);

        const angularConfig = new AngularConfig();
        await angularConfig.init(this.uri.fsPath);
        this.angularConfig = angularConfig;
        
        Output.logInfo(`Loading global TSLint configuration.`);

        const tslintConfig = new TslintConfig();
        await tslintConfig.init(this.uri.fsPath);
        this.tslintConfig = tslintConfig;

        Output.logInfo(`Loading schematics configuration.`);

        const collections = new Collections();
        await collections.init(this.uri.fsPath, angularConfig.getDefaultCollections());
        this.collections = collections;

    }

}
