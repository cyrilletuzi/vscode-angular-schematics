import * as vscode from 'vscode';

export class Watchers {

    /** List of all existing watcher */
    private static activeWatchers = new Map<string, vscode.FileSystemWatcher>();

    /**
     * Create a watcher
     */
    static create(fsPath: string, onDidChangeListener: () => void): void {

        /* There should be only one watcher per file */
        if (!this.activeWatchers.has(fsPath)) {

            const watcher = vscode.workspace.createFileSystemWatcher(fsPath);

            this.activeWatchers.set(fsPath, watcher);

            watcher.onDidChange(onDidChangeListener);

        }

    }

    /**
     * Stop all existing watchers
     */
    static disposeAll(): void {

        for (const watcher of this.activeWatchers.values()) {
            watcher.dispose();
        }

    }

}
