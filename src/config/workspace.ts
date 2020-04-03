import * as vscode from 'vscode';

import { Output } from '../utils';
import { Collections } from '../schematics';

import { PackageJsonConfig } from './package-json';
import { TslintConfig } from './tslint';
import { TypescriptConfig } from './typescript';
import { AngularConfig } from './angular';

export class WorkspaceConfig implements vscode.WorkspaceFolder {

    uri: vscode.Uri;
    name: string;
    index: number;

    packageJsonConfig!: PackageJsonConfig;
    tslintConfig!: TslintConfig;
    typescriptConfig!: TypescriptConfig;
    angularConfig!: AngularConfig;
    collections!: Collections;

    /** Tells if Angular is in Ivy mode */
    private ivy = false;

    constructor(workspace: vscode.WorkspaceFolder) {
        this.uri = workspace.uri;
        this.name = workspace.name;
        this.index = workspace.index;
    }

    /**
     * Initializes `tsconfig.json` configuration.
     * **Must** be called after each `new WorkspaceConfig()`
     * (delegated because `async` is not possible on a constructor).
     */
    async init(): Promise<void> {

        // TODO: configs could be in parent or subdirectories
        // TODO: config per Angular project
        // TODO: handle custom node_modules folder

        Output.logInfo(`Loading "package.json" configuration.`);

        const packageJsonConfig = new PackageJsonConfig();
        await packageJsonConfig.init(this.uri.fsPath);
        this.packageJsonConfig = packageJsonConfig;

        Output.logInfo(`Loading TypeScript configuration.`);

        const typescriptConfig = new TypescriptConfig();
        await typescriptConfig.init(this.uri.fsPath);
        this.typescriptConfig = typescriptConfig;

        Output.logInfo(`Loading global TSLint configuration.`);

        const tslintConfig = new TslintConfig();
        await tslintConfig.init(this.uri.fsPath);
        this.tslintConfig = tslintConfig;

        Output.logInfo(`Loading Angular configuration.`);

        const angularConfig = new AngularConfig();
        await angularConfig.init(this.uri.fsPath);
        this.angularConfig = angularConfig;

        // TODO: should be retrigger if package.json or tsconfig.json change
        this.setIvy();

        Output.logInfo(`Loading schematics configuration.`);

        const collections = new Collections(this.uri.fsPath);
        await collections.init();
        this.collections = collections;

    }

    /**
     * Tells if Angular is in Ivy mode (default in Angular >= 9)
     */
    isIvy(): boolean {
        return this.ivy;
    }

    /**
     * Try to resolve if Angular is in Ivy mode (default in Angular >= 9).
     * If it cannot be resolved, it will default to `false` for compatibility.
     */
    private setIvy(): void {

        let ivy = false;

        /* Get major version of `@angular/core` package */
        const angularMajorVersion = this.packageJsonConfig.getAngularMajorVersion() ?? 0;

        /* Ivy can be manually enabled/disabled with `enableIvy` in `tsconfig.json` */
        const enableIvy = this.typescriptConfig.getEnableIvy();
        
        /* Ivy exists since Angular 8, but disabled by default */
        if ((angularMajorVersion === 8) && (enableIvy === true)) {
            ivy = true;
        }
        /* Ivy is enabled by default in Angular >= 9 */
        else if ((angularMajorVersion >= 9) && (enableIvy !== false)) {
            ivy = true;
        }

        this.ivy = ivy;

        Output.logInfo(`Angular Ivy detected as ${this.ivy ? `enabled` : `disabled`}.`);

    }

}
