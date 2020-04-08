import * as vscode from 'vscode';
import * as path from 'path';

import { defaultAngularCollection, defaultAngularConfigFileNames } from '../defaults';
import { Output } from '../utils';
import { formatCliCommandOptions } from '../generation';

import { Collections } from './schematics';
import { AngularConfig, AngularProject, AngularJsonSchematicsOptionsSchema, TslintConfig } from './angular';
import { ModuleShortcut, ComponentShortcut, ShortcutsTypes } from './shortcuts';

export class WorkspaceFolderConfig implements vscode.WorkspaceFolder {

    uri: vscode.Uri;
    name: string;
    index: number;

    collections!: Collections;
    private tslintConfig!: TslintConfig;
    private angularConfig!: AngularConfig;
    private componentShortcut!: ComponentShortcut;
    private moduleShorcut!: ModuleShortcut;
    private fileWatchers: vscode.FileSystemWatcher[] = [];
    private preferencesWatcher: vscode.Disposable | undefined;

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

        /* Cancel previous file watchers */
        this.disposeWatchers();

        Output.logInfo(`Loading Angular configuration.`);

        const angularConfigFsPath = await this.findAngularConfigFsPath({
            uri: this.uri,
            name: this.name,
            index: this.index,
        });

        const angularWatchers: vscode.FileSystemWatcher[] = [];

        /* Keep only the directory part */
        const workspaceFolderFsPath = path.dirname(angularConfigFsPath);

        if (workspaceFolderFsPath !== this.uri.fsPath) {
            Output.logInfo(`Your Angular project is not at the root of your "${this.name}" workspace folder. Real path: ${workspaceFolderFsPath}`);
        }

        /* Update the workspace folder URI */
        this.uri = vscode.Uri.file(workspaceFolderFsPath);

        const angularConfig = new AngularConfig();
        angularWatchers.push(...(await angularConfig.init({
            uri: this.uri,
            name: this.name,
            index: this.index,
        }, angularConfigFsPath)));
        this.angularConfig = angularConfig;
        
        Output.logInfo(`Loading global TSLint configuration.`);

        const tslintConfig = new TslintConfig();
        const tslintWatcher = await tslintConfig.init(this.uri.fsPath);
        this.tslintConfig = tslintConfig;

        Output.logInfo(`Loading schematics configuration.`);

        const collections = new Collections();
        const collectionsWatchers = await collections.init({
            uri: this.uri,
            name: this.name,
            index: this.index,
        }, this.getDefaultCollections());
        this.collections = collections;

        const componentShortcut = new ComponentShortcut();
        await componentShortcut.init({
            uri: this.uri,
            name: this.name,
            index: this.index,
        });
        this.componentShortcut = componentShortcut;

        /* Check if the `--route` option exists in Angular `module` schematic (Angular >= 8.1) */
        const hasLazyModuleType = this.collections.getCollection(defaultAngularCollection)?.getSchematic('module')?.hasOption('route') ?? false;
        Output.logInfo(`Lazy-loaded module type: ${hasLazyModuleType ? `enabled` : `disabled`}`);

        const moduleShorcut = new ModuleShortcut();
        moduleShorcut.init(hasLazyModuleType);
        this.moduleShorcut = moduleShorcut;

        /* Watch config files */
        this.fileWatchers.push(
            ...angularWatchers,
            tslintWatcher,
            ...collectionsWatchers,
        );
        for (const watcher of this.fileWatchers) {
            watcher.onDidChange(() => {
                Output.logInfo(`Reloading "${this.name}" workspace folder configuration.`);
                this.init();
            });
        }

        /* Watch Code preferences */
        this.preferencesWatcher = vscode.workspace.onDidChangeConfiguration(() => {
            Output.logInfo(`Reloading "${this.name}" workspace folder configuration.`);
            this.init();
        });

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

        return this.angularConfig?.defaultCollections ?? [];

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
     * Get component types
     */
    getComponentTypes(projectName: string): ShortcutsTypes {

        /* Types can be different from one Angular project to another */
        const types = this.getAngularProject(projectName)?.componentShortcut.types ?? this.componentShortcut.types;

        /* `--type` is only supported in Angular >= 9 */
        const hasTypeOption = this.collections.getCollection(defaultAngularCollection)?.getSchematic('component')?.hasOption('type') ?? false;

        for (const [, config] of types) {

            if (config.options.has('type')) {

                const suffix = config.options.get('type') as string;

                /* `--type` is only supported in Angular >= 9 and the component suffix must be authorized in tslint.json */
                if (!hasTypeOption || !this.hasComponentSuffix(projectName, suffix)) {
                    config.options.delete('type');
                    config.choice.description = formatCliCommandOptions(config.options);
                }

            }

        }

        return types;

    }

    /**
     * Get module types
     */
    getModuleTypes(): ShortcutsTypes {
        return this.moduleShorcut.types;
    }

    /**
     * Get the user default value for an option of a schematics
     * @param schematicsFullName Must be the full schematics name (eg. "@schematics/angular")
     */
    getSchematicsOptionDefaultValue<T extends keyof AngularJsonSchematicsOptionsSchema>(
        angularProjectName: string,
        schematicsFullName: string,
        optionName: T,
    ): AngularJsonSchematicsOptionsSchema[T] | undefined {

        const projectDefault = this.getAngularProject(angularProjectName)?.getSchematicsOptionDefaultValue(schematicsFullName, optionName);

        /* Suffixes can be defined at, in order of priority:
         * 1. project level
         * 2. workspace folder level */
        return projectDefault ?? this.angularConfig.getSchematicsOptionDefaultValue(schematicsFullName, optionName);

    }

    /**
     * Tells if a project is the root Angular application
     */
    isRootAngularProject(name: string): boolean {

        return (this.angularConfig.rootProjectName === name);

    }

    /**
     * Cancel all file watchers
     */
    disposeWatchers(): void {

        for (const watcher of this.fileWatchers) {
            watcher.dispose();
        }
        this.fileWatchers = [];

        this.preferencesWatcher?.dispose();

    }

    /**
     * Tells if a component suffix is authorized in tslint.json
     */
    private hasComponentSuffix(angularProjectName: string, suffix: string): boolean {

        const angularProject = this.getAngularProject(angularProjectName);

        /* Suffixes can be defined at, in order of priority:
         * 1. project level
         * 2. workspace folder level */
        return ((angularProject?.getComponentSuffixes().length ?? 0) > 0) ?
                angularProject!.hasComponentSuffix(suffix) :
                this.tslintConfig.hasComponentSuffix(suffix);

    }

    /**
     * Try to find the Angular config file's fs path, or `undefined`
     */
    private async findAngularConfigFsPath(workspaceFolder: vscode.WorkspaceFolder): Promise<string> {

        /* Required to look only in the current workspace folder (otherwise it searches in all folders) */
        const pattern = new vscode.RelativePattern(workspaceFolder, `**/{${defaultAngularConfigFileNames.join(',')}}`);

        /* Third param is the maximum number of results */
        const searchMatches = await vscode.workspace.findFiles(pattern, '**/node_modules/**', 1);

        if (searchMatches.length > 0) {

            Output.logInfo(`Angular config file for "${this.name}" workspace folder found at: ${searchMatches[0].fsPath}`);

            return searchMatches[0].fsPath;

        }

        throw new Error();

    }

}
