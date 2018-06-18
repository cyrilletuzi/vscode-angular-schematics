import * as vscode from 'vscode';

import { Utils } from './utils';
import { Schematics } from './schematics';

export class Generate {

    get command(): string {

        return [
            this.base,
            this.formatCollectionAndSchema(),
            this.defaultOption,
            ...this.formatOptionsForCommand()
        ].join(' ');

    }
    protected base = 'ng g';
    protected collection = Schematics.defaultCollection;
    protected schema = '';
    protected path = '';
    protected project = '';
    protected defaultOption = '';
    protected options = new Map<string, string>();

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

        this.defaultOption = withPath ? `${this.path}${value}` : value;

        if (withPath && this.project) {

            this.add('project', this.project);

        }

    }

    add(optionName: string, optionValue: string): void {

        this.options.set(optionName, optionValue);

    }

    async askConfirmation(): Promise<boolean> {

        const confirmationText = `Confirm`;
        const cancellationText = `Cancel`;

        const choice = await vscode.window.showQuickPick([confirmationText, cancellationText], { placeHolder: this.command });

        return (choice === confirmationText) ? true : false;

    }

    protected getProject(contextPath = ''): string {

        const projectMatches = contextPath.match(/projects\/([^\/]+)\/[^\/]+\/app/);

        if (projectMatches) {

            return projectMatches[1];

        }

        return '';

    }

    protected getCommandPath(contextPath = ''): string {

        if (contextPath.match(/[^\/]+\/app\//)) {

            const normalizedPath = Utils.normalizePath(contextPath).split('/app/')[1];
    
            if (normalizedPath.includes('.')) {
    
                /* If filename, delete filename by removing everything after the last "/" */
                return Utils.getDirectoryFromFilename(normalizedPath);
    
            } else {
    
                /* If directory, add a trailing "/" */
                return `${normalizedPath}/`;
    
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

        return (this.collection !== Schematics.defaultCollection) ?
            `${this.collection}:${this.schema}` :
            this.schema;

    }

}