/**
 * kits/cards.js — The card kit: element cards and equation cards.
 *
 * A CARD IS A THING YOU LAY DOWN, TURN OVER, SCALE AND STACK. Two sorts share the kit:
 *
 *   ELEMENT CARD  (piece kind `element`, `props {sym}`). One per element. Everything on its
 *                 face is DERIVED, not authored: the proton count is the element's atomic number
 *                 (`electrons.js` `zOf`), the outer-shell dots come from `atoms.js` `shellsFor`,
 *                 what it does when pushed at a partner is `tradeOf` (read off `joinbench.js`
 *                 `shellPlan`). A stage may hand a card its mass (`props.mass`: measured on the
 *                 sampler scope, so it is data) and may withhold readings (`props.hide`:
 *                 `['z']` the proton count, `['mass']` the weight) or seal the whole card
 *                 (`props.sealed`: nothing is printed but a "?").
 *   EQUATION CARD (piece kind `equation`, `props {eq, dH}`). A reaction written
 *                 `C(s) + O₂(g) → CO₂(g)` with its enthalpy change. It can be turned over
 *                 (`flip`: the reaction runs the other way, so the sides swap and ΔH changes sign)
 *                 and scaled (`scale`: every amount and ΔH multiplied). T6's Ember `q5-hess` builds
 *                 on these.
 *
 * A STACK is the cards in one tray, in the order they were put there. `netOf(stack)` is the whole
 * idea of Hess's law done by hand: add the equations, cancel what appears on both sides, and what
 * is left is the reaction the stack makes, with ΔH from `thermodata.js` `hessStackEnthalpy` (the
 * planner the Ember bench already shares; there is no second sum). A `net` fixture prints the
 * cancelled equation under the stack. NOTHING HERE DECIDES WHAT A STAGE WANTS: it reads the pieces.
 *
 * STRIPS. A row of slots that share a `row` (table spec) is a strip: a card dropped on a filled
 * slot pushes the row along, by `engine/catalogue.js` `fileCard`, the catalogue board's own pure
 * rule (`model.js` `fileIntoRow`). A rail (drag a card into the gap you want) is the other strip.
 *
 * Both views draw the same faces: `paintPiece` is called by the drawn table and, onto a canvas,
 * by the built table's card (`kinds.x.rect` tells it the card is a rectangle and not a puck).
 */

import { registerKit } from './registry.js';
import { zOf, nameOf } from '../../engine/electrons.js';
import { shellPlan } from '../../engine/joinbench.js';
import { hessStackEnthalpy } from '../../engine/thermodata.js';
import { PLATE_COLORS, plateText } from '../../engine/plates.js';
import { shellsFor } from './atoms.js';

export const CARDS_KIT_ID = 'cards';

const AMBER = PLATE_COLORS.amber;

/* ------------------------------------------------------------------
   ELEMENT CARDS
   ------------------------------------------------------------------ */

/** Half the width and height of an element card, in table units, and its grab radius. */
export const ELEMENT_RECT = Object.freeze({ hw: 6.2, hh: 6.2 });
export const ELEMENT_R = 6.3;
/** An equation card is a wide one. */
export const EQUATION_RECT = Object.freeze({ hw: 11, hh: 5.6 });
export const EQUATION_R = 7;

/**
 * What an atom does when another is pushed at it, from its outer shell alone: a full shell trades
 * nothing; one to three outer electrons are handed over; four are held on to; five or more are
 * pulled on. Hydrogen is the one atom that is neither: it shares. (The join bench draws the same
 * line between a metal and a nonmetal; this is the tester's model of a single card.)
 */
export function tradeOf(sym) {
  const z = zOf(sym);
  if (z < 1) throw new Error(`cards kit: "${sym}" is not an element`);
  if (sym === 'H') return 'shares';
  const shells = shellsFor(z);
  const plan = shellPlan({ shells });
  if (plan.full) return 'inert';
  if (plan.outer <= 3) return 'gives';
  if (plan.outer === 4) return 'shares';
  return 'takes';
}

