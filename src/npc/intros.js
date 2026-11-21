/**
 * intros.js — how each world opens its benches. Pure data, no THREE: the runtime (`three/mystery/site.js`,
 * `three/mystery/director.js`), the spot picker (`tools/npc/pick-spots.mjs`) and the checks (`verify:intros`)
 * read it.
 *
 * Each world file (`intros/<key>.js`) exports
 *   STYLE    one line on how this world opens its benches (what makes it different from the others)
 *   SYMPTOM  the world's own trouble until its boss is beaten: `lamps` ('sputter' | 'dim' | null) and `props`
 *            ([{ kind, opts, effects, near? }], placed by the picker)
 *   INTROS   questId -> { prop: { kind, opts, effects }, near?, far?, steps: [...] } — the quest's problem
 *            prop and its opening scene (step kinds in `director.js`). A quest left out opens on its question
 *            card instead (`ui/case-open.js`): a question with nothing to see needs no scene.
 * Where each prop stands is `intros/spots.js`, written by the picker.
 */
import { QUEST_STORY } from '../story/quest-story.js';
import { SPOTS } from './intros/spots.js';
import * as tallow from './intros/tallow.js';
import * as lanternfall from './intros/lanternfall.js';
import * as ligar from './intros/ligar.js';
import * as bellows from './intros/bellows.js';
import * as ember from './intros/ember.js';
import * as mirrowen from './intros/mirrowen.js';
import * as kettle from './intros/kettle.js';
import * as teeter from './intros/teeter.js';
import * as verdigris from './intros/verdigris.js';
import * as brinewire from './intros/brinewire.js';
import * as quicklight from './intros/quicklight.js';
import * as lodestone from './intros/lodestone.js';
import * as thornmere from './intros/thornmere.js';
import * as cinderhalo from './intros/cinderhalo.js';

const DATA = { tallow, lanternfall, ligar, bellows, ember, mirrowen, kettle, teeter, verdigris, brinewire, quicklight, lodestone, thornmere, cinderhalo };
const IDS = {
  tallow: 'unit01', lanternfall: 'unit02', ligar: 'unit03', bellows: 'unit04', ember: 'unit05', mirrowen: 'unit06', kettle: 'unit07',
  teeter: 'unit08', verdigris: 'unit09', brinewire: 'unit10', quicklight: 'unit11', lodestone: 'unit12', thornmere: 'unit13', cinderhalo: 'unit14'
};

export const INTRO_WORLDS = Object.freeze(Object.entries(DATA).map(([key, d]) => ({
  key, worldId: IDS[key], style: d.STYLE, symptom: d.SYMPTOM || null, intros: d.INTROS || {}
})));

/** A world's intro data by key ('lanternfall') or world id ('unit02'). */
export const introWorld = id => INTRO_WORLDS.find(w => w.key === id || w.worldId === id) || null;

/** One quest's opening, or null when it opens on its question card. */
export const introFor = (worldId, questId) => introWorld(worldId)?.intros?.[questId] || null;

/** Where a world's props stand (`intros/spots.js`). */
export const spotsFor = id => SPOTS[introWorld(id)?.key] || null;

/** A world's boss quest id. */
export function bossOf(worldId) {
  const k = Object.keys(QUEST_STORY).find(x => x.startsWith(`${worldId}/boss-`));
  return k ? k.split('/')[1] : null;
}
