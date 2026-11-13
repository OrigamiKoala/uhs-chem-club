/**
 * kits/lode-cplx.js — Lodestone's complex-ion instruments (unit12, q3-complex, q4-shapes, the Coil).
 *
 *   beaker  a flask of copper(II) solution with a window on one Cu²⁺ ion and the six water molecules bonded round it; "Add Ammonia"
 *           swaps the four in the ion's plane for ammonia, one a press, and the solution deepens from pale to dark blue.
 *   cplx    one metal ion and its ligands, drawn in three dimensions (a projection the "Turn" dial tilts). Modes:
 *             supply  a key adds one ligand of one kind; each settles beside the ion until there is no space left, and one more is
 *                     drawn pushed off, unbonded (a chelate such as en takes two neighbouring places);
 *             cycle   a tap on a place cycles its ligand (empty, then each ligand of the palette); with `meter` the charge of the
 *                     whole is printed;
 *             ring6   six ligands held in a flat ring; "Release" lets them settle as far apart as they can (an octahedron);
 *             bond    one ammonia molecule beside a Cu²⁺ ion, each electron coloured by the particle it belongs to; "Bond" brings
 *                     the lone pair into the gap between N and Cu;
 *             show    a fixed arrangement, turned by its dial.
 *   match   "Turn B to Fit A": searches every turn and flip of a frame for one that lays B's ligands on A's, and plays it.
 *
 * Every place, charge and turn comes from `lodedata.js` (LIGANDS, complexCharge, OCT_DIRS, SQ_DIRS, fitTurn). Pure painters of the
 * table state and `b.clock`.
 */

import { registerFixture } from './lode-registry.js';
import { C, frameOf, say, title, glide, since, paintPick, signed } from './lode-draw.js';
import { LIGANDS, OCT_DIRS, SQ_DIRS, complexCharge, fitTurn } from '../../engine/lodedata.js';

const TET_DIRS = [[1, 1, 1], [-1, -1, 1], [-1, 1, -1], [1, -1, -1]].map(v => v.map(x => x / Math.sqrt(3)));
const DONOR_INK = { O: '#b5573a', N: '#6f8fb0', Cl: '#7fa04a', C: '#55524c', F: '#a8c48a' };
const METAL_INK = '#b88a5a';
/** How big each ligand is drawn, against water: a chloride ion is about half as wide again as a water molecule (ionic radius 181 pm). */
const SIZE = { h2o: 1, nh3: 1, cl: 1.45, cn: 1.1, f: 0.95, en: 1 };

/* ------------------------------------------------------------------ drawing helpers */

/** Project a 3D direction: turn about the vertical (yaw), then tilt toward the viewer (pitch). +z is up the screen. */
export function project([x, y, z], tilt = 25, yaw = 28) {
  const a = (yaw * Math.PI) / 180; const t = (tilt * Math.PI) / 180;
  const x1 = x * Math.cos(a) - y * Math.sin(a);
  const y1 = x * Math.sin(a) + y * Math.cos(a);
  // Tilt about the screen's horizontal axis: depth (y1) and height (z) mix.
  const up = z * Math.cos(t) + y1 * Math.sin(t);
  const depth = -z * Math.sin(t) + y1 * Math.cos(t);
  return { x: x1, y: -up, depth };
}

/** A ligand at (px, py) pixels: its donor atom as a shaded disc, its formula beside it. */
function drawLigand(ctx, px, py, r0, id, { dim = false, label = true, size = 10 } = {}) {
  const L = LIGANDS[id];
  const r = r0 * (SIZE[id] || 1);
  ctx.globalAlpha = dim ? 0.45 : 1;
  const g = ctx.createRadialGradient ? ctx.createRadialGradient(px - r * 0.35, py - r * 0.35, r * 0.1, px, py, r) : null;
  if (g && g.addColorStop) { g.addColorStop(0, '#f0e6d4'); g.addColorStop(0.35, DONOR_INK[L.donor]); g.addColorStop(1, '#1a1814'); ctx.fillStyle = g; } else ctx.fillStyle = DONOR_INK[L.donor];
  ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2); ctx.fill();
  if (label) say(ctx, L.sym, px, py + r + size * 0.75, size, { align: 'center', color: C.text, weight: 700, sans: true });
  ctx.globalAlpha = 1;
}

