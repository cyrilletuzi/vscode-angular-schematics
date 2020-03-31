import * as vscode from 'vscode';
import * as path from 'path';

import { FileSystem } from './file-system';
import { Watchers } from './watchers';

export interface PackageJsonSchema {
    dependencies?: {
        '@angular/core'?: string;
    };
}

export class PackageJsonConfig {

    // TODO: could be in a subdirectory
    /** Basename of the package manager config file */
    static readonly fileName = 'package.json';
    /** File system path of the package manager config file */
    private fsPath: string;
    /** Values from the package manager config file */
    private config!: PackageJsonSchema | undefined;
    /** Angular major version */
    private angularMajorVersion!: number | undefined;
    
    constructor(private workspace: vscode.WorkspaceFolder) {

        this.fsPath = path.join(workspace.uri.fsPath, PackageJsonConfig.fileName);

    }

    async init(): Promise<void> {

        await this.setConfig();

        Watchers.watchFile(this.fsPath, () => {
            this.setConfig();
        });

    }

    /**
     * Get Angular major version or `undefined`
     */
    getAngularMajorVersion(): number | undefined {
        return this.angularMajorVersion;
    }

    private async setConfig(): Promise<void> {

        this.config = await FileSystem.parseJsonFile<PackageJsonSchema>(this.fsPath, this.workspace);

        this.setAngularMajorVersion();

    }

    /**
     * Try to resolve Angular major version and save it
     */
    private setAngularMajorVersion(): void {

        /* We remove special semver characters (`^` and `~`) and keep the first number */
        const angularVersion = this.config?.dependencies?.['@angular/core']?.replace('^', '').replace('~', '').substr(0, 1);

        this.angularMajorVersion = angularVersion ? Number.parseInt(angularVersion, 10) : undefined;

    }

}
