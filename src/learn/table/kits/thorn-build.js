/**
 * kits/thorn-build.js — Thornmere's model board (`tbuild`) and the tapped answer (`tchoice`).
 *
 *   tbuild   carbons on a square lattice. Tap an empty place beside a carbon to add a carbon there (it bonds to the carbon next to it);
 *            tap between two neighbouring carbons to change their bond (none, single, double); on a `manual` board tap a carbon to add
 *            a hydrogen, and on an `auto` board the hydrogens that fill each carbon's four bonds are drawn for you. A carbon with four
 *            bonds takes no more: a new bond to a full carbon makes one of its hydrogens leave. An optional formula line counts the
 *            atoms on the board; an optional Record key keeps each different molecule on a strip.
 *   tchoice  statements to tap; the one tapped is the answer.
 *
 * All of a board's state is in hidden dials (`c<i>` a carbon at place i, `x<i>` / `y<i>` the bond from place i to the place on its right /
 * below it, `h<i>` the hydrogens added to carbon i), so every tap is one `setDial` that Undo takes back and a script can replay.
 */

import { skeleton, usedBonds, freeBonds, hydrogensOf, formulaOf, canonKey, ringsOf, doublesOf, longestChain, componentsOf } from '../../engine/thorndata.js';
import { registerFixture } from './thorn-registry.js';
import { C, ATOM_INK, frameOf, say, title, foot, progress, ease } from './thorn-draw.js';

/* ================================================================== tbuild */

const siteCount = p => p.cols * p.rows;
const colOf = (p, i) => i % p.cols;
const rowOf = (p, i) => Math.floor(i / p.cols);
/** The lattice neighbours of place i, each with the dial of the bond that would join them. */
function neighbours(p, i) {
  const c = colOf(p, i); const r = rowOf(p, i); const out = [];
  if (c > 0) out.push({ j: i - 1, dial: `x${i - 1}` });
  if (c < p.cols - 1) out.push({ j: i + 1, dial: `x${i}` });
  if (r > 0) out.push({ j: i - p.cols, dial: `y${i - p.cols}` });
  if (r < p.rows - 1) out.push({ j: i + p.cols, dial: `y${i}` });
  return out;
}
/** Every bond dial of the lattice: `[dial, i, j]`. */
function edges(p) {
  const out = [];
  for (let i = 0; i < siteCount(p); i++) {
    if (colOf(p, i) < p.cols - 1) out.push([`x${i}`, i, i + 1]);
    if (rowOf(p, i) < p.rows - 1) out.push([`y${i}`, i, i + p.cols]);
  }
  return out;
}

/**
 * @param {object} o
 *   cols, rows   the lattice (default 6 by 3)
 *   auto         true: hydrogens are drawn to fill every carbon; false: the student adds them, one tap each
 *   formula      show the formula of what is on the board
 *   start        `{ sites: [i], bonds: [[i, j, order]], h: { i: n } }` the board as it begins
 *   lock         no carbon can be added (only bonds and hydrogens change); `lockBonds` fixes the bonds too
 *   maxOrder     2 lets a bond be made double; 1 keeps every bond single
 *   record       a Record key and a strip of the different molecules recorded; `recordFormula` refuses any other formula
 */
