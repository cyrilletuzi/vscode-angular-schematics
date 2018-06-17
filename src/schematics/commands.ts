import * as vscode from 'vscode';

import { Generate } from './generate';
import { Collection } from './collection';

interface ExplorerMenuContext {
    path: string;
}

export class Commands {

    static getContextPath(context?: ExplorerMenuContext) {

        /* Check if there is an Explorer context (command could be launched from Palette too, where there is no context) */
        return (typeof context === 'object') && (context !== null) && ('path' in context) ? context.path : '';

    }

    static async generateSimple(schemaName: string, context?: ExplorerMenuContext) {

        const generate = new Generate(Commands.getContextPath(context));

        generate.addSchema(schemaName);

        const collection = new Collection(Generate.defaultCollection);

        const schema = collection.createSchema(schemaName);

        const defaultOption = await schema.askDefaultOption();

        if (!defaultOption) {
            return;
        }

        generate.addDefaultOption(defaultOption);

        Commands.launchCommandInTerminal(generate.command);

    }

    static async generate(context?: ExplorerMenuContext) {

        const generate = new Generate(Commands.getContextPath(context));

        const collectionsNames: string[] = [Generate.defaultCollection];

        const userConfiguration: { schematics?: string[]; } | undefined = vscode.workspace.getConfiguration().get('ngschematics');

        if (userConfiguration && userConfiguration.schematics) {

            collectionsNames.push(...userConfiguration.schematics);

        }

        const collectionName = (collectionsNames.length === 1) ? collectionsNames[0] : 
            await vscode.window.showQuickPick(collectionsNames, {  placeHolder: `From which shematics collection?` });

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

        const selectedOptionsNames = await vscode.window.showQuickPick(schema.getOptionsNames(), { canPickMany: true });

        if (selectedOptionsNames) {

            const selectedOptions = schema.filterSelectedOptions(selectedOptionsNames);

            const filledOptions = await schema.askOptions(selectedOptions);

            filledOptions.forEach((option, optionName) => {
                generate.add(optionName, option);
            });

        }

        Commands.launchCommandInTerminal(generate.command);

    }

    static launchCommandInTerminal(command: string) {

        const terminal = vscode.window.createTerminal();

        /* Show terminal so the user can see if the command fails */
        terminal.show();
    
        terminal.sendText(command);
    
    }

}