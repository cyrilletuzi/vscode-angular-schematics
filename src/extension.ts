import * as vscode from 'vscode';

import { defaultAngularCollection } from './defaults';
import { Watchers, Output } from './utils';
import { Workspace } from './workspace';
import { UserJourney } from './generation';
import { SchematicsTreeDataProvider } from './view';

let treeDataProvider: vscode.TreeView<vscode.TreeItem> | undefined;

/**
 * Function called when the extension is activated, to register new commands.
 * Activation triggers are configured in `package.json`.
 */
export function activate(context: vscode.ExtensionContext): void {

    Output.logInfo(`Angular schematics extension has been activated.`);

    /* Enable context menus */
    vscode.commands.executeCommand('setContext', 'inAngularProject', true);

    /* Initialize all configurations */
    Workspace.init();

    /* Add a new View with the list of all Angular schematics.
     * Collections must be loaded to be able to load the view */
    Workspace.whenStable().then(() => {

        treeDataProvider = vscode.window.createTreeView('angular-schematics', {
            treeDataProvider: new SchematicsTreeDataProvider(),
        });
        treeDataProvider.message = `Hello! While this list is useful to see all the schematics available,
        it is easier to launch a generation with a right-click on a folder in the Explorer,
        as then the extension will infer the workspace folder, the path and the project.`;

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
        vscode.commands.registerCommand('ngschematics.generateComponent', (contextUri?: vscode.Uri) => {

            Output.logInfo(`Starting journey to generate a component.`);

            /* For shortcuts, always use default official collection
             * (default user collection can be set to something else,
             * and this can be an issue when they are buggy like the Ionic ones) */
            (new UserJourney()).start(contextUri, defaultAngularCollection, 'component');
    
        }),
        vscode.commands.registerCommand('ngschematics.generateService', (contextUri?: vscode.Uri) => {

            Output.logInfo(`Starting journey to generate a service.`);

            /* For shortcuts, always use default official collection
             * (default user collection can be set to something else,
             * and this can be an issue when they are buggy like the Ionic ones) */
            (new UserJourney()).start(contextUri, defaultAngularCollection, 'service');
    
        }),
        vscode.commands.registerCommand('ngschematics.generateModule', (contextUri?: vscode.Uri) => {

            Output.logInfo(`Starting journey to generate a module.`);

            /* For shortcuts, always use default official collection
             * (default user collection can be set to something else,
             * and this can be an issue when they are buggy like the Ionic ones) */
            (new UserJourney()).start(contextUri, defaultAngularCollection, 'module');
    
        }),
        vscode.commands.registerCommand('ngschematics.generate', (contextUri?: vscode.Uri, options?: { collectionName?: string, schematicName?: string }) => {

            Output.logInfo(`Starting journey to generate a schematics.`);

            (new UserJourney()).start(contextUri, options?.collectionName, options?.schematicName);
    
        }),
    );

}

/** 
 * Function called when the extension is deactivated, to do cleaning.
 */
export function deactivate(): void {

    Workspace.watcher.dispose();

    Watchers.disposeAll();

    Output.dispose();

    treeDataProvider?.dispose();

}
