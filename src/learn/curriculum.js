/**
 * curriculum.js — The Learn track registry: worlds in order, quests inside them.
 *
 * ORGANIZATION ONLY. This file says what exists, what order it comes in and where
 * to find the code for it. It holds no chemistry, no prompts and no answers: each
 * Learn quest is its own playable game module, built the way the Charge Gardens
 * was built, and it owns its own content.
 *
 * Pure data and pure functions — imported by the browser, by the API proxy and by
 * `npm run verify:learn`, so it must never touch the DOM, three.js or localStorage.
 *
 * A world is one course unit. Worlds open in order: you cannot enter world N
 * until world N-1 is finished, which makes the track a road rather than a menu.
 *
 * THE LEARN TRACK PAYS NO XP AND NEVER REACHES THE LEADERBOARD. Standings measure
 * the campaign. Nothing in here carries an `xp` field and nothing downstream may
 * add one — a study track that moved the scoreboard would turn learning into
 * grinding, and would punish the students it exists to help.
 *
 * TO ADD A WORLD: write `worlds/unitNN-<slug>.js`, export one descriptor, register
 * it in WORLD_MODULES below.
 * TO BUILD A QUEST: write its game module under `src/learn/quests/`, point the
 * quest's `module` at it and flip `status` to 'live'. See quests/_template.js.
 */

import { UNIT_01 } from './worlds/unit01-atoms.js';
import { UNIT_02 } from './worlds/unit02-molecules.js';
import { UNIT_03 } from './worlds/unit03-states-of-matter.js';
import { UNIT_04 } from './worlds/unit04-stoichiometry.js';
import { UNIT_05 } from './worlds/unit05-equilibrium.js';
import { UNIT_06 } from './worlds/unit06-acids-and-bases.js';
import { UNIT_07 } from './worlds/unit07-gases.js';
import { UNIT_08 } from './worlds/unit08-thermodynamics.js';
import { UNIT_09 } from './worlds/unit09-kinetics.js';
import { UNIT_10 } from './worlds/unit10-nuclear-chemistry.js';

const WORLD_MODULES = [
  UNIT_01, UNIT_02, UNIT_03, UNIT_04, UNIT_05,
  UNIT_06, UNIT_07, UNIT_08, UNIT_09, UNIT_10
];

/**
 * How a quest is played. This is a label for the player and a contract for the
 * builder, not an engine: every quest module mounts itself (see quests/_template.js).
 *   chamber — the 3D containment chamber, like the Charge Gardens
 *   bench   — a 3D workbench: glassware, balances, instruments
 *   field   — out on the surface of the world
 */
export const ARENAS = {
  chamber: { id: 'chamber', label: 'Containment chamber' },
  bench: { id: 'bench', label: 'Lab bench' },
  field: { id: 'field', label: 'Field survey' }
};

export const QUEST_STATUSES = ['live', 'draft'];

/** Worlds, sorted by `order` and stamped with their derived counts. */
export const WORLDS = WORLD_MODULES
  .slice()
  .sort((a, b) => a.order - b.order)
  .map(w => {
    const quests = (w.quests || []).map((q, qi) => ({
      ...q,
      index: qi,
      worldId: w.id,
      key: `${w.id}/${q.id}`,
      stageCount: q.stageCount || 0,
      status: q.status || 'draft'
    }));
    const liveQuestCount = quests.filter(q => q.status === 'live').length;
    return {
      ...w,
      quests,
      questCount: quests.length,
      liveQuestCount,
      // Derived, never hand-declared: a world is open for play exactly when at
      // least one of its quests has been built. A world file cannot claim to be
      // live while every quest in it is still a chart.
      status: liveQuestCount > 0 ? 'live' : 'draft',
      stageCount: quests.reduce((n, q) => n + q.stageCount, 0)
    };
  });

export const TOTAL_WORLDS = WORLDS.length;
export const LIVE_WORLDS = WORLDS.filter(w => w.status === 'live');

export function getWorld(worldId) {
  return WORLDS.find(w => w.id === worldId) || null;
}

export function getQuest(worldId, questId) {
  const w = getWorld(worldId);
  if (!w) return null;
  return w.quests.find(q => q.id === questId) || null;
}

/** The world immediately before this one on the road, or null for the first. */
export function previousWorld(worldId) {
  const idx = WORLDS.findIndex(w => w.id === worldId);
  return idx > 0 ? WORLDS[idx - 1] : null;
}

export function nextWorld(worldId) {
  const idx = WORLDS.findIndex(w => w.id === worldId);
  return idx >= 0 && idx < WORLDS.length - 1 ? WORLDS[idx + 1] : null;
}

/** Flat list of every quest, in road order — used by the verifier and the proxy. */
export function allQuests() {
  return WORLDS.flatMap(w => w.quests);
}

/**
 * Load a quest's game module. Returns null when the quest has no module yet, so
 * a charted-but-unbuilt quest shows a build plate instead of throwing.
 */
export async function loadQuestModule(quest) {
  if (!quest || typeof quest.module !== 'function') return null;
  try {
    const mod = await quest.module();
    return mod && typeof mod.mount === 'function' ? mod : null;
  } catch (err) {
    console.error(`Learn quest "${quest.key}" failed to load:`, err);
    return null;
  }
}
