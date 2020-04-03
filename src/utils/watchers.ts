import * as vscode from 'vscode';

import { Output } from './output';

export class Watchers {

    /** List of all existing file watchers */
    private static activeWatchers: vscode.Disposable[] = [];

    /**
     * Create a file watcher
     */
    static watchFile(fsPath: string, onDidChangeListener: () => void): vscode.FileSystemWatcher {

        const watcher = vscode.workspace.createFileSystemWatcher(fsPath);

        this.activeWatchers.push(watcher);

        watcher.onDidChange(() => {
            Output.logInfo(`Reloading "${fsPath}" configuration.`);
            onDidChangeListener();
        });

        return watcher;

    }

    /**
     * Create a Code preferences watcher
     */
    static watchCodePreferences(onDidChangeListener: () => void): vscode.Disposable {

        const watcher = vscode.workspace.onDidChangeConfiguration(onDidChangeListener);

        this.activeWatchers.push(watcher);

        return watcher;

    }

    /**
     * Stop all existing watchers.
     */
    static disposeAll(): void {

        for (const watcher of this.activeWatchers) {
            watcher.dispose();
        }

    }

}
