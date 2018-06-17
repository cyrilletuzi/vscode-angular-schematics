import { Utils } from './utils';

export class Generate {

    get command(): string {

        let optionsArgs: string[] = [];
        this.options.forEach((optionValue, optionName) => {
            optionsArgs.push(`--${optionName} ${optionValue}`);
        });

        const collection = (this.collection !== Generate.defaultCollection) ? `${this.collection}:` : '';

        const commandArgs = [this.base, `${collection}${this.schema}`, this.defaultOption, ...optionsArgs];
        return commandArgs.join(' ');

    }
    static defaultCollection = '@schematics/angular';
    protected base = 'ng generate';
    protected collection = Generate.defaultCollection;
    protected schema = '';
    protected path = '';
    protected project = '';
    protected defaultOption = '';
    protected options = new Map<string, string>();

    constructor(contextPath = '') {

        this.path = this.getCommandPath(contextPath);
        this.project = this.getProject(contextPath);

    }

    addCollection(name: string): void {

        this.collection = name;

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

            const normalizedPath = Utils.normalizePath(contextPath).split('/app/')[1];
    
            if (normalizedPath.includes('.')) {
    
                /* If filename, delete filename by removing everything after the last "/" */
                return Utils.getDirectoryFromFilename(normalizedPath);
    
            } else {
    
                /* If directory, add a trailing "/" */
                return `${normalizedPath}/`;
    
            }
    
        }
    
        return '';
    
    }

}