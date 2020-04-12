import * as path from 'path';
import * as assert from 'assert';
import { describe, beforeEach, it } from 'mocha';

import { defaultAngularCollection } from '../../defaults';
import { AngularConfig } from '../../workspace/angular';

import { getDefaultsWorkspaceFolder, getCustomizedWorkspaceFolder } from './test-utils';

describe('Angular config', () => {

    let angularConfig: AngularConfig;
    const ionicCollection = '@ionic/angular-toolkit';

    beforeEach(() => {
        angularConfig = new AngularConfig();
    });

    describe('Default collections', () => {

        it('with no config', () => {

            const config = angularConfig['validateConfig']({
                version: 1
            });
            angularConfig['initDefaultCollections'](config);

            assert.strictEqual(defaultAngularCollection, angularConfig.defaultUserCollection);
            assert.deepEqual([defaultAngularCollection], angularConfig.defaultCollections);

        });

        it('with config', () => {

            const config = angularConfig['validateConfig']({
                version: 1,
                cli: {
                    defaultCollection: ionicCollection
                }
            });
            angularConfig['initDefaultCollections'](config);

            assert.strictEqual(ionicCollection, angularConfig.defaultUserCollection);
            assert.deepEqual([ionicCollection, defaultAngularCollection], angularConfig.defaultCollections);

        });

    });

    describe('Schematics defaults', () => {

        it('with no config', () => {

            const config = angularConfig['validateConfig']({
                version: 1
            });
            angularConfig['initSchematicsDefaults'](config);

            assert.strictEqual(undefined, angularConfig.getSchematicsOptionDefaultValue(`${defaultAngularCollection}:component`, 'flat'));

        });

        it('with config', () => {

            const config = angularConfig['validateConfig']({
                version: 1,
                schematics: {
                    [`${defaultAngularCollection}:component`]: {
                        flat: true
                    }
                }
            });
            angularConfig['initSchematicsDefaults'](config);

            assert.strictEqual(true, angularConfig.getSchematicsOptionDefaultValue(`${defaultAngularCollection}:component`, 'flat'));

        });

    });

    describe('with actual workspaces', () => {

        it('defaults', async () => {

            const workspaceFolder = getDefaultsWorkspaceFolder();
            const angularConfigFsPath = path.join(workspaceFolder.uri.fsPath, 'angular.json');

            await angularConfig.init(workspaceFolder, angularConfigFsPath);
            
            assert.strictEqual(defaultAngularCollection, angularConfig.defaultUserCollection);
            assert.deepEqual([defaultAngularCollection], angularConfig.defaultCollections);

            assert.strictEqual(undefined, angularConfig.getSchematicsOptionDefaultValue(`${defaultAngularCollection}:component`, 'flat'));

        });

        it('customized', async () => {

            const workspaceFolder = getCustomizedWorkspaceFolder();
            const angularConfigFsPath = path.join(workspaceFolder.uri.fsPath, 'angular.json');

            await angularConfig.init(workspaceFolder, angularConfigFsPath);
            
            assert.strictEqual(ionicCollection, angularConfig.defaultUserCollection);
            assert.deepEqual([ionicCollection, defaultAngularCollection], angularConfig.defaultCollections);

            assert.strictEqual(true, angularConfig.getSchematicsOptionDefaultValue(`${defaultAngularCollection}:component`, 'flat'));

        });

    });

});
