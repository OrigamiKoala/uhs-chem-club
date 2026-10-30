/**
 * kits/pot-balance.js — the instruments and pieces of Kettle's q4-balance, registered on the pot kit (`pot-registry.js`).
 *
 * THE EQUATION BOARD (fixture `eqboard`): a line of formulas with a dial under it for each substance whose number the player sets (and,
 * on one stage, a dial that turns a small number inside a formula). It writes the equation the dials say, and never says whether it
 * balances. THE PARTICLE WINDOW (`eqwindow`) draws exactly what the board says as small clusters of atoms, before the change on the left
 * and after it on the right (or, locked, a pot's diagram). THE ATOM LEDGER (`eqledger`) counts the atoms (or the groups) on each side:
 * no tick, no lamp, the player compares. THE TALLY (`eqtally`) holds a count set by hand. STATE TILES (piece `statetile`) are laid in a
 * slot under a substance.
 *
 * A THIN WRAPPER over `engine/reactdata.js` and `engine/reactdata-balance.js`: a painter prints what the planners say and never decides.
 */

import { PLATE_COLORS } from '../../engine/plates.js';
import { addTourText } from '../tour.js';
import { registerFixture, registerPiece } from './pot-registry.js';
import { frameOf, say, slab } from './pot-draw.js';
import { seatedIn, dialAt } from './pot-read.js';
import { contentTop } from './heat-draw.js';
import { parseEquation, pretty, atomLedger } from '../../engine/reactdata.js';
import { boardPlan, groupLedger, shapeOf, extentOf, RADIUS, INK, STATE_OF, diagramOf } from '../../engine/reactdata-balance.js';

const AMBER = PLATE_COLORS.amber;
const DUST = PLATE_COLORS.dust;
const DIM = PLATE_COLORS.dim;
const STEEL = PLATE_COLORS.steel;
const R1 = n => Math.round(n * 10) / 10;

/* ------------------------------------------------------------------
   WHAT THE INSTRUMENTS READ
   ------------------------------------------------------------------ */

/** The equation a board stands for right now: the coefficients its dials say, the small number turned, the states laid in its slots. */
export function boardRead(state, fid) {
  const f = state.fixtures[fid];
  const p = f.props;
  const base = parseEquation(p.eq);
  const all = [...base.lhs, ...base.rhs];
  const coefs = all.map((s, i) => (p.dialed.includes(i) ? dialAt(state, fid, `c${i}`) : s.n));
  const subs = {};
  if (p.sub) { const n = dialAt(state, fid, 'sub'); if (n !== 1) subs[p.sub.at] = { el: p.sub.el, n }; }
  const states = {};
  if (p.states) p.states.forEach((sid, i) => { const t = seatedIn(state, sid); states[i] = t ? t.props.state : null; });
  const plan = boardPlan(p.eq, { coefs, subs, states: p.states ? states : {} });
  return { f, p, plan, coefs, subs, states, nl: base.lhs.length, sealed: p.sealed || [] };
}

/** The window's two halves: lists of `{ f, n, sealed, state }`. */
export function windowRead(state, wid) {
  const f = state.fixtures[wid];
  const p = f.props;
  if (p.pot) {
    const d = diagramOf(p.pot.eq, p.pot.feed);
    return { f, p, before: d.before.map(([ff, n]) => ({ f: ff, n })), after: d.after.map(([ff, n]) => ({ f: ff, n })) };
  }
  const r = boardRead(state, p.board);
  const sp = r.plan.species.map((s, i) => ({ f: s.f, n: s.n, sealed: r.sealed.includes(i), state: p.phases ? STATE_OF[s.f] : null }));
  return { f, p, before: sp.slice(0, r.nl), after: sp.slice(r.nl) };
}

/** The ledger's rows: `{ el, left, right }` by atom, or by group when the ledger counts groups. */
export function ledgerRead(state, lid) {
  const f = state.fixtures[lid];
  const r = boardRead(state, f.props.board);
  return { f, rows: f.props.groups ? groupLedger(r.plan.eq, f.props.groups).rows : atomLedger(r.plan.eq).rows, plan: r.plan };
}

