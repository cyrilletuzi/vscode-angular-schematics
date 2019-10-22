import * as vscode from 'vscode';

import { defaultSchematics, defaultComponentTypes } from './defaults';


export interface ComponentTypes {
    /** Options: `--change-detection OnPush` */
    pure: string[];
    /** Options: `--skip-selector` */
    page: string[];
    /** Options: `--entry --skip-selector` */
    runtime: string[];
    /** Options: `--export --change-detection OnPush` */
    exported: string[];
    /** Options: `--entry --view-encapsulation ShadowDom` */
    element: string[];
}

export class Preferences {

    private static schematics: string[] | null = null;
    private static componentTypes: ComponentTypes | null = null;
    private static disableComponentTypeAsSuffix: boolean | null = null;
    private static event: vscode.Disposable | null;

    static init(): void {

        if (!this.event) {

            this.event = vscode.workspace.onDidChangeConfiguration(() => {
                this.schematics = null;
                this.componentTypes = null;
                this.disableComponentTypeAsSuffix = null;
            });

        } 

    }

    static getSchematics(): string[] {

        if (!this.schematics) {
            const userSchematics = vscode.workspace.getConfiguration().get<string[]>(`ngschematics.schematics`, []);
            this.schematics = [...defaultSchematics, ...userSchematics];
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
        }

        return this.componentTypes[type].map((type) => type.toLowerCase());

    }

    static isComponentTypeAsSuffixDisabled(): boolean {

        if (this.disableComponentTypeAsSuffix === null) {
            this.disableComponentTypeAsSuffix = vscode.workspace.getConfiguration().get<boolean>(`ngschematics.disableComponentTypeAsSuffix`, false);
        }

        return this.disableComponentTypeAsSuffix;

    }

}