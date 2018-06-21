import * as vscode from 'vscode';

import { Generate } from './generate';
import { Collection } from './collection';
import { Schematics } from './schematics';
import { Utils } from './utils';
import { Output } from './output';

export interface ExplorerMenuContext {
    path: string;
}

export class Commands {

    static getContextPath(context?: ExplorerMenuContext): string {

        /* Check if there is an Explorer context (command could be launched from Palette too, where there is no context) */
        return (typeof context === 'object') && (context !== null) && ('path' in context) ? context.path : '';

    }

    static async getWorkspaceFolderPath(path = ''): Promise<string> {

        const workspaceFolder = path ?
            vscode.workspace.getWorkspaceFolder(vscode.Uri.file(path)) :
            await vscode.window.showWorkspaceFolderPick();

        return workspaceFolder ? workspaceFolder.uri.fsPath : '';

    }

    static async generateSimple(schemaName: string, context?: ExplorerMenuContext) {

        const workspaceFolderPath = await this.getWorkspaceFolderPath(this.getContextPath(context));

        if (!workspaceFolderPath) {
            return;
        }

        const generate = new Generate(this.getContextPath(context));

        generate.addSchema(schemaName);

        const collection = new Collection(Schematics.defaultCollection);

        const schema = collection.createSchema(schemaName);

        const defaultOption = await schema.askDefaultOption(generate.path, generate.project);

        if (!defaultOption) {
            return;
        }

        generate.addDefaultOption(defaultOption);

        this.launchCommand(generate.command, workspaceFolderPath);

    }

    static async generate(context?: ExplorerMenuContext) {

        const workspaceFolderPath = await this.getWorkspaceFolderPath(this.getContextPath(context));

        if (!workspaceFolderPath) {
            return;
        }

        await Schematics.load(workspaceFolderPath);

        const generate = new Generate(this.getContextPath(context));

        const collectionName = await Schematics.askSchematic();

        if (!collectionName) {
            return;
        }

        generate.addCollection(collectionName);

        const collection = new Collection(collectionName);

        if (!await collection.load(workspaceFolderPath)) {
            return;
        }

        const schemaName = await collection.askSchema();

        if (!schemaName) {
            return;
        }

        generate.addSchema(schemaName);

        const schema = collection.createSchema(schemaName);

        if (!await schema.load(workspaceFolderPath)) {
            return;
        }

        if (schema.hasDefaultOption()) {

            const defaultOption = await schema.askDefaultOption(generate.path, generate.project);

            if (!defaultOption) {
                return;
            }

            generate.addDefaultOption(defaultOption, schema.hasPath());

        }

        const selectedOptionsNames = await schema.askOptions();

        if (selectedOptionsNames) {

            const filledOptions = await schema.askOptionsValues(selectedOptionsNames);

            filledOptions.forEach((option, optionName) => {
                generate.addOption(optionName, option);
            });

        }

        const confirm = await generate.askConfirmation();

        if (confirm) {

            await this.launchCommand(generate.command, workspaceFolderPath);

        }

    }

    /** @todo Colored output? */
    static async launchCommand(command: string, cwd: string) {

        Output.channel.show();

        Output.channel.appendLine(command);

        try {

            const stdout = await Utils.execAsync(command, cwd);

            Output.channel.appendLine(stdout);

            vscode.window.setStatusBarMessage(`Schematics worked!`, 5000);

        } catch (error) {

            Output.channel.append(error[0]);
            Output.channel.appendLine(error[1]);

            vscode.window.showErrorMessage(`Schematics failed, see Output.`);

        }
    
    }

}