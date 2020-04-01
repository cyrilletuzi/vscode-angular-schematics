import * as vscode from 'vscode';
import * as path from 'path';

import { FileSystem } from '../utils/file-system';
import { AngularConfig } from '../config/angular';
import { TslintConfig } from '../config/tslint';
import { GenerationOptions } from '../generation-command';
import { ComponentType, defaultComponentTypes } from '../defaults';
import { Watchers } from '../utils/watchers';
import { Output } from '../utils/output';

const MODULE_TYPE_LAZY    = `Lazy-loaded module of pages`;
const MODULE_ROUTE_NAME_PLACEHOLDER = `<route-name>`;

export interface ShortcutType {
    options: GenerationOptions;
    choice: vscode.QuickPickItem;
}

export type ShortcutTypes = Map<string, ShortcutType>;

export interface SchemaConfig {
    name: string;
    collectionName: string;
    description: string;
    fsPath: string;
}

interface SchemaDataDefaultOption {
    $source: 'argv' | 'projectName';
    index?: number;
}

interface SchemaDataOptions {
    type: 'string' | 'boolean' | 'array';
    description: string;
    enum?: string[];
    visible?: boolean;
    default?: string | boolean;
    $default?: SchemaDataDefaultOption;
    extends?: string;
    items?: {
        enum?: string[];
    };
    'x-deprecated'?: string;
    'x-prompt'?: {
        message?: string;
        multiselect?: boolean;
        items?: string[];
    };
}

interface SchemaData {
    properties: {
        [key: string]: SchemaDataOptions;
    };
    required?: string[];
}

export class Schema {

    private name: string;
    private collectionName: string;
    private fsPath: string;
    private config!: SchemaData;
    private options = new Map<string, SchemaDataOptions>();
    private requiredOptionsNames: string[] = [];
    private shortcutTypesChoices: ShortcutTypes = new Map();
    private optionsChoices: vscode.QuickPickItem[] = [];
    
    get optionsNames(): string[] {
        return Array.from(this.options.keys()).sort();
    }

    constructor(
        config: SchemaConfig,
        private workspace: vscode.WorkspaceFolder,
        private angularConfig: AngularConfig,
        private tslintConfig: TslintConfig,
    ) {

        this.name = config.name;
        this.collectionName = config.collectionName;
        this.fsPath = config.fsPath;

    }

    async init(): Promise<void> {

        await this.setConfig();        

        /* Component types can have custom types from user configuration */
        if ((this.collectionName === AngularConfig.defaultAngularCollection) && (this.name === 'component')) {
            Watchers.watchCodePreferences(() => {
                this.setComponentTypesChoices();
            });
        }

    }

    private async setConfig(): Promise<void> {

        if (!await FileSystem.isReadable(this.fsPath, this.workspace)) {
            throw new Error(`${this.name} schematics schema can not be found or read.`);
        }

        const config = await FileSystem.parseJsonFile<SchemaData>(this.fsPath);

        if (!config) {
            throw new Error(`${this.name} schematics collection can not be parsed.`);
        }

        await this.setOptions();

    }

    /**
     * Get schema's name without collection
     */
    getName(): string {
        return this.name;
    }

    getSomeOptions(names: string[]): Map<string, SchemaDataOptions> {

        return new Map(names
            .filter((name) => this.options.has(name))
            .map((name) => [name, this.options.get(name)!])
        );

    }

    getRequiredOptions(): Map<string, SchemaDataOptions> {

        return new Map(this.requiredOptionsNames
            .map((name) => [name, this.options.get(name)!])
        );

    }

    getComponentTypesChoices(): ShortcutTypes {

        return this.shortcutTypesChoices;
        
    }

    getModuleTypes(routeName: string): ShortcutTypes {

        const lazyModule = this.shortcutTypesChoices.get(MODULE_TYPE_LAZY)!;

        /* Add `route` option */
        lazyModule.options.set('route', routeName);

        /* Replace placeholder for `route` option in choice description */
        lazyModule.choice.description = lazyModule.choice.description!.replace(MODULE_ROUTE_NAME_PLACEHOLDER, routeName);

        this.shortcutTypesChoices.set(MODULE_TYPE_LAZY, lazyModule)!;

        return this.shortcutTypesChoices;
        
    }

    getOptionsChoices(): vscode.QuickPickItem[] {
        return this.optionsChoices;
    }

    hasOption(name: string): boolean {
        return this.options.has(name);
    }

    /**
     * Tells if the schema requires a path/to/name as first command line argument
     */
    hasNameAsFirstArg(): boolean {

        for (const [name, option] of this.options.entries()) {

            /* `argv[0]` means it is the first argument in command line after `ng g <some-schema>` */
            if ((name === 'name') && (option.$default?.$source === 'argv') && (option.$default?.index === 0)) {
                return true;
            }

        }

        return false;
    
    }

