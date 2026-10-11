/**
 * rigcontrols.js — The keys and the readout text the domain rig's quests share.
 *
 * `q6-shape`, `q7-polarity` and `q8-hybrid` all work the same rig. The DOM keys
 * here are the source of truth for what is held at every tier (at T4 they are
 * mirrored onto the bench as real keys, `bench-keys.js`), and the tray drawn on
 * the plate does the same job for a finger on the picture. Both land in
 * `bench.setHand`.
 */

import { angleBetween, planDomains } from './vsepr.js';

const btn = (tool, label, extra = '') =>
  `<button type="button" class="btn-secondary quest-btn-sm cb-field-key" data-tool="${tool}"${extra}>${label}</button>`;

/** The keys for a hub stage: the arms in the stock, the protractor, remove, turn and clear. */
export function hubKeys(stage, { clear = true } = {}) {
  const stock = new Map();
  for (const rig of stage.rigs) for (const s of rig.stock || []) if (!stock.has(s.id)) stock.set(s.id, s);
  const parts = [];
  if (stock.size) {
    parts.push(`
    <div class="cb-field" role="group" aria-label="Arms">
      <span class="form-label">Arms</span>
      ${[...stock.values()].map(s => btn(`hand:arm:${s.id}`, s.label || (s.kind === 'lone' ? 'Lone Pair' : s.sym), ` data-hand="arm:${s.id}"`)).join('')}
      ${btn('hand:x', 'Remove Arm', ' data-hand="x"')}
    </div>`);
  }
  parts.push(`
    <div class="cb-field" role="group" aria-label="Reading">
      ${btn('hand:measure', 'Protractor', ' data-hand="measure"')}
      ${btn('turn', 'Turn View')}
      ${clear && stock.size ? btn('clear', 'Clear Hub') : ''}
    </div>`);
  return parts;
}

/** The keys for a field stage: the plates and the arrows. */
export function fieldKeys() {
  return [`
    <div class="cb-field" role="group" aria-label="Field">
      ${btn('field', 'Switch Field', ' aria-pressed="false"')}
      ${btn('arrows', 'Show Arrows', ' aria-pressed="false"')}
      ${btn('turn', 'Turn View')}
    </div>`];
}

/** The keys for a mixer stage: how many clouds to blend. */
export function mixKeys() {
  return [`
    <div class="cb-field" role="group" aria-label="Mixer">
      <span class="form-label">Blend</span>
      ${btn('mix:1', '2 Orbitals', ' data-mix="1"')}
      ${btn('mix:2', '3 Orbitals', ' data-mix="2"')}
      ${btn('mix:3', '4 Orbitals', ' data-mix="3"')}
    </div>`];
}

/** The key for a twist stage. */
export function twistKeys() {
  return [`
    <div class="cb-field" role="group" aria-label="Bond">
      ${btn('twist', 'Twist')}
    </div>`];
}

/** Light the held mixer key. */
export function paintMix(host, p) {
  host.querySelectorAll('[data-mix]').forEach(b => {
    const on = Number(b.dataset.mix) === p;
    b.classList.toggle('selected', on);
    b.setAttribute('aria-pressed', String(on));
  });
}

/** Light the held key. */
export function paintRigHand(host, hand) {
  host.querySelectorAll('[data-hand]').forEach(b => {
    const on = b.dataset.hand === hand;
    b.classList.toggle('selected', on);
    b.setAttribute('aria-pressed', String(on));
  });
}

/** Light a toggle key by its tool name. */
export function paintToggle(host, tool, on) {
  host.querySelectorAll(`[data-tool="${tool}"]`).forEach(b => {
    b.classList.toggle('selected', on);
    b.setAttribute('aria-pressed', String(on));
  });
}

/** What a tap on a hub said, in the instrument's own words. */
export function describeRig(res) {
  if (res.kind === 'protractor') {
    if (res.pending) return { head: 'Protractor // first arm', body: 'Tap a second arm to read the angle between the two.' };
    return { head: 'Protractor // reading', body: `${res.angle} degrees between those two arms.` };
  }
  if (res.action === 'refused') return { head: 'Hub // refused', body: res.reason };
  if (res.action === 'clipped') return { head: 'Hub // clipped', body: `The hub holds ${res.arms.length} ${res.arms.length === 1 ? 'arm' : 'arms'} and the arms have settled.` };
  if (res.action === 'unclipped') return { head: 'Hub // removed', body: `The hub holds ${res.arms.length} ${res.arms.length === 1 ? 'arm' : 'arms'} and the arms have settled.` };
  return { head: 'Hub', body: '' };
}

export { angleBetween, planDomains };
