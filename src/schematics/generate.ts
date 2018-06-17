export interface ExplorerMenuContext {
    path: string;
}

export class Generate {

    get command(): string {

        let optionsArgs: string[] = [];
        this.options.forEach((optionValue, optionName) => {
            optionsArgs.push(`--${optionName} ${optionValue}`);
        });

        const commandArgs = [this.base, this.schema, this.defaultOption, ...optionsArgs];
        return commandArgs.join(' ');

    }
    protected base = 'ng generate';
    protected schema = '';
    protected path = '';
    protected project = '';
    protected defaultOption = '';
    protected options = new Map<string, string>();

    constructor(context?: ExplorerMenuContext) {

        /* Check if there is an Explorer context (command could be launched from Palette too, where there is no context) */
        const contextPath = (typeof context === 'object') && (context !== null) && ('path' in context) ? context.path : '';

        this.path = this.getCommandPath(contextPath);
        this.project = this.getProject(contextPath);

    }

    addSchema(name: string): void {

        this.schema = name;

    }

    addDefaultOption(value: string, withPath = true): void {

        this.defaultOption = withPath ? `${this.path}${value}` : value;

        if (withPath && this.project) {

            this.add('project', this.project);

        }

    }

    add(optionName: string, optionValue: string): void {

        this.options.set(optionName, optionValue);

    }

    protected getProject(contextPath = ''): string {

        const projectMatches = contextPath.match(/projects\/([^\/]+)\/[^\/]+\/app/);

        if (projectMatches) {

            return projectMatches[1];

        }

        return '';

    }

    protected getCommandPath(contextPath = ''): string {

        if (contextPath.match(/[^\/]+\/app\//)) {

            /* Normalize Windows path into Linux format */
            const normalizedPath = contextPath.replace(/\\\\/, '/').split('/app/')[1];
    
            if (normalizedPath.includes('.')) {
    
                /* If filename, delete filename by removing everything after the last "/" */
                return normalizedPath.replace(/[^\/]*$/, '');
    
            } else {
    
                /* If directory, add a trailing "/" */
                return `${normalizedPath}/`;
    
            }
    
        }
    
        return '';
    
    }

}