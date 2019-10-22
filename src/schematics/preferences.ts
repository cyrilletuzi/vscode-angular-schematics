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
    private static componentTypes: ComponentTypes | null = null;
    private static disableComponentTypeAsSuffix: boolean | null = null;

    static getSchematics(): string[] {

        if (!this.schematics) {
            const userSchematics = vscode.workspace.getConfiguration().get<string[]>(`ngschematics.schematics`, []);
            this.schematics = [...defaultSchematics, ...userSchematics];

            vscode.workspace.onDidChangeConfiguration(() => {
                this.schematics = null;
            });
        }

        return this.schematics;

    }

    static getComponentTypes<T extends keyof ComponentTypes>(type: T): string[] {

        if (!this.componentTypes) {
            const userComponentTypes = vscode.workspace.getConfiguration().get<Partial<ComponentTypes>>('ngschematics.componentTypes', {});
            this.componentTypes = {
                exported: [...defaultComponentTypes.exported, ...(userComponentTypes.exported || [])],
                pure: [...defaultComponentTypes.pure, ...(userComponentTypes.pure || [])],
                page: [...defaultComponentTypes.page, ...(userComponentTypes.page || [])],
                runtime: [...defaultComponentTypes.runtime, ...(userComponentTypes.runtime || [])],
                element: [...defaultComponentTypes.element, ...(userComponentTypes.element || [])],
            };

            vscode.workspace.onDidChangeConfiguration(() => {
                this.componentTypes = null;
            });
        }

        return this.componentTypes[type].map((type) => type.toLowerCase());

    }

    static isComponentTypeAsSuffixDisabled(): boolean {

        if (this.disableComponentTypeAsSuffix === null) {
            this.disableComponentTypeAsSuffix = vscode.workspace.getConfiguration().get<boolean>(`ngschematics.disableComponentTypeAsSuffix`, false);

            vscode.workspace.onDidChangeConfiguration(() => {
                this.disableComponentTypeAsSuffix = null;
            });
        }

        return this.disableComponentTypeAsSuffix;

    }

}