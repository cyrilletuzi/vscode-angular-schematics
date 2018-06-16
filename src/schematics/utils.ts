import * as vscode from 'vscode';
import * as fs from 'fs';

export class Utils {

    /** @todo Replace with utils.promisify() when Electron / VS Code is updated to Node 8 */
    static readFileAsync(path: string): Promise<string> {

        return new Promise((resolve, reject) => {
    
            fs.readFile(path, 'utf8', (error, data) => {
    
                if (error) {
                    reject(error);
                } else {
                    resolve(data);
                }
    
            });
    
        });
    
    }

    static async parseJSONFile<T = any>(path: string): Promise<T | null> {

        let json: T | null = null;
    
        try {
            
            const data = await Utils.readFileAsync(path);
    
            json = JSON.parse(data) as T;
    
        } catch (error) {
    
            /** 
             * @todo Change message when other schematics will be supported 
             * @todo Localization
             */
            vscode.window.showErrorMessage(`Can't read Angular schematics. @schematics/angular must be installed.`);
    
        }
    
        return json;
    
    }

    static launchCommandInTerminal(command: string) {

        const terminal = vscode.window.createTerminal();
    
        /** @todo remove --skipImport */
        terminal.sendText(command);
    
        /** @todo Investigate (launching this now cancel the command as it takes time) */
        // terminal.dispose();
    
    }

}