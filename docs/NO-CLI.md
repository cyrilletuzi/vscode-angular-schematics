### Support of non-Angular CLI projects

If you do not use the official Angular CLI project structure and configuration,
the extension may still work, with limited features, if you met these minimal requirements:

1. Angular CLI installed globally

`npm install @angular/cli -g`

You may not install Angular CLI in your project, but your terminal should now the `ng` command.

2. Angular Schematics installed locally

`npm install @schematics/angular --save-dev`

It is the official Angular package with the common schematics (component, service...).
It is just a development dependency, it will have no consequences on your custom configuration.

3. `angular.json`

Create a `angular.json` file at the root of your project, with at least:
```json
{
    "version": 1
}
```

It is how the Angular CLI and the extension detect it is an Angular project.
Otherwise, the extension will not be activated and all Angular CLI commands will fail.

[Back to general documentation](../README.md)
