import * as path from 'path';
import * as assert from 'assert';
import { describe, beforeEach, it } from 'mocha';

import { defaultAngularCollection } from '../../defaults';
import { AngularConfig } from '../../workspace/angular';

import { getDefaultsWorkspaceFolder, getCustomizedWorkspaceFolder } from './test-utils';

describe('Angular config', () => {

    describe('Default collections', () => {

        let angularConfig: AngularConfig;
        const ionicCollection = '@ionic/angular-toolkit';

        beforeEach(() => {
            angularConfig = new AngularConfig();
        });

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

        it('with defaults workspace', async () => {

            const workspaceFolder = getDefaultsWorkspaceFolder();
            const angularConfigFsPath = path.join(workspaceFolder.uri.fsPath, 'angular.json');

            await angularConfig.init(workspaceFolder, angularConfigFsPath);
            
            assert.strictEqual(defaultAngularCollection, angularConfig.defaultUserCollection);
            assert.deepEqual([defaultAngularCollection], angularConfig.defaultCollections);

        });

        it('with customized workspace', async () => {

            const workspaceFolder = getCustomizedWorkspaceFolder();
            const angularConfigFsPath = path.join(workspaceFolder.uri.fsPath, 'angular.json');

            await angularConfig.init(workspaceFolder, angularConfigFsPath);
            
            assert.strictEqual(ionicCollection, angularConfig.defaultUserCollection);
            assert.deepEqual([ionicCollection, defaultAngularCollection], angularConfig.defaultCollections);

        });

    }); 

});
