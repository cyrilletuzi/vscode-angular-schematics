# Change Log

## [1.8.0] - 2018-09-25

### Feature

- Will now work if your Angular CLI installation is tied to a custom shell (like `zsh`),
provided that your VS Code settings are configured accordingly
(`terminal.integrated.shell.osx` or `terminal.integrated.shell.windows` or `terminal.integrated.shell.linux`)
(fixes [#16](https://github.com/cyrilletuzi/vscode-angular-schematics/issues/16))

## [1.7.0] - 2018-09-22

### Feature

- When using official CLI commands, the generated file will auto open!

## [1.6.2] - 2018-09-06

### Bug fix

- A regression in paths management due to previous performance improvements was breaking Material schematics (fixes [#13](https://github.com/cyrilletuzi/vscode-angular-schematics/issues/13))

## [1.6.0] - 2018-08-29

### Features
- Now a dedicated Angular Schematics view to see all schematics at once (can be hidden with a right-click)
- Support [Material Icon Theme extension](https://marketplace.visualstudio.com/items?itemName=PKief.material-icon-theme) icons in this view.
- When launching commands from Palette or the new view, automatically select the default workspace if there is only one.

## [1.5.0] - 2018-07-26

### Features
- Support extended schematics.
- If a `defaultCollection` is set in `angular.json`, it's now the first choice for quicker use.
- Support `@ionic/angular-schematics` by default.

## [1.4.0] - 2018-07-25

### Feature
- Now auto-detect project and context path for scoped librairies generated with `ng g library @company/somelibrary`.

## [1.3.1] - 2018-07-20

### Bug fix
- Only activate the extension when `angular.json` or `.angular-cli.json` are in the root directory (as it's a requirement of the CLI itself).

## [1.3.0] - 2018-06-29

### Features
- UI to select a component type with predefined options.
- New "Generate a module" command.
- Better UI when auto-detecting context path.

## [1.2.0] - 2018-06-24

### Feature
- Support for Angular 5 / CLI 1.7 projects.

## [1.1.0] - 2018-06-22

### Feature
- Support `@nrwl/schematics` and `@nstudio/schematics` by default.

## [1.0.1] - 2018-06-22

### Bug fix
- Now auto-detect project and context path for librairies generated with `ng g library`.

## [1.0.0] - 2018-06-22

### Feature
- Stable release.

## [0.6.0] - 2018-06-21

### Feature
- Support multi-workspaces projects.

## [0.4.0] - 2018-06-17

### Feature
- Support `@angular/material` and `@ngrx/schematics` by default.

## [0.3.0] - 2018-06-17

### Feature
- Support all other schematics via `ngschematics.schematics` setting.

## [0.1.0] - 2018-06-16

### Feature
- Command in Palette and Explorer context menu to generate from any official CLI schematics.

## [0.0.1] - 2018-06-16

### Features
- Command in Palette and Explorer context menu to generate a simple component.
- Command in Palette and Explorer context menu to generate a simple service.
