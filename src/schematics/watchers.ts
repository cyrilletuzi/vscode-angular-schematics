import * as vscode from 'vscode';

export class Watchers {

    /** List of all existing file watchers */
    private static activeWatchers: vscode.Disposable[] = [];

    /**
     * Create a file watcher
     */
    static watchFile(fsPath: string, onDidChangeListener: () => void): void {

        const watcher = vscode.workspace.createFileSystemWatcher(fsPath);

        this.activeWatchers.push(watcher);

        watcher.onDidChange(onDidChangeListener);

    }

    /**
     * Create a Code preferences watcher
     */
    static watchCodePreferences(onDidChangeListener: () => void): void {

        const watcher = vscode.workspace.onDidChangeConfiguration(onDidChangeListener);

        this.activeWatchers.push(watcher);

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
