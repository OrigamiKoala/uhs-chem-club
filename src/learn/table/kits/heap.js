/**
 * kits/heap.js — The heap kit: atoms in piles too big to place by hand, and a maker that copies a recipe.
 *
 * THE ATOM KIT AT HEAP SCALE (Kettle `q1-recipe` and `boss-golem`, plan `bench-tabletop.md` §4). A bench of
 * molecules you can count becomes a floor of heaps you cannot: a heap is a CONTAINER whose contents are a
 * count of one kind of atom (`contents {hydrogen: 18}`), drawn as a pile of that many dots (the drawn table)
 * or one instanced body for the whole pile (the built table: one draw call per heap, however many atoms).
 * The pile is the count and nothing else: nothing prints it, a player counts it or lets the maker count it.
 *
 * THE KIT IS THE MASS KIT (which is the atom kit) with three things on top:
 *
 *   THE MAKER (fixture `maker`). The player builds ONE molecule by hand, exactly as `atoms.js` says (every join
 *   is `joinbench.js` `planJoin`), and drops it in the DOCK, a container. Pressing the maker's Run key makes
 *   one more of what stands in the dock: it takes from each heap as many atoms of that kind as the molecule in
 *   the dock holds (`countsOf` the cluster, so the recipe is whatever the player built, never a number a stage
 *   declares) and puts one finished molecule in the product container. A heap that cannot supply another
 *   refuses, and the refusal names the heap. Nothing here decides how many a heap makes: pressing until it
 *   refuses is the whole measurement, and `limitOf` is the pure arithmetic a stage's `check` and `verify:learn`
 *   hold the table to.
 *
 *   THE SHARE BAR (fixture `share`). A hundred equal parts laid end to end, and a marker (the `share` dial) the
 *   player sets where one element's part ends. It reads the dial and nothing else.
 *
 *   THE LEDGER (fixture `ledger`). The weight of each element in what stands on a pan, atom by atom from the
 *   listed masses (`mass.js` `listedMass`): the scale reads the whole pan and the ledger reads it by element.
 *
 * Everything a stage reads off the table is exported here (`dockRead`, `madeOf`, `heapLeft`, `tallyOf`,
 * `shareOf`, `panRead`, `ledgerOf`), derived from the pieces and the contents. NO JOIN, NO WEIGHT AND NO COUNT
 * IS AUTHORED: the weights are the listed masses, the joins are the planner, the counts are what the heaps hold.
 */

import { registerKit } from './registry.js';
import { MASS_KIT, listedMass } from './mass.js';
import { countsOf, formulaFrom, elementOf, isScratch, TABLE_BOUNDS, PARKED_RECORDER } from './atoms.js';
import { nameOf, zOf } from '../../engine/electrons.js';
import { TINTS } from '../../engine/scope.js';
import { PLATE_COLORS, plateText } from '../../engine/plates.js';
import { clusterOf, rectOf, SIZES } from '../snap.js';

export const HEAP_KIT_ID = 'heap';

const AMBER = PLATE_COLORS.amber;

/** The species name a heap of this element is filed under (`contents` key). */
export const speciesOf = sym => nameOf(sym);

/* ------------------------------------------------------------------
   THE PILE: where each atom of a heap lies (pure, shared by both views)
   ------------------------------------------------------------------ */

/** The most atoms a pile ever draws: past this a heap is a number, not a picture. */
export const PILE_MAX = 600;

const SLOTS = new Map();

/**
 * Where the first `cap` atoms of a pile lie inside a rectangle `w` x `h` (table units), as `{x, y, h}` from its
 * centre, nearest the middle first, and the radius of one. The positions depend on the CAPACITY and the
 * rectangle alone, never on how many atoms are left, so a heap that is drawn down loses its outermost atoms and
 * the rest stay where they were. `h` (0..1) is how high the mound stands there, for the built pile.
 */
