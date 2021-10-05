# Change Log

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

## [4.13.0] - 2021-03-29

### Feature

Add `@ngneat/scam` schematics in defaults.

## [4.12.0] - 2021-03-17

### Feature

Support schematics collections extending a whole other schematics collection (like `@nrwl/angular`).

Also, when a collection contains both its own schematics and inherits schematics from another collection,
the schematics specific to the collection are sorted first in the user choices.
It affects the schematics choice order for extended collections already supported previously
(like `@ionic/angular-toolkit`).

## [4.11.0] - 2021-03-08

### Feature

Add `@nrwl/angular` schematics in defaults.

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

## [4.0.2] - 2020-04-15

### Fix

Angular Material has additional schematics in `@angular/cdk` package,
so it has been added in the defaults detected schematics.

## [4.0.1] - 2020-04-14

### Fix

Old projects with a deprecated Angular configuration may have their e2e configuration
set as a separate `projects` entry in `angular.json`.
So the extension now filters projects' names ending with `-e2e`.

## [4.0.0] - 2020-04-13

This is a huge update. I started this extension to help my students during my Angular courses,
and it is now used by more than 270 000 developers. As many open source projects,
it started small and messy, and then growed a lot. So it was time for a *full* rewrite.

It took more than a *full-time* non-paid week (thanks to the current situation) to do so.
Yet I still do not have any **[sponsor](https://github.com/sponsors/cyrilletuzi)**.
So please consider to help, or to ask your enterprise, which makes money with this extension, to help. 

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

### Component types

#### Fully customizable component types

Default component types proposed when doing "Generate a component" are now fully customizable.

For example, in your VS Code preferences
(preferably your *workspace* preferences, so all your team can benefit):

```json
{
  "ngschematics.componentTypes": [{
    "label": "Angular Element",
    "options": [["viewEncapsulation", "ShadowDom"], ["export", "true"]],
    "detail": "Optional human description",
  }]
}
```

**Breaking change**: it means the previous `ngschematics.componentTypes`
setting's format is not supported anymore.

#### Library specific component types

It was already partially done before, but the extension will now detect
and propose these additional component types if the related libraries are installed:
- Angular Material dialog
- Angular Material snackbar
- Angular Material bottomsheet
- Ionic modal
- Ionic popover
- PrimeNG dynamic dialog

Library authors are encouraged to create a Pull Request and
easily add defaults components types in `src/defaults.ts`.

#### Removed entry component type

Previously, default suggested component types had an "Entry component" type.
It has been removed as it is now officially deprecated in Angular CLI >= 9,
and because detecting if your project has an old configuration was (really) too complicated and messy.

Fortunately, with customizable component types explained above, you can still add it back
(only needed if you have an Angular < 9 project or an Angular >= 9 project with Ivy manually disabled):

```json
{
  "ngschematics.componentTypes": [{
    "label": "Entry component",
    "options": [["entryComponent", "true"], ["skipSelector", "true"]],
    "detail": "Component instanciated at runtime, like a dialog or modal",
  }]
}
```

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
- `angular-cli.json`
- `.angular-cli.json`

### Support for non-Angular CLI projects

If you do not use the official Angular CLI project structure and configuration,
now the extension may still work, with limited features, if you met these minimal requirements:

- Angular CLI installed globally: `npm install @angular/cli -g`
- Angular Schematics installed locally: `npm install @schematics/angular --save-dev`
- Add an `angular.json` in your project with at least `{ "version": 1 }`

### Easier contribution

With time, the extension's code became quite messy.
The code has been fully rewritten, reorganized and above all fully *documented*.

Also, there are now tests, automatically launched by Github Actions.

This is especially good news for **contributors**, which can now help more easily.

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

Fix mingled description for page / modals / dialogs component type
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

## [3.2.1] - 2020-02-19

### VS Code compact folders

Revert automatic change of `compactFolders` setting introduced in 3.2.0,
as some users reported it as invasive.

You should consider disabling this setting by yourself in your VS Code *workspace* preferences:
`"explorer.compactFolders": false`

## [3.2.0] - 2020-02-15

### VS Code compact folders

Since [VS Code 1.41](https://code.visualstudio.com/updates/v1_41#_compact-folders-in-explorer),
a new default behavior combines single folders together.

While it might be a good idea in general, it is annoying with this extension,
as clicking on the right directory where you want to generate something becomes more confusing.

So the extension will disable this setting for you in `.vscode/settings.json`
(only in Angular projects).

If you want to keep the default VS Code behavior, just revert it:
`"explorer.compactFolders": true`

## [3.1.0] - 2020-02-15

### UX improvements

- A better balance has been found between simplicity and flexibility:
it is now one step quicker to generate common schematics (component / service / module),
while still being able to choose custom advanced options.

- Components types/behaviors choice is now 1 step instead of 2.

- Components types have been updated to match current simpler usages in last Angular versions:
  - Note that `--entry-component` is not required anymore for dialogs/modals since Angular 9.
  Dialogs/modals should now be generated as pages.
  - Angular Element choice has been removed for now, as it's still experimental and
  not a common scenario currently. If you have a project for your Angular Elements,
  just set `viewEncapsulation` schematics default to `ShadowDom` in your `angular.json`.

- Modules types have been updated to match current simpler usages in last Angular versions:
  - Promote lazy-loaded modules
  - "Module, imported" choice has been removed: this type was useful for modules of services,
  but since Angular 6, services don't require a `NgModule` anymore.
  So what is left is just modules with routing (these ones will automatically be imported in your `AppModule`) or modules of UI / presentation components. These last ones should not be imported just once
  in your `AppModule` but in each feature module where you need them
  (a feature to select the modules may come later).

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

If you use an older version of VS Code and run into issues, you can still install
([official instructions here](https://github.com/Microsoft/vscode/issues/12764#issuecomment-442370545)):
- v2 of the extension for VS Code 1.39 & 1.40,
- v1 of the extension for VS Code < 1.39.

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

All default values are now in a [simple and single file](https://github.com/cyrilletuzi/vscode-angular-schematics/blob/main/src/defaults.ts),
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
