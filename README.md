# Angular schematics extension for Visual Studio Code

Allow you to launch Angular schematics commands from files Explorer (right-click) or Command Palette.

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

If you're launching the command from the files Explorer context menu,
the destination path will be automatically configured to the directory you just right-cliked.

If you use special options everytime, be sure to use the
[`schematics` option of `angular.json`](https://github.com/angular/angular-cli/wiki/angular-workspace)
to save your default values and save time.

## Requirements

This extension requires VS Code >= 1.24 and is only enabled inside an Angular CLI >=6 project
(ie. with an `angular.json` file and with `@angular/cli` installed globally).

## To do

- Allow generation from all schematics (not just the CLI official ones).
- Localization.

Contributions welcomed.

## Release Notes

[Changelog available here](https://github.com/cyrilletuzi/vscode-angular-schematics/blob/master/CHANGELOG.md).
