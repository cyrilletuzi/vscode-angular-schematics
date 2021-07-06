import * as vscode from 'vscode';
import { Utils } from 'vscode-uri';

import { FileSystem, JsonValidator } from '../../utils';

/**
 * Try to find a collection package's fs path, or `undefined`
 */
export async function findCollectionUri(workspaceFolder: vscode.WorkspaceFolder, name: string, { silent = false } = {}): Promise<vscode.Uri | undefined> {

    /* Local schematics */
    if (name.startsWith('.') && name.endsWith('.json')) {

        const uri = vscode.Uri.joinPath(workspaceFolder.uri, name);

        if (!await FileSystem.isReadable(uri, { silent })) {
            return undefined;
        }

        return uri;

    }
    /* Package schematics */
    else {

        const packageJsonUri = await FileSystem.findPackageUri(workspaceFolder, workspaceFolder.uri, name, { silent });

        if (!packageJsonUri) {
            return undefined;
        }

        const packageJsonConfig = await FileSystem.parseJsonFile(packageJsonUri);

        const schematicsPath = JsonValidator.string(JsonValidator.object(packageJsonConfig)?.['schematics']);

        /* `package.json` should have a `schematics` property with relative path to `collection.json` */
        if (!schematicsPath) {
            return undefined;
        }

        const uri = vscode.Uri.joinPath(Utils.dirname(packageJsonUri), schematicsPath);

        if (!await FileSystem.isReadable(uri, { silent })) {
            return undefined;
        }

        return uri;

    }

}
