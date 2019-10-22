import * as vscode from 'vscode';

import { defaultSchematics, defaultComponentTypes } from './defaults';


export interface ComponentTypes {
    /** Options: `--export` */
    exported: string[];
    /** Options: `--change-detection OnPush` */
    pure: string[];
    /** Options: `--skip-selector` */
    page: string[];
    /** Options: `--entry --skip-selector` */
    runtime: string[];
    /** Options: `--entry --view-encapsulation ShadowDom` */
    element: string[];
}

export class Preferences {

    private static schematics: string[] | null = null;
    private static componentTypes: string[] | null = null;

    static getSchematics(): string[] {

        if (!this.schematics) {
            const userSchematics = vscode.workspace.getConfiguration().get<string[]>(`ngschematics.schematics`, []);
            this.schematics = [...defaultSchematics, ...userSchematics];

            vscode.workspace.onDidChangeConfiguration(() => {
                const userSchematics = vscode.workspace.getConfiguration().get<string[]>(`ngschematics.schematics`, []);
                this.schematics = [...defaultSchematics, ...userSchematics];
            });
        }

        return this.schematics;

    }

    static getComponentTypes<T extends keyof ComponentTypes>(type: T): string[] {

        if (!this.componentTypes) {
            const userComponentTypes = vscode.workspace.getConfiguration().get<string[]>(`ngschematics.componentTypes.${type}`, []);
            this.componentTypes = [...defaultComponentTypes[type], ...userComponentTypes].map((type) => type.toLowerCase());

            vscode.workspace.onDidChangeConfiguration(() => {
                const userComponentTypes = vscode.workspace.getConfiguration().get<string[]>(`ngschematics.componentTypes.${type}`, []);
                this.componentTypes = [...defaultComponentTypes[type], ...userComponentTypes].map((type) => type.toLowerCase());
            });
        }

        return this.componentTypes;

    }

}