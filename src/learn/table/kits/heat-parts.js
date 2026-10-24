/**
 * kits/heat-parts.js — the pure shapes the heat kit's solids and flat pictures are both made from.
 *
 * PURE, NODE-IMPORTABLE, NO DOM AND NO THREE. A bond chip's two atoms, a phase card's dozen particles, a cell's place in a row and
 * the colour of an element are decided here once, and the drawn picture (`heat-draw.js`) and the built solid (`engine/heat-props.js`)
 * both read them, so the two views cannot show different things (the picture is honest).
 */

import { seededRng } from './heat-read.js';

/** The two elements and the order of a bond named by its kind: "C-H" is C, H, 1; "O=O" is O, O, 2; "N≡N" is N, N, 3. */
export function bondAtoms(which) {
  const m = /^([A-Z][a-z]?)([-=≡–])([A-Z][a-z]?)$/.exec(String(which));
  if (!m) return { a: '', b: '', order: 1 };
  return { a: m[1], b: m[3], order: m[2] === '≡' ? 3 : m[2] === '=' ? 2 : 1 };
}

/** What an element looks like, in the plate's weathered palette (the same inks as the reward models). */
export const ELEMENT_INK = Object.freeze({ H: '#d8d2c4', C: '#4a4640', O: '#a0522d', N: '#6f8fb0', Cl: '#c9b66a' });
export const inkOfElement = el => ELEMENT_INK[el] || '#b8afa0';

/**
 * Twelve particles of a phase, in a unit box: the same dozen for every phase, so the cards differ only in the room each one has. A solid is
 * a lattice (2 x 2 x 3), a liquid a packed heap along the bottom, a gas a handful spread through the whole box. `tail` is how far each is
 * moving (a streak as long as the temperature says): a solid barely, a hot gas most. Seeded by phase, so the picture never changes.
 * `u` runs across, `v` down the picture (0 at the top), `w` into the box.
 */
export function phaseDots(phase, T = 20, n = 12) {
  const tail = phase === 'solid' ? 0.06 : Math.max(0.1, 0.22 + (T + 40) / 260);
  if (phase === 'solid') {
    const out = [];
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) for (let k = 0; k < 3; k++) out.push({ u: 0.28 + i * 0.44, v: 0.2 + k * 0.3, w: 0.28 + j * 0.44, tail });
    return out.slice(0, n);
  }
  const rnd = seededRng(`phase|${phase}`);
  const box = phase === 'liquid'
    ? { u: [0.1, 0.9], v: [0.45, 0.92], w: [0.1, 0.9], gap: 0.19 }
    : { u: [0.08, 0.92], v: [0.08, 0.92], w: [0.08, 0.92], gap: 0.3 };
  const out = [];
  for (let tries = 0; out.length < n && tries < 4000; tries++) {
    const p = {
      u: box.u[0] + rnd() * (box.u[1] - box.u[0]),
      v: box.v[0] + rnd() * (box.v[1] - box.v[0]),
      w: box.w[0] + rnd() * (box.w[1] - box.w[0]),
      tail
    };
    if (out.every(q => Math.hypot(q.u - p.u, q.v - p.v, q.w - p.w) >= box.gap)) out.push(p);
  }
  while (out.length < n) out.push({ u: 0.1 + 0.07 * out.length, v: 0.5, w: 0.5, tail });
  return out;
}