function drawMetal(ctx, px, py, r, text, size) {
  const g = ctx.createRadialGradient ? ctx.createRadialGradient(px - r * 0.35, py - r * 0.35, r * 0.1, px, py, r) : null;
  if (g && g.addColorStop) { g.addColorStop(0, '#f4dcb0'); g.addColorStop(0.4, METAL_INK); g.addColorStop(1, '#2a1c10'); ctx.fillStyle = g; } else ctx.fillStyle = METAL_INK;
  ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2); ctx.fill();
  say(ctx, text, px, py, size, { align: 'center', color: '#14100c', weight: 800, sans: true });
}

const bondLine = (ctx, a, b, w = 3) => { ctx.strokeStyle = C.steel; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); ctx.lineWidth = 1; };

/* ================================================================== beaker */

export function beakerFixture(id, at, { w = 92, h = 44, steps = 4, title: ttl = 'Copper(II) sulfate solution' } = {}) {
  return { id, kind: 'beaker', label: ttl, at: { ...at }, size: { w, h }, dials: {}, runLabel: 'Add Ammonia', props: { added: 0, steps } };
}
export const beakerRead = (state, id) => ({ added: state.fixtures[id].props.added, full: state.fixtures[id].props.added >= state.fixtures[id].props.steps });

function paintBeaker(ctx, f, state, b) {
  const F = frameOf(b);
  const p = f.props;
  title(ctx, f, F, b);
  const g = glide(`${f.id}:nh3`, b, p.added, p.added, 1.0);
  // The flask: its tint runs from pale blue to deep blue with the ammonia that has bonded.
  const fx = 5; const fy = 9; const fw = 26; const fh = f.size.h - 15;
  const mix = Math.min(1, g / p.steps);
  const lerp = (a, c, t) => Math.round(a + (c - a) * t);
  const tint = `rgb(${lerp(143, 59, mix)},${lerp(180, 63, mix)},${lerp(216, 158, mix)})`;
  ctx.fillStyle = tint; ctx.globalAlpha = 0.85;
  ctx.fillRect(F.x(fx + 2), F.y(fy + fh * 0.35), F.len(fw - 4), F.len(fh * 0.65 - 1));
  ctx.globalAlpha = 1;
  ctx.strokeStyle = C.dust; ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(F.x(fx + fw * 0.35), F.y(fy)); ctx.lineTo(F.x(fx + fw * 0.35), F.y(fy + fh * 0.3)); ctx.lineTo(F.x(fx), F.y(fy + fh));
  ctx.lineTo(F.x(fx + fw), F.y(fy + fh)); ctx.lineTo(F.x(fx + fw * 0.65), F.y(fy + fh * 0.3)); ctx.lineTo(F.x(fx + fw * 0.65), F.y(fy));
  ctx.stroke(); ctx.lineWidth = 1;
  say(ctx, `Ammonia added: ${p.added} of ${p.steps}`, F.x(fx), F.y(f.size.h - 3.2), F.size(1.9, 6.2), { color: C.dust });
  // The window: one Cu²⁺ and its six ligands, the four in the plane changing to ammonia one a press.
  const wx = 36; const wy = 6; const ww = f.size.w - wx - 3; const wh = f.size.h - 15;
  ctx.fillStyle = C.win; ctx.fillRect(F.x(wx), F.y(wy), F.len(ww), F.len(wh));
  ctx.strokeStyle = C.steel; ctx.strokeRect(Math.round(F.x(wx)) + 0.5, Math.round(F.y(wy)) + 0.5, Math.round(F.len(ww)), Math.round(F.len(wh)));
  say(ctx, 'One copper ion, magnified', F.x(wx + 1.5), F.y(wy + 2.6), F.size(1.7, 5.8), { color: C.dim });
  const cx = F.x(wx + ww / 2); const cy = F.y(wy + wh / 2 + 1.5); const R = F.len(Math.min(ww * 0.42, wh * 0.4));
  const order = [0, 2, 1, 3, 4, 5];
  const pts = OCT_DIRS.map(d => project(d, 22, 30));
  const draw = pts.map((q, i) => ({ q, i })).sort((u, v) => u.q.depth - v.q.depth);
  const front = draw.filter(d => d.q.depth >= 0); const back = draw.filter(d => d.q.depth < 0);
  const ligAt = i => { const k = order.indexOf(i); return k < 4 && k < g - 0.5 ? 'nh3' : 'h2o'; };
  const swapGlow = i => { const k = order.indexOf(i); return k < 4 && Math.abs(g - (k + 1)) < 0.5 && g < k + 1; };
  for (const d of back) { const P = { x: cx + d.q.x * R, y: cy + d.q.y * R }; bondLine(ctx, { x: cx, y: cy }, P); drawLigand(ctx, P.x, P.y, F.len(2.9), ligAt(d.i), { dim: swapGlow(d.i), size: F.size(2, 6.5) }); }
  drawMetal(ctx, cx, cy, F.len(3.8), 'Cu²⁺', F.size(2, 7));
  for (const d of front) { const P = { x: cx + d.q.x * R, y: cy + d.q.y * R }; bondLine(ctx, { x: cx, y: cy }, P); drawLigand(ctx, P.x, P.y, F.len(2.9), ligAt(d.i), { dim: swapGlow(d.i), size: F.size(2, 6.5) }); }
}