    hasPath(): boolean {

        return this.options.has('path');
    
    }

    private async setOptions(): Promise<void> {

        const options = Object.entries(this.config.properties);

        for (const [name, option] of options) {
            this.options.set(name, option);
        }

        this.requiredOptionsNames = (this.config.required ?? [])
            /* Options which have a `$default` will be taken care by the CLI, so they are not required */
            .filter((name) => !(('$default') in this.options.get(name)!));
        
        if (this.collectionName === AngularConfig.defaultAngularCollection) {
            if (this.name === 'module') {
                this.setModuleTypesChoices();
            } else if (this.name === 'component') {
                await this.setComponentTypesChoices();
            }
        }
        
        this.setOptionsChoices();

    }

    private async setComponentTypesChoices(): Promise<void> {

        /* Prior to new Ivy engine, components instanciated at runtime (modals, dialogs...)
         * must be declared in the `NgModule` `entryComponents` (in addition to `declarations`) */
        const entryComponentsRequired = !this.angularConfig.isIvy() && this.hasOption('entryComponent');

        /* `type` CLI option is new in Angular >= 9 */
        const hasPageSuffix = this.hasOption('type') && this.tslintConfig.hasSuffix('Page');

        const COMPONENT_TYPE_DEFAULT  = `Default component`;
        /* If `entryComponent` is not required, dialogs / modals are generated as pages,
         * but if the user has set specific suffixes (`Page`, `Dialog`, `Modal`...),
         * dialogs / modals will be proposed as a distinct choice */
        const COMPONENT_TYPE_PAGE     = `Page${(!entryComponentsRequired && !hasPageSuffix) ? ` (or dialog / modal)` : ''}`;
        const COMPONENT_TYPE_PURE     = `Pure component`;
        const COMPONENT_TYPE_EXPORTED = `Exported component`;
        const COMPONENT_TYPE_ENTRY    = `Entry component`;

        const shortcutTypes: ShortcutTypes = new Map();

        shortcutTypes.set(COMPONENT_TYPE_DEFAULT, {
            choice: {
                label: COMPONENT_TYPE_DEFAULT,
                description: `No pre-filled option`,
                detail: `Component with no special behavior (pro-tip: learn about component types in our documentation)`,
            },
            options: new Map(),
        });

        shortcutTypes.set(COMPONENT_TYPE_PAGE, {
            choice: {
                label: COMPONENT_TYPE_PAGE,
                /* If user has set the `Page` suffix in `tslint.json`, prefill it automatically */
                description: `--skip-selector${hasPageSuffix ? ` --type page` : ''}`,
                /* If `entryComponent` is not required, dialogs / modals are generated as pages,
                 * but if the user has set specific suffixes (`Page`, `Dialog`, `Modal`...),
                 * dialogs / modals will be proposed as a distinct choice */
                detail: `Component associated to a route${(!entryComponentsRequired && !hasPageSuffix) ? ` or a dialog / modal` : ''}`,
            },
            options: new Map([
                ['skipSelector', 'true'],
            ]),
        });

        /* If user has set the `Page` suffix in `tslint.json`, prefill it automatically */
        if (hasPageSuffix) {
            shortcutTypes.get(COMPONENT_TYPE_PAGE)!.options.set('type', 'page');
        }

        shortcutTypes.set(COMPONENT_TYPE_PURE, {
            choice: {
                label: COMPONENT_TYPE_PURE,
                description: `--change-detection OnPush`,
                detail: `UI / presentation component, used only in its own feature module`,
            },
            options: new Map([
                ['changeDetection', 'OnPush'],
            ]),
        });

        shortcutTypes.set(COMPONENT_TYPE_EXPORTED, {
            choice: {
                label: COMPONENT_TYPE_EXPORTED,
                description: `--export --change-detection OnPush`,
                detail: `UI / presentation component, declared in a shared UI module and used in multiple feature modules`,
            },
            options: new Map([
                ['export', 'true'],
                ['changeDetection', 'OnPush'],
            ]),
        });

        if (entryComponentsRequired) {

            shortcutTypes.set(COMPONENT_TYPE_ENTRY, {
                choice: {
                    label: COMPONENT_TYPE_ENTRY,
                    description: `--entry-component --skip-selector`,
                    detail: `Component instanciated at runtime, like a dialog or modal`,
                },
                options: new Map([
                    ['entryComponent', 'true'],
                    ['skipSelector', 'true'],
                ]),
            });

        }

        for (const customType of await this.getCustomTypes()) {

            if (!entryComponentsRequired) {
                customType.description = customType.description?.replace('--entry-component', '').replace('--entryComponent', '');
                customType.options = customType.options?.filter(([name]) => !['entry-component', 'entryComponent'].includes(name));
            }

            if (customType.suffix && this.tslintConfig.hasSuffix(customType.suffix)) {
                customType.description = `${customType.description ?? ''} --type ${customType.suffix}`;
                customType.options = customType.options ?? [];
                customType.options.push(['type', customType.suffix]);
            }

            shortcutTypes.set(customType.label, {
                choice: {
                    label: customType.label,
                    description: customType.description,
                    detail: customType.detail,
                },
                options: new Map(customType.options),
            });

        }
        
        this.shortcutTypesChoices = shortcutTypes;

    }

