/**
 * kits/ph-pour.js — the pour window, registered on the ph kit (`ph-registry.js`). Verdigris's first bench (`q1-handover`).
 *
 *   POUR WINDOW  a magnified square of 8 cells, each a formula unit of what was poured beside the one water molecule it touches, drawn as
 *                spheres (a big sphere for the heavy atom, small ones for hydrogens). "Pour" lets the solution act: every unit the planner says
 *                has handed over or taken a proton shows its two new particles. The Mark dial paints chosen atoms white (a hydrogen of the
 *                substance, a hydrogen of the water) or a lone pair gold, so the player can follow where an atom ends up.
 *
 * A THIN WRAPPER over `engine/phdata.js` through `ph-read.js` `windowOf`: the number of cells that change is the planner's, never typed.
 * The window is flat (spheres on the mat), with a low glass dish round it at `3D On`, as the flask's is.
 */

import { PLATE_COLORS } from '../../engine/plates.js';
import { registerFixture, registerPiece } from './ph-registry.js';
import { slab } from './matter-draw.js';
import { frameOf } from './matter-draw.js';
import { put, ball, H_INK, OH_INK, ACID_INK, BASE_INK, ionText } from './ph-flask.js';
import { windowOf, cellGrid, ionizedCells, seedOf, concText } from './ph-read.js';
import { ACIDS, BASES, LEWIS, formulaStats } from '../../engine/phdata.js';
import './ph-pour-tour.js';

const DUST = PLATE_COLORS.dust;
const DIM = PLATE_COLORS.dim;
const STEEL = PLATE_COLORS.steel;
const TEXT = PLATE_COLORS.text;

export const WATER_INK = '#7d8b97';
export const HYD_INK = '#5e584e';
export const TAG_INK = '#f4f0e6';
export const PAIR_INK = '#e8c15a';
const F_INK = '#8a9a6a';
export const POUR_UNITS = 8;
const WIN_TOP = 14.5;

/** The formulas of what a pour scene is made of. */
export function sceneNames(p) {
  if (p.scene === 'lewis') return { solute: LEWIS.base, other: LEWIS.acid, adduct: LEWIS.adduct };
  if (p.scene === 'acid') { const a = ACIDS[p.solute.id]; return { solute: a.formula, left: a.base }; }
  const b = BASES[p.solute.id]; return { solute: b.formula, left: b.acid };
}

/** What a pour reads: whether it has been poured, which mark is on, how many cells changed (the planner's count). */
export function pourRead(state, fid) {
  const f = state.fixtures[fid];
  const p = f.props;
  const poured = f.dials.poured.value >= 1;
  const mark = p.marks[Math.round(f.dials.mark.value) - 1] || 'off';
  const units = p.units;
  const moved = p.scene === 'lewis' ? Math.round(units * LEWIS.share) : windowOf({ solute: p.solute, units }).ionized;
  return { poured, mark, units, moved, scene: p.scene };
}

/* ------------------------------------------------------------------ one molecule */

function atoms(ctx, F, cx, cy, R, core, n, tags, extra = {}) {
  const hr = R * 0.5;
  const d = R + hr * 0.75;
  const pos = [];
  const k = Math.max(n, 1);
  for (let i = 0; i < n; i++) {
    const a = (extra.angle ?? -Math.PI / 2) + (Math.PI * 2 * i) / k + (n === 1 ? Math.PI * 0.3 : 0);
    pos.push([cx + Math.cos(a) * d, cy + Math.sin(a) * d]);
  }
  pos.forEach(([x, y], i) => ball(ctx, x, y, hr, tags[i] ? TAG_INK : HYD_INK));
  ball(ctx, cx, cy, R, core);
  if (extra.pair) {
    ctx.fillStyle = PAIR_INK;
    for (const dx of [-0.4, 0.4]) { ctx.beginPath(); ctx.arc(cx + dx * R, cy - R * 1.05, Math.max(1.3, R * 0.2), 0, Math.PI * 2); ctx.fill(); }
  }
  return pos;
}

