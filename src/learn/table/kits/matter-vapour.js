/**
 * kits/matter-vapour.js — the instruments and pieces of Mirrowen's q3 bench (Liquids and Vapour), registered on the matter kit
 * (`matter-registry.js`).
 *
 *   FLASK (`vapour`)      a liquid card in a slot, a gauge that rises and levels off when "Settle" is pressed, an optional Heater dial
 *                         (°C steps) and Outside dial (the room's pressure the flask is opened to). With `plot` it also builds a
 *                         plot of pressure against temperature from the readings the player takes; a liquid whose pressure has
 *                         reached the outside pressure is drawn boiling.
 *   SURFACE PLATE         a ring lifted off the liquid's surface and a narrow tube it runs through: one row per liquid tested.
 *   EQUAL BOXES (`cell`)  weighs a cube, one cubic centimetre, of ice or of liquid water at 0 °C.
 *   JAR (`jar`)           a gas collected over water: its gauge and temperature, printed, and the molecules mixed in it.
 *   LIQUID CARD (`liquid`)  a liquid sample with its molecule, a second line, and the pressure (or mass) it kept.
 *   PICTURE BOX (`pack`)  a box of molecules drawn at the same scale: an open lattice or a packed liquid.
 *
 * A THIN WRAPPER over `matterdata.js` / `matterdata-vapour.js`; a painter decides nothing. The flask's pressure is `vaporPressure`, whether
 * it boils is that pressure against the Outside dial, and nothing here knows what a stage's answer is.
 */

import { registerFixture, registerPiece } from './matter-registry.js';
import { say, slab, paintGlyph, frameOf, RECTS } from './matter-draw.js';
import { seatedIn } from './matter-read.js';
import { PLATE_COLORS } from '../../engine/plates.js';
import { addTourText } from '../tour.js';
import { SUBSTANCES, ANTOINE, vaporPressure, LIQUID_PROPS } from '../../engine/matterdata.js';
import { surfacePull, pourTime, BOX_MASS, PICTURE_COUNT, JAR, vaporDots } from '../../engine/matterdata-vapour.js';

const AMBER = PLATE_COLORS.amber;
const DUST = PLATE_COLORS.dust;
const DIM = PLATE_COLORS.dim;
const STEEL = PLATE_COLORS.steel;
const COLD = '#6f8fb0';

/** Where a fixture's own picture starts under its dial rows, in units from its top edge (as `matter-draw.js` `topOf` counts it). */
export const TOP = nd => (nd ? 13.2 + (nd - 1) * 5 : 10);
const round = (v, d = 2) => Math.round(v * 10 ** d) / 10 ** d;
/** A pressure as the gauge prints it. */
export const fmtP = v => (v + 1e-9).toFixed(1);
const nameOf = id => SUBSTANCES[id]?.name || id;

/** A deterministic number in [0, 1) for dot `i`, stream `k` (golden-ratio steps, so the dots spread). */
const spread = (i, k = 0) => ((i + 1) * 0.6180339887 * (k + 1) + k * 0.31) % 1;

/* ------------------------------------------------------------------
   THE FLASK
   ------------------------------------------------------------------ */

/**
 * The flask: what it reads for the liquid in its slot, at the temperature the card or the Heater dial gives. `valid` is true once the key
 * has been pressed for this liquid at this temperature. `outside` is null when the flask is sealed.
 */
export function flaskRead(state, fid) {
  const f = state.fixtures[fid];
  const p = f.props;
  const d = f.dials;
  const item = seatedIn(state, p.slot);
  const heat = d.heat ? p.temps[Math.round(d.heat.value) - 1] : null;
  const T = item?.props.T ?? heat ?? p.T0;
  const outside = d.outside ? p.outsides[Math.round(d.outside.value) - 1] : null;
  const sub = item?.props.substance;
  const vp = item && ANTOINE[sub] ? vaporPressure(sub, T) : null;
  const valid = Boolean(item && item.props.vp != null && item.props.vpT === T);
  const boiling = Boolean(valid && outside != null && vp != null && vp >= outside);
  return { f, item, sub, T, outside, vp, valid, boiling, value: valid ? item.props.vp : null };
}

