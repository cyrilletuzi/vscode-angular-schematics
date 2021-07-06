import * as vscode from 'vscode';
import { Utils } from 'vscode-uri';

import { FileSystem, Output, JsonValidator } from '../../utils';

import { Schematic } from './schematic';
import { CollectionJsonSchema, CollectionSchematicJsonSchema } from './json-schemas';
import { findCollectionUri } from './find-collection';

/** Configuration needed to load a schematic */
interface SchematicConfig {
    name: string;
    collectionName: string;
    description?: string;
    uri?: vscode.Uri;
    collectionUri?: vscode.Uri;
}

export class Collection {

    schematicsChoices: vscode.QuickPickItem[] = [];
    private name: string;
    private schematics = new Map<string, Schematic | undefined>();

    constructor(name: string) {
        this.name = name;
    }

    /**
     * Load the collection.
     * **Must** be called after each `new Collection()`
     * (delegated because `async` is not possible on a constructor).
     */
    async init(workspaceFolder: vscode.WorkspaceFolder, uri: vscode.Uri): Promise<vscode.FileSystemWatcher | undefined> {

        const config = this.validateConfig(await FileSystem.parseJsonFile(uri));

        await this.setSchematics(workspaceFolder, config, uri);

        /* Only watch local schematics */
        if (!uri.path.includes('node_modules') && (uri.scheme === 'file')) {
            return vscode.workspace.createFileSystemWatcher(uri.fsPath);
        }

        return undefined;

    }

    /**
     * Only load the collection's schematics' names (used for sub-collections only).
     */
    async initSchematicsNames(uri: vscode.Uri): Promise<string[]> {

        const rawConfig = await FileSystem.parseJsonFile(uri);

        return Object.keys(JsonValidator.object(JsonValidator.object(rawConfig)?.['schematics']) ?? {});

    }

    /**
     * Get collection's name
     */
    getName(): string {
        return this.name;
    }

    /**
     * Get all collection's schematics' names
     */
    getSchematicsNames(): string[] {
        return Array.from(this.schematics.keys()).sort();
    }

    /**
     * Get a schematic from cache, or load it.
     */
    getSchematic(name: string): Schematic | undefined {

        return this.schematics.get(name);

    }

    /**
     * Get full schematic name (eg. `@schematics/angular:component`)
     */
    private getFullSchematicName(name: string): string {
        return `${this.name}:${name}`;
    }

    /**
     * Validate collection.json
     */
    private validateConfig(config: unknown): CollectionJsonSchema {

        const configObject = JsonValidator.object(config);

        /* Validate `extends` property */
        const rootExtendsString = JsonValidator.string(configObject?.['extends']);

        const rootExtends = JsonValidator.array(configObject?.['extends'], 'string')
                         ?? (rootExtendsString ? [rootExtendsString] : [])
                         ?? [];

        /* Validate `schematics` property */
        const schematics = new Map(Object.entries(JsonValidator.object(configObject?.['schematics']) ?? {})
            .map(([name, rawConfig]) => {

                const config = JsonValidator.object(rawConfig);

                return [name, {
                    schema: JsonValidator.string(config?.['schema']),
                    description: JsonValidator.string(config?.['description']),
                    hidden: JsonValidator.boolean(config?.['hidden']),
                    private: JsonValidator.boolean(config?.['private']),
                    extends: JsonValidator.string(config?.['extends']),
                }] as [string, CollectionSchematicJsonSchema];

            })
            .filter(([name, config]) => {
                if (!config.schema && !config?.extends) {
                    Output.logWarning(`"${this.name}:${name}" schematic does not have a "schema" string property, so it is dropped.`);
                    return false;
                }
                return true;
            }));

        if (schematics.size === 0) {
            throw new Error(`No schematic found for "${this.name}" collection, so it is dropped.`);
        }

        return {
            extends: rootExtends,
            schematics,
        };

    }

