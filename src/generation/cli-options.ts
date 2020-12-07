/** List of options */
export type CliCommandOptions = Map<string, string | string[]>;

/**
 * Converts a camelCased string into a dasherized one (eg: `changeDetection` => `change-detection`)
 * @param value camelCased string
 * @returns Dasherized string
 */
export function dasherize(value: string): string {
    return value.replace(/([a-z\d])([A-Z])/g, '$1-$2').toLowerCase();
}

/**
 * Format options for the generation command.
 */
export function formatCliCommandOptions(options: CliCommandOptions | [string, string | string[]][]): string {

    /* Format the values. The goal is to be shortest as possible,
     * so the user can see the full command, as VS Code input box has a fixed size */
    return Array.from(options).map(([camelCasedKey, value]) => {

        const key = dasherize(camelCasedKey);

        /* Boolean options are always true by default,
            * ie. `--export` is equivalent to just `--export` */
        if (value === 'true') {
            return `--${key}`;
        }
        /* Some options can have multiple values (eg. `ng g guard --implements CanActivate CanLoad`) */
        else if (Array.isArray(value)) {
            return value.map((valueItem) => `--${key} ${valueItem}`).join(' ');
        }
        /* Otherwise we print the full option (eg. `--change-detection OnPush`) */
        else {
            return `--${key} ${value}`;
        }
    }).join(' ');

}
