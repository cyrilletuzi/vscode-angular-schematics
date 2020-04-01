import * as vscode from 'vscode';
import * as path from 'path';

import { FileSystem, Watchers } from '../utils';

interface PackageJsonSchema {
    dependencies?: {
        '@angular/core'?: string;
    };
}

export class PackageJsonConfig {

    // TODO: could be in a subdirectory
    /** Basename of the package manager config file */
    private static readonly fileName = 'package.json';
    /** File system path of the package manager config file */
    private fsPath!: string;
    /** Values from the package manager config file */
    private config: PackageJsonSchema | undefined;
    /** Angular major version */
    private angularMajorVersion: number | undefined;
    
    constructor(private workspace: vscode.WorkspaceFolder) {}

    /**
     * Initializes `package.json` configuration.
     * **Must** be called after each `new PackageJsonConfig()`
     * (delegated because `async` is not possible on a constructor).
     */
    async init(): Promise<void> {

        /* Watcher must be set just once */
        if (!this.fsPath) {

            this.fsPath = path.join(this.workspace.uri.fsPath, PackageJsonConfig.fileName);

            Watchers.watchFile(this.fsPath, () => {
                this.init();
            });

        }

        this.config = await FileSystem.parseJsonFile<PackageJsonSchema>(this.fsPath, this.workspace);

        this.setAngularMajorVersion();

    }

    /**
     * Get `@angular/core` major version or `undefined`
     */
    getAngularMajorVersion(): number | undefined {
        return this.angularMajorVersion;
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
