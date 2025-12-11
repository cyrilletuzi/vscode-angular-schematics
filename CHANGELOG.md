# Change Log

## [7.1.0] - 2025-12-11

VS Code >= 1.105 is now required (and thus Cursor >= 2.1.32). The extension may still work in older versions, but they are not tested anymore.

## [7.0.0] - 2025-10-20

### New naming conventions

Angular 20 changed the naming conventions for class and file names:
- no more class and file names suffix for components, directives and services:
  - `ProductCardComponent` in `product-card.component.ts` => `ProductCard` in `product-card.ts`
  - `ProductApiService` in `product-api.service.ts` => `ProductApi` in `product-api.ts`
  - `MissingProductDirective` in `missing-product.directive.ts` => `MissingProduct` in `missing-product.ts`
- suffix kept for the other concepts, but file name suffix separator changed from `.` to `-`:
  - `CustomDatePipe` in `custom-date.pipe.ts` => `CustomDatePipe ` in `custom-date-pipe.ts`
  - `ProductsPage` in `products.page.ts` => `ProductsPage ` in `products-page.ts`
  - `authInterceptor` in `auth.interceptor.ts` => `authInterceptor ` in `auth-interceptor.ts`
  - `authGuard` in `auth.guard.ts` => `authGuard ` in `auth-guard.ts`
  - `dataResolver` in `data.resolver.ts` => `dataResolver ` in `data-resolver.ts`

Angular refers to these 2 different naming conventions as:
- the former 2016 style guide, up to Angular 19
- the new 2025 style guide, which is the default since Angular 20

**This extension now follows the new naming conventions by default.** But you can switch back to the legacy naming conventions in one click with the configuration helper (it must be done in each workspace).

**As a reminder, this extension is not developed by the Angular team or affiliated to Google in any way. It is months of unpaid work by a single contributor. So if you do not like this change, I am not responsible for it, and again, you can switch back to the previous behavior.**

"Copy settings from angular.json" will take into account `type` and `typeSeparator` options (which are automatically added when migrating an Angular 19 project to Angular 20 via `ng update`).

Pro edition users can additionnaly:
- set custom suffixes
- set a suffix only for the class name but not for the file name
- set a suffix only for the file name but not for the class name

Also for the Pro edition users having custom schematics with `suffix`, a new `fileNameSuffix` property is introduced for the `schematic.json` configuration. For backward compatibility, it defaults to `.suffix`, but this behavior may be removed in the future. **It is strongly recommended to add an explicit `fileNameSuffix` to all your `schematic.json` using `suffix`.**

### Other changes

- `skipClassSuffix` option for components, directives and services is removed, as it is now the default behavior
- Angular ESLint suffixes management (both in the configuration helper and the `angularEslintComponentSuffix` feature for custom schematics) is removed as it does not make sense anymore and as `angular-eslint` removed the rule from the recommended set in version 20

## [6.23.0] - 2024-12-27

In the Pro edition, you can now enable automatic classes prefixes, for example to generate `MatButtonComponent` instead of `ButtonComponent` (given "mat" is set as the selector prefix). It is useful when doing a library of components.

As usual, use the configuration helper to set this option.

## [6.22.0] - 2024-12-26

In the Pro edition, you can now disable automatic classes suffixes, for example to generate `SomeButton` instead of `SomeButtonComponent`, or `SomeApiClient` instead of `SomeApiClientService`.

