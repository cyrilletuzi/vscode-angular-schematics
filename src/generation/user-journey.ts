import * as vscode from 'vscode';

import { angularCollectionName, extensionName } from '../defaults';
import { Output, FileSystem, Terminal } from '../utils';
import { Workspace, WorkspaceFolderConfig } from '../workspace';
import { Collection, Schematic } from '../workspace/schematics';
import { shortcutsConfirmationChoices, SHORTCUTS_CONFIRMATION_LABEL, MODULE_TYPE } from '../workspace/shortcuts';

import { CliCommand } from './cli-command';
import { CliCommandOptions, dasherize, formatCliCommandOptions } from './cli-options';

export class UserJourney {

    private static shortcutSchematics = ['component', 'service', 'module'];
    private workspaceFolder!: WorkspaceFolderConfig;
    private cliCommand!: CliCommand;
    private projectName = '';
    private collection!: Collection;
    private schematic!: Schematic;

    async start(contextUri?: vscode.Uri, collectionName?: string, schematicName?: string): Promise<void> {

        /* As the configurations are loaded in an async way, they may not be ready */
        try {

            /* Show progress to the user */
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Window,
                title: `${extensionName}: loading configuration, please wait...`,
            }, () => Workspace.whenStable());

        } catch {
            Output.showError(`Loading configurations needed for ${extensionName} extension was too long. Check Output channel for error logs.`);
            return;
        }

        let workspaceFolder: WorkspaceFolderConfig | undefined;
        /* Get workspace folder configuration */
        try {
            workspaceFolder = await Workspace.askFolder(contextUri);
        } catch {
            Output.showError(`No valid Angular config file found for the chosen workspace. Add a "angular.json" file in your project with \`{ "version": 1 }\``);
            return;
        }

        if (!workspaceFolder) {
            Output.logInfo(`You have canceled the workspace folder choice.`);
            return;
        }

        this.workspaceFolder = workspaceFolder;

        Output.logInfo(`Workspace folder selected: "${workspaceFolder.name}"`);

        this.cliCommand = new CliCommand(workspaceFolder, contextUri?.path);

        /* If the project has not been already resolved via context path (in `CliCommand` constructor)
         * and if the Angular projects have been correctly resolved from config */
        if (!this.cliCommand.getProjectName() && (this.workspaceFolder.getAngularProjects().size > 0)) {

            const projectName = await this.askProjectName();

            if (!projectName) {
                Output.logInfo(`You have canceled the Angular project choice.`);
                return;
            }

            this.cliCommand.setProjectName(projectName);

        }

        this.projectName = this.cliCommand.getProjectName();

        if (this.projectName) {
            Output.logInfo(`Angular project used: "${this.cliCommand.getProjectName()}"`);
        }

        /* Collection may be already defined (from shortcut command or from view) */
        if (!collectionName) {

            try {
                collectionName = await this.askCollectionName();
            } catch {
                /* Happens if `@schematics/angular` is not installed */
                this.showCollectionMissingErrorWithFix(angularCollectionName).catch(() => {});
                return;
            }

            if (!collectionName) {
                Output.logInfo(`You have canceled the collection choice.`);
                return;
            }


        }

        Output.logInfo(`Collection used: "${collectionName}"`);

        this.cliCommand.setCollectionName(collectionName);

        const collection = this.workspaceFolder.collections.getCollection(collectionName);

        if (!collection) {

            this.showCollectionMissingErrorWithFix(collectionName).catch(() => {});

            return;

        }

        this.collection = collection;

        /* Schematic may be already defined (from shortcut command or from view) */
        if (!schematicName) {

            schematicName = await this.askSchematicName();

            if (!schematicName) {
                Output.logInfo(`You have canceled the schematic choice.`);
                return;
            }

        }

        Output.logInfo(`Schematic used: "${collectionName}:${schematicName}"`);

        const schematic = this.collection.getSchematic(schematicName);

        if (!schematic) {
            Output.showError(`Cannot load "${collectionName}:${schematicName}" schematic. See Output channel for error logs.`);
            return;
        }

        this.schematic = schematic;
        this.cliCommand.setSchematic(schematic);

        /* Project can only be validated once the schematic is here */
        if (!await this.cliCommand.validateProject()) {

            /* If no project or path has been detected, user is asked about the source path */
            const sourcePath = await this.askSourcePath();

            if (!sourcePath) {
                Output.logInfo(`You have canceled the source path choice.`);
                return;
            }

            this.cliCommand.addOptions([['path', sourcePath]]);

        }

        let nameAsFirstArg: string | undefined;

        if (this.schematic.hasNameAsFirstArg()) {

            Output.logInfo(`This schematic has a default argument to set the path and name.`);

            nameAsFirstArg = await this.askNameAsFirstArg();

            if (!nameAsFirstArg) {
                Output.logInfo(`You have canceled the default argument input.`);
                return;
            }

            this.cliCommand.setNameAsFirstArg(nameAsFirstArg);

        }

        let shortcutConfirm: boolean | undefined = false;

        /* Quicker scenario for basic schematics (component, service, module of official schematics) */
        if ((collectionName === angularCollectionName)
        && UserJourney.shortcutSchematics.includes(schematicName)) {

            let shortcutOptions: CliCommandOptions | undefined;

            /* Special scenario for component types */
            if (schematicName === 'component') {

                shortcutOptions = await this.askComponentOptions();
                if (!shortcutOptions) {
                    Output.logInfo(`You have canceled the component type choice.`);
                    return;
                }

            /* Special scenario for module types */
            } else if (schematicName === 'module') {

                /* We know that Angular module schematics has a name as first argument */
                shortcutOptions = await this.askModuleOptions();
                if (!shortcutOptions) {
                    Output.logInfo(`You have canceled the module type choice.`);
                    return;
                }

                /* A module should be imported somewhere, so ask the user */
                if (!shortcutOptions.has('module')) {

                    const whereToImportModule = await this.askWhereToImportModule();

                    if (whereToImportModule) {
                        this.cliCommand.addOptions([['module', whereToImportModule]]);
                    }

                }

            }

            if (shortcutOptions) {
                this.cliCommand.addOptions(shortcutOptions);
            }

            /* Ask direct confirmation or adding more options or cancel */
            shortcutConfirm = await this.askShortcutConfirmation();

            /* "Cancel" choice */
            if (shortcutConfirm === undefined) {
                Output.logInfo(`You have canceled the generation.`);
                return;
            }

        }

        /* Ask for advanced options if user didn't choose a direct confirmation */
        if (!shortcutConfirm) {

            const filledOptions = await this.askOptions();

            this.cliCommand.addOptions(filledOptions);

            /* Ask final confirmation */
            const confirm = await this.askConfirmation();

            /* "Cancel" choice */
            if (!confirm) {
                Output.logInfo(`You have canceled the generation.`);
                return;
            }

        }

        this.cliCommand.launchCommand();

        try {

            /* Show progress to the user */
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: `${extensionName}: launching the generation, please wait...`,
            }, () => this.jumpToFile(this.cliCommand.guessGereratedFileFsPath()));

        } catch {

            /* Auto-opening the file was not possible, warn the user the command is launched
             * and propose to refresh Explorer to see the generated files */
            this.showUnknownStatus().catch(() => {});
        }

    }

    private async askProjectName(): Promise<string | undefined> {

        /* If there is only one Angular project, default to it */
        if (this.workspaceFolder.getAngularProjects().size === 1) {

            return Array.from(this.workspaceFolder.getAngularProjects().keys())[0];

        }
        /* Otherwise ask the user */
        else {

            const projectsChoices: vscode.QuickPickItem[] = Array.from(this.workspaceFolder.getAngularProjects())
                .map(([label, project]) => {

                    /* Tell if it is an application or a library, and the path */
                    const rawDescription = `${this.workspaceFolder.isRootAngularProject(label) ? `root ` : ''}${project.getType()} in ${project.getAppOrLibPath()}`;
                    /* Uppercase first letter */
                    const description = `${rawDescription.charAt(0).toUpperCase()}${rawDescription.substr(1)}`;

                    return {
                        label,
                        description,
                    };

                });

            const projectChoice = await vscode.window.showQuickPick(projectsChoices, {
                placeHolder: `In which your Angular projects do you want to generate?`,
                ignoreFocusOut: true,
            });

            return projectChoice?.label;

        }

    }

    private async askCollectionName(): Promise<string | undefined> {

        if  (this.workspaceFolder.collections.getCollectionsNames().length === 0) {
            throw new Error();
        }

        else if  (this.workspaceFolder.collections.getCollectionsNames().length === 1) {

            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const collectionName = this.workspaceFolder.collections.getCollectionsNames()[0]!;

            Output.logInfo(`Only collection detected: "${collectionName}". Default to it.`);

            return collectionName;

        }

        else {

            Output.logInfo(`Multiple collections detected: ask the user which one to use.`);

            return vscode.window.showQuickPick(this.workspaceFolder.collections.getCollectionsNames(), {
                placeHolder: `What schematics collection do you want to use?`,
                ignoreFocusOut: true,
            });

        }

    }

    private async askSchematicName(): Promise<string | undefined> {

        const choice = await vscode.window.showQuickPick(this.collection.schematicsChoices, {
            placeHolder: `What schematics do you want to generate?`,
            ignoreFocusOut: true,
        });

        return choice ? choice.label : undefined;

    }

    private async askSourcePath(): Promise<string | undefined> {

        return vscode.window.showInputBox({
            prompt: `What is the source path? (Pro-tip: the extension can detect it with a correct "angular.json" or if there is an "app.module.ts" file)`,
            placeHolder: 'src/app',
            ignoreFocusOut: true,
        });

    }

    // TODO: `@schematics/angular:interface` has a second argv
    private async askNameAsFirstArg(): Promise<string | undefined> {

        const projectName = this.cliCommand.getProjectName();
        const contextPath = this.cliCommand.getContextForNameAsFirstArg();

        Output.logInfo(`Context path detected for default argument: "${contextPath}"`);

        let prompt = `Choose the name${this.schematic.hasOption('path') ? ` or path/to/name` : ''}.`;

        /* Pro-tip to educate users that it is easier to launch the command from a right-click in Explorer */
        if (this.schematic.hasOption('path') && this.workspaceFolder.isRootAngularProject(projectName) && !contextPath) {
            prompt = `${prompt} Pro-tip: the path can be inferred if you right-click on the directory where you want to generate.`;
        }

        const nameInput = await vscode.window.showInputBox({
            prompt,
            /* If existing, prefill the input with the rgiht-clicked directory */
            value: contextPath,
            /* Position the cursor to the end of the prefilled value, so the user can type directly after */
            valueSelection: [contextPath.length, contextPath.length],
            ignoreFocusOut: true,
        });

        /* Remove suffix (like `.component`) as Angular CLI will already add it */
        const suffix = `.${this.schematic.getName()}`;
        const name = nameInput?.endsWith(suffix) ? nameInput.replace(suffix, '') : nameInput;

        return name;

    }

    private async askComponentOptions(): Promise<CliCommandOptions | undefined> {

        const types = this.workspaceFolder.getComponentTypes(this.projectName);

        const typesChoices = Array.from(types.values()).map((type) => type.choice);

        const typeChoice = await vscode.window.showQuickPick(typesChoices, {
            placeHolder: `What type of component do you want?`,
            ignoreFocusOut: true,
        });

        return typeChoice ? types.get(typeChoice.label)?.options : undefined;

    }

    private async askModuleOptions(): Promise<CliCommandOptions | undefined> {

        const types = this.workspaceFolder.getModuleTypes();

        /* Set specific route name for lazy-loaded module type */
        const lazyModuleType = types.get(MODULE_TYPE.LAZY);

        if (lazyModuleType) {

            /* Usage of `posix` is important here as we are working with path with Linux separators `/` */
            const routeName = this.cliCommand.getRouteFromFirstArg();

            lazyModuleType.options.set('route', routeName);
            lazyModuleType.choice.description = formatCliCommandOptions(lazyModuleType.options);

        }

        const typesChoices = Array.from(types.values()).map((type) => type.choice);

        const typeChoice = await vscode.window.showQuickPick(typesChoices, {
            placeHolder: `What type of module do you want?`,
            ignoreFocusOut: true,
        });

        return typeChoice ? types.get(typeChoice.label)?.options : undefined;

    }

    private async askWhereToImportModule(): Promise<string | undefined> {

        const nowhereLabel = `Nowhere`;

        /* Should look only in the current project */
        const pattern = new vscode.RelativePattern(this.cliCommand.getProjectSourcePath(), '**/*.module.ts');

        /* Show progress to the user */
        const existingModulesUris = await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `${extensionName}: looking for existing modules, please wait...`,
        }, () => vscode.workspace.findFiles(pattern, undefined, 50));

        const modulesChoices = existingModulesUris
            /* Routing module should not be proposed */
            .filter((uri) => !uri.fsPath.includes('-routing'))
            /* We keep only the relative module path, and stop at `-10` to remove `.module.ts` */
            .map((uri) => uri.fsPath.substring(this.cliCommand.getProjectSourcePath().length + 1, uri.fsPath.length - 10));

        if (modulesChoices.length === 0) {
            return undefined;
        }

        modulesChoices.unshift(nowhereLabel);

        const whereToImportChoice = await vscode.window.showQuickPick(modulesChoices, {
            placeHolder: `Where do you want to import the module?`,
            ignoreFocusOut: true,
        });

        return (whereToImportChoice !== nowhereLabel) ? whereToImportChoice : undefined;

    }

    private async askShortcutConfirmation(): Promise<boolean | undefined> {

        const choice = await vscode.window.showQuickPick(shortcutsConfirmationChoices, {
            placeHolder: this.cliCommand.getCommand(),
            ignoreFocusOut: true,
        });

        if (choice?.label === SHORTCUTS_CONFIRMATION_LABEL.YES) {
            return true;
        } else if (choice?.label === SHORTCUTS_CONFIRMATION_LABEL.MORE_OPTIONS) {
            return false;
        }
        return undefined;

    }

    private async askOptions(): Promise<CliCommandOptions> {

        const selectedOptionsNames = await this.askOptionsNames();

        if (selectedOptionsNames) {

            return await this.askOptionsValues(selectedOptionsNames);

        }

        return new Map();

    }

    private async askOptionsNames(): Promise<string[]> {

        const optionsChoices = this.schematic.optionsChoices;

        if (optionsChoices.length === 0) {
            return [];
        }

        const selectedOptions = await vscode.window.showQuickPick(optionsChoices, {
            canPickMany: true,
            placeHolder: `Do you need some options? (if not, just press Enter to skip this step)`,
            ignoreFocusOut: true,
        }) ?? [];

        return selectedOptions.map((selectedOption) => selectedOption.label);

    }

    private async askOptionsValues(optionsNames: string[]): Promise<CliCommandOptions> {

        /* Force required options, otherwise the schematic will fail */
        const options = [...this.schematic.getRequiredOptions(), ...this.schematic.getSomeOptions(optionsNames)];

        const filledOptions: CliCommandOptions = new Map<string, string | string[]>();

        for (const [optionName, option] of options) {

            let choice: string | string[] | undefined = '';

            /* Some schematics have a prompt message already defined, otherwise we use the description */
            const prompt = option?.['x-prompt'] ?? option.description ?? `What value do you want for this option?`;

            if (option.enum !== undefined) {

                choice = await this.askOptionEnum(optionName, option.enum, prompt);

            } else if (option.type === 'boolean') {

                /* Put the default value first */
                const choices = (option.default === false) ? ['false', 'true'] : ['true', 'false'];

                choice = await this.askOptionEnum(optionName, choices, prompt);

            }
            /* Only makes sense if the option is an array AND have suggestions,
             * otherwise the user must manually type the value in a classic text input box */
            else if ((option.type === 'array')) {

                /* Angular >= 8.3 */
                if (option.items?.enum) {
                    choice = await this.askOptionMultiselect(optionName, option.items.enum, prompt);
                } else {
                    choice = await this.askOptionText(optionName, prompt);
                }

            } else {

                choice = await this.askOptionText(optionName, prompt);

            }

            if (choice) {
                filledOptions.set(optionName, choice);
            }

        }

        return filledOptions;

    }

    private async askOptionText(optionName: string, prompt: string): Promise<string | undefined> {

        return vscode.window.showInputBox({
            prompt: `--${dasherize(optionName)}: ${prompt}`,
            ignoreFocusOut: true,
        });

    }

    private async askOptionEnum(optionName: string, choices: string[], placeholder: string): Promise<string | undefined> {

        return vscode.window.showQuickPick(choices, {
            placeHolder: `--${dasherize(optionName)}: ${placeholder}`,
            ignoreFocusOut: true,
        });

    }

    private async askOptionMultiselect(optionName: string, choices: string[], placeholder: string): Promise<string[] | undefined> {

        return vscode.window.showQuickPick(choices, {
            placeHolder: `--${dasherize(optionName)}: ${placeholder}`,
            canPickMany: true,
            ignoreFocusOut: true,
        });

    }

    private async askConfirmation(): Promise<boolean> {

        const confirmationLabel = `$(check) Confirm`;
        const testLabel = `$(debug-alt) Test`;

        const confirmationChoices: vscode.QuickPickItem[] = [{
            label: confirmationLabel,
            description: `Pro-tip: take a minute to check the command above is really what you want`,
        }, {
            label: testLabel,
            description: `Simulate the command with --dry-run`,
        }, {
            label: `$(close) Cancel`,
        }];

        const choice = await vscode.window.showQuickPick(confirmationChoices, {
            placeHolder: this.cliCommand.getCommand(),
            ignoreFocusOut: true,
        });

        if (choice?.label === testLabel) {

            this.cliCommand.launchCommand({ dryRun: true });

            return this.askConfirmation();

        }

        return (choice?.label === confirmationLabel) ? true : false;

    }

    /**
     * Automatically open the generated file
     */
    private async jumpToFile(possibleFsPath: string, counter = 0): Promise<void> {

        /* If we don't know the generated file path, we can't know if the command succeeded or not,
         * as we can't react on Terminal output */
        if (possibleFsPath === '') {

            throw new Error();

        }
        /* If the file exists, open it */
        else if (await FileSystem.isReadable(possibleFsPath, { silent: true })) {

            const document = await vscode.workspace.openTextDocument(possibleFsPath);

            await vscode.window.showTextDocument(document);

            /* Go back to previously active terminal */
            Terminal.back();

            Output.logInfo(`Command has succeeded! Check the Terminal for more details.`);

            return;

        }
        /* Otherwise retry every half second, 10 times (so 5 seconds maximum) */
        else if (counter < 10) {

            counter += 1;

            await new Promise<void>((resolve, reject) => {
                setTimeout(() => {
                    this.jumpToFile(possibleFsPath, counter).then(() => {
                        resolve();
                    }).catch(() => {
                        reject();
                    });
                }, 500);
            });

        }
        /* After 10 failures */
        else {

            throw new Error();

        }

    }

    /**
     * Show an information message when we cannot detect the generated file
     */
    private async showUnknownStatus(): Promise<void> {

        const refreshLabel = `Refresh Explorer`;

        Output.logInfo(`Command launched.`);

        const action = await vscode.window.showInformationMessage(
            `Command launched, check the Terminal to know its status. You may need to refresh the Explorer to see the generated file(s).`,
            `Refresh Explorer`,
        );

        if (action === refreshLabel) {
            /* Refresh Explorer, otherwise you may not see the generated files */
            vscode.commands.executeCommand('workbench.files.action.refreshFilesExplorer').then(() => {}, () => {});
        }

    }

    private async showCollectionMissingErrorWithFix(collectionName: string): Promise<void> {

        const message = (collectionName === angularCollectionName) ?
            `"${collectionName}" should be present in a correctly installed Angular project.` :
            `Cannot load "${collectionName}" collection. It may not exist in "${this.workspaceFolder.name}" workspace folder.`;

        Output.logError(message);

        const fixLabel = `Try to npm install the missing schematics`;

        const fixAction = await vscode.window.showErrorMessage(message, fixLabel);

        if (fixAction === fixLabel) {

            Output.logInfo(`Trying to npm install ${collectionName}`);

            Terminal.send(this.workspaceFolder, `npm install ${collectionName} --save-dev`);

            const reloadLabel = `Reload window`;

            const reloadAction = await vscode.window.showInformationMessage(`Once the npm install is finished, the project must be reloaded.`, reloadLabel);

            if (reloadAction === reloadLabel) {

                vscode.commands.executeCommand('workbench.action.reloadWindow').then(() => {}, () => {});

            }

        }

    }

}
