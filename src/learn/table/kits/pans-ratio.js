/**
 * kits/pans-ratio.js — the ratio benches' instruments, registered on the pans kit (`pans-registry.js`). Teeter's `q2-k` and `q3-q`.
 *
 *   VESSELS (`vsl`)  a row of pans, each a vessel with one bar for every substance in it, all on one scale, with its amount printed over it.
 *                    "Settle" lets every pan reach equilibrium; a line across each bar then marks where that amount started.
 *   RATIO RIG (`rig`) two rows of places, above and below a line, and a tile (`rtile`) for each substance. For every pan the rig prints the
 *                    tiles above the line multiplied together over the tiles below, each amount raised to the power on its tile. It does not say
 *                    which arrangement is right: it reads what is laid on it.
 *   TEST VESSEL (`qk`) one vessel with a slot for a mixture card (`mixc`), its bars, and a gauge that sets the mixture's ratio (a marker on a
 *                    scale, a tenfold step to a tick) against the fixed K line. "Run" leaves the mixture to settle.
 *
 * Every number is the planner's (`engine/eqdata.js`: `settleAmounts`, `rigReading`, `systemRatio`, `gaugePos`); a painter decides nothing.
 * Both Run keys set a hidden dial, so the drawn and the built table, and a scripted replay, show the same state.
 */

import { PLATE_COLORS } from '../../engine/plates.js';
import { registerFixture, registerPiece } from './pans-registry.js';
import { slab, frameOf } from './matter-draw.js';
import { A_INK, B_INK, driftOf } from './pans-pan.js';
import { pieceIn } from './pans-read.js';
import { paintPuck, buildPuck, inkOfIndex } from './pans-puck.js';
import {
  K_SYSTEMS, spName, settleAmounts, systemRatio, rigReading, gaugePos, fmtNum, sciParts
} from '../../engine/eqdata.js';
import './pans-ratio-tour.js';

const DUST = PLATE_COLORS.dust;
const DIM = PLATE_COLORS.dim;
const STEEL = PLATE_COLORS.steel;
const AMBER = PLATE_COLORS.amber;
const TEXT = PLATE_COLORS.text;

/** The width of a vessel fixture and its rows (the rig sits straight under the pans, so the two share the left column). */
export const RATIO_W = 118;
export const VESSEL_H = 40;
export const RIG_H = 28;
/** Decades each side of the K line the gauge covers. */
export const GAUGE_DECADES = 1.5;

/* ------------------------------------------------------------------ drawing helpers */

function font(ctx, size, weight = 500) { ctx.font = `${weight} ${Math.max(6, size)}px "Quantico", "JetBrains Mono", sans-serif`; }

function put(ctx, s, x, y, size, { color = TEXT, align = 'center', weight = 500, maxW = null } = {}) {
  font(ctx, size, weight);
  ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.fillStyle = color;
  if (maxW) ctx.fillText(s, x, y, maxW); else ctx.fillText(s, x, y);
}

/** A number as printed: plain, or `m × 10` with the exponent raised and smaller. `prefix` is plain text before it ("K = "). */
function putNum(ctx, v, sf, cx, y, size, { color = TEXT, weight = 500, align = 'center', prefix = '' } = {}) {
  const a = Math.abs(v) * (1 + 1e-12);
  if (v === 0 || !(a >= 1e5 || a < 1e-3)) { put(ctx, prefix + fmtNum(v, sf), cx, y, size, { color, align, weight }); return; }
  const { m, e } = sciParts(v, sf);
  const main = `${prefix}${m} × 10`;
  const ex = `${e < 0 ? '−' : ''}${Math.abs(e)}`;
  font(ctx, size, weight);
  const w1 = ctx.measureText(main).width;
  font(ctx, size * 0.7, weight);
  const w2 = ctx.measureText(ex).width;
  const total = w1 + w2;
  const x0 = align === 'center' ? cx - total / 2 : align === 'right' ? cx - total : cx;
  put(ctx, main, x0, y, size, { color, align: 'left', weight });
  put(ctx, ex, x0 + w1 + 0.5, y - size * 0.38, size * 0.7, { color, align: 'left', weight });
}

