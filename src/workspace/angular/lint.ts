import * as vscode from 'vscode';

import { FileSystem, JsonValidator, Output } from '../../utils';

import { LintJsonSchema } from './json-schema';

export class LintConfig {

    /** List of components suffixes defined in lint config, lowercased */
    componentSuffixes: string[] = [];
    private linter?: 'eslint' | 'tslint';

    /**
     * Initializes lint configuration.
     * **Must** be called after each `new LintConfig()`
     * (delegated because `async` is not possible on a constructor).
     */
    async init(contextUri: vscode.Uri, { silent = false } = {}): Promise<vscode.FileSystemWatcher | undefined> {

        const tslintUri = vscode.Uri.joinPath(contextUri, 'tslint.json');
        const eslintUri = vscode.Uri.joinPath(contextUri, '.eslintrc.json');

        let config: LintJsonSchema = {
            rules: {},
        };

        if (await FileSystem.isReadable(eslintUri, { silent: true })) {

            const unsafeConfig = await FileSystem.parseJsonFile(eslintUri, { silent });

            this.linter = 'eslint';

            config = this.validateEslintConfig(unsafeConfig);

        } else if (await FileSystem.isReadable(tslintUri, { silent: true })) {

            const unsafeConfig = await FileSystem.parseJsonFile(tslintUri, { silent });

            this.linter = 'tslint';

            config = this.validateTslintConfig(unsafeConfig);

        }

        this.initComponentSuffixes(config);

        if (this.linter) {

            Output.logInfo(`${this.componentSuffixes.length} custom component suffixe(s) detected in ${this.linter} config${this.componentSuffixes.length > 0 ? `: ${this.componentSuffixes.join(', ')}` : ''}`);

            if ((this.linter === 'eslint') && (eslintUri.scheme === 'file')) {

                return vscode.workspace.createFileSystemWatcher(eslintUri.fsPath);

            } else if ((this.linter === 'tslint') && (tslintUri.scheme === 'file')) {

                return vscode.workspace.createFileSystemWatcher(tslintUri.fsPath);

            }

            return undefined;

        } else {

            Output.logWarning(`No linter configuration found.`);

            return undefined;

        }

    }

    /**
     * Tells if a suffix is authorized in lint config
     */
    hasComponentSuffix(suffix: string): boolean {

        /* Lowercase both values to be sure to match all styles */
        return this.componentSuffixes.includes(suffix.toLowerCase());

    }

    /**
     * Validate .eslintrc.json
     */
    private validateEslintConfig(config: unknown): LintJsonSchema {

        const overrides = JsonValidator.array(JsonValidator.object(config)?.['overrides']) ?? [];

        for (const override of overrides) {

            const files = JsonValidator.string(JsonValidator.object(override)?.['files']) ?? JsonValidator.array(JsonValidator.object(override)?.['files'], 'string') ?? [];

            if (((typeof files === 'string') && files === ('*.ts')) ||
                (Array.isArray(files) && files.includes('*.ts'))) {

                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                const rules = JsonValidator.object(JsonValidator.object(override)!['rules']) ?? {};

                const suffixesRule = JsonValidator.array(rules?.['@angular-eslint/component-class-suffix']) ?? [];

                const suffixesArray = JsonValidator.array(JsonValidator.object(suffixesRule[1])?.['suffixes'], 'string') ?? [];

                return {
                    rules: {
                        componentClassSuffixes: suffixesArray,
                    },
                };

            }

        }

        return {
            rules: {},
        };

    }

    /**
     * Validate tslint.json
     */
    private validateTslintConfig(config: unknown): LintJsonSchema {

        const rules = JsonValidator.object(JsonValidator.object(config)?.['rules']) ?? {};

        /*
          * Can be:
          * 1. nonexistent
          * 2. `true` (default Angular CLI config)
          * 3. `[true, "Component", "Dialog"]` (user defined)
          */
        const suffixesArray = JsonValidator.array(rules?.['component-class-suffix']);

        return {
            rules: {
                componentClassSuffixes: JsonValidator.array(suffixesArray?.slice(1), 'string'),
            },
        };

    }

    /**
     * Initialize user components suffixes
     */
    private initComponentSuffixes(config: Pick<LintJsonSchema, 'rules'>): void {

        /* `Set` removes duplicates */
        this.componentSuffixes = Array.from(new Set(config?.rules?.componentClassSuffixes ?? []))
            .map((suffix) => suffix.toLowerCase());

    }

}
