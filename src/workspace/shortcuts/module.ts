import { formatCliCommandOptions } from '../../generation';

import { ShortcutsTypes, ShortcutType } from './shortcuts';

export enum MODULE_TYPE {
    DEFAULT = `$(extensions) Module of components`,
    LAZY    = `$(zap) Lazy-loaded module of pages`,
    ROUTING = `$(files) Classic module of pages`,
}

export class ModuleShortcut {

    /* Cache for module types choices */
    types: ShortcutsTypes = new Map<string, ShortcutType>();

    init(hasLazyType: boolean): void {

        /* Start from scratch as it can be called again via watcher */
        this.types.clear();

        this.types.set(MODULE_TYPE.DEFAULT, {
            choice: {
                label: MODULE_TYPE.DEFAULT,
                detail: `Module of UI / presentation components`,
            },
            options: new Map<string, string | string[]>(),
        });

        if (hasLazyType) {

            this.types.set(MODULE_TYPE.LAZY, {
                choice: {
                    label: MODULE_TYPE.LAZY,
                    detail: `Module with routing, lazy-loaded`,
                },
                options: new Map([
                    /* `route` value will be set later based on user input */
                    ['module', 'app'],
                ]),
            });

        }

        this.types.set(MODULE_TYPE.ROUTING, {
            choice: {
                label: MODULE_TYPE.ROUTING,
                detail: `Module with routing, immediately loaded`,
            },
            options: new Map([
                ['module', 'app'],
                ['routing', 'true'],
            ]),
        });

        for (const [, type] of this.types) {

            type.choice.description = formatCliCommandOptions(type.options) || 'No pre-filled option';

        }

    }

}
