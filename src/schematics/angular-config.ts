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
}

export interface TSConfigSchema {
    angularCompilerOptions?: {
        enableIvy?: boolean;
    };
}

export interface PackageJSONSchema {
    dependencies?: {
        "@angular/core"?: string;
    };
}

export class AngularConfig {

    static readonly configPath = 'angular.json';
    static readonly packageJSONPath = 'package.json';
    static readonly tsConfigPath = 'tsconfig.json';
    static readonly cliCollection = '@schematics/angular';
    static defaultCollection = '@schematics/angular';
    static projects = new Map<string, string>();
    static rootProject = '';
    static isIvy = false;

    private static initialized = false;
    private static config: AngularConfigSchema | null = null;
    private static watcher: vscode.FileSystemWatcher;

    static async init(cwd: string): Promise<void> {

        if (!this.initialized) {

            await this.initAngularConfig(cwd);

            this.isIvy = await this.detectIsIvy(cwd);

            this.initialized = true;

        }

    }

    private static async initAngularConfig(cwd: string): Promise<void> {

        const configPath = path.join(cwd, this.configPath);

        if (await Utils.existsAsync(configPath)) {

            this.config = await Utils.parseJSONFile<AngularConfigSchema>(configPath);

            this.defaultCollection = this.getDefaultCollection(this.config);

            this.projects = this.getProjects(this.config);

            if (!this.watcher) {

                /* Listen to change in config file to update config */
                this.watcher = vscode.workspace.createFileSystemWatcher(configPath, true, undefined, true);

                this.watcher.onDidChange(() => {
                    this.config = null;
                    this.init(cwd);
                });

            }

        }

    }

    private static async detectIsIvy(cwd: string): Promise<boolean> {

        const tsConfigPath = path.join(cwd, this.tsConfigPath);
        const packageJSONPath = path.join(cwd, this.packageJSONPath);

        if (await Utils.existsAsync(tsConfigPath) && await Utils.existsAsync(packageJSONPath)) {

            const tsConfig = await Utils.parseJSONFile<TSConfigSchema>(tsConfigPath);
            const packageJSON = await Utils.parseJSONFile<PackageJSONSchema>(packageJSONPath);

            if (tsConfig && packageJSON && packageJSON.dependencies) {

                const angularFullVersion: string = packageJSON.dependencies['@angular/core'] || '0';
                const angularPinnedVersion: string = angularFullVersion.replace('^', '').replace('~', '');
                const angularMajorVersion = Number.parseInt(angularPinnedVersion.substr(0, 1), 10);

                let tsConfigIvyEnabled: boolean | undefined;
                if (tsConfig && tsConfig.angularCompilerOptions && 'enableIvy' in tsConfig.angularCompilerOptions) {
                    tsConfigIvyEnabled = tsConfig.angularCompilerOptions.enableIvy;
                }


                if ((angularMajorVersion === 8) && (tsConfigIvyEnabled === true)) {
                    return true;
                } else if ((angularMajorVersion >= 9) && (tsConfigIvyEnabled !== false)) {
                    return true;
                }

            }

        }

        return false;

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

                        if (projectPath === 'src') {
                            this.rootProject = projectName;
                        } 

                        projects.set(projectName, projectPath);

                    }

                }

            }

        }

        return projects;

    }

}