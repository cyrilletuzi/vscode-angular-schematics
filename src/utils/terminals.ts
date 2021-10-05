import * as vscode from 'vscode';

import { extensionName } from '../defaults';
import { isSchematicsProActive } from './schematicspro';

export class Terminals {

    private static terminals = new Map<string, vscode.Terminal>();
    private static previousTerminal: vscode.Terminal | undefined;
    private static closeEvent?: vscode.Disposable;

    /**
     * Listen to closing of terminals to keep our list in sync
     */
    static init(): void {

        this.closeEvent = vscode.window.onDidCloseTerminal((terminal) => {

            if (!isSchematicsProActive()) {

                if (terminal.name.startsWith(extensionName)) {
                    const key = terminal.name.substr(terminal.name.indexOf('-') + 2);
                    this.terminals.delete(key);
                }

            } else {

                this.closeEvent?.dispose();

            }

        });

    }

    /**
     * Launch a command in terminal
     */
    static send(workspaceFolder: vscode.WorkspaceFolder, command: string): void {

        /* Memorize current terminal to be able to focus back on it */
        this.previousTerminal = vscode.window.activeTerminal;

        const terminal = this.getTerminal(workspaceFolder);

        /* `true` means the terminal doesn't capture the focus */
        terminal.show(true);

        terminal.sendText(command);

    }

    /**
     * Go back to the previous terminal, if exists, or hide the one used by the extension
     */
    static back(workspaceFolder: vscode.WorkspaceFolder): void {

        if (this.previousTerminal && (vscode.window.terminals.length > this.terminals.size)) {

            this.previousTerminal.show(true);

        } else {

            const terminal = this.getTerminal(workspaceFolder);

            terminal.hide();

        }

    }

    /**
     * Stop all existing terminals.
     */
    static disposeAll(): void {

        this.closeEvent?.dispose();

        for (const terminal of this.terminals.values()) {
            terminal.dispose();
        }

    }

    /**
     * Get the terminal
     */
    private static getTerminal(workspaceFolder: vscode.WorkspaceFolder): vscode.Terminal {

        const name = `${extensionName} - ${workspaceFolder.name}`;

        /* Create the terminal just once */
        if (!this.terminals.has(workspaceFolder.name) || !this.isTerminalExisting(name)) {

            this.terminals.set(workspaceFolder.name, vscode.window.createTerminal({
                name,
                cwd: workspaceFolder.uri,
            }));

        }

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return this.terminals.get(workspaceFolder.name)!;

    }

    /**
     * Checks if the terminal still exists
     */
    private static isTerminalExisting(name: string): boolean {

        return vscode.window.terminals.map((terminal) => terminal.name).includes(name);

    }

}
