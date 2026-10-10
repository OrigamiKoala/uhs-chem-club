/**
 * rackcontrols.js — The keys and the readout text two box-rack quests share.
 *
 * `q5-numbers` and `q6-filling` both work the box rack with the same hand: Up,
 * Down or Remove picked from the tray, then a box tapped. The DOM keys here are
 * the source of truth for the hand at every tier (at T4 they are mirrored onto
 * the bench as real keys, `bench-keys.js`), and the tray drawn on the plate does
 * the same job for a finger on the picture. Both land in `bench.setHand`.
 */

import { addressOf, fmtMl, fmtMs, readRack } from './electrons.js';

/** The hand keys, as the frame's `.lq-controls` markup. */
export function handKeys({ clear = true, core = false } = {}) {
  return `
    <div class="cb-field" role="group" aria-label="Hand">
      <span class="form-label">Hand</span>
      <button type="button" class="btn-secondary quest-btn-sm cb-field-key" data-tool="hand:u" data-hand="u">Up</button>
      <button type="button" class="btn-secondary quest-btn-sm cb-field-key" data-tool="hand:d" data-hand="d">Down</button>
      <button type="button" class="btn-secondary quest-btn-sm cb-field-key" data-tool="hand:x" data-hand="x">Remove</button>
    </div>
    ${clear || core ? `
      <div class="cb-field" role="group" aria-label="Rack">
        ${clear ? '<button type="button" class="btn-secondary quest-btn-sm lq-tool" data-tool="clear">Clear Rack</button>' : ''}
        ${core ? '<button type="button" class="btn-secondary quest-btn-sm lq-tool" data-tool="core" aria-pressed="false">Collapse Core</button>' : ''}
      </div>` : ''}
  `;
}

/** Light the hand key that is held. */
export function paintHand(host, hand, core = false) {
  host.querySelectorAll('[data-hand]').forEach(b => {
    const on = b.dataset.hand === hand;
    b.classList.toggle('selected', on);
    b.setAttribute('aria-pressed', String(on));
  });
  host.querySelectorAll('[data-tool="core"]').forEach(b => {
    b.classList.toggle('selected', core);
    b.setAttribute('aria-pressed', String(core));
  });
}

/** What a placed, removed or refused tap says, in the instrument's own words. */
export function describeAct(res, item) {
  if (res.action === 'refused') return { head: 'Rack // refused', body: res.reason };
  if (res.action === 'removed') {
    return { head: 'Rack // removed', body: `One electron lifted out of a ${res.rowId} box.` };
  }
  const a = addressOf(res.rowId, res.idx, res.spin);
  const tail = item.layout === 'address'
    ? ` Its numbers are n = ${a.n}, l = ${a.l}, ml = ${fmtMl(a.ml)}, ms = ${fmtMs(a.ms)}.`
    : '';
  return { head: 'Rack // placed', body: `One electron placed in a ${res.rowId} box, pointing ${res.spin === 'u' ? 'up' : 'down'}.${tail}` };
}

export { readRack };
