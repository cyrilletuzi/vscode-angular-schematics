import * as vscode from 'vscode';

import { defaultAngularCollection } from './defaults';
import { Watchers, Output } from './utils';
import { Workspaces } from './config';
import { UserJourney } from './generation';
import { SchematicsTreeDataProvider } from './view';

let treeDataProvider: vscode.TreeView<vscode.TreeItem> | undefined;

/**
 * Function called when the extension is activated, to register new commands.
 * Activation triggers are configured in `package.json`.
 */
export function activate(context: vscode.ExtensionContext): void {

    Output.logInfo(`Angular schematics extension has been activated.`);

    // TODO: check if it's really useful
    vscode.commands.executeCommand('setContext', 'inAngularProject', true);

    /* Initializes all configurations, which are relative to each workspace */
    Workspaces.init();

    /* Add a new Code view with the list of all Angular schematics.
     * Collections must be loaded to be able to load the view */
    Workspaces.whenStable().then(() => {

        treeDataProvider = vscode.window.createTreeView('angular-schematics', {
            treeDataProvider: new SchematicsTreeDataProvider(),
        });
        treeDataProvider.message = `Hello! While this list is useful to see all the schematics available,
        it is easier to launch a generation from a right-click on a folder in the Explorer,
        as then the extension will automatically infer the workspace, the path and the project.`;

    }).catch();
    
    /* 
     * Register new commands. Important things:
     * - each id (first parameter of `registerCommand()`) must be configured in `package.json`
     * - the callback parameters' values depends on how the command is trigerred:
     *   - with a right click in Explorer: will a `Uri` object of the file or folder clicked
     *   - with the Command Palette or the dedicated extension panel: `undefined`
     *   - from the dedicated extension panel: `undefined`, clicked schema's name, clicked collection's name 
     */
    context.subscriptions.push(
        vscode.commands.registerCommand('ngschematics.generateComponent', (context?: vscode.Uri) => {

            Output.logInfo(`Starting journey to generate a component.`);

            const journey = new UserJourney();

            /* For shortcuts, always use default official collection
             * (default user collection can be set to something else,
             * and this can be an issue when they are buggy like the Ionic ones) */
            journey.start(context, defaultAngularCollection, 'component');
    
        }),
        vscode.commands.registerCommand('ngschematics.generateService', (context?: vscode.Uri) => {

            Output.logInfo(`Starting journey to generate a service.`);

            const journey = new UserJourney();

            /* For shortcuts, always use default official collection
             * (default user collection can be set to something else,
             * and this can be an issue when they are buggy like the Ionic ones) */
            journey.start(context, defaultAngularCollection, 'service');
    
        }),
        vscode.commands.registerCommand('ngschematics.generateModule', (context?: vscode.Uri) => {

            Output.logInfo(`Starting journey to generate a module.`);

            const journey = new UserJourney();

            /* For shortcuts, always use default official collection
             * (default user collection can be set to something else,
             * and this can be an issue when they are buggy like the Ionic ones) */
            journey.start(context, defaultAngularCollection, 'module');
    
        }),
        vscode.commands.registerCommand('ngschematics.generate', (context?: vscode.Uri, collectionName?: string, schematicName?: string) => {

            Output.logInfo(`Starting journey to generate a schematics.`);

            const journey = new UserJourney();
            journey.start(context, collectionName, schematicName);
    
        }),
    );

}

/** 
 * Function called when the extension is deactivated, to do cleaning.
 */
export function deactivate(): void {

    Watchers.disposeAll();

    Output.dispose();

    treeDataProvider?.dispose();

}
