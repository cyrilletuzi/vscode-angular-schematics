import * as vscode from 'vscode';
import * as path from 'path';

import { Output } from '../../utils';
import { ComponentShortcut } from '../shortcuts';

import { AngularJsonProjectSchema, AngularProjectType, AngularJsonSchematicsSchema, AngularJsonSchematicsOptionsSchema } from './json-schema';
import { TslintConfig } from './tslint';

export class AngularProject {

    componentShortcut!: ComponentShortcut;
    private name: string;
    /** Angular projects are `application` by default, but can be `library` too */
    private type: AngularProjectType;
    /** Main application: empty. Sub-applications/libraries: `<projects-root>/hello` */
    private rootPath: string;
    /** Main application: `src`. Sub-applications/libraries: `<projects-root>/hello/src` */
    private sourcePath: string;
    /** 
     * Main application: `src/app`.
     * Sub-application: `<projects-root>/hello/src/app`
     * Library: `<projects-root>/hello/src/lib`
     */
    private appOrLibPath: string;
    /** Default values for schematics options */
    private schematicsDefaults: AngularJsonSchematicsSchema | undefined;
    tslintConfig!: TslintConfig;

    constructor(name: string, config: AngularJsonProjectSchema) {

        this.name = name;

        this.schematicsDefaults = config.schematics;

        this.type = config.projectType;

        /* Project's path relative to workspace folder (ie. where `angular.json` is).
         * For the main application, it's empty as it's directly in the workspace folder.
         * For sub-applications/libraries, it's `<projects-root>/hello-world`. */
        this.rootPath = config.root;

        /* Project's source path relative to workspace folder (ie. where `angular.json` is).
         * For the main application, it's `src` by default but can be customized.
         * For sub-applications/libraries, it's `<projects-root>/hello-world/<src-or-something-else>`.
         * Usage of `posix` is important here, as we want slashes on all platforms, including Windows. */
        if (config.sourceRoot !== undefined) {
            this.sourcePath = config.sourceRoot;
        } else {
            this.sourcePath = path.posix.join(this.rootPath, 'src');
            Output.logWarning(`Your Angular configuration file should contain a "sourceRoot" string property for your "${this.name}" project. Default to "${this.sourcePath}".`);
        }

        /* These folders are imposed by Angular CLI.
         * See https://github.com/angular/angular-cli/blob/9190f622365b8eb85b7d8828f170959ded643518/packages/schematics/angular/utility/project.ts#L17 */
        const fixedFolder = (config.projectType === 'library') ? 'lib' : 'app';

        /* Default for:
         * - root application: `src/app`
         * - sub-application: `projects/hello-world/src/app`
         * - library: `projects/hello-world/src/lib`
         * Usage of `posix` is important here, as we want slashes on all platforms, including Windows. */
        this.appOrLibPath = path.posix.join(this.sourcePath, fixedFolder);

        Output.logInfo(`"${name}" Angular project is of type "${this.type}" and its path is: ${this.appOrLibPath}.`);

        if (!this.sourcePath.startsWith(this.rootPath)) {
            Output.logError(`"root" and "sourceRoot" of "${this.name}" project do not start by the same path in angular.json`);
        }

    }

    async init(workspaceFolder: vscode.WorkspaceFolder): Promise<vscode.FileSystemWatcher> {

        Output.logInfo(`Loading "${this.name}" Angular project's TSLint configuration.`);

        const projectFsPath = path.join(workspaceFolder.uri.fsPath, this.rootPath);

        const tslintConfig = new TslintConfig();
        const watcher = await tslintConfig.init(projectFsPath, { silent: true });
        this.tslintConfig = tslintConfig;

        const componentShortcut = new ComponentShortcut();
        await componentShortcut.init(workspaceFolder);
        this.componentShortcut = componentShortcut;

        return watcher;

    }

    /**
     * Get an Angular project's root path
     * Main application: empty. Sub-applications/libraries: `<projects-root>/hello`
     */
    getRootPath(): string {
        return this.rootPath;
    }

    /**
     * Get an Angular project's source path
     * Main application: `src`. Sub-applications/libraries: `<projects-root>/hello/src`.
     */
    getSourcePath(): string {
        return this.sourcePath;
    }

    /**
     * Get an Angular project's app or lib path:
     * - main application: `src/app`.
     * - sub-application: `<projects-root>/hello/src/app`
     * - library: `<projects-root>/hello/src/lib`
     */
    getAppOrLibPath(): string {
        return this.appOrLibPath;
    }

    /**
     * Get authotorized component suffixes in Angular project's tslint.json
     */
    getComponentSuffixes(): string[] {
        return this.tslintConfig.componentSuffixes;
    }

    /**
     * Get project's type ('application' or 'library')
     */
    getType(): AngularProjectType {
        return this.type;
    }

    /**
     * Tells if a suffix is authorized in Angular project's tslint.json
     */
    hasComponentSuffix(suffix: string): boolean {
        return this.tslintConfig.hasComponentSuffix(suffix);
    }

    /**
     * Get the user default value for an option of a schematics
     * @param schematicsFullName Must be the full schematics name (eg. "@schematics/angular")
     */
    getSchematicsOptionDefaultValue<T extends keyof AngularJsonSchematicsOptionsSchema>(schematicsFullName: string, optionName: T): AngularJsonSchematicsOptionsSchema[T] | undefined {
        return this.schematicsDefaults?.get(schematicsFullName)?.[optionName];
    }

}