import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as JSON5 from 'json5';

export class Utils {

    static normalizePath(path: string): string {

        /* Normalize Windows path into Linux format */
        return path.replace(/\\\\/, '/');

    }

    static pathTrimRelative(path: string): string {

        return path.replace('./', '');

    }

    static getDirectoryFromFilename(filename: string): string {

        return filename.replace(/[^\/]*$/, '');

    }

    static getSchemaFromNodeModules<T = any>(packageName: string, filePath: string): Promise<T | null> {

        return Utils.parseJSONFile<T>(Utils.getNodeModulesPath(packageName, filePath));

    }

    static getWorkspaceRootPath(): string {

        if (vscode.workspace.workspaceFolders) {

            return path.join(vscode.workspace.workspaceFolders[0].uri.fsPath);

        }

        return '';

    }

    static getNodeModulesPath(...paths: string[]) {

        return path.join(Utils.getWorkspaceRootPath(), 'node_modules', ...paths);

    }

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

    /** @todo Replace with utils.promisify() when Electron / VS Code is updated to Node 8 */
    static existsAsync(path: string): Promise<boolean> {

        return new Promise((resolve) => {
    
            fs.exists(path, (exists) => {
    
                resolve(exists);
    
            });
    
        });
    
    }

    static async parseJSONFile<T = any>(path: string): Promise<T | null> {

        let json: T | null = null;
    
        try {
            
            const data = await Utils.readFileAsync(path);
    
            json = JSON5.parse(data) as T;
    
        } catch (error) {
    
            /** 
             * @todo Change message when other schematics will be supported 
             * @todo Localization
             */
            vscode.window.showErrorMessage(`Can't read Angular schematics. @schematics/angular must be installed.`);
    
        }
    
        return json;
    
    }

}