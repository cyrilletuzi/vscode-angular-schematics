import * as vscode from 'vscode';
import * as path from 'path';

import { FileSystem } from './file-system';
import { Watchers } from './watchers';
import { TypescriptConfig } from './config-typescript';
import { PackageJsonConfig } from './config-package-json';

export interface AngularJsonProjectSchema {
    /** Main application: empty. Sub-applications/libraries: `<projects-root>/hello` */
    root: string;
    /** Main application: `src`. Sub-applications/libraries: `<projects-root>/hello/src` */
    sourceRoot?: string;
}

export interface AngularJsonSchema {
    cli?: {
        defaultCollection?: string;
    };
    projects?: {
        [key: string]: AngularJsonProjectSchema;
    };
}

export class AngularConfig {

    // TODO: check if other config files are possible (.angular.json, angular-cli.json...)
    // TODO: could be in a subdirectory
    /** Basename of official Angular config file */
    static readonly fileName = 'angular.json';
    /** Official default collection of Angular CLI */
    static readonly defaultAngularCollection = '@schematics/angular';
    /** User default collection, otherwise official Angular CLI default collection */
    private defaultUserCollection!: string;
    /** List of projects registered in Angular config file */
    private projects!: Map<string, AngularJsonProjectSchema>;
    /** Tells if Angular is in Ivy mode */
    private ivy!: boolean;
    /** File system path of the Angular config file */
    private fsPath: string;
    /** Values from the Angular config file */
    private config!: AngularJsonSchema | undefined;
    
    constructor(
        private workspace: vscode.WorkspaceFolder,
        private typescriptConfig: TypescriptConfig,
        private packageJsonConfig: PackageJsonConfig,
    ) {
        this.fsPath = path.join(this.workspace.uri.fsPath, AngularConfig.fileName);
    }

    async init(): Promise<void> {

        this.config = await FileSystem.parseJsonFile<AngularJsonSchema>(this.fsPath, this.workspace);

        this.defaultUserCollection = this.config?.cli?.defaultCollection ?? AngularConfig.defaultAngularCollection;

        // TODO: previously, projects with no root and sourceRoot where filtered
        // TODO: previsouly, we removed trailing slash
        this.projects = new Map(this.config?.projects ? Object.entries(this.config?.projects) : []);

        this.setIvy();

        // TODO: check it still works
        Watchers.create(this.fsPath, () => {
            this.init();
        });

    }

    /**
     * User default collection, otherwise official Angular CLI default collection.
     */
    getDefaultUserCollection(): string {
        return this.defaultUserCollection;
    }

    /**
     * List of projects registered in Angular config file.
     */
    getProjects(): Map<string, AngularJsonProjectSchema> {
        return this.projects;
    }

    /**
     * Tells if Angular is in Ivy mode
     */
    isIvy(): boolean {
        return this.ivy;
    }

    /**
     * Tells if a project is the root application
     */
    isRootProject(name: string): boolean {

        // TODO: it can be something else than src?
        return (this.projects.get(name)?.root === 'src');

    }

    /**
     * Try to resolve if Angular is in Ivy mode.
     * If it cannot be resolved, it will default to `false` for compatibility.
     */
    private setIvy(): void {

        const angularMajorVersion = this.packageJsonConfig.getAngularMajorVersion() ?? 0;
        const enableIvy = this.typescriptConfig.getEnableIvy();

        /** 
         * - Angular <= 7: Ivy does not exist
         * - Angular 8: Ivy is *disabled* by default or enabled if `enableIvy`is set to `true`
         * - Angular >= 9: Ivy is *enabled* by default or disabled if `enableIvy`is set to `false`
         */
        this.ivy = (((angularMajorVersion === 8) && (enableIvy === true)) || ((angularMajorVersion >= 9) && (enableIvy !== false)));

    }

}