function runBeaker(state, fid) {
  const p = state.fixtures[fid].props;
  if (p.added >= p.steps) return { noop: 'Every water molecule in the plane has been swapped.' };
  p.added += 1;
  return { stamp: {} };
}

registerFixture('beaker', { paint: paintBeaker, run: runBeaker, live: () => true });

/* ================================================================== cplx */

/**
 * The complex. `metal` and `q` the metal ion; `geom` 'oct' | 'sq' | 'tet'; `mode` (see the head of the file); `lig` the ligand a supply
 * key adds; `palette` the ligands a tap cycles through; `start` a fixed arrangement (array of ligand ids or ''); `meter` prints the
 * charge of the whole; `turn` adds the "Turn" dial (tilts the model from seen from above to seen edge-on).
 */
export function cplxFixture(id, at, { metal, q, geom = 'oct', mode = 'cycle', lig = 'h2o', palette = ['h2o', 'cl'], start = null, meter = false, turn = false, title: ttl = null, w = 56, h = 46, label = null, tilt = 25, yaw = 28, mark = false, turnStart = 1 } = {}) {
  const n = geom === 'oct' ? 6 : 4;
  const dials = {};
  if (turn) dials.turn = { min: 0, max: 6, step: 1, value: turnStart, label: 'Turn', labels: ['Above', '', '', '', '', '', 'Edge-on'] };
  const hidden = [];
  if (mode === 'cycle') {
    for (let i = 0; i < n; i++) { const v = start ? Math.max(0, palette.indexOf(start[i]) + 1) : 0; dials[`s${i}`] = { min: 0, max: palette.length, step: 1, value: v, label: `Place ${i + 1}` }; hidden.push(`s${i}`); }
  }
  if (mode === 'supply') { dials.add = { min: 0, max: 8, step: 1, value: 0, label: 'Added' }; hidden.push('add'); }
  if (mark) { dials.mark = { min: 0, max: 1, step: 1, value: 0, label: 'Marked' }; hidden.push('mark'); }
  const run = mode === 'ring6' ? { runLabel: 'Release' } : mode === 'bond' ? { runLabel: 'Bond' } : { noRun: true };
  return {
    id, kind: 'cplx', label: ttl || `${label || metal}`, at: { ...at }, size: { w, h }, dials, ...run,
    props: { metal, q, geom, mode, lig, palette, start, meter, turn, hidden, released: false, bonded: false, label, tilt, yaw, mark }
  };
}

const dirsOf = geom => (geom === 'sq' ? SQ_DIRS : geom === 'tet' ? TET_DIRS : OCT_DIRS);

