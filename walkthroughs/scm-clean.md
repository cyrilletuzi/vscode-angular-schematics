# Angular Schematics documentation

<br>

## Check your Git status

This extension uses Angular CLI to generate new components, services, etc.

While a generation mainly *add* new files, it can also *modify* existing files. For example, when generating a component, the nearest module file will be updated to add the component declaration in the `NgModule`.

So before launching a new generation, **it is strongly recommended to [check that the Git status](command:workbench.view.scm) is clean** (or any other Source Control Manager), which means there is no uncommitted files.

It will allow you to easily and quicky revert the generation if needed.

<br>
