import * as path from 'path';
import * as vscode from 'vscode';
import { Collection } from './collection';
import { Generate } from './generate';
import { Output } from './output';
import { Schema } from './schema';
import { Schematics } from './schematics';
import { Utils } from './utils';


export interface ExplorerMenuContext {
    path: string;
}

export interface GenerateConfig {
    collectionName?: string;
    schemaName?: string;
}

export class Commands {

    static getContextPath(context?: ExplorerMenuContext): string {

        /* Check if there is an Explorer context (command could be launched from Palette too, where there is no context) */
        return (typeof context === 'object') && (context !== null) && ('path' in context) ? context.path : '';

    }

    static getDefaultWorkspace(): vscode.WorkspaceFolder | null {

        if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length === 1) {
            return vscode.workspace.workspaceFolders[0];
        }

        return null;

    }

    static async getWorkspaceFolderPath(path = ''): Promise<string> {

        const workspaceFolder = path ?
            vscode.workspace.getWorkspaceFolder(vscode.Uri.file(path)) :
            (this.getDefaultWorkspace() || await vscode.window.showWorkspaceFolderPick());

        return workspaceFolder ? workspaceFolder.uri.fsPath : '';

    }

    static async generate(context: ExplorerMenuContext, { collectionName, schemaName }: GenerateConfig = {}) {

        const shortcutCommand = (collectionName && schemaName) ? true : false;

        const workspaceFolderPath = await this.getWorkspaceFolderPath(this.getContextPath(context));

        if (!workspaceFolderPath) {
            return;
        }

        const generate = new Generate(this.getContextPath(context), workspaceFolderPath);

        if (collectionName !== Schematics.angularCollection) {

            await Schematics.load(workspaceFolderPath);

            if (!collectionName) {

                collectionName = await Schematics.askSchematic();

                if (!collectionName) {
                    return;
                }

            }

            generate.addCollection(collectionName);
        
        }

        const collection = new Collection(collectionName);

        if (!await collection.load(workspaceFolderPath)) {
            return;
        }

        if (!schemaName) {

            schemaName = await collection.askSchema();

            if (!schemaName) {
                return;
            }

        }

        generate.addSchema(schemaName);

        const schema = await collection.createSchema(schemaName, workspaceFolderPath);

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

        let filledOptions: Map<string, string | string[]> | undefined;

        if (shortcutCommand && (collectionName === Schematics.angularCollection) && (schemaName === 'component')) {

            filledOptions = await this.askComponentOptions(schema);

        } else if (shortcutCommand && (collectionName === Schematics.angularCollection) && (schemaName === 'module')) {

            filledOptions = await this.askModuleOptions(schema);

        } else {

            filledOptions = await this.askOptions(schema);

        }

        if (!filledOptions) {
            return;
        }

        filledOptions.forEach((option, optionName) => {
            generate.addOption(optionName, option);
        });

        const confirm = await generate.askConfirmation();

        if (confirm) {

            await this.launchCommand(generate, workspaceFolderPath);

        }

    }

    /** @todo Colored output? */
    static async launchCommand(generate: Generate, cwd: string): Promise<void> {

        Output.channel.show();

        Output.channel.appendLine(generate.command);

        try {

            const stdout = await Utils.execAsync(await generate.getExecCommand(cwd), cwd);

            Output.channel.appendLine(stdout);

            vscode.window.setStatusBarMessage(`Schematics worked!`, 5000);

            try {
                await this.jumpToFile(stdout, cwd, generate.defaultOption, generate.schema);
            } catch (error) {}

        } catch (error) {

            Output.channel.append(error[0]);
            Output.channel.appendLine(error[1]);

            vscode.window.showErrorMessage(`Schematics failed, see Output.`);

        }
    
    }

    static async jumpToFile(stdout: string, cwd: string, defaultOption: string, schema: string): Promise<void> {

        const name = defaultOption.includes('/') ? defaultOption.substr(defaultOption.lastIndexOf('/') + 1) : defaultOption;

        const stdoutRegExp = new RegExp(`CREATE (.*${name}(?:\.${schema})?\.ts)`);

        const stdoutMatches = stdout.match(stdoutRegExp);

        if (stdoutMatches) {

            const document = await vscode.workspace.openTextDocument(path.join(cwd, stdoutMatches[1]));

            await vscode.window.showTextDocument(document);

        }

    }

    static async askOptions(schema: Schema): Promise<Map<string, string | string[]>> {

        const selectedOptionsNames = await schema.askOptions();

        if (selectedOptionsNames) {

            return await schema.askOptionsValues(selectedOptionsNames);

        }

        return new Map();


    }

    static async askComponentOptions(schema: Schema): Promise<Map<string, string> | undefined> {

        const TYPE_CLASSIC = `Classic component`;
        const TYPE_EXPORTED = `Exported component`;
        const TYPE_PURE = `Pure component`;
        const TYPE_EXPORTED_PURE = `Exported pure component`;
        const TYPE_ELEMENT = `Element component`;
        const TYPE_ADVANCED = `Advanced component`;

        const componentTypes: vscode.QuickPickItem[] = [
            { label: TYPE_CLASSIC, description: `No option` },
            { label: TYPE_EXPORTED, description: `--export (no other option)` },
            { label: TYPE_PURE, description: `--changeDetection OnPush (no other option)` },
            { label: TYPE_EXPORTED_PURE, description: `--export --changeDetection OnPush (no other option)` },
        ];

        const viewEncapsulation = schema.options.get('viewEncapsulation');

        if (schema.options.get('entryComponent') && viewEncapsulation && viewEncapsulation.enum && (viewEncapsulation.enum.indexOf('ShadowDom') !== -1)) {

            componentTypes.push({ label: TYPE_ELEMENT, description: `--entryComponent --viewEncapsulation ShadowDom` },);

        }

        componentTypes.push({ label: TYPE_ADVANCED, description: `You'll be able to choose all available options` });

        const componentType = await vscode.window.showQuickPick(componentTypes, { placeHolder: `What type of component do you want?` });

        if (!componentType) {
            return undefined;
        }

        let componentOptions = new Map();

        switch (componentType.label) {

            case TYPE_EXPORTED:
            componentOptions.set('export', 'true');
            break;

            case TYPE_PURE:
            componentOptions.set('changeDetection', 'OnPush');
            break;

            case TYPE_EXPORTED_PURE:
            componentOptions.set('export', 'true');
            componentOptions.set('changeDetection', 'OnPush');
            break;

            case TYPE_ELEMENT:
            componentOptions.set('entryComponent', 'true');
            componentOptions.set('viewEncapsulation', 'ShadowDom');
            break;

        }

        if (componentType.label === TYPE_ADVANCED) {
            componentOptions = await this.askOptions(schema);
        }

        return componentOptions;

    }
    
    static async askModuleOptions(schema: Schema): Promise<Map<string, string> | undefined> {

        const moduleTypes: vscode.QuickPickItem[] = [
            { label: `Classic module`, description: `No option` },
            { label: `Classic module, imported`, description: `--module app (no other option)` },
            { label: `Module with routing, imported`, description: `--routing --module app (no other option)` },
            { label: `Advanced module`, description: `You'll be able to choose all available options` },
        ];

        const moduleType = await vscode.window.showQuickPick(moduleTypes, { placeHolder: `What type of module do you want?` });

        if (!moduleType) {
            return undefined;
        }

        let moduleOptions = new Map();

        switch (moduleType.label) {

            case moduleTypes[1].label:
            moduleOptions.set('module', 'app');
            break;

            case moduleTypes[2].label:
            moduleOptions.set('routing', 'true');
            moduleOptions.set('module', 'app');
            break;

        }

        if (moduleType.label === moduleTypes[3].label) {
            moduleOptions = await this.askOptions(schema);
        }

        return moduleOptions;

    }

}