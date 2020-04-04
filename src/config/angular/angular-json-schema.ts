export type AngularProjectType = 'application' | 'library';

export interface AngularJsonProjectSchema {
    /** Angular projects are `application` by default, but can be `library` too */
    projectType: AngularProjectType;
    /** Main application: empty. Sub-applications/libraries: `<projects-root>/hello` */
    root: string;
    /** Main application: `src`. Sub-applications/libraries: `<projects-root>/hello/src` */
    sourceRoot?: string;
}

/** Description of `angular.json` */
export interface AngularJsonSchema {
    cli?: {
        /**
         * If set, Angular CLI will use this collection by default instead of the official one.
         * For example, it is set to `@ionic/angular-toolkit` in Ionic projects.
         */
        defaultCollection?: string;
    };
    /**
     * List of Angular projects.
     * While it's optional in CLI JSON schema, a workspace folder should have at least one project.
     */
    projects?: {
        /** Name of the project */
        [key: string]: AngularJsonProjectSchema;
    };
}