function paintWindow(ctx, F, f, state, x, y, w, h) {
  const p = f.props;
  const r = pourRead(state, f.id);
  ctx.fillStyle = '#100f0c'; ctx.fillRect(F.x(x), F.y(y), F.len(w), F.len(h));
  ctx.strokeStyle = STEEL; ctx.strokeRect(Math.round(F.x(x)) + 0.5, Math.round(F.y(y)) + 0.5, Math.round(F.len(w)), Math.round(F.len(h)));
  const cells = cellGrid(r.units, p.cols, x + 0.6, y + 0.6, w - 1.2, h - 1.2);
  const gone = ionizedCells(r.units, r.moved, seedOf(p.solute ? { solute: p.solute } : { solute: { id: 'lewis', c: 1 } }));
  const nm = sceneNames(p);
  const hs = formulaStats(nm.solute).h;
  cells.forEach((c, i) => {
    const R = F.len(Math.min(c.cw * 0.2, c.ch * 0.3));
    const lx = F.x(c.x - c.cw * 0.22); const rx = F.x(c.x + c.cw * 0.22); const cy = F.y(c.y);
    const done = r.poured && gone.has(i);
    const tagS = r.mark === 'solute'; const tagW = r.mark === 'water';
    if (p.scene === 'acid') {
      if (!done) {
        atoms(ctx, F, lx, cy, R, ACID_INK, 1, [tagS]);
        atoms(ctx, F, rx, cy, R, WATER_INK, 2, [tagW, tagW], { angle: -Math.PI / 2 });
      } else {
        atoms(ctx, F, lx, cy, R, BASE_INK, 0, []);
        atoms(ctx, F, rx, cy, R, H_INK, 3, [tagW, tagW, tagS]);
      }
    } else if (p.scene === 'base') {
      const sh = Array(hs).fill(tagS);
      if (!done) {
        atoms(ctx, F, lx, cy, R, BASE_INK, hs, sh);
        atoms(ctx, F, rx, cy, R, WATER_INK, 2, [tagW, tagW]);
      } else {
        atoms(ctx, F, lx, cy, R, ACID_INK, hs + 1, [...sh, tagW]);
        atoms(ctx, F, rx, cy, R, OH_INK, 1, [tagW]);
      }
    } else {
      const sh = Array(hs).fill(tagS);
      const pairOn = r.mark === 'pair';
      const lx2 = done ? F.x(c.x - c.cw * 0.12) : lx; const rx2 = done ? F.x(c.x + c.cw * 0.12) : rx;
      atoms(ctx, F, lx2, cy, R, BASE_INK, hs, sh, { pair: pairOn && !done, angle: Math.PI / 2 });
      if (done) {
        ctx.strokeStyle = DUST; ctx.lineWidth = Math.max(1, F.len(0.3));
        ctx.beginPath(); ctx.moveTo(lx2 + R, cy); ctx.lineTo(rx2 - R, cy); ctx.stroke(); ctx.lineWidth = 1;
        if (pairOn) { ctx.fillStyle = PAIR_INK; for (const dy of [-0.3, 0.3]) { ctx.beginPath(); ctx.arc((lx2 + rx2) / 2, cy + dy * R, Math.max(1.3, R * 0.2), 0, Math.PI * 2); ctx.fill(); } }
      }
      ball(ctx, rx2, cy, R, ACID_INK);
      for (let k = 0; k < 3; k++) { const a = Math.PI / 2 + 0.9 * (k - 1) + Math.PI / 2; ball(ctx, rx2 + Math.cos(a) * R * 1.45 + (done ? 0 : 0), cy + Math.sin(a) * R * 1.45, R * 0.45, F_INK); }
    }
  });
  return r;
}

function legendItems(p, r) {
  const nm = sceneNames(p);
  const none = r.moved === 0;
  const items = [];
  if (p.scene === 'acid') {
    if (!r.poured || r.moved < r.units) items.push([ACID_INK, nm.solute], [WATER_INK, 'H₂O']);
    if (r.poured && !none) items.push([BASE_INK, nm.left], [H_INK, 'H₃O⁺']);
  } else if (p.scene === 'base') {
    if (!r.poured || r.moved < r.units) items.push([BASE_INK, nm.solute], [WATER_INK, 'H₂O']);
    if (r.poured && !none) items.push([ACID_INK, nm.left], [OH_INK, 'OH⁻']);
  } else {
    items.push([BASE_INK, LEWIS.base], [ACID_INK, LEWIS.acid]);
  }
  if (r.mark === 'solute') items.push([TAG_INK, `${nm.solute} hydrogens`]);
  if (r.mark === 'water') items.push([TAG_INK, 'water hydrogens']);
  if (r.mark === 'pair') items.push([PAIR_INK, 'lone pair']);
  return items;
}

