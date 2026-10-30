/**
 * kits/pot-ionic.js — the instruments and pieces of Kettle's q5-ionic, registered on the pot kit (`pot-registry.js`).
 *
 * THE SOLUTION JAR (piece `sol`): a jar of one dissolved salt (`cat`, `an` are `IONS` ids). It prints its formula and name; a sealed
 * jar prints only "Jar 1".
 * THE ION PUCK (piece `ion`) and THE FORMULA CHIP (piece `formula`): what an equation is built from. A puck is one ion, a chip is one
 * formula with its state.
 * THE POT (fixture `ionpot`): two seats for solution jars (or a dial of ready-made mixtures), a key that pours them together, then
 *   - the glass: cloudy when a solid forms, the solid settled at the bottom;
 *   - the WINDOW: BEFORE (the ions of the two jars, one half each) and AFTER (the ions still dissolved, the solid's ions packed
 *     together at the bottom), a disc per ion with its charge printed and a key to which ink is which;
 *   - the LAMP: two bulbs whose brightness is proportional to the number of dissolved ions, before and after.
 * THE FILTER (fixture `ionfilter`): its key lifts the solid out of the pot onto a paper.
 * Every figure is `reactdata-ionic.js` `mixOutcome` and nothing else: a painter prints, it never decides.
 */

import { PLATE_COLORS } from '../../engine/plates.js';
import { addTourText } from '../tour.js';
import { registerFixture, registerPiece } from './pot-registry.js';
import { frameOf, say, slab } from './pot-draw.js';
import { seatedIn, dialAt } from './pot-read.js';
import { contentTop } from './heat-draw.js';
import { seededRng } from './heat-read.js';
import { IONS, ionText, pretty } from '../../engine/reactdata.js';
import { mixOutcome, solution, SOLID_LOOK, SOLUTION_TINT } from '../../engine/reactdata-ionic.js';

const AMBER = PLATE_COLORS.amber;
const DUST = PLATE_COLORS.dust;
const DIM = PLATE_COLORS.dim;
const STEEL = PLATE_COLORS.steel;

/* ------------------------------------------------------------------
   INKS
   ------------------------------------------------------------------ */

/** The ink of each ion's disc (the same on the window, the key and the puck). */
export const ION_INK = Object.freeze({
  H: '#e0d8c8', Li: '#d4a6a0', Na: '#d1a06a', K: '#c98a5a', NH4: '#8fb08a', Ag: '#aeb4ba', Mg: '#a0b87a', Ca: '#c8c0a0', Ba: '#9a7ab0', Zn: '#8aa0a8',
  Al: '#b8a8c8', Fe2: '#9a8a52', Fe3: '#b0753a', Cu1: '#c88a6a', Cu2: '#4a7fb0', Pb2: '#b9a24a',
  F: '#8fc0b0', Cl: '#6fa89a', Br: '#b08a58', I: '#7d6aa8', O: '#a05050', S: '#c8c050', NO3: '#6f8fb0', OH: '#8fb0c8', SO4: '#a8786a',
  CO3: '#9aa06a', PO4: '#a890a8', C2H3O2: '#98a8c0'
});
export const inkOfIon = id => ION_INK[id] || '#b8afa0';
const WATER_INK = '#6f8fb0';
/** Dissolved ions at which a bulb is at full brightness. */
export const MAX_LAMP = 8;

const chargeMark = id => { const q = IONS[id].q; const a = Math.abs(q); return `${a > 1 ? a : ''}${q > 0 ? '+' : '−'}`; };
const solidInk = formula => (SOLID_LOOK[formula] || { ink: '#d8d2c4' }).ink;

/* ------------------------------------------------------------------
   PIECES
   ------------------------------------------------------------------ */

export const SOL_RECT = Object.freeze({ hw: 8.5, hh: 6.6 });

