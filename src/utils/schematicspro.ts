import * as vscode from 'vscode';

export function isSchematicsProActive(): boolean {
    return vscode.extensions.getExtension('cyrilletuzi.schematicspro')?.isActive ?? false;
}
