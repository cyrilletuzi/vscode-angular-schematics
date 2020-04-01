import * as vscode from 'vscode';
import * as path from 'path';

import { FileSystem, Watchers } from '../utils';

interface TsconfigJsonSchema {
    angularCompilerOptions?: {
        enableIvy?: boolean;
    };
}

export class TypescriptConfig {

    // TODO: could be in a subdirectory
    /** Basename of TypeScript config file */
    private static readonly fileName = 'tsconfig.json';
    /** File system path of TypeScript config file */
    private fsPath!: string;
    /** Values from TypeScript config file */
    private config: TsconfigJsonSchema | undefined;
    /** `enableIvy` value in `angularCompilerOptions` */
    private enableIvy: boolean | undefined;
    
    constructor(private workspace: vscode.WorkspaceFolder) {}

    /**
     * Initializes `tsconfig.json` configuration.
     * **Must** be called after each `new TypescriptConfig()`
     * (delegated because `async` is not possible on a constructor).
     */
    async init(): Promise<void> {

        /* Watcher must be set just once */
        if (!this.fsPath) {

            this.fsPath = path.join(this.workspace.uri.fsPath, TypescriptConfig.fileName);

            Watchers.watchFile(this.fsPath, () => {
                this.init();
            });

        }

        this.config = await FileSystem.parseJsonFile<TsconfigJsonSchema>(this.fsPath, this.workspace);

        /* Ivy can be manually enabled/disabled with `enableIvy` in `tsconfig.json` */
        this.enableIvy = this.config?.angularCompilerOptions?.enableIvy;

    }

    /**
     * Get `enableIvy` value in `angularCompilerOptions` of `tsconfig.json`
     */
    getEnableIvy(): boolean | undefined {
        return this.enableIvy;
    }

}
