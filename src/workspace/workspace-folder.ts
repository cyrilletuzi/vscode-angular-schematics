import * as vscode from 'vscode';
import { Utils } from 'vscode-uri';

import { angularCollectionName, angularConfigFileNames } from '../defaults';
import { isSchematicsProActive, Output } from '../utils';
import { formatCliCommandOptions } from '../generation';

import { Collections } from './schematics';
import { AngularConfig, AngularProject, AngularJsonSchematicsOptionsSchema } from './angular';
import { ModuleShortcut, ComponentShortcut, ShortcutsTypes } from './shortcuts';
import { LintConfig } from './angular/lint';

export class WorkspaceFolderConfig implements vscode.WorkspaceFolder {

    uri: vscode.Uri;
    name: string;
    index: number;

    collections!: Collections;
    private lintConfig!: LintConfig;
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

        const angularConfigUri = await this.findAngularConfigUri({
            uri: this.uri,
            name: this.name,
            index: this.index,
        });

        const angularWatchers: vscode.FileSystemWatcher[] = [];

        /* Keep only the directory part */
        const workspaceFolderUri = Utils.dirname(angularConfigUri);

        if (workspaceFolderUri.path !== this.uri.path) {
            Output.logInfo(`Your Angular project is not at the root of your "${this.name}" workspace folder. Real path: ${workspaceFolderUri.path}`);
        }

        /* Update the workspace folder URI */
        this.uri = workspaceFolderUri;

        const angularConfig = new AngularConfig();
        angularWatchers.push(...(await angularConfig.init({
            uri: this.uri,
            name: this.name,
            index: this.index,
        }, angularConfigUri)));
        this.angularConfig = angularConfig;

        Output.logInfo(`Loading global lint configuration.`);

        const lintConfig = new LintConfig();
        const lintWatcher = await lintConfig.init(this.uri);
        this.lintConfig = lintConfig;

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
        const hasLazyModuleType = this.collections.getCollection(angularCollectionName)?.getSchematic('module')?.hasOption('route') ?? false;
        Output.logInfo(`Lazy-loaded module type: ${hasLazyModuleType ? `enabled` : `disabled`}`);

        const moduleShorcut = new ModuleShortcut();
        moduleShorcut.init(hasLazyModuleType);
        this.moduleShorcut = moduleShorcut;

        /* Watch config files */
        this.fileWatchers.push(
            ...angularWatchers,
            ...collectionsWatchers,
        );
        if (lintWatcher) {
            this.fileWatchers.push(lintWatcher);
        }
        for (const watcher of this.fileWatchers) {
            watcher.onDidChange(() => {
                if (!isSchematicsProActive()) {
                    Output.logInfo(`Reloading "${this.name}" workspace folder configuration.`);
                    this.init().catch(() => { });
                } else {
                    watcher.dispose();
                }
            });
        }

        /* Watch Code preferences */
        this.preferencesWatcher = vscode.workspace.onDidChangeConfiguration(() => {
            if (!isSchematicsProActive()) {
                Output.logInfo(`Reloading "${this.name}" workspace folder configuration.`);
                this.init().catch(() => { });
            } else {
                this.preferencesWatcher?.dispose();
            }
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
    getAngularProject(name: string): AngularProject | undefined {

        return this.angularConfig.projects.get(name);

    }

    /**
     * Get all Angular projects.
     */
    getAngularProjects(): Map<string, AngularProject> {

        return this.angularConfig.projects;

    }

    /**
     * Get component types
     */
    getComponentTypes(projectName: string): ShortcutsTypes {

        /* Types can be different from one Angular project to another */
        const types = this.getAngularProject(projectName)?.componentShortcut.types ?? this.componentShortcut.types;

        /* `--type` is only supported in Angular >= 9 */
        const hasTypeOption = this.collections.getCollection(angularCollectionName)?.getSchematic('component')?.hasOption('type') ?? false;

        for (const [, config] of types) {

            if (config.options.has('type')) {

                const suffix = config.options.get('type') as string;

                /* `--type` is only supported in Angular >= 9 and the component suffix must be authorized in lint configuration */
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
     * Tells if a component suffix is authorized in lint configuration
     */
    hasComponentSuffix(angularProjectName: string, suffix: string): boolean {

        const angularProject = this.getAngularProject(angularProjectName);

        /* Suffixes can be defined at, in order of priority:
         * 1. project level
         * 2. workspace folder level */
        return (angularProject && (angularProject.getComponentSuffixes().length ?? 0) > 0) ?
            angularProject.hasComponentSuffix(suffix) :
            this.lintConfig.hasComponentSuffix(suffix);

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
     * Try to find the Angular config file's fs path, or `undefined`
     */
    private async findAngularConfigUri(workspaceFolder: vscode.WorkspaceFolder): Promise<vscode.Uri> {

        /* Search in root folder only first for performance */

        /* Required to look only in the current workspace folder (otherwise it searches in all folders) */
        const rootPattern = new vscode.RelativePattern(workspaceFolder, `{${angularConfigFileNames.join(',')}}`);

        /* Third param is the maximum number of results */
        let searchMatches = await vscode.workspace.findFiles(rootPattern, '**/node_modules/**', 1);

        /* Otherwise, search in all subfolders */
        if (searchMatches.length === 0) {

            /* Required to look only in the current workspace folder (otherwise it searches in all folders) */
            const everywherePattern = new vscode.RelativePattern(workspaceFolder, `**/{${angularConfigFileNames.join(',')}}`);

            searchMatches = await vscode.workspace.findFiles(everywherePattern, '**/node_modules/**');

        }

        if (searchMatches.length > 0) {

            if (searchMatches.length === 1) {

                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                Output.logInfo(`Angular config file for "${this.name}" workspace folder found at: ${searchMatches[0]!.path}`);

            } else {

                const errorMessage = `More than one Angular config file found for "${this.name}" workspace folder. If you work with multiple Angular repositories at once, you need to open them as different workspaces in Visual Studio Code.`;

                const docLabel = `Open VS Code workspaces documentation`;

                Output.logError(errorMessage);

                vscode.window.showErrorMessage(errorMessage, 'OK', docLabel).then((action) => {

                    if (action === docLabel) {

                        vscode.env.openExternal(vscode.Uri.parse('https://code.visualstudio.com/docs/editor/multi-root-workspaces')).then(() => { }, () => { });

                    }

                }).then(() => { }, () => { });

                /* Unfortunately the results' order from VS Code search is inconsistent from one time to another,
                 * so we sort based on paths' nesting length to keep the directory closest to the root folder */
                searchMatches.sort((a, b) => (a.path.split('/').length < b.path.split('/').length) ? -1 : 1);

            }

            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            return searchMatches[0]!;

        }

        throw new Error();

    }

}
