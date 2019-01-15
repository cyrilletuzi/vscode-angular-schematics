import * as vscode from 'vscode';


export class Output {

    static _channel: vscode.OutputChannel | null = null;
    static get channel(): vscode.OutputChannel {
        if (!this._channel) {
            this._channel = vscode.window.createOutputChannel('Angular schematics');
        }
        return this._channel;
    }

    static dispose() {

        if (this._channel) {
            this._channel.dispose();
        }

    }

}
