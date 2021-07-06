import * as vscode from 'vscode';

import { Workspace } from '../workspace';
import { Collection } from '../workspace/schematics';

export class SchematicsTreeDataProvider implements vscode.TreeDataProvider<vscode.TreeItem> {

    private iconPath?: vscode.Uri;
    private collections = new Map<string, Collection>();

    constructor() {

        const schematicsExtension = vscode.extensions.getExtension('cyrilletuzi.angular-schematics') as vscode.Extension<unknown>;

        this.iconPath = vscode.Uri.joinPath(schematicsExtension.extensionUri, 'angular.svg');

    }

    getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: vscode.TreeItem | undefined): vscode.TreeItem[] {

        /* Primary level: collection's name */
        if (!element) {

            for (const [, workspaceFolderConfig] of Workspace.folders) {

                for (const [name, collection] of workspaceFolderConfig.collections.list) {

                    /* Avoid duplicates */
                    if (!this.collections.has(name)) {
                        this.collections.set(name, collection);
                    }

                }

            }

            return Array.from(this.collections.keys()).map((collectionName) => new vscode.TreeItem(collectionName, vscode.TreeItemCollapsibleState.Expanded));

        }
        /* Secondary level: schematics's names for each collection */
        else {

            const collection = this.collections.get(element.label as string);

            return collection?.getSchematicsNames()
                .map((schematicName) => {

                    const item = new vscode.TreeItem(schematicName, vscode.TreeItemCollapsibleState.None);

                    item.command = {
                        title: `Generate ${schematicName}`,
                        command: 'ngschematics.generate',
                        arguments: [undefined, { collectionName: collection.getName(), schematicName }]
                    };
                    item.iconPath = this.iconPath;

                    return item;

                }) ?? [];

        }

    }

}
