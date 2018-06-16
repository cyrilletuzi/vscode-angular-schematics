export class Generate {

    get command(): string {
        return this.commandArgs.join(' ');
    }
    protected commandArgs: string[] = ['ng generate'];
    protected path: string;

    constructor(context: any) {

        this.path = this.getCommandPath(context);

    }

    add(...args: string[]): void {

        this.commandArgs.push(...args);

    }

    addPathAndName(name: string): void {

        this.add(`${this.path}${name}`);

    }

    protected getCommandPath(context: any): string {

        /* Check if there is an Explorer context (command could be launched from Palette too, where there is no context) */
        if ((typeof context === 'object') && ('path' in context)) {
    
            const contextPath = context.path as string;
    
            /** @todo Use angular.json to manage custom root directory or multiple projects in the same workspace */
            if (contextPath.includes('src/app/')) {
    
                /* Normalize Windows path into Linux format */
                const normalizedPath = contextPath.replace(/\\\\/, '/').split('src/app/')[1];
        
                if (normalizedPath.includes('.')) {
        
                    /* If filename, delete filename by removing everything after the last "/" */
                    return normalizedPath.replace(/[^\/]*$/, '');
        
                } else {
        
                    /* If directory, add a trailing "/" */
                    return `${normalizedPath}/`;
        
                }
        
            }
    
        }
    
        return '';
    
    }

}