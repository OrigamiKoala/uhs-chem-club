/**
 * kits/heat-motion.js — the heat kit's moving models (Ember Reach).
 *
 * EVERY INSTRUMENT SHOWS THE EVENT UNDER ITS READING, IN TIME. A painter here is a pure function of the table state and the clock
 * (`b.clock`): the same function draws the flat bench and, run against a recording context (`pans-3d.js`), the crowd of spheres that
 * floats over the plate at `3D On`. Nothing here decides a figure: how fast the water's molecules move comes from the temperature the
 * planner reads, how many packets of energy cross comes from the heat the planner reads, and which way they go from its sign.
 *
 *   cup      water molecules that move faster as the bath warms (the temperature glides to its new reading), and packets of energy that
 *            cross between the sample (or heater) and the water
 *   lattice  the atoms of each metal block, shaking harder as the block warms; joined blocks hand packets from the hotter to the colder
 *   rxn      a reaction as atoms: bonds break, atoms travel, new bonds form
 *   curve    a sample heated or cooled through its phases, traced as it goes
 *   shelves  a marble rolling over the energy diagram, and energy leaving or entering
 *   plot     a ball on the free-energy line and the two pulls on it
 *   stack    species that cancel when they stand on both sides
 *
 * The painters keep no state on the fixture. The little memory they need (a glide that starts when a reading changes) lives in a module
 * map keyed by scope, and `replayHeat()` (a miss) rewinds it so the cause plays again.
 */

import { PLATE_COLORS } from '../../engine/plates.js';
import { blockRead, cupRead, shelvesRead, plotRead, stackRead, shakesOf, seededRng } from './heat-read.js';
import { inkOfElement } from './heat-parts.js';

const AMBER = PLATE_COLORS.amber;
const PHOS = PLATE_COLORS.phosphor;
const DUST = PLATE_COLORS.dust;
const DIM = PLATE_COLORS.dim;
const WARM = '#c0652b';
const COLD = '#6f8fb0';

/** The kinds whose painter below draws a moving model. */
export const MOTION_KINDS = new Set(['cup', 'lattice', 'rxn', 'curve', 'shelves', 'plot', 'stack', 'warm', 'chamber', 'well', 'lead']);

export const contentTopOf = f => { const nd = Object.keys(f.dials || {}).length; return nd ? 8 + (nd - 1) * 5 + 3.6 : 10; };
const frameOf = b => ({ x: d => b.X(b.lay.box.x0 + d), y: d => b.Y(b.lay.box.y0 + d), len: d => d * b.sc });
const hash = (s, i = 0) => { let h = 2166136261 ^ i; for (let k = 0; k < s.length; k++) { h ^= s.charCodeAt(k); h = Math.imul(h, 16777619); } h ^= h >>> 13; h = Math.imul(h, 2246822519); h ^= h >>> 16; return ((h >>> 0) % 100000) / 100000; };
const ease = k => { const c = Math.max(0, Math.min(1, k)); return c * c * (3 - 2 * c); };
const tri = u => { const m = ((u % 2) + 2) % 2; return m < 1 ? m : 2 - m; };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, k) => a + (b - a) * k;

/** A temperature's ink: cold blue at 0 °C and below, warm orange at 100 °C and above. */
export function tempInk(T) {
  const k = clamp(T / 100, 0, 1);
  const c = [111, 143, 176]; const w = [192, 101, 43];
  return `rgb(${Math.round(lerp(c[0], w[0], k))},${Math.round(lerp(c[1], w[1], k))},${Math.round(lerp(c[2], w[2], k))})`;
}
/** How fast particles move at `T` °C, 1 at room temperature (speed goes as the square root of the kelvin temperature). */
export const speedAt = T => Math.sqrt(Math.max(1, T + 273.15) / 295);

/* ------------------------------------------------------------------
   THE GLIDE: a reading that changes takes about two seconds to arrive
   ------------------------------------------------------------------ */

const GLIDE_S = 2.4;
const memory = new Map();
let restart = false;

/** A miss replays the cause: every glide starts again from where it began. */
export function replayHeat() { for (const m of memory.values()) m.restart = true; restart = true; }

/**
 * The value to show for `key` at `clock`: `target` once it has arrived, on the way from `from` while a change is under way. With no clock
 * (the built table's printed face) it is the target.
 */
export function glide(key, clock, from, target) {
  if (clock == null || !(clock > 0)) return target;
  let m = memory.get(key);
  if (!m) { m = { from: restart ? from : target, target, t0: restart ? clock : -1e9, restart: false }; memory.set(key, m); }
  if (m.restart) { m.restart = false; m.from = from; m.t0 = clock; m.target = target; }
  if (Math.abs(m.target - target) > 1e-9) {
    const nowShown = lerp(m.from, m.target, ease((clock - m.t0) / GLIDE_S));
    m.from = nowShown; m.target = target; m.t0 = clock;
  }
  return lerp(m.from, m.target, ease((clock - m.t0) / GLIDE_S));
}
/** Seconds since this key's change began (large when it has settled). */
export function sinceChange(key, clock) { const m = memory.get(key); return m ? clock - m.t0 : 1e9; }

/* ------------------------------------------------------------------
   SMALL DRAWING HELPERS
   ------------------------------------------------------------------ */

