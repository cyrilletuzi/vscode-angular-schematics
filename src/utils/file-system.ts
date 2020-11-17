import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'jsonc-parser';

import { Output } from './output';

export class FileSystem {

    // TODO: [feature] handle custom node_modules folder
    private static readonly defaultNodeModulesPath = 'node_modules';
    /** 
     * Cache for already found packages.
     * Key: `workspace-name:package-name`.
     * Value: package's fs path.
     */
    private static packagesCache = new Map<string, string | null>();
    /** Cache for already checked files */
    private static readableFiles = new Set<string>();

    /**
     * Try to find a package's fs path, or `undefined`
     */
    static async findPackageFsPath(workspaceFolder: vscode.WorkspaceFolder, contextFsPath: string, name: string, { silent = false } = {}): Promise<string | undefined> {

        /* In a classic scenario, `node_modules` is directly in the workspace folder */
        const fsPath = path.join(contextFsPath, this.defaultNodeModulesPath, name, 'package.json');

        if (this.packagesCache.get(`${workspaceFolder.name}:${name}`) === undefined) {

            if (await this.isReadable(fsPath, { silent: true })) {
                this.packagesCache.set(`${workspaceFolder.name}:${name}`, fsPath);
            }
            /* Try on parent folder */
            else {

                const parentFsPath = path.join(contextFsPath, '..');

                if (contextFsPath !== parentFsPath) {

                    return await this.findPackageFsPath(workspaceFolder, parentFsPath, name, { silent });

                }
                /* We arrived at root, so stop */
                else {

                    this.packagesCache.set(`${workspaceFolder.name}:${name}`, null);

                    if (!silent) {
                        Output.logError(`"${name}" package not found in any "node_modules" folder.`);
                    }

                }

            }

        }

        return this.packagesCache.get(`${workspaceFolder.name}:${name}`) ?? undefined;

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
            await fs.promises.access(fsPath, fs.constants.F_OK | fs.constants.R_OK);

        } catch (error: unknown) {

            if (!silent) {
                this.logError(fsPath, ((typeof error === 'object') && ((error as { [key: string]: unknown })?.code === 'ENOENT')) ? `found` : `read`);
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
    static async parseJsonFile(fsPath: string, { silent = false } = {}): Promise<unknown> {

        if (await this.isReadable(fsPath, { silent })) {

            let json;
    
            try {
                
                const data: string = await fs.promises.readFile(fsPath, { encoding: 'utf8' });
        
                json = parse(data) as unknown;
        
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

}