/** A jar of dissolved salt. `sealed` hides its name behind `label` ("Jar 1"). */
export const solutionJar = (id, at, { cat, an, label = null, sealed = false, name = null } = {}, extra = {}) => ({
  id, kind: 'sol', label: label ?? (sealed ? id : solution(cat, an).text), at, props: { cat, an, ...(sealed ? { sealed: true } : {}), ...(name ? { name } : {}) }, ...extra
});

function paintSol(ctx, p, state, o) {
  const box = slab(ctx, o, SOL_RECT, '#1d1a16');
  const sc = o.sc;
  const pr = p.props;
  const bx = o.x - 3.4 * sc; const by = box.y0 + 1.6 * sc; const bw = 6.8 * sc; const bh = 4.4 * sc;
  ctx.strokeStyle = DUST; ctx.lineWidth = 1;
  ctx.strokeRect(Math.round(bx) + 0.5, Math.round(by) + 0.5, Math.round(bw), Math.round(bh));
  const coloured = SOLUTION_TINT[pr.cat] || SOLUTION_TINT[pr.an];
  ctx.fillStyle = coloured || '#7f98a8'; ctx.globalAlpha = coloured ? 0.6 : 0.28;
  ctx.fillRect(bx + 1, by + bh * 0.3, bw - 2, bh * 0.7 - 1); ctx.globalAlpha = 1;
  ctx.fillStyle = STEEL; ctx.fillRect(bx - 0.4 * sc, by - 0.9 * sc, bw + 0.8 * sc, 0.9 * sc);
  const y = box.y0 + box.h - 5.1 * sc;
  if (pr.sealed) { say(ctx, p.label, o.x, y + 1.2 * sc, Math.max(6.2, 2.1 * sc), { align: 'center', weight: 700, maxW: box.w - 1.4 * sc }); return; }
  const s = solution(pr.cat, pr.an);
  say(ctx, s.text, o.x, y, Math.max(6.2, 2.0 * sc), { align: 'center', weight: 700, maxW: box.w - 1.4 * sc });
  say(ctx, pr.name ?? s.name, o.x, y + 2.5 * sc, Math.max(5.8, 1.55 * sc), { align: 'center', color: DUST, maxW: box.w - 1.4 * sc });
}

registerPiece('sol', {
  kind: { r: 7, rect: SOL_RECT, nojoin: true },
  paint: paintSol,
  faceKey: p => `sol|${p.label}|${p.props.cat}|${p.props.an}|${p.props.sealed ? 1 : 0}|${p.props.name ?? ''}`,
  printed: p => String(p.label)
});

/** One ion as a puck. */
export const ionPuck = (id, ionId, at, extra = {}) => ({ id, kind: 'ion', label: ionText(ionId), at, props: { ion: ionId }, ...extra });

function discOf(ctx, x, y, r, ion, mark) {
  ctx.fillStyle = inkOfIon(ion); ctx.strokeStyle = '#2e2a26';
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  if (mark) say(ctx, chargeMark(ion), x, y, Math.max(6, r * 1.05), { align: 'center', weight: 700, color: '#15130f' });
}

function paintIon(ctx, p, state, o) {
  ctx.fillStyle = inkOfIon(p.props.ion);
  ctx.beginPath(); ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = o.lit ? AMBER : '#2e2a26'; ctx.lineWidth = o.lit ? 2 : 1.2; ctx.stroke(); ctx.lineWidth = 1;
  say(ctx, p.label, o.x, o.y, Math.max(6.4, o.r * 0.56), { align: 'center', weight: 700, color: '#15130f', maxW: o.r * 1.8 });
}

registerPiece('ion', {
  kind: { r: 4.6, nojoin: true },
  paint: paintIon,
  faceKey: p => `ion|${p.props.ion}`,
  printed: p => String(p.label)
});

export const FORMULA_RECT = Object.freeze({ hw: 9.5, hh: 4.4 });

/** One formula with its state: `PbI₂(s)`. */
export const formulaChip = (id, formula, state, at, extra = {}) => ({ id, kind: 'formula', label: `${pretty(formula)}(${state})`, at, props: { f: formula, state }, ...extra });