export function tbuildFixture(id, at, { cols = 6, rows = 3, auto = true, formula = false, start = null, lock = false, lockBonds = false, maxOrder = 2, record = false, recordFormula = null, title: ttl = 'Model board', w = 86, h = 46 } = {}) {
  const p = { cols, rows };
  const dials = {};
  const hidden = [];
  const S = start || { sites: [], bonds: [], h: {} };
  for (let i = 0; i < cols * rows; i++) {
    dials[`c${i}`] = { min: 0, max: 1, step: 1, value: S.sites.includes(i) ? 1 : 0, label: 'Carbon' };
    dials[`h${i}`] = { min: 0, max: 4, step: 1, value: S.h?.[i] ?? 0, label: 'Hydrogens' };
    hidden.push(`c${i}`, `h${i}`);
  }
  for (const [dial, i, j] of edges(p)) {
    const b = (S.bonds || []).find(([a, c]) => (a === i && c === j) || (a === j && c === i));
    dials[dial] = { min: 0, max: maxOrder, step: 1, value: b ? b[2] : 0, label: 'Bond' };
    hidden.push(dial);
  }
  return {
    id, kind: 'tbuild', label: ttl, at: { ...at }, size: { w, h }, dials,
    ...(record ? { runLabel: 'Record' } : { noRun: true }),
    props: {
      cols, rows, auto, formula, lock, lockBonds, maxOrder, record, recordFormula, hidden,
      known: [...S.sites], prev: Object.fromEntries(edges(p).map(([d]) => [d, dials[d].value])), eff: null,
      recorded: [], left: { site: -1, n: 0 }, refused: { n: 0, msg: '' }
    }
  };
}

const carbonsOf = f => { const out = []; for (let i = 0; i < siteCount(f.props); i++) if (Math.round(f.dials[`c${i}`].value) === 1) out.push(i); return out; };
const bondsOf = f => edges(f.props).map(([d, i, j]) => [i, j, Math.round(f.dials[d].value)]).filter(b => b[2] > 0);

/** What the board holds. */
export function buildRead(state, id) {
  const f = state.fixtures[id];
  const g = skeleton(carbonsOf(f), bondsOf(f));
  const hOn = i => (f.props.auto ? freeBonds(g, i) : Math.min(freeBonds(g, i), Math.round(f.dials[`h${i}`].value)));
  const nH = g.ids.reduce((s, i) => s + hOn(i), 0);
  const open = g.ids.filter(i => hOn(i) < freeBonds(g, i));
  return {
    g, nC: g.n, nH, hOn,
    full: g.n > 0 && open.length === 0,
    open,
    formula: g.n ? formulaOf({ C: g.n, H: nH }) : '',
    key: canonKey(g),
    joined: g.n > 0 && componentsOf(g) === 1,
    rings: ringsOf(g), doubles: doublesOf(g), longest: longestChain(g),
    recorded: f.props.recorded.map(r => r.key)
  };
}
/** "left", "middle", "right" ... of the board, for a miss that names a carbon without numbering it. */
export function whereOn(state, id, site) {
  const f = state.fixtures[id];
  const cs = carbonsOf(f);
  const xs = cs.map(i => colOf(f.props, i));
  const lo = Math.min(...xs); const hi = Math.max(...xs);
  const c = colOf(f.props, site);
  if (lo === hi) return rowOf(f.props, site) === Math.min(...cs.map(i => rowOf(f.props, i))) ? 'top' : 'lower';
  return c === lo ? 'left' : c === hi ? 'right' : 'middle';
}

function settleBuild(state) {
  for (const f of Object.values(state.fixtures)) {
    if (f.kind !== 'tbuild') continue;
    const p = f.props;
    const E = edges(p);
    const cs = new Set(carbonsOf(f));
    // Only a bond with a carbon at both ends counts (a dial between empty places is ignored, never read).
    const live = ([, i, j]) => cs.has(i) && cs.has(j);
    const used = i => E.reduce((s, e) => s + (live(e) && (e[1] === i || e[2] === i) ? Math.round(f.dials[e[0]].value) : 0), 0);
    // A carbon just added bonds to the carbon beside it (the one with most bonds to spare).
    for (const i of cs) {
      if (p.known.includes(i) || used(i) > 0) continue;
      const near = neighbours(p, i).filter(n => cs.has(n.j) && used(n.j) < 4).sort((x, y) => used(x.j) - used(y.j));
      if (near.length) f.dials[near[0].dial].value = 1;
    }
    // A bond that would give a carbon more than four goes back to no bond (the tap went past what the carbon can hold).
    for (const e of E) {
      if (!live(e)) continue;
      const now = Math.round(f.dials[e[0]].value);
      if (now !== (p.prev[e[0]] ?? 0) && (used(e[1]) > 4 || used(e[2]) > 4)) f.dials[e[0]].value = 0;
    }
    // Hydrogens on each carbon, as drawn: remember where one has just left, so the picture can show it going.
    const eff = {};
    for (const i of cs) {
      const free = Math.max(0, 4 - used(i));
      eff[i] = p.auto ? free : Math.min(free, Math.round(f.dials[`h${i}`].value));
      if (p.known.includes(i) && p.eff && p.eff[i] !== undefined && eff[i] < p.eff[i]) p.left = { site: i, n: p.left.n + 1 };
    }
    p.eff = eff;
    p.known = [...cs];
    p.prev = Object.fromEntries(E.map(e => [e[0], live(e) ? Math.round(f.dials[e[0]].value) : 0]));
  }
}

