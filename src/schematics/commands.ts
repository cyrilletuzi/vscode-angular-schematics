import * as vscode from 'vscode';

import { Generate } from './generate';
import { Collection } from './collection';
import { Schematics } from './schematics';

interface ExplorerMenuContext {
    path: string;
}

export class Commands {

    protected static get terminal(): vscode.Terminal {

        if (!this._terminal) {
            this._terminal = vscode.window.createTerminal({ name: 'ng generate' });
        }

        return this._terminal;

    }
    protected static _terminal: vscode.Terminal | null = null;

    static getContextPath(context?: ExplorerMenuContext) {

        /* Check if there is an Explorer context (command could be launched from Palette too, where there is no context) */
        return (typeof context === 'object') && (context !== null) && ('path' in context) ? context.path : '';

    }

    static async generateSimple(schemaName: string, context?: ExplorerMenuContext) {

        const generate = new Generate(this.getContextPath(context));

        generate.addSchema(schemaName);

        const collection = new Collection(Schematics.defaultCollection);

        const schema = collection.createSchema(schemaName);

        const defaultOption = await schema.askDefaultOption();

        if (!defaultOption) {
            return;
        }

        generate.addDefaultOption(defaultOption);

        this.launchCommandInTerminal(generate.command);

    }

    static async generate(context?: ExplorerMenuContext) {

        await Schematics.load();

        const generate = new Generate(this.getContextPath(context));

        const collectionName = await Schematics.askSchematic();

        if (!collectionName) {
            return;
        }

        generate.addCollection(collectionName);

        const collection = new Collection(collectionName);

        await collection.load();

        if (!collection.data) {
            return;
        }

        const schemaName = await collection.askSchema();

        if (!schemaName) {
            return;
        }

        generate.addSchema(schemaName);

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

            this.launchCommandInTerminal(generate.command);

        }

    }

    static launchCommandInTerminal(command: string) {

        /* Show terminal so the user can see if the command fails */
        this.terminal.show();
    
        this.terminal.sendText(command);
    
    }

}