/** Everything an element card shows or grades on, derived from its element. */
export function elementView(piece) {
  const sym = piece.props.sym;
  const z = zOf(sym);
  if (z < 1) throw new Error(`cards kit: "${sym}" is not an element`);
  const shells = shellsFor(z);
  return {
    sym, z, name: nameOf(sym), shells, outer: shells[shells.length - 1],
    trade: tradeOf(sym), mass: piece.props.mass ?? null,
    hide: piece.props.hide || [], sealed: Boolean(piece.props.sealed)
  };
}

/** The spec of an element card, ready to spread into a stage's `pieces`. */
export function elementCard(id, sym, at, props = {}) {
  return { id, kind: 'element', label: nameOf(sym).toUpperCase(), at, props: { sym, ...props } };
}

/** What a tested card reads, as the face prints it. */
const TESTED_TEXT = { gives: 'gives one', takes: 'takes one', shares: 'holds on', inert: 'no trade' };

/* ------------------------------------------------------------------
   EQUATION CARDS AND STACKS
   ------------------------------------------------------------------ */

const FRACTIONS = { '½': 0.5, '¼': 0.25, '¾': 0.75, '⅓': 1 / 3, '⅔': 2 / 3 };
const round = v => Math.round(v * 1e6) / 1e6;

/** One side of an equation as `{species: amount}`. Amounts add if a species is written twice. */
function parseSide(text) {
  const out = {};
  for (const raw of String(text).split(/\s\+\s/)) {
    const term = raw.trim();
    if (!term) continue;
    const m = term.match(/^(\d+\/\d+|\d*\.?\d+|[½¼¾⅓⅔])?\s*(.+)$/);
    let n = 1;
    if (m[1]) n = FRACTIONS[m[1]] ?? (m[1].includes('/') ? Number(m[1].split('/')[0]) / Number(m[1].split('/')[1]) : Number(m[1]));
    out[m[2].trim()] = round((out[m[2].trim()] || 0) + n);
  }
  return out;
}

/** `'C(s) + O₂(g) → CO₂(g)'` as `{reactants, products}`. */
export function parseEquation(text) {
  const [left, right] = String(text).split(/\s*(?:→|->)\s*/);
  if (right === undefined) throw new Error(`cards kit: "${text}" is not an equation`);
  return { reactants: parseSide(left), products: parseSide(right) };
}

const num = n => (Number.isInteger(n) ? String(n) : (n === 0.5 ? '½' : n === 0.25 ? '¼' : n === 0.75 ? '¾' : String(round(n))));
const sideText = side => Object.entries(side).map(([sp, n]) => (n === 1 ? sp : (Number.isInteger(n) ? `${n} ${sp}` : `${num(n)}${sp}`))).join(' + ');

/** `{reactants, products}` back to text. */
export function equationText(eq) {
  return `${sideText(eq.reactants) || '∅'} → ${sideText(eq.products) || '∅'}`;
}

/** A card as it reads now: flipped swaps the sides and the sign, scaled multiplies both. */
export function cardView(piece) {
  const base = parseEquation(piece.props.eq);
  const flip = Boolean(piece.props.flipped);
  const mult = piece.props.scale || 1;
  const times = side => Object.fromEntries(Object.entries(side).map(([k, n]) => [k, round(n * mult)]));
  const reactants = times(flip ? base.products : base.reactants);
  const products = times(flip ? base.reactants : base.products);
  return { reactants, products, flip, mult, dH: hessStackEnthalpy([{ dH: piece.props.dH, flip, mult }]) };
}

/**
 * The reaction a stack of equation cards makes: every card added (reactants against products, as
 * Hess's law has it), what stands on both sides cancelled, and the sum of the ΔH. `stack` is a list
 * of equation cards (pieces), in any order. `dH` is `hessStackEnthalpy`'s own sum.
 *
 * @returns {{reactants: object, products: object, species: object, dH: number, text: string, cancelled: string[]}}
 */
