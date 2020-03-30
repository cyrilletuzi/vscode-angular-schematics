import * as vscode from 'vscode';


export class Output {

    private static readonly channelName = 'Angular schematics';
    private static _channel: vscode.OutputChannel | undefined;

    // TODO: should be private
    static get channel(): vscode.OutputChannel {
        if (!this._channel) {
            this._channel =  vscode.window.createOutputChannel(this.channelName);
        }
        return this._channel;
    }

    static logError(message: string): void {

        // TODO: check time format
        this.channel.appendLine(`[Error - ${(new Date().toTimeString())}] ${message}`);

    }

    static logInfo(message: string): void {

        this.channel.appendLine(message);

    }

    static dispose(): void {

        this.channel.dispose();

    }

}