export function pileSlots(cap, w, h) {
  const n = Math.max(1, Math.min(PILE_MAX, Math.round(cap)));
  const key = `${n}|${w}|${h}`;
  if (SLOTS.has(key)) return SLOTS.get(key);
  const inW = Math.max(1, w - 3);
  const inH = Math.max(1, h - 3);
  let d = Math.sqrt((inW * inH * 0.82) / n);
  let pts = [];
  for (let tries = 0; tries < 40; tries++) {
    pts = [];
    const rowH = d * 0.866;
    for (let row = 0, y = -inH / 2 + d / 2; y <= inH / 2 - d / 2 + 1e-9; row++, y += rowH) {
      for (let x = -inW / 2 + d / 2 + (row % 2 ? d / 2 : 0); x <= inW / 2 - d / 2 + 1e-9; x += d) pts.push({ x, y });
    }
    if (pts.length >= n) break;
    d *= 0.94;
  }
  const farthest = Math.max(1e-9, ...pts.map(p => Math.hypot(p.x / (inW / 2), p.y / (inH / 2))));
  const slots = pts
    .map((p, i) => ({ x: p.x, y: p.y, i, rr: Math.hypot(p.x / (inW / 2), p.y / (inH / 2)) / farthest }))
    .sort((a, b) => a.rr - b.rr || a.i - b.i)
    .slice(0, n)
    .map(p => ({ x: p.x, y: p.y, h: 1 - p.rr }));
  const out = { slots, r: d * 0.4 };
  SLOTS.set(key, out);
  return out;
}

/** The CSS colour of one atom of a heap: its element's own tint. */
function colourOf(c) {
  const pile = c.props?.pile;
  if (pile?.el) return TINTS[elementOf(pile.el).tint].fill;
  return PLATE_COLORS.phosphor;
}

/**
 * What a pile container shows: how many atoms (capped at what it can draw), where each lies, and its colour.
 * The drawn table paints these dots; the built table stands one instanced body per container on the same slots.
 * Null for a container that is not a pile.
 */
export function pileOf(c) {
  if (!c.props?.pile) return null;
  const total = Object.values(c.contents).reduce((a, b) => a + b, 0);
  const r = rectOf(c, SIZES.container);
  const cap = Math.max(c.capacity || 0, Math.ceil(total), 1);
  const { slots, r: dot } = pileSlots(cap, r.w, r.h);
  const n = Math.min(slots.length, Math.max(0, Math.round(total)));
  return { n, cap: slots.length, slots, r: dot, colour: colourOf(c), molecule: !c.props.pile.el, rect: r };
}

/* ------------------------------------------------------------------
   READINGS (pure; a stage's check reads these)
   ------------------------------------------------------------------ */

const live = p => p && !p.hidden && !isScratch(p);

/** The atoms standing in a container (`'container:dock'`), as records. */
export function atomsIn(state, zone) {
  return Object.values(state.pieces).filter(p => live(p) && p.kind === 'atom' && p.zone === zone);
}

/** The separate molecules among a list of atom ids, as sorted id lists (a lone atom is a cluster of one). */
function groups(state, ids) {
  const seen = new Set();
  const out = [];
  for (const id of ids) {
    if (seen.has(id)) continue;
    const c = clusterOf(state, id).filter(x => ids.includes(x));
    c.forEach(x => seen.add(x));
    out.push(c);
  }
  return out;
}

/**
 * What a dock holds: the atoms in it, the separate pieces they make, and when it is ONE molecule of two atoms
 * or more, its counts and its formula. `ok` is true exactly then; `why` is the maker's reason when it is not.
 */
export function dockRead(state, dockZone) {
  const ids = atomsIn(state, dockZone).map(p => p.id).sort();
  const parts = groups(state, ids);
  const base = { ids, parts, counts: {}, formula: null, ok: false, why: '' };
  if (!ids.length) return { ...base, why: 'The dock is empty. Put a molecule in it.' };
  if (parts.length > 1) return { ...base, why: 'The dock holds more than one piece. Keep one molecule in it.' };
  if (ids.length < 2) return { ...base, why: 'The dock holds one atom, not a molecule. Join atoms into a molecule first.' };
  const counts = countsOf(ids, state);
  return { ...base, counts, formula: formulaFrom(counts), ok: true };
}

/** How many of something a container holds (a heap's atoms, the product's molecules). */
export function heldIn(state, containerId, what = null) {
  const c = state.zones.containers[containerId];
  if (!c) return 0;
  return what == null ? Object.values(c.contents).reduce((a, b) => a + b, 0) : (c.contents[what] || 0);
}