const roleInk = (sys, sp) => (sys.species[sp] < 0 ? A_INK : B_INK);

function column(ctx, F, x, y, w, h) {
  ctx.fillStyle = '#100f0c'; ctx.fillRect(F.x(x), F.y(y), F.len(w), F.len(h));
  ctx.strokeStyle = STEEL; ctx.strokeRect(Math.round(F.x(x)) + 0.5, Math.round(F.y(y)) + 0.5, Math.round(F.len(w)), Math.round(F.len(h)));
}

/** Rows of the bar picture, in table units from the top of a fixture. */
const ROW = { title: 8.6, k: 11.4, base: 26.5, hmax: 11.3, names: 30.2 };

/**
 * The bars of one vessel: a bar for each substance at `now`, a line across it at `start` once `ticks`, the amount printed over the bar,
 * the name under it. `scale` is the amount a full-height bar stands for; every vessel of a fixture shares it.
 */
/**
 * The mechanism view of a bar: the amounts glide from the old figure to the new one over about two seconds when they change (the Settle or
 * Run key), and each bar is a crowd of particles drifting about inside it, more of them the larger the amount. The printed figures stay
 * the planner's own; only the bar and the crowd move. With the clock frozen the bars stand at the planner's amounts.
 */
const GLIDE = new Map();
const GLIDE_SECONDS = 2.2;
/** A miss replays the cause: every bar glides again from the starting amounts. */
export function replayGlide() { GLIDE.clear(); }
function glided(key, now, clock) {
  if (!clock || !key) return now;
  const sig = JSON.stringify(now);
  let g = GLIDE.get(key);
  if (!g) g = { sig, from: { ...now }, to: { ...now }, t0: clock - GLIDE_SECONDS };
  if (g.sig !== sig) {
    const cur = glideAt(g, clock);
    g = { sig, from: cur, to: { ...now }, t0: clock };
  }
  GLIDE.set(key, g);
  return glideAt(g, clock);
}
function glideAt(g, clock) {
  const k = Math.max(0, Math.min(1, (clock - g.t0) / GLIDE_SECONDS));
  const e = k * k * (3 - 2 * k);
  return Object.fromEntries(Object.keys(g.to).map(s => [s, g.from[s] + (g.to[s] - g.from[s]) * e]));
}
/** Drifting dots inside a bar's rectangle: `count` of them, each about its own spot. */
function crowd(ctx, F, cx, bw, base, hgt, count, clock, seed) {
  if (hgt <= 0 || count <= 0) return;
  ctx.fillStyle = 'rgba(16,15,12,0.78)';
  const cols = 2; const rows = Math.ceil(count / cols);
  const cw = bw / cols; const ch = hgt / rows;
  for (let k = 0; k < count; k++) {
    const d = driftOf(seed * 31 + k, clock, 2.2);
    const px = cx - bw / 2 + (k % cols + 0.5) * cw + d.dx * cw * 0.28;
    const py = base - (Math.floor(k / cols) + 0.5) * ch + d.dy * ch * 0.28;
    ctx.beginPath(); ctx.arc(F.x(px), F.y(py), Math.max(1.2, F.len(Math.min(cw, ch) * 0.2)), 0, Math.PI * 2); ctx.fill();
  }
}

