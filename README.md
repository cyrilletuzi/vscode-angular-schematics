# Angular schematics extension for Visual Studio Code

## Why this extension?

### Productivity!

Angular and Ionic are frameworks to build applications: it is a lot more work than just a few bits of jQuery. You have to create hundred of components and services. There are 4 ways to do this (from the slowest to the quickest):
- manually from scratch, rewriting all the boilerplate code everytime
- via snippets: as they are static, there is still a lot to do manually
- via Angular CLI: more powerful, but still tedious: you have to type a long and error-prone command line
- via [this extension](https://marketplace.visualstudio.com/items?itemName=cyrilletuzi.angular-schematics): just right-click the destination folder, and start coding (**no command line!**)

![](https://github.com/cyrilletuzi/vscode-angular-schematics/raw/main/angular-schematics-demo-20191025.gif)

### Team work and good practices

Also, inside a team, you can either decide that:
- everyone do things the way they want, resulting in a big mess over time
- decide the better way to do things, and share the same practices accross the team

## Getting started

Follow instructions on [Visual Studio Code marketplace](https://marketplace.visualstudio.com/items?itemName=cyrilletuzi.angular-schematics), or just search for "Angular schematics" by "Cyrille Tuzi" directly inside VS Code Extensions view.

## Documentation

**The documentation is directly included in the extension via the VS Code walkthrough feature**. The walkthrough will appear automatically the first time you install the extension, and covers the basics:
- first generation
- troubleshooting
- configuration

**Please take a few minutes to read it.** You can access it at any time from the Angular logo on the left sidebar, or in the VS Code menu:
1. View
2. Command Palette
3. search "Documentation"
4. choose "Angular Schematics: Documentation and tutorial"

## Requirements

The extension is tested with the last 2 versions of Visual Studio Code. It may work with previous versions but it is not guaranteed.

### 💎 Pro edition

While this extension is very popular, with nearly **1 million installations**, it is not a tool developed by the Angular team or affiliated to Google in any way.

It is months of *unpaid* work by a single contributor.

So you will see some new features marked with a diamond 💎. It means they are only available in the new Pro edition, which requires a paid subscription, so I could continue my contributions.

Enjoy advanced features and support a contributor at the same time! 💖
- additional schematics (page, reactive services, unit tests,...)
- advanced options (imports for standalone components, entry files exports,...)
- legacy schematics (components with NgModules, class guards,...)
- custom schematics in a much simpler way than with the Angular CLI
- predefined paths to enforce an architecture

You will find details about all these features directly in the extension documention.

💎 **[Try the Pro edition for free](https://cyrilletuzi.gumroad.com/l/schematicspro)** 💎

## Release Notes

[Changelog available here](https://github.com/cyrilletuzi/vscode-angular-schematics/blob/main/CHANGELOG.md).
