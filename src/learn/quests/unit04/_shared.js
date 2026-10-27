/**
 * _shared.js — what Bellows' benches have in common: the bench widget, the script helpers, and the predict stage.
 *
 * A PREDICT STAGE (`engine/predict.js`, plan `docs/plans/bellows-world.md`) is its own part of the bench: it shows only the question and
 * the guesses, as statement cards that go in one slot, and NO instrument. The player cannot go on until a card is in the slot; the card is
 * remembered (`remember`) and comes back in the NEXT stage's prompt and reward. It is never graded and cannot be changed after the result.
 *
 * Not a quest: nothing here is on the chart.
 */

import { gasTable, stmt, whereIs } from '../../table/kits/gas.js';
import { remember, recall } from '../../engine/predict.js';

export const widget = { type: 'table', label: 'The bench' };

/** Script steps (a player's own actions), the same words every Bellows quest uses. */
export const put = (piece, to) => ({ place: { piece, to } });
export const dial = (fixture, name, value) => ({ setDial: { fixture, dial: name, value } });
export const mark = ids => ids.map(id => ({ flip: id }));
export const sort = spec => Object.entries(spec).map(([id, tray]) => put(id, `tray:${tray}`));

/** The card standing in slot `slotId`, or null. */
export function cardIn(t, slotId) {
  return Object.values(t.pieces).find(p => p.zone === `slot:${slotId}`) || null;
}

/** Statement cards for a guess or a verdict, stacked in a column: `items` is `[[id, label], ...]`. */
export function cardColumn(items, { x = 34, y0 = null, pitch = 14 } = {}) {
  const start = y0 ?? (32 - ((items.length - 1) * pitch) / 2);
  return items.map(([id, label], i) => stmt(id, label, { x, y: start + i * pitch }));
}

/**
 * The table of a predict stage: the guesses as cards on the left, and one slot on the right to lay the chosen one in. No fixture, no
 * tool, no key: the guess is made before the experiment is on the table.
 */
export function predictTable(items, { slot = 'predict', label = 'Prediction' } = {}) {
  return gasTable({
    pieces: cardColumn(items),
    zones: { slots: [{ id: slot, label, at: { x: 108, y: 30 }, size: { w: 40, h: 14 } }] }
  });
}

/** The check, onClear and reward-verdict wiring of a predict stage, so every quest's is the same. */
export function predictStage({ key, title, prompt, items, hints, reward, slot = 'predict', label = 'Prediction' }) {
  return {
    title,
    predict: true,
    prompt,
    widget,
    table: predictTable(items, { slot, label }),
    hints,
    check(state) {
      if (!cardIn(state.table, slot)) return { ok: false, notYet: true, msg: 'Place a card in the slot.' };
      return { ok: true };
    },
    onClear(state) {
      const card = cardIn(state.table, slot);
      if (card) remember(key, card.id);
    },
    reward
  };
}

/** The player's remembered guess for a quest, as `{id, label}` among `items`, or null. */
export function guessOf(key, items) {
  const id = recall(key);
  const hit = items.find(([i]) => i === id);
  return hit ? { id: hit[0], label: hit[1] } : null;
}

/** Direct prompt without prediction echo text. */
export const youPredicted = (key, items, rest, plain) => plain;

export { whereIs };
