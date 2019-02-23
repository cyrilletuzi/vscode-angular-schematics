import * as path from 'path';
import * as vscode from 'vscode';
import { Utils } from './utils';

export interface AngularConfigSchema {
    cli?: {
        defaultCollection?: string;
        schematics?: {
            defaultCollection?: string;
        };
    };
    projects?: {
        [key: string]: {
            root: string;
            sourceRoot?: string;
        };
    };
    defaultProject?: string;
}

export class AngularConfig {

    static readonly configPath = 'angular.json';
    static readonly cliCollection = '@schematics/angular';
    static defaultCollection = '@schematics/angular';
    static projects = new Map<string, string>();
    static defaultProject = '';

    private static config: AngularConfigSchema | null = null;
    private static watcher: vscode.FileSystemWatcher;

    static async init(cwd: string): Promise<void> {

        const configPath = path.join(cwd, this.configPath);

        if (!this.config && await Utils.existsAsync(configPath)) {

            this.config = await Utils.parseJSONFile<AngularConfigSchema>(configPath);

            this.defaultCollection = this.getDefaultCollection(this.config);

            this.projects = this.getProjects(this.config);

            this.defaultProject = this.getDefaultProject(this.config);

            if (!this.watcher) {

                /* Listen to change in config file to update config */
                this.watcher = vscode.workspace.createFileSystemWatcher(configPath, true, undefined, true);

                this.watcher.onDidChange(() => {
                    this.config = null;
                    this.init(cwd);
                })

            }

        }

    }

    private static getDefaultCollection(config: AngularConfigSchema | null): string {

        if (config && config.cli) {

            if (config.cli.defaultCollection) {
                return config.cli.defaultCollection;
            } else if (config.cli.schematics && config.cli.schematics.defaultCollection) {
                return config.cli.schematics.defaultCollection;
            }

        }

        return this.cliCollection;

    }

    private static getProjects(config: AngularConfigSchema | null): Map<string, string> {

        const projects = new Map<string, string>();

        if (config && config.projects) {

            for (const projectName in config.projects) {

                if (config.projects.hasOwnProperty(projectName)) {

                    /* The main application will have an empty root but should have a "src" sourceRoot */
                    let projectPath = config.projects[projectName].root || config.projects[projectName].sourceRoot;

                    /* If both are empty, we can't detect the project path so we don't add it to the list */
                    if (projectPath) {

                        /* Angular CLI inconsistently adds a trailing "/" on some projects paths */
                        projectPath = projectPath.endsWith('/') ? projectPath.slice(0, -1) : projectPath;

                        projects.set(projectName, projectPath);

                    }

                }

            }

        }

        return projects;

    }

    private static getDefaultProject(config: AngularConfigSchema | null): string {

        return config && config.defaultProject ? config.defaultProject : '';

    }

}