export interface SchematicCollection {
    schematics: {
        [key: string]: {
            schema: string;
            description: string;
            hidden?: boolean;
        };
    }
}
