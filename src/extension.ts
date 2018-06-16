'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import { Collection, Generate, Utils } from './schematics';


// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext): void {

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    const generateComponentCommand = vscode.commands.registerCommand('extension.generateComponent', async (context) => {
        
        const generate = new Generate(context);

        const collection = new Collection('@schematics/angular');

        const schemaName = 'component';

        generate.add(schemaName);

        const schema = collection.createSchema(schemaName);

        const defaultOption = await schema.askDefaultOption();

        if (!defaultOption) {
            return;
        }

        generate.addPathAndName(defaultOption);

        Utils.launchCommandInTerminal(generate.command);

    });

    const generateServiceCommand = vscode.commands.registerCommand('extension.generateService', async (context) => {

        const generate = new Generate(context);

        const collection = new Collection('@schematics/angular');

        const schemaName = 'service';

        generate.add(schemaName);

        const schema = collection.createSchema(schemaName);

        const defaultOption = await schema.askDefaultOption();

        if (!defaultOption) {
            return;
        }

        generate.addPathAndName(defaultOption);

        Utils.launchCommandInTerminal(generate.command);

    });

    const generateCommand = vscode.commands.registerCommand('extension.generate', async (context) => {

        const generate = new Generate(context);

        const collection = new Collection('@schematics/angular');

        await collection.load();

        if (!collection.data) {
            return;
        }

        const schemaName = await collection.askSchema();

        if (!schemaName) {
            return;
        }

        generate.add(schemaName);

        const schema = collection.createSchema(schemaName);

        await schema.load();

        if (!schema.data) {
            return;
        }

        if (schema.hasDefaultOption()) {

            const defaultOption = await schema.askDefaultOption();

            if (!defaultOption) {
                return;
            }

            if (schema.hasPath()) {
                generate.addPathAndName(defaultOption);
            } else {
                generate.add(defaultOption);
            }

        }

        const selectedOptionsNames = await vscode.window.showQuickPick(schema.getOptionsNames(), { canPickMany: true });

        if (selectedOptionsNames) {

            const selectedOptions = schema.filterSelectedOptions(selectedOptionsNames);

            const filledOptions = await schema.askOptions(selectedOptions);

            generate.add(...filledOptions);

        }

        Utils.launchCommandInTerminal(generate.command);

    });

    context.subscriptions.push(generateComponentCommand, generateServiceCommand, generateCommand);

}

// this method is called when your extension is deactivated
export function deactivate() {}
