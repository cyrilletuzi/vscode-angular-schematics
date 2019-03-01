# Change Log

## [1.19.0] - 2019-03-01

### Feature

- Default support for these schematics:
  - `@ngxs/schematics`
  - `@nativescript/schematics`
  - `@ngx-formly/schematics`
  - `primeng-schematics`
  - `@ngx-kit/collection`
  - `ngx-spec`

## [1.18.0] - 2019-02-23

### Feature

- Auto-inference of the project now works with custom paths (as long as they are registered in `angular.json`)

## [1.17.0] - 2019-02-16

### Feature

- Use new CLI prompt messages when available

## [1.16.0] - 2019-02-03

### Features

- Support array options, like new `implements` option for guards in Angular CLI 7.3 (fixes [#32](https://github.com/cyrilletuzi/vscode-angular-schematics/issues/32))
- UX: pre-select required and suggested options
- Do not show options already managed by command line args (like `name`)

## [1.13.0] - 2019-02-02

### Feature

- Do not show deprecated options

## [1.12.2] - 2019-01-29

### Bug fix

- Fix an issue ([#19](https://github.com/cyrilletuzi/vscode-angular-schematics/issues/19)) when the project path included `projects`

## [1.12.1] - 2019-01-16

### Bug fix

- Add `./schematics/collection.json` to the default auto-loaded collections

## [1.12.0] - 2019-01-16

### Feature

- Local schematics are now supported, by adding a *relative* path in VS Code preferences
(e.g.: `"ngschematics.schematics": ["./schematics/collection.json"]`)

## [1.11.4] - 2019-01-12

### Bug fix

- Don't require options managed by Angular CLI like `project`
(fixes [#20](https://github.com/cyrilletuzi/vscode-angular-schematics/issues/20))

## [1.11.3] - 2018-12-27

### Dev fix

- Internal update of *dev* dependencies to fix a security issue reported by npm (does *not* concern you).

## [1.11.2] - 2018-12-27

### Bug fix

- Make local CLI introduced by 1.11 work.

## [1.11.1] - 2018-12-07

### Bug fix

- Make local CLI introduced by 1.11 work on Windows.

## [1.11.0] - 2018-12-06

### Feature

- A global installation of Angular CLI is no longer needed,
the extension will use the project's local CLI (if installed in the default directory, ie. `node_modules`).

## [1.10.0] - 2018-10-29

### Feature

- Update Ionic schematics to the new package (thanks to @mhartington from Ionic team)

## [1.9.0] - 2018-10-13

### Feature

- New component type for Angular 7: Element (see README for more info)

## [1.8.1] - 2018-09-25

### Feature

- On macOS or Linux, it will now work if your Angular CLI installation is tied to a custom shell (like `zsh`),
provided that your VS Code settings are configured accordingly
(`terminal.integrated.shell.osx` or `terminal.integrated.shell.linux`)
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
