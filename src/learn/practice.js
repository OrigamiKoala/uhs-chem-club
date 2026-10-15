/**
 * practice.js — The problem set a Learn world ends on.
 *
 * WHY IT IS AT THE END OF THE WORLD AND NOT THE END OF A QUEST
 * The quests are the teaching. A quest ends on its debrief, the player walks out
 * onto the flat, and the next bench is open — putting a quiz between those two
 * moments turns a road into a gate. So the problems wait at the end of the
 * WORLD: five per quest, all of them together, once every bench in that unit has
 * been worked. By then the player has met every idea the set asks about.
 *
 * THREE RULES, AND THEY ARE THE PRODUCT
 *   1. The problems are OPTIONAL. Nothing is locked behind them: the next world
 *      opens on the last quest's completion, whether or not a single question is
 *      answered. A study aid that gates the road is a test, and this is not one.
 *   2. They are SKIPPABLE at every point — a question at a time, or the whole set.
 *   3. They COME BACK. Once a world is complete its row carries a Problems key on
 *      the star map and on the Learn road, for as long as the account exists.
 *
 * They live in the Drill Deck (`#/drills`, `screens/drills.js`): one place that
 * pools every world's questions into rounds, with streaks, stars and mastery.
 * It is a 2D screen on every tier, including T4 — these are the player's own
 * revision, not a transmission from anybody, and there is no instrument in the
 * fiction that asks multiple-choice questions.
 *
 * NO XP, EVER. Like the rest of the Learn track, nothing here calls session.addXp
 * or touches progress — `verify:learn` fails the build if it does.
 */

import { PROBLEMS_PER_QUEST } from './curriculum.js';
import { isQuestComplete } from './progress.js';
import { loadWorldPractice } from './drills.js';

/* Re-exported so a caller that has the problem screen does not also need the
   registry just to know how long a set is. */
export { PROBLEMS_PER_QUEST, loadWorldPractice };

/** The flag that records "this world's set has been offered once already". */
export function practiceOfferedFlag(worldId) {
  return `learnPracticeOffered:${worldId}`;
}

/**
 * True when this world has a problem set worth surfacing: it is finished, and at
 * least one of its quests shipped one.
 */
export function worldHasPractice(world) {
  if (!world) return false;
  const live = world.quests.filter(q => q.status === 'live');
  return live.length > 0 && live.every(isQuestComplete);
}

/**
 * Open a world's problems. They no longer have a modal of their own: every
 * practice question in the Learn track is pooled in the Drill Deck, so this is
 * a door to it with the world already chosen.
 *
 * @param {object} world
 * @param {{onDone?: Function}} [opts]
 */
export function openWorldPractice(world, opts = {}) {
  if (!world) { opts.onDone?.(); return; }
  window.location.hash = `#/drills/${world.id}`;
  opts.onDone?.();
}
