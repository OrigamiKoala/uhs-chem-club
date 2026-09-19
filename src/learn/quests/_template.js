/**
 * _template.js — The contract every Learn quest game module implements.
 *
 * A Learn quest is a GAME, built the way `screens/quest.js` builds the Charge
 * Gardens: it owns its stages, its 3D scene, its inputs and its grading. The host
 * screen (`screens/learn-quest.js`) does not know what happens inside — it hands
 * you a container and a context object, and gets a disposer back.
 *
 * Copy this file to `src/learn/quests/<worldId>/<questId>.js`, build the game,
 * then point the quest's `module` at it in its world chart and set its `status`
 * to 'live'. Nothing else in the app needs editing.
 *
 * Things the host guarantees before mount() is called:
 *   - the world and the quest are both open (gating already checked)
 *   - `container` is empty and is the only DOM the quest should write to
 *   - the HUD, router and soundscape are already running
 *
 * Things the quest must not do:
 *   - award XP. The Learn track pays none, in any module, ever. `session.addXp`
 *     is off limits here; if a quest calls it, Standings stop measuring the
 *     campaign and start measuring homework.
 *   - write to `session.progress` or call `api.gradeStage` / `api.completeQuest`.
 *     Those are campaign rails and they carry XP. Report progress through `ctx`.
 *   - leave the 3D stage in quest mode on dispose.
 *   - run its own practice problems. The set belongs to the WORLD; export it
 *     (see PRACTICE below) and `learn/practice.js` will show it at the end.
 *
 * Things every stage owes the player:
 *   - a `reward` card of one to three sentences naming, in real chemical terms,
 *     the idea they just worked out. The chemistry lands in bits, after each
 *     stage, never saved up for the debrief — `verify:learn` caps it at three
 *     sentences and the cap is the point.
 */

/**
 * Optional. The host reads `stageCount` from here when the module is loaded, so a
 * built quest reports its real length instead of the chart's estimate.
 */
export const meta = {
  stageCount: 0
};

/**
 * THE PRACTICE SET. Five problems, owed by every live quest.
 *
 * They are NOT shown at the end of this quest. `learn/practice.js` gathers every
 * live quest's set across the whole world and offers them once the last bench in
 * that unit has been worked — a quiz between a debrief and the next bench turns a
 * road into a gate. They are optional, skippable, pay nothing and gate nothing;
 * the next world opens on the last quest's completion either way.
 *
 * They are the ONE place in a quest module where the withheld vocabulary is used
 * freely: the set runs after the world's last debrief, which is where the real
 * words are introduced. A revision question that had to call an atom "a piece"
 * would be testing the fiction instead of the chemistry.
 *
 * `verify:learn` checks the count, that each answer is one of its own options,
 * that no two options read the same, and that every problem explains itself —
 * a question that is only marked wrong teaches nothing.
 *
 * @type {Array<{question: string, options: Array<{id: string, label: string}>,
 *               answer: string, explanation: string}>}
 */
export const PRACTICE = [
  // {
  //   question: '...',
  //   options: [{ id: 'a', label: '...' }, { id: 'b', label: '...' }, { id: 'c', label: '...' }],
  //   answer: 'b',
  //   explanation: 'Why b, and why not the one they picked.'
  // },
];

/**
 * @param {HTMLElement} container empty element to render into
 * @param {{
 *   world: object,            // the world chart entry
 *   quest: object,            // the quest chart entry
 *   stagesCleared: number,    // how far this player has already got
 *   isComplete: boolean,      // quest already finished at least once
 *   reportStage: (stageIndex: number) => void,  // call on each stage cleared
 *   reportComplete: () => void,                 // call once, on the last stage
 *   exit: () => void          // return to the world screen
 * }} ctx
 * @returns {{dispose: () => void}}
 */
export function mount(container, ctx) {
  container.innerHTML = '';

  // Build the game here. A chamber quest will typically:
  //   const viewer = new QuestViewer(canvasHost);
  //   viewer.loadStage(STAGES[i], 'arrow', onPayloadChange);
  //   ...grade locally, then: ctx.reportStage(i)
  //   ...on the final stage: ctx.reportComplete()

  return {
    dispose() {
      // Tear down listeners, timers and any 3D resources this quest created.
    }
  };
}
