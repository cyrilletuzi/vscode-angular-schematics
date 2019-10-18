import * as vscode from 'vscode';


interface Preferences {
    schematics?: string[];
    exportedComponentTypes?: string[];
    pureComponentTypes?: string[];
    pageComponentTypes?: string[];
    runtimeComponentTypes?: string[];
    elementComponentTypes?: string[];
}

export class Configuration {

    static get<T extends keyof Preferences>(name: T): Preferences[T] | undefined {

        const userConfiguration = vscode.workspace.getConfiguration().get<Preferences>('ngschematics');

        return userConfiguration && (name in userConfiguration) ? userConfiguration[name] : undefined;

    }    

}