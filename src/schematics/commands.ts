import * as vscode from 'vscode';

import { Collection } from './collection';
import { CurrentGeneration } from './current-generation';
import { Schematics } from './schematics';
import { AngularConfig } from './config-angular';
import { WorkspacesConfig, WorkspaceExtended } from './config-workspaces';
import { Schema } from './schema';


export class Commands {

    workspace!: WorkspaceExtended;
    generation!: CurrentGeneration;
    schematics!: Schematics;
    collection!: Collection;
    schema!: Schema;

    async generate(context?: vscode.Uri, schemaName?: string, collectionName?: string): Promise<void> {

        /* Resolve the current workspace config */
        const workspace = await WorkspacesConfig.getCurrentWorkspace(context);
        if (!workspace) {
            return;
        }

        const workspaceExtended = WorkspacesConfig.getWorkspaceExtended(workspace);
        if (!workspaceExtended) {
            vscode.window.showErrorMessage(`Cannot find the workspace config of the provided workspace name.`);
            return;
        }
        this.workspace = workspaceExtended;
        this.schematics = this.workspace.schematics;

        this.generation = new CurrentGeneration(workspaceExtended, context);

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

        this.generation.setCollectionName(collectionName);

        const collection = await this.schematics.getCollection(collectionName);

        if (!collection) {
            vscode.window.showErrorMessage(`Cannot load "${collectionName}" schematics collection.`);
            return;
        }

        this.collection = collection;

        if (!schemaName) {

            schemaName = await this.askSchema();

            if (!schemaName) {
                return;
            }

        }

        this.generation.setSchema(schemaName);

        const schema = await this.collection.getSchema(schemaName);

        if (!schema) {
            vscode.window.showErrorMessage(`Cannot load "${schemaName}" schematics schema in "${collectionName}" collection.`);
            return;
        }

        this.schema = schema;

        let defaultOption: string | undefined;

        if (this.schema.hasNameAsFirstArg()) {

            defaultOption = await this.askNameAsFirstArg();

            if (!defaultOption) {
                return;
            }

            this.generation.setNameAsFirstArg(defaultOption);

        }

        let shortcutConfirm: boolean | undefined = false;

        /* Quicker scenario for basic schematics (component, service, module) */
        if (['component', 'service', 'module'].includes(schemaName) && (collectionName === AngularConfig.defaultAngularCollection)) {

            let shortcutOptions: Map<string, string | string[]> | undefined;

            // TODO: check if this check is relevant
            if (collectionName === AngularConfig.defaultAngularCollection) {

                /* Special scenario for component types */
                if (schemaName === 'component') {

                    shortcutOptions = await this.generation.askComponentOptions();
                    if (!shortcutOptions) {
                        return;
                    }

                /* Special scenario for module types */
                } else if (schemaName === 'module') {

                    shortcutOptions = await this.generation.askModuleOptions(schema, defaultOption);
                    if (!shortcutOptions) {
                        return;
                    }

                }

            }

            if (shortcutOptions) {
                shortcutOptions.forEach((option, optionName) => {
                    this.generation.addOption(optionName, option);
                });
            }

            /* Ask direct confirmation or adding more options or cancel */
            shortcutConfirm = await this.generation.askShortcutConfirmation(this.generation);

            /* "Cancel" choice */
            if (shortcutConfirm === undefined) {
                return;
            }
            
        }

        /* Ask for advanced options if user didn't choose a direct confirmation */
        if (!shortcutConfirm) {

            let filledOptions: Map<string, string | string[]> | undefined;

            filledOptions = await this.generation.askOptions(schema);

            if (!filledOptions) {
                return;
            }

            filledOptions.forEach((option, optionName) => {
                this.generation.addOption(optionName, option);
            });

            /* Ask final confirmation */
            const confirm = await this.generation.askConfirmation();

            /* "Cancel" choice */
            if (!confirm) {
                return;
            }

        }

        await this.generation.launchCommand();

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

        const project = this.generation.getProject();

        let prompt = `Name or path/name ${project ? `in project '${project}'` : 'in default project'}?`;

        /* Pro-tip to educate users that it is easier to launch the command from a right-click in Explorer */
        if (this.workspace.angularConfig.isRootProject(project) && !this.generation.hasContextPath()) {
            prompt = `${prompt} Pro-tip: the path and project can be auto-inferred if you launch the command with a right-click on the directory where you want to generate.`;
        }

        const contextPath = this.generation.getContextForNameAsFirstArg();

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

}