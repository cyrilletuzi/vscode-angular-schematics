'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

import { SchematicCollection } from './models/schematic-collection';
import { SchematicSchema, SchematicOption, SchematicOptionDetails } from './models/schematic-schema';

function launchCommandInTerminal(command: string) {

    const terminal = vscode.window.createTerminal();

    /** @todo remove --skipImport */
    terminal.sendText(command);

    /** @todo Investigate (launching this now cancel the command as it takes time) */
    // terminal.dispose();

}

function getCliPathFromMenu(context: any): string {

    /* Check if there is an Explorer context (command could be launched from Palette too, where there is no context) */
    if ((typeof context === 'object') && ('path' in context)) {

        const contextPath = context.path as string;

        /** @todo Use angular.json to manage custom root directory or multiple projects in the same workspace */
        if (contextPath.includes('src/app/')) {

            /* Normalize Windows path into Linux format */
            const normalizedPath = contextPath.replace(/\\\\/, '/').split('src/app/')[1];
    
            if (normalizedPath.includes('.')) {
    
                /* If filename, delete filename by removing everything after the last "/" */
                return normalizedPath.replace(/[^\/]*$/, '');
    
            } else {
    
                /* If directory, add a trailing "/" */
                return `${normalizedPath}/`;
    
            }
    
        }

    }

    return '';

}

/** @todo Replace with util.promisify() when VS Code / Electron is up to date with Node 8+ */
function readFileAsync(path: string): Promise<string> {

    return new Promise((resolve, reject) => {

        fs.readFile(path, 'utf8', (error, data) => {

            if (error) {
                reject(error);
            } else {
                resolve(data);
            }

        });

    });

}

async function getSchematics<T = any>(path: string): Promise<T | null> {

    let json: T | null = null;

    try {
        
        const data = await readFileAsync(path);

        json = JSON.parse(data) as T;

    } catch (error) {

        vscode.window.showErrorMessage(`Can't read Angular schematics. @schematics/angular must be installed.`);

    }

    return json;

}

function getCommandsFromCollection(collection: SchematicCollection): string[] {

    return Object.keys(collection.schematics)
        .filter((command) => !collection.schematics[command].hidden);

}

function isDefaultOption(option: SchematicOptionDetails): boolean {

    return (
        (option.$default !== undefined)
        && (option.$default.$source === 'argv')
        && (option.$default.index === 0)
    ); 

}

function getOptionsFromSchema(schema: SchematicSchema): SchematicOption[] {

    return Object.keys(schema.properties)
        .filter((option) =>
            /* Hide internal CLI options */
            !schema.properties[option].visible
            /* Hide default option, as it's handled separately */
            && !isDefaultOption(schema.properties[option]))
        .map((option) => ({
            [option]: schema.properties[option]
        }));

}

function schemaHasDefaultOption(schema: SchematicSchema): boolean {

    return !!Object.keys(schema.properties)
        .find((option) => isDefaultOption(schema.properties[option]));

}

function schemaHasPath(schema: SchematicSchema): boolean {

    return (Object.keys(schema.properties).indexOf('path') !== -1);

}

async function askForOptions(options: SchematicOption[]): Promise<string[]> {

    const optionsArg = [];

    for (let option of options) {

        const optionName = getOptionName(option);
        const optionDetails = option[optionName];
        let choice: string | undefined = '';

        if (optionDetails.enum !== undefined) {

            /** @todo Put default value last in choices */
            /** @todo Take user defaults in angular.json into account in ordering */
            choice = await vscode.window.showQuickPick(optionDetails.enum, { placeHolder: `--${optionName}` });

        } else if (optionDetails.type === 'string') {

            choice = await vscode.window.showInputBox({ placeHolder: `--${optionName}`, prompt: optionDetails.description });

        } else if (optionDetails.type === 'boolean') {

            /** @todo Take user defaults in angular.json into account in ordering */
            const choices = (optionDetails.default === true) ? ['false', 'true'] : ['true', 'false'];

            choice = await vscode.window.showQuickPick(choices, { placeHolder: `--${optionName}` });

        }

        if (choice) {
            optionsArg.push(`--${optionName} ${choice}`);
        }

    }

    return optionsArg;

}

function getOptionName(option: SchematicOption) {

    return Object.keys(option)[0];

}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext): void {

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let generateComponentCommand = vscode.commands.registerCommand('extension.generateComponent', async (context) => {
        
        const commandpath = getCliPathFromMenu(context);

        const name = await vscode.window.showInputBox({ prompt: `Component name or pathname ?` });

        if (!name) {
            return;
        }

        launchCommandInTerminal(`ng g component ${commandpath}${name}`);

    });

    let generateServiceCommand = vscode.commands.registerCommand('extension.generateService', async (context) => {

        const commandpath = getCliPathFromMenu(context);

        const name = await vscode.window.showInputBox({ prompt: `Service name or pathname ?` });

        if (!name) {
            return;
        }

        launchCommandInTerminal(`ng g service ${commandpath}${name}`);

    });

    let generateCommand = vscode.commands.registerCommand('extension.generate', async (context) => {

        const commandArgs = ['ng generate'];

        if (!vscode.workspace.rootPath) {
            return;
        }

        const collectionPath = path.join(vscode.workspace.rootPath, 'node_modules/@schematics/angular/collection.json');
        
        const collection = await getSchematics<SchematicCollection>(collectionPath);

        if (!collection) {
            return;
        }

        const commands = getCommandsFromCollection(collection);

        const command = await vscode.window.showQuickPick(commands, { placeHolder: `What do you want to generate?` });

        if (!command) {
            return;
        }

        commandArgs.push(command);

        const schemaPath = path.join(vscode.workspace.rootPath, 'node_modules/@schematics/angular', collection.schematics[command].schema);

        const schema = await getSchematics<SchematicSchema>(schemaPath);

        if (!schema) {
            return;
        }

        if (schemaHasDefaultOption(schema)) {

            const name = await vscode.window.showInputBox({ prompt: `Name or pathname?` });

            if (!name) {
                return;
            }

            const commandPath = getCliPathFromMenu(context);

            const nameArg = schemaHasPath(schema) ? `${commandPath}${name}` : name;

            commandArgs.push(nameArg);

        }

        const options = getOptionsFromSchema(schema);

        const selectedOptionsNames = await vscode.window.showQuickPick(options.map((option) => getOptionName(option)), { canPickMany: true });

        if (selectedOptionsNames) {

            const selectedOptions = options
                .filter((option) => (selectedOptionsNames.indexOf(getOptionName(option)) !== -1)
                                    || (schema.required.indexOf(getOptionName(option)) !== -1));

            const filledOptions = await askForOptions(selectedOptions);

            commandArgs.push(...filledOptions);

        }

        const finalCommand = commandArgs.join(' ');

        launchCommandInTerminal(finalCommand);

    });

    context.subscriptions.push(generateComponentCommand, generateServiceCommand, generateCommand);

}

// this method is called when your extension is deactivated
export function deactivate() {}
