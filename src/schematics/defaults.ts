import { ComponentTypes } from './preferences';


/**
 * Default third-party schematics.
 */
export const defaultSchematics: string[] = [
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

/**
 * Default component types.
 */
export const defaultComponentTypes: ComponentTypes = {
    /* Options: `--export` */
    exported: [],
    /* Options: `--change-detection OnPush` */
    pure: ['pure', 'ui', 'presentation', 'presentational', 'dumb'],
    /* Options: `--skip-selector` */
    page: ['page', 'container', 'smart', 'routed', 'route'],
    /* Options: `--entry --skip-selector` */
    runtime: ['dialog', 'snackbar', 'bottomsheet', 'modal', 'popover', 'entry'],
    /* Options: `--entry --view-encapsulation ShadowDom` */
    element: ['element'],
};