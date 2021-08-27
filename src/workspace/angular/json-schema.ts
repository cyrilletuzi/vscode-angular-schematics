export type AngularProjectType = 'application' | 'library';

export interface AngularJsonSchematicsOptionsSchema {
    /** Tells if the file be generated in a subfolder (not flat) or not (flat) */
    flat?: boolean | undefined;
}

/** Key will be the full schematics name (eg.: "@schematics/angular") */
export type AngularJsonSchematicsSchema = Map<string, AngularJsonSchematicsOptionsSchema>;

export interface AngularJsonProjectSchema {
    /** Required project type, Angular projects are `application` by default, but can be `library` too. */
    projectType: AngularProjectType;
    /** Required. Main application: empty. Sub-applications/libraries: `<projects-root>/hello` */
    root: string;
    /** Main application: `src`. Sub-applications/libraries: `<projects-root>/hello/src` */
    sourceRoot?: string | undefined;
    /** Default values for schematics options */
    schematics?: AngularJsonSchematicsSchema;
}

/** Description of `angular.json` */
export interface AngularJsonSchema {
    /** Currently can only be `1` */
    version: number;
    cli?: {
        /**
         * If set, Angular CLI will use this collection by default instead of the official one.
         * For example, it is set to `@ionic/angular-toolkit` in Ionic projects.
         */
        defaultCollection?: string | undefined;
    };
    /** Default values for schematics options */
    schematics: AngularJsonSchematicsSchema;
    /**
     * List of Angular projects.
     * While it's optional in CLI JSON schema, a workspace folder should have at least one project.
     */
    projects: Map<string, AngularJsonProjectSchema>;
}

export interface LintJsonSchema {
    rules: {
        componentClassSuffixes?: string[] | undefined;
    };
}
