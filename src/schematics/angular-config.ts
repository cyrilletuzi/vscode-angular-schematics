import * as path from 'path';
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

export class AngularConfig {

    static readonly configPath = 'angular.json';
    static readonly cliCollection = '@schematics/angular';

    private static config: AngularConfigSchema | null = null;

    static async getConfig(cwd: string): Promise<AngularConfigSchema | null> {

        const configPath = path.join(cwd, this.configPath);

        if (!this.config && await Utils.existsAsync(configPath)) {

            return await Utils.parseJSONFile<AngularConfigSchema>(configPath);

        }

        return null;

    }

    static async getDefaultCollection(cwd: string): Promise<string> {

        const angularConfig = await this.getConfig(cwd);

        if (angularConfig && angularConfig.cli) {

            if (angularConfig.cli.defaultCollection) {
                return angularConfig.cli.defaultCollection;
            } else if (angularConfig.cli.schematics && angularConfig.cli.schematics.defaultCollection) {
                return angularConfig.cli.schematics.defaultCollection;
            }

        }

        return this.cliCollection;

    }

    static async getProjects(cwd: string): Promise<Map<string, string>> {

        const projects = new Map<string, string>();

        const angularConfig = await this.getConfig(cwd);

        if (angularConfig && angularConfig.projects) {

            for (const projectName in angularConfig.projects) {

                if (angularConfig.projects.hasOwnProperty(projectName)) {

                    /* The main application will have an empty root but should have a "src" sourceRoot */
                    let projectPath = angularConfig.projects[projectName].root || angularConfig.projects[projectName].sourceRoot;

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

}