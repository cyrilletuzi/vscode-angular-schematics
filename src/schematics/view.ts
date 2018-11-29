import * as vscode from 'vscode';
import * as path from 'path';
import { Schematics } from './schematics';
import { Collection } from './collection';
import { Utils } from './utils';

export class AngularSchematicsProvider implements vscode.TreeDataProvider<vscode.TreeItem> {

    private workspaceRoot = '';
    private defaultIconPath = '';
    private materialIconsPath = '';
    private materialIconsMap = new Map([
        ['default', 'angular.svg'],
        ['component', 'angular-component.svg'],
        ['directive', 'angular-directive.svg'],
        ['guard', 'angular-guard.svg'],
        ['pipe', 'angular-pipe.svg'],
        ['service', 'angular-service.svg'],
        ['appShell', 'angular.svg'],
        ['application', 'angular.svg'],
        ['class', 'angular.svg'],
        ['enum', 'angular.svg'],
        ['interface', 'angular.svg'],
        ['library', 'angular.svg'],
        ['module', 'angular.svg'],
        ['serviceWorker', 'angular.svg'],
        ['universal', 'angular.svg'],
        ['@ngrx/schematics:action', 'ngrx-actions.svg'],
        ['@ngrx/schematics:effect', 'ngrx-effects.svg'],
        ['@ngrx/schematics:entity', 'ngrx-entity.svg'],
        ['@ngrx/schematics:reducer', 'ngrx-reducer.svg'],
        ['@ngrx/schematics', 'ngrx-state.svg'],
        ['@ionic/angular-toolkit', 'ionic.svg'],
    ]);
    private materialIconsExisting = new Set<string>();
    private materialIconsNotExisting = new Set<string>();

    constructor() {

        if (vscode.workspace.workspaceFolders) {

            this.workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;

        }

        const schematicsExtension = vscode.extensions.getExtension('cyrilletuzi.angular-schematics') as vscode.Extension<any>;

        this.defaultIconPath = path.join(schematicsExtension.extensionPath, 'angular.svg');

        const iconTheme: string | undefined = vscode.workspace.getConfiguration('workbench').get('iconTheme');

        if (iconTheme === 'material-icon-theme') {

            const materialExtension = vscode.extensions.getExtension('PKief.material-icon-theme') as vscode.Extension<any>;

            if (materialExtension) {

                this.materialIconsPath = path.join(materialExtension.extensionPath, 'icons');

            }

        }

    }

    getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: vscode.TreeItem | undefined): Promise<vscode.TreeItem[]> {

        if (this.workspaceRoot) {

            if (!element) {

                await Schematics.load(this.workspaceRoot);

                return Array.from(Schematics.collections).map((collection) => new vscode.TreeItem(collection, vscode.TreeItemCollapsibleState.Expanded));

            } else {

                const collection = new Collection(element.label as string);
                const items: vscode.TreeItem[] = [];

                if (await collection.load(this.workspaceRoot)) {

                    for (const schemaName of collection.schemasNames) {
                        const item = new vscode.TreeItem(schemaName, vscode.TreeItemCollapsibleState.None);
                        item.command = {
                            title: `Generate ${schemaName}`,
                            command: 'ngschematics.generate',
                            arguments: [null, { collectionName: collection.name, schemaName }]
                        };
                        item.iconPath = await this.getIconPath(collection.name, schemaName);
                        items.push(item);
                    }

                    return items;

                }

            }

        }

        return [];

    }

    private async getIconPath(collectionName: string, schemaName: string): Promise<vscode.Uri> {

        let iconPath = this.defaultIconPath;

        if (this.materialIconsPath) {

            let materialIconPath = '';

            if (this.materialIconsMap.has(schemaName)) {
                materialIconPath = path.join(this.materialIconsPath, this.materialIconsMap.get(schemaName) as string);
            } else if (this.materialIconsMap.has(`${collectionName}:${schemaName}`)) {
                materialIconPath = path.join(this.materialIconsPath, this.materialIconsMap.get(`${collectionName}:${schemaName}`) as string);
            } else if (this.materialIconsMap.has(collectionName)) {
                materialIconPath = path.join(this.materialIconsPath, this.materialIconsMap.get(collectionName) as string);
            } else {
                path.join(this.materialIconsPath, this.materialIconsMap.get('default') as string);
            }

            if (materialIconPath) {

                if (this.materialIconsExisting.has(materialIconPath)) {
                    iconPath = materialIconPath;
                } else if (!this.materialIconsNotExisting.has(materialIconPath) && await Utils.existsAsync(materialIconPath)) {
                    this.materialIconsExisting.add(materialIconPath);
                    iconPath = materialIconPath;
                } else {
                    this.materialIconsNotExisting.add(materialIconPath);
                }
            }

        }

        return vscode.Uri.file(iconPath);

    }

}
