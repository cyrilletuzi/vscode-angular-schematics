import * as vscode from 'vscode';

import { extensionName } from '../defaults';

export class Terminals {

    private static terminals = new Map<string, vscode.Terminal>();

    /**
     * Launch a command in terminal
     */
    static send(workspaceFolder: vscode.WorkspaceFolder, command: string): void {

        const terminal = this.getTerminal(workspaceFolder);

        terminal.show();

        terminal.sendText(command);

    }

    /**
     * Stop all existing terminals.
     */
    static disposeAll(): void {

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
                cwd: workspaceFolder.uri.fsPath,
            }));
        }

        return this.terminals.get(workspaceFolder.name)!;

    }

    /**
     * Checks if the terminal still exists
     */
    private static isTerminalExisting(name: string): boolean {

        return vscode.window.terminals.map((terminal) => terminal.name).includes(name);

    }

}
