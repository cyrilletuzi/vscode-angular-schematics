import * as vscode from 'vscode';
import * as path from 'path';

import { FileSystem, Output, JsonValidator } from '../../utils';

import { TslintJsonSchema } from './json-schema';

export class TslintConfig {

    /** List of components suffixes defined in `tslint.json`, lowercased */
    componentSuffixes: string[] = [];

    /**
     * Initializes `tslint.json` configuration.
     * **Must** be called after each `new TslintConfig()`
     * (delegated because `async` is not possible on a constructor).
     */
    async init(contextFsPath: string, { silent = false } = {}): Promise<vscode.FileSystemWatcher> {

        const fsPath = path.join(contextFsPath, 'tslint.json');

        const unsafeConfig = await FileSystem.parseJsonFile(fsPath, { silent });

        const config = this.validateConfig(unsafeConfig);

        this.initComponentSuffixes(config);

        Output.logInfo(`${this.componentSuffixes.length} custom component suffixe(s) detected in TSLint config${this.componentSuffixes.length > 0 ? `: ${this.componentSuffixes.join(', ')}` : ''}`);

        return vscode.workspace.createFileSystemWatcher(fsPath);

    }

    /**
     * Tells if a suffix is authorized in tslint.json
     */
    hasComponentSuffix(suffix: string): boolean {

        /* Lowercase both values to be sure to match all styles */
        return this.componentSuffixes.includes(suffix.toLowerCase());

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

    /**
     * Initialize user components suffixes
     */
    private initComponentSuffixes(config: Pick<TslintJsonSchema, 'rules'>): void {

        /* `Set` removes duplicates */
        this.componentSuffixes = Array.from(new Set(config?.rules?.['component-class-suffix'] ?? []))
            .map((suffix) => suffix.toLowerCase());

    }

}
