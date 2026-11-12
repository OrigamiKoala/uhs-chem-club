/**
 * kits/matter-window.js — the instruments and pieces of Mirrowen's q1 bench (`q1-states`), registered on the matter kit (`matter-registry.js`).
 *
 *   JAR        a sealed jar: a letter (or a name) and nothing else. What it holds is what the instruments show.
 *   PRESS      a slot for a jar, a tube with a piston (the Squeeze dial) and a wide empty tank (the Pour key). Flat pictures of what the
 *              contents do: nothing here draws a molecule.
 *   WINDOW     a slot for a jar, a glass that shows its molecules (the same eight, whole, in every state), the Heater dial in degC and
 *              the Read Molecule key, which names what is in the glass and lists every temperature it has been pressed at.
 *   JARSCALE   a pan for a jar of equal size (1.00 L) and a Weigh key; a jar keeps the weight it read.
 *   PBOX       a card that is a picture of one jar's molecules.
 *
 * A painter is a pure function of the table: it prints what `matterdata-window.js` says and decides nothing.
 */

import { PLATE_COLORS } from '../../engine/plates.js';
import { registerFixture, registerPiece } from './matter-registry.js';
import { say, slab, frameOf } from './matter-draw.js';
import { seatedIn } from './matter-read.js';
import { contentTop } from './heat-draw.js';
import { GLYPHS, inkOf } from './matter-parts.js';
import { placeIn, speedAt, gasAt, shakeAt, slideAt, glide, h01 } from './matter-motion.js';
import { addTourText } from '../tour.js';
import {
  SAMPLES, SQUEEZE_NAMES, stateAt, squeezeRatio, pourShape, arrange, FRAME, windowMolecules, readerNames, jarMass
} from '../../engine/matterdata-window.js';

const AMBER = PLATE_COLORS.amber;
const PHOS = PLATE_COLORS.phosphor;
const DUST = PLATE_COLORS.dust;
const DIM = PLATE_COLORS.dim;
const STEEL = PLATE_COLORS.steel;

const minus = s => String(s).replace('-', '−');
const degC = T => `${minus(T)} °C`;

/** The state a jar is in: stated outright (a jar at 0 degC could be either), else read from its temperature. */
export const jarStateOf = jar => jar.props.state || stateAt(jar.props.sample, jar.props.T ?? 20);

/* ------------------------------------------------------------------
   MOLECULES (a water molecule, hydrogen, oxygen, and whatever matter-parts draws)
   ------------------------------------------------------------------ */

const EXTRA_GLYPHS = {
  H2: { atoms: [['H', -0.55, 0], ['H', 0.55, 0]], bonds: [[0, 1]] },
  O2: { atoms: [['O', -0.6, 0], ['O', 0.6, 0]], bonds: [[0, 1]], double: true }
};
const glyphFor = id => EXTRA_GLYPHS[id] || GLYPHS[id] || { atoms: [[id, 0, 0]], bonds: [] };