function paintFormula(ctx, p, state, o) {
  const box = slab(ctx, o, FORMULA_RECT, '#1d1a16');
  say(ctx, p.label, o.x, o.y, Math.max(6.4, 2.0 * o.sc), { align: 'center', weight: 700, maxW: box.w - 1.6 * o.sc });
}

registerPiece('formula', {
  kind: { r: 6.2, rect: FORMULA_RECT, nojoin: true },
  paint: paintFormula,
  faceKey: p => `formula|${p.label}`,
  printed: p => String(p.label)
});

/* ------------------------------------------------------------------
   THE POT: WHAT IT READS
   ------------------------------------------------------------------ */

const sigOf = (fid, A, B) => `${fid}|${A.cat}.${A.an}+${B.cat}.${B.an}`;

/** What the pot holds and has done: the two solutions, the outcome of mixing them, whether the key was pressed for this pair, whether it was filtered. */
export function ionPotRead(state, fid) {
  const f = state.fixtures[fid];
  const p = f.props;
  let A = null; let B = null;
  let jars = [];
  if (p.mixes) {
    const pair = p.mixes[dialAt(state, fid, 'mix') - 1];
    A = pair[0]; B = pair[1];
  } else {
    jars = (p.ins || []).map(s => seatedIn(state, s));
    if (jars.length && jars.every(Boolean)) { A = { cat: jars[0].props.cat, an: jars[0].props.an }; B = { cat: jars[1].props.cat, an: jars[1].props.an }; }
  }
  const ready = Boolean(A && B);
  const out = ready ? mixOutcome(A, B) : null;
  const sig = ready ? sigOf(fid, A, B) : null;
  const ran = ready && state.recorder.rows.some(r => r.label === sig);
  const filtered = ran && state.recorder.rows.some(r => r.label === `${sig}|filter`);
  return { f, A, B, jars, ready, out, sig, ran, filtered };
}

/** Which of a dial-of-mixtures pot's mixtures have been poured together on this table (one flag per mixture). */
export const mixesRun = (state, fid) => state.fixtures[fid].props.mixes.map(([A, B]) => state.recorder.rows.some(r => r.label === sigOf(fid, A, B)));

/* ------------------------------------------------------------------
   THE POT: BUILDING IT
   ------------------------------------------------------------------ */

const SEAT = { w: 18, h: 13 };
const LW = 24;
const PANEL = { w: 26, h: 26.5 };
const LAMP_W = 22;

/**
 * The pot. Give it `mixes: [[{cat, an}, {cat, an}], ...]` for a dial of ready-made mixtures (no seats), otherwise it has two seats for
 * solution jars. `window` and `lamp` add those instruments; with no window the pot shows its glass. Returns the fixture, its seat
 * slots and its size.
 */
export function ionPotFixture(id, at, o = {}) {
  const { mixes = null, window = false, lamp = false, title = 'Pot', runLabel = 'Mix' } = o;
  const dials = {};
  if (mixes) dials.mix = { min: 1, max: mixes.length, step: 1, value: 1, label: 'Mixture', labels: mixes.map((_, i) => String(i + 1)) };
  const top = contentTop(mixes ? 1 : 0);
  const winW = PANEL.w * 2 + 3 + 2;
  const w = Math.round((LW + 2 + (window ? winW : 22) + (lamp ? LAMP_W + 2 : 0) + 2) * 10) / 10;
  const h = Math.round((top + 28 + 8) * 10) / 10;
  const x0 = at.x - w / 2; const y0 = at.y - h / 2;
  const slots = []; const ins = [];
  if (!mixes) {
    for (let i = 0; i < 2; i++) {
      const sid = `${id}.in${i + 1}`;
      ins.push(sid);
      slots.push({ id: sid, label: ' ', at: { x: x0 + 12, y: y0 + top + 7.5 + i * 14 }, size: { ...SEAT } });
    }
  }
  return {
    fixture: { id, kind: 'ionpot', label: title, at: { ...at }, size: { w, h }, dials, runLabel, props: { backdrop: true, ins, mixes, window, lamp, top } },
    slots, ins, size: { w, h }
  };
}

