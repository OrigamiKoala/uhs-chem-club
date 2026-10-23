/**
 * model-parts.js — the solid models a reward card shows once the player has found out how something is built.
 *
 * PURE DATA. A model is described by a small spec on the stage's `reward.model` and turned here into plain parts (spheres,
 * bonds, rings, electrons). `ui/model-viewer.js` stands those parts up in 3D, or paints them flat when there is no WebGL, from
 * these same numbers, so the picture is the same fact either way. Every count shown is derived from the spec (a proton count
 * gives the shells it fills), never typed in a second place.
 *
 *   { type: 'atom', p, n, charge?, focus?: 'nucleus', caption? }       one atom: a nucleus and its electrons on shells
 *   { type: 'atoms', items: [{ p, n, charge?, label? }], caption? }    atoms side by side (isotopes, ions)
 *   { type: 'molecule', name, caption? }                               a ball-and-stick molecule
 */

import { shellsFor } from '../table/kits/atoms.js';
// LIGAR: the shapes, crystals and lobes of Ligar's reward cards live in their own file (added, not altered).
import { ligarParts, ligarCaption, LIGAR_MOLECULES } from './model-parts-ligar.js';

/** Display colours, in the plate's weathered palette. */
const COLOR = { H: '#d8d2c4', C: '#4a4640', O: '#a0522d', Na: '#cfc8b8', Cl: '#c9b66a', proton: '#d99423', neutron: '#8c8376', electron: '#dcd6cc', bond: '#8c8376', ring: '#544e46' };
const RADIUS = { H: 0.26, C: 0.4, O: 0.36, Na: 0.5, Cl: 0.46 };

const GOLDEN = Math.PI * (3 - Math.sqrt(5));

/** The shells of an atom with `p` protons carrying `charge` (+ lost, - gained), outermost shell changing first. */
export function shellsOf(p, charge = 0) {
  const shells = shellsFor(p).slice();
  let c = charge;
  for (let i = shells.length - 1; i >= 0 && c !== 0; i--) {
    if (c > 0) { const take = Math.min(shells[i], c); shells[i] -= take; c -= take; } else { shells[i] += -c; c = 0; }
  }
  return shells.filter(n => n > 0);
}

/** A nucleus of `p` protons and `n` neutrons as touching spheres packed round the centre. `scale` sets the sphere size. */
export function nucleusParts(p, n, scale = 1, origin = [0, 0, 0]) {
  const total = p + n;
  const r = 0.07 * scale;
  const R = r * Math.cbrt(total) * 1.15;
  const spheres = [];
  // Protons and neutrons interleaved through the lump, in a fixed order, so the same atom is always the same picture.
  let pLeft = p;
  let nLeft = n;
  for (let i = 0; i < total; i++) {
    const rr = R * Math.cbrt((i + 0.5) / total);
    const y = 1 - (2 * (i + 0.5)) / total;
    const ring = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = i * GOLDEN;
    const isProton = nLeft === 0 || (pLeft > 0 && (i % 2 === 0 ? pLeft >= nLeft : pLeft > nLeft));
    if (isProton) pLeft--; else nLeft--;
    spheres.push({ pos: [origin[0] + rr * ring * Math.cos(theta), origin[1] + rr * y, origin[2] + rr * ring * Math.sin(theta)], r, color: isProton ? COLOR.proton : COLOR.neutron, kind: isProton ? 'proton' : 'neutron' });
  }
  return { spheres, radius: R + r };
}

/** One atom: its nucleus, and (unless `focus`) a ring per shell with its electrons spaced round it. */
export function atomParts(spec, origin = [0, 0, 0], extent = 1) {
  const focus = spec.focus === 'nucleus';
  const nuc = nucleusParts(spec.p, spec.n, focus ? 2.2 : 1, origin);
  const parts = { spheres: nuc.spheres, bonds: [], rings: [], electrons: [], radius: nuc.radius };
  if (focus) return parts;
  const shells = shellsOf(spec.p, spec.charge || 0);
  shells.forEach((count, k) => {
    const rad = (0.55 + k * 0.42) * extent;
    const tilt = [0.0, 0.9, -0.6, 0.4][k % 4];
    parts.rings.push({ center: origin, r: rad, tilt });
    for (let e = 0; e < count; e++) parts.electrons.push({ ring: k, center: origin, r: rad, tilt, phase: (e / count) * Math.PI * 2, speed: 1.2 / (1 + k * 0.6) });
    parts.radius = Math.max(parts.radius, rad);
  });
  return parts;
}