function paintBars(ctx, F, sys, now, start, ticks, x, y0, w, scale, { names = true, sf = 3, key = null, clock = 0 } = {}) {
  const shown = glided(key, now, clock);
  const sp = Object.keys(sys.species);
  const gw = w / sp.length;
  const bw = Math.min(7, gw * 0.62);
  const vs = F.size(1.9, 5.8);
  for (let i = 0; i < sp.length; i++) {
    const s = sp[i];
    const cx = x + (i + 0.5) * gw;
    const hgt = (shown[s] / scale) * ROW.hmax;
    ctx.fillStyle = roleInk(sys, s);
    const top = y0 + ROW.base - hgt;
    ctx.fillRect(F.x(cx - bw / 2), F.y(top), F.len(bw), Math.max(0, F.len(hgt)));
    if (clock) crowd(ctx, F, cx, bw, y0 + ROW.base, hgt, Math.round((shown[s] / scale) * 14), clock, i + 1);
    ctx.strokeStyle = DUST; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(F.x(cx - bw / 2 - 0.8), F.y(y0 + ROW.base) + 0.5); ctx.lineTo(F.x(cx + bw / 2 + 0.8), F.y(y0 + ROW.base) + 0.5); ctx.stroke();
    if (ticks) {
      const ty = y0 + ROW.base - (start[s] / scale) * ROW.hmax;
      ctx.strokeStyle = TEXT; ctx.lineWidth = Math.max(1.4, F.len(0.3));
      ctx.beginPath(); ctx.moveTo(F.x(cx - bw / 2 - 1.2), F.y(ty)); ctx.lineTo(F.x(cx + bw / 2 + 1.2), F.y(ty)); ctx.stroke(); ctx.lineWidth = 1;
    }
    putNum(ctx, now[s], sf, F.x(cx), F.y(Math.min(top, y0 + ROW.base) - 1.9), vs, { color: DUST });
    if (names) put(ctx, spName(sys, s), F.x(cx), F.y(y0 + ROW.names), vs, { color: TEXT, weight: 700, maxW: F.len(gw - 0.6) });
  }
}

/* ------------------------------------------------------------------ reads */

const CACHE = new Map();
const settleCached = (sys, start, K) => {
  const key = `${sys.id}|${K}|${JSON.stringify(start)}`;
  let v = CACHE.get(key);
  if (!v) { v = settleAmounts(sys, start, K); CACHE.set(key, v); if (CACHE.size > 200) CACHE.delete(CACHE.keys().next().value); }
  return v;
};
const fill = (sys, start) => Object.fromEntries(Object.keys(sys.species).map(s => [s, start[s] ?? 0]));

/** What the vessels hold: for each pan its system, K, start and settled amounts, and the amounts now (the start until "Settle"). */
export function vslRead(state, fid) {
  const f = state.fixtures[fid];
  const p = f.props;
  const settled = f.dials.s.value >= 1;
  const pans = p.pans.map(pp => {
    const sys = K_SYSTEMS[pp.system || p.system];
    const K = pp.K ?? sys.K;
    const start = fill(sys, pp.start);
    const eq = settleCached(sys, start, K);
    return { sys, K, start, eq, now: settled ? eq : start };
  });
  return { settled, pans };
}

/** The tiles laid on a rig (`top`, `bottom`), and what it reads on each pan once the pans have settled. */
export function rigRead(state, fid) {
  const f = state.fixtures[fid];
  const p = f.props;
  const tilesOf = ids => ids.map(id => pieceIn(state, id)).filter(Boolean).map(t => ({ id: t.id, label: t.label, sp: t.props.sp, p: t.props.p }));
  const top = tilesOf(p.top);
  const bottom = tilesOf(p.bottom);
  const v = vslRead(state, p.vsl);
  const laid = top.length + bottom.length;
  const readings = v.pans.map(pan => (laid ? rigReading(top, bottom, pan.now) : NaN));
  return { top, bottom, laid, v, settled: v.settled, readings, sys: v.pans[0].sys };
}

/** The numbering of the mixture cards, so the vessel can remember which card it ran. */
const cardIndex = (state, card) => Object.values(state.pieces).filter(p => p.kind === 'mixc').map(p => p.id).sort().indexOf(card.id) + 1;

/** The test vessel: the card in its slot, its ratio now (Q) and the amounts now (the card's, or what it settled at once run). */
export function qkRead(state, fid) {
  const f = state.fixtures[fid];
  const sys = K_SYSTEMS[f.props.system];
  const card = pieceIn(state, f.props.seat);
  if (!card) return { card: null, sys, K: sys.K, ran: false };
  const start = fill(sys, card.props.amounts);
  const idx = cardIndex(state, card);
  const ran = f.dials.ran.value === idx;
  const eq = ran ? settleCached(sys, start, sys.K) : start;
  return { card, sys, K: sys.K, idx, ran, start, now: eq, Q0: systemRatio(sys, start), Q: systemRatio(sys, eq) };
}

