# Angular schematics extension for Visual Studio Code

## Why this extension?

Angular and Ionic are frameworks to build applications: it is a lot more work than just a few bits of jQuery. You have to create hundred of components and services. There are 4 ways to do this (from the slowest to the quickest):
- manually from scratch, rewriting all the boilerplate code everytime
- via snippets: as they are static, there is still a lot to do manually
- via Angular CLI: more powerful, but still tedious: you have to type a long and error-prone command line
- via [this extension](https://marketplace.visualstudio.com/items?itemName=cyrilletuzi.angular-schematics): just right-click the destination folder, and start coding (no command line!)

![](https://github.com/cyrilletuzi/vscode-angular-schematics/raw/main/angular-schematics-demo-20191025.gif)

### Productivity!

So this extension will save you time:

- Simple interface for Angular CLI: **no command line required**
- **Many options are pre-filled**
- **The generated file will auto open**
- No more typo errors
- No more search in documentation: all options available are described

## Getting started

Follow instructions on [Visual Studio Code marketplace](https://marketplace.visualstudio.com/items?itemName=cyrilletuzi.angular-schematics), or just search for "Angular schematics" by "Cyrille Tuzi" directly inside VS Code Extensions view.

## Documentation

**The documentation is directly included in the extension via the VS Code walkthrough feature**. The walkthrough will appear automatically the first time you install the extension, please take a few minutes to read it.

**You can come back to it at any time from the VS Code menu:**
1. View
2. Command Palette
3. search "Documentation"
4. choose "Angular Schematics: Documentation and tutorial"

## Requirements and troubleshooting

This extension requires the last version of Visual Studio Code.

Basically, in your project, if `ng g component hello` works in the *VS Code* Terminal, the extension should work.

**If the Angular CLI is not working in the *VS Code* Terminal, please correct that first *before* opening a GitHub issue.**

The walkthrough includes a full [troubleshooting guide](https://github.com/cyrilletuzi/vscode-angular-schematics/blob/main/walkthroughs/troubleshooting.md) to help you, be sure to read it in case of problem.

## Become a Pro!

The Angular Schematics extension for Visual Studio Code started as a tool to help my trainees during the Angular courses I teach. It has now been installed **800 000 times**.

While still having a ton of automation ideas to increase productivity, good practices, optimization and architecture in Angular (and Ionic) projects, I have reached the limit of work I can do voluntarily (we are talking of *months* of full time *unpaid* work).

So instead of throwing in the bin all my ideas that could greatly enhance the every day developer experience of so many people, I decided to release new features in **[Schematics Pro](https://www.cyrilletuzi.com/schematics-pro/)**, which contains:
- more advanced features for Angular
- schematics for other frameworks too: React, Vue, Ionic, Svelte, Stencil, Lit, Nest and more
- easy and fast custom schematics creation

**[Learn more about Schematics Pro](https://www.cyrilletuzi.com/schematics-pro/)**

## Release Notes

[Changelog available here](https://github.com/cyrilletuzi/vscode-angular-schematics/blob/main/CHANGELOG.md).

## License

MIT
