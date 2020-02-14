# Change Log

## [3.1.0] - 2020-02-14

### UX improvements

- A better balance has been found between simplicity and flexibility:
it is now one step quicker to generate common schematics (component / service / module),
while still being able to choose custom advanced options.

- Modules types have been updated to match current simpler usages in last Angular versions.

## [3.0.1] - 2020-01-13

Just a documentation change, with info about [sponsorship](https://github.com/sponsors/cyrilletuzi/).

## [3.0.0] - 2020-01-02

### Breaking changes

The extension now requires:
- Visual Studio Code version >= 1.41,
- a LTS version of Angular (ie. currently Angular >= 7).

As for now, there is no code change in the extension, so it will still work
in older versions of VS Code and/or Angular,
but it may break at any time in future 3.x releases.

## [2.3.2] - 2019-12-23

### Bug fix

- Correct path detection when the application full path has an `app` directory in it

## [2.3.1] - 2019-12-2O

### Bug fix

- Make guard type choice work with new Angular 9 schema

## [2.3.0] - 2019-12-16

### Feature

- Auto-opening the component created now works with custom component types
(introduced in Angular 9 and v2.1 of this extension)

## [2.2.2] - 2019-12-10

### Bug fix

- Strip directories in route option in lazy-loaded module generation

## [2.2.1] - 2019-12-06

### Bug fix

- Project was not determined on Windows when not using the default CLI directory (`projects`)
for sub-applications (`ng g application`) or libraries (`ng g library`)

Thanks to @kvetis for the report and debug.

## [2.2.0] - 2019-11-03

### Feature

- Disable entry component type when in Ivy, as `--entry-component` option is not required anymore

## [2.1.0] - 2019-10-22

### New powerful and customizable component types management

In Angular, it's all about components, but there are very different kinds of components,
and distinguishing the different behaviors is a good practice.

This extension already promoted components good practices,
but Angular CLI >= 9 adds a new `--type` option, and so we redesigned component types choice.
Now it goes even further, it's customizable and you can even take advantage of it in previous Angular versions.

As a consequence, the UI changed a little:
**the order of suggested component types has changed, so be sure to not select the wrong type by error**.

See the detailed [instructions in README](./README.md).

### Easier contributions

All default values are now in a [simple and single file](https://github.com/cyrilletuzi/vscode-angular-schematics/blob/master/src/schematics/defaults.ts),
so you can easily do a Pull Request to add new defaults (for example to add a commonly used schematics).

### Other feature

- Angular CLI automatically adds files suffix (like `.component`),
but beginners often wrongly type it explicitly in component name, resulting in files like `some.component.component.ts`.
The extension will now correct this error automatically.

## [2.0.0] - 2019-10-21

### Performance

- Update all dependencies (and future updates will be automated)
- Remove `json5` lib: the extension now has 0 dependency
- Bundle and minify code with webpack: this extension is now <= 30 Ko
- Use up to date Node APIs

### New VS Code requirement

As a consequence, this version now officially requires Visual Studio Code version >= 1.39.
But it may work on some older VS Code versions too.

If you use on an older version of VS Code and run into issues, you can still install v1 of the extension 
([official instructions here](https://github.com/Microsoft/vscode/issues/12764#issuecomment-442370545)).

## [1.27.0] - 2019-09-08

### Feature

- New shortcut for generating lazy-loaded modules, based on new Angular CLI 8.3 feature `ng g module hello --route hello --module app`

## [1.23.0] - 2019-03-19

### Feature

- Keep dialogs opened on focus out (just press `Esc` to cancel)

## [1.22.0] - 2019-03-04

### Feature

- Hide `project` option in final command only for root application

## [1.21.0] - 2019-03-04

### Feature

- Ensure refresh of files explorer

## [1.20.0] - 2019-03-01

### Feature

- Better pathname inference for `ngx-spec` schematics special case

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