/** Atoms of an element still in its heap. */
export function heapLeft(state, containerId, sym) {
  return heldIn(state, containerId, speciesOf(sym));
}

/** How many molecules the product container holds, of one formula or all together. */
export function madeOf(state, containerId, formula = null) {
  return heldIn(state, containerId, formula);
}

/** The count a tally dial is set to. */
export function tallyOf(state, fixtureId, dial = 'n') {
  return state.fixtures[fixtureId].dials[dial].value;
}

/** The marker of a share bar: parts out of a hundred. */
export function shareOf(state, fixtureId) {
  return state.fixtures[fixtureId].dials.share.value;
}

/**
 * What stands on a pan (`'container:pan'`): the atoms, the separate molecules (a lone atom is not one),
 * the counts by element and the weight, from the listed masses.
 */
export function panRead(state, panZone) {
  const ids = atomsIn(state, panZone).map(p => p.id).sort();
  const parts = groups(state, ids);
  const molecules = parts.filter(g => g.length > 1);
  const counts = countsOf(ids, state);
  const weight = Math.round(Object.entries(counts).reduce((m, [el, n]) => m + n * listedMass(el), 0) * 1e6) / 1e6;
  return { ids, parts, molecules, loose: parts.filter(g => g.length === 1).length, counts, weight };
}

/** The ledger's rows for a pan: each element on it, how many atoms and what they weigh, lightest first. */
export function ledgerOf(state, panZone) {
  const { counts } = panRead(state, panZone);
  return Object.keys(counts).sort((a, b) => zOf(a) - zOf(b)).map(sym => ({
    sym, name: nameOf(sym), n: counts[sym], weight: Math.round(counts[sym] * listedMass(sym) * 1e6) / 1e6
  }));
}

/**
 * The arithmetic of a recipe against heaps, for a stage's `check` and for `verify:learn`: how many whole
 * molecules `have` (atoms by element) can make of `need` (atoms by element per molecule), which element
 * gives out first (every one that ties), and what is left over. Pure.
 */
export function limitOf(have, need) {
  const per = Object.keys(need).map(el => [el, Math.floor((have[el] || 0) / need[el])]);
  const made = Math.min(...per.map(([, k]) => k));
  const limiting = per.filter(([, k]) => k === made).map(([el]) => el);
  const left = Object.fromEntries(Object.keys(need).map(el => [el, (have[el] || 0) - made * need[el]]));
  return { made, limiting, left };
}

/* ------------------------------------------------------------------
   RUNS
   ------------------------------------------------------------------ */

/** "Make": one more of what stands in the dock, taken from the heaps. The reducer moves the contents. */
function make(state, f) {
  const dock = dockRead(state, f.props.dock);
  if (!dock.ok) return { noop: dock.why };
  const contents = {};
  for (const [sym, n] of Object.entries(dock.counts)) {
    const heap = f.props.heaps?.[sym];
    if (!heap) return { noop: `No heap feeds ${nameOf(sym)}, so this maker cannot make that molecule.` };
    if (heapLeft(state, heap, sym) < n) {
      return { noop: `The ${nameOf(sym)} heap holds too few for another.` };
    }
    contents[heap] = { [speciesOf(sym)]: -n };
  }
  contents[f.props.product] = { [dock.formula]: 1 };
  return { contents };
}

/** "Weigh" with atoms on the pan: a row of molecules made against what the pan weighs, so a change shows. */
function weighAtoms(state, f) {
  const read = panRead(state, f.props.pan);
  if (!read.ids.length) return { noop: 'There is nothing on the scale to weigh.' };
  return { x: read.molecules.length, y: read.weight, label: `${read.molecules.length} made` };
}

function run(state, fixtureId) {
  const f = state.fixtures[fixtureId];
  if (f?.kind === 'maker') return make(state, f);
  if (f?.kind === 'scale' && f.props.atoms && !f.noRun) return weighAtoms(state, f);
  return MASS_KIT.run(state, fixtureId);
}

