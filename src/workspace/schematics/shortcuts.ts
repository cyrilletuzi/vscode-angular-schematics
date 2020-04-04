import * as vscode from 'vscode';
import * as path from 'path';

import { ComponentType, defaultComponentTypes } from '../../defaults';
import { Output, FileSystem } from '../../utils';

export interface ShortcutType {
    options: Map<string, string | string[]>;
    choice: vscode.QuickPickItem;
}

export type ShortcutsTypes = Map<string, ShortcutType>;

export enum MODULE_TYPE {
    DEFAULT = `$(extensions) Module of components`,
    LAZY    = `$(zap) Lazy-loaded module of pages`,
    ROUTING = `$(files) Classic module of pages`,
}

export enum COMPONENT_TYPE {
    DEFAULT  = `$(thumbsdown) Default component`,
    PAGE     = `$(preview) Page`,
    PURE     = `$(zap) Pure component`,
    EXPORTED = `$(link-external) Exported component`,
}

export enum CONFIRMATION_LABEL {
    YES          = `$(check) Confirm`,
    MORE_OPTIONS = `$(gear) Add more options`,
    NO           = `$(close) Cancel`,
}

export class Shortcuts {

    /* Cache for component types choices */
    componentTypesChoices: ShortcutsTypes = new Map();
    /* Cache for module types choices */
    moduleTypesChoices: ShortcutsTypes = new Map();
    /* Cache for shortcut confirmation choices */
    static confirmationChoices: vscode.QuickPickItem[] = [{
        label: CONFIRMATION_LABEL.YES,
        description: `Pro-tip: take a minute to check the command above is really what you want`,
    }, {
        label: CONFIRMATION_LABEL.MORE_OPTIONS,
        description: `Pro-tip: you can set default values to "schematics" options in angular.json`,
    }, {
        label: CONFIRMATION_LABEL.NO
    }];

    async init(workspaceFolder: vscode.WorkspaceFolder): Promise<void> {

        this.setModuleTypesChoices();

        this.setComponentTypesChoices(workspaceFolder);

    }

    /**
     * Validate "ngschematics.componentTypes" user preference
     */
    private validateUserComponentType(userPreference: unknown): boolean {

        if ((typeof userPreference === 'object')
        && (userPreference !== null)
        && ('label' in userPreference)
        && (!('detail' in userPreference) || typeof (userPreference as { detail: unknown }).detail === 'string')
        && ('options' in userPreference)
        && Array.isArray((userPreference as { options: unknown }).options)
        ) {
            for (const option of (userPreference as { options: unknown[] }).options) {
                if (!Array.isArray(option)
                || (option.length !== 2)
                || (typeof option[0] !== 'string')
                && (typeof option[1] !== 'string')) {
                    return false;
                }
            }
            return true;
        }

        return false;

    }

    /**
     * Get custom types (active defaults + user ones)
     */
    private async getCustomComponentTypes(workspaceFolder: vscode.WorkspaceFolder): Promise<ComponentType[]> {

        /* `Map` is used to avoid duplicates */
        const customTypes = new Map<string, ComponentType>();

        /* Default custom types */
        for (const defaultType of defaultComponentTypes) {

            const packageFsPath = path.join(workspaceFolder.uri.fsPath, 'node_modules', defaultType.package);
            
            /* Enable defaults only if the package exists */
            if (await FileSystem.isReadable(packageFsPath, { silent: true })) {

                customTypes.set(defaultType.label, defaultType);

            }
            
        }

        /* User custom types */
        let userTypes = vscode.workspace.getConfiguration('ngschematics', workspaceFolder.uri).get<unknown>('componentTypes', []);

        if (userTypes === '') {
            userTypes = [];
        }

        /* Info about configuration change in version >= 4 of the extension */
        if (!Array.isArray(userTypes)) {

            Output.logWarning(`"ngschematics.componentTypes" option has changed in version >= 4. See the changelog to update it.`);

            userTypes = [];

        } else {

            Output.logWarning(`${userTypes.length} custom component type(s) detected in the preferences.`);

            for (const userType of userTypes) {

                if (this.validateUserComponentType(userType)) {

                    const type = userType as ComponentType;

                    customTypes.set(type.label, type);

                    Output.logWarning(`Adding "${type.label}" custom component type.`);

                } else {

                    Output.logWarning(`Your "ngschematics.componentTypes" preference is invalid.`);

                }

            }

        }

        return Array.from(customTypes.values());

    }

    /**
     * Cache component types choices.
     */
    private async setComponentTypesChoices(workspaceFolder: vscode.WorkspaceFolder): Promise<void> {

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
        for (const customType of await this.getCustomComponentTypes(workspaceFolder)) {

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