    /**
     * Set all schematics' configuration of the collection.
     */
    private async setSchematics(workspaceFolder: vscode.WorkspaceFolder, config: CollectionJsonSchema, uri: vscode.Uri): Promise<void> {

        /* Start from scratch as the function can be called again via watcher */
        this.schematics.clear();
        this.schematicsChoices = [];

        const allSchematics = new Map<string, CollectionSchematicJsonSchema & { collectionUri?: vscode.Uri }>();
        const extendedSchematicDescription = `Schematic inherited from`;

        /* A collection can extend other ones */
        for (const parentCollectionName of config.extends) {

            /* Avoid infinite recursion */
            if (parentCollectionName !== this.name) {

                const parentCollection = new Collection(parentCollectionName);
                const parentCollectionUri = await findCollectionUri(workspaceFolder, parentCollectionName);

                if (!parentCollectionUri) {
                    Output.logWarning(`"${this.name}" collection wants to inherit from "${parentCollectionName}" collection, but the latest cannot be found.`);
                } else {

                    const parentSchematicsNames = await parentCollection.initSchematicsNames(parentCollectionUri);

                    for (const parentSchematicName of parentSchematicsNames) {
                        allSchematics.set(parentSchematicName, {
                            extends: `${parentCollectionName}:${parentSchematicName}`,
                            collectionUri: parentCollectionUri,
                        });
                    }

                }

            }

        }

        /* Collection's own schematics */
        for (const [schematicName, schematicConfig] of config.schematics) {
            allSchematics.set(schematicName, schematicConfig);
        }

        Output.logInfo(`${allSchematics.size} schematic(s) detected for "${this.name}" collection: ${Array.from(allSchematics).map(([name]) => name).join(', ')}`);

        const schematics = Array.from(allSchematics)
            /* Remove internal schematics */
            .filter(([, config]) => !config.hidden && !config.private)
            /* Remove `ng-add` schematics are they are not relevant for the extension */
            .filter(([name]) => (name !== 'ng-add'));

        if (schematics.length === 0) {
            throw new Error(`No public generation schematic found for "${this.name}" collection, so it is dropped.`);
        }

        Output.logInfo(`${schematics.length} filtered schematic(s) keeped for "${this.name}" collection: ${schematics.map(([name]) => name).join(', ')}`);

        for (const [name, config] of schematics) {

            const schematicFullName = this.getFullSchematicName(name);

            Output.logInfo(`Loading "${schematicFullName}" schematic`);

            let schematicConfig: SchematicConfig | undefined = undefined;

            /* Some collection extends another one */
            if (config.extends) {

                const [collectionName] = config.extends.split(':');

                if (!collectionName) {
                    Output.logWarning(`"${this.name}" collection's name is invalid.`);
                } else {

                    const collectionUri = config?.collectionUri ?? await findCollectionUri(workspaceFolder, collectionName);

                    if (!collectionUri) {
                        Output.logWarning(`"${this.name}" collection wants to inherit "${name}" schematic from "${config.extends}" collection, but the latest cannot be found.`);
                    } else {

                        schematicConfig = {
                            name,
                            collectionName: this.name,
                            description: `${extendedSchematicDescription} "${collectionName}"`,
                            collectionUri: collectionUri,
                        };

                    }

                }

            } else if (config.schema) {

                const schematicUri = vscode.Uri.joinPath(Utils.dirname(uri), config.schema);

                schematicConfig = {
                    name,
                    collectionName: this.name,
                    description: config.description,
                    uri: schematicUri,
                };

            }

            if (schematicConfig) {

                const schematicInstance = new Schematic(schematicConfig.name, schematicConfig.collectionName);

                try {
                    await schematicInstance.init({
                        uri: schematicConfig.uri,
                        collectionUri: schematicConfig.collectionUri,
                    });
                    this.schematics.set(name, schematicInstance);
                    this.setSchematicChoice(schematicConfig);
                } catch {
                    Output.logError(`"${schematicFullName}" schematic loading failed.`);
                }

            }

        }

        this.schematicsChoices.sort((a, b) => {
            if (a.description && b.description) {
                // Collection's own schematics first, then extended ones
                if ((a.description.startsWith(extendedSchematicDescription)) && (!b.description.startsWith(extendedSchematicDescription))) {
                    return 1;
                } else if ((!a.description.startsWith(extendedSchematicDescription)) && (b.description.startsWith(extendedSchematicDescription))) {
                    return -1;
                }
            }
            // Otherwise, alphabetical sort
            return a.label.localeCompare(b.label);
        });

    }

    /**
     * Add schematic's choice (for caching)
     */
    private setSchematicChoice(schematicConfig: SchematicConfig): void {

        this.schematicsChoices.push({
            label: schematicConfig.name,
            description: schematicConfig.description,
        });

    }

}