const dot = (ctx, x, y, r, color, alpha = 1) => {
  ctx.globalAlpha = alpha; ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(x, y, Math.max(1, r), 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;
};
const ring = (ctx, x, y, r, color, alpha = 1) => {
  ctx.globalAlpha = alpha; ctx.strokeStyle = color; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(x, y, Math.max(1, r), 0, Math.PI * 2); ctx.stroke();
  ctx.globalAlpha = 1;
};

/** Packets of energy travelling from (x0, y0) to (x1, y1) in table units: n of them, staggered, each fading at its ends. */
function packets(ctx, F, clock, seed, x0, y0, x1, y1, n, rate = 0.55) {
  for (let i = 0; i < n; i++) {
    const u = ((clock * rate + i / n + hash(seed, i) * 0.15) % 1 + 1) % 1;
    const x = lerp(x0, x1, u); const y = lerp(y0, y1, u) + Math.sin(u * 6.28 + i) * 0.5;
    const a = Math.sin(u * Math.PI);
    ring(ctx, F.x(x), F.y(y), F.len(0.85), AMBER, 0.25 + 0.75 * a);
    dot(ctx, F.x(x), F.y(y), F.len(0.42), AMBER, 0.35 + 0.65 * a);
  }
}
/** How many packets stand for a heat of |q| joules (a few at 10 J, six at 100 kJ). */
const packetsFor = q => (Math.abs(q) < 1e-6 ? 0 : clamp(Math.round(Math.log10(1 + Math.abs(q))) , 1, 6));

/* ------------------------------------------------------------------
   THE CUP: water molecules at the bath's temperature
   ------------------------------------------------------------------ */

/** The temperature the bath shows at `clock`: it glides from its starting reading to the one the planner reads. */
export function bathShown(f, state, b) {
  const r = cupRead(state, f.id);
  return { r, T: glide(`${b?.scope || ''}cup:${f.id}`, b?.clock, r.T0, r.Tf) };
}

function paintCupMotion(ctx, f, state, b) {
  const F = frameOf(b);
  const top = contentTopOf(f);
  const { r, T } = bathShown(f, state, b);
  const cx0 = 3; const cx1 = 23; const cy1 = top + 31.5; const cy0 = top + 15.5;
  const level = Math.min(1, 0.45 + (r.mWater / (f.props.vmax || 220)) * 0.5);
  const yTop = cy1 - (cy1 - cy0) * level;
  const clock = b.clock || 0;
  const sp = speedAt(T);
  const ink = tempInk(T);
  const N = 18;
  const metal = Math.abs(r.c - 4.184) > 0.01;
  for (let i = 0; i < N; i++) {
    let px; let py;
    if (metal) {
      // A cup of metal is a lattice: each atom shakes about its place, harder as it warms.
      const gx = i % 6; const gy = Math.floor(i / 6);
      px = cx0 + 2.4 + gx * ((cx1 - cx0 - 4.8) / 5) + Math.sin(clock * (3 + 3 * sp) + i) * 0.35 * sp;
      py = yTop + 2 + gy * ((cy1 - yTop - 4) / 2) + Math.cos(clock * (3.3 + 3 * sp) + i * 2) * 0.35 * sp;
    } else {
      px = cx0 + 1.4 + (cx1 - cx0 - 2.8) * tri(hash('cx', i) * 2 + clock * 0.21 * sp * (0.7 + hash('vx', i)));
      py = yTop + 1.4 + (cy1 - yTop - 2.8) * tri(hash('cy', i) * 2 + clock * 0.17 * sp * (0.7 + hash('vy', i)));
    }
    dot(ctx, F.x(px), F.y(py), F.len(metal ? 0.9 : 0.8), ink, 0.9);
  }
  // Ice at the mouth: a small lattice that loses atoms as the ice melts, each leaving as a water molecule into the bath.
  if (r.item?.props?.latent) {
    const total = 9;
    const left = Math.round(total * (1 - clamp(r.melted / Math.max(1e-9, r.item.props.m), 0, 1)));
    for (let i = 0; i < total; i++) {
      const gx = i % 3; const gy = Math.floor(i / 3);
      if (i < left) dot(ctx, F.x(9 + gx * 2.6 + Math.sin(clock * 3 + i) * 0.12), F.y(top + 5 + gy * 2.6 + Math.cos(clock * 3.4 + i) * 0.12), F.len(0.85), '#a9c4d8', 1);
    }
  }
  // Packets of energy: between the sample (or the heater) and the water, in the direction the planner's sign says.
  const water = { x: (cx0 + cx1) / 2, y: (yTop + cy1) / 2 };
  const src = { x: (cx0 + cx1) / 2, y: top + 8.5 };
  const arriving = sinceChange(`${b.scope || ''}cup:${f.id}`, clock) < GLIDE_S + 0.5;
  const n = (r.item || r.joules) ? packetsFor(r.q) : 0;
  if (n && (arriving || r.item?.kind === 'block' || r.joules)) {
    if (r.q > 0) packets(ctx, F, clock, `cupin${f.id}`, src.x, src.y, water.x, water.y - 2, n);
    else packets(ctx, F, clock, `cupout${f.id}`, water.x, water.y - 2, src.x, src.y, n);
  }
  // A heater with no sample: a row of packets drops from the top of the cup.
  void DIM;
}

/* ------------------------------------------------------------------
   THE ATOM VIEW: what each block is made of
   ------------------------------------------------------------------ */

/** How many atoms a block is drawn with: more material, more atoms (a logarithmic count, 2 for a speck and 16 for a kilogram and more). */
export const atomsFor = m => clamp(Math.round(4 + 2 * Math.log10(Math.max(1e-4, m))), 2, 16);

function paintLattice(ctx, f, state, b) {
  const F = frameOf(b);
  const ids = f.props.blocks.filter(id => state.pieces[id]);
  const clock = b.clock || 0;
  const n = ids.length;
  if (!n) return;
  const top = 6;
  const gw = (f.size.w - 4) / n;
  const gh = f.size.h - top - 1.5;
  ids.forEach((id, k) => {
    const p = state.pieces[id];
    const r = blockRead(state, id);
    const T = glide(`${b.scope || ''}blk:${id}`, clock, r.T0, r.T);
    const x0 = 2 + k * gw + 0.6; const w = gw - 1.2;
    const ink = tempInk(T);
    const water = /H₂O|water/i.test(p.props.mat || p.label);
    const count = atomsFor(p.props.m);
    const cols = Math.ceil(Math.sqrt(count * (w / gh)));
    const rows = Math.ceil(count / cols);
    const amp = (0.12 + 0.34 * speedAt(T)) * Math.min(w / (cols + 0.5), gh / (rows + 0.5)) * 0.55;
    const sx = w / (cols + 0.5); const sy = gh / (rows + 0.5);
    ctx.strokeStyle = DIM; ctx.lineWidth = 1;
    ctx.strokeRect(Math.round(F.x(x0)) + 0.5, Math.round(F.y(top)) + 0.5, Math.round(F.len(w)), Math.round(F.len(gh)));
    for (let a = 0; a < count; a++) {
      const gx = a % cols; const gy = Math.floor(a / cols);
      const bx = x0 + sx * (gx + 0.75); const by = top + sy * (gy + 0.75);
      const wob = 1.6 + 1.5 * speedAt(T);
      const px = bx + Math.sin(clock * wob + hash(id, a) * 6.28) * amp;
      const py = by + Math.cos(clock * wob * 1.13 + hash(id, a + 50) * 6.28) * amp;
      if (water) {
        dot(ctx, F.x(px), F.y(py), F.len(Math.min(sx, sy) * 0.3), '#a0522d', 0.95);
        dot(ctx, F.x(px - sx * 0.2), F.y(py - sy * 0.18), F.len(Math.min(sx, sy) * 0.15), ink, 0.95);
        dot(ctx, F.x(px + sx * 0.2), F.y(py - sy * 0.18), F.len(Math.min(sx, sy) * 0.15), ink, 0.95);
      } else dot(ctx, F.x(px), F.y(py), F.len(Math.min(sx, sy) * 0.3), ink, 0.95);
    }
    // Joined: packets carry energy across from the hotter block to the colder, while their readings are still apart.
    if (r.joined) {
      r.mates.forEach(mid => {
        const j = ids.indexOf(mid);
        if (j < 0 || j < k) return;
        const rm = blockRead(state, mid);
        const Tm = glide(`${b.scope || ''}blk:${mid}`, clock, rm.T0, rm.T);
        const gap = Math.abs(T - Tm);
        const nn = gap < 0.4 ? 0 : clamp(Math.round(1 + gap / 25), 1, 5);
        const xa = x0 + w / 2; const xb = 2 + j * gw + 0.6 + w / 2;
        if (nn) {
          if (T > Tm) packets(ctx, F, clock, `lat${id}${mid}`, xa, top + gh / 2, xb, top + gh / 2, nn, 0.7);
          else packets(ctx, F, clock, `lat${mid}${id}`, xb, top + gh / 2, xa, top + gh / 2, nn, 0.7);
        }
      });
    }
  });
}

/* ------------------------------------------------------------------
   A REACTION AS ATOMS
   ------------------------------------------------------------------ */

const SUB = { '₀': 0, '₁': 1, '₂': 2, '₃': 3, '₄': 4, '₅': 5, '₆': 6, '₇': 7, '₈': 8, '₉': 9 };
/** The atoms of a formula: "CaCO₃(s)" is Ca, C, O, O, O. State symbols and charges are ignored. */
export function atomsOf(species) {
  const s = String(species).replace(/\((?:s|l|g|aq)\)/g, '').replace(/[⁺⁻²³]/g, '');
  const out = [];
  const re = /([A-Z][a-z]?)([₀-₉0-9]*)/g;
  let m;
  while ((m = re.exec(s))) {
    const num = m[2] ? Number([...m[2]].map(ch => (ch in SUB ? SUB[ch] : ch)).join('')) : 1;
    for (let i = 0; i < num; i++) out.push(m[1]);
  }
  return out;
}
const INK = el => ({ H: '#e6e0d2', C: '#5a554d', O: '#c0652b', N: '#6f8fb0', Cl: '#c9b66a', Ca: '#9aa89a', Na: '#9fa4c0', Fe: '#8a8f94', S: '#c9b66a', Mg: '#9aa89a' }[el] || inkOfElement(el));
const RADIUS = el => ({ H: 0.62, C: 0.9, N: 0.88, O: 0.88, Cl: 1.05, Ca: 1.2, Na: 1.1, Fe: 1.1, S: 1.05, Mg: 1.1 }[el] || 0.95);

/** The places of a molecule's atoms about its centre: two side by side, more on a ring (the first in the middle when there are four or more). */
function shapeOf(atoms) {
  const n = atoms.length;
  if (n === 1) return [[0, 0]];
  if (n === 2) return [[-0.75, 0], [0.75, 0]];
  if (n === 3) return [[0, -0.5], [-1.05, 0.55], [1.05, 0.55]];
  return atoms.map((_, i) => (i === 0 ? [0, 0] : [Math.cos(((i - 1) / (n - 1)) * 6.283) * 1.55, Math.sin(((i - 1) / (n - 1)) * 6.283) * 1.55]));
}

/**
 * Each side of a reaction as molecules laid out on a grid in its half of the box. Atoms of one element are matched in order between the
 * reactant and product lists, so a bond between two atoms breaks when they go to different molecules and forms when they meet.
 */
export function rxnLayout(lhs, rhs, w, h) {
  const side = (list, x0, x1) => {
    const mols = [];
    for (const [n, sp] of list) for (let i = 0; i < Math.max(1, Math.round(n)); i++) mols.push({ species: sp, atoms: atomsOf(sp) });
    const cols = Math.ceil(Math.sqrt(mols.length * ((x1 - x0) / h)));
    const rows = Math.ceil(mols.length / cols);
    mols.forEach((m, i) => {
      const cx = x0 + ((i % cols) + 0.5) * ((x1 - x0) / cols);
      const cy = 5 + (Math.floor(i / cols) + 0.5) * ((h - 6) / rows);
      m.shape = shapeOf(m.atoms).map(([dx, dy]) => [cx + dx * 0.78, cy + dy * 0.78]);
    });
    return mols;
  };
  const left = side(lhs, 2, w / 2 - 3);
  const right = side(rhs, w / 2 + 3, w - 2);
  const flat = ms => ms.flatMap(m => m.atoms.map((el, k) => ({ el, at: m.shape[k], mol: m })));
  const A = flat(left); const B = flat(right);
  const pool = {};
  for (const a of B) (pool[a.el] ||= []).push(a);
  for (const a of A) a.to = (pool[a.el] || []).shift() || null;
  return { A, B, left, right };
}

function paintRxn(ctx, f, state, b) {
  const F = frameOf(b);
  const p = f.props;
  const clock = b.clock || 0;
  const top = contentTopOf(f);
  const w = f.size.w; const h = f.size.h - top - 1;
  const lay = rxnCache(f, w, h);
  // The loop: the bonds quiver (0 to 2 s), the atoms travel and the bonds change (2 to 4 s), the products quiver (4 to 6.4 s), then again.
  const period = 6.4;
  const t = ((clock % period) + period) % period;
  const k = ease((t - 2) / 2);
  ctx.strokeStyle = DIM; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(F.x(w / 2), F.y(top + 1)); ctx.lineTo(F.x(w / 2), F.y(top + h)); ctx.stroke();
  const pos = lay.A.map((a, i) => {
    const to = a.to ? a.to.at : a.at;
    const wx = Math.sin(clock * 7 + hash(`${a.el}${i}`, 1) * 6.28) * 0.14;
    const wy = Math.cos(clock * 8.3 + hash(`${a.el}${i}`, 2) * 6.28) * 0.14;
    return { x: lerp(a.at[0], to[0], k) + wx, y: top + lerp(a.at[1], to[1], k) + wy };
  });
  const bonds = (groups, alpha) => {
    if (alpha <= 0) return;
    ctx.globalAlpha = alpha; ctx.strokeStyle = DUST; ctx.lineWidth = Math.max(1, F.len(0.35));
    for (const idxs of groups.values()) for (let a = 1; a < idxs.length; a++) {
      ctx.beginPath(); ctx.moveTo(F.x(pos[idxs[0]].x), F.y(pos[idxs[0]].y)); ctx.lineTo(F.x(pos[idxs[a]].x), F.y(pos[idxs[a]].y)); ctx.stroke();
    }
    ctx.globalAlpha = 1; ctx.lineWidth = 1;
  };
  const before = new Map(); const after = new Map();
  lay.A.forEach((a, i) => {
    if (!before.has(a.mol)) before.set(a.mol, []);
    before.get(a.mol).push(i);
    if (a.to) { if (!after.has(a.to.mol)) after.set(a.to.mol, []); after.get(a.to.mol).push(i); }
  });
  bonds(before, k < 0.2 ? 1 : k < 0.5 ? 1 - (k - 0.2) / 0.3 : 0);
  bonds(after, k > 0.6 ? (k - 0.6) / 0.4 : 0);
  lay.A.forEach((a, i) => dot(ctx, F.x(pos[i].x), F.y(pos[i].y), F.len(RADIUS(a.el)), INK(a.el), 1));
  // A stage that gives the sign of the heat shows packets leaving or entering while the bonds change.
  if (p.dH && k > 0.15 && k < 0.95) {
    const n = clamp(Math.round(Math.abs(p.dH) / 120) + 1, 1, 5);
    if (p.dH < 0) packets(ctx, F, clock, `rxnout${f.id}`, w / 2, top + h / 2, w - 1, top + 2, n, 0.8);
    else packets(ctx, F, clock, `rxnin${f.id}`, w - 1, top + 2, w / 2, top + h / 2, n, 0.8);
  }
}
const rxnMemo = new Map();
function rxnCache(f, w, h) {
  const key = `${f.id}|${JSON.stringify(f.props.lhs)}|${JSON.stringify(f.props.rhs)}|${w}|${h}`;
  let v = rxnMemo.get(key);
  if (!v) { v = rxnLayout(f.props.lhs, f.props.rhs, w, h); rxnMemo.set(key, v); }
  return v;
}

/* ------------------------------------------------------------------
   THE HEATING CURVE
   ------------------------------------------------------------------ */

/**
 * A sample heated (or cooled) through its phases: the path as `{ kind, from, to, heat }` pieces, where `heat` is the joules of the piece.
 * Positions on the dial are by heat, so a long plateau is a large heat.
 */
export function curvePath(p) {
  const { m, cs = 2.09, cl = 4.184, cg = 2.01, Lf = 334, Lv = 2260, from, to } = p;
  const rising = to > from;
  const lo = Math.min(from, to); const hi = Math.max(from, to);
  const parts = [];
  const add = (kind, a, b, heat) => parts.push({ kind, a, b, heat });
  if (lo < 0) add('solid', Math.max(lo, -200), Math.min(0, hi), m * cs * (Math.min(0, hi) - lo));
  if (lo <= 0 && hi >= 0) add('melt', 0, 0, m * Lf);
  if (hi > 0 && lo < 100) add('liquid', Math.max(0, lo), Math.min(100, hi), m * cl * (Math.min(100, hi) - Math.max(0, lo)));
  if (lo <= 100 && hi >= 100) add('boil', 100, 100, m * Lv);
  if (hi > 100) add('gas', Math.max(100, lo), hi, m * cg * (hi - Math.max(100, lo)));
  const list = rising ? parts : parts.slice().reverse().map(q => ({ ...q, a: q.b, b: q.a }));
  const total = list.reduce((a, q) => a + q.heat, 0) || 1;
  let acc = 0;
  for (const q of list) { q.u0 = acc / total; acc += q.heat; q.u1 = acc / total; }
  // The path starts at `from` when the first piece is a plateau it begins part-way through; only whole plateaus are ever on a path here.
  return { list, total, rising };
}
/** Where on the path a position `u` (0 to 1 of the heat) stands: the phase and the temperature. */
export function curveAt(path, u) {
  const uu = clamp(u, 0, 1);
  let q = path.list.find(x => uu <= x.u1 + 1e-9) || path.list[path.list.length - 1];
  const k = q.u1 > q.u0 ? (uu - q.u0) / (q.u1 - q.u0) : 0;
  const T = lerp(q.a, q.b, clamp(k, 0, 1));
  let phase = q.kind;
  const kk = path.rising ? clamp(k, 0, 1) : 1 - clamp(k, 0, 1);
  if (q.kind === 'melt') phase = kk < 0.5 ? 'solid' : 'liquid';
  if (q.kind === 'boil') phase = kk < 0.5 ? 'liquid' : 'gas';
  // `mix` is the share of the sample that has gone to the looser phase (liquid at the melt, gas at the boil).
  const mix = (q.kind === 'melt' || q.kind === 'boil') ? kk : 0;
  return { T, phase, kind: q.kind, mix };
}
export function curveU(f) { const d = f.dials.heat; return (d.value - d.min) / (d.max - d.min || 1); }

function paintCurve(ctx, f, state, b) {
  const F = frameOf(b);
  const clock = b.clock || 0;
  const top = contentTopOf(f);
  const path = curvePath(f.props);
  const u = glide(`${b.scope || ''}curve:${f.id}`, clock, f.props._u0 ?? 0, curveU(f));
  const at = curveAt(path, u);
  // The box of particles, on the left: a lattice that shakes (solid), a heap that slides (liquid), a gas that flies.
  const bx = 3; const by = top + 1; const bw = 22; const bh = f.size.h - top - 5;
  ctx.strokeStyle = DIM; ctx.lineWidth = 1;
  ctx.strokeRect(Math.round(F.x(bx)) + 0.5, Math.round(F.y(by)) + 0.5, Math.round(F.len(bw)), Math.round(F.len(bh)));
  const N = 12; const ink = tempInk(at.T);
  for (let i = 0; i < N; i++) {
    const col = i % 4; const row = Math.floor(i / 4);
    const lx = bx + 3.5 + col * 5; const ly = by + bh - 3 - row * 4.2;
    const solid = { x: lx + Math.sin(clock * 6 + i) * 0.35, y: ly + Math.cos(clock * 7 + i * 2) * 0.35 };
    const spd = speedAt(at.T);
    const liquid = { x: bx + 2 + (bw - 4) * tri(hash('lx', i) * 2 + clock * 0.35 * spd), y: by + bh - 2 - (bh * 0.45) * tri(hash('ly', i) * 2 + clock * 0.3 * spd) };
    const gas = { x: bx + 1.5 + (bw - 3) * tri(hash('gx', i) * 2 + clock * 0.9 * spd), y: by + 1.5 + (bh - 3) * tri(hash('gy', i) * 2 + clock * 0.75 * spd) };
    // Each particle leaves the lattice at its own point along the melt and the boil, so a plateau is a crowd changing over, not a switch.
    const mine = hash('ph', i);
    let pos;
    if (at.kind === 'melt') pos = at.mix > mine ? liquid : solid;
    else if (at.kind === 'boil') pos = at.mix > mine ? gas : liquid;
    else pos = at.phase === 'solid' ? solid : at.phase === 'liquid' ? liquid : gas;
    dot(ctx, F.x(pos.x), F.y(pos.y), F.len(0.95), ink, 0.95);
  }
  // The trace of temperature against heat added, drawn as dots so it is the same picture on the built table: it climbs, flattens, climbs.
  const gx = 29; const gw = f.size.w - gx - 4; const gy = top + 1; const gh = bh;
  const lo = Math.min(...path.list.map(q => Math.min(q.a, q.b))); const hi = Math.max(...path.list.map(q => Math.max(q.a, q.b)));
  const px = uu => F.x(gx + uu * gw);
  const py = T => F.y(gy + gh - ((T - lo) / Math.max(1, hi - lo)) * (gh - 1));
  ctx.strokeStyle = DIM;
  ctx.beginPath(); ctx.moveTo(F.x(gx), F.y(gy)); ctx.lineTo(F.x(gx), F.y(gy + gh)); ctx.lineTo(F.x(gx + gw), F.y(gy + gh)); ctx.stroke();
  const steps = 36;
  for (let s = 0; s <= steps; s++) {
    const uu = (s / steps) * u;
    const a = curveAt(path, uu);
    dot(ctx, px(uu), py(a.T), F.len(0.42), PHOS, 0.9);
  }
  dot(ctx, px(u), py(at.T), F.len(0.95), AMBER, 1);
}

/* ------------------------------------------------------------------
   THE LEAD-IN: a few seconds of a neighbouring case before a prediction
   ------------------------------------------------------------------ */

/**
 * A clip that plays by itself before a prediction, with no control, so the student has a picture to guess from. It shows a NEIGHBOURING
 * case, never the one being predicted. Scenes: meet (a hot lattice and a cold lattice touch), heater (a bath fed energy), air (two gases
 * mixed, nothing happening), shut (particles in half a box behind a wall), salt (a crystal in water, still), bond (a bonded pair quivering),
 * react (the reaction in `props.lhs` and `props.rhs`).
 */
function paintLead(ctx, f, state, b) {
  const F = frameOf(b);
  const clock = b.clock || 0;
  const w = f.size.w; const h = f.size.h; const top = 6;
  const scene = f.props.scene;
  const box = (x, y, bw, bh) => { ctx.strokeStyle = DIM; ctx.lineWidth = 1; ctx.strokeRect(Math.round(F.x(x)) + 0.5, Math.round(F.y(y)) + 0.5, Math.round(F.len(bw)), Math.round(F.len(bh))); };
  if (scene === 'react') { paintRxn(ctx, { ...f, id: `${f.id}-r`, dials: {}, size: { w, h: h + 4 } }, state, b); return; }
  if (scene === 'meet') {
    const period = 9; const t = clock % period;
    const k = ease((t - 2) / 1.2);                       // the two come together
    const mix = ease((t - 3.2) / 3.5);                   // their readings meet
    const Th = lerp(90, 45, mix); const Tc = lerp(5, 45, mix);
    const cw = (w - 8) / 2 - 3;
    for (const [side, T] of [[0, Th], [1, Tc]]) {
      const x0 = side === 0 ? 3 + (cw + 2) * 0 + k * 2 : w - 3 - cw - k * 2;
      box(x0, top, cw, h - top - 2);
      for (let i = 0; i < 12; i++) {
        const gx = i % 4; const gy = Math.floor(i / 4);
        const amp = (0.2 + 0.7 * speedAt(T)) * 0.5;
        dot(ctx, F.x(x0 + 2 + gx * ((cw - 4) / 3) + Math.sin(clock * (2 + 3 * speedAt(T)) + i * 1.7) * amp), F.y(top + 2.5 + gy * ((h - top - 5) / 2) + Math.cos(clock * (2.2 + 3 * speedAt(T)) + i) * amp), F.len(1.0), tempInk(T), 1);
      }
    }
    if (t > 3 && t < 7.2) packets(ctx, F, clock, `leadmeet${f.id}`, 3 + cw / 2, top + (h - top) / 2, w - 3 - cw / 2, top + (h - top) / 2, 3, 0.8);
    return;
  }
  if (scene === 'heater') {
    const period = 8; const t = clock % period;
    const T = lerp(20, 80, ease(t / 7));
    box(3, top, w - 6, h - top - 6);
    for (let i = 0; i < 16; i++) dot(ctx, F.x(5 + (w - 10) * tri(hash('lx', i) * 2 + clock * 0.2 * speedAt(T) * (0.7 + hash('v', i)))), F.y(top + 2 + (h - top - 10) * tri(hash('ly', i) * 2 + clock * 0.17 * speedAt(T) * (0.7 + hash('w', i)))), F.len(0.9), tempInk(T), 1);
    ctx.fillStyle = AMBER; ctx.fillRect(F.x(w / 2 - 8), F.y(h - 4.5), F.len(16), F.len(1.4));
    packets(ctx, F, clock, `leadheat${f.id}`, w / 2, h - 5, w / 2, top + 4, 4, 0.6);
    return;
  }
  if (scene === 'air') {
    box(3, top, w - 6, h - top - 3);
    for (let i = 0; i < 10; i++) {
      const x = 5 + (w - 10) * tri(hash('ax', i) * 2 + clock * 0.2 * (0.7 + hash('v', i)));
      const y = top + 2 + (h - top - 7) * tri(hash('ay', i) * 2 + clock * 0.16 * (0.7 + hash('w', i)));
      const c = i % 2 ? INK('O') : INK('N');
      dot(ctx, F.x(x - 0.8), F.y(y), F.len(0.9), c, 1); dot(ctx, F.x(x + 0.8), F.y(y), F.len(0.9), c, 1);
    }
    return;
  }
  if (scene === 'shut') {
    box(3, top, w - 6, h - top - 3);
    ctx.strokeStyle = AMBER; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(F.x(w / 2), F.y(top)); ctx.lineTo(F.x(w / 2), F.y(h - 3)); ctx.stroke(); ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) dot(ctx, F.x(5 + (w / 2 - 8) * tri(hash('sx', i) * 2 + clock * 0.4 * (0.7 + hash('v', i)))), F.y(top + 2 + (h - top - 7) * tri(hash('sy', i) * 2 + clock * 0.33 * (0.7 + hash('w', i)))), F.len(1.1), PHOS, 1);
    return;
  }
  if (scene === 'salt') {
    box(3, top, w - 6, h - top - 3);
    for (let i = 0; i < 12; i++) {
      const gx = i % 4; const gy = Math.floor(i / 4);
      dot(ctx, F.x(w / 2 - 6 + gx * 4 + Math.sin(clock * 3 + i) * 0.2), F.y(h - 9 + gy * 0 - (gy - 1) * 3.4 + Math.cos(clock * 3 + i) * 0.2), F.len(1.0), (gx + gy) % 2 ? '#9fa4c0' : '#c9b66a', 1);
    }
    for (let i = 0; i < 14; i++) dot(ctx, F.x(5 + (w - 10) * tri(hash('wx', i) * 2 + clock * 0.14 * (0.7 + hash('v', i)))), F.y(top + 2 + (h - top - 20) * tri(hash('wy', i) * 2 + clock * 0.12 * (0.7 + hash('w', i)))), F.len(0.7), COLD, 0.9);
    return;
  }
  if (scene === 'bond') {
    const y = top + (h - top) / 2;
    const sh = Math.sin(clock * 9) * 0.6;
    ctx.strokeStyle = DUST; ctx.lineWidth = Math.max(1, F.len(0.5)); ctx.beginPath(); ctx.moveTo(F.x(w / 2 - 5 - sh), F.y(y)); ctx.lineTo(F.x(w / 2 + 5 + sh), F.y(y)); ctx.stroke(); ctx.lineWidth = 1;
    dot(ctx, F.x(w / 2 - 5 - sh), F.y(y), F.len(2.4), INK('H'), 1); dot(ctx, F.x(w / 2 + 5 + sh), F.y(y), F.len(2.4), INK('H'), 1);
  }
}

