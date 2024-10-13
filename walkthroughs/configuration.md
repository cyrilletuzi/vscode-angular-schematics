# Angular Schematics - Configuration

Some common options can be customized in a one click with the configuration helper:

- Copy settings from angular.json
- Enable SCSS, Sass or Less styles ⚙️
- Disable styles ⚙️
- Enable external HTML templates ⚙️
- Enable single file components (SFC) ⚙️
- Enable or disable ngOnInit ⚙️
- Disable change detection optimization ⚙️
- Disable lazy loading ⚙️
- Disable block CSS display ⚙️
- Enable shadow DOM ⚙️
- Set the selector prefix ⚙️
- Force NgModules 💎
- Force class interceptors 💎
- Force class guards and resolvers 💎
- Disabled predefined schematics 💎

⚙️ = in the Pro edition 💎, configurable per Angular project

**You can access the configuration helper at any time from the Angular logo on the left sidebar**,  or from the VS Code menu:
1. View
2. Command Palette
3. search "configuration"
4. choose "Angular Schematics: Configuration helper"

<br>

## Where is configuration stored?

This extension stores the configuration in VS Code *workspace* settings. It means:
- it is applied only to the current opened project
- if you commit the `.vscode/settings.json` file (and you should), all your team will benefit from it
- the configuration helper assists you to set the initial settings, if you want to change them afterwards, just edit the `.vscode/settings.json` file

<br>

## Copy settings from angular.json

This extension uses its own configuration. But if you have an *official and valid* `angular.json` with some `schematics` settings, the extension can copy them. It should detect the following settings:
- SCSS, Sass or Less styles
- no style
- external HTML templates
- single file components (SFC)
- change detection optimization
- shadow DOM

<br>

## Enable SCSS, Sass or Less styles

For projects with a design system still using CSS preprocessors (like SCSS for Angular Material or PrimeNG).

<br>

## Disable styles

For projects not using styles in components and pages because of alternative tools (like Tailwind CSS).

<br>

## Enable external HTML templates

Unlike the Angular CLI, inline HTML templates are the default in this extension because:
- less files (separation of concerns is not separation of files)
- it is easier to see the data bindings connections between the HTML and the class
- it draws attention to the template length, to keep each component as small as possible
- the official [Angular Language Service extension](https://marketplace.visualstudio.com/items?itemName=Angular.ng-template) provides the same coloration and autocompletion as in HTML files

But you can switch to external HTML templates if you prefer.

<br>

## Enable single file components (SFC)

Some may want to go even further with single file components (inline HTML, inline styles and no subfolder).

<br>

## Enable or disable ngOnInit

By default in this extension:
- components does not include `ngOnInit()` (because most pure components should not handle such logic)
- pages includes `ngOnInit()` (because pages have to handle logic)

But you can enable or disable ngOnInit() as you wish.

<br>

## Disable change detection optimization

With the introduction of signals in Angular 16, the good practice is to optimize the change detection strategy of all components and pages to `OnPush`.

If your project uses Angular <=15, or if you or your team are not yet comfortable with these topics, you can disable the change detection optimization in pages and/or in components.

<br>

## Disable lazy loading

By default, for better application performances, pages are generated as lazy loaded components. But you can disable lazy loading.

<br>

## Disable block CSS display

Web components have an `inline` CSS display by default. It is a flaw of the standard, as 99% of components are in fact used as `block`s. So when generating components, `:host { display: block; }` is automatically added in styles, but you can disable it.

<br>

## Enable shadow DOM

For projects ready to use native shadow DOM view encapsulation.

<br>

## Set the selector prefix

Angular default prefix selector for components, directives and pipes is `app`.

If you want a different one, this is the only setting for which the extension uses the official `angular.json` `prefix` configuration, because this one is simple to get and in an Angular CLI monorepo, it can differ from one application or library to another.

<details>
<summary>Example of angular.json</summary>

```json
{
  "version": 1,
  "projects": {
    "some-app": {
      "projectType": "application",
      "prefix": "app"
    },
    "some-lib": {
      "projectType": "library",
      "prefix": "mycompany",
    }
  }
}
```
</details>

But it requires a *valid and official* `angular.json`, which is not the case in all projects. Only such cases, set the selector prefix via the extension configuration helper. It will be global to the workspace.

<br>

## 💎 Force NgModules

In the Pro edition, if your project uses Angular <=13 or is not ready for standalone components yet.

<br>

## 💎 Class interceptors

In the Pro edition, if your project uses Angular <=14 or is not ready for functional interceptors yet.

<br>

## 💎 Class guards and resolvers

In the Pro edition, if your project uses Angular <=14.1 or is not ready for functional guards and resolvers yet. Note [class guards and resolvers are officially deprecated](https://angular.io/guide/deprecations#router-class-and-injection-token-guards) by Angular and planned for removal.

<br>

## 💎 Disable predefined schematics

In the Pro edition, if some of the predefined schematics do not suit your project, you can disable them, and even replace them with your own custom schematics.

<br>

💎 **[Try the Pro edition for free](https://cyrilletuzi.gumroad.com/l/schematicspro/1million)** 💎

<br>

## Other guides

- [Documentation homepage](./documentation.md)
- [First generation](./firstGeneration.md)
- [Troubleshooting](./troubleshooting.md)
- [Additional schematics 💎](./advancedSchematics.md)
- [Advanced options 💎](./advancedOptions.md)
- [Legacy features 💎](./legacy.md)
- [Custom schematics 💎](./customSchematics.md)
- [Test schematics 💎](./testing.md)
- [Predefined paths 💎](./predefinedPaths.md)

<br>
