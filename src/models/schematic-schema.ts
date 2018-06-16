export interface SchematicOptionDetails {
    type: 'string' | 'boolean';
    description: string;
    enum?: string[];
    visible?: boolean;
    default?: string | boolean;
    $default?: {
        $source: 'argv' | 'projectName';
        index?: number;
    };
}

export interface SchematicOption {
    [key: string]: SchematicOptionDetails;
}

export interface SchematicSchema {
    properties: SchematicOption;
    required: string[];
}