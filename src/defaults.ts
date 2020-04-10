/**
 * Default third-party schematics collections.
 */
export const defaultCollectionsNames: string[] = [
    '@angular/material',
    '@ionic/angular-toolkit',
    '@ngrx/schematics',
    '@ngxs/schematics',
    '@nativescript/schematics',
    '@nrwl/schematics',
    '@ngx-formly/schematics',
    'primeng-schematics',
    '@ngx-kit/collection',
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
 * `type` option will only be enabled if the value is authorized as a component suffix in `tslint.json`
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
        package: '@angular/material',
        detail: `Ionic modal`,
    },
    {
        label: `Popover`,
        options: [
            ['type', 'popover'],
            ['skipSelector', 'true'],
        ],
        package: '@angular/material',
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

export const defaultAngularCollection = '@schematics/angular';

export const defaultAngularConfigFileNames: string[] = [
    'angular.json',
    '.angular.json',
    'angular-cli.json',
    '.angular-cli.json',
];

export const extensionName = 'Angular Schematics';
