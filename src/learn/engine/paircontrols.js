/**
 * paircontrols.js — The keys and the readout text the pair board's quests share.
 *
 * `q4-dots` and `q5-resonance` work the same board with the same hand: pick what
 * the next tap places, then tap a slot or an atom. The DOM keys here are the
 * source of truth for the hand at every tier (at T4 they are mirrored onto the
 * bench as real keys, `bench-keys.js`), and the tray drawn on the plate does the
 * same job for a finger on the picture. Both land in `bench.setHand`.
 *
 * THE KEYS NAME WHAT THEY PLACE ONLY ONCE THE WORD IS EARNED. Before the first
 * card a pair goes "Between Atoms" or "On One Atom"; after it, "Bond" and "Lone
 * Pair". The card is `q4-dots` stage one, so every bench after it says the real
 * words from the start.
 */

import { planLewis, blankDrawing, MOLECULES } from './lewis.js';

/** The hand keys, as the frame's `.lq-controls` markup. */
export function pairKeys({ stage = 2, dot = false, charge = false, earned = true, charges = false, gauge = false, record = false, clear = true } = {}) {
  const bond = earned ? 'Bond' : 'Between Atoms';
  const lone = earned ? 'Lone Pair' : 'On One Atom';
  return [
    `
    <div class="cb-field" role="group" aria-label="Hand">
      <span class="form-label">Hand</span>
      <button type="button" class="btn-secondary quest-btn-sm cb-field-key" data-tool="hand:bond" data-hand="bond">${bond}</button>
      <button type="button" class="btn-secondary quest-btn-sm cb-field-key" data-tool="hand:lone" data-hand="lone">${lone}</button>
      ${dot ? '<button type="button" class="btn-secondary quest-btn-sm cb-field-key" data-tool="hand:dot" data-hand="dot">Single Electron</button>' : ''}
      ${gauge ? '<button type="button" class="btn-secondary quest-btn-sm cb-field-key" data-tool="hand:gauge" data-hand="gauge">Read Length</button>' : ''}
      <button type="button" class="btn-secondary quest-btn-sm cb-field-key" data-tool="hand:x" data-hand="x">Lift Out</button>
    </div>`,
    clear || charges || record ? `
    <div class="cb-field" role="group" aria-label="Slate">
      ${charges ? '<button type="button" class="btn-secondary quest-btn-sm lq-tool" data-tool="charges" aria-pressed="false">Show Charges</button>' : ''}
      ${record ? '<button type="button" class="btn-secondary quest-btn-sm lq-tool" data-tool="record">File Drawing</button>' : ''}
      ${clear ? '<button type="button" class="btn-secondary quest-btn-sm lq-tool" data-tool="clear">Clear Slate</button>' : ''}
    </div>` : '',
    charge ? `
    <div class="cb-field" role="group" aria-label="Tray">
      <span class="form-label">Tray</span>
      <button type="button" class="btn-secondary quest-btn-sm lq-tool" data-tool="charge:up">Take Electron</button>
      <button type="button" class="btn-secondary quest-btn-sm lq-tool" data-tool="charge:down">Add Electron</button>
    </div>` : ''
  ].filter(Boolean);
}

/** Light the hand key that is held. */
export function paintPairHand(host, hand) {
  host.querySelectorAll('[data-hand]').forEach(b => {
    const on = b.dataset.hand === hand;
    b.classList.toggle('selected', on);
    b.setAttribute('aria-pressed', String(on));
  });
}

/** Light the Show Charges key. */
export function paintCharges(host, on) {
  host.querySelectorAll('[data-tool="charges"]').forEach(b => {
    b.classList.toggle('selected', on);
    b.setAttribute('aria-pressed', String(on));
  });
}

/** What a tap said, in the instrument's own words. */
export function describeBoard(res, item) {
  if (res.action === 'refused') return { head: 'Slate // refused', body: res.reason };
  const read = res.reading;
  const dark = read.atoms.filter(a => a.lamp === 'short').length;
  const tail = ` ${read.left} electrons left in the tray, ${dark} ${dark === 1 ? 'lamp' : 'lamps'} dark.`;
  if (res.action === 'removed') return { head: 'Slate // lifted', body: `Something went back to the tray.${tail}` };
  const what = res.what === 'bond' ? 'A pair went into a slot between two atoms.' : res.what === 'dot' ? 'A single electron went onto an atom.' : 'A pair went onto an atom.';
  return { head: 'Slate // placed', body: `${what}${tail}` };
}

/** The blank state a stage's plates build into. */
export function boardState(rigs) {
  const boards = {};
  const charges = {};
  const recorded = {};
  for (const rig of rigs) {
    boards[rig.id] = rig.prefill ? { bonds: { ...rig.prefill.bonds }, lone: { ...rig.prefill.lone }, dots: { ...rig.prefill.dots } } : blankDrawing();
    charges[rig.id] = rig.charge ?? MOLECULES[rig.mol].charge;
    recorded[rig.id] = [];
  }
  return { boards, charges, recorded };
}

/** How many atoms have a lamp lit (boron's amber counts, a spare dark one does not). */
export function litCount(read) {
  return read.atoms.filter(a => a.lamp === 'full' || a.lamp === 'amber' || a.lamp === 'expanded').length;
}

export { planLewis };
