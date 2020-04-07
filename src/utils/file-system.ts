import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

import { Output } from './output';

interface PackageJsonSchema {
    /** The `package.json` of a Yarn workspace will have this property */
    workspaces?: string[];
}

interface NodeModuleConfig {
    fsPath: string;
    /** Tells if there are Yarn workspaces */
    workspaces?: string[];
}

export class FileSystem {

    // TODO: [feature] handle custom node_modules folder
    private static readonly defaultNodeModulesPath = 'node_modules';
    private static userNodeModulesFsPaths = new Map<string, NodeModuleConfig | null>();
    /** Cache for already checked files */
    private static readableFiles = new Set<string>();

    /**
     * Try to find a package's fs path, or `undefined`
     */
    static async findPackageFsPath(workspaceFolder: vscode.WorkspaceFolder, name: string, { silent = false } = {}): Promise<string | undefined> {

        const nodeModulesConfig = await this.getNodeModulesFsPath(workspaceFolder);

        if (nodeModulesConfig) {

            let fsPath = path.join(nodeModulesConfig.fsPath, name, 'package.json');

            if (await this.isReadable(fsPath, { silent })) {
                return fsPath;
            }
            /* Yarn workspaces */
            else if (nodeModulesConfig.workspaces) {

                /* In Yarn workspaces, dependencies can be in a subdirecty whose name is the same as the workspace folder's name */
                const yarnWorkspaceFolder = nodeModulesConfig.workspaces.filter((folder) => workspaceFolder.uri.fsPath.endsWith(folder));

                if (yarnWorkspaceFolder.length > 0) {

                    fsPath = path.join(nodeModulesConfig.fsPath, yarnWorkspaceFolder[0], name, 'package.json');

                    if (await this.isReadable(fsPath, { silent })) {
                        return fsPath;
                    }

                }

            }

        }

        return undefined;

    }

    /**
     * Check if a file exists and is readable.
     * Otherwise, log an error message in output channel if `silent` is not set to `true`.
     */
    static async isReadable(fsPath: string, { silent = false } = {}): Promise<boolean> {

        /* Check in cache */
        if (this.readableFiles.has(fsPath)) {
            return true;
        }

        try {

            /* Check if the file exists (`F_OK`) and is readable (`R_OK`) */
            await fs.promises.access(fsPath, fs.constants.F_OK | fs.constants.R_OK);

        } catch (error) {

            if (!silent) {
                this.logError(fsPath, (error?.code === 'ENOENT') ? `found` : `read`);
            }
            
            return false;

        }

        /* Save in cache */
        this.readableFiles.add(fsPath);

        return true;

    }

    /**
     * Check if a JSON file exists and is readable, and if so, parse it.
     * Otherwise, log an error message in output channel.
     */
    static async parseJsonFile<T>(fsPath: string, { silent = false } = {}): Promise<T | undefined> {

        if (await this.isReadable(fsPath, { silent })) {

            let json;
    
            try {
                
                let data: string = await fs.promises.readFile(fsPath, { encoding: 'utf8' });

                /* Angular Material schematics have comments, we remove them as it's not JSON compliant */
                if (fsPath.includes('@angular/material')) {

                    /* Split the file by line, and if a line is a comment, remove it.
                     * RegExp explanation:
                     * - `^`    starts with
                     * - ` *`   none or multiple spaces
                     * - `\/\/` start of a comment (//), backslashed as they are special RegExp characters
                     * - `.*`   any number of any character
                     */
                    data = data.split('\n').map((line) => line.replace(/^ *\/\/.*/, '')).join('\n');

                }
        
                json = JSON.parse(data) as T;
        
            } catch {

                if (!silent) {

                    this.logError(fsPath, `parsed`);

                }

                return undefined;

            }
        
            return json;

        }

        return undefined;
    
    }

    /**
     * Removes the file name inside a path.
     * Eg. `/path/to/file.ts` => `/path/to`
     */
    static removeFilename(partialPath: string): string {

        /* Usage of `posix` is important here as we are working with path with Linux separators `/` */

        /* Basename, ie. last directory if a directory, or `file.extension` if a file */
        const basename = path.posix.basename(partialPath);

        /* If a file: remove the file name, otherwise it is a directory so keep it */
        return basename.includes('.') ? path.posix.dirname(partialPath) : partialPath;

    }

    /**
     * Display an error message to the user.
     * @param actionFailed Past form of a verb about what fails (eg. `found`)
     */
    private static logError(fsPath: string, failedAction: string): void {

        const message = `"${fsPath}" can not be ${failedAction}.`;

        Output.logError(message);

    }

    /**
     * Try to get the `node_modules` fs path and cache it, or returns `undefined`
     */
    private static async getNodeModulesFsPath(workspaceFolder: vscode.WorkspaceFolder, nestingCounter = 0): Promise<NodeModuleConfig | undefined | null> {

        /* Maximum nesting to 3 */
        if (nestingCounter >= 3) {

            this.userNodeModulesFsPaths.set(workspaceFolder.name, null);

            Output.logError(`No "node_modules" folder found.`);

        }
        /* If path does not exist yet */
        else if (!this.userNodeModulesFsPaths.has(workspaceFolder.name)) {

            /* Get up in folders hierarchy based on counter */
            const nestingFsPath = Array.from(Array(nestingCounter)).map(() => '..');

            /* In a classic scenario, `node_modules` is directly in the workspace folder */
            const fsPath = path.join(workspaceFolder.uri.fsPath, ...nestingFsPath, this.defaultNodeModulesPath);

            if (await this.isReadable(fsPath, { silent: true })) {

                /* If we are in a parent folder, we may be in Yarn workspaces */
                const workspaces = (nestingCounter !== 0) ? await this.getPackageWorkspaces(fsPath) : undefined;

                this.userNodeModulesFsPaths.set(workspaceFolder.name, {
                    fsPath,
                    workspaces,
                });

                Output.logInfo(`"node_modules" path detected: ${fsPath}`);

                if (workspaces && (workspaces.length > 0)) {
                    Output.logInfo(`Yarn workspaces detected: ${workspaces.join(', ')}`);
                }

            }
            /* Try again on parent directory */
            else {

                nestingCounter += 1;

                return await this.getNodeModulesFsPath(workspaceFolder, nestingCounter);

            }

        }

        return this.userNodeModulesFsPaths.get(workspaceFolder.name);

    }

    /**
     * Try to get Yarn workspaces
     */
    private static async getPackageWorkspaces(nodeModulesFsPath: string): Promise<string[]> {

        const packageJsonFsPath = path.join(nodeModulesFsPath, '..', 'package.json');

        const packageJson = await this.parseJsonFile<PackageJsonSchema>(packageJsonFsPath, { silent: true });

        return packageJson?.workspaces ?? [];

    }

}
