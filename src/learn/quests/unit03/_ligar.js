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
export function predictStage({ key, title, prompt, cards, hints, reward }) {
  const xs = ROW[cards.length];
  return {
    title,
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
    reward: { log: 'Prediction locked in.', ...reward }
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
  return id === rightId ? 'You predicted this one, and the bench agreed. ' : 'The bench did not agree with your prediction, which is how an idea gets better. ';
}