function paintPour(ctx, f, state, b) {
  const F = frameOf(b);
  const p = f.props;
  put(ctx, p.strength, F.x(f.size.w - 2), F.y(3.6), F.size(2.6, 6.4), { align: 'right', color: TEXT, weight: 700 });
  const r = paintWindow(ctx, F, f, state, 2, WIN_TOP, f.size.w - 4, p.wh);
  const items = legendItems(p, r);
  const size = F.size(1.9, 5.8); const sw = F.len(1.7); const u = F.len(1);
  const x = 2; const w = f.size.w - 4 - 14; let cx = x; let cy = WIN_TOP + p.wh + 3;
  for (const [ink, name0] of items) {
    const name = ionText(name0);
    ctx.font = `500 ${size}px "Quantico", "JetBrains Mono", sans-serif`;
    const tu = (ctx.measureText(name).width + sw + F.len(2.4)) / u;
    if (cx + tu > x + w && cx > x) { cx = x; cy += 3.3; }
    ctx.fillStyle = ink; ctx.beginPath(); ctx.arc(F.x(cx) + sw / 2, F.y(cy), sw / 2, 0, Math.PI * 2); ctx.fill();
    put(ctx, name, F.x(cx) + sw + F.len(0.6), F.y(cy), size, { align: 'left', color: DUST });
    cx += tu;
  }
}

function runPour(state, fid) {
  const r = pourRead(state, fid);
  if (r.poured) return { noop: 'It is already poured. Start Over puts it back.' };
  return { x: state.recorder.rows.length + 1, y: r.moved, label: fid, dials: { [fid]: { poured: 1 } } };
}

registerFixture('phpour', { paint: paintPour, run: runPour, dress3d: dressPour });

function dressPour(f, state, c) {
  const { THREE: T, scale: s, toPlate, box } = c;
  const group = new T.Group();
  const w = f.size.w - 4; const h = f.props.wh;
  const cx = box.x0 + 2 + w / 2; const cy = box.y0 + WIN_TOP + h / 2;
  const t = 0.005; const H = 0.024;
  const wall = (lw, ld, dx, dz) => {
    const m = new T.Mesh(new T.BoxGeometry(lw, H, ld), c.mats.labGlass);
    const q = toPlate({ x: cx, y: cy });
    m.position.set(q.x + dx, c.ground + H / 2, q.z + dz);
    group.add(m);
  };
  wall(w * s + 2 * t, t, 0, -(h * s) / 2 - t / 2);
  wall(w * s + 2 * t, t, 0, (h * s) / 2 + t / 2);
  wall(t, h * s, -(w * s) / 2 - t / 2, 0);
  wall(t, h * s, (w * s) / 2 + t / 2, 0);
  return group;
}

/**
 * A pour window. `scene`: 'acid' (solute an ACIDS id), 'base' (a BASES id) or 'lewis'. `solute`: `{ id, c }`. `mark`: 'free' (the Mark dial
 * is on the plate) or a mark id that is set and hidden. Returns the fixture and its size.
 */
export function pourFixture(id, at, { scene, solute = null, label = 'Pour window', w = 100, window = 34, mark = 'free', cols = 4, units = POUR_UNITS } = {}) {
  const nm = sceneNames({ scene, solute });
  const marks = scene === 'lewis' ? ['off', 'solute', 'pair'] : ['off', 'solute', 'water'];
  const labels = scene === 'lewis' ? ['Off', `${nm.solute} hydrogens`, 'Lone pairs'] : ['Off', `${nm.solute} hydrogens`, 'Water hydrogens'];
  const hidden = mark !== 'free';
  const start = hidden ? marks.indexOf(mark) + 1 : 1;
  const h = Math.round((WIN_TOP + window + 3 + 3.3 * 2 + 4) * 10) / 10;
  return {
    id, kind: 'phpour', label, at: { ...at }, size: { w, h }, runLabel: 'Pour',
    dials: {
      mark: { min: 1, max: 3, step: 1, value: start, label: 'Mark', labels },
      poured: { min: 0, max: 1, step: 1, value: 0, label: 'Poured' }
    },
    props: {
      hidden: hidden ? ['mark', 'poured'] : ['poured'], backdrop: true, scene, solute: solute ? { ...solute } : null, units, cols, wh: window, marks,
      strength: scene === 'lewis' ? '' : `${concText(solute.c)} ${nm.solute}`
    }
  };
}

/* ------------------------------------------------------------------ the formula chip (a piece) */

const RECT_CHIP = { hw: 9, hh: 4.6 };
function paintChip(ctx, p, state, o) {
  const box = slab(ctx, o, RECT_CHIP, '#2a2620');
  const label = ionText(p.label);
  const size = Math.min(4.2 * o.sc, (box.w - 1.6 * o.sc) / (Math.max(2, label.length) * 0.6));
  put(ctx, label, o.x, o.y, Math.max(8, size), { weight: 700, maxW: box.w - 1.2 * o.sc });
}
registerPiece('phchip', {
  kind: { r: 8.4, rect: RECT_CHIP, nojoin: true },
  paint: paintChip,
  faceKey: p => `phchip|${p.label}`,
  printed: p => ionText(p.label)
});
/** A chip naming one substance by its formula. */
export const formulaChip = (id, label, at, extra = {}) => ({ id, kind: 'phchip', label, at, props: {}, ...extra });
