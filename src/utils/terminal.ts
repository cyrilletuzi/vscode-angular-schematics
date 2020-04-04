import * as vscode from 'vscode';

export class Terminal {

    private static readonly terminalName = 'Angular Schematics';
    private static _terminal: vscode.Terminal | undefined;

    /**
     * Launch a command in terminal
     */
    static send(command: string): void {

        this.terminal.show();

        this.terminal.sendText(command);

    }

    /**
     * Get the terminal
     */
    private static get terminal(): vscode.Terminal {

        /* Create the terminal just once */
        if (!this._terminal || !this.isTerminalExisting()) {
            this._terminal =  vscode.window.createTerminal(this.terminalName);
        }

        return this._terminal;

    }

    /**
     * Checks if the terminal still exists
     */
    private static isTerminalExisting(): boolean {

        return vscode.window.terminals.map((terminal) => terminal.name).includes(this.terminalName);

    }    

}
