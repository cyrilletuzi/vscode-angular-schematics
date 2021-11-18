# Angular Schematics documentation

<br>

## Troubleshooting

The extension should work out of the box in correctly installed Angular CLI projects. If it does not work, it means you must fix your Angular CLI installation. Here is a list of common issues.

<br>

### Command not found

`npm`, `npx`, `yarn`, `pnpm` or `ng` not being recognized is the most common issue, but also the most difficult to explain.

A Terminal uses what we call a *shell*. Problem is: there are many shells possible on all operating systems. For example:
- on Mac: `bash`, `zsh`,...
- on Windows: `cmd.exe`, `PowerShell`, `Git Bash`,...

Your global tools installations (Node, npm, Angular CLI,...) are often tied to the shell used to install them. For example, if you install Angular CLI in a *Windows* terminal using `cmd.exe`, `ng` will be recognized in a *VS Code* terminal if it also uses `cmd.exe`, but maybe not if it uses `PowerShell`.

So the general idea is to **use the same shell everywhere**. In VS Code, you can [configure the default shell](command:workbench.action.terminal.selectDefaultShell), and redo the installation of the missing commands inside the according shell.

Note that after changing the default shell, you need to kill the "Angular Schematics" Terminal or to restart VS Code for the change to take effect.

Another solution: you can reinstall Angular CLI in the *VS Code* terminal directly:
`npm install @angular/cli -g`

<br>

### Permission error on Windows

By default on Windows, VS Code Terminal uses PowerShell, because it's better than the old cmd.exe. But in companies enforcing some security settings, PowerShell can be restricted.

While the ideal solution is to ask your administrator to configure the security settings correctly (a developer cannot work correctly without the right permissions), you can also [change the shell](command:workbench.action.terminal.selectDefaultShell) used by the VS Code Terminal (try cmd.exe for example, which is generally less restricted).

Note that after changing the default shell, you need to kill the "Angular Schematics" Terminal or to restart VS Code for the change to take effect.

<br>

### Requirements

Using outdated versions of tools can cause issues, the minimal requirements are:
- Node >= 12.20
- VS Code >= 1.56
- *all* Angular packages >= 10

<br>

### Missing `angular.json`

Generally, it means the project is not opened correctly: check the "Open Angular folder" step of this walkthrough.

<br>

### Missing dependencies

The extension relies on some Angular CLI subpackages: `@schematics/angular`, `@angular-devkit/core`, `@angular-devkit/schematics`. They are supposed to be automatically installed via the `@angular/cli` package.

If they are missing, try to do a clean reinstallation of your dependencies:
- delete your `node_modules` folder
- run `npm install` in a Terminal
- restart VS Code

<br>

### Workspace trust

Given what this extension does (runtime scripts, file generation,...), the extension is only enabled in [trusted workspaces](https://code.visualstudio.com/docs/editor/workspace-trust).

<br>

### Extension logs

The extension is logging some debug information. You can see the logs: from the VS Code menu > View > Output > select "Angular Schematics" from the dropdown.

<br>
