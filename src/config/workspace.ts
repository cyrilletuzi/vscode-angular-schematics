import * as vscode from 'vscode';

import { Output } from '../utils';
import { Schematics } from '../schematics';

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
    schematics!: Schematics;

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

        Output.logInfo(`Loading "package.json" configuration.`);

        const packageJsonConfig = new PackageJsonConfig();
        await packageJsonConfig.init(this.uri.fsPath);

        Output.logInfo(`Loading TypeScript configuration.`);

        const typescriptConfig = new TypescriptConfig();
        await typescriptConfig.init(this.uri.fsPath);

        Output.logInfo(`Loading TSLint configuration.`);

        const tslintConfig = new TslintConfig();
        await tslintConfig.init(this.uri.fsPath);

        Output.logInfo(`Loading Angular configuration.`);

        const angularConfig = new AngularConfig();
        await angularConfig.init(this.uri.fsPath);

        // TODO: should be retrigger if package.json or tsconfig.json change
        this.setIvy();

        Output.logInfo(`Loading schematics configuration.`);

        const schematics = new Schematics(this);
        await schematics.init();

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