/* ------------------------------------------------------------------
   THE ENERGY DIAGRAM, THE FREE-ENERGY LINE, THE STACK
   ------------------------------------------------------------------ */

function paintShelvesMotion(ctx, f, state, b) {
  const F = frameOf(b);
  const r = shelvesRead(state, f.id);
  const p = f.props;
  const clock = b.clock || 0;
  const top = contentTopOf(f);
  const x0 = 2; const w = f.size.w - 4;
  const y0 = top + 1; const h = f.size.h - top - 10;
  const scale = p.scale || Math.max(Math.abs(r.dH), 1);
  const shownDH = glide(`${b.scope || ''}shelf:${f.id}`, clock, 0, r.dH);
  const mid = y0 + h * 0.5;
  const dy = clamp(shownDH / (scale * 2.2), -0.42, 0.42) * h;
  let ya = mid + dy * 0.5; let yb = mid - dy * 0.5; let yp = null;
  const lv = p.levels;
  if (lv) {
    const lo = Math.min(lv.r, lv.p); const span = Math.max(lv.peak - lo, 1);
    const yOf = L => y0 + h * 0.92 - ((L - lo) / span) * h * 0.78;
    ya = yOf(lv.r); yb = yOf(lv.p); yp = yOf(lv.peak);
  }
  const bw = w * 0.34;
  const xa = x0 + w * 0.03 + bw; const xb = x0 + w * 0.97 - bw;
  // The marble: it waits on the left shelf, climbs the barrier (or the step), and rests on the right shelf, then goes back.
  const period = 5.2;
  const t = (clock % period) / period;
  const u = t < 0.15 ? 0 : t < 0.7 ? (t - 0.15) / 0.55 : 1;
  const e = ease(u);
  const xq = lerp(xa, xb, e);
  const base = lerp(ya, yb, e);
  const yq = yp == null ? base : (1 - e) * (1 - e) * ya + 2 * (1 - e) * e * (2 * yp - (ya + yb) / 2) + e * e * yb;
  dot(ctx, F.x(xq), F.y(yq) - F.len(0.9), F.len(0.9), AMBER, 1);
  // Energy leaving (down) or entering (up) across the diagram while the marble moves.
  if (Math.abs(r.dH) > 1e-6 && u > 0 && u < 1) {
    const n = clamp(Math.round(Math.abs(r.dH) / (scale || 1) * 3) + 1, 1, 4);
    if (r.dH < 0) packets(ctx, F, clock, `shout${f.id}`, xb, yb, x0 + w, yb - 6, n, 0.9);
    else packets(ctx, F, clock, `shin${f.id}`, x0 + w, yb - 6, xb, yb, n, 0.9);
  }
}

