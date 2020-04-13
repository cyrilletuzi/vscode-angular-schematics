import * as assert from 'assert';
import { describe, beforeEach, it } from 'mocha';

import { defaultAngularCollection } from '../../defaults';
import { AngularConfig } from '../../workspace/angular';

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

});
