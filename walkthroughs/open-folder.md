# Angular Schematics documentation

First, remember how to come back to this walkthrough, as opening a new project will hide it: View > Command Palette > search "Documentation" > choose "Angular Schematics: Documentation and tutorial".

<br>

## Open an Angular folder

This extension is only enabled in Angular folders.

For Angular CLI and this extension to work, **the [opened folder](command:vscode.openFolder) must be the root Angular folder**, which means the folder with the `angular.json` file.

You do not have an Angular project yet? Read the [official documentation](https://angular.io/guide/setup-local) to learn how to setup one.

<br>
<br>

### Workspace trust

The first time you open a new project in VS Code, you will be asked if you trust the folder. Say "Yes" to your own projects.

As many others, given what this extension does (runtime scripts, file generation,...), it is only enabled in [trusted workspaces](https://code.visualstudio.com/docs/editor/workspace-trust).

<br>

### Nested projects

If your Angular project is nested in another folder (for example your backend project),
and you want to open all projects in Visual Studio Code, there are several possibilities:
- [VS Code workspace](https://code.visualstudio.com/docs/editor/workspaces): open one folder, and then open the second one with "File > [Add Folder to Workspace](addRootFolder)"
- VS Code windows: open one folder, and then open the second one with "File > [New Window](command:vscode.newWindow)". On Mac, you can enable the `Native Tabs` [VS Code setting](command:workbench.action.openGlobalSettings) so windows appear as tabs instead of separate windows.

<br>
