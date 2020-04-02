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
    '@nstudio/schematics',
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
    /** Required description of this component type's options, eg. `--change-detection OnPush --export` */
    description: string;
    /** Optional human description of this component type */
    detail?: string;
    /** Optional corresponding suffix in tslint.json which, if existing, will be automatically added as `--type <suffix>` */
    suffix?: string;
    /** Optional list of package name of libraries which used this component type */
    packages?: string[];
}

/**
 * Default custom component types.
 * Each type will only be enabled if one of these conditions is met:
 * - its `suffix` exists in `tslint.json`
 * - one of its `packages` is installed
 */
export const defaultComponentTypes: ComponentType[] = [
    {
        label: `Dialog`,
        options: [
            ['entryComponent', 'true'],
            ['skipSelector', 'true'],
        ],
        description: `--entry-component --skip-selector`,
        suffix: `Dialog`,
        packages: ['@angular/material'],
    },
    {
        label: `Snackbar`,
        options: [
            ['entryComponent', 'true'],
            ['skipSelector', 'true'],
        ],
        description: `--entry-component --skip-selector`,
        suffix: `Snackbar`,
        packages: ['@angular/material'],
    },
    {
        label: `Bottomsheet`,
        options: [
            ['entryComponent', 'true'],
            ['skipSelector', 'true'],
        ],
        description: `--entry-component --skip-selector`,
        suffix: `Bottomsheet`,
        packages: ['@angular/material'],
    },
    {
        label: `Modal`,
        options: [
            ['entryComponent', 'true'],
            ['skipSelector', 'true'],
        ],
        description: `--entry-component --skip-selector`,
        suffix: `Modal`,
        packages: ['@ionic/angular'],
    },
    {
        label: `Popover`,
        options: [
            ['entryComponent', 'true'],
            ['skipSelector', 'true'],
        ],
        description: `--entry-component --skip-selector`,
        suffix: `Popover`,
        packages: ['@ionic/angular'],
    },
    {
        label: `Dynamic Dialog`,
        options: [
            ['entryComponent', 'true'],
            ['skipSelector', 'true'],
        ],
        description: `--entry-component --skip-selector`,
        suffix: `DynamicDialog`,
        packages: ['primeng'],
    },
    {
        label: `Angular Element`,
        options: [
            ['entryComponent', 'true'],
            ['viewEncapsulation', 'ShadowDom'],
        ],
        description: `--entry-component --view-encapsulation ShadowDom`,
        suffix: `Element`,
        detail: 'Interoperable native Web component (does not work in Internet Explorer)',
    },
];
