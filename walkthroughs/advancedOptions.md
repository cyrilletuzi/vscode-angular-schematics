# Angular Schematics - Advanced options

> 💎 **Pro edition**
>
> You love this extension? Thank you! But it represents months of *unpaid* work by a single contributor. So these features are only available in the Pro Edition.
>
> **[Learn more about the Pro edition and try it for free](https://cyrilletuzi.gumroad.com/l/schematicspro/1million)**
>
> ⚡️ To celebrate 1 million installations, the Pro edition is currently 50% off for a limited time.

The Pro edition includes the following advanced options:
- standalone components imports automation
- entry files export automation
- interceptor provider automation

<br>

## Standalone components done right

Angular 14 introduced standalone components, with the official intent to simplify things by getting rid of NgModules. But it also means that now, you have to import everything single component, directive or pipe you use in every component.

The Pro edition allows you to directly pick the components, directives and pipes you need.

Currently, it supports:
- Angular (NgIf, NgFor, RouterLink, FormsModule,...)
- Ionic module and standalone components
- Material modules and standalone components
- PrimeNG modules
- Kendo Angular modules
- @ngx-translate/core
- @ng-select/ng-select
- @ng-bootstrap/ng-bootstrap
- ngx-bootstrap
- @asymmetrik/ngx-leaflet
- @ngxs/form-plugin
- angular-gridster2
- highcharts-angular
- ng-zorro-antd
- ng2-charts
- ng2-dragula
- ng2-file-upload
- ngx-clipboard
- ngx-color-picker
- ngx-countdown
- ngx-echarts
- ngx-file-drop
- ngx-highlightjs
- ngx-infinite-scroll
- ngx-pagination
- ngx-quill
- ngx-spinner

And if your project uses other Angular libraries you would like to be added, just ask in [GitHub issues](https://github.com/cyrilletuzi/vscode-angular-schematics/issues/new/choose), with the "Pro edition - New standalone import" form!

<br>

## Entry files export automation

If your project uses entry files (`index.ts`, sometimes called "barrels"), how many times did you forget to export a new thing you added? 

With the Pro edition, when generating something inside a folder with an entry file, you will be asked if it is public or private: if you choose "Public", the newly generated thing will automatically be added to the `index.ts` exports.

<br>

## Interceptor provider automation

An interceptor class alone does nothing. To be used, it must be added to a provider, what the Pro edition does automatically.

<br>

💎 **[Try the Pro edition for free](https://cyrilletuzi.gumroad.com/l/schematicspro/1million)** 💎

<br>

## Other guides

- [Documentation homepage](./documentation.md)
- [First generation](./firstGeneration.md)
- [Troubleshooting](./troubleshooting.md)
- [Configuration](./configuration.md)
- [Additional schematics 💎](./advancedSchematics.md)
- [Legacy features 💎](./legacy.md)
- [Custom schematics 💎](./customSchematics.md)
- [Test schematics 💎](./testing.md)
- [Predefined paths 💎](./predefinedPaths.md)

<br>
