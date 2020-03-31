import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

import { Output } from './output';

export class FileSystem {

    /**
     * Check if a JSON file exists and is readable, and if so, parse it.
     * Otherwise, display an error message to the user.
     */
    static async parseJsonFile<T>(fsPath: string, workspace?: vscode.WorkspaceFolder): Promise<T | undefined> {

        if (await this.isReadable(fsPath)) {

            let json;
    
            try {
                
                let data: string = await fs.promises.readFile(fsPath, { encoding: 'utf8' });

                // TODO: check if it's still required, and if it's done the best bay
                /* Angular Material schematics have comments, we remove them as it's not JSON compliant */
                if (fsPath.includes('@angular/material')) {
                    data = data.split('\n').map((line) => line.replace(/^ *\/\/.*/, '')).join('\n');
                }
        
                json = JSON.parse(data) as T;
        
            } catch (error) {

                this.showError(fsPath, `parsed`, workspace);

                return undefined;

            }
        
            return json;

        }

        return undefined;
    
    }

    /**
     * Check if a file exists and is readable.
     */
    static async isReadable(fsPath: string, workspace?: vscode.WorkspaceFolder, silent = false): Promise<boolean> {

        try {

            /* Check if the file exists (`F_OK`) and is readable (`R_OK`) */
            await fs.promises.access(fsPath, fs.constants.F_OK | fs.constants.R_OK);

        } catch (error) {

            // TODO: type of error and check against a constant
            if (!silent) {
                this.showError(fsPath, (error.code === 'ENOENT') ? `found` : `read`, workspace);
            }
            
            return false;

        }

        return true;

    }

    static removeFilename(partialPath: string): string {

        /* Basename, ie. last directory if a directory, or `file.extension` if a file */
        const basename = path.basename(partialPath);

        /* If a file: remove the file name, otherwise it is a directory so keep it */
        return basename.includes('.') ? path.dirname(partialPath) : partialPath;

    }

    /**
     * Display an error message to the user.
     * @param actionFailed Past form of a verb about what fails (eg. `found`)
     */
    private static showError(fsPath: string, failedAction: string, workspace?: vscode.WorkspaceFolder): void {

        const message = `${path.basename(fsPath)} can not be ${failedAction} in${workspace ? ` in "${workspace.name}" workspace` : ''}.`;

        Output.logError(message);

    }

}
