import * as path from 'path';
import * as vscode from 'vscode';

import { FileSystem } from './file-system';
import { Watchers } from './watchers';

export interface TSLintSchema {
    rules?: {
        'component-class-suffix'?: boolean | [true, ...string[]];
    };
}

export class TSLintConfig {

    /** Basename of TSLint config file */
    private static readonly fileName = 'tslint.json';
    /** File system path of TSLint config file */
    private fsPath: string;
    /** Values from TSLint config file */
    private config: TSLintSchema | undefined;
    private componentSuffixes: string[] = [];

    constructor(
        private workspace: vscode.WorkspaceFolder,
    ) {

        this.fsPath = path.join(workspace.uri.fsPath, TSLintConfig.fileName);

    }

    async init(): Promise<void> {

        await this.setConfig();

        Watchers.watchFile(this.fsPath, () => {
            this.setConfig();
        });

    }

    getComponentSuffixes(): string[] {
        return this.componentSuffixes;
    }

    hasSuffix(suffix: string): boolean {

        return this.componentSuffixes.map((suffix) => suffix.toLowerCase()).includes(suffix.toLowerCase());

    }

    private async setConfig(): Promise<void> {

        this.config = await FileSystem.parseJsonFile<TSLintSchema>(this.fsPath, this.workspace);

        this.setComponentSuffixes();

    }

    private setComponentSuffixes(): void {

        const suffixes = ['Component'];

        /* 
         * Can be:
         * 1. nonexistent
         * 2. `true` (default Angular CLI config)
         * 3. `[true, "Component", "Dialog"]`
         */
        const tslintRule = this.config?.rules?.['component-class-suffix'];

        /* Check we are in the 3rd case */
        if (Array.isArray(tslintRule) && tslintRule.length > 2) {

            /* Removes the first value (`true`)
             * Type cast is required as TypeScript cannot do it itself in this case */
            const tslintSuffixes = tslintRule.slice(1) as string[];

            suffixes.push(...tslintSuffixes);

        }

        /* `Set` removes duplicates */
        this.componentSuffixes = Array.from(new Set(suffixes));

    }

    // private setComponentSuffixes(): void {

    //     const componentSuffixesSet = new Set<string>(['Component', ...(this.userComponentSuffixes || ['Page', 'Pure', 'Entry', 'Exported', 'Element']) ]);

    //     if (this.userComponentSuffixes) {

    //         let hasPureType = false;
    //         let hasPageType = false;
    //         let hasRuntimeType = false;
    //         let hasExportedType = false;
    //         let hasElementType = false;

    //         componentSuffixesSet.forEach((componentSuffixRaw) => {
    //             const componentSuffix = componentSuffixRaw.toLowerCase();
    //             if (Preferences.getComponentTypes('pure').includes(componentSuffix)) {
    //                 hasPureType = true;
    //             } else if (Preferences.getComponentTypes('page').includes(componentSuffix)) {
    //                 hasPageType = true;
    //             } else if (Preferences.getComponentTypes('runtime').includes(componentSuffix)) {
    //                 hasRuntimeType = true;
    //             } else if (Preferences.getComponentTypes('exported').includes(componentSuffix)) {
    //                 hasExportedType = true;
    //             } else if (Preferences.getComponentTypes('element').includes(componentSuffix)) {
    //                 hasElementType = true;
    //             }
    //         });

    //         if (!hasPageType) {
    //             componentSuffixesSet.add('Page');
    //         }
    //         if (!hasPureType) {
    //             componentSuffixesSet.add('Pure');
    //         }
    //         if (!this.angularConfig.isIvy() && !hasRuntimeType) {
    //             componentSuffixesSet.add('Entry');
    //         }
    //         if (!hasExportedType) {
    //             componentSuffixesSet.add('Exported');
    //         }
    //         if (!hasElementType) {
    //             componentSuffixesSet.add('Element');
    //         }
        
    //     }

    //     this.componentSuffixes = Array.from(componentSuffixesSet);

    // }

}