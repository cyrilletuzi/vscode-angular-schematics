# Angular Schematics documentation

<br>

### Compact folders setting

A VS Code default behavior
[combines single folders together](https://code.visualstudio.com/updates/v1_41#_compact-folders-in-explorer).
While it might be a good idea in general, it is annoying with this extension,
as clicking on the right directory where you want to generate something becomes more confusing.

So you should consider disabling this setting in your VS Code *workspace* preferences:
`"explorer.compactFolders": false`

<br>

## Default options

[`schematics` option of `angular.json`](https://github.com/angular/angular-cli/wiki/angular-workspace)
allows to save default options for schematics commands.

For example, if you want all your generated components templates to be inline, in *all* your projects,
just add in `angular.json`:
```json
{
  "schematics": {
    "@schematics/angular:component": {
      "inlineTemplate": true
} } }
```

Or only in a specific project:
```json
{
  "projects": {
    "yourprojectname": {
      "schematics": {
        "@schematics/angular:component": {
          "inlineTemplate": true
} } } } }
```

It can be interesting for the following options:
- `@schematics/angular:component`
  - `inlineTemplate`
  - `inlineStyle`
  - `style`
  - `prefix`
  - `changeDetection`
  - `viewEncapsulation`
  - `displayBlock`
- all schematics
  - `flat`
  - `skipTests`

## Libraries schematics

By default, this extension detects the following schematics:
- `@schematics/angular` (official Angular CLI commands)
- `@angular/material`
- `@ionic/angular-toolkit`
- `@ngrx/schematics`
- `@ngxs/schematics`
- `@nativescript/schematics`
- `@ngx-formly/schematics`
- `primeng-schematics`
- `@ngx-kit/collection`
- `ngx-spec`
- `./schematics/collection.json`

Scanning all packages to find all potential schematics would be too slow.
If you are a library author, you can open a Pull Request to easily add your schematics package in the
[`src/defaults.ts`](https://github.com/cyrilletuzi/vscode-angular-schematics/blob/main/src/defaults.ts).

<br>