/** The readings the player has taken of the liquid in the flask, one per temperature, in temperature order: [{x: °C, y: kPa}]. */
export function flaskPoints(state, fid, sub) {
  const by = new Map();
  for (const r of state.recorder.rows) if (r.label === `${fid}|${sub}`) by.set(r.x, { x: r.x, y: r.y });
  return [...by.values()].sort((a, b) => a.x - b.x);
}

function runFlask(state, fid) {
  const r = flaskRead(state, fid);
  if (!r.item) return { noop: 'Put a liquid in the flask first.' };
  if (r.vp == null) return { noop: 'The flask holds no figures for this liquid.' };
  const y = round(r.vp, 2);
  return { x: r.T, y, label: `${fid}|${r.sub}`, stamp: { [r.item.id]: { vp: y, vpT: r.T } } };
}

/**
 * Build a flask. `temps` (°C list) gives it a Heater dial, `outsides` (kPa list, `null` is sealed) an Outside dial; without a Heater the
 * liquid is held at the card's own temperature, or at `T0`. `plot` replaces the gauge's trace with the plot of pressure against
 * temperature. Returns the fixture and the slot (stand it where it says).
 */
export function flaskFixture(id, at, { temps = null, tempStart = 1, outsides = null, outsideStart = 1, T0 = 25, plot = false, title = 'Flask', w = plot ? 104 : 78 } = {}) {
  const dials = {};
  if (temps) dials.heat = { min: 1, max: temps.length, step: 1, value: tempStart, label: 'Heater', labels: temps.map(t => `${t} °C`) };
  if (outsides) dials.outside = { min: 1, max: outsides.length, step: 1, value: outsideStart, label: 'Outside', labels: outsides.map(q => (q == null ? 'sealed' : `${Math.round(q)} kPa`)) };
  const top = TOP(Object.keys(dials).length);
  const h = round(top + 31.5, 1);
  const slotId = `${id}.well`;
  const x0 = at.x - w / 2; const y0 = at.y - h / 2;
  return {
    fixture: {
      id, kind: 'vapour', label: title, at: { ...at }, size: { w, h }, dials, runLabel: 'Settle',
      props: { backdrop: true, slot: slotId, T0, plot, ...(temps ? { temps } : {}), ...(outsides ? { outsides } : {}) }
    },
    slot: { id: slotId, label: ' ', at: { x: x0 + 15, y: y0 + top + 9.5 }, size: { w: 24, h: 17 } },
    slotId,
    size: { w, h }
  };
}

