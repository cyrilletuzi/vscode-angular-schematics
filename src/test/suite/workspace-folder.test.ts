import * as vscode from 'vscode';
import * as assert from 'assert';
import { describe, before, it } from 'mocha';

import { WorkspaceFolderConfig } from '../../workspace';
import { defaultAngularCollection } from '../../defaults';

describe('Real workspace folders', () => {

    const rootProjectName = 'my-app';

    describe('Defaults', () => {

        let workspaceFolder: WorkspaceFolderConfig;

        before(async () => {

            workspaceFolder = new WorkspaceFolderConfig(vscode.workspace.workspaceFolders![0]);

            await workspaceFolder.init();

        });

        it('Angular default collections', () => {

            assert.strictEqual(defaultAngularCollection, workspaceFolder.getDefaultUserCollection());
            assert.deepEqual([defaultAngularCollection], workspaceFolder.getDefaultCollections());

        });

        it('Angular projects', () => {

            assert.strictEqual(1, workspaceFolder.getAngularProjects().size);

            const rootProject = workspaceFolder.getAngularProject(rootProjectName);

            assert.strictEqual('application', rootProject?.getType());
            assert.strictEqual('', rootProject?.getRootPath());
            assert.strictEqual('src', rootProject?.getSourcePath());
            assert.strictEqual('src/app', rootProject?.getAppOrLibPath());
            assert.strictEqual(true, workspaceFolder.isRootAngularProject(rootProjectName));

        });

        it('Angular schematics defaults', () => {

            assert.strictEqual(undefined, workspaceFolder.getSchematicsOptionDefaultValue(rootProjectName, `${defaultAngularCollection}:component`, 'flat'));

        });

        it('TSLint component suffixes', () => {

            assert.strictEqual(false, workspaceFolder.hasComponentSuffix(rootProjectName, 'Page'));

        });

        it('Modules types', () => {

            assert.strictEqual(3, workspaceFolder.getModuleTypes().size);

        });

    });

    describe('Customized', () => {

        let workspaceFolder: WorkspaceFolderConfig;
        const libProjectName = 'my-lib';
        const subAppProjectName = 'other-app';
        const ionicCollection = '@ionic/angular-toolkit';

        before(async () => {

            workspaceFolder = new WorkspaceFolderConfig(vscode.workspace.workspaceFolders![1]);

            await workspaceFolder.init();

        });

        it('Angular default collections', () => {

            assert.strictEqual(ionicCollection, workspaceFolder.getDefaultUserCollection());
            assert.deepEqual([ionicCollection, defaultAngularCollection], workspaceFolder.getDefaultCollections());

        });

        it('Angular projects', () => {

            assert.strictEqual(3, workspaceFolder.getAngularProjects().size);

            const rootProject = workspaceFolder.getAngularProject(rootProjectName);

            assert.strictEqual('application', rootProject?.getType());
            assert.strictEqual('', rootProject?.getRootPath());
            assert.strictEqual('src', rootProject?.getSourcePath());
            assert.strictEqual('src/app', rootProject?.getAppOrLibPath());
            assert.strictEqual(true, workspaceFolder.isRootAngularProject(rootProjectName));

            const libProject = workspaceFolder.getAngularProject(libProjectName);

            assert.strictEqual('library', libProject?.getType());
            assert.strictEqual('projects/my-lib', libProject?.getRootPath());
            assert.strictEqual('projects/my-lib/src', libProject?.getSourcePath());
            assert.strictEqual('projects/my-lib/src/lib', libProject?.getAppOrLibPath());
            assert.strictEqual(false, workspaceFolder.isRootAngularProject(libProjectName));

            const subAppProject = workspaceFolder.getAngularProject(subAppProjectName);

            assert.strictEqual('application', subAppProject?.getType());
            assert.strictEqual('projects/other-app', subAppProject?.getRootPath());
            assert.strictEqual('projects/other-app/src', subAppProject?.getSourcePath());
            assert.strictEqual('projects/other-app/src/app', subAppProject?.getAppOrLibPath());
            assert.strictEqual(false, workspaceFolder.isRootAngularProject(subAppProjectName));

        });

        it('Angular schematics defaults', () => {

            assert.strictEqual(true, workspaceFolder.getSchematicsOptionDefaultValue(rootProjectName, `${defaultAngularCollection}:component`, 'flat'));

            assert.strictEqual(true, workspaceFolder.getSchematicsOptionDefaultValue(libProjectName, `${defaultAngularCollection}:component`, 'flat'));

            assert.strictEqual(false, workspaceFolder.getSchematicsOptionDefaultValue(subAppProjectName, `${defaultAngularCollection}:component`, 'flat'));

        });

        it('TSLint component suffixes', async () => {

            assert.strictEqual(true, workspaceFolder.hasComponentSuffix(rootProjectName, 'Component'));
            assert.strictEqual(true, workspaceFolder.hasComponentSuffix(rootProjectName, 'Page'));
            assert.strictEqual(false, workspaceFolder.hasComponentSuffix(rootProjectName, 'Dialog'));

            assert.strictEqual(true, workspaceFolder.hasComponentSuffix(libProjectName, 'Component'));
            assert.strictEqual(true, workspaceFolder.hasComponentSuffix(libProjectName, 'Page'));
            assert.strictEqual(false, workspaceFolder.hasComponentSuffix(libProjectName, 'Dialog'));

            assert.strictEqual(true, workspaceFolder.hasComponentSuffix(subAppProjectName, 'Component'));
            assert.strictEqual(false, workspaceFolder.hasComponentSuffix(subAppProjectName, 'Page'));
            assert.strictEqual(true, workspaceFolder.hasComponentSuffix(subAppProjectName, 'Dialog'));

        });

        it('Modules types', () => {

            assert.strictEqual(3, workspaceFolder.getModuleTypes().size);

        });

    }); 

});
