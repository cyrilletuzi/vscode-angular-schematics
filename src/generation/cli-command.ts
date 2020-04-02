import * as vscode from 'vscode';
import * as path from 'path';
import * as os from 'os';
import * as childProcess from 'child_process';

import { FileSystem, Output } from '../utils';
import { WorkspaceConfig, AngularConfig } from '../config';
import { Schematic } from '../schematics';

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

/** List of options */
export type CliCommandOptions = Map<string, string | string[]>;

export class CliCommand {

    /* Path details of the right-clicked file or directory */
    private contextPath: ContextPath = {
        full: '',
        relativeToWorkspace: '',
        relativeToSource: '',
    };
    private baseCommand = 'ng g';
    private project = '';
    private collectionName = AngularConfig.defaultAngularCollection;
    private schematicName = '';
    private schematic!: Schematic;
    private nameAsFirstArg = '';
    private options: CliCommandOptions = new Map();
    private cliLocal: boolean | null = null;

    constructor(
        private workspace: WorkspaceConfig,
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
            this.formatSchematicNameForCommand(),
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
     * Set schematic's name
     */
    setSchematicName(name: string): void {

        this.schematicName = name;

    }

    /**
     * Set schematic, and project if relevant.
     */
    setSchematic(schematic: Schematic): void {

        this.schematic = schematic;

        /* If a project was detected, the schematic supports it and it's not the root project, add the project */
        if (this.project && schematic.hasOption('project') && !this.workspace.angularConfig.isRootProject(this.project)) {
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
    addOptions(options: CliCommandOptions): void {

        for (const [name, option] of options) {

            /* Check they exist in schematic */
            if (this.schematic.hasOption(name)) {
                this.options.set(name, option);
            } else {
                Output.logError(`"--${name}" option has been chosen but does not exist in this schematic, so it won't be used.`);
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

            vscode.window.setStatusBarMessage(`Schematic worked!`, 5000);

            try {
                await this.jumpToFile(stdout);
            } catch (error) {}

        } catch (error) {

            Output.channel.append(error[0]);
            Output.channel.appendLine(error[1]);

            vscode.window.showErrorMessage(`Schematic failed, see Output.`);

        }
    
    }

    /**
     * Set context path and prject.
     */
    private setContextPathAndProject(context?: vscode.Uri): void {

        if (!context?.path) {
            Output.logInfo(`No context path detected.`);
            return;
        }

        this.contextPath.full = context.path;

        Output.logInfo(`Full context path detected: ${this.contextPath.full}`);

        /* Remove workspace path from full path,
         * eg. `/Users/Elmo/angular-project/src/app/some-module` => `src/app/some-module` */
        this.contextPath.relativeToWorkspace = this.contextPath.full.substr(this.workspace.uri.path.length + 1);

        Output.logInfo(`Workspace-relative context path detected: ${this.contextPath.relativeToWorkspace}`);

        for (const [projectName, projectConfig] of this.workspace.angularConfig.getProjects()) {

            /* If the relative path starts with the project path */
            if (this.contextPath.relativeToWorkspace.startsWith(projectConfig.sourcePath)) {

                this.project = projectName;

                Output.logInfo(`Angular project detected from context path: "${this.project}"`);

                /* Remove source path from workspace relative path,
                 * eg. `src/app/some-module` => `some-module` */
                this.contextPath.relativeToSource = this.contextPath.relativeToWorkspace.substr(projectConfig.sourcePath.length + 1);

                Output.logInfo(`Source-relative context path detected: ${this.contextPath.relativeToSource}`);

                return;

            }

        }

        /* Default values */
        this.contextPath.relativeToSource = '';
        this.project = '';

        Output.logInfo(`No Angular project detected from context path.`);

    }

    /**
     * Format collection and schematic name for the generation command:
     * - just the schematic name if the collection is already the user default's one (eg. `component`)
     * - otherwise the full scheme (eg. `@schematics/angular:component`)
     */
    private formatSchematicNameForCommand(): string {

        return (this.collectionName !== this.workspace.angularConfig.getDefaultUserCollection()) ?
            `${this.collectionName}:${this.schematicName}` :
            this.schematicName;

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

        const suffix = (this.schematicName === 'component') ? this.options.get('type') : '';
        const suffixTest = suffix ? `|${suffix}` : '';

        const stdoutRegExp = new RegExp(`CREATE (.*${name}(?:\.(${this.schematicName}${suffixTest}))?\.ts)`);

        let stdoutMatches = stdout.match(stdoutRegExp);

        if (stdoutMatches) {

            const document = await vscode.workspace.openTextDocument(path.join(this.workspace.uri.fsPath, stdoutMatches[1]));

            await vscode.window.showTextDocument(document);

        }

    }

}