/** The numbers the tally dials stand at. */
export const tallyRead = (state, tid) => ({ before: dialAt(state, tid, 'before'), after: dialAt(state, tid, 'after') });

/* ------------------------------------------------------------------
   THE BOARD
   ------------------------------------------------------------------ */

const sideText = (species, sealedIdx, from) => species.map((s, i) => {
  const n = s.n === 1 ? '' : `${s.n} `;
  const name = sealedIdx.includes(from + i) ? '?' : pretty(s.f);
  return `${n}${name}${s.state ? `(${s.state})` : ''}`;
}).join(' + ');

/** A formula up to and including the last written `el`, without its count (`H2O`, `O` → `H2O`): the stem of a small-number dial's label. */
function stemOf(formula, el) {
  const i = formula.lastIndexOf(el);
  return i < 0 ? formula : formula.slice(0, i + el.length);
}

/**
 * The board. `eq` is the starting equation (`'H2 + O2 -> H2O'`; written coefficients stay); `dialed` is `'all'` or the list of species
 * (left then right, counted from 0) that get a coefficient dial, `start` the dial positions by species; `sub` is `{ at, el }`: a dial
 * that turns the count of `el` in species `at` (written as 1) up to 3; `states` lists the slot id under each species; `sealed` the
 * species hidden as `?`; `lex` is how many of the bench's words are earned (0 none, 1 reactant and product, 2 coefficient too).
 */
export function boardFixture(id, at, { eq, dialed = 'all', start = {}, sub = null, states = null, sealed = [], lex = 0, title = 'Board', w = 72, coefMax = 6 } = {}) {
  const base = parseEquation(eq);
  const all = [...base.lhs, ...base.rhs];
  const dl = dialed === 'all' ? all.map((_, i) => i) : dialed;
  const dials = {};
  dl.forEach(i => {
    dials[`c${i}`] = { min: 1, max: coefMax, step: 1, value: start[i] ?? 1, label: `_ ${sealed.includes(i) ? '?' : pretty(all[i].f)}` };
  });
  if (sub) {
    const labels = [1, 2, 3].map(n => (n === 1 ? '' : String(n).split('').map(d => '₀₁₂₃₄₅₆₇₈₉'[+d]).join('')));
    dials.sub = { min: 1, max: 3, step: 1, value: 1, label: `${pretty(stemOf(all[sub.at].f, sub.el))}_`, labels };
  }
  const nd = Object.keys(dials).length;
  const top = contentTop(nd);
  const h = R1(top + 11);
  return {
    id, kind: 'eqboard', label: title, at: { ...at }, size: { w, h }, dials, noRun: true,
    props: { backdrop: true, eq, dialed: dl, sub, states, sealed, lex, top }
  };
}

function paintBoard(ctx, f, state, b) {
  const F = frameOf(b);
  const r = boardRead(state, f.id);
  const p = f.props;
  const species = r.plan.species;
  const left = sideText(species.slice(0, r.nl), r.sealed, 0);
  const right = sideText(species.slice(r.nl), r.sealed, r.nl);
  const y = p.top + 5.2;
  const half = (f.size.w - 8) / 2 - 2.2;
  const chars = Math.max(left.length, right.length, 8);
  const size = F.size(Math.min(3.6, half / (chars * 0.62)), 6.4);
  const mid = f.size.w / 2;
  if (p.lex >= 1) {
    say(ctx, 'Reactants', F.x(mid - 3), F.y(y - 4.4), F.size(1.9, 6), { align: 'right', color: DIM });
    say(ctx, 'Products', F.x(mid + 3), F.y(y - 4.4), F.size(1.9, 6), { color: DIM });
  }
  say(ctx, left, F.x(mid - 3), F.y(y), size, { align: 'right', weight: 700, maxW: F.len(half) });
  say(ctx, '→', F.x(mid), F.y(y), size, { align: 'center', color: AMBER, weight: 700 });
  say(ctx, right, F.x(mid + 3), F.y(y), size, { align: 'left', weight: 700, maxW: F.len(half) });
}

