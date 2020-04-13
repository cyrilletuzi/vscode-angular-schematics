import * as vscode from 'vscode';
import * as assert from 'assert';
import { describe, before, it } from 'mocha';

import { WorkspaceFolderConfig } from '../../workspace';
import { defaultAngularCollection } from '../../defaults';

describe('Real workspace folders', () => {

    describe('Defaults', () => {

        let workspaceFolder: WorkspaceFolderConfig;
        const rootProjectName = 'defaults';

        before(async () => {

            workspaceFolder = new WorkspaceFolderConfig(vscode.workspace.workspaceFolders![0]);

            await workspaceFolder.init();

        });

        it('TSLint component suffixes', () => {

            assert.strictEqual(false, workspaceFolder['hasComponentSuffix'](rootProjectName, 'Page'));

        });

        it('Angular default collections', () => {

            assert.strictEqual(defaultAngularCollection, workspaceFolder.getDefaultUserCollection());
            assert.deepEqual([defaultAngularCollection], workspaceFolder.getDefaultCollections());

        });

        it('Angular schematics defaults', () => {

            assert.strictEqual(undefined, workspaceFolder.getSchematicsOptionDefaultValue(rootProjectName, `${defaultAngularCollection}:component`, 'flat'));

        });

    });

    describe('Customized', () => {

        let workspaceFolder: WorkspaceFolderConfig;
        const ionicCollection = '@ionic/angular-toolkit';
        const rootProjectName = 'customized';

        before(async () => {

            workspaceFolder = new WorkspaceFolderConfig(vscode.workspace.workspaceFolders![1]);

            await workspaceFolder.init();

        });

        it('TSLint component suffixes', async () => {

            assert.strictEqual(true, workspaceFolder['hasComponentSuffix'](rootProjectName, 'Page'));
            assert.strictEqual(true, workspaceFolder['hasComponentSuffix'](rootProjectName, 'Component'));
            assert.strictEqual(false, workspaceFolder['hasComponentSuffix'](rootProjectName, 'Elmo'));

        });

        it('Angular default collections', () => {

            assert.strictEqual(ionicCollection, workspaceFolder.getDefaultUserCollection());
            assert.deepEqual([ionicCollection, defaultAngularCollection], workspaceFolder.getDefaultCollections());

        });

        it('Angular schematics defaults', () => {

            assert.strictEqual(true, workspaceFolder.getSchematicsOptionDefaultValue(rootProjectName, `${defaultAngularCollection}:component`, 'flat'));

        });

    }); 

});
