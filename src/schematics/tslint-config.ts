import * as path from 'path';
import * as vscode from 'vscode';

import { Utils } from './utils';
import { Preferences } from './preferences';
import { AngularConfig } from './angular-config';

export interface TSLintConfigSchema {
    rules?: {
        'component-class-suffix'?: boolean | [true, ...string[]];
    };
}

export class TSLintConfig {

    static readonly configPath = 'tslint.json';
    static componentSuffixes: string[] = [];
    static userComponentSuffixes: string[] = [];

    private static config: TSLintConfigSchema | null = null;
    private static watcher: vscode.FileSystemWatcher;

    static async init(cwd: string): Promise<void> {

        const configPath = path.join(cwd, this.configPath);

        if (!this.config) {

            if (await Utils.existsAsync(configPath)) {

                this.config = await Utils.parseJSONFile<TSLintConfigSchema>(configPath);

                this.userComponentSuffixes = this.getUserComponentSuffixes(this.config);

            }

            const componentSuffixesSet = new Set<string>(['Component', ...(this.userComponentSuffixes || ['Page', 'Pure', 'Entry', 'Exported', 'Element']) ]);

            if (this.userComponentSuffixes) {

                let hasPureType = false;
                let hasPageType = false;
                let hasRuntimeType = false;
                let hasExportedType = false;
                let hasElementType = false;

                componentSuffixesSet.forEach((componentSuffixRaw) => {
                    const componentSuffix = componentSuffixRaw.toLowerCase();
                    if (Preferences.getComponentTypes('pure').includes(componentSuffix)) {
                        hasPureType = true;
                    } else if (Preferences.getComponentTypes('page').includes(componentSuffix)) {
                        hasPageType = true;
                    } else if (Preferences.getComponentTypes('runtime').includes(componentSuffix)) {
                        hasRuntimeType = true;
                    } else if (Preferences.getComponentTypes('exported').includes(componentSuffix)) {
                        hasExportedType = true;
                    } else if (Preferences.getComponentTypes('element').includes(componentSuffix)) {
                        hasElementType = true;
                    }
                });

                if (!hasPageType) {
                    componentSuffixesSet.add('Page');
                }
                if (!hasPureType) {
                    componentSuffixesSet.add('Pure');
                }
                if (!AngularConfig.isIvy && !hasRuntimeType) {
                    componentSuffixesSet.add('Entry');
                }
                if (!hasExportedType) {
                    componentSuffixesSet.add('Exported');
                }
                if (!hasElementType) {
                    componentSuffixesSet.add('Element');
                }
            
            }

            this.componentSuffixes = Array.from(componentSuffixesSet);

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

    private static getUserComponentSuffixes(config: TSLintConfigSchema | null): string[] {

        if (config && config.rules) {

            if (Array.isArray(config.rules['component-class-suffix']) && config.rules['component-class-suffix'].length > 2) {

                return config.rules['component-class-suffix'].slice(1) as string[];

            }

        }

        return [];

    }

}