function paintPlotMotion(ctx, f, state, b) {
  const F = frameOf(b);
  const p = f.props;
  const r = plotRead(state, f.id);
  const clock = b.clock || 0;
  const top = contentTopOf(f);
  const px = 6; const pw = f.size.w - 10; const py = top + 1; const ph = f.size.h - top - 12;
  const Tmin = p.Ts[0]; const Tmax = p.Ts[p.Ts.length - 1];
  const dGat = T => p.dH - (T * p.dS) / 1000;
  const lo = Math.min(dGat(Tmin), dGat(Tmax), 0); const hi = Math.max(dGat(Tmin), dGat(Tmax), 0);
  const span = Math.max(1e-6, hi - lo) * 1.1;
  const X = T => px + ((T - Tmin) / (Tmax - Tmin)) * pw;
  const Yv = v => py + ph - ((v - lo + (hi - lo) * 0.05) / span) * ph;
  const T = glide(`${b.scope || ''}plot:${f.id}`, clock, Tmin, r.T);
  const ball = { x: X(T), y: Yv(dGat(T)) };
  // The ball sits on the line; it rocks a little, and its colour says the side of zero it is on.
  const side = dGat(T) < 0 ? PHOS : WARM;
  const rock = Math.sin(clock * 3) * 0.5;
  dot(ctx, F.x(ball.x + rock), F.y(ball.y) - F.len(1.0), F.len(1.1), side, 1);
  // The two pulls as marching packets along the line: heat of reaction pulling up, spreading pulling down.
  if (!p.hideTug) {
    const zero = Yv(0);
    const up = Yv(dGat(T)) - Yv(p.dH * 0 + 0);
    void up;
    const n1 = clamp(Math.round(Math.abs(p.dH) / 20), 1, 4);
    const n2 = clamp(Math.round(Math.abs(r.TdS) / 20), 1, 4);
    packets(ctx, F, clock, `pullH${f.id}`, ball.x, zero, ball.x, Yv(p.dH), n1, 0.6);
    packets(ctx, F, clock, `pullS${f.id}`, ball.x, Yv(p.dH), ball.x, Yv(p.dH - r.TdS), n2, 0.6);
  }
}

