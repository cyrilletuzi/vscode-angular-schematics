import * as vscode from 'vscode';
import * as path from 'path';

import { defaultAngularCollection } from '../defaults';
import { FileSystem, Output, Terminal } from '../utils';
import { WorkspaceConfig } from '../config';
import { Schematic } from '../schematics';

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
    private collectionName = defaultAngularCollection;
    private schematicName = '';
    private schematic!: Schematic;
    private nameAsFirstArg = '';
    private options: CliCommandOptions = new Map();

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
            ...this.formatOptionsForCommand(this.options),
        ].join(' ');

    }

    /**
     * Format options for the generation command.
     */
    formatOptionsForCommand(options: CliCommandOptions): string[] {

        /* Format the values. The goal is to be shortest as possible,
         * so the user can see the full command, as VS Code input box has a fixed size */
        return Array.from(options.entries()).map(([key, value]) => {

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
     * Set the project
     */
    setProject(name: string): void {
        this.project = name;
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

        /* Add  trailing slash so the user can just write the name directly */
        const contextWithTrailingSlash = !(['', '.'].includes(context)) ? `${context}/` : '';

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
                Output.logWarning(`"--${name}" option has been chosen but does not exist in this schematic, so it won't be used.`);
            }

        }

    }

    /**
     * Launch command in a terminal
     * @returns A `Promise` with the possible fsPaths of the generated file
     */
    launchCommand(): string[] {

        Output.logInfo(`Launching this command: ${this.getCommand()}`);

        Terminal.send(this.getCommand());

        /* Try to resolve the path of the generated file */
        const possibleFsPaths: string[] = [];

        /* Without a default argument, we cannot know the possible path */
        if (this.nameAsFirstArg) {

            /* Get the project path, or defaut to `src/app` */
            const projectSourcePath = this.project ?
                path.join(this.workspace.uri.fsPath, this.workspace.angularConfig.projects.get(this.project)!.getSourcePath()) :
                path.join(this.workspace.uri.fsPath, 'src/app');

            /* Default file's suffix is the schematic name (eg. `service`),
            * except for Angular component schematic which can have a specific suffix with the `--type` option */
            const suffix = ((this.collectionName === defaultAngularCollection) && (this.schematicName === 'component') && this.options.has('type')) ?
                this.options.get('type')! : this.schematicName;

            const fileName = `${this.nameAsFirstArg}.${suffix}.ts`;
            
            // TODO: do that based on user preferences
            /* Schematics are created with or without an intermediate folder, depending on CLI or user defaults */
            const fsPathFlat = path.join(projectSourcePath, fileName);
            const fsPathNotFlat = path.join(projectSourcePath, this.nameAsFirstArg, fileName);

            possibleFsPaths.push(fsPathFlat, fsPathNotFlat);

        }

        return possibleFsPaths;
    
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

        for (const [projectName, projectConfig] of this.workspace.angularConfig.projects) {

            /* If the relative path starts with the project path */
            if (this.contextPath.relativeToWorkspace.startsWith(projectConfig.getSourcePath())) {

                this.project = projectName;

                /* Remove source path from workspace relative path,
                 * eg. `src/app/some-module` => `some-module` */
                this.contextPath.relativeToSource = this.contextPath.relativeToWorkspace.substr(projectConfig.getSourcePath().length + 1);

                Output.logInfo(`Source-relative context path detected: ${this.contextPath.relativeToSource}`);
                Output.logInfo(`Angular project detected from context path: "${this.project}"`);

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

}