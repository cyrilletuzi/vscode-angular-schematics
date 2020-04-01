import * as vscode from 'vscode';
import * as path from 'path';

import { Workspaces, WorkspaceExtended, AngularConfig } from './config';
import { Schematics, Collection, Schema } from './schematics';

import { GenerationCommand, GenerationOptions } from './generation-command';


export class UserJourney {

    private static shortcutSchemas = ['component', 'service', 'module'];

    workspace!: WorkspaceExtended;
    generationCommand!: GenerationCommand;
    schematics!: Schematics;
    collection!: Collection;
    schema!: Schema;

    async start(context?: vscode.Uri, schemaName?: string, collectionName?: string): Promise<void> {

        /* Resolve the current workspace config */
        const workspace = await Workspaces.getCurrent(context);
        if (!workspace) {
            return;
        }

        /* As the configurations are loaded in an async way, they may not be ready */
        try {
            await Workspaces.whenStable();
        } catch {
            vscode.window.showErrorMessage(`Loading configurations needed for Angular schematics was too long. Operation cancelled.`);
            return;
        }

        const workspaceExtended = Workspaces.get(workspace);
        if (!workspaceExtended) {
            vscode.window.showErrorMessage(`Cannot find the workspace config of the provided workspace name.`);
            return;
        }
        this.workspace = workspaceExtended;
        this.schematics = this.workspace.schematics;

        this.generationCommand = new GenerationCommand(workspaceExtended, context);

        /* Collection will already be set when coming from Angular schematics panel */
        if (!collectionName) {

            /* Schema will already be set when coming from generation shortcuts like "Generate a component" */
            if (schemaName) {

                /* For shortcuts, always use default official collection
                 * (default user collection can be set to something else,
                 * and this can be an issue when they are buggy like the Ionic ones) */
                collectionName = AngularConfig.defaultAngularCollection;

            } else {

                if (!collectionName) {

                    try {
                        collectionName = await this.askSchematic();
                    } catch (error) {
                        /* Happens if `@schematics/angular` is not installed */
                        vscode.window.showErrorMessage(error.message);
                        return;
                    }

                    if (!collectionName) {
                        return;
                    }

                }

            }
        
        }

        this.generationCommand.setCollectionName(collectionName);

        const collection = await this.schematics.getCollection(collectionName);

        if (!collection) {
            vscode.window.showErrorMessage(`Cannot load "${collectionName}" collection.`);
            return;
        }

        this.collection = collection;

        if (!schemaName) {

            schemaName = await this.askSchema();

            if (!schemaName) {
                return;
            }

        }

        this.generationCommand.setSchemaName(schemaName);

        const schema = await this.collection.getSchema(schemaName);

        if (!schema) {
            vscode.window.showErrorMessage(`Cannot load "${schemaName}" schematics schema in "${collectionName}" collection.`);
            return;
        }

        this.generationCommand.setSchema(schema);

        this.schema = schema;

        let nameAsFirstArg: string | undefined;

        if (this.schema.hasNameAsFirstArg()) {

            nameAsFirstArg = await this.askNameAsFirstArg();

            if (!nameAsFirstArg) {
                return;
            }

            this.generationCommand.setNameAsFirstArg(nameAsFirstArg);

        }

        let shortcutConfirm: boolean | undefined = false;

        /* Quicker scenario for basic schematics (component, service, module of official schematics) */
        if (UserJourney.shortcutSchemas.includes(schemaName) && (collectionName === AngularConfig.defaultAngularCollection)) {

            let shortcutOptions: GenerationOptions | undefined;

            /* Special scenario for component types */
            if (schemaName === 'component') {

                shortcutOptions = await this.askComponentOptions();
                if (!shortcutOptions) {
                    return;
                }

            /* Special scenario for module types */
            } else if (schemaName === 'module') {

                shortcutOptions = await this.askModuleOptions(nameAsFirstArg!);
                if (!shortcutOptions) {
                    return;
                }

            }

            if (shortcutOptions) {
                this.generationCommand.addOptions(shortcutOptions);
            }

            /* Ask direct confirmation or adding more options or cancel */
            shortcutConfirm = await this.askShortcutConfirmation();

            /* "Cancel" choice */
            if (shortcutConfirm === undefined) {
                return;
            }
            
        }

        /* Ask for advanced options if user didn't choose a direct confirmation */
        if (!shortcutConfirm) {

            const filledOptions = await this.askOptions();

            if (!filledOptions) {
                return;
            }

            this.generationCommand.addOptions(filledOptions);

            /* Ask final confirmation */
            const confirm = await this.askConfirmation();

            /* "Cancel" choice */
            if (!confirm) {
                return;
            }

        }

        await this.generationCommand.launchCommand();

    }

