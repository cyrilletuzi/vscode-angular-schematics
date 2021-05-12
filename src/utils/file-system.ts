import * as vscode from 'vscode';
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
    private static packagesCache = new Map<string, vscode.Uri | null>();
    /** Cache for already checked files */
    private static readableFiles = new Set<string>();

    /**
     * Try to find a package's fs path, or `undefined`
     */
    static async findPackageUri(workspaceFolder: vscode.WorkspaceFolder, contextUri: vscode.Uri, name: string, { silent = false } = {}): Promise<vscode.Uri | undefined> {

        /* In a classic scenario, `node_modules` is directly in the workspace folder */
        const uri = vscode.Uri.joinPath(contextUri, this.defaultNodeModulesPath, name, 'package.json');

        if (this.packagesCache.get(`${workspaceFolder.name}:${name}`) === undefined) {

            if (await this.isReadable(uri, { silent: true })) {
                this.packagesCache.set(`${workspaceFolder.name}:${name}`, uri);
            }
            /* Try on parent folder */
            else {

                const parentUri = vscode.Uri.joinPath(contextUri, '..');

                if (contextUri.path !== parentUri.path) {

                    return await this.findPackageUri(workspaceFolder, parentUri, name, { silent });

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
    static async isReadable(uri: vscode.Uri, { silent = false } = {}): Promise<boolean> {

        /* Check in cache */
        if (this.readableFiles.has(uri.path)) {
            return true;
        }

        try {

            /* Check if the file exists */
            await vscode.workspace.fs.stat(uri);

        } catch (error: unknown) {

            if (!silent) {
                this.logError(uri.path, 'found');
            }

            return false;

        }

        /* Save in cache */
        this.readableFiles.add(uri.path);

        return true;

    }

    /**
     * Check if a JSON file exists and is readable, and if so, parse it.
     * Otherwise, log an error message in output channel.
     */
    static async parseJsonFile(uri: vscode.Uri, { silent = false } = {}): Promise<unknown> {

        if (await this.isReadable(uri, { silent })) {

            let json;

            try {

                const data: string =  (await vscode.workspace.fs.readFile(uri)).toString();

                json = parse(data) as unknown;

            } catch {

                if (!silent) {

                    this.logError(uri.path, 'parsed');

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
     * Equivalent to Node `path.dirname()` but with a VS Code `Uri`
     */
    static uriDirname(uri: vscode.Uri): vscode.Uri {

        // `true` is for strict, which requires a scheme and is recommended
        return vscode.Uri.parse(path.posix.dirname(uri.toString()), true);

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
