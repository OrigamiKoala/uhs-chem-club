/**
 * orbitals.js — Where an electron is found, sampled from the real wavefunction.
 *
 * PURE, NODE-IMPORTABLE, NO DOM. The cloud plate (`cloudplate.js`) draws what
 * this returns, and `verify:learn` samples it here to hold the pictures to the
 * physics: a 1s cloud's mean distance is 1.5 bohr, a 2s cloud has an empty shell
 * at 2 bohr, a p cloud has an empty plane through the middle.
 *
 * Every position is a draw from the real hydrogen-like |psi|^2, in atomic units
 * (1 bohr = 52.9 pm), built from the radial functions R(n, l; r) and the angular
 * parts below. Sampling is seeded, so any picture can be reproduced exactly and
 * "fire one shot, then fifty" always shows the same fifty after the one.
 *
 * Orbital ids: 1s, 2s, 2px 2py 2pz, 3s, 3px 3py 3pz, and the five 3d clouds
 * (3dz2, 3dxz, 3dyz, 3dxy, 3dx2y2).
 */

export const BOHR_PM = 52.9;

export const ORBITALS = {
  '1s': { n: 1, l: 0 },
  '2s': { n: 2, l: 0 },
  '2px': { n: 2, l: 1 }, '2py': { n: 2, l: 1 }, '2pz': { n: 2, l: 1 },
  '3s': { n: 3, l: 0 },
  '3px': { n: 3, l: 1 }, '3py': { n: 3, l: 1 }, '3pz': { n: 3, l: 1 },
  '3dz2': { n: 3, l: 2 }, '3dxz': { n: 3, l: 2 }, '3dyz': { n: 3, l: 2 },
  '3dxy': { n: 3, l: 2 }, '3dx2y2': { n: 3, l: 2 }
};

/** The radial wavefunction R(n, l; r), in bohr^-3/2. */
export function radial(n, l, r) {
  if (n === 1) return 2 * Math.exp(-r);
  if (n === 2 && l === 0) return (1 / (2 * Math.SQRT2)) * (2 - r) * Math.exp(-r / 2);
  if (n === 2 && l === 1) return (1 / (2 * Math.sqrt(6))) * r * Math.exp(-r / 2);
  if (n === 3 && l === 0) return (2 / (81 * Math.sqrt(3))) * (27 - 18 * r + 2 * r * r) * Math.exp(-r / 3);
  if (n === 3 && l === 1) return (8 / (27 * Math.sqrt(6))) * r * (1 - r / 6) * Math.exp(-r / 3);
  if (n === 3 && l === 2) return (4 / (81 * Math.sqrt(30))) * r * r * Math.exp(-r / 3);
  return 0;
}

/** The radial probability density: the chance of being at distance r, per bohr. */
export function radialPdf(n, l, r) {
  const R = radial(n, l, r);
  return r * r * R * R;
}

/** |angular part|^2 of an orbital, up to a constant, in the direction (x, y, z). */
export function angular(id, x, y, z) {
  switch (id) {
    case '1s': case '2s': case '3s': return 1;
    case '2px': case '3px': return x * x;
    case '2py': case '3py': return y * y;
    case '2pz': case '3pz': return z * z;
    case '3dz2': return Math.pow(3 * z * z - 1, 2);
    case '3dxz': return Math.pow(x * z, 2);
    case '3dyz': return Math.pow(y * z, 2);
    case '3dxy': return Math.pow(x * y, 2);
    case '3dx2y2': return Math.pow(x * x - y * y, 2);
    default: return 1;
  }
}

/** The largest value `angular` takes on the unit sphere, so a draw can be accepted at f / fmax. */
const ANGULAR_MAX = {
  '1s': 1, '2s': 1, '3s': 1,
  '2px': 1, '2py': 1, '2pz': 1, '3px': 1, '3py': 1, '3pz': 1,
  '3dz2': 4, '3dxz': 0.25, '3dyz': 0.25, '3dxy': 0.25, '3dx2y2': 1
};

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const MAX_CACHE = new Map();

/** The largest radial density and the distance past which nothing is worth drawing. */
function radialBounds(n, l) {
  const key = `${n}${l}`;
  if (MAX_CACHE.has(key)) return MAX_CACHE.get(key);
  const rMax = n === 1 ? 14 : n === 2 ? 32 : 60;
  let peak = 0;
  for (let r = 0; r <= rMax; r += rMax / 4000) peak = Math.max(peak, radialPdf(n, l, r));
  const out = { rMax, peak: peak * 1.05 };
  MAX_CACHE.set(key, out);
  return out;
}

/**
 * Find an electron `shots` times in orbital `id`. Each is `{ x, y, z }` in bohr.
 * Seeded: the first k points of a longer draw are the same points a shorter
 * draw returns, which is what lets a plate fire one shot, then fifty more, and
 * show a picture that builds rather than reshuffles.
 */
export function sampleOrbital(id, shots, seed = 1) {
  const o = ORBITALS[id];
  if (!o) throw new Error(`unknown orbital "${id}"`);
  const { rMax, peak } = radialBounds(o.n, o.l);
  const fmax = ANGULAR_MAX[id];
  const rnd = mulberry32((seed * 2654435761) ^ id.split('').reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7));
  const out = [];
  let guard = 0;
  while (out.length < shots && guard++ < shots * 4000) {
    const r = rnd() * rMax;
    if (rnd() * peak > radialPdf(o.n, o.l, r)) continue;
    // A direction, uniform on the sphere, kept with probability f / fmax.
    let x, y, z;
    for (let k = 0; k < 400; k++) {
      z = rnd() * 2 - 1;
      const phi = rnd() * Math.PI * 2;
      const s = Math.sqrt(1 - z * z);
      x = s * Math.cos(phi);
      y = s * Math.sin(phi);
      if (rnd() * fmax <= angular(id, x, y, z)) break;
    }
    out.push({ x: x * r, y: y * r, z: z * r });
  }
  return out;
}

/** The distance (bohr) at which a cloud has an empty spherical shell, or null. */
export function nodeRadii(id) {
  const o = ORBITALS[id];
  if (!o) return [];
  if (o.n === 2 && o.l === 0) return [2];
  if (o.n === 3 && o.l === 0) return [1.9, 7.1];
  if (o.n === 3 && o.l === 1) return [6];
  return [];
}

/** How a cloud is described by its angular shape, for the verifier and the hints' own sanity. */
export function shapeOf(id) {
  const o = ORBITALS[id];
  if (!o) return null;
  if (o.l === 0) return 'round';
  if (o.l === 1) return 'two lobes';
  return id === '3dz2' ? 'two lobes and a ring' : 'four lobes';
}

/**
 * The de Broglie standing wave on a circular track. A wave goes round a ring
 * only if a whole number of wavelengths fits in the circumference; anything
 * else meets itself out of step on the second lap, and cancels.
 */
export function ringFits(wavelength, circumference, tolerance = 0.02) {
  const n = circumference / wavelength;
  const whole = Math.round(n);
  return { n, whole, fits: whole >= 1 && Math.abs(n - whole) <= tolerance };
}

/** The circumference, in pm, of the ring the bench draws: one bohr radius round. */
export const RING_CIRCUMFERENCE_PM = 2 * Math.PI * BOHR_PM;