/** The filter: a paper that the pot's solid is lifted onto. */
export function filterFixture(id, at, { pot, title = 'Filter', runLabel = 'Filter', w = 26 } = {}) {
  return { id, kind: 'ionfilter', label: title, at: { ...at }, size: { w, h: 26 }, dials: {}, runLabel, props: { backdrop: true, pot } };
}

/* ------------------------------------------------------------------
   THE POT: DRAWING IT
   ------------------------------------------------------------------ */

/** Deterministic places for `n` discs in a rectangle: a grid shuffled by a seeded generator, so the picture never jumps between renders. */
function scatter(seed, n, x0, y0, w, h, pitch = 4.2) {
  const cols = Math.max(1, Math.floor(w / pitch)); const rows = Math.max(1, Math.floor(h / pitch));
  const cells = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) cells.push([c, r]);
  const rnd = seededRng(seed);
  for (let i = cells.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [cells[i], cells[j]] = [cells[j], cells[i]]; }
  const ox = x0 + (w - cols * pitch) / 2 + pitch / 2; const oy = y0 + (h - rows * pitch) / 2 + pitch / 2;
  return cells.slice(0, n).map(([c, r]) => ({ x: ox + c * pitch + (rnd() - 0.5) * 0.5, y: oy + r * pitch + (rnd() - 0.5) * 0.5 }));
}

const listOf = counts => Object.entries(counts).flatMap(([id, n]) => Array.from({ length: n }, () => id));

/** The packed ions of a solid, alternating where they can. */
function packed(solid) {
  const [cats, ans] = solid.ions;
  const seq = [];
  let c = cats.n; let a = ans.n;
  let nextAn = a >= c;
  while (c > 0 || a > 0) {
    if ((nextAn && a > 0) || c === 0) { seq.push(ans.ion); a--; } else { seq.push(cats.ion); c--; }
    nextAn = !nextAn;
  }
  return seq;
}
export { packed as packedIons };

function paintPanel(ctx, F, x, y, title, tintInk) {
  ctx.fillStyle = '#100f0c'; ctx.fillRect(F.x(x), F.y(y), F.len(PANEL.w), F.len(PANEL.h));
  if (tintInk) { ctx.fillStyle = tintInk; ctx.globalAlpha = 0.14; ctx.fillRect(F.x(x), F.y(y), F.len(PANEL.w), F.len(PANEL.h - 8)); ctx.globalAlpha = 1; }
  ctx.strokeStyle = STEEL; ctx.strokeRect(Math.round(F.x(x)) + 0.5, Math.round(F.y(y)) + 0.5, Math.round(F.len(PANEL.w)), Math.round(F.len(PANEL.h)));
  say(ctx, title, F.x(x + 1.4), F.y(y + 2.4), F.size(2.1, 6), { color: DIM });
}

function paintWater(ctx, x, y, r) {
  ctx.fillStyle = WATER_INK; ctx.strokeStyle = '#2e2a26';
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#d8d2c4';
  for (const dx of [-0.8, 0.8]) { ctx.beginPath(); ctx.arc(x + dx * r, y - r * 0.72, r * 0.38, 0, Math.PI * 2); ctx.fill(); }
}