function paintStackMotion(ctx, f, state, b) {
  const F = frameOf(b);
  const clock = b.clock || 0;
  const cards = stackRead(state, f.id).cards;
  if (!cards.length) return;
  // Every species on a card is a dot: the left of the arrow drifts right, the right of the arrow drifts left, and where a species stands on
  // both sides the pair meets and goes (the cancelling the printed sum shows).
  const left = {}; const right = {};
  for (const c of cards) {
    const flipped = Boolean(c.props.flipped); const sc = c.props.scale || 1;
    for (const [n, s] of c.props.lhs) (flipped ? right : left)[s] = ((flipped ? right : left)[s] || 0) + n * sc;
    for (const [n, s] of c.props.rhs) (flipped ? left : right)[s] = ((flipped ? left : right)[s] || 0) + n * sc;
  }
  const species = [...new Set([...Object.keys(left), ...Object.keys(right)])].slice(0, 6);
  const y0 = f.size.h - 7.4;
  species.forEach((s, i) => {
    const n = Math.min(3, Math.ceil(Math.max(left[s] || 0, right[s] || 0)));
    const both = left[s] && right[s];
    const col = INK(atomsOf(s)[0] || '');
    for (let k = 0; k < n; k++) {
      const cx = 3 + i * 5.2;
      const ph = (clock * 0.5 + k * 0.3 + i * 0.1) % 1;
      const xa = cx + 0.0; const ya = y0 - 1 - k * 1.5;
      if (both) {
        dot(ctx, F.x(xa - 1 + ph * 1), F.y(ya), F.len(0.8), col, 1 - ph);
        dot(ctx, F.x(xa + 1 - ph * 1), F.y(ya), F.len(0.8), col, 1 - ph);
      } else dot(ctx, F.x(xa + Math.sin(clock * 2 + k + i) * 0.4), F.y(ya), F.len(0.8), col, 1);
    }
  });
}

