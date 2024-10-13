# Angular Schematics - Predefined paths 💎

Your Pro edition subscription allows you to assign a specific schematic to a path. Why?
- saves time (one less step when generating)
- allows to enforce an architecture

<br>

## Predefined paths configuration

In your projects, you probably follow some kind of architecture. Let us keep it simple and say you put components in `src/app/components` and services in `/src/app/services`.

With your Pro edition, you can predefine the schematic associated to those folders. That will be one less step when generating a component or service.

VS Code settings example:

```json
{
  "angular-schematics.pathsWithPredefinedSchematic": [{
    "path": "src/app/components",
    "schematicId": "angular-component"
  }, {
    "path": "src/app/services",
    "schematicId": "angular-service"
  }]
}
```

<br>

## Enforce architecture

But it is not just about saving time. Are you the team lead? You can also **enforce these architecture settings**, to force your whole team to stay on track.

Combine that with the custom schematics feature, and you can **enforce how all things are done in the project**.

VS Code settings example:

```json
{
  "angular-schematics.pathsWithPredefinedSchematic": [{
    "path": "src/app/components",
    "schematicId": "angular-component"
  }, {
    "path": "src/app/services",
    "schematicId": "angular-service"
  }, {
    "path": "src/app/pages",
    "schematicId": "angular-page"
  }],
  "angular-schematics.enforceArchitecture": "error"
}
```

`enforceArchitecture` accepts:
- `error`: will restrict generation in other paths
- `warn`: will warn the user but allows to do it anyway

<br>
<br>

### Multiple schematics allowed

VS Code settings example:
```json
{
  "angular-schematics.pathsWithPredefinedSchematic": [{
    "path": "src/app/core-declarations",
    "schematicId": [
      "angular-component",
      "angular-directive",
      "angular-pipe"
    ]
  }]
}
```

<br>

### Globs

VS Code settings example:

```json
{
  "angular-schematics.pathsWithPredefinedSchematic": [{
    "path": "src/app/**/pages",
    "schematicId": "angular-page"
  }]
}
```

`minimatch` library is used, you can refer to [its documentation](https://github.com/isaacs/minimatch).

Be careful to not to define overlapping paths, otherwise the first match will be used.

<br>

### List of schematicsId

The list of schematics ids will be suggested on autocomplete, but here is a full list:

- angular-service
- angular-component
- angular-page
- angular-directive
- angular-pipe
- angular-sync-reactive-service
- angular-async-reactive-service
- angular-guard
- angular-interceptor
- angular-resolver
- angular-unit-test
- typescript-interface
- typescript-class

<br>

## Other guides

- [Documentation homepage](./documentation.md)
- [First generation](./firstGeneration.md)
- [Troubleshooting](./troubleshooting.md)
- [Configuration](./configuration.md)
- [Additional schematics 💎](./advancedSchematics.md)
- [Advanced options 💎](./advancedOptions.md)
- [Legacy features 💎](./legacy.md)
- [Custom schematics 💎](./customSchematics.md)
- [Test schematics 💎](./testing.md)

<br>
