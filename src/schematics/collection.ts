import * as vscode from 'vscode';
import { Schema } from './schema';
import { Utils } from './utils';


interface PackageJSON {
    schematics?: string;
}

export interface CollectionDataSchema {
    schema: string;
    description: string;
    hidden?: boolean;
    extends?: string;
}

export interface CollectionData {
    path: string;
    schematics: {
        [key: string]: CollectionDataSchema;
    };
}

export class Collection {

    name: string;
    path = '';
    schemas = new Map<string, CollectionDataSchema>();
    get schemasNames(): string[] {
        return Array.from(this.schemas.keys()).sort();
    }
    static cache = new Map<string, CollectionData>();

    constructor(
        private workspace: vscode.WorkspaceFolder,
        name: string,
    ) {
        this.name = name;
    }

    async load(): Promise<boolean> {

        let collection: CollectionData | null = null;

        const cachedCollection = Collection.cache.get(this.name);

        if (cachedCollection) {

            collection = cachedCollection;

        } else {

            if (Utils.isSchemaLocal(this.name)) {

                collection = await Utils.getSchemaFromLocal<CollectionData>(this.workspace.uri.fsPath, this.name); 

                if (collection) {
                    collection.path = Utils.getDirectoryFromFilename(this.name);
                }
                
            } else {

                const collectionPackage = await Utils.getSchemaFromNodeModules<PackageJSON>(this.workspace.uri.fsPath, this.name, 'package.json');

                if (!collectionPackage || !collectionPackage.schematics) {
                    return false;
                }
    
                collection = await Utils.getSchemaFromNodeModules<CollectionData>(this.workspace.uri.fsPath, this.name, Utils.pathTrimRelative(collectionPackage.schematics));
    
                if (collection) {
                    collection.path = Utils.pathTrimRelative(collectionPackage.schematics);
                }

            }

        }

        if (collection) {

            this.path = collection.path;

            await this.initSchemasMap(collection);

            Collection.cache.set(this.name, collection);

            return true;

        }
        
        return false;

    }

    async createSchema(name: string): Promise<Schema> {

        let collection: Collection = this;

        const schema = this.schemas.get(name) as CollectionDataSchema;

        if (schema.extends) {

            const [parentCollectionName] = schema.extends.split(':');

            collection = new Collection(this.workspace, parentCollectionName);
            await collection.load();

        }

        return new Schema(name, collection);

    }

    async askSchema(): Promise<string | undefined> {

        const choices: vscode.QuickPickItem[] = this.schemasNames
            .map((schemaName) => ({
                label: schemaName,
                description: (this.schemas.get(schemaName) as CollectionDataSchema).description
            }));

        const choice = await vscode.window.showQuickPick(choices, {
            placeHolder: `What do you want to generate?`,
            ignoreFocusOut: true,
        });

        return choice ? choice.label : undefined;

    }

    protected async initSchemasMap(collection: CollectionData): Promise<void> {

        for (let schemaName in collection.schematics) {

            if (collection.schematics.hasOwnProperty(schemaName)
                && !collection.schematics[schemaName].hidden
                && (schemaName !== 'ng-add')) {

                const schema = collection.schematics[schemaName];

                if (schema.extends) {

                    const [parentCollectionName, parentSchemaName] = schema.extends.split(':');

                    const parentCollection = new Collection(this.workspace, parentCollectionName);
                    await parentCollection.load();

                    const parentSchema = Object.assign({}, parentCollection.schemas.get(parentSchemaName) as CollectionDataSchema);
                    parentSchema.extends = schema.extends;

                    this.schemas.set(schemaName, parentSchema);

                } else {

                    this.schemas.set(schemaName, collection.schematics[schemaName]);

                }

            }

        }

    }

}