/** One molecule turned by `ang`, `unit` pixels to a bond. Atoms are drawn a little bigger than matter-parts' skeleton so a small card still shows them. */
export function paintMolecule(ctx, id, cx, cy, unit, ang = 0) {
  const g = glyphFor(id);
  const c = Math.cos(ang); const s = Math.sin(ang);
  const at = ([, x, y]) => [cx + (x * c - y * s) * unit, cy - (x * s + y * c) * unit];
  ctx.strokeStyle = DUST; ctx.lineWidth = Math.max(1, unit * 0.16);
  for (const [i, j] of g.bonds) {
    const [x0, y0] = at(g.atoms[i]); const [x1, y1] = at(g.atoms[j]);
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    if (g.double) { const nx = (y1 - y0) / Math.hypot(x1 - x0, y1 - y0 || 1) * unit * 0.2; const ny = -(x1 - x0) / Math.hypot(x1 - x0 || 1, y1 - y0) * unit * 0.2; ctx.beginPath(); ctx.moveTo(x0 + nx, y0 + ny); ctx.lineTo(x1 + nx, y1 + ny); ctx.stroke(); }
  }
  for (const a of g.atoms) {
    const [x, y] = at(a);
    ctx.fillStyle = inkOf(a[0]);
    ctx.beginPath(); ctx.arc(x, y, Math.max(1.2, unit * (a[0] === 'H' ? 0.3 : 0.44)), 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = STEEL; ctx.lineWidth = 1; ctx.stroke();
  }
  ctx.lineWidth = 1;
}

/**
 * The molecules of a frame laid out by `arrange`, each with the streak behind it, into the rectangle (px, py, pw, ph). They move: a gas
 * molecule flies and bounces off the walls, a liquid molecule slides past its neighbours, a solid molecule shakes in its place, and
 * all of them faster when warmer (`matter-motion.js`). `mot` = { state, T, clock }.
 */
function paintCrowd(ctx, parts, px, py, pw, ph, unitK = 1, mot = null) {
  const k = pw / FRAME.w;
  const unit = k * unitK;
  const margin = unit * 0.7;
  const box = { x0: px + margin, y0: py + margin, w: pw - 2 * margin, h: ph - 2 * margin };
  let first = null;
  parts.forEach((m, i) => {
    let x = px + m.x * k; let y = py + m.y * (ph / FRAME.h);
    let ang = m.ang;
    if (mot) {
      [x, y] = placeIn(mot.state, i, mot.clock, mot.T, [x, y], box, unit * 0.5);
      ang += mot.state === 'solid' ? Math.sin(mot.clock * 6 + i) * 0.25 : mot.clock * (0.4 + (i % 5) * 0.2) * speedAt(mot.T) * (mot.state === 'gas' ? 1.6 : 0.8);
    }
    ctx.strokeStyle = PHOS; ctx.lineWidth = Math.max(1, unit * 0.12); ctx.globalAlpha = 0.5;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - Math.cos(m.ang2) * m.tail * k * 0.5, y - Math.sin(m.ang2) * m.tail * k * 0.5); ctx.stroke();
    ctx.globalAlpha = 1;
    paintMolecule(ctx, m.mol, x, y, unit, ang);
    if (i === 0) first = [x, y];
  });
  // The analyzer has read this window: a ring pulses round the molecule it examined.
  if (mot?.mark && first) {
    ctx.strokeStyle = AMBER; ctx.lineWidth = Math.max(1.4, unit * 0.18);
    ctx.beginPath(); ctx.arc(first[0], first[1], unit * (1.5 + 0.25 * Math.sin(mot.clock * 5)), 0, Math.PI * 2); ctx.stroke(); ctx.lineWidth = 1;
  }
}

/* ------------------------------------------------------------------
   THE JAR AND THE BOX
   ------------------------------------------------------------------ */

const RECT_JAR = { hw: 10.2, hh: 9.5 };
const RECT_BOX = { hw: 12.5, hh: 10.5 };

const fmtMass = g => (g >= 100 ? String(Math.round(g)) : String(Number(Number(g).toPrecision(3))));

function paintJar(ctx, p, state, o) {
  const box = slab(ctx, o, RECT_JAR, '#1d1a16');
  const sc = o.sc;
  const has = p.props.mass != null;
  ctx.fillStyle = '#6b625a'; ctx.fillRect(box.x0 + 6.4 * sc, box.y0 + 1.2 * sc, 7.6 * sc, 1.6 * sc);
  ctx.fillStyle = '#2c2a27'; ctx.fillRect(box.x0 + 5.4 * sc, box.y0 + 2.8 * sc, 9.6 * sc, 7.4 * sc);
  ctx.strokeStyle = STEEL; ctx.strokeRect(box.x0 + 5.4 * sc, box.y0 + 2.8 * sc, 9.6 * sc, 7.4 * sc);
  const name = String(p.label);
  const size = name.length <= 2 ? Math.max(7, 3.2 * sc) : Math.max(6, 2.0 * sc);
  say(ctx, name, o.x, box.y0 + (has ? 12.9 : 14.4) * sc, size, { align: 'center', weight: 700, maxW: box.w - 1.6 * sc });
  if (has) say(ctx, `${fmtMass(p.props.mass)} g`, o.x, box.y0 + 16.5 * sc, Math.max(6, 2.0 * sc), { align: 'center', weight: 700, color: AMBER, maxW: box.w - 1.6 * sc });
}