/** Ball-and-stick molecules: atoms with positions (in display units) and bonds [i, j, order]. */
export const MOLECULES = {
  water: { atoms: [['O', 0, 0, 0], ['H', -0.76, -0.59, 0], ['H', 0.76, -0.59, 0]], bonds: [[0, 1, 1], [0, 2, 1]], formula: 'H₂O' },
  methane: { atoms: [['C', 0, 0, 0], ['H', 0.63, 0.63, 0.63], ['H', 0.63, -0.63, -0.63], ['H', -0.63, 0.63, -0.63], ['H', -0.63, -0.63, 0.63]], bonds: [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1]], formula: 'CH₄' },
  'carbon dioxide': { atoms: [['C', 0, 0, 0], ['O', -1.16, 0, 0], ['O', 1.16, 0, 0]], bonds: [[0, 1, 2], [0, 2, 2]], formula: 'CO₂' },
  peroxide: { atoms: [['O', -0.7, 0, 0], ['O', 0.7, 0, 0], ['H', -1.0, 0.85, 0], ['H', 1.0, -0.43, 0.73]], bonds: [[0, 1, 1], [0, 2, 1], [1, 3, 1]], formula: 'H₂O₂' }
};

export function moleculeParts(spec) {
  const m = MOLECULES[spec.name] || LIGAR_MOLECULES[spec.name];
  if (!m) throw new Error(`model: no molecule "${spec.name}"`);
  const spheres = m.atoms.map(([el, x, y, z]) => ({ pos: [x, y, z], r: RADIUS[el] || 0.35, color: COLOR[el] || COLOR.H, kind: el }));
  const bonds = m.bonds.map(([a, b, order]) => ({ a: m.atoms[a].slice(1), b: m.atoms[b].slice(1), order }));
  return { spheres, bonds, rings: [], electrons: [], radius: Math.max(...m.atoms.map(a => Math.hypot(a[1], a[2], a[3]))) + 0.5 };
}

/** The parts of any model spec, side by side where it lists several atoms. */
export function modelParts(spec) {
  const ligar = ligarParts(spec);
  if (ligar) return ligar;
  if (spec.type === 'molecule') return moleculeParts(spec);
  if (spec.type === 'atoms') {
    const n = spec.items.length;
    const gap = 3.2;
    const all = { spheres: [], bonds: [], rings: [], electrons: [], radius: 0 };
    spec.items.forEach((it, i) => {
      const x = (i - (n - 1) / 2) * gap;
      const a = atomParts({ ...it, focus: spec.focus }, [x, 0, 0], 1);
      all.spheres.push(...a.spheres);
      const base = all.rings.length;
      a.rings.forEach(r => all.rings.push(r));
      a.electrons.forEach(e => all.electrons.push({ ...e, ring: e.ring + base }));
      all.radius = Math.max(all.radius, Math.abs(x) + a.radius);
    });
    return all;
  }
  return atomParts(spec);
}

/** The words under a model: the spec's own caption, else the counts it was built from. */
export function captionOf(spec) {
  if (spec.caption) return spec.caption;
  const ligar = ligarCaption(spec);
  if (ligar) return ligar;
  if (spec.type === 'molecule') return `${(MOLECULES[spec.name] || LIGAR_MOLECULES[spec.name])?.formula || spec.name}, as a ball-and-stick model.`;
  const one = it => `${it.label ? `${it.label}: ` : ''}${it.p} protons, ${it.n} neutrons, ${shellsOf(it.p, it.charge || 0).reduce((a, b) => a + b, 0)} electrons`;
  if (spec.type === 'atoms') return spec.items.map(one).join('. ') + '.';
  return `${one(spec)}.`;
}

/** Where an electron is at time `t` (seconds): a point on its tilted ring. */
export function electronAt(e, t) {
  const a = e.phase + t * e.speed;
  const x = Math.cos(a) * e.r;
  const z = Math.sin(a) * e.r;
  return [e.center[0] + x, e.center[1] + z * Math.sin(e.tilt), e.center[2] + z * Math.cos(e.tilt)];
}
