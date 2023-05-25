# Change Log

## [5.4.0] - 2023-05-11

Shortcut for module generation has been removed.

Standalone components are now supported in all LTS versions of Angular, Angular 16 has formalized the new standalone project structure (`ng new --standalone`), and standalone APIs have been promoted by the Angular team as the way forward.

Note that if you still use NgModules, only the shortcut has been removed. You can still achieved module generation via "Generate another schematic".

## [5.3.0] - 2023-03-20

- Dependencies update
- Requires VS Code >= 1.71
- Angular < 9 not supported

## [5.2.0] - 2022-05-03

Disable persistence for the terminal used by the extension, as it is useless and can lead to a misuse of the terminal (it must not be used by the user for other tasks, like `ng serve`, otherwise the extension cannot use it anymore).

## [5.1.0] - 2021-11-18

The documentation is now directly included in the extension via the VS Code walkthrough feature. You can access it at any time from the VS Code menu:
1. View
2. Command Palette
3. search "Documentation"
4. choose "Angular Schematics: Documentation and tutorial"

## [5.0.1] - 2021-10-05

Internal changes only.

## [5.0.0] - 2021-08-23

### Breaking changes

- The extension now requires VS Code version >= 1.56.
- `.angular-cli.json` and `angular-cli.json` support has been removed,
as it was removed from Angular CLI itself a long time ago.
Although unlikely, just rename your config file to `angular.json` if needed.

### Internal changes

This release is mostly internal changes to align with lastest VS Code features
and subsequent recommendations for extensions.

Nothing should have changed for users, but there was a lot of internal changes
about paths management. Please file an issue if needed,
especially on Windows where path management is always a huge pain.

## [4.12.0] - 2021-03-17

### Feature

Support schematics collections extending a whole other schematics collection.

Also, when a collection contains both its own schematics and inherits schematics from another collection,
the schematics specific to the collection are sorted first in the user choices.
It affects the schematics choice order for extended collections already supported previously.

## [4.10.1] - 2021-02-09

### Fix

Changes in v4.9 brought into motion a VS Code issue in path management on Windows in some scenarios,
resulting in the right-clicked folder path sometimes not being prefilled in command path/name input.
The issue is now fixed.

## [4.10.0] - 2021-02-08

### Feature

When the extension is able to detect the success of an Angular CLI command,
and thus auto-opening the generated file, the extension will now:
- hide the terminal used for the Angular CLI command if it was the only opened terminal,
- display back the previously active terminal is there was another one.

Also, the terminals used by the extension will not capture focus anymore.

Indeed, while they are kept opened for performance reasons and to be able to check
the detailed results of the Angular CLI commands,
these terminals are not supposed to be used by the user directly.

Also, in a classic Angular development environment, you will already have a terminal running
`npm start` (ie. `ng serve`), which is good to keep an eye on (to see compilation errors),
so the extension will now go back to it automatically.

Note that in the cases where the Angular CLI command fails,
or when the extension is not able to detect the success
(which can happen with some third-party schematics or if the command takes too long),
the terminal used by the extension will be showed as before so you can see what happens.

## [4.9.0] - 2021-02-07

### Internal

Added CI tests for all OS.

### Fix

Doing the above revealed some issues in some path management.
They seemed to only affect CI, but fixing them may have also fixed some corner-case issues for Windows users.

## [4.8.0] - 2021-01-03

### Feature

