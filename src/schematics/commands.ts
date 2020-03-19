import * as path from 'path';
import * as vscode from 'vscode';

import { Collection } from './collection';
import { Generate } from './generate';
import { Output } from './output';
import { Schema } from './schema';
import { Schematics } from './schematics';
import { Utils } from './utils';
import { AngularConfig } from './angular-config';
import { TSLintConfig } from './tslint-config';
import { Preferences } from './preferences';
import { Workspace, ExplorerMenuContext } from './workspace';


export interface GenerateConfig {
    collectionName?: string;
    schemaName?: string;
}

export class Commands {

    static async generate(context: ExplorerMenuContext, { collectionName, schemaName }: GenerateConfig = {}): Promise<void> {

        const shortcutCommand = (collectionName && schemaName) ? true : false;

        const contextPath = Workspace.getContextPath(context);
        const workspaceFolderPath = await Workspace.getWorkspaceFolderPath(contextPath);

        if (!workspaceFolderPath) {
            return;
        }

        await AngularConfig.init(workspaceFolderPath);
        await TSLintConfig.init(workspaceFolderPath);

        const generate = new Generate(contextPath, workspaceFolderPath);

        if (collectionName !== AngularConfig.cliCollection) {

            await Schematics.load(workspaceFolderPath);

            if (!collectionName) {

                collectionName = await Schematics.askSchematic();

                if (!collectionName) {
                    return;
                }

            }

            generate.addCollection(collectionName);

            /* Special case: ngx-spec needs a special path */
            if (collectionName === 'ngx-spec') {
                generate.resetCommandPath(contextPath);
            }
        
        }

        const collection = new Collection(collectionName);

        if (!await collection.load(workspaceFolderPath)) {
            return;
        }

        if (!schemaName) {

            schemaName = await collection.askSchema();

            if (!schemaName) {
                return;
            }

        }

        generate.addSchema(schemaName);

        const schema = await collection.createSchema(schemaName, workspaceFolderPath);

        if (!await schema.load(workspaceFolderPath)) {
            return;
        }

        let defaultOption: string | undefined;

        if (schema.hasDefaultOption()) {

            defaultOption = await schema.askDefaultOption(generate.path, generate.project);

            if (!defaultOption) {
                return;
            }

            /* Remove suffix (like `.component`) as Angular CLI will already add it */
            if (defaultOption.endsWith(`.${schemaName}`)) { 
                defaultOption = defaultOption.replace(`.${schemaName}`, '');
            }

            generate.addDefaultOption(defaultOption, schema.hasPath());

        }

        let shortcutConfirm: boolean | undefined = false;

        /* Quicker scenario for basic schematics (component, service, module) */
        if (shortcutCommand) {

            let shortcutOptions: Map<string, string | string[]> | undefined;

            // TODO: check if this check is relevant
            if (collectionName === AngularConfig.cliCollection) {

                /* Special scenario for component types */
                if (schemaName === 'component') {

                    shortcutOptions = await this.askComponentOptions(schema);
                    if (!shortcutOptions) {
                        return;
                    }

                /* Special scenario for module types */
                } else if (schemaName === 'module') {

                    shortcutOptions = await this.askModuleOptions(schema, defaultOption);
                    if (!shortcutOptions) {
                        return;
                    }

                }

            }

            if (shortcutOptions) {
                shortcutOptions.forEach((option, optionName) => {
                    generate.addOption(optionName, option);
                });
            }

            /* Ask direct confirmation or adding more options or cancel */
            shortcutConfirm = await this.askShortcutConfirmation(generate);

            /* "Cancel" choice */
            if (shortcutConfirm === undefined) {
                return;
            }
            
        }

        /* Ask for advanced options if user didn't choose a direct confirmation */
        if (!shortcutConfirm) {

            let filledOptions: Map<string, string | string[]> | undefined;

            filledOptions = await this.askOptions(schema);

            if (!filledOptions) {
                return;
            }

            filledOptions.forEach((option, optionName) => {
                generate.addOption(optionName, option);
            });

            /* Ask final confirmation */
            const confirm = await generate.askConfirmation();

            /* "Cancel" choice */
            if (!confirm) {
                return;
            }

        }

        await this.launchCommand(generate, workspaceFolderPath);

    }

    static async askShortcutConfirmation(generate: Generate): Promise<boolean | undefined> {

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

    /** @todo Colored output? */
    static async launchCommand(generate: Generate, cwd: string): Promise<void> {

        Output.channel.show();

        Output.channel.appendLine(generate.command);

        try {

            const stdout = await Utils.execAsync(await generate.getExecCommand(cwd), cwd);

            Output.channel.appendLine(stdout);

            await vscode.commands.executeCommand('workbench.files.action.refreshFilesExplorer');

            vscode.window.setStatusBarMessage(`Schematics worked!`, 5000);

            try {
                await this.jumpToFile(stdout, cwd, generate);
            } catch (error) {}

        } catch (error) {

            Output.channel.append(error[0]);
            Output.channel.appendLine(error[1]);

            vscode.window.showErrorMessage(`Schematics failed, see Output.`);

        }
    
    }

    static async jumpToFile(stdout: string, cwd: string, generate: Generate): Promise<void> {

        const name = generate.defaultOption.includes('/') ? generate.defaultOption.substr(generate.defaultOption.lastIndexOf('/') + 1) : generate.defaultOption;

        const suffix = (generate.schema === 'component') ? generate.getOption('type') : '';
        const suffixTest = suffix ? `|${suffix}` : '';

        const stdoutRegExp = new RegExp(`CREATE (.*${name}(?:\.(${generate.schema}${suffixTest}))?\.ts)`);

        let stdoutMatches = stdout.match(stdoutRegExp);

        if (stdoutMatches) {

            const document = await vscode.workspace.openTextDocument(path.join(cwd, stdoutMatches[1]));

            await vscode.window.showTextDocument(document);

        }

    }

    static async askOptions(schema: Schema): Promise<Map<string, string | string[]>> {

        const selectedOptionsNames = await schema.askOptions();

        if (selectedOptionsNames) {

            return await schema.askOptionsValues(selectedOptionsNames);

        }

        return new Map();


    }

    static async askComponentOptions(schema: Schema): Promise<Map<string, string | string[]> | undefined> {

        const componentOptions = new Map<string, string | string[]>();

        const entryRequired = !AngularConfig.isIvy && schema.options.get('entryComponent');
        const hasPageSuffix = schema.options.get('type') && (TSLintConfig.userComponentSuffixes.includes('Page') || TSLintConfig.userComponentSuffixes.includes('page'));

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

        const userComponentTypes = TSLintConfig.userComponentSuffixes.filter((type) => !['Component', 'Page'].includes(type));
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
                } else if (TSLintConfig.userComponentSuffixes.includes(componentType)
                || TSLintConfig.userComponentSuffixes.includes(componentTypeLowerCased)) {
                    componentOptions.set('type', componentTypeLowerCased);
                } 
             }

        }

        return componentOptions;

    }
    
    static async askModuleOptions(schema: Schema, moduleName?: string): Promise<Map<string, string> | undefined> {

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