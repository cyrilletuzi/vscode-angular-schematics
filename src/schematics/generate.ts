export interface ExplorerMenuContext {
    path: string;
}

export class Generate {

    get command(): string {
        return this.commandArgs.join(' ');
    }
    protected commandArgs: string[] = ['ng generate'];
    protected path = '';
    protected project = '';

    constructor(context?: ExplorerMenuContext) {

        this.path = this.getCommandPath(context);
        this.project = this.getProject(context);

    }

    add(...args: string[]): void {

        this.commandArgs.push(...args);

    }

    addPathAndName(name: string): void {

        this.add(`${this.path}${name}`);

        if (this.project) {

            this.add(`--project ${this.project}`);

        }

    }

    protected getContextPath(context?: ExplorerMenuContext): string {

        /* Check if there is an Explorer context (command could be launched from Palette too, where there is no context) */
        if ((typeof context === 'object') && ('path' in context)) {

            return context.path;

        }

        return '';

    }

    protected getProject(context?: ExplorerMenuContext): string {

        const contextPath = this.getContextPath(context);

        const projectMatches = contextPath.match(/projects\/([^\/]+)\/[^\/]+\/app/);

        if (projectMatches) {

            return projectMatches[1];

        }

        return '';

    }

    protected getCommandPath(context?: ExplorerMenuContext): string {

        const contextPath = this.getContextPath(context);

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