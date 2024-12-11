# Angular Schematics - Advanced options 💎

Your Pro edition subscription includes the following advanced options:
- standalone components imports automation
- entry files export automation
- interceptor provider automation

<br>

## Standalone components done right

Angular 14 introduced standalone components, with the official intent to simplify things by getting rid of NgModules. But it also means that now, you have to import everything single component, directive or pipe you use in every component.

Your Pro edition allows you to directly pick the components, directives and pipes you need.

Currently, it supports:
- Angular (NgIf, NgFor, RouterLink, FormsModule,...)
- Ionic (module and standalone)
- Material (module and standalone)
- PrimeNG (module and standalone)
- Kendo Angular (module and standalone)
- @ngx-translate/core (module and standalone)
- @ng-select/ng-select (module and standalone)
- AG Grid and AG Charts (module and standalone)
- @ng-bootstrap/ng-bootstrap
- ngx-bootstrap (module and standalone)
- @asymmetrik/ngx-leaflet
- @ngxs/form-plugin (module and standalone)
- angular-gridster2
- highcharts-angular
- ng-zorro-antd (module and standalone)
- ng2-charts (module and standalone)
- ng2-dragula
- ng2-file-upload
- ngx-clipboard
- ngx-color-picker
- ngx-countdown
- ngx-echarts
- ngx-file-drop
- ngx-highlightjs (module and standalone)
- ngx-infinite-scroll
- ngx-pagination
- ngx-quill (module and standalone)
- ngx-spinner

And if your project uses other Angular libraries you would like to be added, just ask in [GitHub issues](https://github.com/cyrilletuzi/vscode-angular-schematics/issues/new/choose), with the "Pro edition - New standalone import" form!

<br>

## Entry files export automation

If your project uses entry files (`index.ts`, sometimes called "barrels"), how many times did you forget to export a new thing you added? 

With your Pro edition, when generating something inside a folder with an entry file, you will be asked if it is public or private: if you choose "Public", the newly generated thing will automatically be added to the `index.ts` exports.

<br>

## Interceptor provider automation

An interceptor class alone does nothing. To be used, it must be added to a provider, what your Pro edition does automatically.

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