function paintGlass(ctx, F, r, gx, gy, gw, gh) {
  ctx.fillStyle = '#100f0c'; ctx.fillRect(F.x(gx), F.y(gy), F.len(gw), F.len(gh));
  const solid = r.out?.solid;
  if (r.ran) {
    const tint = SOLUTION_TINT[r.A.cat] || SOLUTION_TINT[r.A.an] || SOLUTION_TINT[r.B.cat] || SOLUTION_TINT[r.B.an] || '#7f98a8';
    ctx.fillStyle = tint; ctx.globalAlpha = 0.3; ctx.fillRect(F.x(gx), F.y(gy + gh * 0.22), F.len(gw), F.len(gh * 0.78)); ctx.globalAlpha = 1;
    if (solid && !r.filtered) {
      ctx.fillStyle = solidInk(solid.formula);
      ctx.globalAlpha = 0.5; ctx.fillRect(F.x(gx), F.y(gy + gh * 0.22), F.len(gw), F.len(gh * 0.62)); ctx.globalAlpha = 1;
      ctx.fillRect(F.x(gx), F.y(gy + gh - 3.6), F.len(gw), F.len(3.6));
    }
  }
  ctx.strokeStyle = STEEL; ctx.lineWidth = 2;
  ctx.strokeRect(Math.round(F.x(gx)) + 0.5, Math.round(F.y(gy)) + 0.5, Math.round(F.len(gw)), Math.round(F.len(gh)));
  ctx.lineWidth = 1;
  say(ctx, r.ran ? (solid && !r.filtered ? 'CLOUDY' : 'CLEAR') : r.ready ? 'READY' : 'EMPTY', F.x(gx + gw / 2), F.y(gy + gh + 2.6), F.size(2.1, 6), { align: 'center', color: r.ran ? AMBER : DIM, weight: 700 });
}

function paintKey(ctx, F, items, x, y, w) {
  let cx = x; let cy = y;
  const size = F.size(1.9, 6);
  for (const item of items) {
    const label = item.water ? 'H₂O' : ionText(item.ion);
    ctx.font = `700 ${size}px "JetBrains Mono", "Quantico", monospace`;
    const tw = ctx.measureText(label).width / F.len(1);
    const need = 3.2 + tw + 1.2;
    if (cx + need > x + w) { cx = x; cy += 3.9; }
    if (item.water) paintWater(ctx, F.x(cx + 1), F.y(cy), F.len(1)); else discOf(ctx, F.x(cx + 1), F.y(cy), F.len(1), item.ion, false);
    say(ctx, label, F.x(cx + 2.6), F.y(cy), size, { color: DUST, weight: 700 });
    cx += need;
  }
}