function paintBox(ctx, p, state, o) {
  const box = slab(ctx, o, RECT_BOX, '#16140f');
  const sc = o.sc;
  const ix = box.x0 + 1.2 * sc; const iy = box.y0 + 1.2 * sc; const iw = box.w - 2.4 * sc; const ih = box.h - 6.4 * sc;
  ctx.fillStyle = '#0e0d0b'; ctx.fillRect(ix, iy, iw, ih);
  ctx.strokeStyle = STEEL; ctx.strokeRect(ix + 0.5, iy + 0.5, iw - 1, ih - 1);
  paintCrowd(ctx, arrange({ state: p.props.state, T: 20, seed: `box${p.props.seed ?? ''}` }), ix, iy, iw, ih, 1, { state: p.props.state, T: 20, clock: o.clock || 0 });
  say(ctx, String(p.label), o.x, box.y0 + box.h - 2.6 * sc, Math.max(6.5, 2.6 * sc), { align: 'center', weight: 700 });
}

registerPiece('jar', {
  kind: { r: 7.5, rect: RECT_JAR, nojoin: true },
  paint: paintJar,
  faceKey: p => `jar|${p.label}|${p.props.mass ?? ''}`,
  printed: p => String(p.label)
});
registerPiece('pbox', {
  kind: { r: 8.5, rect: RECT_BOX, nojoin: true },
  paint: paintBox,
  faceKey: p => `pbox|${p.label}|${p.props.state}|${p.props.seed ?? ''}`,
  printed: p => String(p.label)
});

/** A sealed jar. `sample` is a `SAMPLES` id; `state` (stated outright) or `T` (degC) fixes its state; `split` is a jar of what water splits into. */
export const jarCard = (id, label, at, { sample = 'H2O', state = null, T = null, split = false, mass = null } = {}, extra = {}) => ({
  id, kind: 'jar', label, at, props: { sample, ...(state ? { state } : {}), ...(T != null ? { T } : {}), ...(split ? { split: true } : {}), ...(mass != null ? { mass } : {}) }, ...extra
});
/** A box of molecules in a state; `seed` varies the arrangement. */
export const boxCard = (id, label, at, state, seed = '', extra = {}) => ({ id, kind: 'pbox', label, at, props: { state, seed }, ...extra });

/* ------------------------------------------------------------------
   THE PRESS AND THE TANK
   ------------------------------------------------------------------ */

const CYL = { x0: 31, x1: 45, y0: 12.6, y1: 34.6 };
const TANK = { x0: 52, x1: 87, y0: 14, y1: 34.6 };
/** The area of every sample, in table units squared: the same amount in the tube and in the tank. */
const AREA = 150;
const BLOCK = { w: 10, h: AREA / 10 };

const SOLID_TONE = '#c9d3d8'; const LIQUID_TONE = 'rgba(86,128,168,0.8)'; const GAS_TONE = 'rgba(190,182,166,0.62)';

const squeezeLevel = f => Math.round(f.dials.squeeze.value);

/** The press's picture state: the jar, its state, how far the piston goes, and whether it has been poured. */
export function pressRead(state, fid) {
  const f = state.fixtures[fid];
  const jar = seatedIn(state, f.props.slot);
  const level = squeezeLevel(f);
  if (!jar) return { jar: null, level, st: null, ratio: 1, poured: false };
  const st = jarStateOf(jar);
  return { jar, level, st, ratio: squeezeRatio(st, level), poured: Boolean(jar.props.poured), shape: pourShape(st) };
}

/**
 * The molecules of a sample drawn as moving dots inside the rectangle (x0, y0, w, h) of a fixture: a gas flies about and bounces, so
 * squeezing it into less volume packs the same dots into less space; a liquid's dots slide past one another; a solid's dots shake in a lattice.
 */
