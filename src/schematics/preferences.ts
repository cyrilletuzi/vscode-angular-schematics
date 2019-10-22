import * as vscode from 'vscode';


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

export class UserPreferences {

    static getSchematics(): string[] {

        return vscode.workspace.getConfiguration().get<string[]>(`schematics.`, []);

    }

    static getComponentTypes<T extends keyof ComponentTypes>(type: T): string[] {

        const componentTypes = vscode.workspace.getConfiguration().get<string[]>(`ngschematics.componentTypes.${type}`, []);

        return componentTypes.map((type) => type.toLowerCase());

    }

}