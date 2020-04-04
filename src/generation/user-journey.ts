import * as vscode from 'vscode';
import * as path from 'path';

import { defaultAngularCollection } from '../defaults';
import { Output, FileSystem } from '../utils';
import { Workspace, WorkspaceFolderConfig } from '../config';
import { Collections, Collection, Schematic, MODULE_TYPE, CONFIRMATION_LABEL, Shortcuts } from '../schematics';

import { CliCommand, CliCommandOptions } from './cli-command';

export class UserJourney {

    private static shortcutSchematics = ['component', 'service', 'module'];
    private workspaceFolder!: WorkspaceFolderConfig;
    private cliCommand!: CliCommand;
    private projectName = '';
    private collections!: Collections;
    private collection!: Collection;
    private schematic!: Schematic;

    async start(contextUri?: vscode.Uri, collectionName?: string, schematicName?: string): Promise<void> {

        /* Resolve the current workspace folder */
        const workspaceFolder = await Workspace.getCurrentFolder(contextUri);
        if (!workspaceFolder) {
            Output.logInfo(`You have canceled the workspace folder choice.`);
            return;
        }

        Output.logInfo(`Workspace folder selected: "${workspaceFolder.name}"`);

        /* As the configurations are loaded in an async way, they may not be ready */
        try {

            /* Show progress to the user */
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Window,
                title: `Angular Schematics: loading configuration, please wait...`,
            }, () => Workspace.whenStable());

        } catch {
            Output.showError(`Command canceled: loading configurations needed for Angular Schematics extension was too long.`);
            return;
        }

        /* Get workspace folder configuration */
        const workspaceFolderConfig = Workspace.getFolderConfig(workspaceFolder);
        /* Not supposed to happen */
        if (!workspaceFolderConfig) {
            Output.showError(`Command canceled: cannot find the configuration of the chosen workspace folder. It can happen if there is no "angular.json" at the root of your workspace folder.`);
            return;
        }
        this.workspaceFolder = workspaceFolderConfig;
        this.collections = this.workspaceFolder.collections;

        this.cliCommand = new CliCommand(workspaceFolderConfig, contextUri);

        /* If there is more than one Angular project in angular.json
         * and if the project has not been already resolved via context path (in `CliCommand` constructor) */
        if ((this.workspaceFolder.getAngularProjects().size > 1) && !this.cliCommand.getProjectName()) {

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
        } else {
            Output.logWarning(`No Angular project detected, the command will be generated in the root application.`);
        }

        /* Collection may be already defined (from shortcut command or from view) */
        if (!collectionName) {

            try {
                collectionName = await this.askCollectionName();
            } catch (error) {
                /* Happens if `@schematics/angular` is not installed */
                Output.showError(error.message);
                return;
            }

            if (!collectionName) {
                Output.logInfo(`You have canceled the collection choice.`);
                return;
            }

        
        }

        Output.logInfo(`Collection used: "${collectionName}"`);

        this.cliCommand.setCollectionName(collectionName);
        
        const collection = this.collections.getCollection(collectionName);

        if (!collection) {
            Output.showError(`Command canceled: cannot load "${collectionName}" collection. It may not exist in "${workspaceFolder.name}" workspace folder.`);
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
        
        /* Show progress to the user */
        const schematic = await vscode.window.withProgress({
            location: vscode.ProgressLocation.Window,
            title: `Angular Schematics: "${collectionName}:${schematicName}" schematic is loading, please wait...`,
        }, () => this.collection.getSchematic(schematicName!));

        if (!schematic) {
            Output.showError(`Command canceled: cannot load "${collectionName}:${schematicName}" schematic.`);
            return;
        }

        this.cliCommand.setSchematic(schematic);
        this.schematic = schematic;

        let nameAsFirstArg: string | undefined;

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
        if ((collectionName === defaultAngularCollection)
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
                shortcutOptions = await this.askModuleOptions(nameAsFirstArg!);
                if (!shortcutOptions) {
                    Output.logInfo(`You have canceled the module type choice.`);
                    return;
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

        const filePossiblefsPaths = this.cliCommand.launchCommand();

        /* Refresh Explorer, otherwise you may not see the generated files */
        await vscode.commands.executeCommand('workbench.files.action.refreshFilesExplorer');

        this.jumpToFile(filePossiblefsPaths);

    }

    private async askProjectName(): Promise<string | undefined> {

        return vscode.window.showQuickPick(this.workspaceFolder.getAngularProjectsNames(), {
            placeHolder: `In which your Angular projects do you want to generate?`,
            ignoreFocusOut: true,
        });

    }

    private async askCollectionName(): Promise<string | undefined> {

        if  (this.collections.getCollectionsNames().length === 0) {
            throw new Error(`No collection found. "${defaultAngularCollection}" should be present in a correctly installed Angular CLI project.`);
        }
        
        else if  (this.collections.getCollectionsNames().length === 1) {

            const collectionName = this.collections.getCollectionsNames()[0];

            Output.logInfo(`Only collection detected: "${collectionName}". Default to it.`);

            return collectionName;

        }

        else {

            Output.logInfo(`Multiple collections detected: ask the user which one to use.`);

            return vscode.window.showQuickPick(this.collections.getCollectionsNames(), {
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

    private async askNameAsFirstArg(): Promise<string | undefined> {

        const projectName = this.cliCommand.getProjectName();
        const contextPath = this.cliCommand.getContextForNameAsFirstArg();

        Output.logInfo(`Context path detected for default argument: "${contextPath}"`);

        let prompt = `Name or path/name ${projectName ? `in project '${projectName}'` : 'in default project'}?`;

        /* Pro-tip to educate users that it is easier to launch the command from a right-click in Explorer */
        if (this.workspaceFolder.isRootAngularProject(projectName) && !contextPath) {
            prompt = `${prompt} Pro-tip: the path and project can be auto-inferred if you launch the command with a right-click on the directory where you want to generate.`;
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

        /* New `Map` to have a copy and not a reference, as some chances are specific to the current command */
        const types = new Map(this.collections.shortcuts.componentTypesChoices.entries());

        /* `--type` is only supported in Angular >= 9 and the component suffix must be authorized in tslint.json */
        for (const [, config] of types) {

            if (config.options.has('type')) {

                const suffix = config.options.get('type') as string;

                if (!this.schematic.hasOption('type') || !this.workspaceFolder.hasComponentSuffix(suffix, this.projectName)) {
                    config.options.delete('type');
                }

            }

        }

        const typesChoices = Array.from(types.values()).map((type) => type.choice).map((choice) => ({
            ...choice,
            /* Add description based on options */
            description: this.cliCommand.formatOptionsForCommand(types.get(choice.label)!.options).join(' '),
        }));

        const typeChoice = await vscode.window.showQuickPick(typesChoices, {
            placeHolder: `What type of component do you want?`,
            ignoreFocusOut: true,
        });

        return typeChoice ? types.get(typeChoice.label)?.options : undefined;

    }

    private async askModuleOptions(nameAsFirstArg: string): Promise<CliCommandOptions | undefined> {

        /* New `Map` to have a copy and not a reference, as some chances are specific to the current command */
        const types = new Map(this.collections.shortcuts.moduleTypesChoices.entries());

        /* Lazy-loaded module schematic is support in Angular >= 8.1 only */
        if (!this.schematic.hasOption('route')) {
            types.delete(MODULE_TYPE.LAZY);
        }
        /* Lazy-loaded module type need the route name based on previously entered name */
        else {
            /* Usage of `posix` is important here as we are working with path with Linux separators `/` */
            const routeName = path.posix.basename(nameAsFirstArg);

            types.get(MODULE_TYPE.LAZY)?.options.set('route', routeName);
        }

        const typesChoices = Array.from(types.values()).map((type) => type.choice).map((choice) => ({
            ...choice,
            /* Add description based on options */
            description: (types.get(choice.label)!.options.size > 0) ?
                this.cliCommand.formatOptionsForCommand(types.get(choice.label)!.options).join(' ') :
                `No pre-filled option`,
        }));

        const typeChoice = await vscode.window.showQuickPick(typesChoices, {
            placeHolder: `What type of module do you want?`,
            ignoreFocusOut: true,
        });

        return typeChoice ? types.get(typeChoice.label)?.options : undefined;

    }

    private async askShortcutConfirmation(): Promise<boolean | undefined> {

        const choice = await vscode.window.showQuickPick(Shortcuts.confirmationChoices, {
            placeHolder: this.cliCommand.getCommand(),
            ignoreFocusOut: true,
        });

        if (choice?.label === CONFIRMATION_LABEL.YES) {
            return true;
        } else if (choice?.label === CONFIRMATION_LABEL.MORE_OPTIONS) {
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
        }) || [];

        return selectedOptions.map((selectedOption) => selectedOption.label);

    }

    private async askOptionsValues(optionsNames: string[]): Promise<CliCommandOptions> {

        /* Force required options, otherwise the schematic will fail */
        const options = [...this.schematic.getRequiredOptions(), ...this.schematic.getSomeOptions(optionsNames)];

        const filledOptions: CliCommandOptions = new Map();
    
        for (let [optionName, option] of options) {

            let choice: string | string[] | undefined = '';

            const promptSchema = option?.['x-prompt'];

            /* Some schematics have a prompt message already defined, otherwise we use the description */
            const prompt = promptSchema?.message ?? option.description;

            // TODO: [feature] Take user defaults in angular.json into account in ordering
    
            if (option.enum !== undefined) {
    
                choice = await this.askOptionEnum(optionName, option.enum, prompt);
    
            } else if (option.type === 'boolean') {
    
                /* Put the non-default value first */
                const choices = (option.default === true) ? ['false', 'true'] : ['true', 'false'];
    
                choice = await this.askOptionEnum(optionName, choices, prompt);
    
            }
            /* Only makes sense if the option is an array AND have suggestions,
             * otherwise the user must manually type the value in a classic text input box */
            else if ((option.type === 'array')) {

                /* Angular >= 8.3 */
                if (option.items?.enum) {
                    choice = await this.askOptionMultiselect(optionName, option.items.enum, prompt);
                }
                /* Angular < 8.3 (guard schematics) */
                else if (promptSchema?.multiselect && promptSchema?.items) {
                    choice = await this.askOptionMultiselect(optionName, promptSchema.items, prompt);
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

    private async askOptionText(optionName: string, prompt: string): Promise<string | undefined> {

        return vscode.window.showInputBox({
            prompt: `--${optionName}: ${prompt}`,
            ignoreFocusOut: true,
        });

    }

    private async askOptionEnum(optionName: string, choices: string[], placeholder: string): Promise<string | undefined> {

        return vscode.window.showQuickPick(choices, {
            placeHolder: `--${optionName}: ${placeholder}`,
            ignoreFocusOut: true,
        });

    }

    private async askOptionMultiselect(optionName: string, choices: string[], placeholder: string): Promise<string[] | undefined> {

        return vscode.window.showQuickPick(choices, {
            placeHolder: `--${optionName}: ${placeholder}`,
            canPickMany: true,
            ignoreFocusOut: true,
        });

    }

    private async askConfirmation(): Promise<boolean> {

        const confirmationText = `$(check) Confirm`;
        const cancelText = `$(close) Cancel`;

        const choice = await vscode.window.showQuickPick([confirmationText, cancelText], {
            placeHolder: this.cliCommand.getCommand(),
            ignoreFocusOut: true,
        });

        return (choice === confirmationText) ? true : false;

    }

    /**
     * Automatically open the generated file
     */
    private async jumpToFile(possibleFsPaths: string[], counter = 0): Promise<void> {

        /* If we don't know the generated file path, we can't know if the command succeeded or not,
         * as we can't react on Terminal output */
        if (possibleFsPaths.length === 0) {

            Output.logInfo(`Command launched, check terminal to know its status.`);

        } else {

            for (const fsPath of possibleFsPaths) {

                /* If the file exists, open it */
                if (await FileSystem.isReadable(fsPath, { silent: true })) {

                    const document = await vscode.workspace.openTextDocument(fsPath);

                    await vscode.window.showTextDocument(document);
        
                    Output.logInfo(`Command has succeeded! Check terminal for more details.`);

                    return;

                }

            }

            /* Otherwise retry every half second, 6 times (so 3 seconds maximum) */
            if (counter < 6) {

                counter += 1;

                setTimeout(() => {
                    this.jumpToFile(possibleFsPaths, counter);
                }, 500);

            }
            /* After 6 failures */
            else {

                Output.logInfo(`Command launched, check terminal to know its status.`);

            }

        }

    }

}
