import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

import { Output } from './output';

export class FileSystem {

    // TODO: [feature] handle custom node_modules folder
    private static readonly defaultNodeModulesPath = 'node_modules';
    private static userNodeModulesFsPaths = new Map<string, string | null>();
    /** Cache for already checked files */
    private static readableFiles = new Set<string>();

    /**
     * Try to find a package's fs path, or `undefined`
     */
    static async findPackageFsPath(workspaceFolder: vscode.WorkspaceFolder, name: string, { silent = false } = {}): Promise<string | undefined> {

        const nodeModulesfsPath = await this.getNodeModulesFsPath(workspaceFolder);

        if (nodeModulesfsPath) {

            let fsPath = path.join(nodeModulesfsPath, name, 'package.json');

            if (await this.isReadable(fsPath, { silent })) {
                return fsPath;
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
    private static async getNodeModulesFsPath(workspaceFolder: vscode.WorkspaceFolder, contextFsPath?: string): Promise<string | undefined | null> {

        /* If path does not exist yet */
        if (!this.userNodeModulesFsPaths.has(workspaceFolder.name)) {

            /* In a classic scenario, `node_modules` is directly in the workspace folder */
            const fsPath = path.join(contextFsPath ?? workspaceFolder.uri.fsPath, this.defaultNodeModulesPath);

            if (await this.isReadable(fsPath, { silent: true })) {

                this.userNodeModulesFsPaths.set(workspaceFolder.name, fsPath);

                Output.logInfo(`"node_modules" path detected: ${fsPath}`);

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

}
