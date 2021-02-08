import * as path from 'path';

function convertFsPathToPath(pathValue: string): string {

    /* Add a leading slash for Windows paths */
    pathValue = (path.sep === path.win32.sep) ? `${path.sep}${pathValue}` : pathValue;

    return (path.sep !== path.posix.sep) ?
        pathValue.split(path.sep).join(path.posix.sep) :
        pathValue;

}

export const rootProjectName = 'my-app';
export const libProjectName = 'my-lib';
export const subAppProjectName = 'other-app';
export const ionicCollectionName = '@ionic/angular-toolkit';
export const materialCollectionName = '@angular/material';
export const userComponentTypeLabel = `Custom component type`;
export const defaultsWorkspaceFolderFsPath = path.join(__dirname, '..', '..', '..', 'test-workspaces', 'defaults');
export const defaultsWorkspaceFolderPath = convertFsPathToPath(defaultsWorkspaceFolderFsPath);
export const customizedWorkspaceFolderFsPath = path.join(__dirname, '..', '..', '..', 'test-workspaces', 'customized');
export const customizedWorkspaceFolderPath = convertFsPathToPath(customizedWorkspaceFolderFsPath);
export const angularEslintWorkspaceFolderFsPath = path.join(__dirname, '..', '..', '..', 'test-workspaces', 'angulareslint');
export const angularEslintWorkspaceFolderPath = convertFsPathToPath(angularEslintWorkspaceFolderFsPath);
