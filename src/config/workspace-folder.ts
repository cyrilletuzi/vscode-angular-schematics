import * as vscode from 'vscode';

import { Output } from '../utils';
import { Collections } from '../schematics';

import { TslintConfig } from './tslint';
import { AngularConfig } from './angular';
import { AngularProject } from './angular-project';

export class WorkspaceFolderConfig implements vscode.WorkspaceFolder {

    uri: vscode.Uri;
    name: string;
    index: number;

    private tslintConfig!: TslintConfig;
    private angularConfig!: AngularConfig;
    collections!: Collections;

    constructor(workspaceFolder: vscode.WorkspaceFolder) {
        this.uri = workspaceFolder.uri;
        this.name = workspaceFolder.name;
        this.index = workspaceFolder.index;
    }

    /**
     * Initialize `tsconfig.json` configuration.
     * **Must** be called after each `new WorkspaceFolderConfig()`
     * (delegated because `async` is not possible on a constructor).
     */
    async init(): Promise<void> {

        const workspaceFolder: vscode.WorkspaceFolder = {
            uri: this.uri,
            name: this.name,
            index: this.index,
        };

        // TODO: [feature] configs could be in parent or subdirectories
        // TODO: [feature] handle custom node_modules folder

        Output.logInfo(`Loading Angular configuration.`);

        const angularConfig = new AngularConfig();
        await angularConfig.init(this.uri.fsPath);
        this.angularConfig = angularConfig;
        
        Output.logInfo(`Loading global TSLint configuration.`);

        const tslintConfig = new TslintConfig();
        await tslintConfig.init(this.uri.fsPath);
        this.tslintConfig = tslintConfig;

        Output.logInfo(`Loading schematics configuration.`);

        const collections = new Collections();
        await collections.init(workspaceFolder, this.getDefaultCollections());
        this.collections = collections;

    }

    /**
     * Get user default collection, otherwise official Angular CLI default collection.
     */
    getDefaultUserCollection(): string {

        return this.angularConfig.defaultUserCollection;

    }

    /**
     * Get default collections (user one + official one).
     */
    getDefaultCollections(): string[] {

        return this.angularConfig.defaultCollections;

    }

    /**
     * Get an Angular projects based on its name, or `undefined`.
     */
    getAngularProject(name: string): AngularProject | undefined {

        return this.angularConfig.projects.get(name);

    }

    /**
     * Get all Angular projects.
     */
    getAngularProjects(): Map<string, AngularProject> {

        return this.angularConfig.projects;

    }

    /**
     * Get all Angular projects' names
     */
    getAngularProjectsNames(): string[] {

        return Array.from(this.angularConfig.projects.keys());

    }

    /**
     * Tells if a project is the root Angular application
     */
    isRootAngularProject(name: string): boolean {

        return (this.angularConfig.rootProjectName === name);

    }

    /**
     * Tells if a component suffix is authorized in tslint.json
     */
    hasComponentSuffix(suffix: string, angularProjectName: string): boolean {

        const angularProject = this.getAngularProject(angularProjectName);

        /* Suffixes can be defined at, in order of priority:
         * 1. project level
         * 2. workspace folder level */
        return ((angularProject?.getComponentSuffixes().length ?? 0) > 0) ?
                angularProject!.hasComponentSuffix(suffix) :
                this.tslintConfig.hasComponentSuffix(suffix);

    }

}
