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

    private static schematics: string[] | null = null;
    private static componentTypes: string[] | null = null;

    static getSchematics(): string[] {

        if (!this.schematics) {
            this.schematics = vscode.workspace.getConfiguration().get<string[]>(`ngschematics.schematics`, []);

            vscode.workspace.onDidChangeConfiguration(() => {
                this.schematics = vscode.workspace.getConfiguration().get<string[]>(`ngschematics.schematics`, []);
            });
        }

        return this.schematics;

    }

    static getComponentTypes<T extends keyof ComponentTypes>(type: T): string[] {

        if (!this.componentTypes) {
            this.componentTypes = vscode.workspace.getConfiguration().get<string[]>(`ngschematics.componentTypes.${type}`, [])
                .map((type) => type.toLowerCase());

            vscode.workspace.onDidChangeConfiguration(() => {
                this.componentTypes = vscode.workspace.getConfiguration().get<string[]>(`ngschematics.componentTypes.${type}`, [])
                    .map((type) => type.toLowerCase());
            });
        }
        
        return this.componentTypes;

    }

}