# Angular schematics extension for Visual Studio Code

[Visual Studio Code extension](https://marketplace.visualstudio.com/items?itemName=cyrilletuzi.angular-schematics)
allowing you to launch Angular schematics (CLI commands) 
with a Graphical User Interface, directly inside VS Code!

## Why?

Productivity!

- Save time
- No more typo errors = no more mess cleaning
- No more chaotic search in the CLI wiki, all options available will be proposed and documented
- Promote good practices for component types

What about other tools like the Angular Console? Well, this lib will save you more time because:
- it's directly integrated in VS Code (no switch between 2 windows),
- many options are prefilled (like the path and the project where you want to generate things),
- generated files will auto open!

## By the same author

- [@ngx-pwa/local-storage](https://github.com/cyrilletuzi/angular-async-local-storage): 1st Angular library for local storage
- Library [@ngx-pwa/offline](https://github.com/cyrilletuzi/ngx-pwa-offline)
- Popular [Angular posts on Medium](https://medium.com/@cyrilletuzi)
- Follow updates of this lib on [Twitter](https://twitter.com/cyrilletuzi)
- **[Angular onsite tranings](https://formationjavascript.com/formation-angular/)** (based in Paris, so the website is in French, but [my English bio is here](https://www.cyrilletuzi.com/en/web/) and I'm open to travel)

## Getting started

Follow instructions on [Visual Studio Code marketplace](https://marketplace.visualstudio.com/items?itemName=cyrilletuzi.angular-schematics),
or just search for "Angular schematics" by "Cyrille Tuzi" directly inside VS Code extensions panel.

Then, **you can launch Angular CLI commands from 3 places:**
- the files Explorer context menu: **right-click on any directory or file**, then choose an "Angular: Generate..." command
- the dedicated Angular Schematics view (icon in the Activity bar on the left)
- or the Command Palette

And finally just fill the requested options.

![](https://github.com/cyrilletuzi/vscode-angular-schematics/raw/master/angular-schematics-demo.gif)

**The quickest way to launch your Angular CLI commands is the first, with a right-click inside the files Explorer context menu.**
Why? Because the destination path will be automatically configured to the directory you just right-clicked.

## Requirements

### VS Code

This extension requires VS Code >=1.24.

### Angular CLI

This extension is only enabled inside an Angular >=5 CLI project, ie.:
- with `@angular/cli` >=1.7 or >=6 installed globally,
- with an `angular.json` or `.angular-cli.json` file in workspace (automatically done by the CLI).

The project opened must be the root directory of the Angular project. It won't work from a parent directory,
as the CLI itself requires to be in the Angular directory.

### Path automatic detection

The path automatic detection only works if you stick to official CLI structure, meaning you must be in:
- `/**/app/` (like `/src/app/`)
- `/projects/**/**/app/` (like `/projects/someotherapp/src/app/`)
- `/projects/**/**/lib/` (like `/projects/somelibrary/src/lib/`)
- `/projects/**/**/**/lib/` (like `/projects/company/somelibrary/src/lib/` for scoped `@company/somelibrary`)

### Custom shell

On macOS or Linux, if you use a custom shell (like `zsh`) and your Angular CLI installation is tied it,
it must be configured accordingly in your VS Code settings
(`terminal.integrated.shell.osx` or `terminal.integrated.shell.linux`).

## Other features

### Other schematics

By default, this extension supports (if they are installed):
- `@schematics/angular` (official Angular CLI commands)
- `@angular/material`
- `@ionic/angular-schematics`
- `@ngrx/schematics`
- `@nrwl/schematics`
- `@nstudio/schematics`

Scanning all packages to find all potential schematics would be too slow.
If you want to use other schematics, just add their package name in `ngschematics.schematics` in your VS Code preferences.

For example: `"ngschematics.schematics": ["@angular/material"]`

If you are a library author, feel free to open an issue to ask for your schematics to be added in the default list.

### Keyboard shortcuts

You can add keyboard shortcuts to the following actions:
- `ngschematics.generateComponent`
- `ngschematics.generateService`
- `ngschematics.generateModule`
- `ngschematics.generate`

### Default options

[`schematics` option of `angular.json`](https://github.com/angular/angular-cli/wiki/angular-workspace)
already allows to save default options for schematics commands.

### Icons

The icons in the Angular Schematics view will be nicer if you use
the [Material Icon Theme extension](https://marketplace.visualstudio.com/items?itemName=PKief.material-icon-theme).

## Component types

Puzzled about the component type choice?

### Exported component

Components have a local scope by default, meaning they are only usable inside the module where they are declared.
So if you want to use your component in another module (for example if you are doing a reusable UI component), you have to export it.
[Learn more about Angular modules and their scopes](https://medium.com/@cyrilletuzi/understanding-angular-modules-ngmodule-and-their-scopes-81e4ed6f7407).

### Pure component (also known as a presentation component)

A pure component is a component which relies only on its `@Input`s for data,
as opposed to an impure component, which relies on external asynchronous operations (like a HTTP request via a service) for data.
Observing this difference is a good practice, [learn more about architecture in Angular projects](https://medium.com/@cyrilletuzi/architecture-in-angular-projects-242606567e40).

### Element component

Only available in Angular >= 7.

Used to create an Angular Element, i.e. a reusable native Web Component.
Such components need to be registered in `entryComponents` and to use native `ShadowDom` viewEncapsulation.
See [the documentation](https://angular.io/guide/elements) for more info.

## Release Notes

[Changelog available here](https://github.com/cyrilletuzi/vscode-angular-schematics/blob/master/CHANGELOG.md).

## License

MIT
