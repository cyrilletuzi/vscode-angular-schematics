export class JsonValidator {

    static boolean(value: unknown): boolean | undefined {

        if (typeof value === 'boolean') {
            return value;
        }

        return undefined;

    }

    static number(value: unknown): number | undefined {

        if (typeof value === 'number') {
            return value;
        }

        return undefined;

    }

    static string(value: unknown): string | undefined {

        if (typeof value === 'string') {
            return value;
        }

        return undefined;

    }

    static array(value: unknown, type: 'string'): string[] | undefined;
    static array(value: unknown, type?: 'string'): unknown[] | undefined;
    static array(value: unknown, type?: 'string'): unknown[] | undefined {

        if (Array.isArray(value)) {

            if (!type || (value.length === value.filter((item) => typeof item === type).length)) {
                return value;
            }

        }

        return undefined;

    }

    static object(value: unknown): { [key: string]: unknown; } | undefined {

        if ((typeof value === 'object') && (value !== null)) {
            return value as { [key: string]: unknown; };
        }

        return undefined;

    }

}
