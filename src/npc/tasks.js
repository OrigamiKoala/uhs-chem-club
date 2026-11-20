/**
 * tasks.js — every world's crew side tasks in one table, for the lore notebook (`story/lore.js` resolves
 * `crew:<task id>` here) and the Case Board. Pure data, gathered from `crews.js`.
 */
import { CREW_WORLDS } from './crews.js';

export const CREW_TASKS = Object.freeze(Object.assign({}, ...CREW_WORLDS.map(w => w.tasks)));
