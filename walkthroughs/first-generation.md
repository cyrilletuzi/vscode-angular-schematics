# Angular Schematics documentation

Let us generate the most basic Angular concept: a service.

<br>

## Automatic path detection

Angular CLI is a wonderful tool, but using command lines can be difficult, as you must type the full path to where you want to generate something. It is very tedious and typos often happen.

This extension makes it quick and easy. **Just right-click on the folder you want: no command line, and the path is pre-filled.**

<br>

## Generate a service

1. [Go to the Explorer view](command:workbench.view.explorer)
2. If it is a new empty Angular project, create a random folder in `src/app`
3. Right-click on the destination folder
4. Click on "Angular: Generate a service"
5. Just type a name: the path is already prefilled
6. Confirm

<br>

## File auto opening

If the generation succeeded within a reasonable time, **the generated file is opened automatically**: just start coding!

If the command failed, see troubleshooting in the next walkthrough step.

<br>

### Compact folders setting

VS Code [combines single folders together](https://code.visualstudio.com/updates/v1_41#_compact-folders-in-explorer) by default. It is annoying with this extension, as clicking on the right directory becomes more confusing.

So you should consider disabling the `Compact Folders` [VS Code *workspace* setting](command:workbench.action.openWorkspaceSettings).

<br>

