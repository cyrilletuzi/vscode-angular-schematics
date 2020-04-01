import * as vscode from 'vscode';
import * as path from 'path';
import * as os from 'os';
import * as childProcess from 'child_process';

import { FileSystem, Output } from './utils';
import { WorkspaceExtended, AngularConfig } from './config';
import { Schema } from './schematics';

const osList = new Map<string, string>();
osList.set('darwin', 'osx');
osList.set('win32', 'windows');

const userOs = osList.get(os.platform()) || 'linux';
// TODO: Manage custom shell for Windows
const userShell = (userOs === 'windows') ? undefined : vscode.workspace.getConfiguration().get(`terminal.integrated.shell.${userOs}`) as string;

interface ContextPath {
    /** Eg. `/Users/Elmo/angular-project/src/app/some-module` */
    full: string;
    /** Eg. `src/app/some-module` */
    relativeToWorkspace: string;
    /** Eg. `some-module` */
    relativeToSource: string;
}

// TODO: check if it's the right place for this
/** List of options */
export type GenerationOptions = Map<string, string | string[]>;

export class GenerationCommand {

    /* Path details of the right-clicked file or directory */
    private contextPath: ContextPath = {
        full: '',
        relativeToWorkspace: '',
        relativeToSource: '',
    };
    private baseCommand = 'ng g';
    private project = '';
    private collectionName = AngularConfig.defaultAngularCollection;
    private schemaName = '';
    private schema!: Schema;
    private nameAsFirstArg = '';
    private options: GenerationOptions = new Map();
    private cliLocal: boolean | null = null;

    constructor(
        private workspace: WorkspaceExtended,
        context?: vscode.Uri,
    ) {

        this.setContextPathAndProject(context);

    }

    /**
     * Get the full generation command, in the shortest form possible.
     */
    getCommand(): string {

        return [
            this.baseCommand,
            this.formatCollectionAndSchemaForCommand(),
            this.nameAsFirstArg,
            ...this.formatOptionsForCommand(),
        ].join(' ');

    }

    /**
     * Set collection's name
     */
    setCollectionName(name: string): void {

        this.collectionName = name;

    }

    /**
     * Set schema's name
     */
    setSchemaName(name: string): void {

        this.schemaName = name;

    }

    /**
     * Set schema, and project if relevant.
     */
    setSchema(schema: Schema): void {

        this.schema = schema;

        /* If a project was detected, the schema supports it and it's not the root project, add the project */
        if (this.project && schema.hasOption('project') && !this.workspace.angularConfig.isRootProject(this.project)) {
            this.options.set('project', this.project);
        }

    }

    /**
     * Get project (can be an empty string, in which case the command will be for the root project)
     */
    getProject(): string {
        return this.project;
    }

    /**
     * Get context path with a trailing slash to prefill first argument option.
     * With a trailing slash so the user can just write the name directly.
     */
    getContextForNameAsFirstArg(): string {

        /* `ngx-spec` schematics works on a file, and thus need the file part */
        if (this.collectionName === 'ngx-spec') {
            return this.contextPath.relativeToSource;
        }

        /* Otherwise we remove the file part */
        const context = FileSystem.removeFilename(this.contextPath.relativeToSource);

        /* Add  trailing slash so the user can just write the name directly*/
        const contextWithTrailingSlash = (context !== '') ? `${context}/` : '';

        return contextWithTrailingSlash;

    }

    /**
     * Set name as first argument of the command line, eg. `path/to/some-component`
     */
    setNameAsFirstArg(pathToName: string): void {

        this.nameAsFirstArg = pathToName;

    }

    /**
     * Add options
     */
    addOptions(options: GenerationOptions): void {

        for (const [name, option] of options) {

            /* Check they exist in schema */
            if (this.schema.hasOption(name)) {
                this.options.set(name, option);
            }

        }

    }

    // TODO: Move to Terminal API
    async launchCommand(): Promise<void> {

        Output.channel.show();

        Output.channel.appendLine(this.getCommand());

        try {

            const exexCommand = (await this.isCliLocal()) ? `"./node_modules/.bin/ng"${this.getCommand().substr(2)}` : this.getCommand();

            const stdout = await this.execAsync(exexCommand, this.workspace.uri);

            Output.channel.appendLine(stdout);

            await vscode.commands.executeCommand('workbench.files.action.refreshFilesExplorer');

            vscode.window.setStatusBarMessage(`Schematics worked!`, 5000);

            try {
                await this.jumpToFile(stdout);
            } catch (error) {}

        } catch (error) {

            Output.channel.append(error[0]);
            Output.channel.appendLine(error[1]);

            vscode.window.showErrorMessage(`Schematics failed, see Output.`);

        }
    
    }

