import * as alt from 'alt-client';
import * as native from 'natives';
import * as AthenaClient from '@AthenaClient/api';

import { IWheelOptionExt } from '@AthenaShared/interfaces/wheelMenu';
import { IPed } from '@AthenaShared/interfaces/iPed';

export type NpcMenuInjection = (scriptID: number, ped: IPed, options: Array<IWheelOptionExt>) => Array<IWheelOptionExt>;

const Injections: Array<NpcMenuInjection> = [];

/**
 * Allows the current Menu Options to be modified.
 * Meaning, a callback that will modify existing options, or append new options to the menu.
 * Must always return the original wheel menu options + your changes.
 *
 * @static
 * @param {NpcMenuInjection} callback
 *
 */
export function addInjection(callback: NpcMenuInjection) {
    Injections.push(callback);
}

/**
 * Opens the wheel menu against a target npc script id.
 *
 * @static
 * @param {number} scriptID
 * @return {void}
 *
 */
export function open(scriptID: number): void {
    if (AthenaClient.webview.isAnyMenuOpen()) {
        return;
    }

    if (!native.isEntityAPed(scriptID)) {
        return;
    }

    const ped = AthenaClient.streamers.ped.get(scriptID);
    if (!ped) {
        return;
    }

    const coords = native.getEntityCoords(scriptID, false);
    const dist = AthenaClient.utility.vector.distance(alt.Player.local.pos, coords);
    if (dist >= 5) {
        return;
    }

    let options: Array<IWheelOptionExt> = [];

    for (const callback of Injections) {
        try {
            options = callback(scriptID, ped, options);
        } catch (err) {
            console.warn(`Got NPC Menu Injection Error: ${err}`);
            continue;
        }
    }

    if (options.length <= 0) {
        return;
    }

    AthenaClient.systems.wheelMenu.open('NPC', options);
}
