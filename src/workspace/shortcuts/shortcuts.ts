import * as vscode from 'vscode';

export interface ShortcutType {
    options: Map<string, string | string[]>;
    choice: vscode.QuickPickItem;
}

export type ShortcutsTypes = Map<string, ShortcutType>;

export enum SHORTCUTS_CONFIRMATION_LABEL {
    YES          = `$(check) Confirm`,
    MORE_OPTIONS = `$(gear) Add more options`,
    NO           = `$(close) Cancel`,
}

/* Cache for shortcut confirmation choices */
export const shortcutsConfirmationChoices: vscode.QuickPickItem[] = [{
    label: SHORTCUTS_CONFIRMATION_LABEL.YES,
    description: `Pro-tip: take a minute to check the command above is really what you want`,
}, {
    label: SHORTCUTS_CONFIRMATION_LABEL.MORE_OPTIONS,
    description: `Pro-tip: you can set default values to "schematics" options in angular.json`,
}, {
    label: SHORTCUTS_CONFIRMATION_LABEL.NO
}];
