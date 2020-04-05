import * as vscode from 'vscode';
import * as path from 'path';

import { FileSystem, Output } from '../../utils';

import { TslintJsonSchema } from './json-schema';

export class TslintConfig {

    /** List of components suffixes defined in `tslint.json` */
    componentSuffixes: string[] = [];
    /** Basename of TSLint config file */
    private static readonly fileName = 'tslint.json';
    /** Values from TSLint config file */
    private config: TslintJsonSchema | undefined;

    /**
     * Initializes `tslint.json` configuration.
     * **Must** be called after each `new TslintConfig()`
     * (delegated because `async` is not possible on a constructor).
     */
    async init(contextFsPath: string, { silent = false } = {}): Promise<vscode.FileSystemWatcher> {

        const fsPath = path.join(contextFsPath, TslintConfig.fileName);

        this.config = await FileSystem.parseJsonFile<TslintJsonSchema>(fsPath, { silent });

        this.setComponentSuffixes();

        return vscode.workspace.createFileSystemWatcher(fsPath);

    }

    /**
     * Tells if a suffix is authorized in tslint.json
     */
    hasComponentSuffix(suffix: string): boolean {

        /* Lowercase both values to be sure to match all styles */
        return this.componentSuffixes.map((suffix) => suffix.toLowerCase()).includes(suffix.toLowerCase());

    }

    /**
     * Set component suffixes defined in `tslint.json`, or at least `Component` by default.
     */
    private setComponentSuffixes(): void {

        const suffixes = [];

        /* 
         * Can be:
         * 1. nonexistent
         * 2. `true` (default Angular CLI config)
         * 3. `[true, "Component", "Dialog"]` (user defined)
         */
        const tslintRule = this.config?.rules?.['component-class-suffix'];

        /* Check we are in the 3rd case */
        if (Array.isArray(tslintRule) && tslintRule.length > 1) {

            /* Removes the first value (`true`)
             * Type cast is required as TypeScript cannot do it itself in this case */
            const tslintSuffixes = tslintRule.slice(1) as string[];

            suffixes.push(...tslintSuffixes);

        }

        /* `Set` removes duplicates */
        this.componentSuffixes = Array.from(new Set(suffixes));

        Output.logInfo(`${this.componentSuffixes.length} custom component suffixe(s) detected in TSLint config${this.componentSuffixes.length > 0 ? `: ${this.componentSuffixes.join(', ')}` : ''}`);

    }

}