export function jarDots(ctx, F, st, region, t, T = 20, n = 36) {
  const r = Math.max(1.5, F.len(st === 'gas' ? 0.5 : 0.62));
  ctx.fillStyle = st === 'gas' ? '#d8cfbc' : st === 'liquid' ? '#d6ecfa' : '#35505f';
  const cols = Math.max(1, Math.round(Math.sqrt(n * region.w / Math.max(1, region.h))));
  const rows = Math.ceil(n / cols);
  const pitch = Math.min(region.w / cols, region.h / rows);
  const box = { x0: region.x0 + 0.4, y0: region.y0 + 0.4, w: region.w - 0.8, h: region.h - 0.8 };
  for (let i = 0; i < n; i++) {
    const home = [region.x0 + ((i % cols) + 0.5) * (region.w / cols), region.y0 + (Math.floor(i / cols) + 0.5) * (region.h / rows)];
    const [x, y] = placeIn(st, i, t, T, home, box, pitch * 0.3);
    ctx.beginPath(); ctx.arc(F.x(x), F.y(y), r, 0, Math.PI * 2); ctx.fill();
  }
}

function paintPress(ctx, f, state, b) {
  const F = frameOf(b);
  const r = pressRead(state, f.id);
  const H = CYL.y1 - CYL.y0; const cw = CYL.x1 - CYL.x0;
  ctx.fillStyle = '#100f0c';
  ctx.fillRect(F.x(CYL.x0), F.y(CYL.y0), F.len(cw), F.len(H));
  ctx.fillRect(F.x(TANK.x0), F.y(TANK.y0), F.len(TANK.x1 - TANK.x0), F.len(TANK.y1 - TANK.y0));
  // The tube: contents and piston.
  let pistonY = CYL.y0;
  if (r.jar && !r.poured) {
    const sh = AREA / cw; // the height a liquid stands at
    const top = r.st === 'gas' ? CYL.y1 - H * r.ratio : r.st === 'solid' ? CYL.y1 - BLOCK.h : CYL.y1 - sh;
    const free = CYL.y1 - H / (r.level === 1 ? 1 : [1, 1.5, 2, 3][r.level - 1]);
    pistonY = Math.min(free, top);
    if (r.st === 'gas') {
      if (!b.bodies) jarDots(ctx, F, 'gas', { x0: CYL.x0, y0: pistonY + 1.4, w: cw, h: CYL.y1 - pistonY - 1.4 }, b.clock || 0, r.jar.props.T ?? 20);
    } else if (r.st === 'solid') {
      ctx.fillStyle = SOLID_TONE; ctx.fillRect(F.x(CYL.x0 + (cw - BLOCK.w) / 2), F.y(CYL.y1 - BLOCK.h), F.len(BLOCK.w), F.len(BLOCK.h));
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(F.x(CYL.x0 + (cw - BLOCK.w) / 2), F.y(CYL.y1 - BLOCK.h), F.len(BLOCK.w), Math.max(1, F.len(0.8)));
      if (!b.bodies) jarDots(ctx, F, 'solid', { x0: CYL.x0 + (cw - BLOCK.w) / 2 + 0.6, y0: CYL.y1 - BLOCK.h + 1.4, w: BLOCK.w - 1.2, h: BLOCK.h - 2 }, b.clock || 0, r.jar.props.T ?? 20);
    } else {
      ctx.fillStyle = LIQUID_TONE; ctx.fillRect(F.x(CYL.x0), F.y(CYL.y1 - sh), F.len(cw), F.len(sh));
      ctx.fillStyle = 'rgba(200,225,245,0.5)'; ctx.fillRect(F.x(CYL.x0), F.y(CYL.y1 - sh), F.len(cw), Math.max(1, F.len(0.5)));
      if (!b.bodies) jarDots(ctx, F, 'liquid', { x0: CYL.x0 + 0.4, y0: CYL.y1 - sh + 1, w: cw - 0.8, h: sh - 1.4 }, b.clock || 0, r.jar.props.T ?? 20);
    }
  }
  ctx.strokeStyle = DUST; ctx.lineWidth = Math.max(1, F.len(0.3));
  ctx.beginPath(); ctx.moveTo(F.x((CYL.x0 + CYL.x1) / 2), F.y(CYL.y0 - 1.6)); ctx.lineTo(F.x((CYL.x0 + CYL.x1) / 2), F.y(pistonY)); ctx.stroke();
  ctx.fillStyle = '#8a8274'; ctx.fillRect(F.x(CYL.x0), F.y(pistonY), F.len(cw), F.len(1.2));
  ctx.lineWidth = 1;
  ctx.strokeStyle = STEEL;
  ctx.strokeRect(Math.round(F.x(CYL.x0)) + 0.5, Math.round(F.y(CYL.y0)) + 0.5, Math.round(F.len(cw)), Math.round(F.len(H)));
  // The tank: what the jar did when it was poured.
  const tw = TANK.x1 - TANK.x0; const th = TANK.y1 - TANK.y0;
  if (r.jar && r.poured) {
    if (r.shape === 'lump') {
      ctx.fillStyle = SOLID_TONE; ctx.fillRect(F.x(TANK.x0 + 4), F.y(TANK.y1 - BLOCK.h), F.len(BLOCK.w), F.len(BLOCK.h));
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(F.x(TANK.x0 + 4), F.y(TANK.y1 - BLOCK.h), F.len(BLOCK.w), Math.max(1, F.len(0.8)));
      if (!b.bodies) jarDots(ctx, F, 'solid', { x0: TANK.x0 + 4.6, y0: TANK.y1 - BLOCK.h + 1.4, w: BLOCK.w - 1.2, h: BLOCK.h - 2 }, b.clock || 0, r.jar.props.T ?? 20);
    } else if (r.shape === 'pool') {
      const lh = AREA / tw;
      ctx.fillStyle = LIQUID_TONE; ctx.fillRect(F.x(TANK.x0), F.y(TANK.y1 - lh), F.len(tw), F.len(lh));
      ctx.fillStyle = 'rgba(200,225,245,0.5)'; ctx.fillRect(F.x(TANK.x0), F.y(TANK.y1 - lh), F.len(tw), Math.max(1, F.len(0.5)));
      if (!b.bodies) jarDots(ctx, F, 'liquid', { x0: TANK.x0 + 0.4, y0: TANK.y1 - lh + 1, w: tw - 0.8, h: lh - 1.4 }, b.clock || 0, r.jar.props.T ?? 20);
    } else if (!b.bodies) jarDots(ctx, F, 'gas', { x0: TANK.x0, y0: TANK.y0, w: tw, h: th }, b.clock || 0, r.jar.props.T ?? 20);
  }
  ctx.strokeStyle = STEEL;
  ctx.strokeRect(Math.round(F.x(TANK.x0)) + 0.5, Math.round(F.y(TANK.y0)) + 0.5, Math.round(F.len(tw)), Math.round(F.len(th)));
}

