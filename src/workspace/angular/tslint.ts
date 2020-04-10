import * as vscode from 'vscode';
import * as path from 'path';

import { FileSystem, Output, JsonValidator } from '../../utils';

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

        this.config = this.validateConfig(await FileSystem.parseJsonFile(fsPath, { silent }));

        /* `Set` removes duplicates */
        this.componentSuffixes = Array.from(new Set(this.config?.rules?.['component-class-suffix'] ?? []));

        Output.logInfo(`${this.componentSuffixes.length} custom component suffixe(s) detected in TSLint config${this.componentSuffixes.length > 0 ? `: ${this.componentSuffixes.join(', ')}` : ''}`);

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
     * Validate tslint.json
     */
    private validateConfig(config: unknown): TslintJsonSchema {

        const rules = JsonValidator.object(JsonValidator.object(config)?.rules) ?? {};

        /* 
         * Can be:
         * 1. nonexistent
         * 2. `true` (default Angular CLI config)
         * 3. `[true, "Component", "Dialog"]` (user defined)
         */
        const suffixesArray = JsonValidator.array(rules?.['component-class-suffix']);

        return {
            rules: {
                'component-class-suffix': JsonValidator.array(suffixesArray?.slice(1), 'string'),
            },
        };

    }

}
