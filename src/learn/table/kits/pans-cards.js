/**
 * kits/pans-cards.js — the card board of `q4-properties` (Combining K), registered on the pans kit (`pans-registry.js`).
 *
 *   REACTION CARD  a reaction written with ⇌ and, on a given card, the K it was printed with. It can be flipped and made larger (the pans
 *                  kit's Flip and Larger keys); the equation on its face follows. A turned card does not print a new K: nobody has read one.
 *   K TILE         a number to lay in an answer slot.
 *   PAN CHECK      a sealed mixture at equilibrium, drawn as bars of what it holds. The cards laid in its tray are added into one reaction,
 *                  and "Read K" gives that reaction's K as the ratio of the amounts the bars hold, with the powers the reaction is written
 *                  with. The reading is the planner's (`engine/eqdata.js` `kOfNet`); the check never applies a rule to a printed K.
 *   STACK          the cards in its tray added into one reaction, printed under the reaction wanted. It prints no K.
 */

import { PLATE_COLORS } from '../../engine/plates.js';
import { registerFixture, registerPiece } from './pans-registry.js';
import { say, slab, frameOf } from './matter-draw.js';
import { piecesInTray, stackRead } from './heat-read.js';
import { fmtK, rewriteCard, netOfCards, netSides, kOfNet } from '../../engine/eqdata.js';
import { driftOf } from './pans-pan.js';
import './pans-cards-tour.js';

const DUST = PLATE_COLORS.dust;
const DIM = PLATE_COLORS.dim;
const STEEL = PLATE_COLORS.steel;
const AMBER = PLATE_COLORS.amber;
const PHOS = PLATE_COLORS.phosphor;

/* ------------------------------------------------------------------ the words of an equation */

const coef = n => (Math.abs(n - 1) < 1e-9 ? '' : `${Number(n.toFixed(2))} `);
export const fmtSide = terms => terms.map(([n, s]) => `${coef(n)}${s}`).join(' + ');
export const fmtRxn = ({ lhs, rhs }) => `${fmtSide(lhs)} ⇌ ${fmtSide(rhs)}`;

/** A card as it stands now: its terms and the badges it wears. */
export function rxnTerms(card) {
  const flipped = Boolean(card.props.flipped);
  const scale = card.props.scale || 1;
  return { ...rewriteCard({ lhs: card.props.lhs, rhs: card.props.rhs, flipped, scale }), flipped, scale };
}
const asCard = p => ({ lhs: p.props.lhs, rhs: p.props.rhs, flipped: Boolean(p.props.flipped), scale: p.props.scale || 1 });


/* ------------------------------------------------------------------ the reaction machine (a moving model of adding reactions) */

const SPECIES_INK = ['#c0652b', '#6f8fb0', '#8a9a5b', '#b88a3a', '#9a7fb0', '#5e9a94', '#b06a7a', '#a39a86'];

/**
 * The mechanism view of cards that are added into one reaction. Each card is a row: the particles it uses on the left, the particles it
 * makes on the right (one particle per unit of coefficient, drifting). A particle that one card makes and another uses is shown fading in
 * and out as the two cancel; the bottom row holds what is left, the net reaction. Counts are the cards' own terms (`rows`) and the
 * planner's net (`net`), so what is drawn is what is graded. With a frozen clock nothing fades or drifts.
 */
