# Nx workspace schematics

This extension supports local schematics by adding a *relative* path in VS Code preferences. For example:

`"ngschematics.schematics": ["./schematics/collection.json"]`

But if you use Nx, as Nx doesn't follow the Angular CLI standards, you'll need additional steps:

## `collection.json`

First, you need a `tools/schematics/collection.json` file to reference all your schematics.
Here is an example:

```json
{
  "$schema": "../../node_modules/@angular-devkit/schematics/collection-schema.json",
  "schematics": {
    "your-schematics-name": {
      "description": "Lorem ipsum",
      "factory": "./your-schematics-name/index",
      "schema": "./your-schematics-name/schema.json"
    }
  }
}
```

## Transpilation

Your schematics factory needs to be transpiled to be used. To do so:

1. Add a `tools/schematics/tsconfig.schematics.json`:

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "module": "commonjs",
  }
}
```

2. From your terminal (each time your change your schematics):

```bash
./node_modules/.bin/tsc -p ./tools/schematics/tsconfig.schematics.json
```

3. Reload VS Code, and your local schematics will now be usable via the extension.