/* ------------------------------------------------------------------
   PAINTING
   ------------------------------------------------------------------ */

/**
 * A pile container, drawn flat: a dark bed and every atom of the heap as a dot. `o.bodies` leaves the dots to the
 * built table (which stands them up) and draws the bed alone. Returns false for a container that is not a pile.
 */
function paintContainer(ctx, c, state, o) {
  const p = pileOf(c);
  if (!p) return false;
  const { X, Y, sc } = o;
  const r = p.rect;
  ctx.fillStyle = '#16140f';
  ctx.fillRect(X(r.x0) + 1, Y(r.y0) + 1, r.w * sc - 2, r.h * sc - 2);
  if (o.bodies) return true;
  const rad = Math.max(0.9, p.r * sc);
  for (let i = 0; i < p.n; i++) {
    const s = p.slots[i];
    ctx.fillStyle = p.colour;
    ctx.beginPath();
    ctx.arc(X(c.at.x + s.x), Y(c.at.y + s.y), rad, 0, Math.PI * 2);
    ctx.fill();
    if (p.molecule) {
      ctx.strokeStyle = PLATE_COLORS.bg;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }
  return true;
}

function paintShare(ctx, f, state, b) {
  const sc = b.sc;
  const v = f.dials.share.value;
  const left = b.x0 + 3 * sc;
  const width = (b.x1 - b.x0) - 6 * sc;
  const top = b.y0 + 12 * sc;
  const height = Math.max(8, 5 * sc);
  const at = left + width * (v / 100);
  ctx.fillStyle = PLATE_COLORS.dim;
  ctx.fillRect(left, top, width, height);
  ctx.fillStyle = v > 0 ? PLATE_COLORS.dust : PLATE_COLORS.dim;
  ctx.fillRect(left, top, at - left, height);
  // A tick at every ten parts, so a hundred equal parts can be counted along.
  ctx.strokeStyle = PLATE_COLORS.bg;
  ctx.lineWidth = 1;
  for (let k = 1; k < 10; k++) {
    const x = Math.round(left + width * (k / 10)) + 0.5;
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x, top + height);
    ctx.stroke();
  }
  ctx.strokeStyle = PLATE_COLORS.steel;
  ctx.strokeRect(Math.round(left) + 0.5, Math.round(top) + 0.5, Math.round(width), Math.round(height));
  const size = Math.max(8, Math.round(2.3 * sc));
  if (f.props.left) plateText(ctx, f.props.left, left + 1.2 * sc, top + height + size * 1.15, { size, color: PLATE_COLORS.dust });
  if (f.props.right) plateText(ctx, f.props.right, left + width - 1.2 * sc, top + height + size * 1.15, { size, align: 'right', color: PLATE_COLORS.dust });
  plateText(ctx, `${v} OF 100`, b.x1 - 3 * sc, b.y0 + 3.6 * sc, { size, weight: 700, align: 'right', color: v > 0 ? AMBER : PLATE_COLORS.dim });
}

function paintLedger(ctx, f, state, b) {
  const sc = b.sc;
  const rows = ledgerOf(state, f.props.pan);
  const size = Math.max(8, Math.round(2.4 * sc));
  if (!rows.length) {
    plateText(ctx, 'nothing on the pan', b.x0 + 2 * sc, b.y0 + (b.y1 - b.y0) * 0.62, { size, color: PLATE_COLORS.dim });
    return;
  }
  const room = (b.y1 - b.y0) - 6 * sc;
  rows.forEach((r, i) => {
    const y = b.y0 + 6.6 * sc + (i + 0.55) * Math.min(size * 1.5, room / rows.length);
    plateText(ctx, `${r.name}`, b.x0 + 2 * sc, y, { size, color: PLATE_COLORS.dust });
    plateText(ctx, `${Number.isInteger(r.weight) ? `${r.weight}.0` : r.weight}`, b.x1 - 2 * sc, y, { size, weight: 700, align: 'right', color: PLATE_COLORS.text });
  });
}

function paintFixture(ctx, f, state, b) {
  if (f.kind === 'share') paintShare(ctx, f, state, b);
  else if (f.kind === 'ledger') paintLedger(ctx, f, state, b);
  else MASS_KIT.paintFixture(ctx, f, state, b);
}

