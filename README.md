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

## Sponsorship

I started this project to help my students learning Angular.
Now, according to [Visual Studio Code Marketplace](https://marketplace.visualstudio.com/items?itemName=cyrilletuzi.angular-schematics),
**this extension helps more than 230 000 developers** like you to be more productive.

But I'm still the only maintainer, and everything is done during my free time.
The lib may seem easy to use, but it's a lot of work.
So if your company earns money with projects using this extension,
it would be nice to **consider becoming [a sponsor](https://github.com/sponsors/cyrilletuzi)**.

## By the same author

- [@ngx-pwa/local-storage](https://github.com/cyrilletuzi/angular-async-local-storage): 1st Angular library for local storage
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

Current version of this extension officially requires Visual Studio Code version >= 1.41.
But it may work on some older VS Code versions too.

If you use an older version of VS Code and run into issues, you can still install
([official instructions here](https://github.com/Microsoft/vscode/issues/12764#issuecomment-442370545)):
- v2 of the extension for VS Code 1.39 & 1.40,
- v1 of the extension for VS Code < 1.39.

### Angular CLI

This extension is only enabled inside an Angular CLI project
(ie. with an `angular.json` file in workspace).

We follow [Angular LTS support](https://angular.io/guide/releases),
ie. currently your project should use Angular >= 7.
But the extension may still work in older versions.

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

This behavior is *not* required anymore with [Ivy](https://angular.io/guide/ivy)
(ie. Angular >= 9 with default config or Angular 8 with Ivy explicitly enabled).
It's only *required in non-Ivy mode*
(ie. Angular <= 7, Angular 8 with default config or Angular 9 with Ivy explicitly disabled).

Most of the time, Angular automatically manages the internal code to instantiate components,
because they are either associated to a route (ie. pages) or used somewhere in a template (ie. presentation components).

But dialogs (like in Angular Material), modals (like in Ionic)
and [Angular Elements](https://angular.io/guide/elements)
are invoked at runtime, so it was required to register them in `entryComponents`.

#### Component with Shadow DOM encapsulation

When creating an [Angular Element](https://angular.io/guide/elements), i.e. a reusable native Web Component,
the native encapsulation called `ShadowDom` must be used.

Note it's only available in Angular >= 7,
and it won't work in Internet Explorer / Edge (pre-Chromium).

### Component types

Having different component types is particullary helpful for projects following a good architecture,
ie. distinguishing components behaviors (explained above), or for tools with special components (like pages and modals in Ionic).

[Learn more about architecture in Angular projects](https://medium.com/@cyrilletuzi/architecture-in-angular-projects-242606567e40).

#### Default component types

By default, the extension will propose you these component types:

- Component: no special behavior
- Page: component associated to a route (`--skip-selector`) & modals/dialogs (Angular >=9)
- Pure: presentation / UI component (`--change-detection OnPush`)
- Exported: pure component reused outside of their modules, ie. component lib (`--exported --change-detection OnPush`)
- Element: Angular Element, ie. a native Web Component (`--entry-component --view-encapsulation ShadowDom`)
- Runtime: component like modals or dialogs (`--skip-selector --entry-component`) (Angular <=8)

#### Customize component suffixes (Angular >= 9)

Angular CLI >= 9 introduces a new `type` option for component generation, to change the component's suffix.

For example, `ng g hello --type page` will generate the `hello.page.ts` file with a `HelloPage` class
(instead of the `hello.component.ts` file with a `HelloComponent` class).

To customize component types, **your *root* `tslint.json` config must be changed** like this:

`"component-class-suffix": [true, "Component", "Page", "Modal"]`.

Now the extension will ask which component type you want based on this suffixes list,
and set the `--type` option automatically.

Note `--type` is set automatically only for your custom suffixes in `tslint.json`,
not for the default component types, as otherwise lint would fail.

#### Link a custom suffix to a component type

Some common suffixes will automatically pre-select the recommended behaviors:
- `Pure`, `UI`, `Presentation`, `Presentational`, `Dumb` > `--change-detection OnPush`
- `Page`, `Container`, `Smart`, `Routed`, `Route` > `--skip-selector`
- `Exported`, `Lib` > `--exported --change-detection OnPush`
- `Element` > `--entry-component --view-encapsulation ShadowDom`
- `Dialog`, `SnackBar`, `BottomSheet`, `Modal`, `Popover`, `Entry` > `--skip-selector` (Angular >=9) or `--skip-selector --entry-component` (Angular <=8)

The list above includes common suffixes in Angular, Material and Ionic.
If you think some other common suffixes are missing, please open a Pull Request with new
[defaults](https://github.com/cyrilletuzi/vscode-angular-schematics/blob/master/src/schematics/defaults.ts).

For uncommon suffixes, you can add a custom configuration in VS Code preferences:
- pure: `"ngschematics.componentTypes.pure": ["Custom"]`
- no selector: `"ngschematics.componentTypes.page": ["Custom"]`
- exported & pure: `"ngschematics.componentTypes.exported": ["Custom"]`
- entry & shadow: `"ngschematics.componentTypes.element": ["Custom"]`
- no selector & entry: `"ngschematics.componentTypes.runtime": ["Custom"]` (Angular <=8 only)

#### Default suffix

If you want to use the default `Component` suffix only for your pure presentation components, 
configure your VS Code preferences like this:

`"ngschematics.componentTypes.pure": ["Component"]`

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

If you are a library author, feel free to open a Pull Request to add your schematics in the
[default list](https://github.com/cyrilletuzi/vscode-angular-schematics/blob/master/src/schematics/defaults.ts).

### Custom schematics

If you created [your own Angular schematics](https://blog.angular.io/schematics-an-introduction-dc1dfbc2a2b2) but didn't published them yet,
this extension can load them too. By default, the extension will look into `./schematics/collection.json`.

If your schematics collection path is different,
you can add a *relative* path in the VS Code preferences.
For example: `"ngschematics.schematics": ["./path/to/collection.json"]`

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
