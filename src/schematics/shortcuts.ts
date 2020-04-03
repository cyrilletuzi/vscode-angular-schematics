import * as vscode from 'vscode';
import * as path from 'path';

import { ComponentType, defaultComponentTypes } from '../defaults';
import { Output, FileSystem } from '../utils';

export interface ShortcutType {
    options: Map<string, string | string[]>;
    choice: vscode.QuickPickItem;
}

export type ShortcutsTypes = Map<string, ShortcutType>;

export enum MODULE_TYPE {
    DEFAULT = `Module of components`,
    LAZY    = `Lazy-loaded module of pages`,
    ROUTING = `Classic module of pages`,
}

export enum COMPONENT_TYPE {
    DEFAULT  = `Default component`,
    PAGE     = `Page`,
    PURE     = `Pure component`,
    EXPORTED = `Exported component`,
}

export enum CONFIRMATION_LABEL {
    YES  = `Confirm`,
    MORE_OPTIONS     = `Add more options`,
    NO   = `Cancel`,
}

export class Shortcuts {

    /* Cache for component types choices */
    componentTypesChoices: ShortcutsTypes = new Map();
    /* Cache for module types choices */
    moduleTypesChoices: ShortcutsTypes = new Map();
    /* Cache for shortcut confirmation choices */
    confirmationChoices: vscode.QuickPickItem[] = [{
        label: CONFIRMATION_LABEL.NO,
        description: `Pro-tip: take a minute to check the command above is really what you want`,
    }, {
        label: CONFIRMATION_LABEL.MORE_OPTIONS,
        description: `Pro-tip: you can set default values to "schematics" options in angular.json`,
    }, {
        label: CONFIRMATION_LABEL.NO
    }];

    async init(workspaceFsPath: string): Promise<void> {

        this.setModuleTypesChoices();

        this.setComponentTypesChoices(workspaceFsPath);

    }

    /**
     * Get custom types (active defaults + user ones)
     */
    private async getCustomComponentTypes(workspaceFsPath: string): Promise<ComponentType[]> {

        /* `Map` is used to avoid duplicates */
        const customTypes = new Map<string, ComponentType>();

        /* Default custom types */
        for (const defaultType of defaultComponentTypes) {

            const packageFsPath = path.join(workspaceFsPath, 'node_modules', defaultType.package);
            
            /* Enable defaults only if the package exists */
            if (await FileSystem.isReadable(packageFsPath, { silent: true })) {

                customTypes.set(defaultType.label, defaultType);

            }
            
        }

        // TODO: Check it get the current workspace config and validate user input with JSON schema (or check if it's already done by vs code)
        /* User custom types */
        let userTypes = vscode.workspace.getConfiguration().get<ComponentType[]>('ngschematics.componentTypes', []);

        /* Info about configuration change in version >= 4 of the extension */
        if (!Array.isArray(userTypes)) {

            Output.logError(`"ngschematics.componentTypes" option has changed in version >= 4. See the changelog to update it.`);

            userTypes = [];

        } else {

            for (const userType of userTypes) {

                customTypes.set(userType.label, userType);

            }

        }

        return Array.from(customTypes.values());

    }

    /**
     * Cache component types choices.
     */
    private async setComponentTypesChoices(workspaceFsPath: string): Promise<void> {

        /* Default component types */
        const shortcutTypes: ShortcutsTypes = new Map();

        shortcutTypes.set(COMPONENT_TYPE.DEFAULT, {
            choice: {
                label: COMPONENT_TYPE.DEFAULT,
                detail: `Component with no special behavior (pro-tip: learn about component types in our documentation)`,
            },
            options: new Map(),
        });

        shortcutTypes.set(COMPONENT_TYPE.PAGE, {
            choice: {
                label: COMPONENT_TYPE.PAGE,
                detail: `Component associated to a route`,
            },
            options: new Map([
                ['type', 'page'],
                ['skipSelector', 'true'],
            ]),
        });

        shortcutTypes.set(COMPONENT_TYPE.PURE, {
            choice: {
                label: COMPONENT_TYPE.PURE,
                detail: `UI / presentation component, used only in its own feature module`,
            },
            options: new Map([
                ['changeDetection', 'OnPush'],
            ]),
        });

        shortcutTypes.set(COMPONENT_TYPE.EXPORTED, {
            choice: {
                label: COMPONENT_TYPE.EXPORTED,
                detail: `UI / presentation component, declared in a shared UI module and used in multiple feature modules`,
            },
            options: new Map([
                ['export', 'true'],
                ['changeDetection', 'OnPush'],
            ]),
        });

        /* Custom component types */
        for (const customType of await this.getCustomComponentTypes(workspaceFsPath)) {

            shortcutTypes.set(customType.label, {
                choice: {
                    label: customType.label,
                    detail: customType.detail,
                },
                options: new Map(customType.options),
            });

        }
        
        this.componentTypesChoices = shortcutTypes;

    }

    /**
     * Cache module types choices
     */
    private setModuleTypesChoices(): void {

        const shortcutTypes: ShortcutsTypes = new Map();

        shortcutTypes.set(MODULE_TYPE.DEFAULT, {
            choice: {
                label: MODULE_TYPE.DEFAULT,
                detail: `Module of UI / presentation components, don't forget to import it somewhere`,
            },
            options: new Map(),
        });

        shortcutTypes.set(MODULE_TYPE.LAZY, {
            choice: {
                label: MODULE_TYPE.LAZY,
                detail: `Module with routing, lazy-loaded`,
            },
            options: new Map([
                /* `route` value will be set later based on user input */
                ['route', ''],
                ['module', 'app'],
            ]),
        });

        shortcutTypes.set(MODULE_TYPE.ROUTING, {
            choice: {
                label: MODULE_TYPE.ROUTING,
                detail: `Module with routing, immediately loaded`,
            },
            options: new Map([
                ['routing', 'true'],
                ['module', 'app'],
            ]),
        });

        this.moduleTypesChoices = shortcutTypes;

    }

}
