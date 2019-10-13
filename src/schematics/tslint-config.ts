import * as path from 'path';
import * as vscode from 'vscode';
import { Utils } from './utils';

export interface TSLintConfigSchema {
    rules?: {
        'component-class-suffix'?: boolean | [true, ...string[]];
    };
}

export class TSLintConfig {

    static readonly configPath = 'tslint.json';
    static componentSuffixes: string[] | null = null;

    private static config: TSLintConfigSchema | null = null;
    private static watcher: vscode.FileSystemWatcher;

    static async init(cwd: string): Promise<void> {

        const configPath = path.join(cwd, this.configPath);

        if (!this.config && await Utils.existsAsync(configPath)) {

            this.config = await Utils.parseJSONFile<TSLintConfigSchema>(configPath);

            this.componentSuffixes = this.getComponentSuffixes(this.config);

            if (!this.watcher) {

                /* Listen to change in config file to update config */
                this.watcher = vscode.workspace.createFileSystemWatcher(configPath, true, undefined, true);

                this.watcher.onDidChange(() => {
                    this.config = null;
                    this.init(cwd);
                });

            }

        }

    }

    private static getComponentSuffixes(config: TSLintConfigSchema | null): string[] | null {

        if (config && config.rules) {

            if (Array.isArray(config.rules['component-class-suffix']) && config.rules['component-class-suffix'].length > 2) {

                return config.rules['component-class-suffix'].slice(1) as string[];

            }

        }

        return null;

    }

}