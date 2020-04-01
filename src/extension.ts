import * as vscode from 'vscode';

import { Watchers, Output } from './utils';
import { Workspaces } from './config';

import { UserJourney } from './user-journey';
import { AngularSchematicsProvider } from './view';


/**
 * Function called when the extension is activated, to register new commands.
 * Activation triggers are configured in `package.json`.
 */
export function activate(context: vscode.ExtensionContext): void {

    // TODO: check if it's really useful
    vscode.commands.executeCommand('setContext', 'inAngularProject', true);

    /* Initializes all configurations, which are relative to each workspace */
    Workspaces.init();

    // TODO: do a class to init, and check if it should be removed on deactivate
    vscode.window.registerTreeDataProvider('angular-schematics', new AngularSchematicsProvider());

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

            const journey = new UserJourney();
            journey.start(context, 'component');
    
        }),
        vscode.commands.registerCommand('ngschematics.generateService', (context?: vscode.Uri) => {

            const journey = new UserJourney();
            journey.start(context, 'service');
    
        }),
        vscode.commands.registerCommand('ngschematics.generateModule', (context?: vscode.Uri) => {

            const journey = new UserJourney();
            journey.start(context, 'module');
    
        }),
        vscode.commands.registerCommand('ngschematics.generate', (context?: vscode.Uri, schemaName?: string, collectionName?: string) => {

            const journey = new UserJourney();
            journey.start(context, schemaName, collectionName);
    
        }),
    );

}

/** 
 * Function called when the extension is deactivated, to do cleaning.
 */
export function deactivate(): void {

    Watchers.disposeAll();

    Output.dispose();

}