function paintFlask(ctx, f, state, b) {
  const F = frameOf(b);
  const r = flaskRead(state, f.id);
  const top = TOP(Object.keys(f.dials).length);
  const w = f.size.w; const h = f.size.h;
  const px = f.props.plot ? 58 : 53; const pw = w - 4 - px;
  const py = top + 2; const ph = 19;

  /* ---- the flask: a round body and a neck, the liquid in its lower part, the vapor above it ---- */
  const cx = 40; const cy = top + 19; const R = 9.5;
  const levelY = cy + 1.2;
  ctx.fillStyle = '#100f0c';
  ctx.beginPath(); ctx.arc(F.x(cx), F.y(cy), F.len(R), 0, Math.PI * 2); ctx.fill();
  ctx.fillRect(F.x(cx - 2.6), F.y(top + 1.4), F.len(5.2), F.len(cy - R - top));
  if (r.item) {
    ctx.save();
    ctx.beginPath(); ctx.arc(F.x(cx), F.y(cy), F.len(R - 0.4), 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = r.boiling ? 'rgba(192,101,43,0.30)' : 'rgba(111,143,176,0.32)';
    ctx.fillRect(F.x(cx - R), F.y(levelY), F.len(R * 2), F.len(cy + R - levelY));
    ctx.restore();
    if (r.boiling) {
      ctx.strokeStyle = DUST;
      for (let i = 0; i < 7; i++) {
        const bx = cx - 6 + spread(i, 1) * 12; const by = levelY + 1.5 + spread(i, 2) * 5.5;
        ctx.beginPath(); ctx.arc(F.x(bx), F.y(by), F.len(0.5 + spread(i, 3) * 0.8), 0, Math.PI * 2); ctx.stroke();
      }
    }
    if (r.valid) {
      const n = vaporDots(r.sub, r.T);
      ctx.fillStyle = DUST;
      for (let i = 0; i < n; i++) {
        const y = cy - 8.2 + spread(i, 2) * (levelY - 1.4 - (cy - 8.2));
        const half = Math.sqrt(Math.max(0.5, (R - 1.1) ** 2 - (y - cy) ** 2));
        const x = cx + (spread(i, 1) - 0.5) * 2 * half * 0.92;
        ctx.beginPath(); ctx.arc(F.x(x), F.y(y), Math.max(1.3, F.len(0.62)), 0, Math.PI * 2); ctx.fill();
      }
    }
  }
  ctx.strokeStyle = STEEL; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(F.x(cx), F.y(cy), F.len(R), Math.PI * 1.31, Math.PI * 1.69, true); ctx.arc(F.x(cx), F.y(cy), F.len(R), Math.PI * 1.69, Math.PI * 1.31 + Math.PI * 2, true);
  ctx.stroke(); ctx.lineWidth = 1;
  ctx.strokeStyle = STEEL;
  ctx.beginPath(); ctx.moveTo(F.x(cx - 2.6), F.y(top + 1.4)); ctx.lineTo(F.x(cx - 2.6), F.y(cy - R + 0.6)); ctx.moveTo(F.x(cx + 2.6), F.y(top + 1.4)); ctx.lineTo(F.x(cx + 2.6), F.y(cy - R + 0.6)); ctx.stroke();

  /* ---- the readout, bottom left ---- */
  if (r.outside != null && r.valid) say(ctx, r.boiling ? 'BOILS' : 'NOT BOILING', F.x(3), F.y(top + 21.4), F.size(1.9, 6), { color: r.boiling ? AMBER : DIM, weight: 700 });
  say(ctx, 'PRESSURE', F.x(3), F.y(h - 7.6), F.size(1.9, 6), { color: DIM });
  say(ctx, r.valid ? `${fmtP(r.value)} kPa` : r.item ? '—' : '', F.x(3), F.y(h - 3.6), F.size(3.4, 8), { color: r.valid ? AMBER : DUST, weight: 700 });

  ctx.fillStyle = '#100f0c';
  ctx.fillRect(F.x(px), F.y(py), F.len(pw), F.len(ph));
  ctx.strokeStyle = STEEL;
  ctx.strokeRect(Math.round(F.x(px)) + 0.5, Math.round(F.y(py)) + 0.5, Math.round(F.len(pw)), Math.round(F.len(ph)));

  if (f.props.plot) {
    /* ---- the plot of pressure against temperature, built from the readings taken ---- */
    const X = T => px + ((T - 10) / 100) * pw;
    const Y = v => py + ph - (Math.min(v, 110) / 110) * ph;
    ctx.strokeStyle = DIM; ctx.setLineDash([3, 3]);
    for (const v of [50, 100]) { ctx.beginPath(); ctx.moveTo(F.x(px), F.y(Y(v))); ctx.lineTo(F.x(px + pw), F.y(Y(v))); ctx.stroke(); }
    for (const T of [20, 60, 100]) { ctx.beginPath(); ctx.moveTo(F.x(X(T)), F.y(py)); ctx.lineTo(F.x(X(T)), F.y(py + ph)); ctx.stroke(); }
    ctx.setLineDash([]);
    for (const v of [0, 50, 100]) say(ctx, String(v), F.x(px - 0.8), F.y(Y(v)), F.size(1.7, 5.8), { color: DUST, align: 'right' });
    for (const T of [20, 60, 100]) say(ctx, String(T), F.x(X(T)), F.y(py + ph + 2.3), F.size(1.7, 5.8), { color: DUST, align: 'center' });
    say(ctx, 'kPa', F.x(px), F.y(top + 0.2), F.size(1.7, 5.8), { color: DIM });
    say(ctx, '°C', F.x(px + pw), F.y(top + 0.2), F.size(1.7, 5.8), { color: DIM, align: 'right' });
    if (r.outside != null) {
      ctx.strokeStyle = AMBER;
      ctx.beginPath(); ctx.moveTo(F.x(px), F.y(Y(r.outside))); ctx.lineTo(F.x(px + pw), F.y(Y(r.outside))); ctx.stroke();
      say(ctx, `${Math.round(r.outside)} outside`, F.x(px + 1), F.y(Y(r.outside) - 1.3), F.size(1.7, 5.8), { color: AMBER, weight: 700 });
    }
    if (r.sub) {
      const pts = flaskPoints(state, f.id, r.sub);
      ctx.strokeStyle = DUST; ctx.lineWidth = Math.max(1, b.sc * 0.2);
      ctx.beginPath(); pts.forEach((q, i) => (i ? ctx.lineTo(F.x(X(q.x)), F.y(Y(q.y))) : ctx.moveTo(F.x(X(q.x)), F.y(Y(q.y))))); ctx.stroke(); ctx.lineWidth = 1;
      ctx.fillStyle = AMBER;
      for (const q of pts) ctx.fillRect(F.x(X(q.x)) - 2, F.y(Y(q.y)) - 2, 4, 4);
    }
    if (r.item) { ctx.strokeStyle = STEEL; ctx.beginPath(); ctx.moveTo(F.x(X(r.T)), F.y(py + ph - 1.4)); ctx.lineTo(F.x(X(r.T)), F.y(py + ph)); ctx.stroke(); }
  } else {
    /* ---- the gauge against time: it rises and levels off at the pressure the liquid settles at ---- */
    const top80 = 80;
    const Y = v => py + ph - (Math.min(v, top80) / top80) * ph;
    say(ctx, String(top80), F.x(px - 0.8), F.y(py + 0.6), F.size(1.7, 5.8), { color: DUST, align: 'right' });
    say(ctx, '0', F.x(px - 0.8), F.y(py + ph - 0.4), F.size(1.7, 5.8), { color: DUST, align: 'right' });
    say(ctx, 'kPa', F.x(px), F.y(top + 0.2), F.size(1.7, 5.8), { color: DIM });
    say(ctx, 'time', F.x(px + pw), F.y(py + ph + 2.3), F.size(1.7, 5.8), { color: DIM, align: 'right' });
    if (r.valid) {
      ctx.strokeStyle = DIM; ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(F.x(px), F.y(Y(r.value))); ctx.lineTo(F.x(px + pw), F.y(Y(r.value))); ctx.stroke(); ctx.setLineDash([]);
      ctx.strokeStyle = AMBER; ctx.lineWidth = Math.max(1.4, b.sc * 0.3);
      ctx.beginPath();
      for (let i = 0; i <= 30; i++) {
        const t = i / 30; const v = r.value * (1 - Math.exp(-5.5 * t));
        const X = px + t * pw;
        if (i) ctx.lineTo(F.x(X), F.y(Y(v))); else ctx.moveTo(F.x(X), F.y(Y(v)));
      }
      ctx.stroke(); ctx.lineWidth = 1;
    }
  }
}

registerFixture('vapour', { paint: paintFlask, run: runFlask });

/* ------------------------------------------------------------------
   THE SURFACE PLATE: a ring lifted off the surface, 5 mL through a narrow tube
   ------------------------------------------------------------------ */

/** The liquids tested on the plate, in the order they were tested: [{id, pull, pour}]. */
export function surfaceRows(state, fid) {
  const by = new Map();
  for (const r of state.recorder.rows) if (r.label.startsWith(`${fid}|`)) by.set(r.label.slice(fid.length + 1), { id: r.label.slice(fid.length + 1), pull: r.x, pour: r.y });
  return [...by.values()];
}

function runSurface(state, fid) {
  const f = state.fixtures[fid];
  const item = seatedIn(state, f.props.slot);
  if (!item) return { noop: 'Put a liquid on the plate first.' };
  const sub = item.props.substance;
  if (!LIQUID_PROPS[sub]) return { noop: 'The plate holds no figures for this liquid.' };
  return { x: surfacePull(sub), y: round(pourTime(sub), 2), label: `${fid}|${sub}`, stamp: { [item.id]: { tested: 1 } } };
}

export function surfaceFixture(id, at, { title = 'Surface and pour plate', w = 78 } = {}) {
  const top = TOP(0);
  const h = round(top + 31.5, 1);
  const slotId = `${id}.well`;
  const x0 = at.x - w / 2; const y0 = at.y - h / 2;
  return {
    fixture: { id, kind: 'surface', label: title, at: { ...at }, size: { w, h }, dials: {}, runLabel: 'Test', props: { backdrop: true, slot: slotId } },
    slot: { id: slotId, label: ' ', at: { x: x0 + 15, y: y0 + top + 9.5 }, size: { w: 24, h: 17 } },
    slotId,
    size: { w, h }
  };
}

function paintSurface(ctx, f, state, b) {
  const F = frameOf(b);
  const top = TOP(0);
  const rows = surfaceRows(state, f.id);
  const item = seatedIn(state, f.props.slot);
  // The ring lifted from a dish, and the tube the liquid runs through, drawn small under the slot.
  const rx = 15; const ry = top + 23;
  ctx.strokeStyle = STEEL;
  ctx.strokeRect(Math.round(F.x(rx - 8)) + 0.5, Math.round(F.y(ry + 1.4)) + 0.5, Math.round(F.len(16)), Math.round(F.len(3.2)));
  if (item) { ctx.fillStyle = 'rgba(111,143,176,0.32)'; ctx.fillRect(F.x(rx - 8) + 1, F.y(ry + 2.2), F.len(16) - 1, F.len(2.3)); }
  ctx.strokeStyle = DUST;
  ctx.beginPath(); ctx.ellipse(F.x(rx), F.y(ry - 0.6), F.len(3.6), F.len(0.9), 0, 0, Math.PI * 2); ctx.stroke();
  ctx.setLineDash([2, 2]); ctx.beginPath(); ctx.moveTo(F.x(rx - 3.6), F.y(ry - 0.6)); ctx.lineTo(F.x(rx - 4.4), F.y(ry + 1.4)); ctx.moveTo(F.x(rx + 3.6), F.y(ry - 0.6)); ctx.lineTo(F.x(rx + 4.4), F.y(ry + 1.4)); ctx.stroke(); ctx.setLineDash([]);
  // The table of what has been tested.
  const c0 = 31; const cPull = 56; const cPour = 73;
  say(ctx, 'SURFACE', F.x(cPull), F.y(top + 1.2), F.size(1.7, 5.8), { color: DIM, align: 'right' });
  say(ctx, 'PULL mN/m', F.x(cPull), F.y(top + 3.4), F.size(1.7, 5.8), { color: DIM, align: 'right' });
  say(ctx, 'POUR', F.x(cPour), F.y(top + 1.2), F.size(1.7, 5.8), { color: DIM, align: 'right' });
  say(ctx, 'TIME s', F.x(cPour), F.y(top + 3.4), F.size(1.7, 5.8), { color: DIM, align: 'right' });
  ctx.strokeStyle = DIM;
  ctx.beginPath(); ctx.moveTo(F.x(c0 - 1), F.y(top + 5.2)); ctx.lineTo(F.x(f.size.w - 3), F.y(top + 5.2)); ctx.stroke();
  rows.slice(0, 4).forEach((q, i) => {
    const y = top + 8.6 + i * 4.6;
    say(ctx, nameOf(q.id), F.x(c0), F.y(y), F.size(2.4, 6.2), { weight: 600 });
    say(ctx, q.pull.toFixed(1), F.x(cPull), F.y(y), F.size(2.6, 6.4), { color: AMBER, weight: 700, align: 'right' });
    say(ctx, q.pour.toFixed(1), F.x(cPour), F.y(y), F.size(2.6, 6.4), { color: AMBER, weight: 700, align: 'right' });
  });
}

registerFixture('surface', { paint: paintSurface, run: runSurface });

/* ------------------------------------------------------------------
   THE EQUAL BOXES: a cube, one cubic centimetre, of ice or of water at 0 °C
   ------------------------------------------------------------------ */

function runCell(state, fid) {
  const f = state.fixtures[fid];
  const item = seatedIn(state, f.props.slot);
  if (!item) return { noop: 'Put a sample in the box first.' };
  const m = BOX_MASS[item.props.phase];
  if (m == null) return { noop: 'The box holds no figures for this sample.' };
  return { x: round(m, 3), y: 1, label: `${fid}|${item.props.phase}`, stamp: { [item.id]: { m1: round(m, 3) } } };
}

export function cellFixture(id, at, { title = 'Equal boxes', w = 62 } = {}) {
  const top = TOP(0);
  const h = round(top + 31.5, 1);
  const slotId = `${id}.well`;
  const x0 = at.x - w / 2; const y0 = at.y - h / 2;
  return {
    fixture: { id, kind: 'cell', label: title, at: { ...at }, size: { w, h }, dials: {}, runLabel: 'Weigh', props: { backdrop: true, slot: slotId } },
    slot: { id: slotId, label: ' ', at: { x: x0 + 15, y: y0 + top + 9.5 }, size: { w: 24, h: 17 } },
    slotId,
    size: { w, h }
  };
}

function paintCell(ctx, f, state, b) {
  const F = frameOf(b);
  const top = TOP(0);
  const item = seatedIn(state, f.props.slot);
  const cx0 = 31; const cy0 = top + 1.5; const cs = 17;
  ctx.fillStyle = '#100f0c'; ctx.fillRect(F.x(cx0), F.y(cy0), F.len(cs), F.len(cs));
  if (item) { ctx.fillStyle = item.props.phase === 'ice' ? 'rgba(207,200,184,0.20)' : 'rgba(111,143,176,0.32)'; ctx.fillRect(F.x(cx0) + 1, F.y(cy0) + 1, F.len(cs) - 2, F.len(cs) - 2); }
  ctx.strokeStyle = STEEL; ctx.strokeRect(Math.round(F.x(cx0)) + 0.5, Math.round(F.y(cy0)) + 0.5, Math.round(F.len(cs)), Math.round(F.len(cs)));
  say(ctx, '1 cm³', F.x(cx0 + cs / 2), F.y(cy0 + cs / 2), F.size(2.6, 6.4), { color: DUST, align: 'center' });
  say(ctx, 'MASS OF THE CUBE', F.x(3), F.y(f.size.h - 7.6), F.size(1.9, 6), { color: DIM });
  const m = item?.props.m1;
  say(ctx, m != null ? `${m.toFixed(3)} g` : item ? '—' : '', F.x(3), F.y(f.size.h - 3.6), F.size(3.4, 8), { color: m != null ? AMBER : DUST, weight: 700 });
}

registerFixture('cell', { paint: paintCell, run: runCell });

/* ------------------------------------------------------------------
   THE JAR: a gas collected over water
   ------------------------------------------------------------------ */

export function jarFixture(id, at, { total = JAR.total, T = JAR.T, title = 'Jar over water', w = 62 } = {}) {
  return { id, kind: 'jar', label: title, at: { ...at }, size: { w, h: 36 }, dials: {}, noRun: true, props: { total, T } };
}

function paintJar(ctx, f, state, b) {
  const F = frameOf(b);
  const p = f.props;
  // The upturned jar, its water level inside it and the molecules of gas and water vapor mixed above the water.
  const jx0 = 4; const jx1 = 26; const jy0 = 10; const jy1 = 30; const level = 25;
  ctx.fillStyle = '#100f0c'; ctx.fillRect(F.x(jx0), F.y(jy0), F.len(jx1 - jx0), F.len(jy1 - jy0));
  ctx.fillStyle = 'rgba(111,143,176,0.32)'; ctx.fillRect(F.x(jx0), F.y(level), F.len(jx1 - jx0), F.len(jy1 - level));
  ctx.strokeStyle = STEEL; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(F.x(jx0), F.y(jy1 + 1.6)); ctx.lineTo(F.x(jx0), F.y(jy0)); ctx.lineTo(F.x(jx1), F.y(jy0)); ctx.lineTo(F.x(jx1), F.y(jy1 + 1.6)); ctx.stroke(); ctx.lineWidth = 1;
  ctx.strokeStyle = DIM; ctx.beginPath(); ctx.moveTo(F.x(1), F.y(level)); ctx.lineTo(F.x(29), F.y(level)); ctx.stroke();
  ctx.fillStyle = DUST;
  for (let i = 0; i < 36; i++) {
    const x = jx0 + 2 + spread(i, 1) * (jx1 - jx0 - 4); const y = jy0 + 2 + spread(i, 2) * (level - jy0 - 4);
    ctx.beginPath(); ctx.arc(F.x(x), F.y(y), Math.max(1.3, F.len(0.6)), 0, Math.PI * 2); ctx.fill();
  }
  say(ctx, 'GAS AND WATER VAPOR', F.x(32), F.y(12), F.size(1.7, 5.8), { color: DIM });
  say(ctx, 'JAR GAUGE', F.x(32), F.y(18.4), F.size(1.9, 6), { color: DIM });
  say(ctx, `${p.total} kPa`, F.x(32), F.y(22.4), F.size(3.0, 7.2), { color: AMBER, weight: 700, maxW: F.len(f.size.w - 36) });
  say(ctx, 'JAR AT', F.x(32), F.y(27.2), F.size(1.9, 6), { color: DIM });
  say(ctx, `${p.T} °C`, F.x(32), F.y(31), F.size(3.0, 7.2), { color: DUST, weight: 700, maxW: F.len(f.size.w - 36) });
}

registerFixture('jar', { paint: paintJar });

/* ------------------------------------------------------------------
   THE PIECES
   ------------------------------------------------------------------ */

const piece = (kind, id, label, at, props = {}, extra = {}) => ({ id, kind, label, at, props, ...extra });

/**
 * A liquid sample. `substance` is a `SUBSTANCES` id; `shown` a second line; `T` the temperature, °C, the sample is held at (the flask reads it
 * at that temperature); `phase` ('ice' | 'water') for the equal boxes.
 */
export const liquidCard = (id, substance, label, at, { shown = null, T = null, phase = null } = {}, extra = {}) =>
  piece('liquid', id, label, at, { substance, ...(shown ? { shown } : {}), ...(T != null ? { T } : {}), ...(phase ? { phase } : {}) }, extra);

/** A box of molecules at one scale: `style` 'open' (an ice lattice) or 'packed' (a liquid); the count is the data's. */
export const packCard = (id, label, at, style, extra = {}) =>
  piece('pack', id, label, at, { style, n: style === 'open' ? PICTURE_COUNT.ice : PICTURE_COUNT.water }, extra);

function paintLiquid(ctx, p, state, o) {
  const box = slab(ctx, o, RECTS.mol, '#1d1a16');
  const sc = o.sc;
  const pr = p.props;
  paintGlyph(ctx, pr.substance, o.x, box.y0 + 4.8 * sc, 3.4 * sc, {});
  const hasSecond = Boolean(pr.shown);
  const hasReading = pr.vp != null || pr.m1 != null;
  const rows = (hasSecond ? 1 : 0) + (hasReading ? 1 : 0);
  const size = Math.max(6.2, 2.0 * sc);
  let y = box.y0 + box.h - (1.9 + rows * 3.1 + (p.label ? 1.2 : 0)) * sc;
  if (p.label) { say(ctx, p.label, o.x, y, size, { align: 'center', weight: 700, maxW: box.w - 2 * sc }); y += 3.4 * sc; }
  if (hasSecond) { say(ctx, pr.shown, o.x, y, Math.max(5.8, 1.7 * sc), { align: 'center', color: DUST, maxW: box.w - 2 * sc }); y += 3.1 * sc; }
  if (pr.vp != null) say(ctx, `${fmtP(pr.vp)} kPa`, o.x, y, Math.max(6, 1.9 * sc), { align: 'center', weight: 700, color: AMBER, maxW: box.w - 2 * sc });
  else if (pr.m1 != null) say(ctx, `${pr.m1.toFixed(3)} g`, o.x, y, Math.max(6, 1.9 * sc), { align: 'center', weight: 700, color: AMBER, maxW: box.w - 2 * sc });
}

const faceLiquid = p => `liquid|${p.label}|${p.props.substance}|${p.props.shown ?? ''}|${p.props.vp ?? ''}|${p.props.m1 ?? ''}`;

registerPiece('liquid', {
  kind: { r: 7.5, rect: RECTS.mol, nojoin: true },
  paint: paintLiquid,
  faceKey: faceLiquid,
  printed: p => String(p.label)
});

/** The molecules of an open lattice (two hexagon rings sharing an edge and one more molecule), in a unit frame, and the pairs a dashed line joins. */
function openLattice() {
  const d = 1; const s = Math.sqrt(3) * d / 2;
  const pts = [];
  const add = (x, y) => { if (!pts.some(q => Math.hypot(q[0] - x, q[1] - y) < 0.05)) pts.push([x, y]); };
  for (const cx of [-s, s]) for (let k = 0; k < 6; k++) { const a = (Math.PI / 180) * (30 + 60 * k); add(cx + d * Math.cos(a), d * Math.sin(a)); }
  add(-s, -2 * d);
  const bonds = [];
  for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) if (Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]) < d * 1.05) bonds.push([i, j]);
  return { pts, bonds };
}
export const LATTICE = openLattice();

