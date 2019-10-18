# Angular schematics extension for Visual Studio Code

[Visual Studio Code extension](https://marketplace.visualstudio.com/items?itemName=cyrilletuzi.angular-schematics)
allowing you to **launch Angular schematics (CLI commands) with a Graphical User Interface, directly inside VS Code!**

## Why?

**Productivity!**

This extension will save you time:

- **No more typo errors** = no more cleaning mess
- No more documentation search, all options available are proposed and described
- **Many options are inferred** (like the path and the project)
- **Generated files will auto open!**
- Promote **good practices** for component types

### Differences with Angular Console

If you've heard about Angular Console, you may ask what's the difference with this extension (which was released first).

While this extension is specific to VS Code, Angular Console was first designed as a desktop app,
and then ported to VS Code. As a consequence, some useful features like inferred options
and auto-opening generated files are not possible in Angular Console (at least for now).

So it's up to you: test both and see which one saves you more time.

## By the same author

- [@ngx-pwa/local-storage](https://github.com/cyrilletuzi/angular-async-local-storage): 1st Angular library for local storage
- Other Angular libraries: [@ngx-pwa/offline](https://github.com/cyrilletuzi/ngx-pwa-offline) and [@ngx-pwa/ngsw-schema](https://github.com/cyrilletuzi/ngsw-schema)
- Popular [Angular posts on Medium](https://medium.com/@cyrilletuzi)
- Follow updates of this lib on [Twitter](https://twitter.com/cyrilletuzi)
- **[Angular onsite trainings](https://formationjavascript.com/formation-angular/)** (based in Paris, so the website is in French, but [my English bio is here](https://www.cyrilletuzi.com/en/web/) and I'm open to travel)

## Getting started

Follow instructions on [Visual Studio Code marketplace](https://marketplace.visualstudio.com/items?itemName=cyrilletuzi.angular-schematics),
or just search for "Angular schematics" by "Cyrille Tuzi" directly inside VS Code extensions panel.

Then, **you can launch Angular CLI commands from 4 places:**
- the files Explorer context menu: **right-click on any directory, then choose an "Angular: Generate..." command**
- the dedicated Angular Schematics view (icon in the Activity bar on the left)
- the Command Palette
- from a shortcut (see configuration below)

![](https://github.com/cyrilletuzi/vscode-angular-schematics/raw/master/angular-schematics-demo.gif)

**The quickest way to launch your Angular CLI commands is the first, with a right-click inside the files Explorer context menu.**
Why? Because the destination path and `project` will be automatically inferred to the directory you just right-clicked.

## Requirements

### Angular CLI

This extension is only enabled inside an Angular >=5 CLI project
(ie. with an `angular.json` or `.angular-cli.json` file in workspace).

### Project root

**The project opened must be the *root* directory of the Angular project. It won't work from a parent directory, as the CLI itself requires to be in the Angular directory.**

If your Angular project is inside your backend project, and you want both opened in VS Code:
- open the *root* directory of the Angular project,
- then in VS Code menu: "File" > "Add Folder to Workspace" > open the directory of your backend project.

### Custom shell

On macOS or Linux, if you use a custom shell (like `zsh`) and your Angular CLI installation is tied it,
it must be configured accordingly in your VS Code settings
(`terminal.integrated.shell.osx` or `terminal.integrated.shell.linux`).

## Component good practices

This extension helps you to follow good practices,
by suggesting different component types and behaviors.

### Special component behaviors

#### Exported component

Components have a local scope by default, meaning they are only usable inside the module where they are declared.
So if you want to use a component in another module (for example if you are doing a reusable UI component), you have to export it.

[Learn more about Angular modules and their scopes](https://medium.com/@cyrilletuzi/understanding-angular-modules-ngmodule-and-their-scopes-81e4ed6f7407).

#### Pure component (also known as a presentation component)

A pure component is a component which relies only on its `@Input`s for data, ie. its role is only presentation / UI (~ view),
as opposed to an impure component, which relies on external asynchronous operations (like a HTTP request via a service) for data, ie. a page (~ controller).

[Learn more about architecture in Angular projects](https://medium.com/@cyrilletuzi/architecture-in-angular-projects-242606567e40).

#### Component without selector

Components associated to a route (ie. pages) or instantiated at runtime (like dialogs/modals) relies on specific features
(like the `ActivatedRoute` service to get URL params).
Thus, they should not be called via a HTML tag and so should not have a selector.

#### Entry component

Most of the time, Angular automatically manage the internal code to instantiate components,
because they are either associated to a route (ie. pages) or used somewhere in a template (ie. presentation components).

But dialogs (like in Angular Material), modals (like in Ionic)
and [Angular Elements](https://angular.io/guide/elements)
are invoked at runtime, so it's required to register them in `entryComponents`.

#### Component with Shadow DOM encapsulation

When creating an [Angular Element](https://angular.io/guide/elements), i.e. a reusable native Web Component,
the native encapsulation called `ShadowDom` must be used.

Note it's only available in Angular >= 7,
and it won't work in Internet Explorer / Edge (pre-Chromium).

### Component types

Angular CLI >= 9 introduces a new `type` option for component generation, to change the component's suffix.
For example, `ng g hello --type page` will generate the `hello.page.ts` file with a `HelloPage` class
(instead of the `hello.component.ts` file with a `HelloComponent` class).

This is particullary helpful for projects following a good architecture, ie. distinguishing components behaviors
(see below if interested for more details), or for tools with special components (like modals in Ionic).

#### TSLint config

Your *root* `tslint.json` config must be set accordingly. For example:
`"component-class-suffix": [true, "Component", "Page", "Modal"]`.

Now the extension will ask which component type you want based on the `tslint.json` suffixes list,
and the `--type` option will be set automatically.

#### Common types

Even better: some common suffixes will automatically pre-select the recommended behaviors:
- `Pure`, `UI`, `Presentation`, `Presentational`, `Dumb` > pure
- `Page`, `Container`, `Smart`, `Routed`, `Route` > no selector
- `Dialog`, `SnackBar`, `BottomSheet`, `Modal`, `Popover` > no selector & entry
- `Element` > entry & shadow

#### Custom types

The list includes common components types in Angular Material and Ionic.
If you think some other common suffixes are missing, please do a PR (or file an issue).

For uncommon suffixes, you can add a custom configuration in VS Code preferences:
- exported: `"ngschematics.exportedComponentTypes": ["Custom"]`
- pure: `"ngschematics.pureComponentTypes": ["Custom"]`
- no selector: `"ngschematics.pageComponentTypes": ["Custom"]`
- no selector & entry: `"ngschematics.runtimeComponentTypes": ["Custom"]`
- entry & shadow: `"ngschematics.elementComponentTypes": ["Custom"]`

#### Default `Component` suffix

If you use the default `Component` suffix only for your pure presentation components, add this config:
`"ngschematics.pureComponentTypes": ["Component"]`

This is a good practice but not the default configuration, as `Component` is the default suffix,
and changing the `changeDetection` option has consequences that you need to be aware of.

## Other features

### Default options

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

If you want different values from the official defaults, the following options should be configured like above to ease the generation process:
- `@schematics/angular:component`
  - `inlineTemplate`
  - `inlineStyle`
  - `style`
- all schematics
  - `skipTests`

### Other schematics

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
If you want to use other schematics, just add their package name in `ngschematics.schematics` in your VS Code preferences.

For example: `"ngschematics.schematics": ["@angular/material"]`

If you are a library author, feel free to open an issue to ask for your schematics to be added in the default list.

### Custom schematics

If you created [your own Angular schematics](https://blog.angular.io/schematics-an-introduction-dc1dfbc2a2b2) but didn't published them yet,
this extension can load them too. By default, the extension will look into `./schematics/collection.json`.

If your schematics collection path is different,
you can add a *relative* path in the VS Code preferences.
For example: `"ngschematics.schematics": ["./path/to/collection.json"]`

[Additional steps are required](https://github.com/cyrilletuzi/vscode-angular-schematics/blob/master/docs/NX.md) if you use Nx workspace schematics.

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