/* ---- the tag: a small plate a heap is marked with ---- */

export const TAG_RECT = Object.freeze({ hw: 11, hh: 5.5 });

/** A tag's label on one line when it is short, else on two (split at the last space), fitted to the plate. */
function tagLines(label) {
  const t = String(label);
  const at = t.lastIndexOf(' ');
  return t.length <= 9 || at < 0 ? [t] : [t.slice(0, at), t.slice(at + 1)];
}

function paintTag(ctx, p, state, o) {
  const hw = TAG_RECT.hw * o.sc;
  const hh = TAG_RECT.hh * o.sc;
  ctx.fillStyle = '#2a2620';
  ctx.fillRect(o.x - hw, o.y - hh, hw * 2, hh * 2);
  ctx.strokeStyle = o.lit ? AMBER : PLATE_COLORS.dust;
  ctx.lineWidth = o.lit ? 2 : 1;
  ctx.strokeRect(o.x - hw + 0.5, o.y - hh + 0.5, hw * 2 - 1, hh * 2 - 1);
  ctx.lineWidth = 1;
  const lines = tagLines(p.label);
  const size = Math.max(7, Math.round(lines.length > 1 ? hh * 0.62 : hh * 0.8));
  lines.forEach((text, i) => {
    ctx.font = `700 ${size}px "JetBrains Mono", "Quantico", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = PLATE_COLORS.text;
    ctx.fillText(text, o.x, o.y + (i - (lines.length - 1) / 2) * size * 1.2, hw * 1.86);
  });
}

function paintPiece(ctx, p, state, o) {
  if (p.kind === 'tag') { paintTag(ctx, p, state, o); return true; }
  return MASS_KIT.paintPiece(ctx, p, state, o);
}

const printed = (p, state) => (p.kind === 'tag' ? tagLines(p.label)[0] : MASS_KIT.printed(p, state));
const faceKey = (p, state) => (p.kind === 'tag' ? String(p.label) : MASS_KIT.faceKey(p, state));

/* ------------------------------------------------------------------
   THE KIT
   ------------------------------------------------------------------ */

export const HEAP_KIT = {
  ...MASS_KIT,
  id: HEAP_KIT_ID,
  kinds: { ...MASS_KIT.kinds, tag: { r: 6, nojoin: true, rect: TAG_RECT } },
  run,
  paintFixture,
  paintContainer,
  paintPiece,
  printed,
  faceKey,
  pileOf
};

registerKit(HEAP_KIT);

/* ------------------------------------------------------------------
   TABLE FURNITURE
   ------------------------------------------------------------------ */

/** A kettle table is the atom tables' size (120 x 64): a piece is 28 px or more on a phone, and the scratch corner fits. */
export const HEAP_BOUNDS = TABLE_BOUNDS;

/** A stage's declaration with the heap kit's defaults: the kit, the atom tables' bounds, a parked recorder strip. */
export function heapTable(spec) {
  return { kit: HEAP_KIT_ID, bounds: { ...HEAP_BOUNDS }, tools: [], recorder: PARKED_RECORDER, ...spec };
}

/**
 * A heap: a container that is a pile of one element, `amount` atoms of it. Nothing pours from it (`still`): the
 * only things that draw on it are the maker and the player's eyes.
 */
export const heap = (id, label, sym, amount, at, size = { w: 26, h: 20 }) => ({
  id, label, at, size, capacity: amount, contents: { [speciesOf(sym)]: amount }, props: { still: true, pile: { el: sym }, sym }
});

/** The dock: a container for the one molecule a maker copies. */
export const dock = (id, label, at, size = { w: 30, h: 22 }) => ({ id, label, at, size, props: { still: true } });

/** The product container: a pile of finished molecules, up to `capacity` drawn. */
export const product = (id, label, at, capacity, size = { w: 36, h: 22 }) => ({
  id, label, at, size, capacity, props: { still: true, pile: { kind: 'molecule' } }
});

/** A pan for atoms: a container that holds what is weighed. */
export const pan = (id, label, at, size = { w: 40, h: 26 }) => ({ id, label, at, size, props: { still: true } });