/** Pour: the jar in the slot is tipped into the tank. Taking it out and putting it back pours it again (`settle` clears the pour). */
function runPress(state, fid) {
  const r = pressRead(state, fid);
  if (!r.jar) return { noop: 'Put a jar in the square first.' };
  if (r.poured) return { noop: 'That jar is already poured. Take it out and put it back to pour it again.' };
  return { stamp: { [r.jar.id]: { poured: true, did: { ...(r.jar.props.did || {}), pour: r.shape } } } };
}

/** A jar remembers what it was put through: the smallest share of its volume it was squeezed to, and the shape it took when poured. */
function settlePress(state) {
  for (const f of Object.values(state.fixtures)) {
    if (f.kind !== 'press') continue;
    const seated = seatedIn(state, f.props.slot);
    for (const p of Object.values(state.pieces)) {
      if (p.kind !== 'jar') continue;
      if (p !== seated && p.props.poured) delete p.props.poured;
    }
    if (seated) {
      const level = squeezeLevel(f);
      if (level > 1) {
        const ratio = squeezeRatio(jarStateOf(seated), level);
        const did = seated.props.did || {};
        seated.props.did = { ...did, sq: Math.min(did.sq ?? 1, ratio) };
      }
    }
  }
}

registerFixture('press', { paint: paintPress, run: runPress, settle: settlePress });

