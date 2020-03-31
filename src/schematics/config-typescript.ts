import * as vscode from 'vscode';
import * as path from 'path';

import { FileSystem } from './file-system';
import { Watchers } from './watchers';

export interface TSConfigSchema {
    angularCompilerOptions?: {
        enableIvy?: boolean;
    };
}

export class TypescriptConfig {

    // TODO: could be in a subdirectory
    /** Basename of TypeScript config file */
    static readonly fileName = 'tsconfig.json';
    /** File system path of TypeScript config file */
    private fsPath: string;
    /** Values from TypeScript config file */
    private config!: TSConfigSchema | undefined;
    /** `enableIvy` value in `angularCompilerOptions` */
    private enableIvy!: boolean | undefined;
    
    constructor(private workspace: vscode.WorkspaceFolder) {

        this.fsPath = path.join(workspace.uri.fsPath, TypescriptConfig.fileName);

    }

    async init(): Promise<void> {

        await this.setConfig();

        Watchers.watchFile(this.fsPath, () => {
            this.setConfig();
        });

    }

    /**
     * Get `enableIvy` value in `angularCompilerOptions` of `tsconfig.json`
     */
    getEnableIvy(): boolean | undefined {
        return this.enableIvy;
    }

    private async setConfig(): Promise<void> {

        this.config = await FileSystem.parseJsonFile<TSConfigSchema>(this.fsPath, this.workspace);

        this.enableIvy = this.config?.angularCompilerOptions?.enableIvy;

    }

}
