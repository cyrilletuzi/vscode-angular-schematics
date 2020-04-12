import * as assert from 'assert';
import { describe, beforeEach, it } from 'mocha';

import { TslintConfig } from '../../workspace/angular';

describe('TSLint', () => {

    describe('Component suffixes', () => {

        let tslintConfig: TslintConfig;

        beforeEach(() => {
            tslintConfig = new TslintConfig();
        });

        it('initializes empty suffixes with no config', () => {

            const config = tslintConfig['validateConfig'](undefined);
            tslintConfig['initComponentSuffixes'](config);

            assert.strictEqual(false, tslintConfig.hasComponentSuffix('page'));

        });

        it('initializes empty suffixes with no component suffixes rule', () => {

            const config = tslintConfig['validateConfig']({
                rules: {
                    'no-console': true,
                }
            });
            tslintConfig['initComponentSuffixes'](config);

            assert.strictEqual(false, tslintConfig.hasComponentSuffix('page'));

        });

        it('initializes empty suffixes from boolean', () => {

            const config = tslintConfig['validateConfig']({
                rules: {
                    'component-class-suffix': true,
                }
            });
            tslintConfig['initComponentSuffixes'](config);

            assert.strictEqual(false, tslintConfig.hasComponentSuffix('page'));

        });

        it('initializes empty suffixes from array with only boolean', () => {

            const config = tslintConfig['validateConfig']({
                rules: {
                    'component-class-suffix': [true],
                }
            });
            tslintConfig['initComponentSuffixes'](config);

            assert.strictEqual(false, tslintConfig.hasComponentSuffix('page'));

        });

        it('initializes empty suffixes from array with 1 suffix', () => {

            const config = tslintConfig['validateConfig']({
                rules: {
                    'component-class-suffix': [true, 'Page'],
                }
            });
            tslintConfig['initComponentSuffixes'](config);

            assert.strictEqual(true, tslintConfig.hasComponentSuffix('page'));
            assert.strictEqual(true, tslintConfig.hasComponentSuffix('Page'));


        });

        it('initializes empty suffixes from array with 2 suffixes', () => {

            const config = tslintConfig['validateConfig']({
                rules: {
                    'component-class-suffix': [true, 'Component', 'Page'],
                }
            });
            tslintConfig['initComponentSuffixes'](config);

            assert.strictEqual(true, tslintConfig.hasComponentSuffix('page'));
            assert.strictEqual(true, tslintConfig.hasComponentSuffix('Page'));
            assert.strictEqual(true, tslintConfig.hasComponentSuffix('component'));
            assert.strictEqual(true, tslintConfig.hasComponentSuffix('Component'));

        });

    }); 

});