registerFixture('eqboard', { paint: paintBoard });

/* ------------------------------------------------------------------
   THE PARTICLE WINDOW
   ------------------------------------------------------------------ */

const K = 1.25;
const CAP = 24;
const GAP = 0.8;
const LABEL_W = 10;
const WINDOW_BODY = { top: 5.2, bottom: 5.6 };

/** Rings round the groups that travel as one piece (atom indexes of each group, by formula). */
export const RINGS = { 'Ca(OH)2': [[1, 3], [2, 4]], H3PO4: [[0, 1, 2, 3, 4]], 'Ca3(PO4)2': [[0, 1, 2, 3, 4], [5, 6, 7, 8, 9]], H2O: [[0, 1]] };

function drawMolecule(ctx, F, formula, cx, cy, u, ring) {
  const atoms = shapeOf(formula);
  for (const a of atoms) {
    const ar = Math.max(1.2, F.len(RADIUS[a.el] * u));
    ctx.beginPath(); ctx.arc(F.x(cx + a.x * u), F.y(cy + a.y * u), ar, 0, Math.PI * 2);
    ctx.fillStyle = INK[a.el] || '#b8afa0'; ctx.fill();
    ctx.strokeStyle = '#0c0b09'; ctx.lineWidth = 0.6; ctx.stroke();
  }
  if (ring && RINGS[formula]) {
    ctx.strokeStyle = DUST; ctx.lineWidth = 1; ctx.setLineDash?.([3, 2]);
    for (const idx of RINGS[formula]) {
      const sel = idx.map(i => atoms[i]);
      const xs = sel.map(a => a.x); const ys = sel.map(a => a.y);
      const mx = (Math.min(...xs) + Math.max(...xs)) / 2; const my = (Math.min(...ys) + Math.max(...ys)) / 2;
      const rr = Math.max(...sel.map(a => Math.hypot(a.x - mx, a.y - my) + RADIUS[a.el])) + 0.25;
      ctx.beginPath(); ctx.arc(F.x(cx + mx * u), F.y(cy + my * u), F.len(rr * u), 0, Math.PI * 2); ctx.stroke();
    }
    ctx.setLineDash?.([]);
  }
}

const extent = g => (g.sealed ? { w: 3.2 / K, h: 3.2 / K } : extentOf(g.f));

/** The scale at which a side's groups fit, and the lines each group takes. */
function fitSide(groups, availW, bodyH) {
  for (let s = 1; s >= 0.3; s -= 0.05) {
    const u = K * s;
    let total = 0;
    const plan = groups.map(g => {
      const e = extent(g);
      const tw = e.w * u; const th = e.h * u;
      const n = Math.min(g.n, CAP);
      const per = Math.max(1, Math.floor((availW + GAP) / (tw + GAP)));
      const lines = Math.ceil(n / per);
      const h = lines * (th + GAP);
      total += h;
      return { g, tw, th, per, lines, h, n };
    });
    total += Math.max(0, groups.length - 1) * 1.1;
    if (total <= bodyH || s <= 0.31) return { u, plan, s };
  }
  return null;
}

