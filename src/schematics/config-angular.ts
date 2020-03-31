import * as vscode from 'vscode';
import * as path from 'path';

import { FileSystem } from './file-system';
import { Watchers } from './watchers';
import { TypescriptConfig } from './config-typescript';
import { PackageJsonConfig } from './config-package-json';

type AngularProjectType = 'application' | 'library';

interface AngularJsonProjectSchema {
    projectType: AngularProjectType;
    /** Main application: empty. Sub-applications/libraries: `<projects-root>/hello` */
    root: string;
    /** Main application: `src`. Sub-applications/libraries: `<projects-root>/hello/src` */
    sourceRoot?: string;
}

interface AngularJsonSchema {
    cli?: {
        defaultCollection?: string;
    };
    projects?: {
        [key: string]: AngularJsonProjectSchema;
    };
}

export interface AngularProject {
    type: AngularProjectType;
    sourcePath: string;
    isRoot: boolean;
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
    private projects!: Map<string, AngularProject>;
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

        this.setProjects();

        // TODO: should be retrigger if package.json or tsconfig.json change
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
    getProjects(): Map<string, AngularProject> {
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
        return this.projects.get(name)?.isRoot ?? false;

    }

    private setProjects(): void {

        const projectsFromConfig = this.config?.projects ? Object.entries(this.config?.projects) : [];

        const projects: [string, AngularProject][] = projectsFromConfig.map(([projectName, projectConfig]) => {

            /* `projectType` is supposed to be required, but default to `application` for safety */
            const type = projectConfig.projectType ? projectConfig.projectType : 'application';
            
            /* These folders are imposed by Angular CLI.
             * See https://github.com/angular/angular-cli/blob/9190f622365b8eb85b7d8828f170959ded643518/packages/schematics/angular/utility/project.ts#L17 */
            const fixedFolder = (projectConfig.projectType === 'library') ? 'lib' : 'app';

            /* Project's path relative to workspace (ie. where `angular.json` is).
             * For the main application, it's empty as it's directly in the workspace.
             * For sub-applications/libraries, it's `<projects-root>/hello-world`. */
            const root = projectConfig.root ?? '';

            /* Project's source path relative to workspace (ie. where `angular.json` is).
             * For the main application, it's `src` by default but can be customized.
             * For sub-applications/libraries, it's `<projects-root>/hello-world/<src-or-something-else>`.
             * Usage of `posix` is important here, as we want slashes on all platforms, including Windows. */
            const sourceRoot = projectConfig.sourceRoot ?? path.posix.join(root, 'src');

            /* Default for:
             * - root application: `src/app`
             * - sub-application: `projects/hello-world/src/app`
             * - sub-library: `projects/hello-world/src/lib`
             * Usage of `posix` is important here, as we want slashes on all platforms, including Windows. */
            const sourcePath = path.posix.join(sourceRoot, fixedFolder);

            const isRoot = ((projectConfig.root === '') && (sourceRoot === 'src'));

            return [projectName, {
                type,
                sourcePath,
                isRoot,
            }];
        });

        this.projects = new Map(projects);

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
