/**
 * story-sim.js — small deterministic mechanisms the story scenes draw from, so a picture shows the thing happening instead of a label saying it did.
 *
 * Everything is a pure function of the scene time (and a seed): the same `t` is the same frame, which is what reduced motion and `verify:story` rely on.
 *   - particles bounce in a unit box on a phase `tau`; every time a phase crosses a whole number that particle has struck a wall, so a
 *     wall's knocks are COUNTED from the same motion that is drawn (`wallHits`), never scripted;
 *   - `integrate` turns a speed that changes during a scene (a squeezed box, a heated gas) into the phase it has reached;
 *   - `project` / `spin` stand a 3D arrangement up on the 2D plate (molecular shapes, orbitals).
 */

export const clamp01 = v => Math.max(0, Math.min(1, v));
export const win = (t, a, b) => clamp01((t - a) / (b - a));
export const ease = v => v * v * (3 - 2 * v);
export const lerp = (a, b, v) => a + (b - a) * v;

/** A repeatable number in [0, 1) for particle `i` and stream `k`. */
export const hash = (i, k = 0) => {
  let a = Math.imul((i + 1) * 7919 + (k + 1) * 104729, 0x45d9f3b);
  a = Math.imul(a ^ (a >>> 16), 0x45d9f3b);
  return ((a ^ (a >>> 16)) >>> 0) / 4294967296;
};

/** The triangle wave of a bouncing point: a phase `p` becomes a place in [0, 1]. */
export const tri = p => { const x = ((p % 2) + 2) % 2; return x < 1 ? x : 2 - x; };

/** The phase a speed `m(s)` has carried a scene to by time `t`. */
export function integrate(m, t, steps = 80) {
  let sum = 0;
  const dt = t / steps;
  for (let i = 0; i < steps; i++) sum += m((i + 0.5) * dt) * dt;
  return sum;
}

/** `n` particles with a start place and a speed each. */
export function crowdOf(n, seed = 1, spread = 0.5) {
  return Array.from({ length: n }, (_, i) => ({
    u: hash(i, seed), v: hash(i, seed + 1),
    sx: 0.7 + spread * hash(i, seed + 2) + 0.3, sy: 0.7 + spread * hash(i, seed + 3) + 0.3
  }));
}

/** Where a particle is (unit box) when the scene has carried the phase to `tau`. */
export const placeOf = (p, tau) => [tri(p.u + p.sx * tau), tri(p.v + p.sy * tau)];

/**
 * The knocks a crowd made on the four walls between phase `a` and phase `b`. Each: { wall: 'L'|'R'|'T'|'B', along (0..1), age (0 = newest) }.
 * A phase crossing an odd whole number is a knock on the right (or the bottom), an even one on the left (or the top).
 */
export function wallHits(crowd, a, b) {
  const out = [];
  const span = Math.max(1e-9, b - a);
  for (const p of crowd) {
    for (const [axis, start, sp, other, o2, w1, w2] of [['x', p.u, p.sx, p.v, p.sy, 'R', 'L'], ['y', p.v, p.sy, p.u, p.sx, 'B', 'T']]) {
      const p0 = start + sp * a;
      const p1 = start + sp * b;
      for (let k = Math.floor(p0) + 1; k <= Math.floor(p1); k++) {
        const at = (k - start) / sp;
        out.push({ wall: k % 2 ? w1 : w2, along: tri(other + o2 * at), age: (b - at) / span, axis });
      }
    }
  }
  return out;
}

/** Rotate a 3D vector about the vertical axis, then tilt it toward the viewer. */
export function spin([x, y, z], yaw, tilt = 0.45) {
  const cy = Math.cos(yaw); const sy = Math.sin(yaw);
  const x1 = x * cy + z * sy;
  const z1 = -x * sy + z * cy;
  const ct = Math.cos(tilt); const st = Math.sin(tilt);
  return [x1, y * ct - z1 * st, y * st + z1 * ct];
}

/** A rotated vector put on the plate at (cx, cy), `k` pixels to the unit, with a little perspective. Returns [x, y, depth, scale]. */
export function project(v, yaw, tilt, cx, cy, k, persp = 0.18) {
  const [x, y, z] = spin(v, yaw, tilt);
  const s = 1 / (1 - z * persp);
  return [cx + x * k * s, cy - y * k * s, z, s];
}

export const norm = ([x, y, z]) => { const l = Math.hypot(x, y, z) || 1; return [x / l, y / l, z / l]; };
export const mix3 = (a, b, v) => [lerp(a[0], b[0], v), lerp(a[1], b[1], v), lerp(a[2], b[2], v)];