function runBuild(state, fid) {
  const f = state.fixtures[fid];
  const p = f.props;
  if (!p.record) return null;
  const r = buildRead(state, fid);
  const refuse = msg => { p.refused = { n: p.refused.n + 1, msg }; return { noop: msg }; };
  if (!r.nC) return refuse('The board is empty.');
  if (!r.joined) return refuse('The carbons on the board are not all joined.');
  if (p.recordFormula && r.formula !== p.recordFormula) return refuse(`The board holds ${r.formula}.`);
  if (r.recorded.includes(r.key)) return refuse('Already recorded: the same carbons joined in the same order.');
  p.recorded.push({ key: r.key, sites: carbonsOf(f), bonds: bondsOf(f) });
  p.refused = { n: p.refused.n, msg: '' };
  return { stamp: {} };
}

/* ---- geometry (fixture units) ---- */

function geomOf(f) {
  const p = f.props;
  const stripW = p.record ? 22 : 0;
  const left = 3; const top = 7.5; const bottom = f.size.h - (p.formula || p.record ? 7.5 : 3);
  const w = f.size.w - left - 3 - stripW; const h = bottom - top;
  const pitch = Math.min(26, w / p.cols, h / p.rows);
  const x0 = left + (w - pitch * p.cols) / 2 + pitch / 2;
  const y0 = top + (h - pitch * p.rows) / 2 + pitch / 2;
  return { pitch, at: i => ({ x: x0 + colOf(p, i) * pitch, y: y0 + rowOf(p, i) * pitch }), stripX: f.size.w - stripW - 1, stripW, top, bottom };
}

/** Empty places a carbon can be added at: beside a carbon, or anywhere on an empty board. */
function openPlaces(f) {
  const p = f.props;
  if (p.lock) return [];
  const cs = new Set(carbonsOf(f));
  const out = [];
  for (let i = 0; i < siteCount(p); i++) {
    if (cs.has(i)) continue;
    if (!cs.size || neighbours(p, i).some(n => cs.has(n.j))) out.push(i);
  }
  return out;
}

function buildTaps(f) {
  const p = f.props;
  const G = geomOf(f);
  const cs = new Set(carbonsOf(f));
  const zones = [];
  const rr = Math.max(2.6, G.pitch * 0.27);
  // Between two neighbouring carbons: the bond.
  for (const [d, i, j] of edges(p)) {
    if (p.lockBonds || !cs.has(i) || !cs.has(j)) continue;
    const a = G.at(i); const b = G.at(j);
    const mx = (a.x + b.x) / 2; const my = (a.y + b.y) / 2; const er = G.pitch * 0.2;
    zones.push({ x0: mx - er, x1: mx + er, y0: my - er, y1: my + er, dial: d, step: 1, wrap: true });
  }
  // A carbon: one more hydrogen (manual boards).
  if (!p.auto) for (const i of cs) { const a = G.at(i); zones.push({ x0: a.x - rr, x1: a.x + rr, y0: a.y - rr, y1: a.y + rr, dial: `h${i}`, step: 1 }); }
  // An empty place beside a carbon: a new carbon.
  for (const i of openPlaces(f)) { const a = G.at(i); zones.push({ x0: a.x - rr, x1: a.x + rr, y0: a.y - rr, y1: a.y + rr, dial: `c${i}`, value: 1 }); }
  return zones;
}

