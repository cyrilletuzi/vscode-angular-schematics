import * as vscode from 'vscode';

import { defaultAngularCollection } from '../../defaults';
import { FileSystem, Output, JsonValidator } from '../../utils';

import { AngularProject } from './angular-project';
import { AngularJsonSchema, AngularJsonSchematicsOptionsSchema, AngularJsonSchematicsSchema, AngularProjectType } from './json-schema';

export class AngularConfig {

    schematicsDefaults: AngularJsonSchematicsSchema = new Map();
    /** List of projects registered in Angular config file */
    projects = new Map<string, AngularProject>();
    /** User default collection, otherwise official Angular CLI default collection */
    defaultUserCollection = defaultAngularCollection;
    /** User + official default collections */
    defaultCollections: string[] = [];
    /** Root project name */
    rootProjectName = '';
    
    /**
     * Initializes `angular.json` configuration.
     * **Must** be called after each `new Angular()`
     * (delegated because `async` is not possible on a constructor).
     */
    async init(workspaceFolder: vscode.WorkspaceFolder, fsPath: string): Promise<vscode.FileSystemWatcher[]> {

        const unsafeConfig = await FileSystem.parseJsonFile(fsPath);

        const config = this.validateConfig(unsafeConfig);

        this.initDefaultCollections(config);

        Output.logInfo(`Default schematics collection detected in your Angular config: ${this.defaultUserCollection}`);

        this.schematicsDefaults = config.schematics;

        Output.logInfo(`${config.projects.size} Angular project(s) detected.`);

        const watchers = await this.setProjects(workspaceFolder, config);

        watchers.push(vscode.workspace.createFileSystemWatcher(fsPath));

        return watchers;
        
    }

    /**
     * Get the user default value for an option of a schematics
     * @param schematicsFullName Must be the full schematics name (eg. "@schematics/angular")
     */
    getSchematicsOptionDefaultValue<T extends keyof AngularJsonSchematicsOptionsSchema>(schematicsFullName: string, optionName: T): AngularJsonSchematicsOptionsSchema[T] | undefined {
        return this?.schematicsDefaults?.get(schematicsFullName)?.[optionName];
    }

    /**
     * Validate angular.json
     */
    private validateConfig(rawConfig: unknown): AngularJsonSchema {

        const config = JsonValidator.object(rawConfig) ?? {};

        const version = JsonValidator.number(config.version);

        if (!version) {
            Output.logError(`Your Angular config file must contain \`"version" : 1\`, please correct it.`);
            throw new Error();
        }

        const possibleProjectTypes: AngularProjectType[] = ['application', 'library'];

        const projects = new Map(Object.entries(JsonValidator.object(config.projects) ?? {})
            .map(([name, rawOptions]) => {
                
                const options = JsonValidator.object(rawOptions) ?? {};

                const projectTypeRaw = JsonValidator.string(options.projectType) ?? '';
                let projectType: AngularProjectType = 'application';

                /* `projectType` is supposed to be required, but default to `application` for safety */
                if ((possibleProjectTypes as string[]).includes(projectTypeRaw)) {
                    projectType = projectTypeRaw  as AngularProjectType;
                } else {
                    Output.logWarning(`Your Angular configuration file should contain a "projectType" property with "application" or "library" for your "${name}" project. Default to "application".`);
                }

                let root = JsonValidator.string(options.root);
                if (root === undefined) {
                    root = '';
                    Output.logWarning(`Your Angular configuration file should contain a "root" string property for your "${name}" project. Default to "".`);
                }

                return [name, {
                    projectType,
                    root,
                    sourceRoot: JsonValidator.string(options.sourceRoot),
                    schematics: this.validateConfigSchematics(options.schematics),
                }];
            }));

        if (projects.size === 0) {
            Output.logWarning(`No "projects" detected in your Angular config file. You should correct that.`);
        }

        return {
            version,
            cli: {
                defaultCollection: JsonValidator.string(JsonValidator.object(config.cli)?.defaultCollection),
            },
            schematics: this.validateConfigSchematics(config.schematics),
            projects,
        };

    }

    /**
     * Validate angular.json "schematics" property
     */
    private validateConfigSchematics(config: unknown): AngularJsonSchematicsSchema {

        return new Map(Object.entries(JsonValidator.object(config) ?? {})
            .map(([name, options]) => [name, {
                flat: JsonValidator.boolean(JsonValidator.object(options)?.flat),
            }]));

    }

    /**
     * Initialize default collections
     */
    private initDefaultCollections(config: Pick<AngularJsonSchema, 'cli'>): void {

        /* Take `defaultCollection` defined in `angular.json`, or defaults to official collection */
        this.defaultUserCollection = config.cli?.defaultCollection ?? defaultAngularCollection;

        /* `Set` removes duplicates */
        this.defaultCollections = Array.from(new Set([this.defaultUserCollection, defaultAngularCollection]));

    }

    /**
     * Set all projects defined in `angular.json`
     */
    private async setProjects(workspaceFolder: vscode.WorkspaceFolder, angularConfig: Pick<AngularJsonSchema, 'projects'>): Promise<vscode.FileSystemWatcher[]> {

        /* Start from scratch (can be recalled via watcher) */
        this.rootProjectName = '';
        this.projects.clear();
        const watchers: vscode.FileSystemWatcher[] = [];

        /* Transform Angular config with more convenient information for this extension */
        for (const [name, projectConfig] of angularConfig.projects) {

            const project = new AngularProject(name, projectConfig);
            watchers.push(await project.init(workspaceFolder));

            this.projects.set(name, project);

            if (!this.rootProjectName && (projectConfig.root === '')) {

                this.rootProjectName = name;

                Output.logInfo(`"${name}" project is the root Angular project.`);

            }

        }

        return watchers;

    }

}
