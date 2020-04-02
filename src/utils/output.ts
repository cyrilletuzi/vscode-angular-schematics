import * as vscode from 'vscode';

export class Output {

    private static readonly channelName = 'Angular schematics';
    private static _channel: vscode.OutputChannel | undefined;

    // TODO: should be private
    /**
     * Get the output channel
     */
    static get channel(): vscode.OutputChannel {

        /* Create the channel just once */
        if (!this._channel) {
            this._channel =  vscode.window.createOutputChannel(this.channelName);
        }

        return this._channel;

    }

    /**
     * Log an info in output channel.
     */
    static logInfo(message: string): void {

        this.channel.appendLine(`[Info - ${(new Date().toTimeString())}] ${message}`);

    }

    /**
     * Log an error in output channel.
     */
    static logError(message: string): void {

        // TODO: check time format
        this.channel.appendLine(`[Error - ${(new Date().toTimeString())}] ${message}`);

    }

    /**
     * Close the output channel.
     */
    static dispose(): void {

        this.channel.dispose();

    }

}