/** Directions round a carbon with no bond in them, in the order hydrogens are drawn. */
function freeDirs(f, i, cs) {
  const p = f.props;
  const taken = new Set();
  for (const n of neighbours(p, i)) if (cs.has(n.j) && Math.round(f.dials[n.dial].value) > 0) taken.add(n.j - i);
  return [[-p.cols, 0, -1], [p.cols, 0, 1], [-1, -1, 0], [1, 1, 0]].filter(([dj]) => !taken.has(dj)).map(([, dx, dy]) => [dx, dy]);
}

function drawSkeleton(ctx, F, pts, bonds, x, y, w, h) {
  const xs = pts.map(q => q.c); const ys = pts.map(q => q.r);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2; const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  const s = Math.min(w / (Math.max(...xs) - Math.min(...xs) + 1.4), h / (Math.max(...ys) - Math.min(...ys) + 1.4));
  const P = q => ({ x: F.x(x + w / 2 + (q.c - cx) * s), y: F.y(y + h / 2 + (q.r - cy) * s) });
  ctx.strokeStyle = C.text; ctx.lineWidth = 1.4;
  for (const [a, b, o] of bonds) {
    const A = P(pts.find(q => q.i === a)); const B = P(pts.find(q => q.i === b));
    ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke();
    if (o === 2) { ctx.beginPath(); ctx.moveTo(A.x + 2, A.y + 2); ctx.lineTo(B.x + 2, B.y + 2); ctx.stroke(); }
  }
  ctx.fillStyle = C.text;
  for (const q of pts) { const A = P(q); ctx.beginPath(); ctx.arc(A.x, A.y, 1.6, 0, Math.PI * 2); ctx.fill(); }
  ctx.lineWidth = 1;
}