/** The press and tank. Returns the fixture, the slot to stand where it says, and its size. */
export function pressFixture(id, at, { w = 90, title = 'Piston and tank' } = {}) {
  const top = contentTop(1);
  const h = 42;
  const slotId = `${id}.well`;
  const x0 = at.x - w / 2; const y0 = at.y - h / 2;
  return {
    fixture: {
      id, kind: 'press', label: title, at: { ...at }, size: { w, h }, runLabel: 'Pour',
      dials: { squeeze: { min: 1, max: 4, step: 1, value: 1, label: 'Piston', labels: [...SQUEEZE_NAMES] } },
      props: { backdrop: true, slot: slotId }
    },
    slot: { id: slotId, label: ' ', at: { x: x0 + 15, y: y0 + top + 9.5 }, size: { w: 24, h: 17 } },
    slotId, size: { w, h }
  };
}

/* ------------------------------------------------------------------
   THE WINDOW
   ------------------------------------------------------------------ */

const CELL = { x0: 31, y0: 12.4, w: 38, h: 26 };

/** The window's read: the jar, the heater, the molecules in the glass, and what the reader has named at each temperature. */
export function windowRead(state, fid) {
  const f = state.fixtures[fid];
  const jar = seatedIn(state, f.props.slot);
  const T = f.props.Ts[Math.round(f.dials.heat.value) - 1];
  if (!jar) return { jar: null, T, reads: {}, here: null };
  const { state: st, mols } = windowMolecules({ sample: jar.props.sample, state: jar.props.state, split: jar.props.split }, T);
  const reads = jar.props.reads || {};
  return { jar, T, st, mols, reads, here: reads[String(T)] ?? null };
}

function paintWindow(ctx, f, state, b) {
  const F = frameOf(b);
  const r = windowRead(state, f.id);
  ctx.fillStyle = '#100f0c'; ctx.fillRect(F.x(CELL.x0), F.y(CELL.y0), F.len(CELL.w), F.len(CELL.h));
  if (r.jar && !b.bodies) {
    const parts = arrange({ state: r.st, T: r.T, mols: r.mols, seed: `win${r.jar.id}` });
    paintCrowd(ctx, parts, F.x(CELL.x0), F.y(CELL.y0), F.len(CELL.w), F.len(CELL.h), 1, { state: r.st, T: r.T, clock: b.clock || 0, mark: Boolean(r.here) });
  }
  ctx.strokeStyle = STEEL;
  ctx.strokeRect(Math.round(F.x(CELL.x0)) + 0.5, Math.round(F.y(CELL.y0)) + 0.5, Math.round(F.len(CELL.w)), Math.round(F.len(CELL.h)));
  // What the reader has named, one line for every temperature it was pressed at.
  say(ctx, 'ANALYZER', F.x(3), F.y(31.4), F.size(1.9, 5.8), { color: DIM });
  const rows = r.jar ? Object.entries(r.reads).map(([T, n]) => [Number(T), n]).sort((a, c) => a[0] - c[0]) : [];
  rows.slice(0, 3).forEach(([T, n], i) => {
    const here = T === r.T;
    say(ctx, `${degC(T)}  ${n}`, F.x(3), F.y(35 + i * 3.6), F.size(2.4, 6), { color: here ? AMBER : DUST, weight: here ? 700 : 500, maxW: F.len(27) });
  });
}

function runWindow(state, fid) {
  const r = windowRead(state, fid);
  if (!r.jar) return { noop: 'Put a jar in the square first.' };
  const names = readerNames({ sample: r.jar.props.sample, split: r.jar.props.split });
  return { stamp: { [r.jar.id]: { reads: { ...r.reads, [String(r.T)]: names } } } };
}

registerFixture('window', { paint: paintWindow, run: runWindow });