    /**
     * Set context path and prject.
     */
    private setContextPathAndProject(context?: vscode.Uri): void {

        if (!context?.path) {
            return;
        }

        this.contextPath.full = context.path;

        /* Remove workspace path from full path,
         * eg. `/Users/Elmo/angular-project/src/app/some-module` => `src/app/some-module` */
        this.contextPath.relativeToWorkspace = this.contextPath.full.substr(this.workspace.uri.path.length + 1);

        for (const [projectName, projectConfig] of this.workspace.angularConfig.getProjects()) {

            /* If the relative path starts with the project path */
            if (this.contextPath.relativeToWorkspace.startsWith(projectConfig.sourcePath)) {

                this.project = projectName;

                /* Remove source path from workspace relative path,
                 * eg. `src/app/some-module` => `some-module` */
                this.contextPath.relativeToSource = this.contextPath.relativeToWorkspace.substr(projectConfig.sourcePath.length + 1);

                return;

            }

        }

        /* Default values */
        this.contextPath.relativeToSource = '';
        this.project = '';

    }

    /**
     * Format collection and schema for the generation command:
     * - just the schema if the collection is already the user default's one (eg. `component`)
     * - otherwise the full collection scheme (eg. `@schematics/angular:component`)
     */
    private formatCollectionAndSchemaForCommand(): string {

        return (this.collectionName !== this.workspace.angularConfig.getDefaultUserCollection()) ?
            `${this.collectionName}:${this.schemaName}` :
            this.schemaName;

    }

    /**
     * Format options for the generation command.
     */
    private formatOptionsForCommand(): string[] {

        /* Format the values. The goal is to be shortest as possible,
         * so the user can see the full command, as VS Code input box has a fixed size */
        return Array.from(this.options.entries()).map(([key, value]) => {

            /* Boolean options are always true by default,
                * ie. `--export` is equivalent to just `--export` */
            if (value === 'true') {
                return `--${key}`;
            }
            /* Some options can have multiple values (eg. `ng g guard --implements CanActivate CanLoad`) */
            else if (Array.isArray(value)) {
                return value.map((valueItem) => `--${key} ${valueItem}`).join(' ');
            }
            /* Otherwise we print the full option (eg. `--changeDetection OnPush`) */
            else {
                return `--${key} ${value}`;
            }
        });

    }

    // TODO: will be removed once we move to Terminal API
    private async isCliLocal(): Promise<boolean> {

        if (this.cliLocal === null) {

            const cliLocalFsPath = path.join(this.workspace.uri.fsPath, '.bin', 'ng');

            this.cliLocal = await FileSystem.isReadable(cliLocalFsPath);

        }

        return this.cliLocal;

    }

    // TODO: will be removed once we move to Terminal API
    private async execAsync(command: string, workspaceUri?: vscode.Uri): Promise<string> {

        return new Promise((resolve, reject) => {
    
            childProcess.exec(command, { cwd: workspaceUri?.fsPath, shell: userShell }, (error, stdout, stderr) => {
    
                if (error) {
                    reject([stdout, stderr]);
                } else {
                    resolve(stdout);
                }
    
            });
    
        });
    
    }

    // TODO: will be refactored once we move to Terminal API
    private async jumpToFile(stdout: string): Promise<void> {

        const name = this.nameAsFirstArg.includes('/') ? this.nameAsFirstArg.substr(this.nameAsFirstArg.lastIndexOf('/') + 1) : this.nameAsFirstArg;

        const suffix = (this.schemaName === 'component') ? this.options.get('type') : '';
        const suffixTest = suffix ? `|${suffix}` : '';

        const stdoutRegExp = new RegExp(`CREATE (.*${name}(?:\.(${this.schemaName}${suffixTest}))?\.ts)`);

        let stdoutMatches = stdout.match(stdoutRegExp);

        if (stdoutMatches) {

            const document = await vscode.workspace.openTextDocument(path.join(this.workspace.uri.fsPath, stdoutMatches[1]));

            await vscode.window.showTextDocument(document);

        }

    }

}