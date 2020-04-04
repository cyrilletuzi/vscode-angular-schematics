import * as vscode from 'vscode';

import { Output } from './output';

export class Watchers {

    /** List of all existing file watchers */
    private static activeWatchers = new Map<string, vscode.Disposable>();

    /**
     * Create a file watcher
     */
    static watchFile(fsPath: string, onDidChangeListener: () => void): vscode.FileSystemWatcher {

        /* Ensure there is only one watcher per file */
        this.removeWatcher(fsPath);

        const watcher = vscode.workspace.createFileSystemWatcher(fsPath);

        this.activeWatchers.set(fsPath, watcher);

        watcher.onDidChange(() => {
            Output.logInfo(`Reloading "${fsPath}" configuration.`);
            onDidChangeListener();
        });

        return watcher;

    }

    /**
     * Create a Code preferences watcher
     */
    static watchCodePreferences(id: string, onDidChangeListener: () => void): vscode.Disposable {

        /* Ensure there is only one watcher per id */
        this.removeWatcher(id);

        const watcher = vscode.workspace.onDidChangeConfiguration(onDidChangeListener);

        this.activeWatchers.set(id, watcher);

        return watcher;

    }

    /**
     * Remove a watcher.
     */
    private static removeWatcher(id: string): void {

        this.activeWatchers.get(id)?.dispose();
        this.activeWatchers.delete(id);

    }

    /**
     * Stop all existing watchers.
     */
    static disposeAll(): void {

        for (const watcher of this.activeWatchers.values()) {
            watcher.dispose();
        }

    }

}
