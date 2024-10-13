# Angular Schematics - Create a custom schematic 💎

Your Pro edition subscription allows you to create your own schematics. It is not just about saving time with some code snippets, it is also a way to enforce good practices and a whole architecture in a project.

Summary:
- Create your first schematic
- Schematic structure
- Handlebars templating
- schematic.json
- Schematic options
- Schematic features
- Share schematics between projects
- Disable predefined schematics
- Advanced configuration

<br>

## Create your first schematic

1. Launch the "Create a custom schematic" command
2. Choose a unique prefix (example: "mycompany") (first time only)
3. Choose a unique id (example: "angular-component")
4. Choose a human readable name (example: "Component")
5. Choose a model to start from (component, service or from scratch)
6. Edit the opened template file with the code you want to generate

<br>

## Schematic structure

The steps above generate a folder with the following structure:
- a `schematic.json` configuration file
- a `files` subfolder with one or more Handlebars templates files (`{{fileName}}.ts.hbs`)

Optionally, you can:
- change the main template file name (be sure to change the `mainFile` property accordingly in `schematic.json`)
- add more templates files to generate in `files` (and even subfolders)

<br>

## Handlebars templating

The extension uses Handlebars (`.hbs` files) as the templating syntax, which is widely known and directly supported by VS Code. You can refer to the full [official documentation](https://handlebarsjs.com/guide), but here is a reminder of the basic syntax:

Available expressions:
- `{{name}}`               hello-world (raw user input)
- `{{fileName}}`           hello-world or hello-world.suffix (kebab-cased user input)
- `{{className}}`          HelloWorld or HelloWorldSuffix (PascalCased user input)
- `{{camelName}}`          helloWorld or helloWorldSuffix (camelCased user input)
- `{{options.someOption}}` value of an option defined in schematic.json

Additional expression in TypeScript / JavaScript schematics:
- `{{{quote}}}`            " or ' (depending on Prettier / Editorconfig / VS Code configuration)

Note the 3 brackets for `{{{quote}}}` is not an error: the default 2 brackets syntax in Handlebars is HTML escaping the value, so with `{{quote}}` you would end up with `&quot;` instead of a real quote in the final generated file. 

Conditions:
- `{{#if options.someOption}}some code{{/if}}`
- `{{#unless options.someOption}}some code{{/unless}}`

Available helpers:
- `{{dasherize name}}` hello-world
- `{{classify name}}`  HelloWorld
- `{{camelize name}}`  helloWorld

Template example:
```hbs
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class {{className}} {

  constructor() {}

}
```

<br>

## schematic.json

`schematic.json` required properties:
- `id` (must be unique)
- `label`
- `collection`
- `mainFile`: the file opened when generation ends (must be the exact file name that is in "files" folder, example: "{{fileName}}.ts.hbs")

Optional properties:
- `collection`: category shown when choosing schematics
- `description`: directly visible below the schematic label
- `tooltipDescription`: displayed when the user click on the "?" icon
- `pathSubfolder`: should the new files be generated directly inside the destination path (example: /path/to/hello-world.component.ts), which is the default, or inside a subfolder (example: path/to/hello-world/hello-world.component.ts), which is often a better option when multiple files are generated
- `suffix`: lowercased suffix for file and class names (example: "component" suffix will result in hello-world.component file name and HelloWorldComponent class name)
- `dependenciesRequired`: dependencies required to enable this schematic (example: ["@angular/core"]), it only makes sense if you share schematics between projects (otherwise if you create a schematic for a specific project, you already know you want to activate it)
- `features`: list of special features enabled for this schematic, see below
- `options`: list of options configurable by the user, see below

<br>

## Schematic options

As a general advice, **custom schematics should have as few options as possible**. For example, a `style` option to choose between CSS and SCSS makes no sense in a custom schematic, as one of the goals is to enforce one way of doing things in your project. So use directly the good style extension. Even if you plan to share schematics between projects, it will often be easier and quicker to adapt schematics in each project than to manage options.

Options names must be in camelCase (example: "externalTemplate"), and must define:
- `description`: as there is a display space limit, must be short; if the option is `required`, the description will be used as prompt, so it should be in the form of a question (example: "What type of style file do you want?")
- `type`: `boolean`, `string` or `array` (of strings)

Example:
```json
{
  "options": {
    "externalTemplate": {
      "description": "Do you want an external template instead of an inline one?",
      "type": "boolean"
    }
  }
}
```

String and array `type` can have a list of fixed values:
- `enum`
- `enumDescriptions`: optional descriptions for the `enum` values in the same order, or for boolean `type` description for true then for false

Example:
```json
{
  "options": {
    "style": {
      "description": "What type of style do you use?",
      "type": "string",
      "enum": ["css", "scss"],
      "enumDescriptions": ["Native CSS styles", "Sass styles"]
    }
  }
}
```

Optionally, they can define:
- `required`: if enabled, the option will be automatically asked to the user on generation; otherwise and by default, the option will be configurable in an optional step before the generation confirmation
- `suggestToSetAsDefault`: if enabled, the UI will propose to the user to set the value chosen as the default for next generations (for now, only works for boolean `type` and string `type` with `enum`)
- `default`: default value (must match the option `type`; booleans are already false by default)

Then, you can use the options in your Handlebars templates files:

```hbs
{{#if options.externalTemplate}}{{/if}}
{{options.style}}
```

As the Handlebars mantra is "no logic in templates", you can just write conditions checking if an option is truthy or falsy, but not if an option equals a specific value. Consequently:
- keep your options as simple as possible (for example, when an option has only 2 possible values, do a boolean option, not an enum)
- boolean options default value should be `false` (so for example, if a schematic includes tests by default, do `skipTests` instead of doing `tests` with true as default)

Also, options with `enum` will create additional expressions available in templates.

<details>
<summary>Example of string enum in schematic.json</summary>

```json
{
  "options": {
    "notation": {
      "type": "string",
      "enum": [
        "class",
        "function"
      ]
    }
  }
}
```

```hbs
{{#if options.notationFunction}}some code{{/if}}
```
</details>

<details>
<summary>Example of array enum in schematic.json</summary>

```json
{
  "options": {
    "implements": {
      "type": "array",
      "enum": [
        "CanActivate",
        "CanDeactivate"
      ]
    }
  }
}
```

```hbs
{{#if options.implements.CanActivate}}some code{{/if}}
{{#if options.implements.CanDeactivate}}some other code{{/if}}
```
</details>

<br>

## Schematic features

One of the goal of the Pro edition is to give you the ability to create your own advanced schematics (not just static code snippets) while keep it as simple as possible (unlike tools like Angular CLI).

As you have seen adove, the templating syntax is very simple. Advanced operations will be handled directly by the extension via `features`.

Note that some features imply to reserve some `options` names to them.

<br>

### General features

<details>
<summary>exportableInEntryFile</summary>

When an `index.ts` exists in the destination path or in a parent folder, the UI will automatically ask the user if the entity is public (and thus should be added to the `index.ts` exports) or private (no export); should be enabled for nearly all schematics generating an exportable entity (class, const, function,...).

Options reserved: `export`
</details>
<br>

### Angular features

<details>
<summary>angular</summary>

Should be enabled for all Angular schematics. Activates low-level Angular features, like checking the generation is done in a project configured in `angular.json`.
</details>
<details>
<summary>angularEslintComponentSuffix</summary>

Should be enabled for Angular component schematics using a `suffix` different from "component" (example: "page"). If Angular ESLint is installed, it will automatically configure it to allow this suffix.
</details>
<details>
<summary>angularAddComponentRoute</summary>

For Angular page component schematic, will ask and add a route in the closest `.routes.ts` or `-routing.module.ts` file.

By default, the page will be lazy-loaded (`loadComponent`).

Options reserved: `route`, `eagerLoading`
</details>
<details>
<summary>angularSelectorCamelCase</summary>

For Angular directives and pipes schematics, camelCased `{{selector}}` will be available in templates.

Options reserved: `selectorPrefix`
</details>
<details>
<summary>angularSelectorKebabCase</summary>

For Angular components schematics, kebab-cased `{{selector}}` will be available in templates.

Options reserved: `selectorPrefix`
</details>
<details>
<summary>angularImportsInsideComponent</summary>

For Angular standalone component schematics, will ask the user if they want to import something (like CommonModule, FormsModule, MatXModule, Prime, IonicModule...).

Option reserved: `imports`
</details>
<details>
<summary>angularAddInterceptorProvider</summary>

For Angular interceptors schematics, will add the provider.
</details>

<br>

### Deprecated Angular features

Angular 15 introduced standalone components to get rid of NgModules. Thus the following features should be avoided.

<details>
<summary>angularAddToModuleDeclarations</summary>

Should be enabled for all legacy Angular component, directive and pipe schematics. Will automatically declare the component, directive or pipe in the closest `NgModule`.

Option reserved: `skipDeclaration`
</details>
<details>
<summary>angularImportGeneratedModuleIntoOtherModules</summary>

For Angular modules of declarations schematics, will ask the user where to import the generated module.

Option reserved: `modules`
</details>
<details>
<summary>angularImportLazyModuleIntoOtherRoutingModule</summary>

For Angular modules of lazy-loaded routing schematics, will ask the user where to import the generated module.

Options reserved: `module`, `route`
</details>
<br>

## Share schematics between projects

Schematics are just files like any library, so you can copy/paste them, but also publish them on npm or any other public or private registry, to share them between projects. Then, in your VS Code settings.

```json
{
  "angular-schematics.additionalSchematics": "./node_modules/@mycompany/schematics"
}
```

<br>

**Disable predefined schematics**

If you want to replace a schematic already existing in the extension by your own, you can use the configuration helper to disable predefined schematics. But as one the goals of the extension is to provide sensible defaults and good practices, be sure you know what you do.

<br>

## Advanced configuration

<br>

**Local schematics prefix**

When you create your first custom schematic, a prefix will be asked, because schematics ids must be unique. It will be remembered for the next schematics creation. You can change it at any time in your VS Code settings.

<details>
<summary>Example of custom setting</summary>

```json
{
  "angular-schematics.localSchematicsPrefix": "mycompany"
}
```
</details>

<br>

**Local schematics path**

By default, new schematics will be created in a `schematics` folder. It is recommended to keep the default value, but you can change the path in your VS Code settings.

<details>
<summary>Example of custom setting</summary>

```json
{
  "angular-schematics.localSchematicsPath": "./some-other-folder"
}
```
</details>

<br>

## Other guides

- [Documentation homepage](./documentation.md)
- [First generation](./firstGeneration.md)
- [Troubleshooting](./troubleshooting.md)
- [Configuration](./configuration.md)
- [Additional schematics 💎](./advancedSchematics.md)
- [Advanced options 💎](./advancedOptions.md)
- [Legacy features 💎](./legacy.md)
- [Test schematics 💎](./testing.md)
- [Predefined paths 💎](./predefinedPaths.md)

<br>
