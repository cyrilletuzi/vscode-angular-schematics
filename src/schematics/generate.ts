import * as vscode from 'vscode';
import { Schematics } from './schematics';
import { Utils } from './utils';


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
    protected collection = Schematics.angularCollection;
    protected options = new Map<string, string>();
    protected cliLocal: boolean | null = null;

    constructor(contextPath = '') {

        this.path = this.getCommandPath(contextPath);
        this.project = this.getProject(contextPath);

    }

    addCollection(name: string): void {

        this.collection = name;

    }

    addSchema(name: string): void {

        this.schema = name;

    }

    addDefaultOption(value: string, withPath = true): void {

        this.defaultOption = value;

        if (withPath && this.project) {

            this.addOption('project', this.project);

        }

    }

    addOption(optionName: string, optionValue: string): void {

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

    protected getProject(contextPath = ''): string {

        const pathNormalized = Utils.normalizePath(contextPath);

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
            .map((option) => (option[1] === 'true') ?
                `--${option[0]}` :
                `--${option[0]} ${option[1]}`
            );

    }

    protected formatCollectionAndSchema(): string {

        return (this.collection !== Schematics.angularCollection) ?
            `${this.collection}:${this.schema}` :
            this.schema;

    }

}