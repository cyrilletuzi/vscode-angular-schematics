# Change Log

## [6.0.8] - 2023-11-19

Better Pro edition onboarding:
- places with "Try the Pro edition" are cleaned up once your license is activated
- a "Create a custom schematic" button has been added in the sidebar panel, accessible from the Angular logo in the left sidebar

## [6.0.7] - 2023-11-17

Fixes:
- a VS Code issue where the custom schematic creation command would fail in multi-workspaces projects
- standalone components imports picker not showing in projects without a valid `angular.json`
- some Pro edition features (like standalone components imports picker) still locked despite having activated a license

## [6.0.0] - 2023-11-16

Last week was the Angular renaissance, what about a renaissance of this extension? This is a major update and the beginning of a new journey.

### Angular CLI is dead, long live Angular CLI

The previous versions of this extension were a graphical interface to avoid to manually type command lines. But in the end, it was still an Angular CLI command that was automatically launched in the terminal.

Now, this extension has its own code generator, completely baked into Visual Studio Code. It means that several of your most frequent requests are now solved:
- installing Angular CLI globally is no longer needed
- having `@schematics/angular` dependencies in the project `node_modules` is no longer needed
- alternate package managers fantasies do not get in the way anymore
- terminal nightmare ends: no more shells, configurations or permissions issues
- `angular.json`, while still recommended, is no longer needed

Also, it is faster.

### Opinionated schematics defaults

Another big consequence is that the extension schematics no longer have to follow what the Angular CLI does. This extension aims to be a tool for Angular professionals, and so the defauts are now the ones my 8 years of teaching and coding with Angular have proven to be the best.

The main differences you will notice are:
- inline HTML template by default
- change detection optimization (`OnPush`) by default
- `:host { display: block; }` by default in pure components
- no spec file by default

### Configuration helper

But fear not: these are just the defaults and everything can be customized. **A lot of effort has been put in a configuration helper where you can change the settings in just a click.**

Also, for its own sake, the extension now uses its own configuration. But you can use the same configuration helper to copy settings from angular.json, especially:
- enable SCSS styles
- enable single file components

### Documentation

A lot of effort has also been put in a whole new documentation, accessible directly inside Visual Studio Code. Please take a few minutes to read it. You can access it at any time from the Angular logo on the left sidebar, or in the VS Code menu:
1. View
2. Command Palette
3. search "Documentation"
4. choose "Angular Schematics: Documentation and tutorial"

### 💎 Pro edition

While this extension is very popular, with nearly 1 million installations, it is *not* a tool developed by the Angular team or affiliated to Google in any way.

It is months of *unpaid* work by a single contributor.

So you will see some new features marked with a diamond 💎. It means they are only available in the Pro edition.

Feel free to enjoy advanced features and support a contributor at the same time! 💖

- additional schematics (page, reactive services, unit tests,...)
- advanced options (imports for standalone components, entry files exports,...)
- legacy schematics (components with NgModules, class guards,...)
- custom schematics in a much simpler way than with the Angular CLI
- predefined paths to enforce an architecture

You will find details about all these features directly in the extension documention.

💎 **[Try the Pro edition for free](https://cyrilletuzi.gumroad.com/l/schematicspro/angular-renaissance)** 💎

And to celebrate the Angular renaissance, price is currently 50% off. 🎉

## [5.4.0] - 2023-05-11

## [5.3.0] - 2023-03-20

## [5.2.0] - 2022-05-03

## [5.1.0] - 2021-11-18

## [5.0.1] - 2021-10-05

## [5.0.0] - 2021-08-23

## [4.12.0] - 2021-03-17

## [4.10.1] - 2021-02-09

## [4.10.0] - 2021-02-08

## [4.9.0] - 2021-02-07

## [4.8.0] - 2021-01-03

## [4.7.0] - 2020-12-07

## [4.6.1] - 2020-11-13

## [4.6.0] - 2020-11-05

## [4.5.0] - 2020-10-05

## [4.3.0] - 2020-06-12

## [4.2.0] - 2020-06-12

## [4.1.0] - 2020-05-26

## [4.0.5] - 2020-05-08

## [4.0.4] - 2020-05-04

## [4.0.3] - 2020-04-16

## [4.0.1] - 2020-04-14

## [4.0.0] - 2020-04-13

## [3.3.1] - 2020-03-19

## [3.3.0] - 2020-02-20

## [3.1.0] - 2020-02-15

## [3.0.0] - 2020-01-02

## [2.3.2] - 2019-12-23

## [2.3.1] - 2019-12-2O

## [2.2.2] - 2019-12-10

## [2.2.1] - 2019-12-06

## [2.2.0] - 2019-11-03

## [2.1.0] - 2019-10-22

## [2.0.0] - 2019-10-21

## [1.27.0] - 2019-09-08

## [1.23.0] - 2019-03-19

## [1.22.0] - 2019-03-04

## [1.21.0] - 2019-03-04

## [1.18.0] - 2019-02-23

## [1.17.0] - 2019-02-16

## [1.16.0] - 2019-02-03

## [1.13.0] - 2019-02-02

## [1.12.2] - 2019-01-29

## [1.12.1] - 2019-01-16

## [1.11.4] - 2019-01-12

## [1.11.3] - 2018-12-27

## [1.8.1] - 2018-09-25

## [1.7.0] - 2018-09-22

## [1.6.2] - 2018-09-06

## [1.6.0] - 2018-08-29

## [1.5.0] - 2018-07-26

## [1.4.0] - 2018-07-25

## [1.3.1] - 2018-07-20

## [1.3.0] - 2018-06-29

## [1.2.0] - 2018-06-24

## [1.0.1] - 2018-06-22

## [1.0.0] - 2018-06-22

## [0.6.0] - 2018-06-21

## [0.1.0] - 2018-06-16

## [0.0.1] - 2018-06-16
