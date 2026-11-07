/**
 * kits/matter-motion.js — how the particles of Mirrowen's instruments move (states of matter, intermolecular forces, solutions).
 *
 * Every painter that draws particles asks here for a position at the table clock `t` (seconds). Nothing here decides a figure: the number
 * of particles, their state and their temperature come from the planners (`matterdata*.js`); this file only says where a particle of a
 * given state stands at a given moment, and the answer is a pure function of (particle index, clock, state, temperature):
 *
 *   gas     flies in straight lines and bounces off the walls of its box; faster when warmer
 *   liquid  stays close to its neighbours and slides past them
 *   solid   shakes about a fixed place; harder when warmer
 *
 * `speedAt` is the same square-root law the heat kit uses (speed goes as the square root of the kelvin temperature).
 * The painters keep no state, so the flat bench and the recording context that stands the crowd up in 3D (`pans-3d.js` `dressRecorded`)
 * draw the same picture.
 */

/** A deterministic number in [0, 1) for particle `i`, stream `k`. */
export const h01 = (i, k = 0) => {
  let a = Math.imul((i + 1) * 7919 + (k + 1) * 104729, 0x45d9f3b);
  a = Math.imul(a ^ (a >>> 16), 0x45d9f3b);
  return ((a ^ (a >>> 16)) >>> 0) / 4294967296;
};

/** A triangle wave: 0 to 1 and back to 0 as u runs 0 to 2, so a point bounces between two walls. */
export const tri = u => { const m = ((u % 2) + 2) % 2; return m < 1 ? m : 2 - m; };

/** How fast particles move at `T` °C, 1 at room temperature. */
export const speedAt = T => Math.sqrt(Math.max(1, T + 273.15) / 295);

/** A gas particle's place in a unit box at clock `t`: [u, v] in 0..1, bouncing off every wall. */
export function gasAt(i, t, speed = 1) {
  const vx = (0.18 + 0.34 * h01(i, 3)) * (h01(i, 4) < 0.5 ? -1 : 1);
  const vy = (0.14 + 0.3 * h01(i, 5)) * (h01(i, 6) < 0.5 ? -1 : 1);
  return [tri(h01(i, 1) * 2 + t * speed * vx), tri(h01(i, 2) * 2 + t * speed * vy)];
}

/** A solid particle's shake about its place, in the same unit as `amp`. */
export function shakeAt(i, t, amp, speed = 1) {
  const w = (5 + 4 * h01(i, 7)) * speed;
  return [Math.sin(t * w + h01(i, 8) * 6.283) * amp, Math.cos(t * w * 1.13 + h01(i, 9) * 6.283) * amp];
}

/** A liquid particle's slide: a wide, slow loop about its place. */
export function slideAt(i, t, amp, speed = 1) {
  const w = (0.9 + 0.8 * h01(i, 10)) * speed;
  return [Math.sin(t * w + h01(i, 11) * 6.283) * amp, Math.cos(t * w * 0.83 + h01(i, 12) * 6.283) * amp * 0.8];
}

/** Where particle `i` of a crowd stands: its home (hx, hy) moved by the state's motion, kept inside the box (x0, y0, w, h). */
export function placeIn(state, i, t, T, home, box, amp) {
  const sp = speedAt(T);
  if (state === 'gas') {
    const [u, v] = gasAt(i, t, sp * 2.2);
    return [box.x0 + u * box.w, box.y0 + v * box.h];
  }
  const [dx, dy] = state === 'solid' ? shakeAt(i, t, amp * 0.5 * sp, sp) : slideAt(i, t, amp * 1.7, sp);
  return [Math.max(box.x0, Math.min(box.x0 + box.w, home[0] + dx)), Math.max(box.y0, Math.min(box.y0 + box.h, home[1] + dy))];
}

/* ------------------------------------------------------------------
   THE GLIDE: a change the student makes takes a moment to arrive
   ------------------------------------------------------------------ */

const memory = new Map();
let epoch = 0;
const smooth = k => { const c = Math.max(0, Math.min(1, k)); return c * c * (3 - 2 * c); };

/**
 * A value that moves toward `target` over `dur` seconds whenever the target changes (atoms pulled apart, a sample brought to a boil).
 * `key` names the thing that moves; `rest` is where it starts. The only memory is this map, keyed by scope, never the fixture
 * (`verify:table` builds each table twice and compares them).
 */
export function glide(key, target, t, { dur = 1.6, rest = 0 } = {}) {
  let m = memory.get(key);
  if (!m) { m = { from: rest, to: rest, t0: t - dur, epoch }; memory.set(key, m); }
  if (m.epoch !== epoch || t < m.t0 - 0.05) { m.from = rest; m.to = rest; m.t0 = t; m.epoch = epoch; }
  const here = m.from + (m.to - m.from) * smooth((t - m.t0) / dur);
  if (target !== m.to) { m.from = here; m.to = target; m.t0 = t; return here; }
  return here;
}

/** A miss: every glide starts again from its rest, so the cause plays once more. */
export function replayMatter() { epoch++; }