/** A packed liquid: twelve molecules on a jittered 4 by 3 grid (nearly touching, no bonds drawn). */
function packedLiquid() {
  const pts = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) pts.push([(c - 1.5) * 1.12 + (spread(r * 4 + c, 1) - 0.5) * 0.3 + (r % 2 ? 0.22 : -0.22), (r - 1) * 1.05 + (spread(r * 4 + c, 2) - 0.5) * 0.26]);
  return pts;
}
export const PACKED = packedLiquid();

const PACK_RECT = Object.freeze({ hw: 12, hh: 10 });

function paintPack(ctx, p, state, o) {
  const box = slab(ctx, o, PACK_RECT, '#14120f');
  const sc = o.sc;
  const cx = o.x; const cy = box.y0 + 8.4 * sc;
  const r = 1.45 * sc;
  if (p.props.style === 'open') {
    const k = 3.1 * sc; const oy = 0.8 * sc;
    const ys = LATTICE.pts.map(q => q[1]); const mid = (Math.min(...ys) + Math.max(...ys)) / 2;
    ctx.strokeStyle = DUST; ctx.setLineDash([3, 3]); ctx.lineWidth = 1;
    for (const [i, j] of LATTICE.bonds) { ctx.beginPath(); ctx.moveTo(cx + LATTICE.pts[i][0] * k, cy + oy + (LATTICE.pts[i][1] - mid) * k); ctx.lineTo(cx + LATTICE.pts[j][0] * k, cy + oy + (LATTICE.pts[j][1] - mid) * k); ctx.stroke(); }
    ctx.setLineDash([]);
    ctx.fillStyle = '#a0522d';
    for (const q of LATTICE.pts) { ctx.beginPath(); ctx.arc(cx + q[0] * k, cy + oy + (q[1] - mid) * k, r, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = STEEL; ctx.stroke(); }
  } else {
    const k = 3.5 * sc;
    ctx.fillStyle = '#a0522d';
    for (const q of PACKED) { ctx.beginPath(); ctx.arc(cx + q[0] * k, cy + q[1] * k * 0.98, r, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = STEEL; ctx.stroke(); }
  }
  say(ctx, p.label, o.x, box.y0 + box.h - 1.7 * sc, Math.max(6.2, 2.0 * sc), { align: 'center', weight: 700 });
}

registerPiece('pack', {
  kind: { r: 8.5, rect: PACK_RECT, nojoin: true },
  paint: paintPack,
  faceKey: p => `pack|${p.label}|${p.props.style}|${p.props.n}`,
  printed: p => String(p.label)
});

/* ------------------------------------------------------------------
   THE TOUR
   ------------------------------------------------------------------ */

addTourText({
  'matter:vapour': {
    title: 'Flask', dials: false,
    text: 'A flask holds a liquid, with a gauge beside it. Drag a liquid card into the square on its left and press "Settle": the gauge rises, levels off, and the number is the pressure it stopped at, in kPa. The dots above the liquid are molecules that have left it. Where the flask has a "Heater" dial it sets the liquid\'s temperature, and where it has an "Outside" dial it opens the flask to a room at that pressure, shown as an amber line on the plot. A plot beside the flask adds one point for every reading you take. The card keeps the number it settled at.'
  },
  'matter:surface': {
    title: 'Surface and pour plate', dials: false,
    text: 'The plate has a slot, a key and a table. Drag a liquid card into the slot and press "Test". A ring is lifted off the liquid\'s surface, and the table prints the pull on it in mN/m. Then 5 mL of the liquid runs through a narrow tube, and the table prints the seconds it took. Every liquid you test gets a row, so you can compare them.'
  },
  'matter:cell': {
    title: 'Equal boxes', dials: false,
    text: 'The square on the right is a cube one centimetre across. Drag a sample card into the slot and press "Weigh": the plate prints the mass of that cube, in grams. The card keeps the number, so you can compare samples.'
  },
  'matter:jar': {
    title: 'Jar over water', dials: false,
    text: 'An upturned jar stands in water and holds a gas that was collected over it, mixed with the molecules that came off the water. The plate prints the pressure the jar\'s gauge reads for everything inside, and the jar\'s temperature. It does not change.'
  }
}, {
  liquid: ['Liquid cards', 'Each card names one liquid and draws its molecule. Drag a card into the flask, plate or box that tests it, then back to where it belongs. A card keeps the number its test read, so you can compare cards after they are out again.'],
  pack: ['Picture boxes', 'Each box is the same size and shows the molecules in it, one disc for each. Count the discs, and drag a box to where it belongs.']
});
