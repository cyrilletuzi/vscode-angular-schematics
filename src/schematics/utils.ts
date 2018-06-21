import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as childProcess from 'child_process';
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

        return this.parseJSONFile<T>(this.getNodeModulesPath(packageName, filePath));

    }

    static getWorkspaceRootPath(): string {

        if (vscode.workspace.workspaceFolders) {

            return path.join(vscode.workspace.workspaceFolders[0].uri.fsPath);

        }

        return '';

    }

    static getNodeModulesPath(...paths: string[]) {

        return path.join(this.getWorkspaceRootPath(), 'node_modules', ...paths);

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

    /** @todo Replace with utils.promisify() when Electron / VS Code is updated to Node 8 */
    static execAsync(command: string): Promise<string> {

        return new Promise((resolve, reject) => {
    
            childProcess.exec(command, { cwd: vscode.workspace.rootPath }, (error, stdout, stderr) => {
    
                if (error) {
                    reject([stdout, stderr]);
                } else {
                    resolve(stdout);
                }
    
            });
    
        });
    
    }

    static async parseJSONFile<T = any>(path: string): Promise<T | null> {

        let json: T | null = null;
    
        try {
            
            const data = await this.readFileAsync(path);
    
            json = JSON5.parse(data) as T;
    
        } catch (error) {}
    
        return json;
    
    }

}