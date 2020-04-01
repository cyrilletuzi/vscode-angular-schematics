import * as vscode from 'vscode';
import * as path from 'path';

import { FileSystem } from './file-system';
import { AngularConfig } from './config-angular';
import { TSLintConfig } from './config-tslint';
import { GenerationOptions } from './current-generation';
import { ComponentType, defaultComponentTypes } from './defaults';
import { Watchers } from './watchers';
import { Output } from './output';

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
    private requiredOptions: string[] = [];
    private shortcutTypes: ShortcutTypes = new Map();
    
    get optionsNames(): string[] {
        return Array.from(this.options.keys()).sort();
    }

    constructor(
        config: SchemaConfig,
        private workspace: vscode.WorkspaceFolder,
        private angularConfig: AngularConfig,
        private tslintConfig: TSLintConfig,
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
                this.setComponentTypes();
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

    getComponentTypes(): ShortcutTypes {

        return this.shortcutTypes;
        
    }

    getModuleTypes(routeName: string): ShortcutTypes {

        const lazyModule = this.shortcutTypes.get(MODULE_TYPE_LAZY)!;

        /* Add `route` option */
        lazyModule.options.set('route', routeName);

        /* Replace placeholder for `route` option in choice description */
        lazyModule.choice.description = lazyModule.choice.description!.replace(MODULE_ROUTE_NAME_PLACEHOLDER, routeName);

        this.shortcutTypes.set(MODULE_TYPE_LAZY, lazyModule)!;

        return this.shortcutTypes;
        
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

    async askOptions(): Promise<string[]> {

        const choices: vscode.QuickPickItem[] = [];

        this.options.forEach((option, optionName) => {

            /* Do not keep:
             * - options marked as not visible (internal options for the CLI)
             * - deprecated options
             * - option already managed by command line args (like name)
             */
            if (option.visible !== false && !('x-deprecated' in option) &&
                !(option.$default && option.$default.$source === 'argv')) {

                const picked = !!
                /* Do not pre-select options with defaults values, as the CLI will take care of them */
                (!('$default' in option) && (
                    /* Pre-select required and suggested (x-prompt) properties */
                    (this.requiredOptions.includes(optionName)) || ('x-prompt' in option)
                ));

                /* UX: inform the user why some options are pre-select */
                const requiredTip = (!('$default' in option) && (this.requiredOptions.includes(optionName))) ? '(required) ' : '';
                const suggestedTip = (!('$default' in option) && !requiredTip && ('x-prompt' in option)) ? '(suggested) ' : '';

                choices.push({
                    label: optionName,
                    description: `${requiredTip}${suggestedTip}${option.description}`,
                    picked
                });

            }

        });

        /* Sort in alphabetical order */
        const sortedPickedChoices = choices
        .filter((choice) => choice.picked)
        .sort((a, b) => a.label.localeCompare(b.label));

        const sortedOptionalChoices = choices
        .filter((choice) => !choice.picked)
        .sort((a, b) => a.label.localeCompare(b.label));

        /* Required and suggested options first */
        const sortedChoices = [...sortedPickedChoices, ...sortedOptionalChoices];

        const selectedOptions = await vscode.window.showQuickPick(sortedChoices, {
            canPickMany: true,
            placeHolder: `Do you need some options? (if not, just press Enter to skip this step)`,
            ignoreFocusOut: true,
        }) || [];

        return selectedOptions.map((selectedOption) => selectedOption.label);

    }

    async askOptionsValues(optionsNames: string[]): Promise<Map<string, string | string[]>> {

        const options = this.filterSelectedOptions(optionsNames);

        const filledOptions = new Map<string, string | string[]>();
    
        for (let [optionName, option] of options) {

            let choice: string | string[] | undefined = '';
            const promptSchema = option['x-prompt'];
            const prompt = (promptSchema && promptSchema.message) ? promptSchema.message : option.description;
    
            if (option.enum !== undefined) {
    
                /** @todo Put default value last in choices */
                /** @todo Take user defaults in angular.json into account in ordering */
                choice = await this.askEnumOption(optionName, option.enum, prompt);
    
            } else if (option.type === 'boolean') {
    
                /** @todo Take user defaults in angular.json into account in ordering */
                const choices = (option.default === true) ? ['false', 'true'] : ['true', 'false'];
    
                choice = await this.askEnumOption(optionName, choices, prompt);
    
            }
            /* Only makes sense if the option is an array AND have suggestions,
             * otherwise the user must manually type the value in a classic text input box */
            else if ((option.type === 'array')) {

                if (promptSchema && promptSchema.multiselect && promptSchema.items) {
                    choice = await this.askMultiselectOption(optionName, promptSchema.items, prompt);
                } else if (option.items && option.items.enum) {
                    choice = await this.askMultiselectOption(optionName, option.items.enum, prompt);
                } else {
                    choice = await vscode.window.showInputBox({
                        placeHolder: `--${optionName}`,
                        prompt,
                        ignoreFocusOut: true,
                    });
                }
    
            } else {
    
                choice = await vscode.window.showInputBox({
                    placeHolder: `--${optionName}`,
                    prompt,
                    ignoreFocusOut: true,
                });
    
            }
    
            if (choice) {
                filledOptions.set(optionName, choice);
            }

        }
    
        return filledOptions;
    
    }

    protected async askEnumOption(optionName: string, choices: string[], placeholder = ''): Promise<string | undefined> {

        return vscode.window.showQuickPick(choices, {
            placeHolder: `--${optionName}${placeholder ? `: ${placeholder}` : ''}`,
            ignoreFocusOut: true,
        });

    }

    protected async askMultiselectOption(optionName: string, choices: string[], placeholder = ''): Promise<string[] | undefined> {

        return vscode.window.showQuickPick(choices, {
            placeHolder: `--${optionName}${placeholder ? `: ${placeholder}` : ''}`,
            canPickMany: true,
            ignoreFocusOut: true,
        });

    }

    private async setOptions(): Promise<void> {

        const options = Object.entries(this.config.properties);

        for (const [name, option] of options) {
            this.options.set(name, option);
        }

        this.requiredOptions = this.config.required ?? [];

        if (this.collectionName === AngularConfig.defaultAngularCollection) {
            if (this.name === 'module') {
                this.setModuleTypes();
            } else if (this.name === 'component') {
                await this.setComponentTypes();
            }
        }

    }

    private async setComponentTypes(): Promise<void> {

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
        
        this.shortcutTypes = shortcutTypes;

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

    protected filterSelectedOptions(selectedOptionsNames: string[]): Map<string, SchemaDataOptions> {

        const selectedOptions = new Map<string, SchemaDataOptions>();

        selectedOptionsNames.forEach((selectedOptionName) => {
            const option = this.options.get(selectedOptionName);
            if (option) {
                selectedOptions.set(selectedOptionName, option);
            }
        });

        this.requiredOptions.forEach((requiredOptionName) => {

            const requiredOptionData = this.options.get(requiredOptionName);

            /* Filter options with $default values already managed by the CLI */
            if (requiredOptionName !== 'name' && requiredOptionData && !('$default' in requiredOptionData)) {
                selectedOptions.set(requiredOptionName, this.options.get(requiredOptionName) as SchemaDataOptions);
            }

        });

        return selectedOptions;

    }

    private setModuleTypes(): void {

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

        this.shortcutTypes = shortcutTypes;


    }

}
