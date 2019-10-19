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

interface Preferences {
    schematics?: string[];
    componentTypes?: Partial<ComponentTypes>;
}

export class UserPreferences {

    static get<T extends keyof Preferences>(name: T): Preferences[T] | undefined {

        const userConfiguration = vscode.workspace.getConfiguration().get<Preferences>('ngschematics');

        return userConfiguration && (name in userConfiguration) ? userConfiguration[name] : undefined;

    }

    static getComponentTypes<T extends keyof ComponentTypes>(name: T): string[] {

        const componentTypes = this.get('componentTypes');

        const askedcomponentTypes = (componentTypes && name in componentTypes) ? componentTypes[name] as string[] : [];

        return askedcomponentTypes.map((type) => type.toLowerCase());

    }

}