/** The window: Ts are the heater's temperatures in degC. */
export function windowFixture(id, at, { Ts, title = 'Window' } = {}) {
  const top = contentTop(1);
  const w = 72; const h = 46.5;
  const slotId = `${id}.well`;
  const x0 = at.x - w / 2; const y0 = at.y - h / 2;
  return {
    fixture: {
      id, kind: 'window', label: title, at: { ...at }, size: { w, h }, runLabel: 'Read Molecule',
      dials: { heat: { min: 1, max: Ts.length, step: 1, value: 1, label: 'Heater', labels: Ts.map(degC) } },
      props: { backdrop: true, slot: slotId, Ts: [...Ts] }
    },
    slot: { id: slotId, label: ' ', at: { x: x0 + 15, y: y0 + top + 9.5 }, size: { w: 24, h: 17 } },
    slotId, size: { w, h }
  };
}

/* ------------------------------------------------------------------
   THE BALANCE
   ------------------------------------------------------------------ */

export function scaleRead(state, fid) {
  const f = state.fixtures[fid];
  const jar = seatedIn(state, f.props.slot);
  const weighed = Boolean(jar && jar.props.mass != null);
  return { jar, weighed, value: weighed ? jar.props.mass : null };
}

function paintScale(ctx, f, state, b) {
  const F = frameOf(b);
  const r = scaleRead(state, f.id);
  say(ctx, r.weighed ? `${fmtMass(r.value)} g` : r.jar ? '—' : '', F.x(31), F.y(17), F.size(4.6, 9), { color: r.weighed ? AMBER : DUST, weight: 700 });
  // The balance's needle swings to the weight and settles, a damped swing: heavier jars swing further. (The printed mass is the reading.)
  const cx = f.size.w - 11; const cy = 13; const R = 6.5;
  ctx.strokeStyle = DIM; ctx.beginPath(); ctx.arc(F.x(cx), F.y(cy), F.len(R), Math.PI, Math.PI * 2); ctx.stroke();
  const k = r.weighed ? glide(`${b.scope || ''}scale:${f.id}:${r.jar.id}:${r.value}`, 1, b.clock || 0, { dur: 2.6 }) : 0;
  const target = r.weighed ? Math.min(1, Math.log10(1 + r.value) / 3.1) : 0;
  const swing = target * (1 - Math.exp(-5 * k) * Math.cos(11 * k)) * Math.min(1, k * 8 + (k >= 1 ? 1 : 0));
  const ang = Math.PI + swing * Math.PI;
  ctx.strokeStyle = AMBER; ctx.lineWidth = Math.max(1, F.len(0.4));
  ctx.beginPath(); ctx.moveTo(F.x(cx), F.y(cy)); ctx.lineTo(F.x(cx + Math.cos(ang) * (R - 0.8)), F.y(cy + Math.sin(ang) * (R - 0.8))); ctx.stroke(); ctx.lineWidth = 1;
  ctx.fillStyle = AMBER; ctx.beginPath(); ctx.arc(F.x(cx + Math.cos(ang) * (R - 0.8)), F.y(cy + Math.sin(ang) * (R - 0.8)), Math.max(1.5, F.len(0.6)), 0, Math.PI * 2); ctx.fill();
  (f.props.lines || []).forEach((ln, i) => say(ctx, ln, F.x(31), F.y(25 + i * 3.6), F.size(2.4, 6), { color: DUST, maxW: F.len(f.size.w - 33) }));
}

function runScale(state, fid) {
  const f = state.fixtures[fid];
  const jar = seatedIn(state, f.props.slot);
  if (!jar) return { noop: 'Put a jar on the balance first.' };
  return { stamp: { [jar.id]: { mass: jarMass(jarStateOf(jar), f.props.litres ?? 1) } } };
}

registerFixture('jarscale', { paint: paintScale, run: runScale });

/** The balance: one pan, equal jars of `litres` each. `lines` are printed under the reading. */
export function scaleFixture(id, at, { litres = 1, lines = [], title = 'Balance' } = {}) {
  const top = contentTop(0);
  const w = 58; const h = 40;
  const slotId = `${id}.pan`;
  const x0 = at.x - w / 2; const y0 = at.y - h / 2;
  return {
    fixture: { id, kind: 'jarscale', label: title, at: { ...at }, size: { w, h }, runLabel: 'Weigh', dials: {}, props: { backdrop: true, slot: slotId, litres, lines } },
    slot: { id: slotId, label: ' ', at: { x: x0 + 15, y: y0 + top + 9.5 }, size: { w: 24, h: 17 } },
    slotId, size: { w, h }
  };
}

