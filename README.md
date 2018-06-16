# Angular schematics extension for Visual Studio Code

Allow you to launch Angular schematics commands from files Explorer (right-click) or Command Palette.

## Angular onsite training

The author of this library organizes Angular courses (based in Paris, France, but open to travel).
You can find [my bio here](https://www.cyrilletuzi.com/en/web/) (in English)
and [course details here](https://formationjavascript.com/formation-angular/) (in French).

## Getting started

Just search for "Angular schematics" by "Cyrille Tuzi" directly inside VS Code extensions panel.

Then, from:
- files Explorer (right-click on any file or directory),
- or from Command Palette,

choose an "Angular: Generate..." command and just fill the requested options.

If you're launching the command from the files Explorer,
the destination path will be automatically configured to the directory you just right-cliked.

## Requirements

This extension requires VS Code >= 1.24 and is only enabled inside an Angular CLI >=6 project
(ie. with an `angular.json` file and with `@angular/cli` installed globally).

## Work in progress

This extension is working but in an early stage. Currently, you can only generate a simple component or service, without special options.
More schematics commands are on their way.

If you use special options everytime, be sure to use the
[`schematics` option of `angular.json`](https://github.com/angular/angular-cli/wiki/angular-workspace)
to save your default values.

## Release Notes

[Changelog available here](https://github.com/cyrilletuzi/vscode-angular-schematics/blob/master/CHANGELOG.md).
