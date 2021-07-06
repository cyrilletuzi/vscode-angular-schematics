# Angular schematics extension for Visual Studio Code

[Visual Studio Code extension](https://marketplace.visualstudio.com/items?itemName=cyrilletuzi.angular-schematics)
allowing you to **generate Angular schematics with a Graphical User Interface**.

Works with Ionic Angular projects too!

## Why this extension?

### Productivity!

This extension will save you time:

- Simple interface for Angular CLI: **no command line required**
- **Many options are pre-filled**
- **The generated file will auto open**
- No more typo errors
- No more search in documentation: all options available are described

### Good practices

This extension promote **Angular good practices**,
by improving component generation with the suggestion of different component types
(explained below). To separate component types is good for:
- the **architecture** of your project, ie. **maintainability** and **scalability**,
- **performances**: pure components are optimized.

## Sponsorship

You like all the time saved by this extension and the increased productivity?
And your company is using it in projects generating money?

Well, on my side, it's a lot of *unpaid* work. So please consider:
- becoming a **[regular sponsor](https://github.com/sponsors/cyrilletuzi)**
- doing a **[one-time donation](https://github.com/sponsors/cyrilletuzi?frequency=one-time)**
- at least, taking 2 minutes to [show your love](https://github.com/cyrilletuzi/vscode-angular-schematics/discussions/categories/wall-of-love)

Thanks a lot to the current 2 sponsors:
- Luis Reinoso
- Miles Alden

That's 0,0004% of the **470 000 developers** using the extension
[according to Visual Studio Code Marketplace](https://marketplace.visualstudio.com/items?itemName=cyrilletuzi.angular-schematics). If only half of you were giving just $1,
I could work full-time on this extension and transform it in a fully automated architecture tool,
with all the missing schematics and options you dreamed of.

## By the same author

- [@ngx-pwa/local-storage](https://github.com/cyrilletuzi/angular-async-local-storage): Angular library for local storage
- [typescript-strictly-typed](https://github.com/cyrilletuzi/typescript-strictly-typed): reliable code with TypeScript strictly typed
- Popular [Angular posts on Medium](https://medium.com/@cyrilletuzi)
- Follow updates of this lib on [Twitter](https://twitter.com/cyrilletuzi)
- **[Angular trainings](https://formationjavascript.com/formation-angular/)** (in French, as I'm based in Paris, but [my English bio is here](https://www.cyrilletuzi.com/en/) and it can be done remotely)

## Getting started

Follow instructions on [Visual Studio Code marketplace](https://marketplace.visualstudio.com/items?itemName=cyrilletuzi.angular-schematics),
or just search for "Angular schematics" by "Cyrille Tuzi" directly inside VS Code Extensions view.

Then, **you can launch Angular CLI commands from 4 places:**
- the Explorer: **right-click on a directory, then choose "Angular: Generate..."**
- the dedicated Angular Schematics view (icon in the Activity bar on the left)
- the Command Palette
- with a [keyboard shortcut](./docs/KEYBOARD.md)

**The quickest way to launch a generation is the first: a right-click on a directory in the Explorer.**
Why? Because in this scenario, the extension will automatically infer
the path where you want to generate the schematic.

![](https://github.com/cyrilletuzi/vscode-angular-schematics/raw/main/angular-schematics-demo-20191025.gif)

## Requirements

This extension requires Visual Studio Code version >= 1.56.

Basically, in your project, if `ng g component hello` works
in the *VS Code* Terminal, the extension should work.

**If the Angular CLI is not working in the *VS Code* Terminal, please correct that first *before* opening a GitHub issue.**
See the [troubleshooting guide](./docs/TROUBLESHOOTING.md) for help.

## Recommendations

### Compact folders setting

A VS Code default behavior
[combines single folders together](https://code.visualstudio.com/updates/v1_41#_compact-folders-in-explorer).
While it might be a good idea in general, it is annoying with this extension,
as clicking on the right directory where you want to generate something becomes more confusing.

So you should consider disabling this setting in your VS Code *workspace* preferences:
`"explorer.compactFolders": false`

### Ionic

The extension supports **Ionic** projects too,
but it is recommended to [adjust some Ionic settings](./docs/IONIC.md).

## Component good practices

This extension helps you to follow good practices,
by suggesting different component types.

[Learn more about Angular components types](https://medium.com/@cyrilletuzi/angular-component-types-with-angular-9-new-features-a53d6272acdc?source=friends_link&sk=893d5009e03252ba0f5ea074141cd18b).

### Page

Option pre-filled: `--skip-selector`

A component associated to a route relies on specific features
(like the `ActivatedRoute` service to get URL params).
Thus, it should not be called via a HTML tag and so should not have a selector.

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

### Component suffixes

Angular CLI has a `--type` option for component generation, to change the component's suffix.

For example, `ng g hello --type page` will generate the `hello.page.ts` file with a `HelloPage` class
(instead of the `hello.component.ts` file with a `HelloComponent` class).

The extension will add `--type page` automatically for Pages if
you **change the authorized suffixes in your lint config**:

- `.eslintrc.json`:

```json
{
  "overrides": [
    {
      "files": [
        "*.ts"
      ],
      "rules": {
        "@angular-eslint/component-class-suffix": [
          "error",
          {
            "suffixes": [
              "Component",
              "Page"
            ]
          }
        ]
      }
    }
  ]
}

```

- `tslint.json`:

```json
{
  "rules": {
    "component-class-suffix": [true, "Component", "Page"]
  }
}
```

### Library specific component types

The extension suggests these additional component types if the related libraries are installed:
- Angular Material dialog
- Angular Material snackbar
- Angular Material bottomsheet
- Ionic modal
- Ionic popover
- PrimeNG dynamic dialog

As for Pages, a custom `--type`/suffix will be automatically added
if your linter is configured accordingly.

Library authors are encouraged to create a Pull Request to
easily add defaults components types in
[`src/defaults.ts`](https://github.com/cyrilletuzi/vscode-angular-schematics/blob/main/src/defaults.ts).

### Custom component types

You can add custom component types in your VS Code preferences
(preferably your *workspace* preferences, so all your team can benefit).

For example:

```json
{
  "ngschematics.componentTypes": [{
    "label": "Element",
    "options": [["changeDetection", "OnPush"], ["viewEncapsulation", "ShadowDom"]],
    "detail": "Component instanciated at runtime, like a dialog or modal",
  }]
}
```

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
  - `displayBlock`
- all schematics
  - `flat`
  - `skipTests`

## Libraries schematics

By default, this extension detects the following schematics:
- `@schematics/angular` (official Angular CLI commands)
- `@angular/material`
- `@ionic/angular-toolkit`
- `@ngrx/schematics`
- `@ngxs/schematics`
- `@nativescript/schematics`
- `@ngx-formly/schematics`
- `primeng-schematics`
- `@ngx-kit/collection`
- `ngx-spec`
- `./schematics/collection.json`

Scanning all packages to find all potential schematics would be too slow.
If you are a library author, you can open a Pull Request to easily add your schematics package in the
[`src/defaults.ts`](https://github.com/cyrilletuzi/vscode-angular-schematics/blob/main/src/defaults.ts).

## Custom schematics

If you created [your own Angular schematics](https://blog.angular.io/schematics-an-introduction-dc1dfbc2a2b2),
this extension can load them too. By default, the extension will look into `./schematics/collection.json`.

If your schematics collection path is different, you can add:
- a *relative* path in VS Code preferences:
`"ngschematics.schematics": ["./path/to/collection.json"]`
- if it's a package in `node_modules`:
`"ngschematics.schematics": ["my-private-lib"]`

## Multiple projects

If you work with multiple projects at the same time, the extension supports:
- VS Code workspace folders
- Angular CLI monorepo (several `ng g application`s and/or `ng g library`s in the same project)
- Hoisted `node_modules` (eg. Yarn workspaces)

Using a right-click on a directory in the Explorer to launch a schematic generation
is essential in both these cases, as the Code workspace folder and/or the Angular project
will be automatically inferred by the extension. Otherwise you will have to choose them manually.

## Release Notes

[Changelog available here](https://github.com/cyrilletuzi/vscode-angular-schematics/blob/main/CHANGELOG.md).

## License

MIT
