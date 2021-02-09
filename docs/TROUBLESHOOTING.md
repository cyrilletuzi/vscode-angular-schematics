# Troubleshooting

A correctly installed Angular CLI project,
in a [LTS supported version](https://angular.io/guide/releases#support-policy-and-schedule),
should meet the following requirements automatically.

If you do not use the official Angular CLI project structure and configuration,
the extension may still work, with limited features,
by doing the following instructions.

1. **Angular CLI installed globally**

Your *VS Code* Terminal must know the `ng` command.

`npm install @angular/cli -g`

2. **Using the right shell**

The previous command should be done directly in the *VS Code* Terminal.

If you installed the Angular CLI with an *external* terminal and a *custom shell*,
you should [configure your VS Code Terminal](https://code.visualstudio.com/docs/editor/integrated-terminal) accordingly.

3. **Angular Schematics installed locally**

The official `@schematics/angular` package should be installed in your project's `node_modules`.

`npm install @schematics/angular --save-dev`

4. **Angular configuration file**

An `angular.json` file must exist, with at least:

```json
{
    "version": 1
}
```

5. **Other issues**

If you have issues with the extension itself, everything is logged in the
"Angular Schematics" Output channel (second tab left to the Terminal).

Check if there are warnings or errors, and try to correct your configuration accordingly
*before* opening a GitHub issue.

[Back to general documentation](../README.md)
