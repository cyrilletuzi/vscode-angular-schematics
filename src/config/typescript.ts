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
    /** Values from TypeScript config file */
    private config: TsconfigJsonSchema | undefined;
    /** `enableIvy` value in `angularCompilerOptions` */
    private enableIvy: boolean | undefined;
    private watcher: vscode.FileSystemWatcher | undefined;
    
    /**
     * Initializes `tsconfig.json` configuration.
     * **Must** be called after each `new TypescriptConfig()`
     * (delegated because `async` is not possible on a constructor).
     */
    async init(workspaceFsPath: string): Promise<void> {

        const fsPath = path.join(workspaceFsPath, TypescriptConfig.fileName);

        this.config = await FileSystem.parseJsonFile<TsconfigJsonSchema>(fsPath);

        this.setEnableIvy();

        /* Watcher must be set just once */
        if (this.config && !this.watcher) {

            this.watcher = Watchers.watchFile(fsPath, () => {
                this.init(workspaceFsPath);
            });

        }

    }

    /**
     * Get `enableIvy` value in `angularCompilerOptions` of `tsconfig.json`
     */
    getEnableIvy(): boolean | undefined {
        return this.enableIvy;
    }

    /**
     * Set `enableIvy` value from `angularCompilerOptions` of `tsconfig.json`
     */
    setEnableIvy(): void {
        /* Ivy can be manually enabled/disabled with `enableIvy` in `tsconfig.json` */
        this.enableIvy = this.config?.angularCompilerOptions?.enableIvy;
    }

}
