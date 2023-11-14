# Angular Schematics - Troubleshooting

Here is a list of common issues.

<br>

## Requirements

Using outdated versions of tools can cause issues. The extension is tested with the last 2 versions of Visual Studio Code. It may work with previous versions but it is not guaranteed.

<br>

## I do not see "Generate a file" in the context menu

Given what this extension does (runtime scripts, file generation,...), it is only enabled in [trusted workspaces](https://code.visualstudio.com/docs/editor/workspace-trust).

The first time you open a new folder in VS Code, you are asked if you trust the folder. Say "Yes" for your own projects. If you previously said "No" by mistake, you can change it with the "Workspaces: Manage workspace trust" command.

<br>

## I do not see Angular schematics

This extension will only display the schematics and options relevant to your project. It does so by detecting the dependencies (for example `@angular/core`) in `package.json`. It will look into:
- `package.json` at the root of the opened folder
- `package.json` in parent folders of the opened folder (monorepo case)

So your project should be opened at the right level, meaning the root of the opened folder should be where `package.json` and other configuration files are located.

Only if you have a special configuration and nothing else is possible, you can use the configuration helper to force the dependencies detected.

<br>

## The path is wrongly infered

VS Code [combines single folders together](https://code.visualstudio.com/updates/v1_41#_compact-folders-in-explorer) by default. It is annoying with this extension, as clicking on the right directory becomes more confusing.

So you should consider disabling the `Compact Folders` VS Code *workspace* setting.

<br>

## Extension logs

The extension is logging some debug information. You can see the logs: from the VS Code menu > View > Output > select "Angular Schematics - Logs" from the dropdown.

<br>

## Support

If it still does not work, you can ask a question on [GitHub discussions](https://github.com/cyrilletuzi/vscode-angular-schematics/discussions).

<br>
