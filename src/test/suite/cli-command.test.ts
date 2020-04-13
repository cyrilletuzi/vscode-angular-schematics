import * as vscode from 'vscode';
import * as assert from 'assert';
import { describe, before, it } from 'mocha';

import { angularCollectionName, defaultComponentTypes } from '../../defaults';
import { WorkspaceFolderConfig } from '../../workspace';
import { CliCommand } from '../../generation/cli-command';

import { rootProjectName, libProjectName, materialCollectionName, userComponentTypeLabel, subAppProjectName } from './test-config';
import { COMPONENT_TYPE, ShortcutsTypes, MODULE_TYPE } from '../../workspace/shortcuts';

describe('Cli command', () => {

    let workspaceFolderDefaults: WorkspaceFolderConfig;
    let workspaceFolderCustomized: WorkspaceFolderConfig;

    before(async () => {

        workspaceFolderDefaults = new WorkspaceFolderConfig(vscode.workspace.workspaceFolders![0]);
        await workspaceFolderDefaults.init();

        workspaceFolderCustomized = new WorkspaceFolderConfig(vscode.workspace.workspaceFolders![1]);
        await workspaceFolderCustomized.init();

    });

    it('Basic', () => {

        const cliCommand = new CliCommand(workspaceFolderDefaults);
        cliCommand.setProjectName(rootProjectName);
        cliCommand.setCollectionName(angularCollectionName);
        cliCommand.setSchematic(workspaceFolderDefaults.collections.getCollection(angularCollectionName)!.getSchematic('component')!);
        cliCommand.validateProject();
        cliCommand.setNameAsFirstArg('hello');

        assert.strictEqual(`ng g component hello`, cliCommand.getCommand());

    });

    it('With project', () => {

        const cliCommand = new CliCommand(workspaceFolderDefaults);
        cliCommand.setProjectName(libProjectName);
        cliCommand.setCollectionName(angularCollectionName);
        cliCommand.setSchematic(workspaceFolderDefaults.collections.getCollection(angularCollectionName)!.getSchematic('component')!);
        cliCommand.validateProject();
        cliCommand.setNameAsFirstArg('hello');

        assert.strictEqual(`ng g component hello --project ${libProjectName}`, cliCommand.getCommand());

    });

    it('With collection', () => {

        const cliCommand = new CliCommand(workspaceFolderCustomized);
        cliCommand.setProjectName(rootProjectName);
        cliCommand.setCollectionName(materialCollectionName);
        cliCommand.setSchematic(workspaceFolderCustomized.collections.getCollection(materialCollectionName)!.getSchematic('table')!);
        cliCommand.validateProject();
        cliCommand.setNameAsFirstArg('hello');

        assert.strictEqual(`ng g ${materialCollectionName}:table hello`, cliCommand.getCommand());

    });

    it('With path', () => {

        const cliCommand = new CliCommand(workspaceFolderDefaults);
        cliCommand.setProjectName(rootProjectName);
        cliCommand.setCollectionName(angularCollectionName);
        cliCommand.setSchematic(workspaceFolderDefaults.collections.getCollection(angularCollectionName)!.getSchematic('component')!);
        cliCommand.validateProject();
        cliCommand.setNameAsFirstArg('hello/world');

        assert.strictEqual(`ng g component hello/world`, cliCommand.getCommand());

    });

    it('With a string option', () => {

        const cliCommand = new CliCommand(workspaceFolderDefaults);
        cliCommand.setProjectName(rootProjectName);
        cliCommand.setCollectionName(angularCollectionName);
        cliCommand.setSchematic(workspaceFolderDefaults.collections.getCollection(angularCollectionName)!.getSchematic('component')!);
        cliCommand.validateProject();
        cliCommand.setNameAsFirstArg('hello');
        cliCommand.addOptions([['changeDetection', 'OnPush']]);

        assert.strictEqual(`ng g component hello --changeDetection OnPush`, cliCommand.getCommand());

    });

    it('With a boolean option', () => {

        const cliCommand = new CliCommand(workspaceFolderDefaults);
        cliCommand.setProjectName(rootProjectName);
        cliCommand.setCollectionName(angularCollectionName);
        cliCommand.setSchematic(workspaceFolderDefaults.collections.getCollection(angularCollectionName)!.getSchematic('component')!);
        cliCommand.validateProject();
        cliCommand.setNameAsFirstArg('hello');
        cliCommand.addOptions([['export', 'true']]);

        assert.strictEqual(`ng g component hello --export`, cliCommand.getCommand());

    });

    it('With an array option', () => {

        const cliCommand = new CliCommand(workspaceFolderDefaults);
        cliCommand.setProjectName(rootProjectName);
        cliCommand.setCollectionName(angularCollectionName);
        cliCommand.setSchematic(workspaceFolderDefaults.collections.getCollection(angularCollectionName)!.getSchematic('guard')!);
        cliCommand.validateProject();
        cliCommand.setNameAsFirstArg('hello');
        cliCommand.addOptions([['implements', ['CanActivate', 'CanDeactivate']]]);

        assert.strictEqual(`ng g guard hello --implements CanActivate --implements CanDeactivate`, cliCommand.getCommand());

    });

    it('With 2 options', () => {

        const cliCommand = new CliCommand(workspaceFolderDefaults);
        cliCommand.setProjectName(rootProjectName);
        cliCommand.setCollectionName(angularCollectionName);
        cliCommand.setSchematic(workspaceFolderDefaults.collections.getCollection(angularCollectionName)!.getSchematic('component')!);
        cliCommand.validateProject();
        cliCommand.setNameAsFirstArg('hello');
        cliCommand.addOptions([['export', 'true'], ['changeDetection', 'OnPush']]);

        assert.strictEqual(`ng g component hello --export --changeDetection OnPush`, cliCommand.getCommand());

    });

    describe('With component types', () => {

        let types: ShortcutsTypes;

        before(() => {
            types = workspaceFolderDefaults.getComponentTypes(rootProjectName);
        });

        it('Default', () => {

            const cliCommand = new CliCommand(workspaceFolderDefaults);
            cliCommand.setProjectName(rootProjectName);
            cliCommand.setCollectionName(angularCollectionName);
            cliCommand.setSchematic(workspaceFolderDefaults.collections.getCollection(angularCollectionName)!.getSchematic('component')!);
            cliCommand.validateProject();
            cliCommand.setNameAsFirstArg('hello');
            cliCommand.addOptions(types.get(COMPONENT_TYPE.DEFAULT)!.options);

            assert.strictEqual(`ng g component hello`, cliCommand.getCommand());

        });

        it('Page without type', () => {

            const cliCommand = new CliCommand(workspaceFolderDefaults);
            cliCommand.setProjectName(rootProjectName);
            cliCommand.setCollectionName(angularCollectionName);
            cliCommand.setSchematic(workspaceFolderDefaults.collections.getCollection(angularCollectionName)!.getSchematic('component')!);
            cliCommand.validateProject();
            cliCommand.setNameAsFirstArg('hello');
            cliCommand.addOptions(types.get(COMPONENT_TYPE.PAGE)!.options);

            assert.strictEqual(`ng g component hello --skipSelector`, cliCommand.getCommand());

        });

        it('Page with type', () => {

            const cliCommand = new CliCommand(workspaceFolderCustomized);
            cliCommand.setProjectName(rootProjectName);
            cliCommand.setCollectionName(angularCollectionName);
            cliCommand.setSchematic(workspaceFolderCustomized.collections.getCollection(angularCollectionName)!.getSchematic('component')!);
            cliCommand.validateProject();
            cliCommand.setNameAsFirstArg('hello');

            const typesCustomized = workspaceFolderCustomized.getComponentTypes(rootProjectName);
            cliCommand.addOptions(typesCustomized.get(COMPONENT_TYPE.PAGE)!.options);

            assert.strictEqual(`ng g ${angularCollectionName}:component hello --type page --skipSelector`, cliCommand.getCommand());

        });

        it('Pure', () => {

            const cliCommand = new CliCommand(workspaceFolderDefaults);
            cliCommand.setProjectName(rootProjectName);
            cliCommand.setCollectionName(angularCollectionName);
            cliCommand.setSchematic(workspaceFolderDefaults.collections.getCollection(angularCollectionName)!.getSchematic('component')!);
            cliCommand.validateProject();
            cliCommand.setNameAsFirstArg('hello');
            cliCommand.addOptions(types.get(COMPONENT_TYPE.PURE)!.options);
            
            assert.strictEqual(`ng g component hello --changeDetection OnPush`, cliCommand.getCommand());

        });

        it('Exported', () => {

            const cliCommand = new CliCommand(workspaceFolderDefaults);
            cliCommand.setProjectName(rootProjectName);
            cliCommand.setCollectionName(angularCollectionName);
            cliCommand.setSchematic(workspaceFolderDefaults.collections.getCollection(angularCollectionName)!.getSchematic('component')!);
            cliCommand.validateProject();
            cliCommand.setNameAsFirstArg('hello');
            cliCommand.addOptions(types.get(COMPONENT_TYPE.EXPORTED)!.options);
            
            assert.strictEqual(`ng g component hello --export --changeDetection OnPush`, cliCommand.getCommand());

        });

        it('From user preferences', () => {

            const cliCommand = new CliCommand(workspaceFolderCustomized);
            cliCommand.setProjectName(rootProjectName);
            cliCommand.setCollectionName(angularCollectionName);
            cliCommand.setSchematic(workspaceFolderCustomized.collections.getCollection(angularCollectionName)!.getSchematic('component')!);
            cliCommand.validateProject();
            cliCommand.setNameAsFirstArg('hello');

            const typesCustomized = workspaceFolderCustomized.getComponentTypes(rootProjectName);
            assert.strictEqual(true, typesCustomized.has(userComponentTypeLabel));

            cliCommand.addOptions(typesCustomized.get(userComponentTypeLabel)!.options);
            assert.strictEqual(`ng g ${angularCollectionName}:component hello --skipSelector --entryComponent`, cliCommand.getCommand());

        });

        it('From lib', () => {

            const cliCommand = new CliCommand(workspaceFolderCustomized);
            cliCommand.setProjectName(rootProjectName);
            cliCommand.setCollectionName(angularCollectionName);
            cliCommand.setSchematic(workspaceFolderCustomized.collections.getCollection(angularCollectionName)!.getSchematic('component')!);
            cliCommand.validateProject();
            cliCommand.setNameAsFirstArg('hello');

            const typesCustomized = workspaceFolderCustomized.getComponentTypes(subAppProjectName);
            assert.strictEqual(true, typesCustomized.has(defaultComponentTypes[0].label));

            cliCommand.addOptions(typesCustomized.get(defaultComponentTypes[0].label)!.options);
            assert.strictEqual(`ng g ${angularCollectionName}:component hello --type dialog --skipSelector`, cliCommand.getCommand());

        });

    });

    describe('With module types', () => {

        let types: ShortcutsTypes;

        before(() => {
            types = workspaceFolderDefaults.getModuleTypes();
        });

        it('Default', () => {

            const cliCommand = new CliCommand(workspaceFolderDefaults);
            cliCommand.setProjectName(rootProjectName);
            cliCommand.setCollectionName(angularCollectionName);
            cliCommand.setSchematic(workspaceFolderDefaults.collections.getCollection(angularCollectionName)!.getSchematic('module')!);
            cliCommand.validateProject();
            cliCommand.setNameAsFirstArg('hello');
            cliCommand.addOptions(types.get(MODULE_TYPE.DEFAULT)!.options);
            cliCommand.addOptions([['module', 'app']]);

            assert.strictEqual(`ng g module hello --module app`, cliCommand.getCommand());

        });

        it('Lazy', () => {

            const cliCommand = new CliCommand(workspaceFolderDefaults);
            cliCommand.setProjectName(rootProjectName);
            cliCommand.setCollectionName(angularCollectionName);
            cliCommand.setSchematic(workspaceFolderDefaults.collections.getCollection(angularCollectionName)!.getSchematic('module')!);
            cliCommand.validateProject();
            cliCommand.setNameAsFirstArg('hello');
            cliCommand.addOptions(types.get(MODULE_TYPE.LAZY)!.options);
            cliCommand.addOptions([['route', cliCommand.getRouteFromFirstArg()]]);

            assert.strictEqual(`ng g module hello --module app --route hello`, cliCommand.getCommand());

        });

        it('Lazy with path', () => {

            const cliCommand = new CliCommand(workspaceFolderDefaults);
            cliCommand.setProjectName(rootProjectName);
            cliCommand.setCollectionName(angularCollectionName);
            cliCommand.setSchematic(workspaceFolderDefaults.collections.getCollection(angularCollectionName)!.getSchematic('module')!);
            cliCommand.validateProject();
            cliCommand.setNameAsFirstArg('hello/world');
            cliCommand.addOptions(types.get(MODULE_TYPE.LAZY)!.options);
            cliCommand.addOptions([['route', cliCommand.getRouteFromFirstArg()]]);

            assert.strictEqual(`ng g module hello/world --module app --route world`, cliCommand.getCommand());

        });

        it('Routing', () => {

            const cliCommand = new CliCommand(workspaceFolderDefaults);
            cliCommand.setProjectName(rootProjectName);
            cliCommand.setCollectionName(angularCollectionName);
            cliCommand.setSchematic(workspaceFolderDefaults.collections.getCollection(angularCollectionName)!.getSchematic('module')!);
            cliCommand.validateProject();
            cliCommand.setNameAsFirstArg('hello');
            cliCommand.addOptions(types.get(MODULE_TYPE.ROUTING)!.options);

            assert.strictEqual(`ng g module hello --module app --routing`, cliCommand.getCommand());

        });

    });

});
