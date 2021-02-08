import * as path from 'path';
import * as process from 'process';
import * as minimist from 'minimist';

import { runTests } from 'vscode-test';

async function main(): Promise<void> {
	try {
		// The folder containing the Extension Manifest package.json
		// Passed to `--extensionDevelopmentPath`
		const extensionDevelopmentPath = path.resolve(__dirname, '../../');

		// The path to test runner
		// Passed to --extensionTestsPath
		const extensionTestsPath = path.resolve(__dirname, './suite/index');

        const testWorkspace = path.resolve(extensionDevelopmentPath, 'test-workspaces/test.code-workspace');

        const args = minimist(process.argv.slice(2));

        const argVersion: unknown = args?.['version'];

        const version = (typeof argVersion === 'string') ? argVersion : 'stable';

		// Download VS Code, unzip it and run the integration test
		await runTests({
            version,
			extensionDevelopmentPath,
			extensionTestsPath,
			launchArgs: [testWorkspace, '--disable-extensions'],
		});
	} catch (err) {
		console.error('Failed to run tests');
		process.exit(1);
	}
}

main().catch(() => {});
