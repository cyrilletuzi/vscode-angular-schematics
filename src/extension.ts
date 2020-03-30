import * as vscode from 'vscode';

import { AngularSchematicsProvider } from './schematics/view';
import { Commands } from './schematics/commands';
import { Output } from './schematics/output';
import { Preferences } from './schematics/preferences';
import { WorkspacesConfig } from './schematics/config-workspaces';
import { Watchers } from './schematics/watchers';


/**
 * Function called when the extension is activated, to register new commands.
 * Activation triggers are configured in `package.json`.
 */
export function activate(context: vscode.ExtensionContext): void {

    // TODO: check if it's really useful
    vscode.commands.executeCommand('setContext', 'inAngularProject', true);

    WorkspacesConfig.init();

    // TODO: do a class to init, and check if it should be removed on deactivate
    vscode.window.registerTreeDataProvider('angular-schematics', new AngularSchematicsProvider());

    // TODO: refactor
    Preferences.init();

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

            Commands.generate(context, 'component');
    
        }),
        vscode.commands.registerCommand('ngschematics.generateService', (context?: vscode.Uri) => {

            Commands.generate(context, 'service');
    
        }),
        vscode.commands.registerCommand('ngschematics.generateModule', (context?: vscode.Uri) => {

            Commands.generate(context, 'module');
    
        }),
        vscode.commands.registerCommand('ngschematics.generate', (context?: vscode.Uri, schemaName?: string, collectionName?: string) => {

            Commands.generate(context, schemaName, collectionName);
    
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