/* ------------------------------------------------------------------ the vessels */

function paintVessels(ctx, f, state, b) {
  const F = frameOf(b);
  const r = vslRead(state, f.id);
  const p = f.props;
  const w = f.size.w;
  const lw = p.lw ?? 34;
  const n = r.pans.length;
  const cw = (w - lw - 1.5) / n;
  let scale = 0;
  for (const pan of r.pans) for (const s of Object.keys(pan.sys.species)) scale = Math.max(scale, pan.start[s], pan.eq[s]);
  const sz = F.size(2.0, 5.8);
  // The legend: the reaction, its unit, and what a bar and a line across it stand for.
  if (p.legend !== false) {
    const sys = r.pans[0].sys;
    const parts = sys.eq.split(' ⇌ ');
    let y = 9.8;
    if (sys.eq.length * 2.0 * 0.62 > lw - 3 && parts.length === 2) {
      put(ctx, `${parts[0]} ⇌`, F.x(2.5), F.y(y), sz, { color: TEXT, align: 'left', weight: 700 }); y += 3.4;
      put(ctx, parts[1], F.x(2.5), F.y(y), sz, { color: TEXT, align: 'left', weight: 700 }); y += 3.4;
    } else { put(ctx, sys.eq, F.x(2.5), F.y(y), sz, { color: TEXT, align: 'left', weight: 700 }); y += 3.6; }
    if (sys.T) { put(ctx, `${sys.T} K`, F.x(2.5), F.y(y), sz, { color: DUST, align: 'left' }); y += 3.6; }
    put(ctx, sys.units ? 'mol, or atm for a gas' : sys.unit, F.x(2.5), F.y(y + 1), sz, { color: DUST, align: 'left', maxW: F.len(lw - 4) }); y += 3.6;
    put(ctx, 'bar: amount now', F.x(2.5), F.y(y + 1), sz, { color: DUST, align: 'left', maxW: F.len(lw - 4) }); y += 3.4;
    if (!p.settledAtStart) put(ctx, 'line: where it began', F.x(2.5), F.y(y + 1), sz, { color: DUST, align: 'left', maxW: F.len(lw - 4) });
  }
  for (let j = 0; j < n; j++) {
    const pan = r.pans[j];
    const x = lw + j * cw;
    column(ctx, F, x + 0.4, 6.4, cw - 0.8, 30.8);
    put(ctx, p.titles?.[j] ?? `Vessel ${j + 1}`, F.x(x + cw / 2), F.y(ROW.title), F.size(2.1, 5.8), { color: DUST, weight: 700 });
    if (p.showK) putNum(ctx, pan.K, 2, F.x(x + cw / 2), F.y(ROW.k), sz, { color: AMBER, weight: 700, prefix: 'K = ' });
    else if (p.showEq) put(ctx, pan.sys.eq, F.x(x + cw / 2), F.y(ROW.k), sz, { color: AMBER, weight: 700, maxW: F.len(cw - 1.6) });
    paintBars(ctx, F, pan.sys, pan.now, pan.start, r.settled && !p.settledAtStart, x + 0.9, 0, cw - 1.8, scale, { sf: 3, key: `${b.scope || ""}${f.id}:${j}`, clock: b.clock || 0 });
  }
}

function runVessels(state, fid) {
  const f = state.fixtures[fid];
  if (f.dials.s.value >= 1) return { noop: 'The vessels have settled already.' };
  return { x: 1, y: f.props.pans.length, label: fid, dials: { [fid]: { s: 1 } } };
}

registerFixture('vsl', { paint: paintVessels, run: runVessels, live: () => true });

