# Angular schematics extension for Visual Studio Code

[Visual Studio Code extension](https://marketplace.visualstudio.com/items?itemName=cyrilletuzi.angular-schematics)
allowing you to **launch Angular schematics (CLI commands) with a Graphical User Interface, directly inside VS Code!**

## Why this extension?

### Productivity!

This extension will save you time:

- **Simple interface for Angular CLI**: no command line required
- **Many options are inferred** (like the path and the project)
- **Generated files will auto open**
- No more typo errors = no more cleaning mess
- No more documentation search, all options available are proposed and described

### Good practices

This extension promote **Angular good practices**,
by improving component generation with the choice of different component types
(explained below). To separate component types is good for:
- the **architecture** of your project, ie. **maintainability** and **scalability**,
- **performances**: pure components are optimized.

## Sponsorship

I started this project to help my students learning Angular.
Now, according to [Visual Studio Code Marketplace](https://marketplace.visualstudio.com/items?itemName=cyrilletuzi.angular-schematics),
**this extension helps more than 250 000 developers** like you to be more productive.

It's a lot of *free* work.
So if your company earns money with projects using this extension,
**consider becoming [a sponsor](https://github.com/sponsors/cyrilletuzi)**.

## By the same author

- [@ngx-pwa/local-storage](https://github.com/cyrilletuzi/angular-async-local-storage): Angular library for local storage
- [typescript-strictly-typed](https://github.com/cyrilletuzi/typescript-strictly-typed): strict config for TypeScript, ESLint/TSLint and Angular
- Popular [Angular posts on Medium](https://medium.com/@cyrilletuzi)
- Follow updates of this lib on [Twitter](https://twitter.com/cyrilletuzi)
- **[Angular onsite trainings](https://formationjavascript.com/formation-angular/)** (based in Paris, so the website is in French, but [my English bio is here](https://www.cyrilletuzi.com/en/) and I'm open to travel)

## Getting started

Follow instructions on [Visual Studio Code marketplace](https://marketplace.visualstudio.com/items?itemName=cyrilletuzi.angular-schematics),
or just search for "Angular schematics" by "Cyrille Tuzi" directly inside VS Code extensions panel.

Then, **you can launch Angular CLI commands from 4 places:**
- the files Explorer context menu: **right-click on any directory, then choose an "Angular: Generate..." command**
- the dedicated Angular Schematics view (icon in the Activity bar on the left)
- the Command Palette
- from a shortcut (see configuration below)

![](https://github.com/cyrilletuzi/vscode-angular-schematics/raw/master/angular-schematics-demo-20191025.gif)

**The quickest way to launch your Angular CLI commands is the first, with a right-click inside the files Explorer context menu.**
Why? Because the destination path and `project` will be automatically inferred to the directory you just right-clicked.

## Requirements

### VS Code

This extension requires Visual Studio Code version >= 1.41.

### Angular CLI

This extension is only enabled inside an Angular CLI project
(ie. with an `angular.json` file in workspace).

We follow [Angular LTS support](https://angular.io/guide/releases),
ie. your project should use Angular >= 7.

### Project root

**The project opened must be the *root* directory of the Angular project. It won't work from a parent directory, as the CLI itself requires to be in the Angular directory.**

If your Angular project is inside your backend project, and you want both opened in VS Code:
- open the *root* directory of the Angular project,
- then in VS Code menu: "File" > "Add Folder to Workspace" > open the directory of your backend project.

### Custom shell

On macOS or Linux, if you use a custom shell (like `zsh`) and your Angular CLI installation is tied it,
it must be configured accordingly in your VS Code settings
(`terminal.integrated.shell.osx` or `terminal.integrated.shell.linux`).

## Recommendations

### VS Code compact folders

Since [VS Code 1.41](https://code.visualstudio.com/updates/v1_41#_compact-folders-in-explorer),
a new default behavior combines single folders together.

While it might be a good idea in general, it is annoying with this extension,
as clicking on the right directory where you want to generate something becomes more confusing.

So you should consider disabling this setting in your VS Code *workspace* preferences:
`"explorer.compactFolders": false`

### Ionic

If you use Ionic, it configures custom default schematics in `angular.json`:
```json
{ "cli": { "defaultCollection": "@ionic/angular-toolkit" } }
```

Unfortunately, these schematics are completely outdated
(some important options like `--change-detection` or `--skip-selector` are missing),
and some are even buggy (lazy-loaded module schematics is failing).

While Ionic custom schematics were useful in Ionic 3,
because Ionic added special things on top of Angular,
they are now useless in Ionic >= 4, which is just standard Angular.
So you should remove this line of config in your `angular.json`,
to take advantage of the official and up to date Angular CLI schematics instead.

## Component good practices

This extension helps you to follow good practices,
by suggesting different component types.

[Learn more about Angular components types](https://medium.com/@cyrilletuzi/angular-component-types-with-angular-9-new-features-a53d6272acdc?source=friends_link&sk=893d5009e03252ba0f5ea074141cd18b).

### Page

Option pre-filled: `--skip-selector`

A component associated to a route relies on specific features
(like the `ActivatedRoute` service to get URL params).
Thus, it should not be called via a HTML tag and so should not have a selector.

Since Angular 9, a modal/dialog must be generated as a page too
(previously it was a special type: `--entry-component`).

### Pure component

Option pre-filled: `--change-detection OnPush`

A pure component, also known as a presentation component,
is a component which relies only on its `@Input`s for data, ie. its role is only presentation / UI (~ view),
as opposed to an impure component, which relies on external asynchronous operations (like a HTTP request via a service) for data, ie. a page (~ controller).

[Learn more about architecture in Angular projects](https://medium.com/@cyrilletuzi/architecture-in-angular-projects-242606567e40?source=friends_link&sk=ad8233d7934c08b6f8f364a46f3c8967).

### Exported component

Options pre-filled: `--export --change-detection OnPush`

Components have a local scope by default, meaning they are only usable inside the module where they are declared.
So if you want to use a component in another module (for example if you are doing a reusable UI component), you have to export it.

[Learn more about Angular modules and their scopes](https://medium.com/@cyrilletuzi/understanding-angular-modules-ngmodule-and-their-scopes-81e4ed6f7407?source=friends_link&sk=4d246eec7026910c950f19e0a16ee9bd).

## Customize component suffixes (Angular >= 9)

Angular CLI >= 9 introduces a new `type` option for component generation, to change the component's suffix.

For example, `ng g hello --type page` will generate the `hello.page.ts` file with a `HelloPage` class
(instead of the `hello.component.ts` file with a `HelloComponent` class).

To customize component suffixes, **your *root* `tslint.json` config must be changed** like this:

`"component-class-suffix": [true, "Component", "Page", "Dialog"]`.

Now the extension will ask which component type you want based on this suffixes list,
and set the `--type` option automatically.

Common suffixes will automatically pre-select the recommended type:
- Page: `Page`, `Container`, `Smart`, `Routed`, `Route`, `Dialog`, `SnackBar`, `BottomSheet`, `Modal`, `Popover`, `Entry`
- Pure: `Pure`, `UI`, `Presentation`, `Presentational`, `Dumb`
- Exported: `Exported`, `Lib`

The list above includes common suffixes in Angular, Material, Ionic and PrimeNG.
If you think some other common suffixes are missing, please open a Pull Request with new
[defaults](https://github.com/cyrilletuzi/vscode-angular-schematics/blob/master/src/defaults.ts).

## Default options

[`schematics` option of `angular.json`](https://github.com/angular/angular-cli/wiki/angular-workspace)
allows to save default options for schematics commands.

For example, if you want all your generated components templates to be inline, in *all* your projects,
just add in `angular.json`:
```json
{
  "schematics": {
    "@schematics/angular:component": {
      "inlineTemplate": true
} } }
```

Or only in a specific project:
```json
{
  "projects": {
    "yourprojectname": {
      "schematics": {
        "@schematics/angular:component": {
          "inlineTemplate": true
} } } } }
```

It can be interesting for the following options:
- `@schematics/angular:component`
  - `inlineTemplate`
  - `inlineStyle`
  - `style`
  - `prefix`
  - `changeDetection`
  - `viewEncapsulation`
  - `displayBlock` (Angular CLI >= 9.1)
- all schematics
  - `flat`
  - `skipTests`

## Libraries schematics

By default, this extension supports (if they are installed):
- `@schematics/angular` (official Angular CLI commands)
- `@angular/material`
- `@ionic/angular-toolkit`
- `@ngrx/schematics`
- `@nrwl/schematics`
- `@nstudio/schematics`
- `@ngxs/schematics`
- `@nativescript/schematics`
- `@ngx-formly/schematics`
- `primeng-schematics`
- `@ngx-kit/collection`
- `ngx-spec`
- `./schematics/collection.json`

Scanning all packages to find all potential schematics would be too slow.
If you are a library author, feel free to open a Pull Request to add your schematics in the
[default list](https://github.com/cyrilletuzi/vscode-angular-schematics/blob/master/src/defaults.ts).

## Custom schematics

If you created [your own Angular schematics](https://blog.angular.io/schematics-an-introduction-dc1dfbc2a2b2),
this extension can load them too. By default, the extension will look into `./schematics/collection.json`.

If your schematics collection path is different,
you can add:
- a *relative* path in VS Code preferences:
`"ngschematics.schematics": ["./path/to/collection.json"]`
- if it's a package in `node_modules`:
`"ngschematics.schematics": ["my-private-lib"]`

## Other features

### Keyboard shortcuts

You can add keyboard shortcuts to the following actions:
- `ngschematics.generateComponent`
- `ngschematics.generateService`
- `ngschematics.generateModule`
- `ngschematics.generate`

But again, it's not the easiest way to use this extension:
**a right-click in the files Explorer menu is better as the extension will infer the destination path and `project`**.

### Icons

The icons in the Angular Schematics view will be nicer if you use
the [Material Icon Theme extension](https://marketplace.visualstudio.com/items?itemName=PKief.material-icon-theme).

## Release Notes

[Changelog available here](https://github.com/cyrilletuzi/vscode-angular-schematics/blob/master/CHANGELOG.md).

## License

MIT
