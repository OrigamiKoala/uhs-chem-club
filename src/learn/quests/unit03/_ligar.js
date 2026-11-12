/**
 * _ligar.js — what Ligar's quests share: the predict stage, and the line that brings the guess back.
 *
 * A PREDICTION IS ITS OWN PART OF THE BENCH (CLAUDE.md, "Predict first"). A predict stage shows only the question and the
 * guesses, as cards laid in one slot, and no instrument, tool or key; it cannot be submitted blank and it is never graded.
 * The NEXT stage brings the instrument and the locked guess back in its prompt and its reward (`engine/predict.js`).
 *
 * The guess cards are `guess` pieces of the bonds kit (`kits/bonds.js`): a few plain words on a plate. The common wrong idea
 * is always one of the cards, in the same plain words a student would use, so the bench can contradict it.
 */

import { bondsTable, guessCard, piecesIn } from '../../table/kits/bonds.js';
import { remember, recall } from '../../engine/predict.js';

/** The slot every guess is laid in. */
const SLOT = { id: 'guess', label: 'My prediction', at: { x: 75, y: 50 }, size: { w: 34, h: 20 } };

/** Where `n` cards stand in a row across the 150-wide bonds table. */
const ROW = { 2: [52, 98], 3: [30, 75, 120], 4: [21, 57, 93, 129] };

/**
 * A predict stage.
 * @param {object} o
 * @param {string} o.key        the quest key the guess is kept under (`unit03/q2-lattice`)
 * @param {string} o.title      the stage's title
 * @param {string} o.prompt     one plain question, at most 25 words
 * @param {Array}  o.cards      `[id, wording, lines]`: `wording` is how the prompt of the test quotes the card, `lines` is the card's face
 * @param {string[]} o.hints    three one-sentence rungs
 * @param {{title:string, body:string}} o.reward
 */
export function predictStage({ key, title, prompt, cards, hints, reward, briefing = null }) {
  const xs = ROW[cards.length];
  return {
    title,
    ...(briefing ? { briefing } : {}),
    predict: true,
    prompt,
    widget: { type: 'table', label: 'The bench' },
    table: bondsTable({
      pieces: cards.map(([id, wording, lines], i) => guessCard(id, wording, lines, { x: xs[i], y: 20 })),
      zones: { slots: [SLOT] }
    }),
    hints,
    check(state) {
      if (!piecesIn(state.table, `slot:${SLOT.id}`)[0]) return { ok: false, notYet: true, msg: 'Lay a card in the slot.' };
      return { ok: true };
    },
    onClear(state) {
      const held = piecesIn(state.table, `slot:${SLOT.id}`)[0];
      if (held) remember(key, held.id);
    },
    reward: { log: 'Prediction recorded.', ...reward }
  };
}

/** The wording of the card the player laid, or null (a stage played on its own, or a guess that was cleared). */
export function guessWording(key, cards) {
  const id = recall(key);
  const hit = id ? cards.find(c => c[0] === id) : null;
  return hit ? hit[1] : null;
}

/** The prompt of the test stage: the player's own guess first, then the question. */
export function testPrompt(key, cards, question) {
  const said = guessWording(key, cards);
  return said ? `You predicted "${said}": ${question}` : question[0].toUpperCase() + question.slice(1);
}

/** The first sentence of the test stage's reward: whether the bench agreed with the guess. Never costs anything. */
export function verdictLine(key, rightId) {
  const id = recall(key);
  if (!id) return '';
  return id === rightId ? 'Your prediction was confirmed. ' : 'Your prediction was not confirmed. ';
}

/* ------------------------------------------------------------------
   THE ENERGY CURVE (`kits/bonds.js`, the `wells` fixture)
   A plot of energy against the distance between two atoms, and a track on which the pair is dragged. Used by `q1-joins`
   (why two atoms bond) and `q3-distance` (bond length and bond energy), so its declaration lives here.
   ------------------------------------------------------------------ */

/** A curve fixture's declaration: `rows` are `{id, pair, label, start}`, one dragged pair each; `at` and `size` its place. */
export function wells(id, rows, { at, size, dmax = 300, top = 9, pitch = 7, margin = 4, discs = false, marker = null, release = null, plot, runLabel, min = 0, grab = 0, icon, discK = 0, components = false, label = 'Energy of the pair' }) {
  const dials = {};
  for (const r of rows) dials[r.id] = { min, max: dmax, step: 2, value: r.start, label: r.label };
  if (marker) dials[marker.id] = { min: 0, max: marker.max, step: marker.step, value: 0, label: marker.label };
  return {
    id, kind: 'wells', label, at, size, ...(runLabel ? { runLabel } : { noRun: true }), dials,
    props: {
      rows, top, rowPitch: pitch, margin, discs, plot, ...(components ? { components } : {}), ...(discK ? { discK } : {}), ...(marker ? { marker: marker.id } : {}), ...(release ? { release } : {}),
      ...(grab ? { grab: { [rows[0].id]: grab } } : {}), ...(icon ? { icon } : {})
    }
  };
}
export const wellRow = (id, pair, label, start) => ({ id, pair, label, start });
