import * as vscode from 'vscode';
import { Utils } from './utils';
import { AngularConfig } from './angular-config';


export class Generate {

    path = '';
    project = '';
    schema = '';
    defaultOption = '';
    get command(): string {

        return [
            this.base,
            this.formatCollectionAndSchema(),
            this.defaultOption,
            ...this.formatOptionsForCommand()
        ].join(' ');

    }
    protected base = 'ng g';
    protected collection = AngularConfig.cliCollection;
    protected options = new Map<string, string | string[]>();
    protected cliLocal: boolean | null = null;

    constructor(contextPath: string, workspacePath: string) {

        this.path = this.getCommandPath(contextPath);
        this.project = this.getProject(contextPath, workspacePath);

    }

    addCollection(name: string): void {

        this.collection = name;

    }

    addSchema(name: string): void {

        this.schema = name;

    }

    addDefaultOption(value: string, withPath = true): void {

        this.defaultOption = value;

        if (withPath && this.project && this.project !== AngularConfig.defaultProject) {

            this.addOption('project', this.project);

        }

    }

    addOption(optionName: string, optionValue: string | string[]): void {

        this.options.set(optionName, optionValue);

    }

    async askConfirmation(): Promise<boolean> {

        const confirmationText = `Confirm`;
        const cancellationText = `Cancel`;

        const choice = await vscode.window.showQuickPick([confirmationText, cancellationText], { placeHolder: this.command });

        return (choice === confirmationText) ? true : false;

    }

    async isCliLocal(cwd: string) {

        if (this.cliLocal === null) {

            this.cliLocal = await Utils.existsAsync(Utils.getNodeModulesPath(cwd, '.bin', 'ng'));

        }

        return this.cliLocal;

    }

    async getExecCommand(cwd: string): Promise<string> {

        return (await this.isCliLocal(cwd)) ? `"./node_modules/.bin/ng"${this.command.substr(2)}` : this.command;

    }

    resetCommandPath(contextPath = ''): void {

        this.path = this.getCommandPath(contextPath);

    }

    protected getProject(contextPath: string, workspacePath: string): string {

        const projectPath = contextPath.substr(contextPath.indexOf(workspacePath) + workspacePath.length);

        const pathNormalized = Utils.normalizePath(projectPath);

        for (const [projectName, projectPath] of AngularConfig.projects) {

            /* Remove leading "/" to match */
            const pathWithoutLeadingSlash = pathNormalized.substr(1);

            /* Test strict equality or starting with a trailing "/", to avoid collision when projects start with a common path */
            if (pathWithoutLeadingSlash === projectPath || pathWithoutLeadingSlash.startsWith(`${projectPath}/`)) {
                return projectName;
            }

        }

        const projectMatches = pathNormalized.match(/projects\/([^\/]+)\/[^\/]+\/(?:app|lib)/);

        if (projectMatches) {

            return projectMatches[1];

        } else {

            const scopedProjectMatches = pathNormalized.match(/projects\/([^\/]+\/[^\/]+)\/[^\/]+\/(?:app|lib)/);

            if (scopedProjectMatches) {

                return `@${scopedProjectMatches[1]}`;

            }

        }

        return '';

    }

    protected getCommandPath(contextPath = ''): string {

        const pathNormalized = Utils.normalizePath(contextPath);

        const contextPathMatches = pathNormalized.match(/[^\/]+\/((?:app|lib))\//);

        if (contextPathMatches) {

            const splittedPath = pathNormalized.split(`/${contextPathMatches[1]}/`)[1];
    
            if (splittedPath.includes('.')) {

                /* Special case: ngx-spec works on a existing file, so it needs the full path */
                if (this.collection === 'ngx-spec') {
                    return splittedPath;
                }
    
                /* If filename, delete filename by removing everything after the last "/" */
                return Utils.getDirectoryFromFilename(splittedPath);
    
            } else {
    
                /* If directory, add a trailing "/" */
                return `${splittedPath}/`;
    
            }
    
        }
    
        return '';
    
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

        return (this.collection !== AngularConfig.cliCollection) ?
            `${this.collection}:${this.schema}` :
            this.schema;

    }

}