export function netOf(stack) {
  const net = {};
  const seen = new Set();
  const steps = [];
  for (const card of stack) {
    if (card.kind && card.kind !== 'equation') continue;
    const v = cardView(card);
    for (const [sp, n] of Object.entries(v.reactants)) { net[sp] = round((net[sp] || 0) - n); seen.add(sp); }
    for (const [sp, n] of Object.entries(v.products)) { net[sp] = round((net[sp] || 0) + n); seen.add(sp); }
    steps.push({ dH: card.props.dH, flip: v.flip, mult: v.mult });
  }
  const reactants = {};
  const products = {};
  const cancelled = [];
  for (const sp of seen) {
    if (net[sp] < 0) reactants[sp] = -net[sp];
    else if (net[sp] > 0) products[sp] = net[sp];
    else cancelled.push(sp);
  }
  const eq = { reactants, products };
  return { ...eq, species: net, dH: round(hessStackEnthalpy(steps)), text: equationText(eq), cancelled };
}

/** Do two reactions say the same thing, species for species and amount for amount? */
export function sameReaction(a, b) {
  const side = (x, y) => {
    const ks = new Set([...Object.keys(x), ...Object.keys(y)]);
    for (const k of ks) if (Math.abs((x[k] || 0) - (y[k] || 0)) > 1e-6) return false;
    return true;
  };
  return side(a.reactants, b.reactants) && side(a.products, b.products);
}

/** The equation cards standing in a zone (`'tray:stack'`), in the order they were put there. */
export function stackOf(state, zone) {
  return Object.values(state.pieces).filter(p => !p.hidden && p.kind === 'equation' && p.zone === zone);
}

/** The net reaction of the cards in a zone. */
export function stackNet(state, zone) { return netOf(stackOf(state, zone)); }

/* ------------------------------------------------------------------
   READINGS A STAGE GRADES ON
   ------------------------------------------------------------------ */

/** The pieces standing in a zone (`'tray:one'`, `'slot:gap'`), optionally of one kind. */
export function piecesIn(state, zone, kind = null) {
  return Object.values(state.pieces).filter(p => !p.hidden && p.zone === zone && (!kind || p.kind === kind));
}

/** The card (piece id) standing in a slot, or null. */
export function slotCard(state, slotId) {
  const p = piecesIn(state, `slot:${slotId}`)[0];
  return p ? p.id : null;
}

/** The rail's arrangement, left to right, as piece ids. */
export function railOrder(state) { return state.zones.rail ? state.zones.rail.order.slice() : []; }

/** The trade a tested card shows ('gives', 'takes', 'shares', 'inert'), or null if it has not been tested. */
export function testedOf(piece) { return piece.props.tested || null; }

/* ------------------------------------------------------------------
   PAINTING (the drawn table and the built table's cards call the same functions)
   ------------------------------------------------------------------ */

function frame(ctx, x0, y0, w, h, fill, lit) {
  ctx.fillStyle = fill;
  ctx.fillRect(x0, y0, w, h);
  ctx.strokeStyle = lit ? AMBER : PLATE_COLORS.dust;
  ctx.lineWidth = lit ? 2 : 1;
  ctx.strokeRect(x0 + 0.5, y0 + 0.5, w - 1, h - 1);
  ctx.lineWidth = 1;
}

