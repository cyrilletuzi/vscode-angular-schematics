import * as vscode from 'vscode';

const schematicsProExtensionId = 'cyrilletuzi.schematicspro';
const schematicsProConfigurationId = 'schematicspro';
const delayKey = 'schematicsProDelayKey';
const counterKey = 'schematicsProCounterKey';

const informationMessages = [
    `Thanks for using Angular Schematics. Do you know Schematics Pro, an improved version of this extension?`,
    `This open source extension is the result of months of unpaid work. Wanna help AND get more features?`,
    `Ever dreamed to be able to generate files for React, Vue and other frameworks like you do for Angular?`,
    `Do you want to create your own advanced schematics in a just a few minutes?`,
    `Tired of this dozen of messy imports in each file? What about entry files automation?`,
];

function getRandomIntInclusive(min: number, max: number): number {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1) + min);
}

export function isSchematicsProActive(): boolean {
    return !!(vscode.extensions.getExtension(schematicsProExtensionId)?.isActive && !vscode.workspace.getConfiguration(schematicsProConfigurationId).get('forceAngularSchematicsExtension'));
}

export async function schematicsProInfo(extensionContext: vscode.ExtensionContext): Promise<void> {

    if (!vscode.extensions.getExtension(schematicsProExtensionId)) {

        const previousTimestamp = extensionContext.globalState.get<number>(delayKey);
        const previousCounter = extensionContext.globalState.get<number>(counterKey) ?? 0;

        if (!previousTimestamp) {

            await extensionContext.globalState.update(delayKey, Date.now());
            await extensionContext.globalState.update(counterKey, 0);

            return;

        }

        const newCounter = previousCounter + 1;

        if ((Date.now() - previousTimestamp) > (518400000 * newCounter)) {

            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const informationMesage = (newCounter <= informationMessages.length) ? informationMessages[newCounter]! : informationMessages[getRandomIntInclusive(1, informationMessages.length)]!;

            const actionLabel = `Learn about Schematics Pro`;

            vscode.window.showInformationMessage(informationMesage, actionLabel).then((action) => {

                if (action === actionLabel) {

                    vscode.env.openExternal(vscode.Uri.parse('https://www.schematicspro.dev/')).then(() => { }, () => { });

                }

            }, () => { });

            await extensionContext.globalState.update(delayKey, Date.now());
            await extensionContext.globalState.update(counterKey, newCounter);

        }

    }

}