function paintBulb(ctx, F, cx, cy, count, label) {
  const x = F.x(cx); const y = F.y(cy); const rr = F.len(3.9);
  ctx.fillStyle = '#100f0c'; ctx.beginPath(); ctx.arc(x, y, rr, 0, Math.PI * 2); ctx.fill();
  if (count > 0) { ctx.fillStyle = AMBER; ctx.globalAlpha = 0.1 + 0.85 * Math.min(1, count / MAX_LAMP); ctx.beginPath(); ctx.arc(x, y, rr - 1, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; }
  ctx.strokeStyle = STEEL; ctx.beginPath(); ctx.arc(x, y, rr, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = count > 0 ? '#15130f' : DIM; ctx.beginPath();
  ctx.moveTo(F.x(cx - 2), y + F.len(1)); ctx.lineTo(F.x(cx - 1), y - F.len(1.3)); ctx.lineTo(F.x(cx + 1), y + F.len(1.3)); ctx.lineTo(F.x(cx + 2), y - F.len(1)); ctx.stroke();
  say(ctx, label, x, y + F.len(6.5), F.size(2.1, 6), { align: 'center', color: DIM });
}

function paintIonPot(ctx, f, state, b) {
  const F = frameOf(b);
  const r = ionPotRead(state, f.id);
  const p = f.props;
  const top = p.top;
  if (p.mixes) {
    const t = side => solution(r[side].cat, r[side].an).text;
    say(ctx, t('A'), F.x(LW / 2), F.y(top + 7), F.size(2.5, 6.5), { align: 'center', weight: 700, maxW: F.len(LW - 2) });
    say(ctx, '+', F.x(LW / 2), F.y(top + 14), F.size(3, 7), { align: 'center', color: DIM });
    say(ctx, t('B'), F.x(LW / 2), F.y(top + 21), F.size(2.5, 6.5), { align: 'center', weight: 700, maxW: F.len(LW - 2) });
  }
  if (!p.window) { paintGlass(ctx, F, r, LW + 4, top + 1, 16, 22); return; }
  const wx = LW + 2;
  const solid = r.out?.solid;
  const py = top + 0.5;
  const ax = wx + PANEL.w + 3;
  paintPanel(ctx, F, wx, py, 'BEFORE', null);
  paintPanel(ctx, F, ax, py, 'AFTER', r.ran && solid && !r.filtered ? solidInk(solid.formula) : null);
  if (r.ready) {
    const o = r.out;
    const half = PANEL.w / 2;
    ctx.strokeStyle = DIM; ctx.setLineDash([2, 2]);
    ctx.beginPath(); ctx.moveTo(F.x(wx + half), F.y(py + 4.6)); ctx.lineTo(F.x(wx + half), F.y(py + 18.4)); ctx.stroke(); ctx.setLineDash([]);
    const sa = solution(r.A.cat, r.A.an); const sb = solution(r.B.cat, r.B.an);
    const ja = [...Array(o.units.a * sa.nCat).fill(r.A.cat), ...Array(o.units.a * sa.nAn).fill(r.A.an)];
    const jb = [...Array(o.units.b * sb.nCat).fill(r.B.cat), ...Array(o.units.b * sb.nAn).fill(r.B.an)];
    scatter(`${r.sig}|a`, ja.length, wx + 0.6, py + 5, half - 1.2, 13.4).forEach((q, i) => discOf(ctx, F.x(q.x), F.y(q.y), F.len(1.9), ja[i], true));
    scatter(`${r.sig}|b`, jb.length, wx + half + 0.6, py + 5, half - 1.2, 13.4).forEach((q, i) => discOf(ctx, F.x(q.x), F.y(q.y), F.len(1.9), jb[i], true));
    const keyItems = [...new Set([...ja, ...jb])].map(ion => ({ ion }));
    if (o.water) keyItems.push({ water: true });
    paintKey(ctx, F, keyItems, wx + 1, py + 20.4, PANEL.w - 1.5);
    if (r.ran) {
      const dis = listOf(o.after);
      scatter(`${r.sig}|after`, dis.length + o.water, ax + 0.6, py + 5, PANEL.w - 1.2, 13.4).forEach((q, i) => {
        if (i < dis.length) discOf(ctx, F.x(q.x), F.y(q.y), F.len(1.9), dis[i], true); else paintWater(ctx, F.x(q.x), F.y(q.y), F.len(1.9));
      });
      if (solid && !r.filtered) {
        ctx.strokeStyle = DIM; ctx.beginPath(); ctx.moveTo(F.x(ax + 0.6), F.y(py + 18.7)); ctx.lineTo(F.x(ax + PANEL.w - 0.6), F.y(py + 18.7)); ctx.stroke();
        packed(solid).forEach((ion, i) => discOf(ctx, F.x(ax + 3.4 + (i % 3) * 3.9), F.y(py + 21.2 + Math.floor(i / 3) * 3.9), F.len(1.9), ion, true));
      }
    } else {
      say(ctx, 'press Mix', F.x(ax + PANEL.w / 2), F.y(py + 12), F.size(2.1, 6), { align: 'center', color: DIM });
    }
  } else {
    say(ctx, 'no jars', F.x(wx + PANEL.w / 2), F.y(py + 12), F.size(2.1, 6), { align: 'center', color: DIM });
  }
  if (p.lamp) {
    const lx = ax + PANEL.w + 2;
    paintBulb(ctx, F, lx + 5.5, top + 7.5, r.ready ? r.out.lamp.before : 0, 'before');
    paintBulb(ctx, F, lx + 16.5, top + 7.5, r.ran ? r.out.lamp.after : 0, 'after');
    say(ctx, 'ions in the water', F.x(lx + LAMP_W / 2), F.y(top + 18), F.size(1.9, 6), { align: 'center', color: DIM, maxW: F.len(LAMP_W) });
  }
}

function runIonPot(state, fid) {
  const r = ionPotRead(state, fid);
  if (!r.ready) return { noop: 'Put a jar in each seat first.' };
  return { x: r.out.lamp.before, y: r.out.lamp.after, label: r.sig };
}

registerFixture('ionpot', { paint: paintIonPot, run: runIonPot });

/* ------------------------------------------------------------------
   THE FILTER
   ------------------------------------------------------------------ */

export function filterRead(state, fid) {
  const f = state.fixtures[fid];
  const pot = ionPotRead(state, f.props.pot);
  const solid = pot.out?.solid || null;
  return { f, pot, solid, done: Boolean(pot.filtered && solid) };
}

function paintFilter(ctx, f, state, b) {
  const F = frameOf(b);
  const r = filterRead(state, f.id);
  const gx = 4; const gy = 10.5; const gw = f.size.w - 8; const gh = 9;
  ctx.fillStyle = '#100f0c'; ctx.fillRect(F.x(gx), F.y(gy), F.len(gw), F.len(gh));
  ctx.strokeStyle = STEEL; ctx.strokeRect(Math.round(F.x(gx)) + 0.5, Math.round(F.y(gy)) + 0.5, Math.round(F.len(gw)), Math.round(F.len(gh)));
  if (r.done) {
    ctx.fillStyle = solidInk(r.solid.formula);
    const rnd = seededRng(`${r.pot.sig}|paper`);
    for (let i = 0; i < 26; i++) { ctx.beginPath(); ctx.arc(F.x(gx + 1.5 + rnd() * (gw - 3)), F.y(gy + 1.4 + rnd() * (gh - 2.8)), F.len(0.6), 0, Math.PI * 2); ctx.fill(); }
  }
  say(ctx, r.done ? 'SOLID ON PAPER' : 'PAPER', F.x(f.size.w / 2), F.y(gy + gh + 3), F.size(2.1, 6), { align: 'center', color: r.done ? AMBER : DIM, weight: 700, maxW: F.len(f.size.w - 3) });
}

function runFilter(state, fid) {
  const r = filterRead(state, fid);
  if (!r.pot.ran) return { noop: 'Nothing has been mixed in the pot yet.' };
  if (!r.solid) return { noop: 'The pot holds nothing to filter out.' };
  return { x: r.pot.out.lamp.after, y: r.solid.units, label: `${r.pot.sig}|filter` };
}

registerFixture('ionfilter', { paint: paintFilter, run: runFilter });

/* ------------------------------------------------------------------
   TOUR WORDS
   ------------------------------------------------------------------ */

const POT_TEXT = f => {
  const p = f.props;
  const bits = [];
  if (p.mixes) bits.push('The "Mixture" dial picks which two solutions are poured in; their formulas are printed at the left.');
  else bits.push('Drag a jar into each of the two seats at the left.');
  bits.push('Press "Mix" to pour them together. Each jar pours in just the amount that is used up.');
  if (p.window) bits.push('The window shows the ions before pouring, one half for each jar, and after: the ions still dissolved, with any ions that left the water packed together at the bottom. Each disc is one ion with its charge on it, and the key under BEFORE says which ink is which.');
  else bits.push('The glass shows what the pot looks like afterwards.');
  if (p.lamp) bits.push('The two bulbs shine brighter the more ions are dissolved in the water.');
  return bits.join(' ');
};

addTourText({
  'pot:ionpot': { title: 'Pot', dials: false, text: POT_TEXT },
  'pot:ionfilter': { title: 'Filter', text: 'Press "Filter" after mixing to lift any solid out of the pot onto the paper. The paper shows what was caught.' }
}, {
  sol: ['Solution jars', 'Each jar holds a salt dissolved in water: its formula is printed, with its name under it. A jar called Jar 1 or Jar 2 is sealed. Drag a jar into a seat of the pot.'],
  ion: ['Ion pucks', 'Each puck is one ion. The charge is on the puck and its ink matches the discs in the window. Drag a puck into a place on the table to count it there.'],
  formula: ['Formula chips', 'Each chip is one substance written as a formula, with (s) for a solid, (aq) for dissolved and (l) for a liquid. Drag a chip into a place on the table to count it there.']
});
