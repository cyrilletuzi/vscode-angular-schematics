/**
 * Default third-party schematics collections.
 */
export const defaultCollectionsNames: string[] = [
    '@angular/material',
    '@angular/cdk',
    '@ionic/angular-toolkit',
    '@nrwl/angular',
    '@ngrx/schematics',
    '@ngxs/schematics',
    '@nativescript/schematics',
    '@ngx-formly/schematics',
    'primeng-schematics',
    '@ngx-kit/collection',
    '@ngneat/scam',
    'ngx-spec',
    './schematics/collection.json'
];

export interface ComponentType {
    /** Required component type's name, must be unique */
    label: string;
    /** Required list of custom options for this component type, eg. `[['changeDetection', 'OnPush'], ['export', 'true']]` */
    options: [string, string][];
    /** Required package name of the library which uses this component type */
    package: string;
    /** Optional human description of this component type */
    detail?: string;
}

/**
 * Default custom component types.
 * Each type will only be enabled if its `package` is installed.
 * `type` option will only be enabled if the value is authorized as a component suffix in lint configuration
 */
export const defaultComponentTypes: ComponentType[] = [
    {
        label: `Dialog`,
        options: [
            ['type', 'dialog'],
            ['skipSelector', 'true'],
        ],
        package: '@angular/material',
        detail: `Angular Material dialog`,
    },
    {
        label: `Snackbar`,
        options: [
            ['type', 'snackbar'],
            ['skipSelector', 'true'],
        ],
        package: '@angular/material',
        detail: `Angular Material snackbar`,
    },
    {
        label: `Bottomsheet`,
        options: [
            ['type', 'bottomsheet'],
            ['skipSelector', 'true'],
        ],
        package: '@angular/material',
        detail: `Angular Material bottomsheet`,
    },
    {
        label: `Modal`,
        options: [
            ['type', 'modal'],
            ['skipSelector', 'true'],
        ],
        package: '@ionic/angular',
        detail: `Ionic modal`,
    },
    {
        label: `Popover`,
        options: [
            ['type', 'popover'],
            ['skipSelector', 'true'],
        ],
        package: '@ionic/angular',
        detail: `Ionic popover`,
    },
    {
        label: `Dynamic Dialog`,
        options: [
            ['type', 'dialog'],
            ['skipSelector', 'true'],
        ],
        package: 'primeng',
        detail: `PrimeNG dynamic dialog`,
    },
];

export const angularCollectionName = '@schematics/angular';

export const angularConfigFileNames: string[] = [
    'angular.json',
    '.angular.json',
    'angular-cli.json',
    '.angular-cli.json',
];

export const extensionName = 'Angular Schematics';
