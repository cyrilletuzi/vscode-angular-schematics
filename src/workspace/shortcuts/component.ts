import * as vscode from 'vscode';

import { ComponentType, defaultComponentTypes } from '../../defaults';
import { Output, FileSystem, JsonValidator } from '../../utils';
import { formatCliCommandOptions } from '../../generation';

import { ShortcutsTypes } from './shortcuts';

export enum COMPONENT_TYPE {
    DEFAULT  = `$(thumbsdown) Default component`,
    PAGE     = `$(preview) Page`,
    PURE     = `$(zap) Pure component`,
    EXPORTED = `$(link-external) Exported component`,
}

export class ComponentShortcut {

    /* Cache for component types choices */
    types: ShortcutsTypes = new Map();

    async init(workspaceFolder: vscode.WorkspaceFolder): Promise<void> {

        /* Start from scratch as it can be called again via watcher */
        this.types.clear();

        this.types.set(COMPONENT_TYPE.DEFAULT, {
            choice: {
                label: COMPONENT_TYPE.DEFAULT,
                detail: `Component with no special behavior (pro-tip: learn about component types in our documentation)`,
            },
            options: new Map(),
        });

        this.types.set(COMPONENT_TYPE.PAGE, {
            choice: {
                label: COMPONENT_TYPE.PAGE,
                detail: `Component associated to a route`,
            },
            options: new Map([
                ['type', 'page'],
                ['skipSelector', 'true'],
            ]),
        });

        this.types.set(COMPONENT_TYPE.PURE, {
            choice: {
                label: COMPONENT_TYPE.PURE,
                detail: `UI / presentation component, used only in its own feature module`,
            },
            options: new Map([
                ['changeDetection', 'OnPush'],
            ]),
        });

        this.types.set(COMPONENT_TYPE.EXPORTED, {
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

            this.types.set(customType.label, {
                choice: {
                    label: customType.label,
                    detail: customType.detail,
                },
                options: new Map(customType.options),
            });

        }

        for (const [, type] of this.types) {

            type.choice.description = formatCliCommandOptions(type.options) || 'No pre-filled option';

        }

    }

    /**
     * Validate "ngschematics.componentTypes" user preference
     */
    private validateUserComponentType(userPreference: unknown): ComponentType | undefined {

        const type = JsonValidator.object(userPreference);
        const label = JsonValidator.string(type?.label);
        const optionsList = JsonValidator.array(type?.options);

        if (!label || !optionsList) {
            return undefined;
        } 

        const options: [string, string][] = [];

        for (const optionItem of optionsList) {

            const option = JsonValidator.array(optionItem);

            if (!option || (option.length !== 2)) {
                return undefined;
            }

            const name = JsonValidator.string(option[0]);
            const value = JsonValidator.string(option[1]);

            if (!name || (value === undefined)) {
                return undefined;
            }

            options.push([name, value]);

        }

        return {
            label,
            detail: JsonValidator.string(type?.detail),
            options,
            package: '',
        };

    }

    /**
     * Get custom types (active defaults + user ones)
     */
    private async getCustomComponentTypes(workspaceFolder: vscode.WorkspaceFolder): Promise<ComponentType[]> {

        /* `Map` is used to avoid duplicates */
        const customTypes = new Map<string, ComponentType>();

        /* Default custom types */
        for (const defaultType of defaultComponentTypes) {

            /* Enable defaults only if the package exists */
            if (await FileSystem.findPackageFsPath(workspaceFolder, workspaceFolder.uri.fsPath, defaultType.package, { silent: true })) {

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

            Output.logInfo(`${userTypes.length} custom component type(s) detected in the preferences.`);

            for (const userType of userTypes) {

                const type = this.validateUserComponentType(userType);

                if (type) {

                    if (customTypes.has(type.label)) {
                        Output.logWarning(`"${type.label}" component type already exists.`);
                    } 

                    customTypes.set(type.label, type);

                    Output.logInfo(`Adding "${type.label}" custom component type.`);

                }

            }

        }

        return Array.from(customTypes.values());

    }

}
