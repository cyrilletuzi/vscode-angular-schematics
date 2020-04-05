import * as vscode from 'vscode';
import * as path from 'path';

import { defaultAngularCollection } from '../../defaults';
import { FileSystem, Watchers, Output } from '../../utils';

import { AngularProject } from './angular-project';
import { AngularJsonSchema, AngularJsonProjectSchema, AngularJsonSchematicsOptionsSchema } from './json-schema';

export class AngularConfig {

    /** List of projects registered in Angular config file */
    projects = new Map<string, AngularProject>();
    /** User default collection, otherwise official Angular CLI default collection */
    defaultUserCollection = defaultAngularCollection;
    /** User + official default collections */
    defaultCollections: string[] = [];
    /** Root project name */
    rootProjectName = '';
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
    
    /**
     * Initializes `angular.json` configuration.
     * **Must** be called after each `new Angular()`
     * (delegated because `async` is not possible on a constructor).
     */
    async init(workspaceFolder: vscode.WorkspaceFolder): Promise<void> {

        let fsPath = '';

        /* Try the different possible file names */
        for (const fileName of this.fileNames) {

            fsPath = path.join(workspaceFolder.uri.fsPath, fileName);

            if (await FileSystem.isReadable(fsPath, { silent: true })) {

                /* Keep only the right file name */
                this.fileNames = [fileName];

                Output.logInfo(`Angular config file name detected: "${fileName}"`);

                /* Stop the iteration, we have a config */
                break;

            }

        }

        /* Workspace folder should have an Angular config file */
        if (this.fileNames.length !== 1) {
            throw new Error();
        }

        this.config = await FileSystem.parseJsonFile<AngularJsonSchema>(fsPath);

        this.setDefaultCollections();

        await this.setProjects(workspaceFolder);

        Watchers.watchFile(fsPath, () => {
            this.init(workspaceFolder);
        });
        
    }

    /**
     * Get the user default value for an option of a schematics
     * @param schematicsFullName Must be the full schematics name (eg. "@schematics/angular")
     */
    getSchematicsOptionDefaultValue<T extends keyof AngularJsonSchematicsOptionsSchema>(schematicsFullName: string, optionName: T): AngularJsonSchematicsOptionsSchema[T] | undefined {
        return this.config?.schematics?.[schematicsFullName]?.[optionName];
    }

    /**
     * Set default collections (user one + official one)
     */
    private setDefaultCollections(): void {

        /* Take `defaultCollection` defined in `angular.json`, or defaults to official collection */
        this.defaultUserCollection = this.config?.cli?.defaultCollection ?? defaultAngularCollection;

        Output.logInfo(`Default schematics collection detected in "${this.fileNames[0]}": ${this.defaultUserCollection}`);

        /* `Set` removes duplicates */
        this.defaultCollections = Array.from(new Set([this.defaultUserCollection, defaultAngularCollection]));

    }

    /**
     * Set all projects defined in `angular.json`
     */
    private async setProjects(workspaceFolder: vscode.WorkspaceFolder): Promise<void> {

        /* Start from scratch (can be recalled via watcher) */
        this.rootProjectName = '';
        this.projects.clear();

        /* Get `projects` in `angular.json`*/
        const projectsFromConfig: [string, AngularJsonProjectSchema][] = this.config?.projects ? Object.entries(this.config?.projects) : [];

        if (projectsFromConfig.length > 0) {
            Output.logInfo(`${projectsFromConfig.length} Angular project(s) detected.`);
        } else {
            Output.logWarning(`No Angular project detected. Check your "${this.fileNames[0]}" configuration.`);
        }

        /* Transform Angular config with more convenient information for this extension */
        for (const [name, config] of projectsFromConfig) {

            const project = new AngularProject(name, config);
            await project.init(workspaceFolder);

            this.projects.set(name, project);

            if (!this.rootProjectName && (config.root === '')) {

                this.rootProjectName = name;

                Output.logInfo(`"${name}" project is the root Angular project.`);

            }

        }

    }

}