/**
 * A row of pans. `pans`: `[{start: {species: amount}, K?, system?}]`; `system` the default reaction (`K_SYSTEMS` id). With `settled` the
 * pans open already settled (no key); otherwise "Settle" lets them settle. Options: `showK` (each pan's K), `showEq` (each pan's reaction),
 * `lw` (the left column the legend and the rig's places stand in), `legend: false`.
 */
export function vesselFixture(id, at, { system, pans, settled = false, showK = false, showEq = false, lw = 34, legend = true, w = RATIO_W, h = VESSEL_H, title = 'Vessels', key = 'Settle', titles = null } = {}) {
  return {
    id, kind: 'vsl', label: title, at: { ...at }, size: { w, h }, ...(settled ? { noRun: true } : { runLabel: key }),
    dials: { s: { min: 0, max: 1, step: 1, value: settled ? 1 : 0, label: 'Settled' } },
    props: { hidden: ['s'], system, pans, lw, showK, showEq, legend, settledAtStart: settled, ...(titles ? { titles } : {}) }
  };
}

/* ------------------------------------------------------------------ the ratio rig */

function paintRig(ctx, f, state, b) {
  const F = frameOf(b);
  const r = rigRead(state, f.id);
  const p = f.props;
  const lw = p.lw ?? 34;
  const n = r.v.pans.length;
  const cw = (f.size.w - lw - 1.5) / n;
  const rowN = Math.max(p.top.length, p.bottom.length);
  // The line between the rows, as long as the places are wide.
  ctx.strokeStyle = DUST; ctx.lineWidth = Math.max(1.4, F.len(0.3));
  ctx.beginPath(); ctx.moveTo(F.x(2), F.y(16.5)); ctx.lineTo(F.x(2 + rowN * 16.5 + 0.5), F.y(16.5)); ctx.stroke(); ctx.lineWidth = 1;
  const sz = F.size(2.0, 5.8);
  for (let j = 0; j < n; j++) {
    const cx = lw + (j + 0.5) * cw;
    column(ctx, F, lw + j * cw + 0.4, 6.4, cw - 0.8, 20.6);
    put(ctx, p.titles?.[j] ?? `Vessel ${j + 1}`, F.x(cx), F.y(9.4), F.size(2.1, 5.8), { color: DUST, weight: 700 });
    const ok = r.settled && r.laid;
    if (ok) putNum(ctx, r.readings[j], 3, F.x(cx), F.y(18), F.size(4.4, 10), { color: AMBER, weight: 700 });
    else put(ctx, '—', F.x(cx), F.y(18), F.size(4.4, 10), { color: DIM, weight: 700 });
  }
  put(ctx, 'reads', F.x(lw - 1.2), F.y(18), sz, { color: DUST, align: 'right' });
}

registerFixture('rig', { paint: paintRig });

/**
 * A ratio rig and its places. `top` and `bottom` are how many places each row has. Returns the fixture and the slots (add the slots to the
 * stage's `zones.slots`); `vsl` is the id of the vessels it reads. A rig stands under the vessels and shares their left column.
 */
export function rigParts(id, at, { vsl, top = 1, bottom = 1, lw = 34, w = RATIO_W, h = RIG_H, title = 'Ratio ratio board', titles = null } = {}) {
  const x0 = at.x - w / 2;
  const y0 = at.y - h / 2;
  const slot = (row, i) => ({ id: `${id}.${row}${i + 1}`, label: ' ', at: { x: x0 + 9.5 + i * 16.5, y: y0 + (row === 't' ? 10.5 : 22) }, size: { w: 15, h: 10 } });
  const t = Array.from({ length: top }, (_, i) => slot('t', i));
  const bt = Array.from({ length: bottom }, (_, i) => slot('b', i));
  return {
    fixture: {
      id, kind: 'rig', label: title, at: { ...at }, size: { w, h }, noRun: true,
      dials: { x: { min: 0, max: 1, step: 1, value: 0, label: 'Ratio board' } },
      props: { hidden: ['x'], backdrop: true, vsl, lw, top: t.map(s => s.id), bottom: bt.map(s => s.id), ...(titles ? { titles } : {}) }
    },
    slots: [...t, ...bt]
  };
}

