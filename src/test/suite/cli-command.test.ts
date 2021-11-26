/* eslint-disable @typescript-eslint/no-non-null-assertion */
import * as vscode from 'vscode';
import * as path from 'path';
import * as assert from 'assert';
import { describe, before, it } from 'mocha';

import { angularCollectionName, defaultComponentTypes } from '../../defaults';
import { WorkspaceFolderConfig } from '../../workspace';
import { CliCommand } from '../../generation/cli-command';

import { rootProjectName, libProjectName, materialCollectionName, userComponentTypeLabel, subAppProjectName, defaultsWorkspaceFolderUri, customizedWorkspaceFolderUri, angularEslintWorkspaceFolderUri } from './test-config';
import { COMPONENT_TYPE, ShortcutsTypes, MODULE_TYPE } from '../../workspace/shortcuts';

describe('Cli command', () => {

    let workspaceFolderDefaults: WorkspaceFolderConfig;
    let workspaceFolderCustomized: WorkspaceFolderConfig;
    let workspaceFolderAngularESLint: WorkspaceFolderConfig;

    before(async function () {

        this.timeout(5000);

        workspaceFolderDefaults = new WorkspaceFolderConfig(vscode.workspace.workspaceFolders![0]!);
        await workspaceFolderDefaults.init();

        workspaceFolderCustomized = new WorkspaceFolderConfig(vscode.workspace.workspaceFolders![1]!);
        await workspaceFolderCustomized.init();

        workspaceFolderAngularESLint = new WorkspaceFolderConfig(vscode.workspace.workspaceFolders![2]!);
        await workspaceFolderAngularESLint.init();

    });

    it('Basic component', async () => {

        const cliCommand = new CliCommand(workspaceFolderDefaults);
        cliCommand.setProjectName(rootProjectName);
        cliCommand.setCollectionName(angularCollectionName);
        cliCommand.setSchematic(workspaceFolderDefaults.collections.getCollection(angularCollectionName)!.getSchematic('component')!);
        await cliCommand.validateProject();
        cliCommand.setNameAsFirstArg('hello');

        assert.strictEqual(`ng g component hello`, cliCommand.getCommand());
        assert.strictEqual(vscode.Uri.joinPath(defaultsWorkspaceFolderUri, 'src', 'app', 'hello', 'hello.component.ts').path, cliCommand.guessGereratedFileUri()?.path);

    });

    it('Basic service', async () => {

        const cliCommand = new CliCommand(workspaceFolderDefaults);
        cliCommand.setProjectName(rootProjectName);
        cliCommand.setCollectionName(angularCollectionName);
        cliCommand.setSchematic(workspaceFolderDefaults.collections.getCollection(angularCollectionName)!.getSchematic('service')!);
        await cliCommand.validateProject();
        cliCommand.setNameAsFirstArg('hello');

        assert.strictEqual(`ng g service hello`, cliCommand.getCommand());
        assert.strictEqual(vscode.Uri.joinPath(defaultsWorkspaceFolderUri, 'src', 'app', 'hello.service.ts').path, cliCommand.guessGereratedFileUri()?.path);

    });

    it('Basic module', async () => {

        const cliCommand = new CliCommand(workspaceFolderDefaults);
        cliCommand.setProjectName(rootProjectName);
        cliCommand.setCollectionName(angularCollectionName);
        cliCommand.setSchematic(workspaceFolderDefaults.collections.getCollection(angularCollectionName)!.getSchematic('module')!);
        await cliCommand.validateProject();
        cliCommand.setNameAsFirstArg('hello');

        assert.strictEqual(`ng g module hello`, cliCommand.getCommand());
        assert.strictEqual(vscode.Uri.joinPath(defaultsWorkspaceFolderUri, 'src', 'app', 'hello', 'hello.module.ts').path, cliCommand.guessGereratedFileUri()?.path);

    });

    it('Basic interface', async () => {

        const cliCommand = new CliCommand(workspaceFolderDefaults);
        cliCommand.setProjectName(rootProjectName);
        cliCommand.setCollectionName(angularCollectionName);
        cliCommand.setSchematic(workspaceFolderDefaults.collections.getCollection(angularCollectionName)!.getSchematic('interface')!);
        await cliCommand.validateProject();
        cliCommand.setNameAsFirstArg('hello');

        assert.strictEqual(`ng g interface hello`, cliCommand.getCommand());
        assert.strictEqual(vscode.Uri.joinPath(defaultsWorkspaceFolderUri, 'src', 'app', 'hello.ts').path, cliCommand.guessGereratedFileUri()?.path);

    });

    it('With project', async () => {

        const cliCommand = new CliCommand(workspaceFolderCustomized);
        cliCommand.setProjectName(libProjectName);
        cliCommand.setCollectionName(angularCollectionName);
        cliCommand.setSchematic(workspaceFolderCustomized.collections.getCollection(angularCollectionName)!.getSchematic('component')!);
        await cliCommand.validateProject();
        cliCommand.setNameAsFirstArg('hello');

        assert.strictEqual(`ng g ${angularCollectionName}:component hello --project ${libProjectName}`, cliCommand.getCommand());
        assert.strictEqual(vscode.Uri.joinPath(customizedWorkspaceFolderUri, 'projects', libProjectName, 'src', 'lib', 'hello.component.ts').path, cliCommand.guessGereratedFileUri()?.path);

    });

    it('With collection', async () => {

        const cliCommand = new CliCommand(workspaceFolderCustomized);
        cliCommand.setProjectName(rootProjectName);
        cliCommand.setCollectionName(materialCollectionName);
        cliCommand.setSchematic(workspaceFolderCustomized.collections.getCollection(materialCollectionName)!.getSchematic('table')!);
        await cliCommand.validateProject();
        cliCommand.setNameAsFirstArg('hello');

        assert.strictEqual(`ng g ${materialCollectionName}:table hello`, cliCommand.getCommand());
        assert.strictEqual(vscode.Uri.joinPath(customizedWorkspaceFolderUri, 'src', 'app', 'hello', 'hello.component.ts').path, cliCommand.guessGereratedFileUri()?.path);

    });

    it('With path', async () => {

        const cliCommand = new CliCommand(workspaceFolderDefaults);
        cliCommand.setProjectName(rootProjectName);
        cliCommand.setCollectionName(angularCollectionName);
        cliCommand.setSchematic(workspaceFolderDefaults.collections.getCollection(angularCollectionName)!.getSchematic('component')!);
        await cliCommand.validateProject();
        cliCommand.setNameAsFirstArg('hello/world');

        assert.strictEqual(`ng g component hello/world`, cliCommand.getCommand());
        assert.strictEqual(vscode.Uri.joinPath(defaultsWorkspaceFolderUri, 'src', 'app', 'hello', 'world', 'world.component.ts').path, cliCommand.guessGereratedFileUri()?.path);

    });

    describe('with options', () => {

        it('string', async () => {

            const cliCommand = new CliCommand(workspaceFolderDefaults);
            cliCommand.setProjectName(rootProjectName);
            cliCommand.setCollectionName(angularCollectionName);
            cliCommand.setSchematic(workspaceFolderDefaults.collections.getCollection(angularCollectionName)!.getSchematic('component')!);
            await cliCommand.validateProject();
            cliCommand.setNameAsFirstArg('hello');
            cliCommand.addOptions([['changeDetection', 'OnPush']]);

            assert.strictEqual(`ng g component hello --change-detection OnPush`, cliCommand.getCommand());

        });

        it('boolean', async () => {

            const cliCommand = new CliCommand(workspaceFolderDefaults);
            cliCommand.setProjectName(rootProjectName);
            cliCommand.setCollectionName(angularCollectionName);
            cliCommand.setSchematic(workspaceFolderDefaults.collections.getCollection(angularCollectionName)!.getSchematic('component')!);
            await cliCommand.validateProject();
            cliCommand.setNameAsFirstArg('hello');
            cliCommand.addOptions([['export', 'true']]);

            assert.strictEqual(`ng g component hello --export`, cliCommand.getCommand());

        });

        it('array', async () => {

            const cliCommand = new CliCommand(workspaceFolderDefaults);
            cliCommand.setProjectName(rootProjectName);
            cliCommand.setCollectionName(angularCollectionName);
            cliCommand.setSchematic(workspaceFolderDefaults.collections.getCollection(angularCollectionName)!.getSchematic('guard')!);
            await cliCommand.validateProject();
            cliCommand.setNameAsFirstArg('hello');
            cliCommand.addOptions([['implements', ['CanActivate', 'CanDeactivate']]]);

            assert.strictEqual(`ng g guard hello --implements CanActivate --implements CanDeactivate`, cliCommand.getCommand());

        });

        it('multiple', async () => {

            const cliCommand = new CliCommand(workspaceFolderDefaults);
            cliCommand.setProjectName(rootProjectName);
            cliCommand.setCollectionName(angularCollectionName);
            cliCommand.setSchematic(workspaceFolderDefaults.collections.getCollection(angularCollectionName)!.getSchematic('component')!);
            await cliCommand.validateProject();
            cliCommand.setNameAsFirstArg('hello');
            cliCommand.addOptions([['export', 'true'], ['changeDetection', 'OnPush']]);

            assert.strictEqual(`ng g component hello --export --change-detection OnPush`, cliCommand.getCommand());

        });

        it('invalid', async () => {

            const cliCommand = new CliCommand(workspaceFolderDefaults);
            cliCommand.setProjectName(rootProjectName);
            cliCommand.setCollectionName(angularCollectionName);
            cliCommand.setSchematic(workspaceFolderDefaults.collections.getCollection(angularCollectionName)!.getSchematic('component')!);
            await cliCommand.validateProject();
            cliCommand.setNameAsFirstArg('hello');
            cliCommand.addOptions([['elmo', 'true']]);

            assert.strictEqual(`ng g component hello`, cliCommand.getCommand());

        });

    });

    describe('With component types', () => {

        let types: ShortcutsTypes;

        before(() => {
            types = workspaceFolderDefaults.getComponentTypes(rootProjectName);
        });

        it('Default', async () => {

            const cliCommand = new CliCommand(workspaceFolderDefaults);
            cliCommand.setProjectName(rootProjectName);
            cliCommand.setCollectionName(angularCollectionName);
            cliCommand.setSchematic(workspaceFolderDefaults.collections.getCollection(angularCollectionName)!.getSchematic('component')!);
            await cliCommand.validateProject();
            cliCommand.setNameAsFirstArg('hello');
            cliCommand.addOptions(types.get(COMPONENT_TYPE.DEFAULT)!.options);

            assert.strictEqual(`ng g component hello`, cliCommand.getCommand());

        });

        it('Page without type', async () => {

            const cliCommand = new CliCommand(workspaceFolderDefaults);
            cliCommand.setProjectName(rootProjectName);
            cliCommand.setCollectionName(angularCollectionName);
            cliCommand.setSchematic(workspaceFolderDefaults.collections.getCollection(angularCollectionName)!.getSchematic('component')!);
            await cliCommand.validateProject();
            cliCommand.setNameAsFirstArg('hello');
            cliCommand.addOptions(types.get(COMPONENT_TYPE.PAGE)!.options);

            assert.strictEqual(`ng g component hello --skip-selector`, cliCommand.getCommand());

        });

        it('Page with type from TSLint suffixes', async () => {

            const cliCommand = new CliCommand(workspaceFolderCustomized);
            cliCommand.setProjectName(rootProjectName);
            cliCommand.setCollectionName(angularCollectionName);
            cliCommand.setSchematic(workspaceFolderCustomized.collections.getCollection(angularCollectionName)!.getSchematic('component')!);
            await cliCommand.validateProject();
            cliCommand.setNameAsFirstArg('hello');

            const typesCustomized = workspaceFolderCustomized.getComponentTypes(rootProjectName);
            cliCommand.addOptions(typesCustomized.get(COMPONENT_TYPE.PAGE)!.options);

            assert.strictEqual(`ng g ${angularCollectionName}:component hello --type page --skip-selector`, cliCommand.getCommand());
            assert.strictEqual(vscode.Uri.joinPath(customizedWorkspaceFolderUri, 'src', 'app', 'hello.page.ts').path, cliCommand.guessGereratedFileUri()?.path);

        });

        it('Page with type from ESLint suffixes', async () => {

            const cliCommand = new CliCommand(workspaceFolderAngularESLint);
            cliCommand.setProjectName(rootProjectName);
            cliCommand.setCollectionName(angularCollectionName);
            cliCommand.setSchematic(workspaceFolderAngularESLint.collections.getCollection(angularCollectionName)!.getSchematic('component')!);
            await cliCommand.validateProject();
            cliCommand.setNameAsFirstArg('hello');

            const typesCustomized = workspaceFolderAngularESLint.getComponentTypes(rootProjectName);
            cliCommand.addOptions(typesCustomized.get(COMPONENT_TYPE.PAGE)!.options);

            assert.strictEqual(`ng g component hello --type page --skip-selector`, cliCommand.getCommand());
            assert.strictEqual(vscode.Uri.joinPath(angularEslintWorkspaceFolderUri, 'src', 'app', 'hello', 'hello.page.ts').path, cliCommand.guessGereratedFileUri()?.path);

        });

        it('Pure', async () => {

            const cliCommand = new CliCommand(workspaceFolderDefaults);
            cliCommand.setProjectName(rootProjectName);
            cliCommand.setCollectionName(angularCollectionName);
            cliCommand.setSchematic(workspaceFolderDefaults.collections.getCollection(angularCollectionName)!.getSchematic('component')!);
            await cliCommand.validateProject();
            cliCommand.setNameAsFirstArg('hello');
            cliCommand.addOptions(types.get(COMPONENT_TYPE.PURE)!.options);

            assert.strictEqual(`ng g component hello --change-detection OnPush`, cliCommand.getCommand());

        });

        it('Exported', async () => {

            const cliCommand = new CliCommand(workspaceFolderDefaults);
            cliCommand.setProjectName(rootProjectName);
            cliCommand.setCollectionName(angularCollectionName);
            cliCommand.setSchematic(workspaceFolderDefaults.collections.getCollection(angularCollectionName)!.getSchematic('component')!);
            await cliCommand.validateProject();
            cliCommand.setNameAsFirstArg('hello');
            cliCommand.addOptions(types.get(COMPONENT_TYPE.EXPORTED)!.options);

            assert.strictEqual(`ng g component hello --export --change-detection OnPush`, cliCommand.getCommand());

        });

        it('From user preferences', async () => {

            const cliCommand = new CliCommand(workspaceFolderCustomized);
            cliCommand.setProjectName(rootProjectName);
            cliCommand.setCollectionName(angularCollectionName);
            cliCommand.setSchematic(workspaceFolderCustomized.collections.getCollection(angularCollectionName)!.getSchematic('component')!);
            await cliCommand.validateProject();
            cliCommand.setNameAsFirstArg('hello');

            const typesCustomized = workspaceFolderCustomized.getComponentTypes(rootProjectName);
            assert.strictEqual(true, typesCustomized.has(userComponentTypeLabel));

            cliCommand.addOptions(typesCustomized.get(userComponentTypeLabel)!.options);
            assert.strictEqual(`ng g ${angularCollectionName}:component hello --skip-selector --prefix custom`, cliCommand.getCommand());

        });

        it('From lib', async () => {

            const cliCommand = new CliCommand(workspaceFolderCustomized);
            cliCommand.setProjectName(rootProjectName);
            cliCommand.setCollectionName(angularCollectionName);
            cliCommand.setSchematic(workspaceFolderCustomized.collections.getCollection(angularCollectionName)!.getSchematic('component')!);
            await cliCommand.validateProject();
            cliCommand.setNameAsFirstArg('hello');

            const typesCustomized = workspaceFolderCustomized.getComponentTypes(subAppProjectName);
            assert.strictEqual(true, typesCustomized.has(defaultComponentTypes[0]!.label));

            cliCommand.addOptions(typesCustomized.get(defaultComponentTypes[0]!.label)!.options);
            assert.strictEqual(`ng g ${angularCollectionName}:component hello --type dialog --skip-selector`, cliCommand.getCommand());
            assert.strictEqual(vscode.Uri.joinPath(customizedWorkspaceFolderUri, 'src', 'app', 'hello.dialog.ts').path, cliCommand.guessGereratedFileUri()?.path);

        });

    });

    describe('With module types', () => {

        let types: ShortcutsTypes;

        before(() => {
            types = workspaceFolderDefaults.getModuleTypes();
        });

        it('Default', async () => {

            const cliCommand = new CliCommand(workspaceFolderDefaults);
            cliCommand.setProjectName(rootProjectName);
            cliCommand.setCollectionName(angularCollectionName);
            cliCommand.setSchematic(workspaceFolderDefaults.collections.getCollection(angularCollectionName)!.getSchematic('module')!);
            await cliCommand.validateProject();
            cliCommand.setNameAsFirstArg('hello');
            cliCommand.addOptions(types.get(MODULE_TYPE.DEFAULT)!.options);
            cliCommand.addOptions([['module', 'app']]);

            assert.strictEqual(`ng g module hello --module app`, cliCommand.getCommand());

        });

        it('Lazy', async () => {

            const cliCommand = new CliCommand(workspaceFolderDefaults);
            cliCommand.setProjectName(rootProjectName);
            cliCommand.setCollectionName(angularCollectionName);
            cliCommand.setSchematic(workspaceFolderDefaults.collections.getCollection(angularCollectionName)!.getSchematic('module')!);
            await cliCommand.validateProject();
            cliCommand.setNameAsFirstArg('hello');
            cliCommand.addOptions(types.get(MODULE_TYPE.LAZY)!.options);
            cliCommand.addOptions([['route', cliCommand.getRouteFromFirstArg()]]);

            assert.strictEqual(`ng g module hello --module app --route hello`, cliCommand.getCommand());

        });

        it('Lazy with path', async () => {

            const cliCommand = new CliCommand(workspaceFolderDefaults);
            cliCommand.setProjectName(rootProjectName);
            cliCommand.setCollectionName(angularCollectionName);
            cliCommand.setSchematic(workspaceFolderDefaults.collections.getCollection(angularCollectionName)!.getSchematic('module')!);
            await cliCommand.validateProject();
            cliCommand.setNameAsFirstArg('hello/world');
            cliCommand.addOptions(types.get(MODULE_TYPE.LAZY)!.options);
            cliCommand.addOptions([['route', cliCommand.getRouteFromFirstArg()]]);

            assert.strictEqual(`ng g module hello/world --module app --route world`, cliCommand.getCommand());

        });

        it('Routing', async () => {

            const cliCommand = new CliCommand(workspaceFolderDefaults);
            cliCommand.setProjectName(rootProjectName);
            cliCommand.setCollectionName(angularCollectionName);
            cliCommand.setSchematic(workspaceFolderDefaults.collections.getCollection(angularCollectionName)!.getSchematic('module')!);
            await cliCommand.validateProject();
            cliCommand.setNameAsFirstArg('hello');
            cliCommand.addOptions(types.get(MODULE_TYPE.ROUTING)!.options);

            assert.strictEqual(`ng g module hello --module app --routing`, cliCommand.getCommand());

        });

    });

    describe('Context path', () => {

        it('none', () => {

            const cliCommand = new CliCommand(workspaceFolderDefaults);

            assert.strictEqual('', cliCommand['contextPath'].relativeToWorkspaceFolder);
            assert.strictEqual('', cliCommand['contextPath'].relativeToProjectFolder);

            assert.strictEqual('', cliCommand.getProjectName());

            assert.strictEqual('', cliCommand.getContextForNameAsFirstArg());

        });

        it('workspace folder', () => {

            const cliCommand = new CliCommand(workspaceFolderDefaults, defaultsWorkspaceFolderUri);

            assert.strictEqual('', cliCommand['contextPath'].relativeToWorkspaceFolder);
            assert.strictEqual('', cliCommand['contextPath'].relativeToProjectFolder);

            assert.strictEqual('', cliCommand.getProjectName());

            assert.strictEqual('', cliCommand.getContextForNameAsFirstArg());

        });

        it('src folder', () => {

            const contextUri = vscode.Uri.joinPath(defaultsWorkspaceFolderUri, 'src');
            const cliCommand = new CliCommand(workspaceFolderDefaults, contextUri);

            assert.strictEqual('src', cliCommand['contextPath'].relativeToWorkspaceFolder);
            assert.strictEqual('', cliCommand['contextPath'].relativeToProjectFolder);

            assert.strictEqual(rootProjectName, cliCommand.getProjectName());

            assert.strictEqual('', cliCommand.getContextForNameAsFirstArg());

        });

        it('src/app folder', () => {

            const contextUri = vscode.Uri.joinPath(defaultsWorkspaceFolderUri, 'src', 'app');
            const cliCommand = new CliCommand(workspaceFolderDefaults, contextUri);

            assert.strictEqual('src/app', cliCommand['contextPath'].relativeToWorkspaceFolder);
            assert.strictEqual('', cliCommand['contextPath'].relativeToProjectFolder);

            assert.strictEqual(rootProjectName, cliCommand.getProjectName());

            assert.strictEqual('', cliCommand.getContextForNameAsFirstArg());

        });

        it('folder', () => {

            const contextUri = vscode.Uri.joinPath(defaultsWorkspaceFolderUri, 'src', 'app', 'hello');
            const cliCommand = new CliCommand(workspaceFolderDefaults, contextUri);

            assert.strictEqual('src/app/hello', cliCommand['contextPath'].relativeToWorkspaceFolder);
            assert.strictEqual('hello', cliCommand['contextPath'].relativeToProjectFolder);

            assert.strictEqual(rootProjectName, cliCommand.getProjectName());

            assert.strictEqual('hello/', cliCommand.getContextForNameAsFirstArg());

        });

        it('subfolder', () => {

            const contextUri = vscode.Uri.joinPath(defaultsWorkspaceFolderUri, 'src', 'app', 'hello', 'world');
            const cliCommand = new CliCommand(workspaceFolderDefaults, contextUri);

            assert.strictEqual('src/app/hello/world', cliCommand['contextPath'].relativeToWorkspaceFolder);
            assert.strictEqual('hello/world', cliCommand['contextPath'].relativeToProjectFolder);

            assert.strictEqual(rootProjectName, cliCommand.getProjectName());

            assert.strictEqual('hello/world/', cliCommand.getContextForNameAsFirstArg());

        });

        it('file', () => {

            const contextUri = vscode.Uri.joinPath(defaultsWorkspaceFolderUri, 'src', 'app', 'hello', 'world.ts');
            const cliCommand = new CliCommand(workspaceFolderDefaults, contextUri);

            assert.strictEqual('src/app/hello/world.ts', cliCommand['contextPath'].relativeToWorkspaceFolder);
            assert.strictEqual('hello/world.ts', cliCommand['contextPath'].relativeToProjectFolder);

            assert.strictEqual(rootProjectName, cliCommand.getProjectName());

            assert.strictEqual('hello/', cliCommand.getContextForNameAsFirstArg());

        });

        it('lib', () => {

            const contextUri = vscode.Uri.joinPath(customizedWorkspaceFolderUri, 'projects', libProjectName, 'src', 'lib', 'hello', 'world');
            const cliCommand = new CliCommand(workspaceFolderCustomized, contextUri);

            assert.strictEqual(path.posix.join('projects', libProjectName, 'src/lib/hello/world'), cliCommand['contextPath'].relativeToWorkspaceFolder);
            assert.strictEqual('hello/world', cliCommand['contextPath'].relativeToProjectFolder);

            assert.strictEqual(libProjectName, cliCommand.getProjectName());

            assert.strictEqual('hello/world/', cliCommand.getContextForNameAsFirstArg());

        });

        it('subapp', () => {

            const contextUri = vscode.Uri.joinPath(customizedWorkspaceFolderUri, 'projects', subAppProjectName, 'src', 'app', 'hello', 'world');
            const cliCommand = new CliCommand(workspaceFolderCustomized, contextUri);

            assert.strictEqual(path.posix.join('projects', subAppProjectName, 'src/app/hello/world'), cliCommand['contextPath'].relativeToWorkspaceFolder);
            assert.strictEqual('hello/world', cliCommand['contextPath'].relativeToProjectFolder);

            assert.strictEqual(subAppProjectName, cliCommand.getProjectName());

            assert.strictEqual('hello/world/', cliCommand.getContextForNameAsFirstArg());

        });

        it('@schematics/angular:library', () => {

            const contextUri = vscode.Uri.joinPath(defaultsWorkspaceFolderUri, 'src', 'app', 'hello', 'world');
            const cliCommand = new CliCommand(workspaceFolderDefaults, contextUri);
            cliCommand.setCollectionName(angularCollectionName);
            cliCommand.setSchematic(workspaceFolderDefaults.collections.getCollection(angularCollectionName)!.getSchematic('library')!);

            assert.strictEqual('src/app/hello/world', cliCommand['contextPath'].relativeToWorkspaceFolder);
            assert.strictEqual('hello/world', cliCommand['contextPath'].relativeToProjectFolder);

            assert.strictEqual(rootProjectName, cliCommand.getProjectName());

            assert.strictEqual('', cliCommand.getContextForNameAsFirstArg());

        });

        it('@schematics/angular:application', () => {

            const contextUri = vscode.Uri.joinPath(defaultsWorkspaceFolderUri, 'src', 'app', 'hello', 'world');
            const cliCommand = new CliCommand(workspaceFolderDefaults, contextUri);
            cliCommand.setCollectionName(angularCollectionName);
            cliCommand.setSchematic(workspaceFolderDefaults.collections.getCollection(angularCollectionName)!.getSchematic('application')!);

            assert.strictEqual('src/app/hello/world', cliCommand['contextPath'].relativeToWorkspaceFolder);
            assert.strictEqual('hello/world', cliCommand['contextPath'].relativeToProjectFolder);

            assert.strictEqual(rootProjectName, cliCommand.getProjectName());

            assert.strictEqual('', cliCommand.getContextForNameAsFirstArg());

        });

    });

});