Support detecting custom component suffixes with
[Angular ESLint](https://github.com/angular-eslint/angular-eslint).

## [4.7.0] - 2020-12-07

[Angular 11.1 deprecates camelCased options in Angular CLI commands.](https://github.com/angular/angular-cli/pull/19530)

So this release dasherizes them.

## [4.6.1] - 2020-11-13

No change, just a released to update links in marketplace documentation.

## [4.6.0] - 2020-11-05

No change for users.

### Internal

JSON parser from Angular CLI has been deprecated in v11 and is replaced by the `jsonc-parser` lib.

## [4.5.0] - 2020-10-05

### Feature

Better support for projects having nested Angular projects (for example because of git submodules).

## [4.3.0] - 2020-06-12

### Feature

When adding options, add a new choice on final confirmation to test the command with `--dry-run`.

## [4.2.0] - 2020-06-12

### Feature

Add global `--force` CLI option to all schematics.

## [4.1.0] - 2020-05-26

### Feature

Support for JSON5 (comments, etc.) configuration files.

## [4.0.5] - 2020-05-08

### Fix

Fixes an issue introduced in 4.0.4 where the "Nowhere" choice when generating a module
of components was not working anymore.

## [4.0.4] - 2020-05-04

### Fix

When choosing where to import a module of components,
module choice must contain its path (not just its name)
when the target module is not in a parent folder of the new module.

## [4.0.3] - 2020-04-16

### Fix

Some modules may not be imported immediately,
so add a "Nowhere" choice when asking where to import a module of components.

## [4.0.1] - 2020-04-14

### Fix

Old projects with a deprecated Angular configuration may have their e2e configuration
set as a separate `projects` entry in `angular.json`.
So the extension now filters projects' names ending with `-e2e`.

## [4.0.0] - 2020-04-13

### Compatibility with all shells

Previously, the extension was launching the Angular CLI commands directly via Node.
Although there was advantages (knowing the command result to know which file was generated and auto-open it),
it caused a lot of issues for people having special configurations
(nvm [#51](https://github.com/cyrilletuzi/vscode-angular-schematics/issues/51),
custom shells on Windows [#27](https://github.com/cyrilletuzi/vscode-angular-schematics/issues/27)...).

Now the extension is using a Terminal, ie. your environment directly.
So **if the Angular CLI is working in your VS Code terminal, the extension should work too.**

It means **the extension now supports any shell**:
- macOS / Linux: default shell or any custom shell (zsh...)
- Windows: default shell or any custom shell (PowerShell, Git bash...),
- Windows WSL too!

And while the extension cannot know the Terminal result,
in most cases, the generated file will still be automatically opened!

### Troubleshooting

Everything is now logged in `Angular Schematics` output channel (second tab left to your Terminal).

This is especially good news for **issues resolution**, as you can now
detect and correct configurations issues based on logs, and
copy/past the logs when creating a new GitHub issue is relevant.

### Open from a parent directory

Until now, a requirement was to open your Angular project from its root directory (ie. where `angular.json` is).
The Angular CLI itself only works if this condition is met.

While it is not the best practice in today's front-end development,
now you can open your Angular project from a parent directory!

This is especially good news for **Java users** who often like to keep their front-end project
inside their back-end project.

### Full compatibility with Code workspaces with multiple folders

VS Code allows to use several projects (folders) in the same Code workspace.

While the extension was already partially supporting that,
it is something really difficult to manage well,
and there was a lot of issues here and there.

Now every detail of the extension should be **aware of the workspace folder** you are working in.

### Full compatibility with Angular CLI monorepo

It gets worse: configuration can be specific to the workspace folder,
but it can also be specific to the Angular project you are working in.

Indeed, Angular CLI allows you to generate libraries (`ng g library`)
and/or multiple applications (`ng g application`) in the same folder.

And Angular projects can have different configurations
(for example TSLint, which is useful to manage components types in Angular >= 9).

Now every detail of the extension should be **aware of the Angular project** you are working in.
This is especially good news for users doing an **Angular monorepo**.

#### Removed entry component type

Previously, default suggested component types had an "Entry component" type.
It has been removed as it is now officially deprecated in Angular CLI >= 9,
and because detecting if your project has an old configuration was (really) too complicated and messy.

### node_modules location

The extension now supports hoisted `node_modules`, ie. `node_modules` being in a parent folder.

This is especially good news for **Yarn workspaces** users ([#49](https://github.com/cyrilletuzi/vscode-angular-schematics/issues/49)).

### Performance

Caching is quite hard to manage in this extension, as many details can change depending on your project's configuration.
Now the extension caches and preloads everything possible.

This is a good news for **performance**.

### Better cross-OS compatibility

The extension does a lot of path composition. It is quite hard to manage,
as some paths need to always use classic `/`, while others need to use the OS-specific separator.

Previously it was done via custom methods. Now the extension uses reliable APIs,
and has adopted naming conventions to distinguish path types.

This is especially good news for **Windows users**.

### Support for all Angular configuration files

While a today's Angular CLI project should have a `angular.json` file,
the CLI still support other legacy file names. The extension now supports all of them, ie.:
- `angular.json`
- `.angular.json`

### Support for non-Angular CLI projects

If you do not use the official Angular CLI project structure and configuration,
now the extension may still work, with limited features, if you met these minimal requirements:

- Angular CLI installed globally: `npm install @angular/cli -g`
- Angular Schematics installed locally: `npm install @schematics/angular --save-dev`
- Add an `angular.json` in your project with at least `{ "version": 1 }`

### UX

User experience has been improved everywhere it was possible. Non-exhaustive list:
- show progress on actions taking time
- icons for default component and module types choices
- ask where to import the module when doing "Generate a module"
- auto-opening the generated file works with even more schematics
- if the generated file cannot be opened automatically, propose to refresh the Explorer
- as the Terminal is now used, output is colored
- actionnable fix if a schematics package is missing

## [3.3.1] - 2020-03-19

### UX

Fix mingled description for page component type
when `Page` suffix is used.

## [3.3.0] - 2020-02-20

### Shortchuts use Angular CLI

Generation shortcuts ("Generate a component/service/module") are based on official Angular CLI schematics.
But before v3.3 of this extension,
the final command was launched with the default schematics configured in your `angular.json`.

This was problematic for Ionic users, were a custom version of Angular schematics
is set as default (`@ionic/angular-toolkit`). Unfortunately, these schematics are completely outdated
(some important options like `--change-detection` or `--skip-selector` are missing),
and some are even buggy (lazy-loaded module schematics is failing).

Now Angular CLI is always used in shortcuts,
so you can take advantage of up to date official schematics.
You can still use custom schematics with "Generate another schematics".

While Ionic custom schematics were useful in Ionic 3,
because Ionic added special things on top of Angular,
they are now useless in Ionic >= 4, which is just standard Angular.
So you should remove the following line of config in your `angular.json`,
to take advantage of the official and up to date Angular CLI schematics instead:

```json
{ "cli": { "defaultCollection": "@ionic/angular-toolkit" } }
```

## [3.1.0] - 2020-02-15

### UX improvements

- A better balance has been found between simplicity and flexibility:
it is now one step quicker to generate common schematics (component / service / module),
while still being able to choose custom advanced options.

- Components types/behaviors choice is now 1 step instead of 2.

- Components types have been updated to match current simpler usages in last Angular versions:
  - Note that `--entry-component` is not required anymore for dialogs/modals since Angular 9.
  Dialogs/modals should now be generated as pages.
  - Angular Element choice has been removed for now, as it is still experimental and
  not a common scenario currently. If you have a project for your Angular Elements,
  just set `viewEncapsulation` schematics default to `ShadowDom` in your `angular.json`.

- Modules types have been updated to match current simpler usages in last Angular versions:
  - Promote lazy-loaded modules
  - "Module, imported" choice has been removed: this type was useful for modules of services,
  but since Angular 6, services don't require a `NgModule` anymore.
  So what is left is just modules with routing (these ones will automatically be imported in your `AppModule`) or modules of UI / presentation components. These last ones should not be imported just once
  in your `AppModule` but in each feature module where you need them
  (a feature to select the modules may come later).

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

In Angular, it is all about components, but there are very different kinds of components,
and distinguishing the different behaviors is a good practice.

This extension already promoted components good practices,
but Angular CLI >= 9 adds a new `--type` option, and so we redesigned component types choice.
Now it goes even further, it is customizable and you can even take advantage of it in previous Angular versions.

As a consequence, the UI changed a little:
**the order of suggested component types has changed, so be sure to not select the wrong type by error**.

See the detailed [instructions in README](./README.md).

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

## [1.11.4] - 2019-01-12

### Bug fix

- Don't require options managed by Angular CLI like `project`
(fixes [#20](https://github.com/cyrilletuzi/vscode-angular-schematics/issues/20))

## [1.11.3] - 2018-12-27

### Dev fix

- Internal update of *dev* dependencies to fix a security issue reported by npm (does *not* concern you).

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
- If a `defaultCollection` is set in `angular.json`, it is now the first choice for quicker use.

## [1.4.0] - 2018-07-25

### Feature
- Now auto-detect project and context path for scoped librairies generated with `ng g library @company/somelibrary`.

## [1.3.1] - 2018-07-20

### Bug fix
- Only activate the extension when `angular.json` or `.angular-cli.json` are in the root directory (as it is a requirement of the CLI itself).

## [1.3.0] - 2018-06-29

### Features
- UI to select a component type with predefined options.
- New "Generate a module" command.
- Better UI when auto-detecting context path.

## [1.2.0] - 2018-06-24

### Feature
- Support for Angular 5 / CLI 1.7 projects.

## [1.0.1] - 2018-06-22

### Bug fix
- Now auto-detect project and context path for librairies generated with `ng g library`.

## [1.0.0] - 2018-06-22

### Feature
- Stable release.

## [0.6.0] - 2018-06-21

### Feature
- Support multi-workspaces projects.

## [0.1.0] - 2018-06-16

### Feature
- Command in Palette and Explorer context menu to generate from any official CLI schematics.

## [0.0.1] - 2018-06-16

### Features
- Command in Palette and Explorer context menu to generate a simple component.
- Command in Palette and Explorer context menu to generate a simple service.
