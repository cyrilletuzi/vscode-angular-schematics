import * as childProcess from 'child_process';
import * as fs from 'fs';
import * as util from 'util';
import * as os from 'os';
import * as path from 'path';
import * as vscode from 'vscode';


const osList = new Map<string, string>();
osList.set('darwin', 'osx');
osList.set('win32', 'windows');

const userOs = osList.get(os.platform()) || 'linux';

// TODO: Manage custom shell for Windows
const userShell = (userOs === 'windows') ? undefined : vscode.workspace.getConfiguration().get(`terminal.integrated.shell.${userOs}`) as string;

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

    static getSchemaFromNodeModules<T = unknown>(cwd: string, packageName: string, filePath: string): Promise<T | null> {

        return this.parseJSONFile<T>(this.getNodeModulesPath(cwd, packageName, filePath));

    }

    static getSchemaFromLocal<T = unknown>(cwd:string, schemaPath: string): Promise<T | null> {

        return this.parseJSONFile<T>(path.join(cwd, schemaPath));

    }

    static getNodeModulesPath(cwd: string, ...paths: string[]): string {

        return path.join(cwd, 'node_modules', ...paths);

    }

    static readFileAsync(path: string): Promise<string> {

        return (util.promisify(fs.readFile))(path, 'utf8');
    
    }

    static existsAsync(path: string): Promise<boolean> {

        return (util.promisify(fs.exists))(path);
    
    }

    static execAsync(command: string, cwd?: string): Promise<string> {

        return new Promise((resolve, reject) => {
    
            childProcess.exec(command, { cwd, shell: userShell }, (error, stdout, stderr) => {
    
                if (error) {
                    reject([stdout, stderr]);
                } else {
                    resolve(stdout);
                }
    
            });
    
        });
    
    }

    static async parseJSONFile<T = unknown>(path: string): Promise<T | null> {

        console.log(path);

        let json: T | null = null;
    
        try {
            
            let data: string = await this.readFileAsync(path);

            /* Angular Material schematics have comments, we remove them as it's not JSON compliant */
            if (path.includes('@angular/material')) {
                data = data.split('\n').map((line) => line.replace(/^ *\/\/.*/, '')).join('\n');
            }
    
            json = JSON.parse(data) as T;
    
        } catch (error) {}
    
        return json;
    
    }

    static isSchemaLocal(name: string): boolean {

        return (name.startsWith('.') && name.endsWith('.json'));

    }

}