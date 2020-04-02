import * as vscode from 'vscode';
import * as path from 'path';

import { FileSystem, Watchers, Output } from '../utils';

export type AngularProjectType = 'application' | 'library';

export interface AngularProject {
    /** Angular projects are `application` by default, but can be `library` too */
    type: AngularProjectType;
    sourcePath: string;
    /** Is it the root project? */
    isRoot: boolean;
}

interface AngularJsonProjectSchema {
    /** Angular projects are `application` by default, but can be `library` too */
    projectType: AngularProjectType;
    /** Main application: empty. Sub-applications/libraries: `<projects-root>/hello` */
    root: string;
    /** Main application: `src`. Sub-applications/libraries: `<projects-root>/hello/src` */
    sourceRoot?: string;
}

/** Description of `angular.json` */
interface AngularJsonSchema {
    cli?: {
        /**
         * If set, Angular CLI will use this collection by default instead of the official one.
         * For example, it is set to `@ionic/angular-toolkit` in Ionic projects.
         */
        defaultCollection?: string;
    };
    /**
     * List of Angular projects.
     * While it's optional in CLI JSON schema, a workspace should have at least one project.
     */
    projects?: {
        /** Name of the project */
        [key: string]: AngularJsonProjectSchema;
    };
}

export class AngularConfig {

    /** Official default collection of Angular CLI */
    static readonly defaultAngularCollection = '@schematics/angular';
    // TODO: could be in a subdirectory
    /** 
     * Possible basenames of official Angular config file
     * From https://github.com/angular/angular-cli/blob/master/packages/angular/cli/utilities/project.ts
     */
    private fileNames = [
        'angular.json',
        '.angular.json',
        'angular-cli.json',
        '.angular-cli.json',
    ];
    /** Values from the Angular config file */
    private config: AngularJsonSchema | undefined;
    /** User default collection, otherwise official Angular CLI default collection */
    private defaultUserCollection = AngularConfig.defaultAngularCollection;
    /** User and official default collections */
    private defaultCollections: string[] = [];
    /** List of projects registered in Angular config file */
    private projects = new Map<string, AngularProject>();
    private watcher: vscode.FileSystemWatcher | undefined;
    
    /**
     * Initializes `angular.json` configuration.
     * **Must** be called after each `new Angular()`
     * (delegated because `async` is not possible on a constructor).
     */
    async init(workspaceFsPath: string): Promise<void> {

        let fsPath = '';

        /* Try the different possible file names */
        for (const fileName of this.fileNames) {

            fsPath = path.join(workspaceFsPath, fileName);

            this.config = await FileSystem.parseJsonFile<AngularJsonSchema>(fsPath);

            if (this.config) {

                /* Keep only the right file name */
                this.fileNames = [fileName];

                Output.logInfo(`${fileName} config file detected.`);

                /* Stop the iteration, we have a config */
                break;

            }

        }

        this.setDefaultCollections();

        this.setProjects();

        /* Watcher must be set just once */
        if (this.config && !this.watcher) {

            this.watcher = Watchers.watchFile(fsPath, () => {
                this.init(workspaceFsPath);
            });

        }
        
    }

    /**
     * Get user default collection, otherwise official Angular CLI default collection.
     */
    getDefaultUserCollection(): string {
        return this.defaultUserCollection;
    }

    /**
     * Get default collections (user one and official one)
     */
    getDefaultCollections(): string[] {
        return this.defaultCollections;
    }

    /**
     * List of projects registered in Angular config file.
     */
    getProjects(): Map<string, AngularProject> {
        return this.projects;
    }

    /**
     * Tells if a project is the root application
     */
    isRootProject(name: string): boolean {

        return this.projects.get(name)?.isRoot ?? false;

    }

    /**
     * Set default collections (user one + official one)
     */
    private setDefaultCollections(): void {

        /* Take `defaultCollection` defined in `angular.json`, or defaults to official collection */
        this.defaultUserCollection = this.config?.cli?.defaultCollection ?? AngularConfig.defaultAngularCollection;

        Output.logInfo(`${this.defaultUserCollection} default schematics collection detected.`);

        /* `Set` removes duplicates */
        this.defaultCollections = Array.from(new Set([this.defaultUserCollection, AngularConfig.defaultAngularCollection]));

    }

    /**
     * Set all projects defined in `angular.json`
     */
    private setProjects(): void {

        /* Get `projects` in `angular.json`*/
        const projectsFromConfig: [string, AngularJsonProjectSchema][] = this.config?.projects ? Object.entries(this.config?.projects) : [];

        Output.logInfo(`${projectsFromConfig.length} Angular projects detected.`);

        /* Transform Angular config with more convenient information for this extension */
        const projects: [string, AngularProject][] = projectsFromConfig.map(([name, config]) => {

            Output.logInfo(`Loading configuration of "${name}" project.`);

            /* `projectType` is supposed to be required, but default to `application` for safety */
            const type = config.projectType ? config.projectType : 'application';

            Output.logInfo(`"${name}" project's type: ${type}.`);
            
            /* These folders are imposed by Angular CLI.
             * See https://github.com/angular/angular-cli/blob/9190f622365b8eb85b7d8828f170959ded643518/packages/schematics/angular/utility/project.ts#L17 */
            const fixedFolder = (config.projectType === 'library') ? 'lib' : 'app';

            /* Project's path relative to workspace (ie. where `angular.json` is).
             * For the main application, it's empty as it's directly in the workspace.
             * For sub-applications/libraries, it's `<projects-root>/hello-world`. */
            const root = config.root ?? '';

            /* Project's source path relative to workspace (ie. where `angular.json` is).
             * For the main application, it's `src` by default but can be customized.
             * For sub-applications/libraries, it's `<projects-root>/hello-world/<src-or-something-else>`.
             * Usage of `posix` is important here, as we want slashes on all platforms, including Windows. */
            const sourceRoot = config.sourceRoot ?? path.posix.join(root, 'src');

            /* Default for:
             * - root application: `src/app`
             * - sub-application: `projects/hello-world/src/app`
             * - sub-library: `projects/hello-world/src/lib`
             * Usage of `posix` is important here, as we want slashes on all platforms, including Windows. */
            const sourcePath = path.posix.join(sourceRoot, fixedFolder);

            Output.logInfo(`"${name}" project source path: ${sourcePath}.`);

            /* If the project is in `/src/`, it's the root project */
            const isRoot = ((config.root === '') && (sourceRoot === 'src'));

            if (isRoot) {
                Output.logInfo(`"${name}" project is the root project.`);
            }

            return [name, {
                type,
                sourcePath,
                isRoot,
            }];

        });

        this.projects = new Map(projects);

    }

}
