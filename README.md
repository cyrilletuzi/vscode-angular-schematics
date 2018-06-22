# Angular schematics extension for Visual Studio Code

Allow you to launch Angular schematics commands from files Explorer (right-click) or Command Palette.

## Why?

- Save time
- No more typo errors
- No more chaotic search in the CLI wiki, all options available will be proposed

## Angular onsite training

The author of this library organizes Angular courses (based in Paris, France, but open to travel).
You can find [my bio here](https://www.cyrilletuzi.com/en/web/) (in English)
and [course details here](https://formationjavascript.com/formation-angular/) (in French).

## Getting started

Just search for "Angular schematics" by "Cyrille Tuzi" directly inside VS Code extensions panel.

Then, from:
- files Explorer context menu (right-click on any file or directory),
- or from Command Palette,

choose an "Angular: Generate..." command and just fill the requested options.

![](https://github.com/cyrilletuzi/vscode-angular-schematics/raw/master/angular-schematics-demo.gif)

If you're launching the command from the files Explorer context menu,
the destination path will be automatically configured to the directory you just right-clicked.

## Requirements

This extension requires VS Code >= 1.24 and is only enabled inside an Angular CLI >=6 project, ie.:
- with `@angular/cli` >= 6 installed globally,
- with an `angular.json` file in workspace (automatically done by the CLI),
- with `@schematics/angular` installed locally in your project (automatically done by the CLI).

## Other features

### Other schematics

By default, this extension supports (if they are installed):
- `@schematics/angular` (official Angular CLI commands)
- `@angular/material`
- `@ngrx/schematics`

Scanning all packages to find all potential schematics would be too slow.
If you want to use other schematics, just add their package name in `ngschematics.schematics` in your VS Code preferences.

For example: `"ngschematics.schematics": ["@angular/material"]`

If you are a library author, feel free to open an issue to ask for your schematics to be added in the default list.

### Keyboard shortcuts

You can add keyboard shortcuts to the following actions:
- `ngschematics.generateComponent`
- `ngschematics.generateService`
- `ngschematics.generate`

### Default options

[`schematics` option of `angular.json`](https://github.com/angular/angular-cli/wiki/angular-workspace)
already allows to save default options for schematics commands.

## Release Notes

[Changelog available here](https://github.com/cyrilletuzi/vscode-angular-schematics/blob/master/CHANGELOG.md).

## License

MIT