/** What a complex holds: its ligands by place, how many are bonded, the extras that found no space, and the charge of the whole. */
export function cplxRead(state, id) {
  const f = state.fixtures[id];
  const p = f.props;
  const n = p.geom === 'oct' ? 6 : 4;
  let arr = new Array(n).fill('');
  let bonded = 0; let extra = 0; let added = 0;
  if (p.mode === 'cycle') arr = Array.from({ length: n }, (_, i) => p.palette[Math.round(f.dials[`s${i}`].value) - 1] || '');
  else if (p.mode === 'supply') {
    added = Math.round(f.dials.add.value);
    const L = LIGANDS[p.lig];
    const fit = Math.floor((p.geom === 'oct' ? 6 : 4) / L.places);
    const maxFit = Math.min(fit, Math.floor(L.fit / L.places));
    bonded = Math.min(added, maxFit); extra = added - bonded;
    // Ligands settle in an order that keeps each chelate's two atoms on neighbouring places.
    const order = p.geom === 'oct' ? [0, 2, 1, 4, 3, 5] : [0, 1, 2, 3];
    for (let k = 0; k < bonded * L.places; k++) arr[order[k]] = p.lig;
  } else if (p.start) arr = p.start.slice();
  const ligs = arr.filter(Boolean);
  const molecules = p.mode === 'supply' ? Array(bonded).fill(p.lig) : ligs;
  return { arr, ligands: molecules, bonded: p.mode === 'supply' ? bonded : ligs.length, extra, added, atoms: arr.filter(Boolean).length, charge: complexCharge(p.q, molecules), released: p.released, bonded2: p.bonded };
}

/** The turn a comparison is playing on model `f` right now: a quaternion, or null. It turns to fit, holds, and turns back. */
function playingTurn(f, b, state) {
  if (!b || !state) return null;
  for (const m of Object.values(state.fixtures)) {
    if (m.kind !== 'match' || m.props.b !== f.id) continue;
    const res = m.props.tried;
    glide(`${m.id}:turn`, b, res?.seq || 0, res?.seq || 0, 4);
    if (!res) continue;
    const A = cplxRead(state, m.props.a).arr; const B = cplxRead(state, f.id).arr;
    if (res.key !== `${A.join()}|${B.join()}`) continue;
    const t = since(`${m.id}:turn`, b);
    if (t > 4.2) continue;
    const g = t < 1.4 ? t / 1.4 : t < 2.8 ? 1 : Math.max(0, 1 - (t - 2.8) / 1.4);
    if (res.m) return slerpId(quat(res.m), g);
    // No turn fits: B is turned right round and flipped, to show that every turn was tried, then comes back.
    const a = g * Math.PI * 2;
    return [Math.cos(a / 2), Math.sin(a / 2) * 0.5, 0, Math.sin(a / 2) * 0.866];
  }
  return null;
}

/** Where the places stand on the drawing (pixels from the centre, unit radius), for the current turn. */
function placesOf(f, b, state = null) {
  const p = f.props;
  const turn = f.dials.turn ? f.dials.turn.value : null;
  const tTarget = turn == null ? p.tilt : 90 - turn * 15;
  const tilt = b ? glide(`${f.id}:tilt`, b, tTarget, tTarget, 0.7) : tTarget;
  let dirs = dirsOf(p.geom);
  if (p.mode === 'ring6') {
    // Held in a flat ring until released; then each glides to its place on the octahedron.
    const ring = Array.from({ length: 6 }, (_, i) => [Math.cos((i * Math.PI) / 3), Math.sin((i * Math.PI) / 3), 0]);
    const g = b ? glide(`${f.id}:rel`, b, p.released ? 1 : 0, p.released ? 1 : 0, 1.6) : (p.released ? 1 : 0);
    const target = [OCT_DIRS[0], OCT_DIRS[2], OCT_DIRS[4], OCT_DIRS[1], OCT_DIRS[3], OCT_DIRS[5]];
    dirs = ring.map((r, i) => { const t = target[i]; const v = r.map((x, k) => x + (t[k] - x) * g); const m = Math.hypot(...v) || 1; return v.map(x => x / m); });
  }
  const q = playingTurn(f, b, state);
  if (q) dirs = dirs.map(d => rotBy(q, d));
  return dirs.map(d => project(d, tilt, p.yaw ?? 28));
}

