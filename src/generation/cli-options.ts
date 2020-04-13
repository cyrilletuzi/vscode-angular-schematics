/** List of options */
export type CliCommandOptions = Map<string, string | string[]>;

/**
 * Format options for the generation command.
 */
export function formatCliCommandOptions(options: CliCommandOptions | [string, string | string[]][]): string {

    /* Format the values. The goal is to be shortest as possible,
     * so the user can see the full command, as VS Code input box has a fixed size */
    return Array.from(options).map(([key, value]) => {

        /* Boolean options are always true by default,
            * ie. `--export` is equivalent to just `--export` */
        if (value === 'true') {
            return `--${key}`;
        }
        /* Some options can have multiple values (eg. `ng g guard --implements CanActivate CanLoad`) */
        else if (Array.isArray(value)) {
            return value.map((valueItem) => `--${key} ${valueItem}`).join(' ');
        }
        /* Otherwise we print the full option (eg. `--changeDetection OnPush`) */
        else {
            return `--${key} ${value}`;
        }
    }).join(' ');

}
