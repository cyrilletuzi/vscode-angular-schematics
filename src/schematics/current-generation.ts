import * as vscode from 'vscode';
import * as path from 'path';

import { Utils } from './utils';
import { AngularConfig } from './config-angular';
import { WorkspaceExtended } from './config-workspaces';
import { Output } from './output';
import { Schema } from './schema';
import { Preferences } from './preferences';


export class CurrentGeneration {

    path = '';
    project = '';
    schema = '';
    defaultOption = '';
    get command(): string {

        return [
            this.base,
            this.formatCollectionAndSchema(),
            this.defaultOption,
            ...this.formatOptionsForCommand()
        ].join(' ');

    }
    protected base = 'ng g';
    protected collection = AngularConfig.defaultAngularCollection;
    protected options = new Map<string, string | string[]>();
    protected cliLocal: boolean | null = null;

    constructor(
        private workspaceExtended: WorkspaceExtended,
        contextPath: string,
    ) {

        this.path = this.getCommandPath(contextPath);
        this.project = this.getProject(contextPath);

    }

    addCollection(name: string): void {

        this.collection = name;

    }

    addSchema(name: string): void {

        this.schema = name;

    }

    addDefaultOption(value: string, withPath = true): void {

        this.defaultOption = value;

        if (withPath && this.project && this.workspaceExtended.angularConfig.isRootProject(this.project)) {

            this.addOption('project', this.project);

        }

    }

    addOption(optionName: string, optionValue: string | string[]): void {

        this.options.set(optionName, optionValue);

    }

    getOption(optionName: string): undefined | string | string[] {

        return this.options.get(optionName);

    }

    async askConfirmation(): Promise<boolean> {

        const confirmationText = `Confirm`;
        const cancellationText = `Cancel`;

        const choice = await vscode.window.showQuickPick([confirmationText, cancellationText], {
            placeHolder: this.command,
            ignoreFocusOut: true,
        });

        return (choice === confirmationText) ? true : false;

    }

    async isCliLocal(cwd: string): Promise<boolean> {

        if (this.cliLocal === null) {

            this.cliLocal = await Utils.existsAsync(Utils.getNodeModulesPath(cwd, '.bin', 'ng'));

        }

        return this.cliLocal;

    }

    async getExecCommand(workspaceUri: vscode.Uri): Promise<string> {

        return (await this.isCliLocal(workspaceUri.fsPath)) ? `"./node_modules/.bin/ng"${this.command.substr(2)}` : this.command;

    }

    resetCommandPath(contextPath = ''): void {

        this.path = this.getCommandPath(contextPath);

    }

    protected getProject(contextPath: string): string {

        const workspaceUri = this.workspaceExtended.uri;

        const workspacePathNormalized = workspaceUri.fsPath.replace(/\\/g, '/');

        const toRenameProjectPath = contextPath.substr(contextPath.indexOf(workspacePathNormalized) + workspacePathNormalized.length);

        const pathNormalized = Utils.normalizePath(toRenameProjectPath);

        for (const [projectName, projectConfig] of this.workspaceExtended.angularConfig.getProjects()) {

            const projectPath = projectConfig.root || projectConfig.sourceRoot;

            /* Remove leading "/" to match */
            const pathWithoutLeadingSlash = pathNormalized.substr(1);

            /* Test strict equality or starting with a trailing "/", to avoid collision when projects start with a common path */
            if (pathWithoutLeadingSlash === projectPath || pathWithoutLeadingSlash.startsWith(`${projectPath}/`)) {
                return projectName;
            }

        }


        const projectMatches = pathNormalized.match(/projects\/([^\/]+)\/[^\/]+\/(?:app|lib)/);

        if (projectMatches) {

            return projectMatches[1];

        } else {

            const scopedProjectMatches = pathNormalized.match(/projects\/([^\/]+\/[^\/]+)\/[^\/]+\/(?:app|lib)/);

            if (scopedProjectMatches) {

                return `@${scopedProjectMatches[1]}`;

            }

        }

        return '';

    }