This option allows to partly align with the upcoming [new Angular style guide](https://gist.github.com/jelbourn/0158b02cfb426e69c172db4ec92e3c0c), being discussed in [this RFC](https://github.com/angular/angular/discussions/58412).

It has also been the standard in some design systems libraries since always, like Angular Material itself (it is `MatButton`, not `MatButtonComponent`).

As usual, use the configuration helper to set this option.

## [6.21.0] - 2024-12-11

Add the following imports in the Pro edition:
- AG Grid (module and standalone)
- AG Charts (module and standalone)

## [6.20.0] - 2024-12-10

Add the following imports in the Pro edition:
- ngx-translate v16 standalone directive and pipe
- ng-select v13.7 standalone component
- all ngx-bootstrap v18.1 standalone components and directives
- all Kendo v16.6 standalone components and directives
- ngxs/form-plugin v18 standalone directive
- ng2-chart v6 standalone directive
- ngx-highlightjs v10 standalone directives
- ngx-quill v21 standalone components

## [6.19.0] - 2024-12-08

Add the following imports in the Pro edition:
- Angular Material v19 `MatTimepicker` (and related)
- Ionic v8 `IonInputPasswordToggle`
- all PrimeNG v18 standalone components and directives
- PrimeNG v17.12 `InputOtpModule`, `StepperModule`
- PrimeNG v17.9 `MeterGroupModule`, `FloatLabelModule`, `InputIconModule`, `IconFieldModule`
- PrimeNG v17.0 `InputGroupModule`, `InputGroupAddonModule`
- all NG-Zorro v17.1 standalone components and directives

## [6.18.0] - 2024-11-17

- Support for standalone components being the default in Angular 19.
- Remove the default `CommonModule` import in standalone components in the free edition.

## [6.17.0] - 2024-10-23

Preparation for standalone components being the default in Angular 19.

## [6.16.0] - 2024-10-13

- Alternative way to access the documentation in alternative editors like Cursor which do no support the VS Code "walkthrough" feature.

## [6.15.1] - 2024-09-28

- In the Pro edition, fix a case where prefix is not asked when creating a custom schematic, resulting in an inadequate schematic id like `-component`.
- In the Pro edition, fix a case where custom schematics' file names were incorrect, like `some-name..component.ts`, when suffix is empty.

## [6.15.0] - 2024-09-27

In the Pro edition, simplify the Angular Material schematic, and promote it to stable.

## [6.14.0] - 2024-09-27

### Features

- Preparation for standalone components being the default in Angular 19.
- VS Code >= 1.92 is now required. The extension may still work in older versions, but they are not tested anymore.

### Bug fix

- Fixes an issue which was breaking the "Create a custom schematic" button in the Pro edition, and the generation from the Command Palette.

## [6.13.0] - 2024-08-07

New schematics for Angular Material in the Pro edition:
- type safe dialog,
- type safe table.

The Angular Material table schematic is in beta for now, because it uses Angular features like input signals which are still in developer preview. Feedback is welcome on GitHub Discussions about this schematic.

## [6.12.0] - 2024-08-05

New schematic for routes in the Pro edition. Note that:
- they are lazy-loaded by default, but you can use the configuration helper to use eager-loading instead
- as a consequence, legacy schematic for routes with NgModule has been renamed from `angular-module-routing` to `angular-routes`

## [6.11.2] - 2024-08-03

1 million installations celebration! If you did not try the Pro edition yet, now is the time.

## [6.10.0] - 2024-08-01

VS Code >= 1.90 is now required. The extension may still work in older versions, but they are not tested anymore.

In the Pro edition, default schematics options now support Angular CLI monorepos, they can be configured per-Angular project. As usual, use the configuration helper.

## [6.9.0] - 2024-02-02

When generating a standalone component:
- imports list now includes Ionic standalone components and directives for projects using Ionic Angular >= 7.5 ([official documentation here](https://ionicframework.com/docs/angular/build-options#standalone))

## [6.8.0] - 2024-02-02

When generating a standalone component:
- imports list now includes Material standalone components and directives for projects using Material >= 17.1 (note it was a very tedious manual and error-prone work, if you think some component or directive is missing or erroneous, please file an issue on GitHub)
- imports list is sorted better

## [6.7.0] - 2024-01-02

Add Kendo Angular modules in imports list when generating a standalone component.

## [6.6.0] - 2023-12-08

"Copy angular.json settings" in the configuration helper now takes into account settings from some alternative schematics (like `@ionic/angular-toolkit`).

## [6.5.0] - 2023-12-07

angular.json configuration management has been enhanced:
- angular.json in a subfolder is now supported
- rely on `sourcePath`, as not all projects respect the `app` or `lib` source subfolder

It means:
- "Copy angular.json settings" in the configuration helper now works in more scenarios
- "Limited generation" warning should happen less frequently and only when relevant

## [6.4.0] - 2023-12-05

Added back `sass` and `less` values for `style` option of component and page schematics. It will also be picked when using "Copy settings from angular.json" in the configuration helper.

## [6.3.2] - 2023-12-04

Look for package.json in nested subfolders too. It fixes the "No schematic match this project" error in projects where the front-end app is in a sub-sub-folder, like ASP.NET projects.

## [6.3.0] - 2023-11-29

Added `skipStyle` option for component and page schematics, which can be useful if your project uses Tailwind CSS.

It can be set in a click with the configuration helper, accessible from the Angular logo in the left sidebar.

## [6.2.3] - 2023-11-29

Fixes a bug in component with NgModule schematic where `skipChangeDetectionOnPush` was not honored.

## [6.2.0] - 2023-11-20

In addition to Material, PrimeNg and Ionic, a lot of third-party libraries have been to the standalone components imports picker in the Pro edition:
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

No preferences here, I just found a list of the most installed Angular libraries, and added the ones that are still maintained and with an understandable documentation. If your favorite library is missing, just ask in [GitHub issues](https://github.com/cyrilletuzi/vscode-angular-schematics/issues/new/choose), with the "Pro edition - New standalone import" form.

## [6.1.0] - 2023-11-19

In Angular >= 17 projects, components styles have been simplified as a string instead of an array. If you want to stick to array styles, a `stylesArray` option has been added to component and page schematics.

## [6.0.8] - 2023-11-19

Better Pro edition onboarding:
- places with "Try the Pro edition" are cleaned up once your license is activated
- a "Create a custom schematic" button has been added in the sidebar panel, accessible from the Angular logo in the left sidebar

## [6.0.7] - 2023-11-17

Fixes:
- a VS Code issue where the custom schematic creation command would fail in multi-workspaces projects
- standalone components imports picker not showing in projects without a valid `angular.json`
- some Pro edition features (like standalone components imports picker) still locked despite having activated a license

## [6.0.0] - 2023-11-16

Last week was the Angular renaissance, what about a renaissance of this extension? This is a major update and the beginning of a new journey.

### Angular CLI is dead, long live Angular CLI

The previous versions of this extension were a graphical interface to avoid to manually type command lines. But in the end, it was still an Angular CLI command that was automatically launched in the terminal.

Now, this extension has its own code generator, completely baked into Visual Studio Code. It means that several of your most frequent requests are now solved:
- installing Angular CLI globally is no longer needed
- having `@schematics/angular` dependencies in the project `node_modules` is no longer needed
- alternate package managers fantasies do not get in the way anymore
- terminal nightmare ends: no more shells, configurations or permissions issues
- `angular.json`, while still recommended, is no longer needed

Also, it is faster.

### Opinionated schematics defaults

Another big consequence is that the extension schematics no longer have to follow what the Angular CLI does. This extension aims to be a tool for Angular professionals, and so the defauts are now the ones my 8 years of teaching and coding with Angular have proven to be the best.

The main differences you will notice are:
- inline HTML template by default
- change detection optimization (`OnPush`) by default
- `:host { display: block; }` by default in pure components
- no spec file by default

### Configuration helper

But fear not: these are just the defaults and everything can be customized. **A lot of effort has been put in a configuration helper where you can change the settings in just a click.**

Also, for its own sake, the extension now uses its own configuration. But you can use the same configuration helper to copy settings from angular.json, especially:
- enable SCSS styles
- enable single file components

### Documentation

A lot of effort has also been put in a whole new documentation, accessible directly inside Visual Studio Code. Please take a few minutes to read it. You can access it at any time from the Angular logo on the left sidebar, or in the VS Code menu:
1. View
2. Command Palette
3. search "Documentation"
4. choose "Angular Schematics: Documentation and tutorial"

### 💎 Pro edition

While this extension is very popular, with nearly 1 million installations, it is *not* a tool developed by the Angular team or affiliated to Google in any way.

It is months of *unpaid* work by a single contributor.

So you will see some new features marked with a diamond 💎. It means they are only available in the Pro edition.

Feel free to enjoy advanced features and support a contributor at the same time! 💖

- additional schematics (page, reactive services, unit tests,...)
- advanced options (imports for standalone components, entry files exports,...)
- legacy schematics (components with NgModules, class guards,...)
- custom schematics in a much simpler way than with the Angular CLI
- predefined paths to enforce an architecture

You will find details about all these features directly in the extension documention.

💎 **[Try the Pro edition for free](https://cyrilletuzi.gumroad.com/l/schematicspro/angular-renaissance)** 💎

And to celebrate the Angular renaissance, price is currently 50% off. 🎉

## [5.4.0] - 2023-05-11

## [5.3.0] - 2023-03-20

## [5.2.0] - 2022-05-03

## [5.1.0] - 2021-11-18

## [5.0.1] - 2021-10-05

## [5.0.0] - 2021-08-23

## [4.12.0] - 2021-03-17

## [4.10.1] - 2021-02-09

## [4.10.0] - 2021-02-08

## [4.9.0] - 2021-02-07

## [4.8.0] - 2021-01-03

## [4.7.0] - 2020-12-07

## [4.6.1] - 2020-11-13

## [4.6.0] - 2020-11-05

## [4.5.0] - 2020-10-05

## [4.3.0] - 2020-06-12

## [4.2.0] - 2020-06-12

## [4.1.0] - 2020-05-26

## [4.0.5] - 2020-05-08

## [4.0.4] - 2020-05-04

## [4.0.3] - 2020-04-16

## [4.0.1] - 2020-04-14

## [4.0.0] - 2020-04-13

## [3.3.1] - 2020-03-19

## [3.3.0] - 2020-02-20

## [3.1.0] - 2020-02-15

## [3.0.0] - 2020-01-02

## [2.3.2] - 2019-12-23

## [2.3.1] - 2019-12-2O

## [2.2.2] - 2019-12-10

## [2.2.1] - 2019-12-06

## [2.2.0] - 2019-11-03

## [2.1.0] - 2019-10-22

## [2.0.0] - 2019-10-21

## [1.27.0] - 2019-09-08

## [1.23.0] - 2019-03-19

## [1.22.0] - 2019-03-04

## [1.21.0] - 2019-03-04

## [1.18.0] - 2019-02-23

## [1.17.0] - 2019-02-16

## [1.16.0] - 2019-02-03

## [1.13.0] - 2019-02-02

## [1.12.2] - 2019-01-29

## [1.12.1] - 2019-01-16

## [1.11.4] - 2019-01-12

## [1.11.3] - 2018-12-27

## [1.8.1] - 2018-09-25

## [1.7.0] - 2018-09-22

## [1.6.2] - 2018-09-06

## [1.6.0] - 2018-08-29

## [1.5.0] - 2018-07-26

## [1.4.0] - 2018-07-25

## [1.3.1] - 2018-07-20

## [1.3.0] - 2018-06-29

## [1.2.0] - 2018-06-24

## [1.0.1] - 2018-06-22

## [1.0.0] - 2018-06-22

## [0.6.0] - 2018-06-21

## [0.1.0] - 2018-06-16

## [0.0.1] - 2018-06-16