    private async getCustomTypes(): Promise<ComponentType[]> {

        /* `Map` is used to avoid duplicates */
        const customTypes = new Map<string, ComponentType>();

        for (const defaultType of defaultComponentTypes) {

            if (defaultType.suffix && this.tslintConfig.hasSuffix(defaultType.suffix)) {

                customTypes.set(defaultType.label, defaultType);

            }
            
            if (defaultType.packages) {

                for (const packageName of defaultType.packages) {

                    const packageFsPath = path.join(this.workspace.uri.fsPath, 'node_modules', packageName);

                    if (await FileSystem.isReadable(packageFsPath)) {

                        defaultType.detail = `${packageName} custom component type`;

                        customTypes.set(defaultType.label, defaultType);

                        // TODO: check it only breaks current loop
                        break;

                    }

                }

            }
            
        }

        // TODO: Check it get the current workspace config
        // TODO: validate user input with JSON schema (or check if it's already done by vs code)
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

    private setModuleTypesChoices(): void {

        /* `MODULE_TYPE_LAZY` is defined globally as we need it in another method */
        const MODULE_TYPE_CLASSIC = `Module of components`;
        const MODULE_TYPE_ROUTING = `Classic module of pages`;

        const shortcutTypes: ShortcutTypes = new Map();

        shortcutTypes.set(MODULE_TYPE_CLASSIC, {
            choice: {
                label: MODULE_TYPE_CLASSIC,
                description: `No pre-filled option`,
                detail: `Module of UI / presentation components, don't forget to import it somewhere`,
            },
            options: new Map(),
        });

        /* Angular >= 8.1 */
        if (this.hasOption('route')) {
            shortcutTypes.set(MODULE_TYPE_LAZY, {
                choice: {
                    label: MODULE_TYPE_LAZY,
                    /* Placeholder will be set in `.getModuleTypes()` */
                    description: `--route ${MODULE_ROUTE_NAME_PLACEHOLDER} --module app`,
                    detail: `Module with routing, lazy-loaded`,
                },
                options: new Map([
                    /* `route` option will be set in `.getModuleTypes()` as it needs the route name */
                    ['module', 'app'],
                ]),
            });
        }

        shortcutTypes.set(MODULE_TYPE_ROUTING, {
            choice: {
                label: MODULE_TYPE_ROUTING,
                description: `--routing --module app`,
                detail: `Module with routing, immediately loaded`,
            },
            options: new Map([
                ['routing', 'true'],
                ['module', 'app'],
            ]),
        });

        this.shortcutTypesChoices = shortcutTypes;

    }

    private setOptionsChoices(): void {

        const choices: vscode.QuickPickItem[] = [];

        const filteredOptionsNames = Array.from(this.options.entries())
            /* Do not keep options marked as not visible (internal options for the CLI) */
            .filter(([_, option]) => (option.visible !== false))
            /* Do not keep deprecated options */
            .filter(([_, option]) => !('x-deprecated' in option))
            /* Do not keep option already managed by first command line arg (name) */
            .filter(([_, option]) => !(option.$default && (option.$default.$source === 'argv') && (option.$default.index === 0)));

        for (const [label, option] of filteredOptionsNames) {

            let picked = false;

            /* UX: inform the user why some options are pre-select */
            let requiredOrSuggestedInfo = '';

            /* Do not pre-select options with defaults values, as the CLI will take care of them */
            if (!('$default' in option)) {

                /* Required options */
                if (this.requiredOptionsNames.includes(label)) {
                    picked = true;
                    requiredOrSuggestedInfo = `(required) `;
                }
                /* Suggested options (because they have a prompt) */
                else if ('x-prompt' in option) {
                    picked = true;
                    requiredOrSuggestedInfo = `(suggested) `;
                }

            }

            choices.push({
                label,
                description: `${requiredOrSuggestedInfo}${option.description}`,
                picked
            });

        }

        /* Sort required first, then in alphabetical order */
        const sortedPickedChoices = choices
            .filter((choice) => choice.picked)
            .sort((a, b) => a.label.localeCompare(b.label));

        const sortedOptionalChoices = choices
            .filter((choice) => !choice.picked)
            .sort((a, b) => a.label.localeCompare(b.label));

        /* Required and suggested options first */
        this.optionsChoices = [...sortedPickedChoices, ...sortedOptionalChoices];

    } 

}
