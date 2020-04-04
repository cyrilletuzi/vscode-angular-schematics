import * as vscode from 'vscode';
import * as path from 'path';

import { defaultAngularCollection } from '../defaults';
import { FileSystem, Output, Terminal } from '../utils';
import { WorkspaceFolderConfig } from '../config';
import { Schematic } from '../config/schematics';

interface ContextPath {
    /** Eg. `/Users/Elmo/angular-project/src/app/some-module` */
    full: string;
    /** Eg. `src/app/some-module` */
    relativeToWorkspaceFolder: string;
    /** Eg. `some-module` */
    relativeToSourceFolder: string;
}

/** List of options */
export type CliCommandOptions = Map<string, string | string[]>;

export class CliCommand {

    /* Path details of the right-clicked file or directory */
    private contextPath: ContextPath = {
        full: '',
        relativeToWorkspaceFolder: '',
        relativeToSourceFolder: '',
    };
    private baseCommand = 'ng g';
    private projectName = '';
    private collectionName = defaultAngularCollection;
    private schematicName = '';
    private schematic!: Schematic;
    private nameAsFirstArg = '';
    private options: CliCommandOptions = new Map();

    constructor(
        private workspaceFolder: WorkspaceFolderConfig,
        contextUri?: vscode.Uri,
    ) {

        this.setContextPathAndProject(contextUri);

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
     * Set schematic, and project if relevant.
     */
    setSchematic(schematic: Schematic): void {

        this.schematicName = schematic.getName();

        this.schematic = schematic;

        /* If a project was detected, the schematic supports it and it's not the root project, add the project */
        if (this.projectName && schematic.hasOption('project') && !this.workspaceFolder.isRootAngularProject(this.projectName)) {
            this.options.set('project', this.projectName);
        }

    }

    /**
     * Get project (can be an empty string, in which case the command will be for the root project)
     */
    getProjectName(): string {
        return this.projectName;
    }

    /**
     * Set the project
     */
    setProjectName(name: string): void {
        this.projectName = name;
    }

    /**
     * Get context path with a trailing slash to prefill first argument option.
     * With a trailing slash so the user can just write the name directly.
     */
    getContextForNameAsFirstArg(): string {

        /* `ngx-spec` schematics works on a file, and thus need the file part */
        if (this.collectionName === 'ngx-spec') {
            return this.contextPath.relativeToSourceFolder;
        }

        /* Otherwise we remove the file part */
        const context = FileSystem.removeFilename(this.contextPath.relativeToSourceFolder);

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
     */
    launchCommand(): void {

        Output.logInfo(`Launching this command: ${this.getCommand()}`);

        Terminal.send(this.getCommand());
    
    }

    /** 
     * Try to resolve the generated file fs path
     */
    guessGereratedFileFsPath(): string {

        /* Try to resolve the path of the generated file */
        let possibleFsPath = '';

        /* Without a default argument, we cannot know the possible path */
        if (this.nameAsFirstArg) {

            /* Get the project path, or defaut to `src/app` */
            const projectSourcePath = this.projectName ?
                path.join(this.workspaceFolder.uri.fsPath, this.workspaceFolder.getAngularProject(this.projectName)!.getSourcePath()) :
                path.join(this.workspaceFolder.uri.fsPath, 'src/app');

            /* Default file's suffix is the schematic name (eg. `service`),
            * except for Angular component schematic which can have a specific suffix with the `--type` option */
            const suffix = ((this.collectionName === defaultAngularCollection) && (this.schematicName === 'component') && this.options.has('type')) ?
                this.options.get('type')! : this.schematicName;

            const fileName = `${this.nameAsFirstArg}.${suffix}.ts`;

            /* Schematics are created with or without an intermediate folder */
            let isFlat = true;

            /* Priority 1: user has explicitly set it during the generation journey */
            if (this.options.has('flat')) {

                /* User values are registered as strings */
                isFlat = (this.options.get('flat') === 'false') ? false : true;

            } else {

                /* Priority 2: user has set a default in angular.json */
                const isUserDefaultFlat = this.workspaceFolder.getSchematicsOptionDefaultValue(this.projectName, this.getFullSchematicName(), 'flat');

                if (isUserDefaultFlat !== undefined) {
                    isFlat = isUserDefaultFlat;
                } else {

                    /* Priority 3: the schematic schema has a default */
                    const isSchematicDefaultFlat = this.schematic.getOptionDefaultValue('flat') as boolean | undefined;

                    if (isSchematicDefaultFlat !== undefined) {
                        isFlat = isSchematicDefaultFlat;
                    }
                    /* Priority 4: use hard defaults known for Angular official schematics */
                    else if ((this.collectionName === defaultAngularCollection) && ['component', 'module'].includes(this.schematicName)) {

                        isFlat = false;

                    }

                }

            }

            /* If not flat, add a intermediate folder, which name is the same as the generated file */
            const generatedFolderFsPath = isFlat ? projectSourcePath : path.join(projectSourcePath, this.nameAsFirstArg);
            
            possibleFsPath = path.join(generatedFolderFsPath, fileName);

        }

        return possibleFsPath;

    }

    /**
     * Get full schematic name (eg. `@schematics/angular:component`)
     */
    private getFullSchematicName(): string {
        return `${this.collectionName}:${this.schematicName}`;
    }

    /**
     * Format collection and schematic name for the generation command:
     * - just the schematic name if the collection is already the user default's one (eg. `component`)
     * - otherwise the full scheme (eg. `@schematics/angular:component`)
     */
    private formatSchematicNameForCommand(): string {

        return (this.collectionName !== this.workspaceFolder.getDefaultUserCollection()) ?
            this.getFullSchematicName() : this.schematicName;

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

        /* Remove workspace folder path from full path,
         * eg. `/Users/Elmo/angular-project/src/app/some-module` => `src/app/some-module` */
        this.contextPath.relativeToWorkspaceFolder = this.contextPath.full.substr(this.workspaceFolder.uri.path.length + 1);

        Output.logInfo(`Workspace folder-relative context path detected: ${this.contextPath.relativeToWorkspaceFolder}`);

        for (const [projectName, projectConfig] of this.workspaceFolder.getAngularProjects()) {

            /* If the relative path starts with the project path */
            if (this.contextPath.relativeToWorkspaceFolder.startsWith(projectConfig.getSourcePath())) {

                this.projectName = projectName;

                /* Remove source path from workspace folder relative path,
                 * eg. `src/app/some-module` => `some-module` */
                this.contextPath.relativeToSourceFolder = this.contextPath.relativeToWorkspaceFolder.substr(projectConfig.getSourcePath().length + 1);

                Output.logInfo(`Source-relative context path detected: ${this.contextPath.relativeToSourceFolder}`);
                Output.logInfo(`Angular project detected from context path: "${this.projectName}"`);

                return;

            }

        }

        /* Default values */
        this.contextPath.relativeToSourceFolder = '';
        this.projectName = '';

        Output.logInfo(`No Angular project detected from context path.`);

    }

}