export function paintMachine(ctx, F, x, y, w, h, rows, net, clock) {
  const order = [];
  for (const r of rows) for (const [, sp] of [...r.lhs, ...r.rhs]) if (!order.includes(sp)) order.push(sp);
  for (const sp of Object.keys(net)) if (!order.includes(sp)) order.push(sp);
  const ink = sp => SPECIES_INK[order.indexOf(sp) % SPECIES_INK.length];
  ctx.fillStyle = '#100f0c'; ctx.fillRect(F.x(x), F.y(y), F.len(w), F.len(h));
  ctx.strokeStyle = STEEL; ctx.strokeRect(Math.round(F.x(x)) + 0.5, Math.round(F.y(y)) + 0.5, Math.round(F.len(w)), Math.round(F.len(h)));
  const made = {}; const used = {};
  for (const r of rows) { for (const [n, sp] of r.rhs) made[sp] = (made[sp] || 0) + n; for (const [n, sp] of r.lhs) used[sp] = (used[sp] || 0) + n; }
  const cancel = {}; for (const sp of order) cancel[sp] = Math.min(made[sp] || 0, used[sp] || 0);
  const cap = 6;
  const nRows = rows.length + 1;
  const rh = h / Math.max(nRows, 3);
  const rad = Math.min(0.9, rh * 0.22);
  const seenMade = {}; const seenUsed = {};
  const dot = (sp, cx, cy, k, fade) => {
    const d = driftOf(k, clock, 1.8);
    ctx.globalAlpha = fade;
    ctx.fillStyle = ink(sp);
    ctx.beginPath(); ctx.arc(F.x(cx + d.dx * 0.35), F.y(cy + d.dy * 0.25), Math.max(1.8, F.len(rad)), 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  };
  const pulse = clock ? 0.55 + 0.45 * Math.cos(clock * 2.2) : 1;
  let k = 0;
  const half = w / 2;
  rows.forEach((r, i) => {
    const cy = y + (i + 0.5) * rh;
    let cx = x + 1.6;
    for (const [n, sp] of r.lhs) for (let j = 0; j < Math.min(cap, Math.round(n)); j++) { seenUsed[sp] = (seenUsed[sp] || 0) + 1; dot(sp, cx, cy, k++, seenUsed[sp] <= cancel[sp] ? pulse : 1); cx += rad * 2.8; }
    ctx.strokeStyle = DIM; ctx.beginPath(); ctx.moveTo(F.x(x + half - 1.2), F.y(cy)); ctx.lineTo(F.x(x + half + 1.2), F.y(cy)); ctx.stroke();
    cx = x + half + 2.4;
    for (const [n, sp] of r.rhs) for (let j = 0; j < Math.min(cap, Math.round(n)); j++) { seenMade[sp] = (seenMade[sp] || 0) + 1; dot(sp, cx, cy, k++, seenMade[sp] <= cancel[sp] ? pulse : 1); cx += rad * 2.8; }
  });
  const ny = y + (rows.length + 0.5) * rh;
  ctx.strokeStyle = AMBER; ctx.beginPath(); ctx.moveTo(F.x(x + 1), F.y(ny - rh / 2)); ctx.lineTo(F.x(x + w - 1), F.y(ny - rh / 2)); ctx.stroke();
  let ux = x + 1.6; let mx = x + half + 2.4;
  for (const sp of order) {
    const c = net[sp] || 0;
    for (let j = 0; j < Math.min(cap, Math.round(Math.abs(c))); j++) {
      if (c < 0) { dot(sp, ux, ny, k++, 1); ux += rad * 2.8; } else { dot(sp, mx, ny, k++, 1); mx += rad * 2.8; }
    }
  }
}

/** The rows and net a stack of reaction cards (this kit's `rxn`) adds up to. */
export const machineOf = cards => ({ rows: cards.map(c => { const t = rxnTerms(c); return { lhs: t.lhs, rhs: t.rhs }; }), net: netOfCards(cards.map(asCard)) });

/* ------------------------------------------------------------------ the reaction card */

const RECT_RXN = { hw: 24, hh: 5.6 };

function paintRxn(ctx, p, state, o) {
  const t = rxnTerms(p);
  const marked = t.flipped || t.scale > 1;
  const box = slab(ctx, o, RECT_RXN, marked ? '#2c2412' : '#2a2620');
  const sc = o.sc;
  say(ctx, fmtRxn(t), o.x, box.y0 + 3.3 * sc, Math.max(7, 3.0 * sc), { align: 'center', weight: 600, maxW: box.w - 2.4 * sc });
  if (p.props.K != null && !p.props.hideK) {
    say(ctx, `${marked ? 'given K' : 'K'} ${fmtK(p.props.K)}`, box.x0 + 1.4 * sc, box.y0 + 8.3 * sc, Math.max(6.5, 2.4 * sc), { color: marked ? DUST : AMBER, weight: 700, maxW: box.w * 0.5 });
  }
  const badge = [t.flipped ? 'FLIPPED' : '', t.scale > 1 ? `× ${t.scale}` : ''].filter(Boolean).join(' ');
  if (badge) say(ctx, badge, box.x0 + box.w - 1.4 * sc, box.y0 + 8.3 * sc, Math.max(6.5, 2.4 * sc), { align: 'right', weight: 700, color: AMBER, maxW: box.w * 0.45 });
}

registerPiece('rxn', {
  kind: { r: 6.3, rect: RECT_RXN, nojoin: true, flip: true, scale: true },
  paint: paintRxn,
  faceKey: p => `rxn|${p.props.flipped ? 1 : 0}|${p.props.scale || 1}|${p.props.K ?? ''}|${p.props.hideK ? 1 : 0}`,
  printed: p => fmtRxn(rxnTerms(p))
});

/**
 * A reaction card. `lhs` and `rhs` are `[[coefficient, species], ...]`; `K` is the number printed on it (a given), left off with `hideK`.
 * `flipped` and `scale` set how it starts (a stack that is already built).
 */
export const rxnCard = (id, at, { lhs, rhs, K = null, hideK = false, flipped = false, scale = 1 }, extra = {}) =>
  ({ id, kind: 'rxn', label: id, at, props: { lhs, rhs, ...(K != null ? { K } : {}), ...(hideK ? { hideK: true } : {}), ...(flipped ? { flipped: true } : {}), ...(scale > 1 ? { scale } : {}) }, ...extra });

/* ------------------------------------------------------------------ the K tile */

const RECT_KT = { hw: 8.5, hh: 4.6 };

function paintKTile(ctx, p, state, o) {
  const box = slab(ctx, o, RECT_KT, '#1d1a16');
  say(ctx, String(p.label), o.x, box.y0 + box.h / 2, Math.max(7, 3.1 * o.sc), { align: 'center', weight: 700, color: AMBER, maxW: box.w - 1.6 * o.sc });
}

registerPiece('ktile', {
  kind: { r: 6.3, rect: RECT_KT, nojoin: true },
  paint: paintKTile,
  faceKey: p => `ktile|${p.label}`,
  printed: p => String(p.label)
});

/** A tile with a number on it, to lay in an answer slot. */
export const kTile = (id, label, at, extra = {}) => ({ id, kind: 'ktile', label, at, props: {}, ...extra });

/* ------------------------------------------------------------------ the pan check */

/** The readings the check has taken, newest last, one per equation. */
export function checkLog(state, fid) {
  const seen = new Map();
  for (const r of state.recorder.rows) {
    const [id, eq, k] = String(r.label).split('|');
    if (id !== fid) continue;
    seen.delete(eq);
    seen.set(eq, k);
  }
  return [...seen.entries()].map(([eq, k]) => ({ eq, k }));
}

/** What the cards in the tray add up to and, if the mixture holds every substance in it, the K that gives. */
export function checkRead(state, fid) {
  const f = state.fixtures[fid];
  const cards = piecesInTray(state, f.props.tray);
  const net = netOfCards(cards.map(asCard));
  const sides = netSides(net);
  const missing = Object.keys(net).filter(s => f.props.mix[s] == null);
  return { cards, net, sides, eq: Object.keys(net).length ? fmtRxn(sides) : '', missing, K: !missing.length && Object.keys(net).length ? kOfNet(net, f.props.mix) : null };
}

function paintCheck(ctx, f, state, b) {
  const F = frameOf(b);
  const p = f.props;
  const names = p.order;
  const full = Math.max(...names.map(n => p.mix[n])) * 1.15;
  const base = f.size.h - 9; const maxH = base - 12;
  const colW = 8;
  ctx.fillStyle = '#100f0c'; ctx.fillRect(F.x(2), F.y(10), F.len(names.length * colW + 3), F.len(base - 9));
  ctx.strokeStyle = STEEL; ctx.strokeRect(Math.round(F.x(2)) + 0.5, Math.round(F.y(10)) + 0.5, Math.round(F.len(names.length * colW + 3)), Math.round(F.len(base - 9)));
  const sz = F.size(2.2, 5.8);
  names.forEach((n, i) => {
    const h = (p.mix[n] / full) * maxH;
    const x = 4 + i * colW;
    ctx.fillStyle = ['#c0652b', '#6f8fb0', '#8a9a5b'][i % 3];
    ctx.fillRect(F.x(x), F.y(base - h), F.len(colW - 3), F.len(h));
    if (b.clock) {
      // The bar is a crowd of particles; the species in the cards on the check ring in amber while the reading is taken.
      const inNet = checkRead(state, f.id).net[n];
      const nd = Math.round((p.mix[n] / full) * 14);
      for (let k = 0; k < nd; k++) {
        const d = driftOf(i * 29 + k, b.clock, 2.2);
        const px = x + (colW - 3) * ((k % 2 + 0.5) / 2) + d.dx * 0.5;
        const py = base - (h / Math.ceil(nd / 2)) * (Math.floor(k / 2) + 0.5) + d.dy * 0.8;
        ctx.fillStyle = 'rgba(16,15,12,0.78)'; ctx.beginPath(); ctx.arc(F.x(px), F.y(py), Math.max(1.2, F.len(0.55)), 0, Math.PI * 2); ctx.fill();
      }
      if (inNet) { ctx.strokeStyle = AMBER; ctx.globalAlpha = 0.5 + 0.5 * Math.cos(b.clock * 3); ctx.strokeRect(F.x(x) - 1, F.y(base - h) - 1, F.len(colW - 3) + 2, F.len(h) + 2); ctx.globalAlpha = 1; }
    }
    say(ctx, (p.mix[n] + 1e-9).toFixed(3), F.x(x + (colW - 3) / 2), F.y(base - h - 1.9), sz, { align: 'center', color: DUST, weight: 700 });
    say(ctx, n, F.x(x + (colW - 3) / 2), F.y(f.size.h - 3.4), F.size(2.6, 6.4), { align: 'center', weight: 700 });
  });
  const log = checkLog(state, f.id).slice(-3);
  const lx = names.length * colW + 7;
  if (!log.length) say(ctx, 'no reading yet', F.x(lx), F.y(13), sz, { color: DIM, maxW: F.len(f.size.w - lx - 2) });
  log.forEach((e, i) => {
    say(ctx, e.eq, F.x(lx), F.y(12.2 + i * 6.4), sz, { color: DUST, maxW: F.len(f.size.w - lx - 2) });
    say(ctx, `K ${e.k}`, F.x(lx), F.y(15.5 + i * 6.4), F.size(2.5, 6.2), { color: AMBER, weight: 700, maxW: F.len(f.size.w - lx - 2) });
  });
}

function runCheck(state, fid) {
  const r = checkRead(state, fid);
  if (!r.cards.length) return { noop: 'No card lies on the check.' };
  if (!r.eq) return { noop: 'The cards on the check cancel to nothing.' };
  if (r.missing.length) return { noop: `The mixture holds no ${r.missing.join(' or ')}.` };
  const n = state.recorder.rows.length + 1;
  return { x: n, y: 100 + n, label: `${fid}|${r.eq}|${fmtK(r.K)}` };
}

registerFixture('kcheck', { paint: paintCheck, run: runCheck, live: () => true });

/**
 * The pan check. `mix` is the sealed mixture's amounts at equilibrium (species -> mol/L); `order` the species left to right; the cards in
 * `tray` are the reaction to read.
 */
export function checkFixture(id, at, { tray, mix, order, title = 'Vessel check', w = 62, h = 36 }) {
  return { id, kind: 'kcheck', label: title, at: { ...at }, size: { w, h }, runLabel: 'Read K', dials: {}, props: { tray, mix, order } };
}

/* ------------------------------------------------------------------ the stack */

export function stackNet(state, fid) {
  const f = state.fixtures[fid];
  const cards = piecesInTray(state, f.props.tray);
  const net = netOfCards(cards.map(asCard));
  return { cards, net, empty: cards.length === 0, eq: Object.keys(net).length ? fmtRxn(netSides(net)) : '' };
}

function paintStack(ctx, f, state, b) {
  const F = frameOf(b);
  const r = stackNet(state, f.id);
  const maxW = F.len(f.size.w - 4);
  const sz = F.size(2.3, 5.8);
  const wanted = f.props.wanted;
  if (wanted) {
    say(ctx, 'wanted', F.x(2), F.y(11), sz, { color: DIM });
    say(ctx, wanted, F.x(2), F.y(15.4), F.size(2.7, 6.4), { color: DUST, weight: 700, maxW });
    ctx.strokeStyle = DIM; ctx.beginPath(); ctx.moveTo(F.x(2), F.y(18.4)); ctx.lineTo(F.x(f.size.w - 2), F.y(18.4)); ctx.stroke();
  }
  const y0 = wanted ? 21.6 : 12;
  say(ctx, 'the stack adds up to', F.x(2), F.y(y0), sz, { color: DIM });
  if (r.empty) say(ctx, 'nothing stacked', F.x(2), F.y(y0 + 4.4), F.size(2.7, 6.4), { color: DIM, maxW });
  else say(ctx, r.eq || '—', F.x(2), F.y(y0 + 4.4), F.size(2.7, 6.4), { color: PHOS, weight: 700, maxW });
  const my = y0 + 8;
  if (f.size.h - my > 8) {
    const m = machineOf(r.cards);
    if (r.empty) { ctx.fillStyle = '#100f0c'; ctx.fillRect(F.x(2), F.y(my), F.len(f.size.w - 4), F.len(f.size.h - my - 1.5)); }
    else paintMachine(ctx, F, 2, my, f.size.w - 4, f.size.h - my - 1.5, m.rows, m.net, b.clock || 0);
  }
}

registerFixture('kstack', { paint: paintStack, live: () => true });

/** A stack: the cards in `tray` are added into one reaction, printed under `wanted` (a string). It prints no K. */
export function stackFixture(id, at, { tray, wanted, title = 'Stack', w = 56, h = 54 }) {
  return { id, kind: 'kstack', label: title, at: { ...at }, size: { w, h }, noRun: true, dials: {}, props: { tray, wanted } };
}

/** Does the stack add up to the reaction `want` ({species: signed coefficient})? */
export function stackMatches(state, fid, want) {
  const r = stackNet(state, fid);
  if (r.empty) return false;
  const keys = new Set([...Object.keys(r.net), ...Object.keys(want)]);
  return [...keys].every(k => Math.abs((r.net[k] || 0) - (want[k] || 0)) < 1e-9);
}

/** The stack's cards, each as `{ K, flipped, scale }`, for the stage that checks them. */
export const stackCards = (state, fid) => piecesInTray(state, state.fixtures[fid].props.tray).map(c => ({ id: c.id, ...asCard(c), K: c.props.K }));

/* ------------------------------------------------------------------ the heat kit's stack, with the same machine under it (q8-free stage 7) */

import { paintFixture as heatPaint } from './heat-draw.js';
import { cardTerms } from './heat-read.js';
registerFixture('stack', {
  paint(ctx, f, state, b) {
    heatPaint(ctx, f, state, b);
    const F = frameOf(b);
    const r = stackRead(state, f.id);
    const my = 24.5;
    if (f.size.h - my < 8) return;
    const rows = r.cards.map(c => { const t = cardTerms(c); return { lhs: t.lhs, rhs: t.rhs }; });
    if (r.empty) { ctx.fillStyle = '#100f0c'; ctx.fillRect(F.x(2), F.y(my), F.len(f.size.w - 4), F.len(f.size.h - my - 1.5)); return; }
    paintMachine(ctx, F, 2, my, f.size.w - 4, f.size.h - my - 1.5, rows, r.net, b.clock || 0);
  },
  live: () => true
});