/* ------------------------------------------------------------------ the tile */

const RECT_TILE = { hw: 6.5, hh: 4.6 };
const SUP = { 1: '', 2: '²', 3: '³' };

function tileInk(p) {
  const sp = Object.keys(K_SYSTEMS[p.props.sys]?.species || {});
  return inkOfIndex(Math.max(0, sp.indexOf(p.props.sp)));
}
function paintTile(ctx, p, state, o) {
  paintPuck(ctx, o, RECT_TILE, String(p.label), tileInk(p), p.props.p || 1);
}

registerPiece('rtile', {
  kind: { r: 6.4, rect: RECT_TILE, nojoin: true },
  paint: paintTile,
  piece3d: (p, state, c) => buildPuck(c, tileInk(p), p.props.p || 1, String(p.label)),
  faceKey: p => `rtile|${p.label}`,
  printed: p => String(p.label)
});

/** A tile for a substance of `system`, counted `power` times over (1, 2 or 3). */
export const tile = (id, system, sp, power, at, extra = {}) => ({
  id, kind: 'rtile', label: `${spName(K_SYSTEMS[system], sp)}${SUP[power] ?? ''}`, at, props: { sys: system, sp, p: power }, ...extra
});

/* ------------------------------------------------------------------ the mixture card */

const RECT_MIX = { hw: 11, hh: 8 };

function paintMix(ctx, p, state, o) {
  const box = slab(ctx, o, RECT_MIX, '#1d1a16');
  const sc = o.sc;
  const sys = K_SYSTEMS[p.props.sys];
  put(ctx, String(p.label), o.x, box.y0 + 2.7 * sc, Math.max(7.2, 2.2 * sc), { weight: 700, maxW: box.w - 1.6 * sc });
  if (p.props.sealed) return;
  const sp = Object.keys(sys.species);
  for (let i = 0; i < sp.length; i++) {
    const y = box.y0 + (6.2 + i * 3.2) * sc;
    const size = Math.max(6.2, 1.9 * sc);
    put(ctx, spName(sys, sp[i]), box.x0 + 1.8 * sc, y, size, { align: 'left', color: sys.species[sp[i]] < 0 ? A_INK : B_INK, weight: 700 });
    put(ctx, fmtNum(p.props.amounts[sp[i]] ?? 0, 3), box.x0 + box.w - 1.8 * sc, y, size, { align: 'right', color: TEXT });
  }
}

registerPiece('mixc', {
  kind: { r: 9, rect: RECT_MIX, nojoin: true },
  paint: paintMix,
  faceKey: p => `mixc|${p.label}|${p.props.sys}|${p.props.sealed ? 's' : JSON.stringify(p.props.amounts)}`,
  printed: p => String(p.label)
});

/** A mixture card: `amounts` by substance in the unit of `system`. A `sealed` card prints no amounts (the test vessel shows them). */
export const mixCard = (id, label, at, system, amounts, { sealed = false, ...extra } = {}) => ({ id, kind: 'mixc', label, at, props: { sys: system, amounts, sealed }, ...extra });

/* ------------------------------------------------------------------ the test vessel and its gauge */