function geomOf(f) {
  const p = f.props;
  const top = f.dials.turn ? 13 : 6;
  // A line of words under the model (a supply key, the meter, a mark) takes the bottom 8 units; otherwise only a margin.
  const foot = (p.mode === 'supply' || p.meter || p.mark || p.mode === 'ring6') ? 8 : 3;
  const cx = f.size.w / 2; const cy = top + (f.size.h - top - foot) / 2;
  const R = Math.min(f.size.w * 0.34, (f.size.h - top - foot) * 0.4);
  return { cx, cy, R, top };
}

function paintCplx(ctx, f, state, b) {
  const F = frameOf(b);
  const p = f.props;
  const r = cplxRead(state, f.id);
  title(ctx, f, F, b);
  const G = geomOf(f);
  const cx = F.x(G.cx); const cy = F.y(G.cy); const R = F.len(G.R);
  const metalText = p.label || `${p.metal}${p.q === 1 ? '⁺' : p.q === 2 ? '²⁺' : p.q === 3 ? '³⁺' : ''}`;
  if (p.mode === 'bond') { paintBond(ctx, f, F, b, G); return; }
  const P = placesOf(f, b, state);
  const order = P.map((q, i) => ({ q, i })).sort((u, v) => u.q.depth - v.q.depth);
  const lr = F.len(Math.max(2.2, G.R * 0.17)); const ls = F.size(1.8, 6.5);
  const drawAt = (i, front) => {
    const q = P[i];
    if ((q.depth >= 0) !== front) return;
    const pos = { x: cx + q.x * R, y: cy + q.y * R };
    const id = r.arr[i];
    if (id) {
      bondLine(ctx, { x: cx, y: cy }, pos, Math.max(2, F.len(0.5)));
      drawLigand(ctx, pos.x, pos.y, lr, id, { size: ls, label: !(p.mode === 'supply' && LIGANDS[id].places === 2 && [2, 4, 5].includes(i)) });
    } else if (p.mode === 'cycle') {
      ctx.strokeStyle = C.dust; ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.arc(pos.x, pos.y, lr, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
    }
    if (p.mode === 'ring6' && !id) drawLigand(ctx, pos.x, pos.y, lr, 'nh3', { size: ls });
  };
  // In a supply bench the space round the ion is drawn: a faint shell, and the room each bonded ligand takes on it.
  if (p.mode === 'supply') {
    ctx.strokeStyle = 'rgba(184,175,160,0.25)'; ctx.setLineDash([2, 4]);
    ctx.beginPath(); ctx.ellipse ? ctx.ellipse(cx, cy, R, R * 0.62, 0, 0, Math.PI * 2) : ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
  }
  // A chelate: the two nitrogens of each en joined by its carbon backbone.
  const chelate = p.mode === 'supply' && LIGANDS[p.lig].places === 2;
  for (const d of order) drawAt(d.i, false);
  if (chelate) {
    ctx.strokeStyle = '#8a8274'; ctx.lineWidth = Math.max(2, F.len(0.6));
    const ord = [0, 2, 1, 4, 3, 5];
    for (let k = 0; k + 1 < r.atoms; k += 2) { const a = P[ord[k]]; const c2 = P[ord[k + 1]]; ctx.beginPath(); ctx.moveTo(cx + a.x * R, cy + a.y * R); ctx.quadraticCurveTo(cx + (a.x + c2.x) * R * 0.9, cy + (a.y + c2.y) * R * 0.9, cx + c2.x * R, cy + c2.y * R); ctx.stroke(); }
    ctx.lineWidth = 1;
  }
  drawMetal(ctx, cx, cy, F.len(Math.max(3.4, G.R * 0.27)), metalText, F.size(2.1, 7));
  for (const d of order) drawAt(d.i, true);
  if (p.mode === 'ring6' && !p.released) say(ctx, 'Held in a flat ring', F.x(2.2), F.y(f.size.h - 3.4), F.size(1.9, 6.2), { color: C.dim });
  // Molecules that found no space: pushed off, unbonded, on the right.
  if (p.mode === 'supply') {
    for (let k = 0; k < r.extra; k++) {
      const t = Math.min(1, since(`${f.id}:x${k}`, b) / 0.8);
      glide(`${f.id}:x${k}`, b, 1, 1, 0.8);
      drawLigand(ctx, F.x(f.size.w - 6), F.y(G.top + 6 + k * 8) - (1 - t) * 0, lr, p.lig, { dim: true, size: ls });
    }
    if (r.extra) say(ctx, 'No space: not bonded', F.x(f.size.w - 2.2), F.y(f.size.h - 3.2), F.size(1.8, 6), { align: 'right', color: C.amber });
    // The supply key.
    const k = supplyKey(f);
    ctx.fillStyle = '#2a2620'; ctx.fillRect(F.x(k.x0), F.y(k.y0), F.len(k.x1 - k.x0), F.len(k.y1 - k.y0));
    ctx.strokeStyle = C.amber; ctx.strokeRect(Math.round(F.x(k.x0)) + 0.5, Math.round(F.y(k.y0)) + 0.5, Math.round(F.len(k.x1 - k.x0)), Math.round(F.len(k.y1 - k.y0)));
    say(ctx, `Add ${LIGANDS[p.lig].sym}`, F.x((k.x0 + k.x1) / 2), F.y((k.y0 + k.y1) / 2), F.size(2.1, 7), { align: 'center', color: C.amber, weight: 700, sans: true });
  }
  if (p.mark) {
    const on = Math.round(f.dials.mark.value) === 1;
    ctx.strokeStyle = on ? C.amber : C.dim; ctx.lineWidth = on ? 2.5 : 1; if (!on) ctx.setLineDash([2, 3]);
    ctx.strokeRect(F.x(0.6), F.y(0.6), F.len(f.size.w - 1.2), F.len(f.size.h - 1.2)); ctx.setLineDash([]); ctx.lineWidth = 1;
    say(ctx, on ? 'Marked' : 'Tap to mark', F.x(f.size.w - 2.2), F.y(f.size.h - 3.2), F.size(1.9, 6.2), { align: 'right', color: on ? C.amber : C.dim, weight: 700 });
  }
  if (p.meter) {
    say(ctx, `Charge of the whole: ${signed(r.charge)}`, F.x(f.size.w - 2.2), F.y(f.size.h - 3.4), F.size(2.2, 7), { align: 'right', color: C.amber, weight: 700 });
  }
  paintPick(ctx, f, state, b);
}

const supplyKey = f => ({ x0: 2, x1: 19, y0: f.size.h - 8.5, y1: f.size.h - 2 });

/** Ammonia meets Cu²⁺: copper's nine 3d electrons and nitrogen's lone pair, each drawn in its owner's colour. */
function paintBond(ctx, f, F, b, G) {
  const p = f.props;
  const g = glide(`${f.id}:bond`, b, p.bonded ? 1 : 0, p.bonded ? 1 : 0, 1.8);
  const cx = F.x(G.cx - G.R * 0.7); const cy = F.y(G.cy);
  const cuR = F.len(7);
  drawMetal(ctx, cx, cy, cuR, 'Cu²⁺', F.size(2.0, 7));
  // Copper's nine 3d electrons, round the ion.
  for (let i = 0; i < 9; i++) {
    // Spread over the side away from the ammonia, so the gap holds only the bond's own electrons.
    const a = Math.PI * (0.32 + (i / 8) * 1.36);
    ctx.fillStyle = C.cuIn; ctx.beginPath(); ctx.arc(cx + Math.cos(a) * cuR * 1.45, cy + Math.sin(a) * cuR * 1.45, Math.max(2.6, F.len(0.9)), 0, Math.PI * 2); ctx.fill();
  }
  // Ammonia comes in from the right, its lone pair facing the ion.
  const far = G.cx + G.R * 1.0; const near = G.cx - G.R * 0.7 + 13;
  const nx = F.x(far + (near - far) * g); const ny = cy;
  const nR = F.len(4);
  ctx.fillStyle = DONOR_INK.N; ctx.beginPath(); ctx.arc(nx, ny, nR, 0, Math.PI * 2); ctx.fill();
  say(ctx, 'N', nx, ny, F.size(1.9, 7), { align: 'center', color: '#0e1218', weight: 800, sans: true });
  for (const [dx, dy] of [[0.9, -1.1], [0.9, 1.1], [1.6, 0]]) {
    ctx.strokeStyle = C.steel; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(nx, ny); ctx.lineTo(nx + dx * nR * 1.4, ny + dy * nR * 1.4); ctx.stroke(); ctx.lineWidth = 1;
    ctx.fillStyle = '#d6cebd'; ctx.beginPath(); ctx.arc(nx + dx * nR * 1.5, ny + dy * nR * 1.5, nR * 0.45, 0, Math.PI * 2); ctx.fill();
  }
  // The lone pair: two dots on the side facing copper; once bonded they sit in the gap.
  const pairX = nx - nR * 1.5;
  const gapX = (cx + cuR * 1.45 + nx - nR) / 2;
  const lx = pairX + (gapX - pairX) * g;
  for (const dy of [-0.9, 0.9]) { ctx.fillStyle = C.nIn; ctx.beginPath(); ctx.arc(lx, ny + F.len(dy * 1.2), Math.max(2.6, F.len(0.9)), 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#d8e4f0'; ctx.stroke(); }
  if (g > 0.95) { ctx.strokeStyle = C.steel; ctx.setLineDash([4, 3]); ctx.beginPath(); ctx.moveTo(cx + cuR, cy); ctx.lineTo(nx - nR, ny); ctx.stroke(); ctx.setLineDash([]); }
  // The key and the counts.
  const ky = f.size.h - 9;
  ctx.fillStyle = C.cuIn; ctx.beginPath(); ctx.arc(F.x(3.5), F.y(ky), Math.max(2.2, F.len(0.7)), 0, Math.PI * 2); ctx.fill();
  say(ctx, 'copper\'s 3d electrons: 9', F.x(5.5), F.y(ky), F.size(1.9, 6.2), { color: C.text });
  ctx.fillStyle = C.nIn; ctx.beginPath(); ctx.arc(F.x(3.5), F.y(ky + 4), Math.max(2.2, F.len(0.7)), 0, Math.PI * 2); ctx.fill();
  say(ctx, 'nitrogen\'s lone pair: 2', F.x(5.5), F.y(ky + 4), F.size(1.9, 6.2), { color: C.text });
}

function cplxTaps(f, state) {
  const p = f.props;
  if (p.mode === 'supply') { const k = supplyKey(f); return [{ x0: k.x0, x1: k.x1, y0: k.y0, y1: k.y1, dial: 'add', step: 1 }]; }
  if (p.mark) { const top = f.dials.turn ? 13 : 5; return [{ x0: 1, x1: f.size.w - 1, y0: top, y1: f.size.h - 1, dial: 'mark', step: 1, wrap: true }]; }
  if (p.mode !== 'cycle') return [];
  const G = geomOf(f);
  const P = placesOf(f, null);
  const rr = Math.max(3.4, G.R * 0.24);
  return P.map((q, i) => ({ x0: G.cx + q.x * G.R - rr, x1: G.cx + q.x * G.R + rr, y0: G.cy + q.y * G.R - rr, y1: G.cy + q.y * G.R + rr, dial: `s${i}`, step: 1, wrap: true }))
    // A place hidden behind the ion (seen end-on) is not offered: the nearer one wins.
    .sort((a, c) => (P[Number(c.dial.slice(1))].depth - P[Number(a.dial.slice(1))].depth));
}

function runCplx(state, fid) {
  const p = state.fixtures[fid].props;
  if (p.mode === 'ring6') { if (p.released) return { noop: 'The ligands have already settled.' }; p.released = true; return { stamp: {} }; }
  if (p.mode === 'bond') { if (p.bonded) return { noop: 'The bond has formed.' }; p.bonded = true; return { stamp: {} }; }
  return null;
}

registerFixture('cplx', { paint: paintCplx, run: runCplx, tapZones: cplxTaps, live: () => true });

/* ================================================================== match */

export function matchFixture(id, at, { a, b: bId, geom = 'sq', w = 44, h = 30, title: ttl = null } = {}) {
  return { id, kind: 'match', label: ttl || `Turn ${bId} to fit ${a}`, at: { ...at }, size: { w, h }, dials: {}, runLabel: `Turn ${bId} to Fit ${a}`, props: { a, b: bId, geom, tried: null } };
}
export const matchRead = (state, id) => state.fixtures[id].props.tried;

const quat = m => {
  const tr = m[0][0] + m[1][1] + m[2][2];
  let w; let x; let y; let z;
  if (tr > 0) { const s = Math.sqrt(tr + 1) * 2; w = s / 4; x = (m[2][1] - m[1][2]) / s; y = (m[0][2] - m[2][0]) / s; z = (m[1][0] - m[0][1]) / s; } else if (m[0][0] > m[1][1] && m[0][0] > m[2][2]) { const s = Math.sqrt(1 + m[0][0] - m[1][1] - m[2][2]) * 2; w = (m[2][1] - m[1][2]) / s; x = s / 4; y = (m[0][1] + m[1][0]) / s; z = (m[0][2] + m[2][0]) / s; } else if (m[1][1] > m[2][2]) { const s = Math.sqrt(1 + m[1][1] - m[0][0] - m[2][2]) * 2; w = (m[0][2] - m[2][0]) / s; x = (m[0][1] + m[1][0]) / s; y = s / 4; z = (m[1][2] + m[2][1]) / s; } else { const s = Math.sqrt(1 + m[2][2] - m[0][0] - m[1][1]) * 2; w = (m[1][0] - m[0][1]) / s; x = (m[0][2] + m[2][0]) / s; y = (m[1][2] + m[2][1]) / s; z = s / 4; }
  return [w, x, y, z];
};
const rotBy = ([w, x, y, z], [vx, vy, vz]) => {
  const ix = w * vx + y * vz - z * vy; const iy = w * vy + z * vx - x * vz; const iz = w * vz + x * vy - y * vx; const iw = -x * vx - y * vy - z * vz;
  return [ix * w + iw * -x + iy * -z - iz * -y, iy * w + iw * -y + iz * -x - ix * -z, iz * w + iw * -z + ix * -y - iy * -x];
};
const slerpId = (q, t) => { const th = Math.acos(Math.max(-1, Math.min(1, q[0]))); if (th < 1e-6) return [1, 0, 0, 0]; const s = Math.sin(th); const a = Math.sin((1 - t) * th) / s; const c = Math.sin(t * th) / s; return [a + c * q[0], c * q[1], c * q[2], c * q[3]]; };

function paintMatch(ctx, f, state, b) {
  const F = frameOf(b);
  const p = f.props;
  const res = p.tried;
  const A = state.fixtures[p.a] ? cplxRead(state, p.a).arr : [];
  const B = state.fixtures[p.b] ? cplxRead(state, p.b).arr : [];
  const key = `${A.join()}|${B.join()}`;
  glide(`${f.id}:turn`, b, res?.seq || 0, res?.seq || 0, 4);
  say(ctx, `Model ${p.b} against model ${p.a}`, F.x(2.2), F.y(3.2), F.size(2.1, 7), { color: C.dust, weight: 600, maxW: F.len(f.size.w - 4) });
  if (!res || res.key !== key) {
    say(ctx, res ? 'A model has changed: press again' : 'Press the key below', F.x(2.2), F.y(7.4), F.size(2, 6.5), { color: C.dim, maxW: F.len(f.size.w - 4) });
    return;
  }
  const playing = since(`${f.id}:turn`, b) < 1.4;
  const words = playing ? `Turning model ${p.b}…` : res.m ? `The same: a turn lays ${p.b} on ${p.a}` : `Different: no turn or flip fits`;
  say(ctx, words, F.x(2.2), F.y(7.4), F.size(2.1, 7), { color: playing ? C.dust : res.m ? C.phosphor : C.amber, weight: 700, maxW: F.len(f.size.w - 4) });
}

function runMatch(state, fid) {
  const f = state.fixtures[fid];
  const p = f.props;
  const A = cplxRead(state, p.a).arr; const B = cplxRead(state, p.b).arr;
  if (A.some(x => !x) || B.some(x => !x)) return { noop: 'Fill every place on both models first.' };
  const m = fitTurn(p.geom, A, B);
  // fitTurn answers the turn that carries each of B's places onto the place of A that holds the same ligand: B is turned by it.
  p.tried = { key: `${A.join()}|${B.join()}`, same: Boolean(m), m, seq: (p.tried?.seq || 0) + 1 };
  return { stamp: {} };
}

registerFixture('match', { paint: paintMatch, run: runMatch, live: () => true });

export { project as projectDir };
