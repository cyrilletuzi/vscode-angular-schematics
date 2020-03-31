import * as vscode from 'vscode';

import { Collection } from './collection';
import { CurrentGeneration } from './current-generation';
import { Output } from './output';
import { Schematics } from './schematics';
import { AngularConfig } from './config-angular';
import { WorkspacesConfig } from './config-workspaces';


export class Commands {

    static async generate(context?: vscode.Uri, schemaName?: string, collectionName?: string): Promise<void> {

        /* Resolve the current workspace config */
        const workspace = await WorkspacesConfig.getCurrentWorkspace(context);
        if (!workspace) {
            return;
        }

        const workspaceExtended = WorkspacesConfig.getWorkspaceExtended(workspace);
        if (!workspaceExtended) {
            Output.logError(`Cannot find the workspace config of the provided workspace name.`);
            return;
        }

        const generate = new CurrentGeneration(workspaceExtended, context);

        /* Collection will already be set when coming from Angular schematics panel */
        if (!collectionName) {

            /* Schema will already be set when coming from generation shortcuts like "Generate a component" */
            if (schemaName) {

                /* For shortcuts, always use default official collection
                 * (default user collection can be set to something else,
                 * and this can be an issue when they are buggy like the Ionic ones) */
                collectionName = AngularConfig.defaultAngularCollection;

            } else {

                await Schematics.load(workspace);

                if (!collectionName) {

                    collectionName = await Schematics.askSchematic();

                    if (!collectionName) {
                        return;
                    }

                }

                generate.addCollection(collectionName);

                /* Special case: ngx-spec needs a special path */
                if (collectionName === 'ngx-spec') {
                    generate.resetCommandPath();
                }

            }
        
        }

        const collection = new Collection(workspace, collectionName);

        if (!await collection.load()) {
            return;
        }

        if (!schemaName) {

            schemaName = await collection.askSchema();

            if (!schemaName) {
                return;
            }

        }

        generate.addSchema(schemaName);

        const schema = await collection.createSchema(schemaName);

        if (!await schema.load(workspace)) {
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
        if (['component', 'service', 'module'].includes(schemaName) && (collectionName === AngularConfig.defaultAngularCollection)) {

            let shortcutOptions: Map<string, string | string[]> | undefined;

            // TODO: check if this check is relevant
            if (collectionName === AngularConfig.defaultAngularCollection) {

                /* Special scenario for component types */
                if (schemaName === 'component') {

                    shortcutOptions = await generate.askComponentOptions(schema);
                    if (!shortcutOptions) {
                        return;
                    }

                /* Special scenario for module types */
                } else if (schemaName === 'module') {

                    shortcutOptions = await generate.askModuleOptions(schema, defaultOption);
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
            shortcutConfirm = await generate.askShortcutConfirmation(generate);

            /* "Cancel" choice */
            if (shortcutConfirm === undefined) {
                return;
            }
            
        }

        /* Ask for advanced options if user didn't choose a direct confirmation */
        if (!shortcutConfirm) {

            let filledOptions: Map<string, string | string[]> | undefined;

            filledOptions = await generate.askOptions(schema);

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

        await generate.launchCommand();

    }

}