    protected getCommandPath(contextPath = ''): string {

        const pathNormalized = Utils.normalizePath(contextPath);

        const contextPathMatches = pathNormalized.match(/[^\/]+\/((?:app|lib))\//);

        if (contextPathMatches) {

            const splittedArray = pathNormalized.split(`/${contextPathMatches[1]}/`);

            const splittedPath = splittedArray[splittedArray.length - 1];
    
            if (splittedPath.includes('.')) {

                /* Special case: ngx-spec works on a existing file, so it needs the full path */
                if (this.collection === 'ngx-spec') {
                    return splittedPath;
                }
    
                /* If filename, delete filename by removing everything after the last "/" */
                return Utils.getDirectoryFromFilename(splittedPath);
    
            } else {
    
                /* If directory, add a trailing "/" */
                return `${splittedPath}/`;
    
            }
    
        }
    
        return '';
    
    }

    protected formatOptionsForCommand(): string[] {

        return Array.from(this.options.entries())
            .map((option) => {
                if (option[1] === 'true') {
                    return `--${option[0]}`;
                } else if (Array.isArray(option[1])) {
                    return (option[1] as string[]).map((optionItem) => `--${option[0]} ${optionItem}`).join(' ');
                } else {
                    return `--${option[0]} ${option[1]}`;
                }
            });

    }

    protected formatCollectionAndSchema(): string {

        return (this.collection !== this.workspaceExtended.angularConfig.getDefaultUserCollection()) ?
            `${this.collection}:${this.schema}` :
            this.schema;

    }

    async launchCommand(): Promise<void> {

        Output.channel.show();

        Output.channel.appendLine(this.command);

        try {

            const stdout = await Utils.execAsync(await this.getExecCommand(this.workspaceExtended.uri), this.workspaceExtended.uri);

            Output.channel.appendLine(stdout);

            await vscode.commands.executeCommand('workbench.files.action.refreshFilesExplorer');

            vscode.window.setStatusBarMessage(`Schematics worked!`, 5000);

            try {
                await this.jumpToFile(stdout);
            } catch (error) {}

        } catch (error) {

            Output.channel.append(error[0]);
            Output.channel.appendLine(error[1]);

            vscode.window.showErrorMessage(`Schematics failed, see Output.`);

        }
    
    }

    async jumpToFile(stdout: string): Promise<void> {

        const name = this.defaultOption.includes('/') ? this.defaultOption.substr(this.defaultOption.lastIndexOf('/') + 1) : this.defaultOption;

        const suffix = (this.schema === 'component') ? this.getOption('type') : '';
        const suffixTest = suffix ? `|${suffix}` : '';

        const stdoutRegExp = new RegExp(`CREATE (.*${name}(?:\.(${this.schema}${suffixTest}))?\.ts)`);

        let stdoutMatches = stdout.match(stdoutRegExp);

        if (stdoutMatches) {

            const document = await vscode.workspace.openTextDocument(path.join(this.workspaceExtended.uri.fsPath, stdoutMatches[1]));

            await vscode.window.showTextDocument(document);

        }

    }

    async askShortcutConfirmation(generate: CurrentGeneration): Promise<boolean | undefined> {

        const CONFIRM: vscode.QuickPickItem = {
            label: `Confirm`,
            description: `Pro-tip: take a minute to check the command above is really what you want`,
        };
        const MORE_OPTIONS: vscode.QuickPickItem = {
            label: `Add more options`,
            description: `Pro-tip: you can set default values to schematics options in angular.json`,
        };
        const CANCEL: vscode.QuickPickItem = { label: `Cancel` };

        const choice = await vscode.window.showQuickPick([CONFIRM, MORE_OPTIONS, CANCEL], {
            placeHolder: generate.command,
            ignoreFocusOut: true,
        });

        if (choice?.label === CONFIRM.label) {
            return true;
        } else if (choice?.label === MORE_OPTIONS.label) {
            return false;
        }
        return undefined;

    }

    async askOptions(schema: Schema): Promise<Map<string, string | string[]>> {

        const selectedOptionsNames = await schema.askOptions();

        if (selectedOptionsNames) {

            return await schema.askOptionsValues(selectedOptionsNames);

        }

        return new Map();


    }

    async askComponentOptions(schema: Schema): Promise<Map<string, string | string[]> | undefined> {

        const componentOptions = new Map<string, string | string[]>();

        const entryRequired = !this.workspaceExtended.angularConfig.isIvy() && schema.options.get('entryComponent');
        const hasPageSuffix = schema.options.get('type') && (this.workspaceExtended.tsLintConfig.getUserComponentSuffixes().includes('Page') || this.workspaceExtended.tsLintConfig.getUserComponentSuffixes().includes('page'));

        const TYPE_BASIC = `Basic component`;
        const TYPE_PAGE = `Page${(!entryRequired && !hasPageSuffix) ? ` (or dialog / modal)` : ''}`;
        const TYPE_PURE = `Pure component`;
        const TYPE_EXPORTED = `Exported component`;
        const TYPE_ENTRY = `Entry component`;

        const componentTypes: vscode.QuickPickItem[] = [];

        componentTypes.push({
            label: TYPE_BASIC,
            description: `No pre-filled option`,
            detail: `Component with no special behavior (pro-tip: learn about component types in our documentation)`,
        });

        componentTypes.push({
            label: TYPE_PAGE,
            description: `--skip-selector${hasPageSuffix ? ` --type page` : ''}`,
            detail: `Component associated to a route${(!entryRequired && !hasPageSuffix) ? ` or a dialog / modal` : ''}`,
        });

        componentTypes.push({
            label: TYPE_PURE,
            description: `--change-detection OnPush`,
            detail: `UI / presentation component, used only in its own feature module`,
        });

        componentTypes.push({
            label: TYPE_EXPORTED,
            description: `--export --change-detection OnPush`,
            detail: `UI / presentation component, declared in a shared UI module and used in multiple feature modules`,
        });

        if (entryRequired) {
            componentTypes.push({
                label: TYPE_ENTRY,
                description: `--entry-component --skip-selector`,
                detail: `Component instanciated at runtime, like a dialog or modal`,
            });
        }

        const userComponentTypes = this.workspaceExtended.tsLintConfig.getUserComponentSuffixes().filter((type) => !['Component', 'Page'].includes(type));
        const pageComponentTypes: string[] = Preferences.getComponentTypes('page');
        const pureComponentTypes: string[] = Preferences.getComponentTypes('pure');
        const exportedComponentTypes: string[] = Preferences.getComponentTypes('exported');
        const runtimeComponentTypes: string[] = Preferences.getComponentTypes('runtime');

        if (userComponentTypes.length > 0) {

            for (const userComponentType of userComponentTypes) {

                const userComponentTypeLowerCased = userComponentType.toLocaleLowerCase();
                let description = '';

                if ([...pageComponentTypes, ...runtimeComponentTypes].includes(userComponentTypeLowerCased)) {
                    description = `--skip-selector`;
                } else if ([...pureComponentTypes, ...exportedComponentTypes].includes(userComponentTypeLowerCased)) {
                    description = `--change-detection OnPush`;
                } else if (exportedComponentTypes.includes(userComponentTypeLowerCased)) {
                    description = `--export --change-detection OnPush`;
                } else if (entryRequired && runtimeComponentTypes.includes(userComponentTypeLowerCased)) {
                    description = `--entry-component --skip-selector`;
                }
                if (schema.options.get('type')) {
                    description += ` --type ${userComponentTypeLowerCased}`;
                }

                componentTypes.push({
                    label: userComponentType,
                    description,
                    detail: `Custom component type`,
                });

            }

        }

        const componentTypeChoice = await vscode.window.showQuickPick(componentTypes, {
            placeHolder: `What type of component do you want?`,
            ignoreFocusOut: true,
        });

        if (componentTypeChoice) {

            const componentType = componentTypeChoice.label;
            const componentTypeLowerCased = componentType.toLowerCase();

            /* Not required anymore in Ivy */
            if (entryRequired
            && ((componentType === TYPE_ENTRY) || runtimeComponentTypes.includes(componentTypeLowerCased))) {
                componentOptions.set('entryComponent', 'true');
            }
            /* --skip-selector was added in Angular CLI 8.1 */
            if (schema.options.get('skipSelector') &&
            ([TYPE_PAGE, TYPE_ENTRY].includes(componentType) || [...pageComponentTypes, ...runtimeComponentTypes].includes(componentTypeLowerCased))) {
                componentOptions.set('skipSelector', 'true');
            }
            if (schema.options.get('export') &&
            ((componentType === TYPE_EXPORTED) || exportedComponentTypes.includes(componentTypeLowerCased))) {
                componentOptions.set('export', 'true');
            }
            if (schema.options.get('changeDetection') &&
            ([TYPE_PURE, TYPE_EXPORTED].includes(componentType)
            || [...pureComponentTypes, ...exportedComponentTypes].includes(componentTypeLowerCased))) {
                componentOptions.set('changeDetection', 'OnPush');
            }
            /* --type was added in Angular CLI 9.0 */
            if (schema.options.get('type')) {
                if (hasPageSuffix && (componentType === TYPE_PAGE)) {
                    componentOptions.set('type', 'page');
                } else if (this.workspaceExtended.tsLintConfig.getUserComponentSuffixes().includes(componentType)
                || this.workspaceExtended.tsLintConfig.getUserComponentSuffixes().includes(componentTypeLowerCased)) {
                    componentOptions.set('type', componentTypeLowerCased);
                } 
             }

        }

        return componentOptions;

    }
    
    async askModuleOptions(schema: Schema, moduleName?: string): Promise<Map<string, string> | undefined> {

        const TYPE_CLASSIC = `Module of components`;
        const TYPE_LAZY = `Lazy-loaded module of pages`;
        const TYPE_ROUTING = `Classic module of pages`;

        const moduleTypes: vscode.QuickPickItem[] = [
            {
                label: TYPE_CLASSIC,
                description: `No pre-filled option`,
                detail: `Module of UI / presentation components, don't forget to import it somewhere`,
            },
        ];

        let routeName = '';
        if (moduleName && schema.options.get('route')) {
            routeName = moduleName.split('/').pop() || moduleName;
            moduleTypes.push({
                label: TYPE_LAZY,
                description: `--route ${routeName} --module app`,
                detail: `Module with routing, lazy-loaded`,
            });
        }

        moduleTypes.push({
            label: TYPE_ROUTING,
            description: `--routing --module app`,
            detail: `Module with routing${schema.options.get('route') ? `, immediately loaded` : ''}`,
        },);

        const moduleType = await vscode.window.showQuickPick(moduleTypes, {
            placeHolder: `What type of module do you want?`,
            ignoreFocusOut: true,
        });

        if (!moduleType) {
            return undefined;
        }

        let moduleOptions = new Map();

        if (moduleType.label === TYPE_ROUTING) {

            if (schema.options.get('routing')) {
                moduleOptions.set('routing', 'true');
            }
            if (schema.options.get('module')) {
                moduleOptions.set('module', 'app');
            }

        } else if (moduleType.label === TYPE_LAZY) {

            if (schema.options.get('route')) {
                moduleOptions.set('route', routeName);
            }
            if (schema.options.get('module')) {
                moduleOptions.set('module', 'app');
            }

        }

        return moduleOptions;

    }

}