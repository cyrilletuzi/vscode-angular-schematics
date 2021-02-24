import * as vscode from 'vscode';
import * as path from 'path';

import { FileSystem, JsonValidator } from '../../utils';

/**
 * Try to find a collection package's fs path, or `undefined`
 */
export async function findCollectionFsPath(workspaceFolder: vscode.WorkspaceFolder, name: string, { silent = false } = {}): Promise<string | undefined> {

    /* Local schematics */
    if (name.startsWith('.') && name.endsWith('.json')) {

        const fsPath = path.join(workspaceFolder.uri.fsPath, name);

        if (!await FileSystem.isReadable(fsPath, { silent })) {
            return undefined;
        }

        return fsPath;

    }
    /* Package schematics */
    else {

        const packageJsonFsPath = await FileSystem.findPackageFsPath(workspaceFolder, workspaceFolder.uri.fsPath, name, { silent });

        if (!packageJsonFsPath) {
            return undefined;
        }

        const packageJsonConfig = await FileSystem.parseJsonFile(packageJsonFsPath);

        const schematicsPath = JsonValidator.string(JsonValidator.object(packageJsonConfig)?.['schematics']);

        /* `package.json` should have a `schematics` property with relative path to `collection.json` */
        if (!schematicsPath) {
            return undefined;
        }

        const fsPath = path.join(path.dirname(packageJsonFsPath), schematicsPath);

        if (!await FileSystem.isReadable(fsPath, { silent })) {
            return undefined;
        }

        return fsPath;

    }

}