    private async askSchematic(): Promise<string | undefined> {

        if  (this.schematics.getCollectionsNames().length === 0) {
            throw new Error('Cannot find any schematics.');
        }

        if  (this.schematics.getCollectionsNames().length === 1) {
            return AngularConfig.defaultAngularCollection;
        }

        return vscode.window.showQuickPick(this.schematics.getCollectionsNames(), {
            placeHolder: `From which schematics collection?`,
            ignoreFocusOut: true,
        });

    }

    private async askSchema(): Promise<string | undefined> {

        const choice = await vscode.window.showQuickPick(this.collection.getSchemasChoices(), {
            placeHolder: `What do you want to generate?`,
            ignoreFocusOut: true,
        });

        return choice ? choice.label : undefined;

    }

    private async askNameAsFirstArg(): Promise<string | undefined> {

        const project = this.generationCommand.getProject();
        const contextPath = this.generationCommand.getContextForNameAsFirstArg();

        let prompt = `Name or path/name ${project ? `in project '${project}'` : 'in default project'}?`;

        /* Pro-tip to educate users that it is easier to launch the command from a right-click in Explorer */
        if (this.workspace.angularConfig.isRootProject(project) && !contextPath) {
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
        const suffix = `.${this.schema.getName()}`;
        const name = nameInput?.endsWith(suffix) ? nameInput.replace(suffix, '') : nameInput;

        return name;

    }

    private async askModuleOptions(nameAsFirstArg: string): Promise<GenerationOptions | undefined> {

        /* Usage of `posix` is important here as we are working with path with Linux separators `/` */
        const routeName = path.posix.basename(nameAsFirstArg);

        const types = this.schema.getModuleTypes(routeName);
        const typesChoices = Array.from(types.values()).map((type) => type.choice);

        if (typesChoices.length === 0) {
            return new Map();
        }

        const typeChoice = await vscode.window.showQuickPick(typesChoices, {
            placeHolder: `What type of module do you want?`,
            ignoreFocusOut: true,
        });

        return typeChoice ? types.get(typeChoice.label)!.options : undefined;

    }

    private async askComponentOptions(): Promise<GenerationOptions | undefined> {

        const types = this.schema.getComponentTypesChoices();
        const typesChoices = Array.from(types.values()).map((type) => type.choice);

        if (typesChoices.length === 0) {
            return new Map();
        }

        const typeChoice = await vscode.window.showQuickPick(typesChoices, {
            placeHolder: `What type of component do you want?`,
            ignoreFocusOut: true,
        });

        return typeChoice ? types.get(typeChoice.label)!.options : undefined;

    }

    private async askShortcutConfirmation(): Promise<boolean | undefined> {

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
            placeHolder: this.generationCommand.getCommand(),
            ignoreFocusOut: true,
        });

        if (choice?.label === CONFIRM.label) {
            return true;
        } else if (choice?.label === MORE_OPTIONS.label) {
            return false;
        }
        return undefined;

    }

    private async askOptions(): Promise<GenerationOptions> {

        const selectedOptionsNames = await this.askOptionsNames();

        if (selectedOptionsNames) {

            return await this.askOptionsValues(selectedOptionsNames);

        }

        return new Map();

    }

    private async askOptionsNames(): Promise<string[]> {

        const optionsChoices = this.schema.getOptionsChoices();

        if (optionsChoices.length === 0) {
            return [];
        }
        
        const selectedOptions = await vscode.window.showQuickPick(this.schema.getOptionsChoices(), {
            canPickMany: true,
            placeHolder: `Do you need some options? (if not, just press Enter to skip this step)`,
            ignoreFocusOut: true,
        }) || [];

        return selectedOptions.map((selectedOption) => selectedOption.label);

    }

    private async askOptionsValues(optionsNames: string[]): Promise<GenerationOptions> {

        /* Force required options, otherwise the schematic will fail */
        const options = [...this.schema.getRequiredOptions(), ...this.schema.getSomeOptions(optionsNames)];

        const filledOptions: GenerationOptions = new Map();
    
        for (let [optionName, option] of options) {

            let choice: string | string[] | undefined = '';

            const promptSchema = option?.['x-prompt'];

            /* Some schematics have a prompt message already defined, otherwise we use the description */
            const prompt = promptSchema?.message ?? option.description;
    
            if (option.enum !== undefined) {
    
                // TODO: Put default value last in choices
                // TODO: Take user defaults in angular.json into account in ordering
                choice = await this.askOptionEnum(optionName, option.enum, prompt);
    
            } else if (option.type === 'boolean') {
    
                // TODO: Take user defaults in angular.json into account in ordering
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

        const confirmationText = `Confirm`;
        const cancellationText = `Cancel`;

        const choice = await vscode.window.showQuickPick([confirmationText, cancellationText], {
            placeHolder: this.generationCommand.getCommand(),
            ignoreFocusOut: true,
        });

        return (choice === confirmationText) ? true : false;

    }

}