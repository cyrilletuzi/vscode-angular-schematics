# Support of Ionic projects

If you use Ionic, it configures by default its own custom schematics in `angular.json`:

```json
{
    "cli": {
        "defaultCollection": "@ionic/angular-toolkit"
    }
}
```

Unfortunately, these schematics are completely outdated
(some important options like `--change-detection` are missing),
and some are even buggy (the lazy-loaded module schematic is failing).

While Ionic custom schematics were useful in Ionic <= 3,
because Ionic added special things on top of Angular,
they are now useless in Ionic >= 4, which is just standard Angular.

So you should remove the above line of config in your `angular.json`,
to take advantage of the official and up to date Angular CLI schematics instead.

[Back to general documentation](../README.md)
