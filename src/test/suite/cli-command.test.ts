import * as vscode from 'vscode';
import * as assert from 'assert';
import { describe, before, it } from 'mocha';

import { angularCollectionName } from '../../defaults';
import { WorkspaceFolderConfig } from '../../workspace';
import { CliCommand } from '../../generation/cli-command';

import { rootProjectName, libProjectName, materialCollectionName } from './test-config';

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

});
