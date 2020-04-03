import * as vscode from 'vscode';
import * as path from 'path';

import { defaultAngularCollection } from '../defaults';
import { FileSystem, Watchers, Output } from '../utils';

import { AngularJsonProjectSchema, AngularProject } from './angular-project';

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

    /** List of projects registered in Angular config file */
    projects = new Map<string, AngularProject>();
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
    private defaultUserCollection = defaultAngularCollection;
    /** User and official default collections */
    private defaultCollections: string[] = [];
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

                Output.logInfo(`Angular config file name detected: "${fileName}"`);

                /* Stop the iteration, we have a config */
                break;

            }

        }

        this.setDefaultCollections();

        await this.setProjects(workspaceFsPath);

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
     * Get all projects' names
     */
    getProjectsNames(): string[] {
        return Array.from(this.projects.keys());
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
        this.defaultUserCollection = this.config?.cli?.defaultCollection ?? defaultAngularCollection;

        Output.logInfo(`Default schematics collection detected in ${this.fileNames[0]}: ${this.defaultUserCollection}`);

        /* `Set` removes duplicates */
        this.defaultCollections = Array.from(new Set([this.defaultUserCollection, defaultAngularCollection]));

    }

    /**
     * Set all projects defined in `angular.json`
     */
    private async setProjects(workspaceFsPath: string): Promise<void> {

        /* Get `projects` in `angular.json`*/
        const projectsFromConfig: [string, AngularJsonProjectSchema][] = this.config?.projects ? Object.entries(this.config?.projects) : [];

        if (projectsFromConfig.length > 0) {
            Output.logInfo(`${projectsFromConfig.length} Angular project(s) detected.`);
        } else {
            Output.logWarning(`No Angular project detected. Check your angular.json configuration.`);
        }

        /* Transform Angular config with more convenient information for this extension */
        for (const [name, config] of projectsFromConfig) {

            const project = new AngularProject(name, config);
            await project.init(workspaceFsPath);

            this.projects.set(name, project);

        }

    }

}
