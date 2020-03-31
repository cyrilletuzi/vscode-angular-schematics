import * as path from 'path';
import * as vscode from 'vscode';

import { Preferences } from './preferences';
import { AngularConfig } from './config-angular';
import { FileSystem } from './file-system';
import { Watchers } from './watchers';

export interface TSLintSchema {
    rules?: {
        'component-class-suffix'?: boolean | [true, ...string[]];
    };
}

export class TSLintConfig {

    /** Basename of TSLint config file */
    static readonly fileName = 'tslint.json';
    /** File system path of TSLint config file */
    private fsPath: string;
    /** Values from TSLint config file */
    private config: TSLintSchema | undefined;
    private componentSuffixes: string[] = [];
    private userComponentSuffixes: string[] = [];

    constructor(
        private workspace: vscode.WorkspaceFolder,
        private angularConfig: AngularConfig,
    ) {

        this.fsPath = path.join(workspace.uri.fsPath, TSLintConfig.fileName);

    }

    async init(): Promise<void> {

        await this.setConfig();

        Watchers.watchFile(this.fsPath, () => {
            this.setConfig();
        });

    }

    getUserComponentSuffixes(): string[] {
        return this.userComponentSuffixes;
    }

    getComponentSuffixes(): string[] {
        return this.componentSuffixes;
    }

    private async setConfig(): Promise<void> {

        this.config = await FileSystem.parseJsonFile<TSLintSchema>(this.fsPath, this.workspace);

        this.setUserComponentSuffixes();

        this.setComponentSuffixes();

    }

    private setUserComponentSuffixes(): void {

        const suffixes = [];

        const tslintSuffixes = this.config?.rules?.['component-class-suffix'];

        if (Array.isArray(tslintSuffixes) && tslintSuffixes.length > 2) {

            suffixes.push(...(tslintSuffixes.slice(1) as string[]));

        }

        this.userComponentSuffixes = suffixes;

    }

    private setComponentSuffixes(): void {

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
            if (!this.angularConfig.isIvy() && !hasRuntimeType) {
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

    }

}