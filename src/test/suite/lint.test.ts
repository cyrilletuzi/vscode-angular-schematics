import * as assert from 'assert';
import { describe, beforeEach, it } from 'mocha';

import { LintConfig } from '../../workspace/angular';

describe('Lint config', () => {

    let lintConfig: LintConfig;

    beforeEach(() => {
        lintConfig = new LintConfig();
    });

    describe('ESLint component suffixes', () => {

        it('with 1 suffix', () => {

            const config = lintConfig['validateEslintConfig']({
                overrides: [
                    {
                        files: [
                            '*.ts'
                        ],
                        rules: {
                            '@angular-eslint/component-class-suffix': [
                                'error',
                                {
                                    suffixes: [
                                        'Page'
                                    ]
                                }
                            ]
                        }
                    }
                ]
            });
            lintConfig['initComponentSuffixes'](config);

            assert.strictEqual(true, lintConfig.hasComponentSuffix('page'));
            assert.strictEqual(true, lintConfig.hasComponentSuffix('Page'));

        });

        it('with 2 suffixes', () => {

            const config = lintConfig['validateEslintConfig']({
                overrides: [
                    {
                        files: [
                            '*.ts'
                        ],
                        rules: {
                            '@angular-eslint/component-class-suffix': [
                                'error',
                                {
                                    suffixes: [
                                        'Component',
                                        'Page'
                                    ]
                                }
                            ]
                        }
                    }
                ]
            });
            lintConfig['initComponentSuffixes'](config);

            assert.strictEqual(true, lintConfig.hasComponentSuffix('page'));
            assert.strictEqual(true, lintConfig.hasComponentSuffix('Page'));
            assert.strictEqual(true, lintConfig.hasComponentSuffix('component'));
            assert.strictEqual(true, lintConfig.hasComponentSuffix('Component'));
            assert.strictEqual(false, lintConfig.hasComponentSuffix('Elmo'));
            assert.strictEqual(false, lintConfig.hasComponentSuffix('elmo'));

        });

        it('with no config', () => {

            const config = lintConfig['validateEslintConfig'](undefined);
            lintConfig['initComponentSuffixes'](config);

            assert.strictEqual(false, lintConfig.hasComponentSuffix('page'));

        });

        it('with no suffix rule', () => {

            const config = lintConfig['validateEslintConfig']({
                overrides: [
                    {
                        files: [
                            '*.ts'
                        ],
                        rules: {
                            'no-console': 'error'
                        }
                    }
                ]
            });
            lintConfig['initComponentSuffixes'](config);

            assert.strictEqual(false, lintConfig.hasComponentSuffix('page'));

        });

        it('with string rule', () => {

            const config = lintConfig['validateEslintConfig']({
                overrides: [
                    {
                        files: [
                            '*.ts'
                        ],
                        rules: {
                            '@angular-eslint/component-class-suffix': 'error'
                        }
                    }
                ]
            });
            lintConfig['initComponentSuffixes'](config);

            assert.strictEqual(false, lintConfig.hasComponentSuffix('page'));

        });

        it('with array rule but no defined suffixes', () => {

            const config = lintConfig['validateEslintConfig']({
                overrides: [
                    {
                        files: [
                            '*.ts'
                        ],
                        rules: {
                            '@angular-eslint/component-class-suffix': [
                                'error'
                            ]
                        }
                    }
                ]
            });
            lintConfig['initComponentSuffixes'](config);

            assert.strictEqual(false, lintConfig.hasComponentSuffix('page'));

        });

        it('with multiple overrides', () => {

            const config = lintConfig['validateEslintConfig']({
                overrides: [
                    {
                        files: [
                            '*.ts'
                        ],
                        rules: {
                            '@angular-eslint/component-class-suffix': [
                                'error',
                                {
                                    suffixes: [
                                        'Component',
                                        'Page'
                                    ]
                                }
                            ]
                        }
                    },
                    {
                        files: [
                            '*.html'
                        ],
                        rules: {}
                    }
                ]
            });
            lintConfig['initComponentSuffixes'](config);

            assert.strictEqual(true, lintConfig.hasComponentSuffix('page'));
            assert.strictEqual(true, lintConfig.hasComponentSuffix('Page'));

        });

        it('with rule in wrong override', () => {

            const config = lintConfig['validateEslintConfig']({
                overrides: [
                    {
                        files: [
                            '*.html'
                        ],
                        rules: {
                            '@angular-eslint/component-class-suffix': [
                                'error',
                                {
                                    suffixes: [
                                        'Component',
                                        'Page'
                                    ]
                                }
                            ]
                        }
                    }
                ]
            });
            lintConfig['initComponentSuffixes'](config);

            assert.strictEqual(false, lintConfig.hasComponentSuffix('page'));
            assert.strictEqual(false, lintConfig.hasComponentSuffix('Page'));

        });

        it('with string override', () => {

            const config = lintConfig['validateEslintConfig']({
                overrides: [
                    {
                        files: '*.ts',
                        rules: {
                            '@angular-eslint/component-class-suffix': [
                                'error',
                                {
                                    suffixes: [
                                        'Component',
                                        'Page'
                                    ]
                                }
                            ]
                        }
                    }
                ]
            });
            lintConfig['initComponentSuffixes'](config);

            assert.strictEqual(true, lintConfig.hasComponentSuffix('page'));
            assert.strictEqual(true, lintConfig.hasComponentSuffix('Page'));

        });

    });

    describe('TSLint component suffixes', () => {

        it('with 1 suffix', () => {

            const config = lintConfig['validateTslintConfig']({
                rules: {
                    'component-class-suffix': [true, 'Page']
                }
            });
            lintConfig['initComponentSuffixes'](config);

            assert.strictEqual(true, lintConfig.hasComponentSuffix('page'));
            assert.strictEqual(true, lintConfig.hasComponentSuffix('Page'));

        });

        it('with 2 suffixes', () => {

            const config = lintConfig['validateTslintConfig']({
                rules: {
                    'component-class-suffix': [true, 'Component', 'Page']
                }
            });
            lintConfig['initComponentSuffixes'](config);

            assert.strictEqual(true, lintConfig.hasComponentSuffix('page'));
            assert.strictEqual(true, lintConfig.hasComponentSuffix('Page'));
            assert.strictEqual(true, lintConfig.hasComponentSuffix('component'));
            assert.strictEqual(true, lintConfig.hasComponentSuffix('Component'));
            assert.strictEqual(false, lintConfig.hasComponentSuffix('Elmo'));
            assert.strictEqual(false, lintConfig.hasComponentSuffix('elmo'));

        });

        it('with no config', () => {

            const config = lintConfig['validateTslintConfig'](undefined);
            lintConfig['initComponentSuffixes'](config);

            assert.strictEqual(false, lintConfig.hasComponentSuffix('page'));

        });

        it('with no suffix rule', () => {

            const config = lintConfig['validateTslintConfig']({
                rules: {
                    'no-console': true
                }
            });
            lintConfig['initComponentSuffixes'](config);

            assert.strictEqual(false, lintConfig.hasComponentSuffix('page'));

        });

        it('with boolean rule', () => {

            const config = lintConfig['validateTslintConfig']({
                rules: {
                    'component-class-suffix': true
                }
            });
            lintConfig['initComponentSuffixes'](config);

            assert.strictEqual(false, lintConfig.hasComponentSuffix('page'));

        });

        it('with array rule but no suffix', () => {

            const config = lintConfig['validateTslintConfig']({
                rules: {
                    'component-class-suffix': [true]
                }
            });
            lintConfig['initComponentSuffixes'](config);

            assert.strictEqual(false, lintConfig.hasComponentSuffix('page'));

        });

    });

});