function paintQK(ctx, f, state, b) {
  const F = frameOf(b);
  const r = qkRead(state, f.id);
  const p = f.props;
  const sys = r.sys;
  const sz = F.size(2.0, 5.8);
  // The bars of the mixture in the slot.
  column(ctx, F, 28.4, 6.4, 40.2, 30.8);
  if (r.card) {
    let scale = 0;
    for (const s of Object.keys(sys.species)) scale = Math.max(scale, r.start[s], settleCached(sys, r.start, sys.K)[s]);
    paintBars(ctx, F, sys, r.now, r.start, r.ran, 29.2, 0, 38.6, scale, { sf: 3, key: (b.scope || "") + f.id, clock: b.clock || 0 });
  }
  put(ctx, sys.unit, F.x(48.5), F.y(ROW.title), sz, { color: DUST });
  // The gauge: a scale, K at its middle, a tick for every tenfold step, and the marker.
  const gx0 = 73; const gx1 = 115; const gc = (gx0 + gx1) / 2; const half = (gx1 - gx0) / 2;
  const gy = 19;
  column(ctx, F, 71.4, 6.4, 45.2, 30.8);
  ctx.strokeStyle = STEEL; ctx.lineWidth = Math.max(1.4, F.len(0.3));
  ctx.beginPath(); ctx.moveTo(F.x(gx0), F.y(gy)); ctx.lineTo(F.x(gx1), F.y(gy)); ctx.stroke(); ctx.lineWidth = 1;
  for (let d = -1; d <= 1; d++) {
    const tx = gc + (d / GAUGE_DECADES) * half;
    ctx.strokeStyle = d === 0 ? AMBER : STEEL; ctx.lineWidth = d === 0 ? Math.max(1.8, F.len(0.45)) : 1;
    ctx.beginPath(); ctx.moveTo(F.x(tx), F.y(gy - (d === 0 ? 7 : 2.4))); ctx.lineTo(F.x(tx), F.y(gy + (d === 0 ? 4 : 2.4))); ctx.stroke(); ctx.lineWidth = 1;
  }
  putNum(ctx, r.K, 2, F.x(gc), F.y(11), sz, { color: AMBER, weight: 700, prefix: 'K = ' });
  if (r.card) {
    const pos = x => gc + gaugePos(x, r.K, GAUGE_DECADES) * half;
    // Where the ratio stood when the mixture was laid in, once it has settled.
    if (r.ran) {
      ctx.strokeStyle = DUST; ctx.lineWidth = 1; ctx.setLineDash([2, 2]);
      ctx.beginPath(); ctx.moveTo(F.x(pos(r.Q0)), F.y(gy - 4.5)); ctx.lineTo(F.x(pos(r.Q0)), F.y(gy + 4.5)); ctx.stroke(); ctx.setLineDash([]);
    }
    const nx = pos(r.Q);
    ctx.fillStyle = TEXT;
    ctx.beginPath(); ctx.moveTo(F.x(nx), F.y(gy + 0.3)); ctx.lineTo(F.x(nx - 1.7), F.y(gy + 4.6)); ctx.lineTo(F.x(nx + 1.7), F.y(gy + 4.6)); ctx.closePath(); ctx.fill();
    const lx = Math.max(gx0 + 8.5, Math.min(gx1 - 8.5, nx));
    putNum(ctx, r.Q, 3, F.x(lx), F.y(27.2), sz, { color: TEXT, weight: 700, prefix: p.q ? 'Q = ' : 'ratio now ' });
  }
}

function runQK(state, fid) {
  const r = qkRead(state, fid);
  if (!r.card) return { noop: 'Lay a mixture card in the vessel first.' };
  if (r.ran) return { noop: 'This mixture has settled already.' };
  return { x: r.idx, y: Number(fmtNum(r.Q0, 3)), label: r.card.label, dials: { [fid]: { ran: r.idx } } };
}

registerFixture('qk', { paint: paintQK, run: runQK, live: () => true });

/**
 * The test vessel for `system`, with the slot (`<id>.seat`) its mixture card goes in. `q` prints the marker as Q (once the bench has earned
 * it) and not as "ratio now". Returns the fixture and the slot.
 */
export function testVessel(id, at, { system, q = false, w = RATIO_W, h = VESSEL_H, title = 'Test vessel', key = 'Run' } = {}) {
  const x0 = at.x - w / 2;
  const y0 = at.y - h / 2;
  const seat = { id: `${id}.seat`, label: ' ', at: { x: x0 + 14.5, y: y0 + 22 }, size: { w: 25, h: 18 } };
  return {
    fixture: {
      id, kind: 'qk', label: title, at: { ...at }, size: { w, h }, runLabel: key,
      dials: { ran: { min: 0, max: 9, step: 1, value: 0, label: 'Ran' } },
      props: { hidden: ['ran'], backdrop: true, system, seat: seat.id, q }
    },
    seat
  };
}
