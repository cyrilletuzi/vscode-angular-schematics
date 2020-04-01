import * as vscode from 'vscode';

import { Schematics } from '../schematics';

import { PackageJsonConfig } from './package-json';
import { TslintConfig } from './tslint';
import { TypescriptConfig } from './typescript';
import { AngularConfig } from './angular';

export interface WorkspaceExtended extends vscode.WorkspaceFolder {   
    packageJsonConfig: PackageJsonConfig;
    tslintConfig: TslintConfig;
    typescriptConfig: TypescriptConfig;
    angularConfig: AngularConfig;
    schematics: Schematics;
}
