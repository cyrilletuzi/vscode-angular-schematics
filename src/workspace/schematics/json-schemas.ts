export interface CollectionSchematicJsonSchema {
    /** Relative path to `schema.json` */
    schema?: string;
    description?: string;
    /** Some schematics are internal for Angular CLI */
    hidden?: boolean;
    /** Some schematics extend another one */
    extends?: string;
}

export interface CollectionJsonSchema {
    /** Key is the schematic's name */
    schematics: Map<string, CollectionSchematicJsonSchema>;
}

export interface SchematicOptionJsonSchema {
    type: 'string' | 'boolean' | 'array';
    description?: string;
    enum?: string[];
    /** Some option are internal to Angular CLI */
    visible?: boolean;
    /** Classic default value */
    default?: string | boolean;
    /** Default value calculated by Angular CLI */
    $default?: {
        /** 
         * Can be from the first argument of command line,
         * or some internals like `projectName` which defaults to defaut project
         */
        $source: 'argv' | 'projectName';
        /** Will be `0` for the first argument of command line */
        index?: number;
    };
    items?: {
        enum?: string[];
    };
    'x-deprecated'?: string;
    /** Some options can have a prompt for Angular CLI interactive mode */
    'x-prompt'?: {
        message?: string;
        multiselect?: boolean;
        /** Deprecated, Angular >= 8.3 uses `items.enum` instead */
        items?: string[];
    };
}

export interface SchematicJsonSchema {
    /** Key is the option's name */
    properties: Map<string, SchematicOptionJsonSchema>;
    /** Some options may be required */
    required?: string[];
}

