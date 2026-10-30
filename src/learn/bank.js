/**
 * bank.js — the question bank: every practice problem and worked problem in
 * the Learn track, one JSON file per world (`src/learn/bank/<worldId>.json`).
 *
 * The quest modules hold the teaching; the bank holds the revision. Nothing in
 * a quest file asks a practice question.
 *
 * File shape
 *   {
 *     "world": "unit01",
 *     "end":   [ Problem, ... ]            asked together once the world is worked
 *     "bench": {
 *       "<questId>": {
 *         "problems": [ Problem, Problem ]  two, asked after that bench's debrief
 *         "worked":   Worked | omitted      one guided problem, computational benches only
 *       }
 *     }
 *   }
 *
 *   Problem  { id, quest, question, options: [{ id, label }], answer, explanation }
 *   Worked   { id, quest, title, setup, steps: [Step], finish }
 *   Step     { say, kind: 'choice' | 'number', options?, answer, unit?, tol?, hint, explain }
 *            `say` is what the step asks; `explain` is the worked step shown after it
 *            is answered; `tol` is a relative tolerance for numbers (default 0.01).
 *
 * Ids: a world-end problem is `<questId>#<n>`, a bench problem `<questId>#b<n>`,
 * a worked problem `<questId>#w`. Stored mastery is keyed by these, so an id is
 * never reused for a different question.
 *
 * The files are plain data so Node (`tools/verify-bank.mjs`) and the browser read
 * the same thing. No XP, ever — see `learn/drills.js`.
 */

import unit01 from './bank/unit01.json' with { type: 'json' };
import unit02 from './bank/unit02.json' with { type: 'json' };
import unit03 from './bank/unit03.json' with { type: 'json' };
import unit04 from './bank/unit04.json' with { type: 'json' };
import unit05 from './bank/unit05.json' with { type: 'json' };
import unit06 from './bank/unit06.json' with { type: 'json' };
import unit07 from './bank/unit07.json' with { type: 'json' };

export const BANKS = { unit01, unit02, unit03, unit04, unit05, unit06, unit07 };

const EMPTY = { world: null, end: [], bench: {} };

export function getBank(worldId) {
  return BANKS[worldId] || EMPTY;
}

/** Stamp a problem with where it came from, so a card can name its bench. */
function stamp(p, world, questTitle) {
  return {
    ...p,
    worldId: world.id,
    worldName: world.world,
    questId: p.quest,
    questTitle: questTitle(p.quest)
  };
}

function titler(world) {
  const by = new Map(world.quests.map(q => [q.id, q.title]));
  return id => by.get(id) || id;
}

/** The two problems asked after a bench (possibly none). */
export function benchProblems(world, questId) {
  const entry = getBank(world.id).bench[questId];
  const title = titler(world);
  return (entry?.problems || []).map(p => stamp(p, world, title));
}

/** The guided problem a bench offers, or null. */
export function benchWorked(world, questId) {
  const w = getBank(world.id).bench[questId]?.worked;
  if (!w) return null;
  return { ...w, worldId: world.id, worldName: world.world, questId: w.quest || questId, questTitle: titler(world)(questId) };
}

/** Every guided problem in a world, road order. */
export function worldWorked(world) {
  return world.quests
    .filter(q => q.status === 'live')
    .map(q => benchWorked(world, q.id))
    .filter(Boolean);
}

/** The questions asked together at the end of a world. */
export function endProblems(world) {
  const title = titler(world);
  return getBank(world.id).end.map(p => stamp(p, world, title));
}

/** Every drillable multiple-choice problem in a world: bench pairs, then the end set. */
export function worldProblems(world) {
  const out = [];
  for (const q of world.quests.filter(x => x.status === 'live')) out.push(...benchProblems(world, q.id));
  out.push(...endProblems(world));
  return out;
}
