import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { Output } from './output';
import { Workspaces } from '../config';

export class FileSystem {

    /**
     * Check if a JSON file exists and is readable, and if so, parse it.
     * Otherwise, log an error message in output channel.
     */
    static async parseJsonFile<T>(fsPath: string): Promise<T | undefined> {

        if (await this.isReadable(fsPath)) {

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
        
            } catch (error) {

                this.showError(fsPath, `parsed`);

                return undefined;

            }
        
            return json;

        }

        return undefined;
    
    }

    /**
     * Check if a file exists and is readable.
     * Otherwise, log an error message in output channel if `silent` is not set to `true`.
     */
    static async isReadable(fsPath: string, { silent = false } = {}): Promise<boolean> {

        try {

            /* Check if the file exists (`F_OK`) and is readable (`R_OK`) */
            await fs.promises.access(fsPath, fs.constants.F_OK | fs.constants.R_OK);

        } catch (error) {

            if (!silent) {
                // TODO: check the constant works
                this.showError(fsPath, (error.errno === os.constants.errno.ENOENT) ? `found` : `read`);
            }
            
            return false;

        }

        return true;

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
    private static showError(fsPath: string, failedAction: string): void {

        const workspace = Workspaces.getFromPath(fsPath);

        const message = `"${fsPath}" can not be ${failedAction}${workspace ? ` in "${workspace.name}" workspace` : ''}.`;

        Output.logError(message);

    }

}
