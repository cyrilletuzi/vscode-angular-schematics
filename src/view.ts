// import * as path from 'path';
// import * as vscode from 'vscode';
// import { Collection } from './schematics/collection';
// import { Collections } from './schematics/collections';
// import { Workspaces, WorkspaceConfig } from './config';
// import { FileSystem } from './utils/file-system';


// export class AngularSchematicsProvider implements vscode.TreeDataProvider<vscode.TreeItem> {

//     private defaultIconPath = '';
//     private materialIconsPath = '';
//     private materialIconsMap = new Map([
//         ['default', 'angular.svg'],
//         ['component', 'angular-component.svg'],
//         ['directive', 'angular-directive.svg'],
//         ['guard', 'angular-guard.svg'],
//         ['pipe', 'angular-pipe.svg'],
//         ['service', 'angular-service.svg'],
//         ['appShell', 'angular.svg'],
//         ['application', 'angular.svg'],
//         ['class', 'angular.svg'],
//         ['enum', 'angular.svg'],
//         ['interface', 'angular.svg'],
//         ['library', 'angular.svg'],
//         ['module', 'angular.svg'],
//         ['serviceWorker', 'angular.svg'],
//         ['universal', 'angular.svg'],
//         ['@ngrx/schematics:action', 'ngrx-actions.svg'],
//         ['@ngrx/schematics:effect', 'ngrx-effects.svg'],
//         ['@ngrx/schematics:entity', 'ngrx-entity.svg'],
//         ['@ngrx/schematics:reducer', 'ngrx-reducer.svg'],
//         ['@ngrx/schematics', 'ngrx-state.svg'],
//         ['@ionic/angular-toolkit', 'ionic.svg'],
//     ]);
//     private materialIconsExisting = new Set<string>();
//     private materialIconsNotExisting = new Set<string>();

//     constructor() {

//         // TODO: schematics could be different in each workspace...

//         const schematicsExtension = vscode.extensions.getExtension('cyrilletuzi.angular-schematics') as vscode.Extension<unknown>;

//         this.defaultIconPath = path.join(schematicsExtension.extensionPath, 'angular.svg');

//         const iconTheme: string | undefined = vscode.workspace.getConfiguration('workbench').get('iconTheme');

//         if (iconTheme === 'material-icon-theme') {

//             const materialExtension = vscode.extensions.getExtension('PKief.material-icon-theme') as vscode.Extension<unknown>;

//             if (materialExtension) {

//                 this.materialIconsPath = path.join(materialExtension.extensionPath, 'icons');

//             }

//         }

//     }

//     getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
//         return element;
//     }

//     async getChildren(element?: vscode.TreeItem | undefined): Promise<vscode.TreeItem[]> {

//         if (!element) {

//             const schematics = new Collections(Workspaces.getFirstWorkspace());

//             await schematics.init();

//             return schematics.getCollectionsNames().map((collection) => new vscode.TreeItem(collection, vscode.TreeItemCollapsibleState.Expanded));

//         } else {

//             const collection = new Collection(element.label as string, Workspaces.getFirstWorkspace()  as Omit<WorkspaceConfig, 'schematics'>);
//             const items: vscode.TreeItem[] = [];

//             try {
//                 await collection.init();
//             } catch {
//                 return [];
//             }

//             for (const schemaName of collection.getSchemasNames()) {
//                 const item = new vscode.TreeItem(schemaName, vscode.TreeItemCollapsibleState.None);
//                 item.command = {
//                     title: `Generate ${schemaName}`,
//                     command: 'ngschematics.generate',
//                     arguments: [undefined, schemaName, collection.getName()]
//                 };
//                 item.iconPath = await this.getIconPath(collection.getName(), schemaName);
//                 items.push(item);
//             }

//             return items;

//         }

//         return [];

//     }

//     private async getIconPath(collectionName: string, schemaName: string): Promise<vscode.Uri> {

//         let iconPath = this.defaultIconPath;

//         if (this.materialIconsPath) {

//             let materialIconPath = '';

//             if (this.materialIconsMap.has(schemaName)) {
//                 materialIconPath = path.join(this.materialIconsPath, this.materialIconsMap.get(schemaName) as string);
//             } else if (this.materialIconsMap.has(`${collectionName}:${schemaName}`)) {
//                 materialIconPath = path.join(this.materialIconsPath, this.materialIconsMap.get(`${collectionName}:${schemaName}`) as string);
//             } else if (this.materialIconsMap.has(collectionName)) {
//                 materialIconPath = path.join(this.materialIconsPath, this.materialIconsMap.get(collectionName) as string);
//             } else {
//                 path.join(this.materialIconsPath, this.materialIconsMap.get('default') as string);
//             }

//             if (materialIconPath) {

//                 if (this.materialIconsExisting.has(materialIconPath)) {
//                     iconPath = materialIconPath;
//                 } else if (!this.materialIconsNotExisting.has(materialIconPath) && await FileSystem.isReadable(materialIconPath)) {
//                     this.materialIconsExisting.add(materialIconPath);
//                     iconPath = materialIconPath;
//                 } else {
//                     this.materialIconsNotExisting.add(materialIconPath);
//                 }
//             }

//         }

//         return vscode.Uri.file(iconPath);

//     }

// }