function paintBuild(ctx, f, state, b) {
  const F = frameOf(b);
  const p = f.props;
  const G = geomOf(f);
  const r = buildRead(state, f.id);
  const cs = new Set(r.g.ids);
  title(ctx, f, F, b);
  const u = F.len(G.pitch);

  // Places a carbon can be added at.
  for (const i of openPlaces(f)) {
    const a = G.at(i);
    ctx.strokeStyle = C.dim; ctx.setLineDash([2, 3]);
    ctx.beginPath(); ctx.arc(F.x(a.x), F.y(a.y), u * 0.2, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
    say(ctx, '+', F.x(a.x), F.y(a.y), Math.max(7, u * 0.26), { align: 'center', color: C.dim, weight: 700, sans: true });
  }
  // Gaps between neighbouring carbons that are not bonded: a faint mark where a tap makes the bond.
  for (const [d, i, j] of edges(p)) {
    if (!cs.has(i) || !cs.has(j)) continue;
    const A = G.at(i); const B = G.at(j);
    const o = Math.round(f.dials[d].value);
    const ax = F.x(A.x); const ay = F.y(A.y); const bx = F.x(B.x); const by = F.y(B.y);
    if (!o) {
      ctx.strokeStyle = C.dim; ctx.setLineDash([1.5, 3]);
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke(); ctx.setLineDash([]);
      continue;
    }
    const dx = bx - ax; const dy = by - ay; const L = Math.hypot(dx, dy) || 1;
    const nx = (-dy / L) * u * 0.07; const ny = (dx / L) * u * 0.07;
    ctx.strokeStyle = C.bond; ctx.lineWidth = Math.max(1.6, u * 0.05);
    const ln = (ox, oy) => { ctx.beginPath(); ctx.moveTo(ax + ox, ay + oy); ctx.lineTo(bx + ox, by + oy); ctx.stroke(); };
    if (o === 2) { ln(nx, ny); ln(-nx, -ny); } else ln(0, 0);
    ctx.lineWidth = 1;
  }
  // A hydrogen that has just left a carbon drifts off and fades.
  const leftK = progress(`${f.id}:left`, b, p.left.n, 1.3);
  // Hydrogens, then carbons.
  const hInk = ATOM_INK.H; const cInk = ATOM_INK.C;
  for (const i of cs) {
    const a = G.at(i);
    const dirs = freeDirs(f, i, cs);
    const n = r.hOn(i);
    for (let k = 0; k < n && k < dirs.length; k++) {
      const hx = F.x(a.x + dirs[k][0] * G.pitch * 0.37); const hy = F.y(a.y + dirs[k][1] * G.pitch * 0.37);
      ctx.strokeStyle = C.bond; ctx.lineWidth = Math.max(1.2, u * 0.035);
      ctx.beginPath(); ctx.moveTo(F.x(a.x), F.y(a.y)); ctx.lineTo(hx, hy); ctx.stroke(); ctx.lineWidth = 1;
      ctx.fillStyle = hInk.fill; ctx.beginPath(); ctx.arc(hx, hy, Math.max(2.4, u * 0.115), 0, Math.PI * 2); ctx.fill();
      say(ctx, 'H', hx, hy + 0.5, Math.max(6, u * 0.15), { align: 'center', color: hInk.text, weight: 800, sans: true });
    }
    if (leftK < 1 && p.left.site === i) {
      const d = dirs[Math.min(n, dirs.length - 1)] || [0, -1];
      const k = ease(leftK);
      const hx = F.x(a.x + d[0] * G.pitch * (0.37 + 0.5 * k)); const hy = F.y(a.y + d[1] * G.pitch * (0.37 + 0.5 * k) - G.pitch * 0.2 * k);
      ctx.globalAlpha = 1 - k; ctx.fillStyle = hInk.fill; ctx.beginPath(); ctx.arc(hx, hy, Math.max(2.4, u * 0.115), 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
    }
  }
  for (const i of cs) {
    const a = G.at(i);
    const x = F.x(a.x); const y = F.y(a.y); const rad = Math.max(4, u * 0.2);
    ctx.fillStyle = cInk.fill; ctx.beginPath(); ctx.arc(x, y, rad, 0, Math.PI * 2); ctx.fill();
    // On a manual board a carbon's ring is whole once its four bonds are used, and open while one is unused.
    const full = r.hOn(i) >= freeBonds(r.g, i);
    ctx.strokeStyle = !p.auto && !full ? C.amber : cInk.ring; ctx.lineWidth = !p.auto && !full ? 1.8 : 1.2;
    if (!p.auto && !full) ctx.setLineDash([3, 2.5]);
    ctx.beginPath(); ctx.arc(x, y, rad, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); ctx.lineWidth = 1;
    say(ctx, 'C', x, y + 0.5, Math.max(7, u * 0.24), { align: 'center', color: cInk.text, weight: 800, sans: true });
  }
  if (!r.nC) say(ctx, 'Tap a place to set down a carbon', F.x(f.size.w / 2 - G.stripW / 2), F.y(G.top + 2), F.size(1.9, 6.4), { align: 'center', color: C.dim });

  // The record strip.
  if (p.record) {
    const sx = G.stripX; const sw = G.stripW;
    ctx.strokeStyle = C.steel; ctx.strokeRect(Math.round(F.x(sx)) + 0.5, Math.round(F.y(G.top - 1)) + 0.5, Math.round(F.len(sw)), Math.round(F.len(G.bottom - G.top + 2)));
    say(ctx, 'Recorded', F.x(sx + sw / 2), F.y(G.top + 1.6), F.size(1.8, 6), { align: 'center', color: C.dust });
    const cellH = (G.bottom - G.top - 3) / 5;
    p.recorded.slice(0, 5).forEach((rec, k) => {
      const pts = rec.sites.map(i => ({ i, c: colOf(p, i), r: rowOf(p, i) }));
      drawSkeleton(ctx, F, pts, rec.bonds, sx + 1.5, G.top + 3.4 + k * cellH, sw - 3, cellH - 1);
    });
  }
  // The foot: the formula of what is on the board, or what Record refused.
  const refusedK = progress(`${f.id}:ref`, b, p.refused.n, 4);
  if (p.record && p.refused.msg && refusedK < 1) foot(ctx, f, F, p.refused.msg, C.amber, 16);
  else if (p.formula && r.nC) foot(ctx, f, F, `On the board: ${r.formula}`, C.text, p.record ? 16 : 0);
  else if (p.record) foot(ctx, f, F, `${p.recorded.length} recorded`, C.dim, 16);
}

registerFixture('tbuild', { paint: paintBuild, run: runBuild, tapZones: buildTaps, settle: settleBuild, live: () => true });

/** Dial settings that build a skeleton on a board: for scripts (`SOLUTIONS`, `MISSES`). */
export function buildScript(fixture, { sites = [], bonds = [], h = {} } = {}) {
  const out = [];
  for (const i of sites) out.push({ setDial: { fixture, dial: `c${i}`, value: 1 } });
  for (const [a, b, o] of bonds) {
    const lo = Math.min(a, b); const hi = Math.max(a, b);
    out.push({ setDial: { fixture, dial: hi - lo === 1 ? `x${lo}` : `y${lo}`, value: o } });
  }
  for (const [i, n] of Object.entries(h)) out.push({ setDial: { fixture, dial: `h${i}`, value: n } });
  return out;
}

/* ================================================================== tchoice */

/** The answer given by tapping one of a short list of statements: a hidden dial (`value`) with a blank start. */
export function tchoiceFixture(id, label, at, { options, w = 60 } = {}) {
  const h = 7 + options.length * 7.4;
  const taps = options.map((_, i) => ({ x0: 1, x1: w - 1, y0: 5.6 + i * 7.4, y1: 12 + i * 7.4, dial: 'value', value: i + 1 }));
  return {
    id, kind: 'tchoice', label, at: { ...at }, size: { w, h }, noRun: true,
    dials: { value: { min: 0, max: options.length, step: 1, value: 0, label: 'Chosen' } },
    props: { options, hidden: ['value'], taps }
  };
}
/** The 1-based number of the statement tapped (0 while none is). */
export const chosenIndex = (state, id) => Math.round(state.fixtures[id]?.dials?.value?.value ?? 0);
export const chosen = (state, id) => { const v = chosenIndex(state, id); return v ? state.fixtures[id].props.options[v - 1] : null; };

function paintChoice(ctx, f, state, b) {
  const F = frameOf(b);
  const pick = chosenIndex(state, f.id);
  say(ctx, f.label, F.x(2), F.y(3), F.size(2.1, 6.5), { color: C.dust, weight: 600, maxW: F.len(f.size.w - 4) });
  f.props.options.forEach((o, i) => {
    const on = pick === i + 1;
    ctx.strokeStyle = on ? C.amber : C.steel; ctx.lineWidth = on ? 2 : 1;
    ctx.strokeRect(Math.round(F.x(1.2)) + 0.5, Math.round(F.y(5.8 + i * 7.4)) + 0.5, Math.round(F.len(f.size.w - 2.4)), Math.round(F.len(6)));
    ctx.lineWidth = 1;
    say(ctx, o, F.x(2.6), F.y(8.8 + i * 7.4), F.size(2.2, 7), { color: on ? C.amber : C.text, weight: on ? 700 : 500, maxW: F.len(f.size.w - 5) });
  });
}
registerFixture('tchoice', { paint: paintChoice });
