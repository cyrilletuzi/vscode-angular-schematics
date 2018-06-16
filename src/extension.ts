'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

function launchCommandInTerminal(command: string) {

    const terminal = vscode.window.createTerminal();

    /** @todo remove --skipImport */
    terminal.sendText(command);

    /** @todo Investigate (launching this now cancel the command as it takes time) */
    // terminal.dispose();

}

function getMenuSelectedPath(context: any): string {

    if ((typeof context === 'object') && ('path' in context)) {

        return context.path as string;

    }

    return '';

}

function normalizePathForCli(path: string): string {

    if (path.includes('src/app/')) {

        /* Normalize Windows path into Linux format */
        const normalizedPath = path.replace(/\\\\/, '/');

        if (normalizedPath.includes('.')) {

            return normalizedPath.split('src/app/')[1].replace(/[^\/]*$/, '');

        } else {

            return `${normalizedPath.split('src/app/')[1]}/`;

        }

    }

    return '';
    
}

function getCliPathFromMenu(context: any): string {
    return normalizePathForCli(getMenuSelectedPath(context));
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext): void {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "angular-schematics" is now active!');

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let generateComponentCommand = vscode.commands.registerCommand('extension.generateComponent', (context) => {
        
        const path = getCliPathFromMenu(context);

        vscode.window.showInputBox({ prompt: `Component name or pathname ?` }).then((value) => {

            launchCommandInTerminal(`ng g component ${path}${value}`);

        });

    });

    let generateServiceCommand = vscode.commands.registerCommand('extension.generateService', (context) => {

        const path = getCliPathFromMenu(context);

        vscode.window.showInputBox({ prompt: `Service name or pathname ?` }).then((value) => {

            launchCommandInTerminal(`ng g service ${path}${value}`);

        });

    });

    context.subscriptions.push(generateComponentCommand, generateServiceCommand);

}

// this method is called when your extension is deactivated
export function deactivate() {}