/* ------------------------------------------------------------------
   THE TOUR
   ------------------------------------------------------------------ */

addTourText({
  'matter:press': {
    title: 'Piston and tank', dials: false,
    text: 'A jar goes in the square on the left. Beside it stands a glass tube with a piston, and past that a wide empty tank. Turn the "Piston" dial to push the piston down on the contents of the jar, and press "Pour" to tip the contents into the tank. The picture shows what the contents do. Take the jar out and put it back to pour it again.'
  },
  'matter:window': {
    title: 'Window and analyzer', dials: false,
    text: 'A jar goes in the square on the left, and the glass on the right shows the molecules inside it. The short streak behind each molecule shows how far it moves in a moment. Turn the "Heater" dial to set the temperature of the jar in degrees Celsius. Press "Read Molecule" and the analyzer names the molecules in the glass, then keeps a line for each temperature you pressed it at.'
  },
  'matter:jarscale': {
    title: 'Balance', dials: false,
    text: 'The balance has one balance, and every jar is the same size. Drag a jar onto the balance and press "Weigh". The balance prints how much the jar weighs, and the jar keeps that number when you take it off.'
  }
}, {
  jar: ['Jars', 'Each jar is sealed, and its label is all it shows. Drag a jar into the square of an instrument to try it, or into a tray, a slot or onto the strip to file it.'],
  pbox: ['Molecule boxes', 'Each box is a picture of the molecules in one jar at one moment. A short streak behind a molecule shows how far it moves in a moment. Drag a box into a tray to file it. A real gas has far wider gaps than the picture can fit.']
});

/**
 * A tray that shows what a poured sample did in the tank, as the moving particles themselves: `lump` (solid, shaking in place), `pool`
 * (liquid, sliding along the bottom) or `spread` (gas, flying through the whole tank). The student files a jar under the picture its
 * contents made.
 */
export function paintTrayView(ctx, t, state, o) {
  const F = { x: o.X, y: o.Y, len: d => d * o.sc };
  const r = o.r;
  const x0 = r.x0 + 1.2; const w = r.w - 2.4; const y0 = r.y0 + 1.2; const h = r.h - 5.2;
  const ck = o.clock || 0;
  if (t.view === 'lump') jarDots(ctx, F, 'solid', { x0: x0 + w * 0.25, y0: y0 + h * 0.4, w: w * 0.5, h: h * 0.6 }, ck, 20, 20);
  else if (t.view === 'pool') jarDots(ctx, F, 'liquid', { x0, y0: y0 + h * 0.72, w, h: h * 0.28 }, ck, 20, 20);
  else if (t.view === 'spread') jarDots(ctx, F, 'gas', { x0, y0, w, h }, ck, 20, 20);
  else if (t.view === 'crystal') jarDots(ctx, F, 'solid', { x0, y0, w, h }, ck, 20, 24);
  else if (t.view === 'glass') {
    // No repeating pattern: the same number of particles at irregular places, shaking where they stand.
    ctx.fillStyle = '#35505f';
    for (let i = 0; i < 24; i++) {
      const [dx, dy] = shakeAt(i, ck, 0.3);
      ctx.beginPath(); ctx.arc(o.X(x0 + 1 + h01(i, 21) * (w - 2) + dx), o.Y(y0 + 1 + h01(i, 22) * (h - 2) + dy), Math.max(1.5, o.sc * 0.62), 0, Math.PI * 2); ctx.fill();
    }
  } else if (t.view === 'apart') jarDots(ctx, F, 'liquid', { x0, y0, w, h }, ck, 20, 16);
  else if (t.view === 'together') jarDots(ctx, F, 'solid', { x0: x0 + w * 0.3, y0: y0 + h * 0.3, w: w * 0.4, h: h * 0.4 }, ck, 20, 12);
}