function paintElement(ctx, p, state, o) {
  const v = elementView(p);
  const hw = ELEMENT_RECT.hw * o.sc;
  const hh = ELEMENT_RECT.hh * o.sc;
  const x0 = o.x - hw;
  const y0 = o.y - hh;
  const w = hw * 2;
  const h = hh * 2;
  frame(ctx, x0, y0, w, h, v.sealed ? '#16140f' : '#2a2620', o.lit);
  const roomy = w >= 54;
  const mid = o.x;

  if (v.sealed) {
    plateText(ctx, '?', mid, y0 + h * 0.46, { size: Math.max(12, Math.round(h * 0.5)), weight: 700, align: 'center', base: 'middle', color: PLATE_COLORS.dust });
    if (roomy) plateText(ctx, 'unmeasured', mid, y0 + h * 0.82, { size: Math.max(6, Math.round(h * 0.11)), align: 'center', base: 'middle', color: PLATE_COLORS.dim });
    return;
  }

  // The outer-shell electrons, one dot each, along the top edge.
  if (!v.hide.includes('outer')) {
    const n = v.outer;
    const gap = Math.min(w * 0.095, h * 0.12);
    ctx.fillStyle = PLATE_COLORS.phosphor;
    for (let i = 0; i < n; i++) {
      ctx.beginPath();
      ctx.arc(mid + (i - (n - 1) / 2) * gap, y0 + h * 0.1, Math.max(1.2, Math.min(gap * 0.36, h * 0.045)), 0, Math.PI * 2);
      ctx.fill();
    }
  }
  plateText(ctx, v.sym, mid, y0 + h * 0.36, { size: Math.max(10, Math.round(h * 0.3)), weight: 700, align: 'center', base: 'middle', color: PLATE_COLORS.text });
  const tested = p.props.tested;
  if (tested) {
    plateText(ctx, TESTED_TEXT[tested] || '', mid, y0 + h * 0.58, { size: Math.max(7, Math.round(h * (roomy ? 0.12 : 0.13))), weight: 700, align: 'center', base: 'middle', color: AMBER });
  } else if (roomy) {
    plateText(ctx, v.name.toUpperCase(), mid, y0 + h * 0.58, { size: Math.max(6, Math.round(h * 0.108)), align: 'center', base: 'middle', color: PLATE_COLORS.dust });
  }
  if (!v.hide.includes('z')) {
    plateText(ctx, roomy ? `${v.z} protons` : `${v.z}p`, mid, y0 + h * 0.76, { size: Math.max(8, Math.round(h * (roomy ? 0.14 : 0.19))), weight: 700, align: 'center', base: 'middle', color: PLATE_COLORS.dust });
  }
  if (roomy && v.mass != null && !v.hide.includes('mass')) {
    plateText(ctx, `mass ${v.mass.toFixed(1)}`, mid, y0 + h * 0.91, { size: Math.max(6, Math.round(h * 0.1)), align: 'center', base: 'middle', color: PLATE_COLORS.steel });
  }
}

/** A line of text squeezed to fit `maxW` pixels (a card has only so much room). */
function fitted(ctx, text, x, y, maxW, o) {
  ctx.font = `${o.weight || 500} ${o.size}px "JetBrains Mono", "Quantico", monospace`;
  ctx.textAlign = o.align || 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = o.color || PLATE_COLORS.text;
  ctx.fillText(text, x, y, maxW);
}

const signed = n => (n === 0 ? '0' : `${n > 0 ? '+' : '−'}${Math.abs(round(n))}`);

function paintEquation(ctx, p, state, o) {
  const v = cardView(p);
  const hw = EQUATION_RECT.hw * o.sc;
  const hh = EQUATION_RECT.hh * o.sc;
  const x0 = o.x - hw;
  const y0 = o.y - hh;
  const w = hw * 2;
  const h = hh * 2;
  frame(ctx, x0, y0, w, h, v.flip ? '#1d1b17' : '#2a2620', o.lit);
  const size = Math.max(7, Math.round(h * 0.2));
  fitted(ctx, equationText(v), o.x, y0 + h * 0.34, w * 0.94, { size, color: v.flip ? PLATE_COLORS.dust : PLATE_COLORS.text });
  fitted(ctx, `ΔH ${signed(v.dH)} kJ`, o.x, y0 + h * 0.7, w * 0.94, { size: Math.max(7, Math.round(h * 0.19)), weight: 700, color: AMBER });
  const badge = [v.flip ? 'turned' : '', v.mult > 1 ? `x${v.mult}` : ''].filter(Boolean).join(' ');
  if (badge) fitted(ctx, badge, x0 + w - 3, y0 + h * 0.12, w * 0.4, { size: Math.max(6, Math.round(h * 0.14)), align: 'right', color: PLATE_COLORS.dim });
}

const PAINTERS = { element: paintElement, equation: paintEquation };

function paintPiece(ctx, p, state, o) {
  const fn = PAINTERS[p.kind];
  if (!fn) return false;
  fn(ctx, p, state, o);
  return true;
}

