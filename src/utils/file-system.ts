import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

import { Output } from './output';

interface PackageJsonSchema {
    workspaces?: string[] | {
        [key: string]: string[];
    };
}

interface NodeModuleConfig {
    fsPath: string;
    /** Tells if there is package.json workspaces */
    packageJsonWorkspaces?: string[];
}

export class FileSystem {

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
            /* If there is package.json workspaces */
            else if (nodeModulesConfig.packageJsonWorkspaces) {

                /* In package.json workspaces, dependencies can be in a subdirecty whose name is the same as the workspace folder's name */
                const packageWorkspaceFolder = nodeModulesConfig.packageJsonWorkspaces.filter((packageJsonWorkspace) => {

                    /* Try to reconstruct the workspace folder and see if it matches */
                    const testFsPath = path.join(nodeModulesConfig.fsPath, '..', packageJsonWorkspace);

                    /* Manage glob patterns */
                    if (packageJsonWorkspace.endsWith('/*')) {
                        return workspaceFolder.uri.fsPath.startsWith(testFsPath);
                    }
                    else {
                        return (workspaceFolder.uri.fsPath === testFsPath);
                    }

                });

                if (packageWorkspaceFolder.length === 1) {

                    fsPath = path.join(nodeModulesConfig.fsPath, packageWorkspaceFolder[0], name, 'package.json');

                    if (await this.isReadable(fsPath, { silent })) {
                        return fsPath;
                    }

                } else if (packageWorkspaceFolder.length > 1) {

                    Output.logError(`There is a configuration issue in your "package.json" workspaces`);

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
    private static async getNodeModulesFsPath(workspaceFolder: vscode.WorkspaceFolder, contextFsPath?: string): Promise<NodeModuleConfig | undefined | null> {

        /* If path does not exist yet */
        if (!this.userNodeModulesFsPaths.has(workspaceFolder.name)) {

            /* In a classic scenario, `node_modules` is directly in the workspace folder */
            const fsPath = path.join(contextFsPath ?? workspaceFolder.uri.fsPath, this.defaultNodeModulesPath);

            if (await this.isReadable(fsPath, { silent: true })) {

                /* If we are in a parent folder, we may be in "package.json" workspaces */
                const packageJsonWorkspaces = contextFsPath ? await this.getPackageJsonWorkspaces(fsPath) : undefined;

                this.userNodeModulesFsPaths.set(workspaceFolder.name, {
                    fsPath,
                    packageJsonWorkspaces,
                });

                Output.logInfo(`"node_modules" path detected: ${fsPath}`);

                if (packageJsonWorkspaces && (packageJsonWorkspaces.length > 0)) {
                    Output.logInfo(`"package.json" workspaces detected: ${packageJsonWorkspaces.join(', ')}`);
                }

            }
            /* Try again on parent directory */
            else if (contextFsPath !== path.sep) {

                const parentFsPath = path.join(contextFsPath ?? workspaceFolder.uri.fsPath, '..');

                return await this.getNodeModulesFsPath(workspaceFolder, parentFsPath);

            }
            /* We arrived at root, so stop */
            else {

                this.userNodeModulesFsPaths.set(workspaceFolder.name, null);
        
                Output.logError(`No "node_modules" folder found.`);

            }

        }

        return this.userNodeModulesFsPaths.get(workspaceFolder.name);

    }

    /**
     * Try to get package.json workspaces
     */
    private static async getPackageJsonWorkspaces(nodeModulesFsPath: string): Promise<string[]> {

        const packageJsonFsPath = path.join(nodeModulesFsPath, '..', 'package.json');

        const packageJson = await this.parseJsonFile<PackageJsonSchema>(packageJsonFsPath, { silent: true });

        const packageJsonWorkspaces = packageJson?.workspaces ?? [];

        const workspaces: string[] = [];

        /* `workspaces` property of `package.json` can be an array or an object */
        if (Array.isArray(packageJsonWorkspaces)) {
            workspaces.push(...packageJsonWorkspaces);
        }
        else if ((typeof packageJsonWorkspaces === 'object') && (packageJsonWorkspaces !== null)) {

            Object.values(packageJsonWorkspaces)
                .filter((list) => Array.isArray(list))
                .forEach((list) => {
                    workspaces.push(...list);
                });

        }

        return workspaces;

    }

}
