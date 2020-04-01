import * as vscode from 'vscode';
import * as path from 'path';
import * as os from 'os';
import * as childProcess from 'child_process';

import { AngularConfig } from '../config/angular';
import { WorkspaceExtended } from '../config/workspaces';
import { Output } from '../utils/output';
import { FileSystem } from '../utils/file-system';

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

export type GenerationOptions = Map<string, string | string[]>;

export class CurrentGeneration {

    static readonly sourceFolders: string[] = ['app', 'lib'];
    /* Path details of the right-clicked file or directory */
    private contextPath: ContextPath = {
        full: '',
        relativeToWorkspace: '',
        relativeToSource: '',
    };
    private collectionName = AngularConfig.defaultAngularCollection;
    private schemaName = '';
    private project = '';
    private nameAsFirstArg = '';
    private options: GenerationOptions = new Map();

    get command(): string {

        return [
            this.base,
            this.formatCollectionAndSchema(),
            this.nameAsFirstArg,
            ...this.formatOptionsForCommand()
        ].join(' ');

    }
    protected base = 'ng g';
    protected cliLocal: boolean | null = null;

    constructor(
        private workspaceExtended: WorkspaceExtended,
        context?: vscode.Uri,
    ) {

        this.setContextPath(context);

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
     * Was the command launched with a context, ie. from a right-click in Explorer
     */
    hasContextPath(): boolean {
        return (this.contextPath.full !== '');
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
    setSchema(name: string): void {

        this.schemaName = name;

    }

    /**
     * Set name as first argument of the command line, eg. `path/to/some-component`
     */
    setNameAsFirstArg(pathToName: string): void {

        this.nameAsFirstArg = pathToName;

        // TODO: check
        // if (withPath && this.project && this.workspaceExtended.angularConfig.isRootProject(this.project)) {

        //     this.addOption('project', this.project);

        // }

    }

    /**
     * Add options
     */
    addOptions(options: GenerationOptions): void {

        for (const [name, option] of options) {
            // TODO: check if option exists in schema
            this.options.set(name, option);
        }

    }

    getOption(optionName: string): undefined | string | string[] {

        return this.options.get(optionName);

    }

    async isCliLocal(): Promise<boolean> {

        if (this.cliLocal === null) {

            const cliLocalFsPath = path.join(this.workspaceExtended.uri.fsPath, '.bin', 'ng');

            this.cliLocal = await FileSystem.isReadable(cliLocalFsPath);

        }

        return this.cliLocal;

    }

    private async getExecCommand(): Promise<string> {

        return (await this.isCliLocal()) ? `"./node_modules/.bin/ng"${this.command.substr(2)}` : this.command;

    }

    /**
     * Set context path, full and relative to workspace.
     * Then launch `.setProject()`.
     */
    private setContextPath(context?: vscode.Uri): void {

        if (!context?.path) {
            return;
        }

        this.contextPath.full = context.path;

        /* Remove workspace path from full path,
         * eg. `/Users/Elmo/angular-project/src/app/some-module` => `src/app/some-module` */
        this.contextPath.relativeToWorkspace = this.contextPath.full.substr(this.workspaceExtended.uri.path.length + 1);

        this.setProject();

    }

    /**
     * Set project and context path relative to source.
     * Requires `relativeToWorkspace` to be set via `.setContextPath()` first.
     */
    private setProject(): void {

        for (const [projectName, projectConfig] of this.workspaceExtended.angularConfig.getProjects()) {

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

    protected formatOptionsForCommand(): string[] {

        return Array.from(this.options.entries())
            .map((option) => {
                if (option[1] === 'true') {
                    return `--${option[0]}`;
                } else if (Array.isArray(option[1])) {
                    return (option[1] as string[]).map((optionItem) => `--${option[0]} ${optionItem}`).join(' ');
                } else {
                    return `--${option[0]} ${option[1]}`;
                }
            });

    }

    protected formatCollectionAndSchema(): string {

        return (this.collectionName !== this.workspaceExtended.angularConfig.getDefaultUserCollection()) ?
            `${this.collectionName}:${this.schemaName}` :
            this.schemaName;

    }

    async launchCommand(): Promise<void> {

        Output.channel.show();

        Output.channel.appendLine(this.command);

        try {

            const stdout = await this.execAsync(await this.getExecCommand(), this.workspaceExtended.uri);

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

    async jumpToFile(stdout: string): Promise<void> {

        const name = this.nameAsFirstArg.includes('/') ? this.nameAsFirstArg.substr(this.nameAsFirstArg.lastIndexOf('/') + 1) : this.nameAsFirstArg;

        const suffix = (this.schemaName === 'component') ? this.getOption('type') : '';
        const suffixTest = suffix ? `|${suffix}` : '';

        const stdoutRegExp = new RegExp(`CREATE (.*${name}(?:\.(${this.schemaName}${suffixTest}))?\.ts)`);

        let stdoutMatches = stdout.match(stdoutRegExp);

        if (stdoutMatches) {

            const document = await vscode.workspace.openTextDocument(path.join(this.workspaceExtended.uri.fsPath, stdoutMatches[1]));

            await vscode.window.showTextDocument(document);

        }

    }

}