/** What a piece prints on its face, so a test can tell it was drawn. */
function printed(p, state) {
  if (p.kind === 'element') return p.props.sealed ? '?' : p.props.sym;
  if (p.kind === 'equation') return equationText(cardView(p));
  return String(p.label);
}

function faceKey(p) {
  if (p.kind === 'element') return `${p.props.sym}|${p.props.sealed ? 1 : 0}|${(p.props.hide || []).join()}|${p.props.mass ?? ''}|${p.props.tested || ''}`;
  if (p.kind === 'equation') return `${p.props.eq}|${p.props.dH}|${p.props.flipped ? 1 : 0}|${p.props.scale || 1}`;
  return '';
}

/* ---- fixtures ---- */

/** The cancelled equation under a stack: `props {zone, hideDH?}`. */
function paintNet(ctx, f, state, b) {
  const net = stackNet(state, f.props.zone);
  const h = b.y1 - b.y0;
  const w = b.x1 - b.x0;
  const size = Math.max(8, Math.round(h * 0.22));
  const none = !stackOf(state, f.props.zone).length;
  fitted(ctx, none ? 'nothing on the stack' : net.text, b.x0 + w / 2, b.y0 + h * 0.52, w * 0.94, { size, color: none ? PLATE_COLORS.dim : PLATE_COLORS.text });
  if (!f.props.hideDH && !none) fitted(ctx, `ΔH ${signed(net.dH)} kJ`, b.x0 + w / 2, b.y0 + h * 0.8, w * 0.94, { size, weight: 700, color: AMBER });
}

function paintFixture(ctx, f, state, b) {
  if (f.kind === 'net') paintNet(ctx, f, state, b);
}

/**
 * The tester: a card standing in its slot is pushed at a partner, and what it does is written on it.
 * A sealed card has not been measured, so there is nothing to read (the kit says so, and nothing
 * is stamped).
 */
function run(state, fixtureId) {
  const f = state.fixtures[fixtureId];
  if (f?.kind !== 'tester') return null;
  const held = piecesIn(state, `slot:${f.props.slot}`, 'element')[0];
  if (!held || held.props.sealed) return null;
  return { stamp: { [held.id]: { tested: tradeOf(held.props.sym) } } };
}

export const CARDS_KIT = {
  id: CARDS_KIT_ID,
  maxScale: 4,
  kinds: {
    element: { r: ELEMENT_R, nojoin: true, rect: ELEMENT_RECT },
    equation: { r: EQUATION_R, nojoin: true, rect: EQUATION_RECT, flip: true, scale: true }
  },
  planJoin: () => ({ holds: false, reason: 'Cards are laid down, not joined.' }),
  run,
  paintPiece,
  printed,
  faceKey,
  paintFixture
};

registerKit(CARDS_KIT);

/* ------------------------------------------------------------------
   TABLE FURNITURE
   ------------------------------------------------------------------ */

/** A card table is wider than the atom kit's: an 18-card chart needs nine columns. */
export const CARD_BOUNDS = Object.freeze({ w: 150, h: 64 });
/** Where the paper strip parks on a card table that never prints on it. */
export const CARD_RECORDER = Object.freeze({ at: { x: 148, y: 62 }, size: { w: 4, h: 3 } });

/** A stage's declaration with the card kit's defaults: the kit, the bounds, a parked recorder strip. */
export function cardTable(spec) {
  return { kit: CARDS_KIT_ID, bounds: { ...CARD_BOUNDS }, tools: [], recorder: CARD_RECORDER, ...spec };
}

/** A slot sized for a card, optionally part of a strip (`row`). */
export function cardSlot(id, at, { label = '', row = null } = {}) {
  return { id, label, at, size: { w: 13.4, h: 13.4 }, ...(row ? { row } : {}) };
}

/** A tray sized for cards laid in a row, `cols` across and `rows` deep, at the cards' own pitch. */
export function cardTray(id, label, at, cols = 4, rows = 1, pitch = 15) {
  return { id, label, at, size: { w: cols * pitch, h: rows * pitch }, cell: pitch };
}
