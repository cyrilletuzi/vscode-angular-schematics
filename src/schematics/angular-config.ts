import * as path from 'path';
import { Utils } from './utils';

export interface AngularConfigSchema {
    cli?: {
        defaultCollection?: string;
        schematics?: {
            defaultCollection?: string;
        };
    };
}

export class AngularConfig {

    static configPath = 'angular.json';
    static cliCollection = '@schematics/angular';

    private static config: AngularConfigSchema | null = null;

    static async getConfig(cwd: string): Promise<AngularConfigSchema | null> {

        const configPath = path.join(cwd, this.configPath);

        if (!this.config && await Utils.existsAsync(configPath)) {

            return await Utils.parseJSONFile<AngularConfigSchema>(configPath);

        }

        return null;

    }

    static async getDefaultCollection(cwd: string): Promise<string> {

        const angularConfig = await this.getConfig(cwd);

        if (angularConfig && angularConfig.cli) {

            if (angularConfig.cli.defaultCollection) {
                return angularConfig.cli.defaultCollection;
            } else if (angularConfig.cli.schematics && angularConfig.cli.schematics.defaultCollection) {
                return angularConfig.cli.schematics.defaultCollection;
            }

        }

        return this.cliCollection;

    }

}