function paintSide(ctx, F, groups, x0, w, y0, bodyH, o) {
  const fit = fitSide(groups, w - LABEL_W, bodyH);
  const rowsFixed = o.phases ? bodyH / Math.max(1, groups.length) : null;
  let y = y0;
  const tiny = F.size(1.9, 6);
  fit.plan.forEach(({ g, tw, th, per, h, n }, gi) => {
    const rowH = rowsFixed ?? h;
    say(ctx, g.sealed ? '?' : pretty(g.f), F.x(x0), F.y(y + Math.min(rowH, th + GAP) / 2), tiny, { color: DUST, weight: 700, maxW: F.len(LABEL_W - 1) });
    const e = extent(g);
    const u = o.phases ? Math.min(K, (rowH * 0.7) / e.h) : fit.u;
    const mw = e.w * u; const mh = e.h * u;
    const ax = x0 + LABEL_W; const aw = w - LABEL_W;
    const mol = (cx, cy) => {
      if (g.sealed) {
        ctx.strokeStyle = STEEL; ctx.strokeRect(Math.round(F.x(cx - 1.6)) + 0.5, Math.round(F.y(cy - 1.6)) + 0.5, Math.round(F.len(3.2)), Math.round(F.len(3.2)));
        say(ctx, '?', F.x(cx), F.y(cy), F.size(2.6, 7), { align: 'center', color: DUST, weight: 700 });
      } else drawMolecule(ctx, F, g.f, cx, cy, u, o.rings);
    };
    if (o.phases) {
      const st = g.state || 's';
      const cy0 = y + rowH / 2;
      if (st === 'aq') {
        for (let i = 0; i < 26; i++) {
          const px = ax + ((i * 7.31) % aw); const py = y + 0.6 + ((i * 3.77) % Math.max(1, rowH - 1.2));
          ctx.fillStyle = '#6f8fb0'; ctx.globalAlpha = 0.55; ctx.beginPath(); ctx.arc(F.x(px), F.y(py), Math.max(1, F.len(0.28)), 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
        }
      }
      const cols = st === 's' ? Math.min(n, Math.max(1, Math.floor(aw / (mw + 0.3)))) : n;
      for (let i = 0; i < n; i++) {
        let cx; let cy;
        if (st === 's') { cx = ax + mw / 2 + (i % cols) * (mw + 0.3); cy = cy0 + (Math.floor(i / cols) - (Math.ceil(n / cols) - 1) / 2) * (mh + 0.3); }
        else if (st === 'l') { cx = ax + mw / 2 + 0.4 + (i % 4) * (mw + 0.5) + ((i * 37) % 7) / 10; cy = cy0 + ((i * 53) % 9 - 4) / 6 + Math.floor(i / 4) * (mh + 0.4); }
        else if (st === 'g') { cx = ax + (aw * (i + 0.5)) / n; cy = cy0 + (i % 2 ? 1 : -1) * rowH * 0.18; }
        else { cx = ax + (aw * (i + 0.5)) / n; cy = cy0 + (i % 2 ? 1 : -1) * rowH * 0.16; }
        mol(cx, cy);
      }
      if (st === 's') {
        const rows = Math.ceil(n / cols);
        ctx.strokeStyle = DIM;
        ctx.strokeRect(Math.round(F.x(ax)) + 0.5, Math.round(F.y(cy0 - (rows * (mh + 0.3)) / 2)) + 0.5, Math.round(F.len(cols * (mw + 0.3) + 0.3)), Math.round(F.len(rows * (mh + 0.3))));
      }
    } else {
      for (let i = 0; i < n; i++) mol(ax + tw / 2 + (i % per) * (tw + GAP), y + th / 2 + Math.floor(i / per) * (th + GAP));
      if (g.n > CAP) say(ctx, `+${g.n - CAP}`, F.x(x0 + w), F.y(y + h / 2), tiny, { align: 'right', color: DIM });
    }
    y += rowH + (gi < fit.plan.length - 1 ? 1.1 : 0);
  });
}

function paintWindow(ctx, f, state, b) {
  const F = frameOf(b);
  const r = windowRead(state, f.id);
  const w = f.size.w; const h = f.size.h;
  const p = f.props;
  ctx.fillStyle = '#100f0c'; ctx.fillRect(F.x(1.2), F.y(1.2), F.len(w - 2.4), F.len(h - 2.4));
  ctx.strokeStyle = STEEL; ctx.strokeRect(Math.round(F.x(1.2)) + 0.5, Math.round(F.y(1.2)) + 0.5, Math.round(F.len(w - 2.4)), Math.round(F.len(h - 2.4)));
  const mid = w / 2;
  ctx.beginPath(); ctx.moveTo(F.x(mid), F.y(2.4)); ctx.lineTo(F.x(mid), F.y(h - 2.4)); ctx.stroke();
  const hs = F.size(2.1, 6);
  say(ctx, 'BEFORE', F.x(3), F.y(3.4), hs, { color: DIM });
  say(ctx, 'AFTER', F.x(mid + 1.8), F.y(3.4), hs, { color: DIM });
  const bodyH = h - WINDOW_BODY.top - WINDOW_BODY.bottom;
  const opts = { phases: Boolean(p.phases), rings: Boolean(p.rings) };
  if (r.before.length) paintSide(ctx, F, r.before, 3, mid - 4.8, WINDOW_BODY.top, bodyH, opts);
  if (r.after.length) paintSide(ctx, F, r.after, mid + 1.8, mid - 4.8, WINDOW_BODY.top, bodyH, opts);
  // The key: the colour of each kind of atom drawn.
  const els = [];
  for (const g of [...r.before, ...r.after]) if (!g.sealed) for (const a of shapeOf(g.f)) if (!els.includes(a.el)) els.push(a.el);
  els.forEach((el, i) => {
    const x = 4 + i * 8;
    ctx.beginPath(); ctx.arc(F.x(x), F.y(h - 3.4), Math.max(2, F.len(0.8)), 0, Math.PI * 2); ctx.fillStyle = INK[el]; ctx.fill();
    say(ctx, el, F.x(x + 1.6), F.y(h - 3.4), F.size(1.9, 6), { color: DUST });
  });
  if (p.pot) say(ctx, 'fixed picture', F.x(w - 3), F.y(h - 3.4), F.size(1.8, 5.8), { align: 'right', color: DIM });
}

/** The window. `board` is the board it draws; or `pot` is `{ eq, feed }` for a locked diagram of a pot; `phases` draws each substance's state; `rings` rings the groups that stay whole. */
export function windowFixture(id, at, { board = null, pot = null, phases = false, rings = false, w = 68, h = 30, title = 'Window' } = {}) {
  return { id, kind: 'eqwindow', label: title, at: { ...at }, size: { w, h }, dials: {}, noRun: true, props: { backdrop: true, hideLabel: true, board, pot, phases, rings } };
}

registerFixture('eqwindow', { paint: paintWindow });

/* ------------------------------------------------------------------
   THE ATOM LEDGER AND THE TALLY
   ------------------------------------------------------------------ */

/** The ledger: one row per kind of atom (or per group when `groups` lists them), the count on each side of the arrow. */
export function ledgerFixture(id, at, { board, groups = null, rows = 3, lex = 1, w = 68, title = 'Atom ledger' } = {}) {
  const h = R1(Math.min(26, 11.4 + rows * 4.1));
  return { id, kind: 'eqledger', label: groups ? 'Ledger' : title, at: { ...at }, size: { w, h }, dials: {}, noRun: true, props: { backdrop: true, board, groups, lex } };
}

function paintLedger(ctx, f, state, b) {
  const F = frameOf(b);
  const { rows } = ledgerRead(state, f.id);
  const w = f.size.w;
  const hs = F.size(2.1, 6);
  say(ctx, f.props.groups ? 'Pieces' : 'Atoms', F.x(4), F.y(8), hs, { color: DIM });
  say(ctx, 'Reactants', F.x(w * 0.58), F.y(8), hs, { align: 'center', color: DIM });
  say(ctx, 'Products', F.x(w * 0.86), F.y(8), hs, { align: 'center', color: DIM });
  const size = F.size(3.4, 8);
  rows.forEach((r, i) => {
    const y = 12.4 + i * 4.1;
    say(ctx, pretty(r.el), F.x(4), F.y(y), size, { weight: 700 });
    say(ctx, String(r.left), F.x(w * 0.58), F.y(y), size, { align: 'center', color: AMBER, weight: 700 });
    say(ctx, String(r.right), F.x(w * 0.86), F.y(y), size, { align: 'center', color: AMBER, weight: 700 });
  });
}

registerFixture('eqledger', { paint: paintLedger });

/** The tally: two dials the player sets to the number of atoms of one element they count before and after. */
export function tallyFixture(id, at, { element = 'O', name = 'Oxygen', w = 56 } = {}) {
  const dials = {
    before: { min: 0, max: 6, step: 1, value: 0, label: `${name} before _` },
    after: { min: 0, max: 6, step: 1, value: 0, label: `${name} after _` }
  };
  return { id, kind: 'eqtally', label: 'Tally', at: { ...at }, size: { w, h: R1(contentTop(2) + 3) }, dials, noRun: true, props: { element } };
}

registerFixture('eqtally', { paint: () => {} });

/* ------------------------------------------------------------------
   THE FORMULA BUILDER
   ------------------------------------------------------------------ */

/** The formula the builder's dials spell: the count of each element, and the text (`P₂O₅`; `—` while every dial is at 0). */
export function formulaRead(state, fid) {
  const f = state.fixtures[fid];
  const counts = {};
  let text = '';
  for (const el of f.props.elements) {
    const n = dialAt(state, fid, `el_${el}`);
    if (n > 0) { counts[el] = n; text += `${el}${n === 1 ? '' : String(n)}`; }
  }
  return { f, counts, formula: text, text: text ? pretty(text) : '—' };
}

/** A formula built by setting how many atoms of each kind it has (`elements`, in the order they are written). */
export function formulaFixture(id, at, { elements = ['P', 'O'], w = 56, title = 'Formula' } = {}) {
  const dials = {};
  elements.forEach(el => { dials[`el_${el}`] = { min: 0, max: 6, step: 1, value: 0, label: `${el} atoms _` }; });
  return { id, kind: 'eqformula', label: title, at: { ...at }, size: { w, h: R1(contentTop(elements.length) + 9) }, dials, noRun: true, props: { backdrop: true, elements } };
}

registerFixture('eqformula', {
  paint(ctx, f, state, b) {
    const F = frameOf(b);
    const r = formulaRead(state, f.id);
    say(ctx, r.text, F.x(f.size.w / 2), F.y(f.size.h - 5.2), F.size(4.4, 9), { align: 'center', weight: 700, color: r.formula ? AMBER : DIM });
  }
});

/* ------------------------------------------------------------------
   STATE TILES
   ------------------------------------------------------------------ */

const TILE_RECT = Object.freeze({ hw: 8, hh: 5.5 });
export const TILE_NAME = { s: 'solid', l: 'liquid', g: 'gas', aq: 'in water' };

/** A state tile: `state` is `s`, `l`, `g` or `aq`. */
export const stateTile = (id, state, at, extra = {}) => ({ id, kind: 'statetile', label: `(${state}) ${TILE_NAME[state]}`, at, props: { state }, ...extra });

registerPiece('statetile', {
  kind: { r: 7, rect: TILE_RECT, nojoin: true },
  paint(ctx, p, state, o) {
    const box = slab(ctx, o, TILE_RECT, '#2a2620');
    say(ctx, `(${p.props.state})`, o.x, box.y0 + box.h * 0.38, Math.max(7, 3.2 * o.sc), { align: 'center', weight: 700, color: AMBER, maxW: box.w - 2 });
    say(ctx, TILE_NAME[p.props.state], o.x, box.y0 + box.h * 0.76, Math.max(6, 1.8 * o.sc), { align: 'center', color: DUST, maxW: box.w - 2 });
  },
  faceKey: p => `statetile|${p.props.state}`,
  printed: p => `(${p.props.state})`
});

/* ------------------------------------------------------------------
   A WHOLE BENCH'S WORTH OF INSTRUMENTS
   ------------------------------------------------------------------ */

/**
 * The board with its window and ledger, laid out on the 150 x 64 table: the board on the left, the window above the ledger on the right.
 * Returns the fixtures (and the board's state slots, when it has states). `ledger` is `'atoms'`, `'groups'` or false.
 */
export function eqBench({ eq, dialed = 'all', start = {}, sub = null, states = false, sealed = [], lex = 0, ledger = 'atoms', pot = null, phases = false, rings = false, boardTitle = 'Board', groups = ['Ca', 'H', 'OH', 'PO4'], coefMax = 6 } = {}) {
  const base = parseEquation(eq);
  const all = [...base.lhs, ...base.rhs];
  const slotIds = states ? all.map((_, i) => `bd.s${i}`) : null;
  const board = boardFixture('bd', { x: 39, y: 20 }, { eq, dialed, start, sub, states: slotIds, sealed, lex, title: boardTitle, coefMax });
  board.at.y = R1(3 + board.size.h / 2);
  const win = windowFixture('win', { x: 113, y: 18 }, pot ? { pot, rings, phases } : { board: 'bd', phases, rings });
  const fixtures = [board, win];
  if (ledger) {
    const rows = ledger === 'groups' ? groups.length : atomLedger(base).rows.length;
    const led = ledgerFixture('led', { x: 113, y: 0 }, { board: 'bd', groups: ledger === 'groups' ? groups : null, rows, lex });
    led.at.y = R1(33.5 + led.size.h / 2);
    fixtures.push(led);
  }
  const slots = states
    ? all.map((s, i) => ({ id: slotIds[i], label: pretty(s.f), at: { x: 12 + i * 19, y: R1(board.at.y + board.size.h / 2 + 11) }, size: { w: 17, h: 11 } }))
    : [];
  return { board, fixtures, slots, boardId: 'bd', winId: 'win', ledId: 'led' };
}

/* ------------------------------------------------------------------
   TOUR WORDS
   ------------------------------------------------------------------ */

const BOARD_TEXT = f => {
  const p = f.props;
  const dials = Object.keys(f.dials).length;
  const bits = [];
  if (p.lex >= 1) bits.push('The board writes out what happens in the pot: the reactants on the left of the arrow and the products on the right, each with the number written in front of it.');
  else bits.push('The board writes out what happens in the pot: the substances before the change on the left of the arrow and the substances after it on the right.');
  if (dials) {
    const named = p.lex >= 2 ? 'a coefficient' : 'a number in front of a substance';
    bits.push(`Each dial is named for one substance, and turning it sets ${named}.`);
    if (p.sub) bits.push('The dial named after a formula with a bare small number turns that small number inside the formula.');
  }
  bits.push(dials ? 'The line on the board changes as you turn a dial.' : 'Nothing on it is set by hand.');
  return bits.join(' ');
};

addTourText({
  'pot:eqboard': { title: 'Board', dials: false, text: BOARD_TEXT },
  'pot:eqwindow': {
    title: 'Window', dials: false,
    text: f => (f.props.pot
      ? 'The window shows a pot before a change on the left and after it on the right. Each small ball is an atom, coloured by the key along the bottom, and a cluster is one molecule. This picture is fixed: no dial changes it.'
      : 'The window draws what the board says. Each small ball is an atom, coloured by the key along the bottom, and a cluster is one molecule. The left half is before the change and the right half is after it, so turning a board dial redraws it.')
  },
  'pot:eqledger': {
    title: 'Atom ledger', dials: false,
    text: f => (f.props.groups
      ? 'The ledger counts pieces: a group of atoms that stays together is counted once, as one piece. It prints how many of each piece stand on the left of the arrow and on the right, for the numbers set on the board. It only counts: you compare the two columns.'
      : 'The ledger counts atoms, one row for each kind. It prints how many of that atom stand on the left of the arrow and on the right, for the numbers set on the board. It only counts: you compare the two columns.')
  },
  'pot:eqformula': {
    title: 'Formula', dials: false,
    text: 'Each dial is named for one kind of atom and sets how many of it the formula has. The line at the bottom writes the formula the dials spell, and shows a dash while every dial is at 0.'
  },
  'pot:eqtally': {
    title: 'Tally', dials: false,
    text: 'Two dials for one kind of atom. Set the dial named "before" to the number of those atoms you count in the left half of the window, and the dial named "after" to the number in the right half. They only hold your count.'
  }
}, {
  statetile: ['State tiles', 'Each tile has a symbol in brackets and a word for what it means. Drag a tile into the slot under a substance to write it after that substance on the board. The window shows how the particles of each substance sit.']
});
