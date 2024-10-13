# Angular Schematics - First generation

Let us generate a very basic class file.

<br>

## Check Git status

While this extension mainly *add* new files, it can also *modify* existing files. For example, when generating an Angular page, the nearest routing file will be updated to add the route.

So before launching a new generation, **it is strongly recommended to check that the Git status is clean** (or any other Source Control Manager), which means there is no uncommitted files.

It will allow you to easily and quickly revert the generation if needed.

<br>

## Automatic path detection

One of the main pain points of generation tools done via command lines (like Angular CLI) is that you must type the full path to where you want to generate something. It is very tedious and typos often happen.

This extension makes it quick and easy. **Just right-click on the folder you want: no command line, and the path is pre-filled.**

<br>

## Generate a class

1. Go to the Explorer view and **right-click on the destination folder of your choice**
2. Click on **"Angular Schematics: Generate a file"***
3. Choose the "Class" schematic*
4. Just type a name (the path is already inferred)
5. Confirm

\* See the troubleshooting guide in the next walkthrough step if you do not see this option.

<br>

## File auto opening

If the generation succeeded, **the generated file is opened automatically**: just start coding!

If the command failed, see troubleshooting in the next walkthrough step.

<br>

## Other schematics

You can now try any other schematics:

**Free edition**
- service
- standalone component
- standalone directive
- standalone pipe
- functional guard
- functional resolver
- functional interceptor
- interface
- class

**Pro edition 💎**
- all schematics from the free edition
- page
- routes
- synchronous reactive service with signal
- asynchronous reactive service with RxJS
- legacy component, directive and pipe with NgModules
- legacy class guard, resolver and interceptor
- Material (dialog, table)
- Jasmine / Jest unit test

If you do not see some schematics, see the troubleshooting guide in the next walkthrough step.

<br>

## Other guides

- [Documentation homepage](./documentation.md)
- [Troubleshooting](./troubleshooting.md)
- [Configuration](./configuration.md)
- [Additional schematics 💎](./advancedSchematics.md)
- [Advanced options 💎](./advancedOptions.md)
- [Legacy features 💎](./legacy.md)
- [Custom schematics 💎](./customSchematics.md)
- [Test schematics 💎](./testing.md)
- [Predefined paths 💎](./predefinedPaths.md)

<br>