/* ------------------------------------------------------------------
   THE ENTRY POINTS
   ------------------------------------------------------------------ */

/** The moving part of a fixture's picture, drawn over the plate's own: circles and rings only, so it can be stood up in space at 3D On. */
export function paintMotion(ctx, f, state, b) {
  if (f.kind === 'cup') paintCupMotion(ctx, f, state, b);
  else if (f.kind === 'lattice') paintLattice(ctx, f, state, b);
  else if (f.kind === 'rxn') paintRxn(ctx, f, state, b);
  else if (f.kind === 'curve') paintCurve(ctx, f, state, b);
  else if (f.kind === 'shelves') paintShelvesMotion(ctx, f, state, b);
  else if (f.kind === 'plot') paintPlotMotion(ctx, f, state, b);
  else if (f.kind === 'stack') paintStackMotion(ctx, f, state, b);
  else if (f.kind === 'lead') paintLead(ctx, f, state, b);
}

/** Does this fixture carry a moving model? */
export const isLive = f => MOTION_KINDS.has(f.kind);

/** A shake's flight: where the beads of a chamber are `clock` seconds after the shake, from the cells of the one before to the cells of this. */
export function chamberFlight(key, clock, shakes, f) {
  const k = shakes.length;
  const to = shakes[k - 1] || [];
  const from = shakes[k - 2] || to;
  const m = memory.get(key);
  if (!m || m.k !== k) memory.set(key, { k, t0: clock, from: 0, target: 0 });
  const t0 = memory.get(key).t0;
  return { from, to, u: ease((clock - t0) / 0.9), settled: clock - t0 > 0.9, f };
}
export { shakesOf, seededRng };
