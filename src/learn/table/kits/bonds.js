/**
 * kits/bonds.js — The bonds kit: blocks on a bench, a lattice grid, a pair pulled apart by hand, salts.
 *
 * LIGAR'S BONDING BENCHES, WORKED WITH THE HANDS (plan `bench-tabletop.md`, T3a). Bench two
 * (`q2-lattice`) holds blocks of material and asks what each does when it is struck, heated and put in a
 * circuit; bench three (`q3-distance`) pulls two atoms apart and keeps the energy at every separation the
 * hand passed through. The kit is the atom kit with these on top (an `atom`, an `ion` and the Lewis slate
 * work exactly as `atoms.js` says), and it is a thin wrapper over the planners the old instruments shared:
 * `joinbench.js` `planSlab` / `conductionOf` for a block, `bonddata.js` `PAIRS` / `morse` / `planCurve` /
 * `LATTICES` / `IONS` for a pair and a salt. Nothing here decides what a stage wants, and no outcome is
 * authored: every reading is derived from where the pieces are and where the dials stand.
 *
 * A BLOCK (piece `slab`, `props.slab` its declaration: `build`, `melt`, `tint`, `sealed`, `cluster`, `groups`).
 *   - The HOTPLATE (fixture `hotplate`, one dial `heat`) is a region of the table. A block stands ON it when
 *     it lies on open table with its middle inside the plate; the dial is the plate's temperature. A block is
 *     MOLTEN exactly while it stands on a plate at or past its melting point, so lifting it off cools it, and
 *     turning the dial down does the same. Nothing is stored: the temperature a block gives way at is found
 *     by turning the dial.
 *   - The HAMMER (tool piece), laid on a block, is a blow: it writes `struck` on the block. What a blow does
 *     is the old bench's own mapping from the build (`strikeOf`): a grid cleaves flat, clusters crumble,
 *     a metal bends, a network holds.
 *   - The LEADS (tool piece) clip across the block they lie on. Their lamp is lit while the block, in the state
 *     it is in right now, passes a current (`conductionOf`): derived, so heating the block lights it or darkens it.
 *   - The TONGS (tool piece), laid on a block, take hold of an atom near its middle, and what comes out with
 *     it is everything bonded to it (`liftOf`, the connected group in `planSlab`'s links). The tongs keep a log
 *     of every lift (`props.lifts`) and the block shows what has been lifted out of it.
 *
 * THE LATTICE GRID (fixture `lattice`, its cells are `slot` zones, ions are `ion` pieces). A grid is whatever
 * the hand makes of it. "Slide a Layer" (the fixture's Run key) shifts the top row one place along; the kit
 * reads the new contacts and the ions that now face a like charge print the stencilled `!`.
 *
 * A PAIR PULLED APART (fixture `wells`). One or more pairs from `bonddata.PAIRS` share one plot of energy
 * against separation. A pair's separation is a dial, the hand on the pair; the curve is drawn only over the
 * stretch the hand has been through (`kit.dialed` keeps `{lo, hi}`), so the bottom is a place the player
 * finds. A `marker` dial draws a level line across the plot for a stage that asks for a depth. A stage's
 * Run key may release a pair: it settles at the bottom of its own well.
 *
 * SALTS (piece `salt`, `props.lattice` a `LATTICES` id): two ions drawn to scale and touching, with their
 * charges and the distance between their centres printed. On a hotplate a salt is molten past its melting point.
 *
 * PAIR TAGS (piece `pairtag`, `props.pair` a `PAIRS` id): a card with a pair's atoms and the rods between them.
 */

import { registerKit } from './registry.js';
import { ATOMS_KIT } from './atoms.js';
import { planSlab, conductionOf, TINTS } from '../../engine/joinbench.js';
import { PAIRS, IONS, LATTICES, DISC_RADIUS, morse, planCurve, energySpan, centresOf } from '../../engine/bonddata.js';
import { PLATE_COLORS, plateText, lampMark, mulberry32, hashId } from '../../engine/plates.js';
import { SIZES, rectOf } from '../snap.js';
import { fixtureLayout } from '../layout.js';
import {
  LIGAR_SKIN, buildOreBlock, buildSaltSpecimen, buildPairTag, buildHammer, buildLeads, buildTongs, ligarDeck
} from '../../engine/ligar-props.js';

export const BONDS_KIT_ID = 'bonds';
const AMBER = PLATE_COLORS.amber;

/* ------------------------------------------------------------------
   SIZES
   ------------------------------------------------------------------ */

export const SLAB_RECT = Object.freeze({ hw: 10.5, hh: 8 });
export const SALT_RECT = Object.freeze({ hw: 11, hh: 8 });
export const PAIRTAG_RECT = Object.freeze({ hw: 9, hh: 6.2 });
/** A guess card (Ligar's predict stages): wide enough for three short lines. */
export const GUESS_RECT = Object.freeze({ hw: 14, hh: 8 });
const SLAB_R = 8.5;
const TOOL_R = 6.5;

/** A bonds table is the card table's size: a hotplate, trays and a row of blocks need the width. */
export const BONDS_BOUNDS = Object.freeze({ w: 150, h: 72 });
/** Where the paper strip parks on a table that never prints on it. */
export const BONDS_RECORDER = Object.freeze({ at: { x: 147, y: 69.8 }, size: { w: 6, h: 4.4 } });

const live = p => p && !p.hidden;
const round1 = v => Math.round(v * 10) / 10;
const inRect = (r, p) => p.x >= r.x0 && p.x <= r.x1 && p.y >= r.y0 && p.y <= r.y1;

/* ------------------------------------------------------------------
   THE HOTPLATE
   ------------------------------------------------------------------ */

/** The header of a hotplate fixture (its name and its dial) in table units; the plate is the rest of the box. */
export const HOTPLATE_HEADER = 14;

/** The hot area of a `hotplate` fixture: its box below the header. */
export function plateArea(f) {
  const r = rectOf(f, SIZES.fixture);
  return { x0: r.x0 + 1, x1: r.x1 - 1, y0: r.y0 + (f.props.header ?? HOTPLATE_HEADER), y1: r.y1 - 1 };
}

/** The plate a piece stands on, and how hot it is, or null: on open table with its middle inside a plate. */
export function hotplateUnder(p, state) {
  if (!live(p) || p.zone) return null;
  for (const f of Object.values(state.fixtures)) {
    if (f.kind !== 'hotplate') continue;
    if (inRect(plateArea(f), p.at)) return { fixture: f.id, temp: f.dials.heat.value };
  }
  return null;
}

/* ------------------------------------------------------------------
   A BLOCK
   ------------------------------------------------------------------ */

/** The declaration `planSlab` reads. The piece's id seeds the packing, so a block is the same picture every time. */
export const declOf = p => ({ id: p.id, ...p.props.slab });

/** What a blow does to each build: the old join bench's own mapping, and nothing else. */
export function strikeOf(build, alloy = null) {
  if (build === 'metallic' && alloy === 'int') return 'held';
  if (build === 'metallic' && alloy === 'sub') return 'dented';
  return build === 'web' ? 'held' : build === 'metallic' ? 'bent' : build === 'grid' ? 'cleaved' : 'crumbled';
}

/**
 * Everything a block shows right now, derived: where it stands, the phase it is in (`intact`, `struck`,
 * `molten`), whether a current passes (null when no leads are clipped on), what has been lifted from it.
 */
export function slabView(p, state) {
  const d = declOf(p);
  const plate = hotplateUnder(p, state);
  const molten = Boolean(plate) && plate.temp >= d.melt;
  const struck = Boolean(p.props.struck);
  const phase = molten ? 'molten' : (struck && d.build !== 'web' && d.alloy !== 'int' ? 'struck' : 'intact');
  const leads = p.joinedTo.map(id => state.pieces[id]).find(o => o?.kind === 'leads') || null;
  return {
    d, plate, temp: plate ? plate.temp : null, molten, struck, phase,
    blow: struck ? strikeOf(d.build, d.alloy) : null,
    leads: Boolean(leads),
    current: leads ? conductionOf(d, molten) : null,
    lifted: p.props.lifted || []
  };
}

/** Every slab piece on the table. */
export const slabs = state => Object.values(state.pieces).filter(p => p.kind === 'slab' && live(p));

/**
 * What the tongs bring out of a block, from its declaration alone: the connected group round the atom nearest
 * the middle of what is left, in the links `planSlab` gives it in `phase`. `cells` are the indices; `of` is how
 * many atoms the block still holds; `whole` is true when everything left came out together. `gone` are the
 * cells already lifted.
 */
export function liftCells(decl, phase, gone = []) {
  const lay = planSlab(decl, phase);
  const out = new Set(gone);
  const left = lay.cells.map((c, i) => i).filter(i => !out.has(i));
  if (!left.length) return null;
  const adj = new Map(left.map(i => [i, []]));
  for (const [a, b] of lay.links) if (adj.has(a) && adj.has(b)) { adj.get(a).push(b); adj.get(b).push(a); }
  const near = left.slice().sort((a, b) => Math.hypot(lay.cells[a].x - 0.5, lay.cells[a].y - 0.5) - Math.hypot(lay.cells[b].x - 0.5, lay.cells[b].y - 0.5) || a - b)[0];
  const seen = new Set([near]);
  const queue = [near];
  while (queue.length) for (const n of adj.get(queue.pop())) if (!seen.has(n)) { seen.add(n); queue.push(n); }
  const cells = [...seen].sort((a, b) => a - b);
  return { cells, n: cells.length, of: left.length, whole: cells.length === left.length };
}

/** What the tongs do to this block as it stands: a lift, or the reason there is none. */
export function liftOf(p, state) {
  const v = slabView(p, state);
  if (v.d.sealed) return { refused: 'The case is welded shut, so the tongs have nothing to grip.' };
  if (v.molten) return { refused: 'It has run to a puddle, and the tongs close on nothing.' };
  return liftCells(v.d, v.phase, v.lifted) || { refused: 'There is nothing left in the block to lift.' };
}

/** The sizes of the separate groups a block is made of, as it stands whole (`planSlab` intact): one group for a grid, a web or a metal. */
export function groupsOf(decl) {
  const lay = planSlab(decl, 'intact');
  if (!lay.cells.length) return [];
  const adj = lay.cells.map(() => []);
  for (const [a, b] of lay.links) { adj[a].push(b); adj[b].push(a); }
  const seen = new Set();
  const sizes = [];
  lay.cells.forEach((c, i) => {
    if (seen.has(i)) return;
    let n = 0;
    const queue = [i];
    seen.add(i);
    while (queue.length) { const cur = queue.pop(); n++; for (const m of adj[cur]) if (!seen.has(m)) { seen.add(m); queue.push(m); } }
    sizes.push(n);
  });
  return sizes.sort((a, b) => a - b);
}

/** The fewest atoms still bonded together in any piece of a block, through a blow and through the melt: a molecule's size, or the whole block's. */
export function smallestPiece(decl) {
  let least = Infinity;
  for (const phase of ['intact', 'struck', 'molten']) {
    const lay = planSlab(decl, phase);
    if (!lay.cells.length) continue;
    const adj = lay.cells.map(() => []);
    for (const [a, b] of lay.links) { adj[a].push(b); adj[b].push(a); }
    const seen = new Set();
    lay.cells.forEach((c, i) => {
      if (seen.has(i)) return;
      let n = 0;
      const queue = [i];
      seen.add(i);
      while (queue.length) { const cur = queue.pop(); n++; for (const m of adj[cur]) if (!seen.has(m)) { seen.add(m); queue.push(m); } }
      least = Math.min(least, n);
    });
  }
  return least === Infinity ? 0 : least;
}

/** The lifts the tongs have made, oldest first: `[{slab, n, of, whole}]`. */
export const liftsOf = tongs => (tongs?.props.lifts || []).slice();

/* ------------------------------------------------------------------
   A SALT
   ------------------------------------------------------------------ */

export function saltView(p, state) {
  const lat = LATTICES[p.props.lattice];
  const plate = hotplateUnder(p, state);
  const molten = Boolean(plate) && plate.temp >= lat.melts;
  return {
    lat, plate, molten,
    cation: { ...IONS[lat.cation] }, anion: { ...IONS[lat.anion] },
    centres: centresOf(lat)
  };
}

/* ------------------------------------------------------------------
   THE LATTICE GRID
   ------------------------------------------------------------------ */

const ionIn = (state, slotId) => Object.values(state.pieces).find(p => p.kind === 'ion' && live(p) && p.zone === `slot:${slotId}`) || null;
const signOf = p => Math.sign(p.props.charge || 0);

/**
 * What a `lattice` fixture holds: how many cells are filled, how many neighbouring pairs are alike and unlike
 * (across and down), and, once its layer has been slid, which ions now face a like charge. `layer` is the row
 * that slides; it slides one place along, so the ion that was in column c stands under column c + 1.
 */
export function gridRead(state, fixtureId) {
  const f = state.fixtures[fixtureId];
  const rows = f.props.cells.map(r => r.map(id => ionIn(state, id)));
  const layer = f.props.layer ?? 0;
  let filled = 0;
  let like = 0;
  let unlike = 0;
  const pair = (a, b) => { if (!a || !b) return; if (signOf(a) === signOf(b)) like++; else unlike++; };
  rows.forEach((row, r) => row.forEach((p, c) => {
    if (p) filled++;
    pair(p, row[c + 1]);
    pair(p, rows[r + 1]?.[c]);
  }));
  const slid = Boolean(rows[layer]?.some(p => p?.props.slid));
  const facing = [];
  if (slid) {
    const below = rows[layer + 1] || [];
    rows[layer].forEach((p, c) => {
      const q = below[c + 1];
      if (p && q && signOf(p) === signOf(q)) facing.push(p.id, q.id);
    });
  }
  return {
    rows: rows.length, cols: rows[0]?.length || 0, filled, total: rows.reduce((n, r) => n + r.length, 0),
    like, unlike, slid, facing: new Set(facing), faced: facing.length / 2
  };
}

/* ------------------------------------------------------------------
   THE WELLS
   ------------------------------------------------------------------ */

/**
 * The pair fixture's rows as the hand has left them: `{id, pair, label, gap, energy, state, lo, hi, r0, de}`.
 * `lo` and `hi` are the stretch of separations the hand has been through (the curve is drawn over it).
 */
export function wellRead(state, fixtureId) {
  const f = state.fixtures[fixtureId];
  const rows = f.props.rows.map(row => {
    const gap = f.dials[row.id].value;
    const t = f.props.trace?.[row.id] || { lo: row.start ?? gap, hi: row.start ?? gap };
    const pair = PAIRS[row.pair];
    const c = planCurve(pair, gap);
    return { id: row.id, pair: row.pair, label: row.label, gap, energy: c.energy, state: c.state, lo: t.lo, hi: t.hi, r0: pair.r0, de: pair.de, order: pair.order };
  });
  const marker = f.props.marker ? f.dials[f.props.marker].value : null;
  return { rows, marker, row: id => rows.find(r => r.id === id) };
}

/** The separation at which a pair's energy returns to zero from inside the bottom (where squeezing climbs back to the parted level). */
export function innerZero(pairId) {
  const p = PAIRS[pairId];
  return round1(p.r0 - Math.log(2) / p.k);
}

function dialed(state, f, dialName) {
  if (f.kind !== 'wells') return null;
  const row = f.props.rows.find(r => r.id === dialName);
  if (!row) return null;
  const v = f.dials[dialName].value;
  const t = f.props.trace?.[dialName] || { lo: row.start ?? v, hi: row.start ?? v };
  return { props: { trace: { ...(f.props.trace || {}), [dialName]: { lo: Math.min(t.lo, v), hi: Math.max(t.hi, v) } } } };
}

/* ------------------------------------------------------------------
   RUNS
   ------------------------------------------------------------------ */

/** "Slide a Layer": the top row of the grid goes one place along, or comes back. */
function slide(state, f) {
  const g = gridRead(state, f.id);
  const layer = f.props.layer ?? 0;
  const row = f.props.cells[layer].map(id => ionIn(state, id)).filter(Boolean);
  const below = (f.props.cells[layer + 1] || []).map(id => ionIn(state, id)).filter(Boolean);
  if (!row.length || !below.length) return { noop: 'Put ions in the top two rows before sliding a layer.' };
  const to = !g.slid;
  return { stamp: Object.fromEntries(row.map(p => [p.id, { slid: to }])) };
}

/** "Let go" on a pair: it settles at the bottom of its own well. */
function release(state, f) {
  const id = f.props.release;
  const row = f.props.rows.find(r => r.id === id);
  if (!row) return null;
  return { dials: { [f.id]: { [id]: PAIRS[row.pair].r0 } } };
}

function run(state, fixtureId) {
  const f = state.fixtures[fixtureId];
  if (f?.kind === 'lattice') return slide(state, f);
  if (f?.kind === 'wells') return release(state, f);
  return ATOMS_KIT.run(state, fixtureId);
}

/* ------------------------------------------------------------------
   JOINS: THE TOOLS
   ------------------------------------------------------------------ */

const BLOCK_TOOLS = new Set(['hammer', 'leads', 'tongs']);
const INERT = new Set(['slab', 'salt', 'pairtag']);

function planJoin(a, b, state) {
  if (BLOCK_TOOLS.has(a.kind)) {
    if (b.kind !== 'slab') return { holds: false, home: true, reason: 'That goes on a block.' };
    const v = slabView(b, state);
    if (a.kind === 'leads') return { holds: true, link: { tool: 'leads' }, rest: { x: 7, y: -5.5 }, reason: 'The leads clip across the block.' };
    if (a.kind === 'hammer') {
      if (v.molten) return { holds: false, home: true, reason: 'There is nothing solid left to hit.' };
      return { holds: true, once: true, set: { b: { struck: true } }, reason: 'The hammer comes down on the block.' };
    }
    const lift = liftOf(b, state);
    if (lift.refused) return { holds: false, home: true, reason: lift.refused };
    return {
      holds: true, once: true,
      set: {
        a: { lifts: [...(a.props.lifts || []), { slab: b.id, n: lift.n, of: lift.of, whole: lift.whole }] },
        b: { lifted: [...(b.props.lifted || []), ...lift.cells] }
      },
      reason: 'The tongs close on an atom and lift.'
    };
  }
  return ATOMS_KIT.planJoin(a, b, state);
}

/** A block set beside a block is just set down; a tool laid on a block is the only thing that does anything to it. */
function pairable(me, o) {
  if (INERT.has(me.kind) || INERT.has(o.kind)) return BLOCK_TOOLS.has(me.kind) && o.kind === 'slab';
  return true;
}

/* ------------------------------------------------------------------
   PAINTING (the drawn table and the built table's faces call the same functions)
   ------------------------------------------------------------------ */

function frame(ctx, x0, y0, w, h, fill, lit) {
  ctx.fillStyle = fill;
  ctx.fillRect(x0, y0, w, h);
  ctx.strokeStyle = lit ? AMBER : PLATE_COLORS.dust;
  ctx.lineWidth = lit ? 2 : 1;
  ctx.strokeRect(x0 + 0.5, y0 + 0.5, w - 1, h - 1);
  ctx.lineWidth = 1;
}

function fitted(ctx, text, x, y, maxW, o) {
  ctx.font = `${o.weight || 500} ${o.size}px "JetBrains Mono", "Quantico", monospace`;
  ctx.textAlign = o.align || 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = o.color || PLATE_COLORS.text;
  ctx.fillText(text, x, y, maxW);
}

function disc(ctx, x, y, r, tint, stroke) {
  ctx.fillStyle = tint.fill;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = stroke || tint.rim;
  ctx.lineWidth = 1;
  ctx.stroke();
}

/** A stencilled plus or minus, drawn on a disc (never told by colour alone). */
function sign(ctx, x, y, r, s) {
  ctx.strokeStyle = '#0d0c0a';
  ctx.lineWidth = Math.max(1, r * 0.26);
  ctx.beginPath();
  ctx.moveTo(x - r * 0.48, y);
  ctx.lineTo(x + r * 0.48, y);
  if (s > 0) { ctx.moveTo(x, y - r * 0.48); ctx.lineTo(x, y + r * 0.48); }
  ctx.stroke();
}

/**
 * The picture of a block, from `planSlab`: its pieces and the joins between them, in a box. The same layout
 * the old bench drew, so what is drawn is what is graded. A case hides what is inside (a hatched mass).
 */
export function paintSlabPicture(ctx, decl, phase, box, lifted = []) {
  const { x0, y0, w, h } = box;
  const lay = planSlab(decl, phase);
  ctx.fillStyle = '#0d0c0a';
  ctx.fillRect(x0, y0, w, h);
  if (lay.sealed) {
    ctx.strokeStyle = 'rgba(184, 175, 160, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    // Diagonal hatching, each line cut to the box (a case is a closed thing: nothing is drawn past its edge).
    for (let a = x0 - h; a < x0 + w; a += Math.max(5, h * 0.22)) {
      const sx = Math.max(a, x0);
      const sy = y0 + h - Math.max(0, x0 - a);
      const ex = Math.min(a + h, x0 + w);
      const ey = y0 + h - (ex - a);
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
    }
    ctx.stroke();
    ctx.strokeStyle = PLATE_COLORS.steel;
    ctx.strokeRect(x0 + 0.5, y0 + 0.5, w - 1, h - 1);
    return;
  }
  const pad = Math.max(2, Math.min(w, h) * 0.07);
  const cols = decl.cols || (decl.build === 'grid' ? 7 : 6);
  const rows = decl.rows || 5;
  const r = Math.max(1.4, Math.min((w - pad * 2) / (cols * 2.7), (h - pad * 2) / (rows * 2.7)));
  const px = c => x0 + pad + c.x * (w - pad * 2);
  const py = c => y0 + pad + c.y * (h - pad * 2);
  const gone = new Set(lifted);
  ctx.strokeStyle = 'rgba(184, 175, 160, 0.3)';
  ctx.lineWidth = Math.max(0.8, r * 0.3);
  ctx.beginPath();
  for (const [i, j] of lay.links) {
    if (gone.has(i) || gone.has(j)) continue;
    ctx.moveTo(px(lay.cells[i]), py(lay.cells[i]));
    ctx.lineTo(px(lay.cells[j]), py(lay.cells[j]));
  }
  ctx.stroke();
  const tint = TINTS[decl.tint] || TINTS.bone;
  lay.cells.forEach((c, i) => {
    const x = px(c);
    const y = py(c);
    if (gone.has(i)) {
      // Where an atom was lifted out: an empty ring.
      ctx.strokeStyle = PLATE_COLORS.dim;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.stroke();
      return;
    }
    disc(ctx, x, y, r * (c.size || 1), c.tint ? (TINTS[c.tint] || tint) : tint);
    if (c.sign) sign(ctx, x, y, r, c.sign);
  });
  // A metal's outer electrons are not held by one atom: a loose scatter of them runs between the ions, one per ion.
  if (decl.build === 'metallic') {
    const ions = lay.cells.filter(c => c.sign > 0);
    ctx.fillStyle = PLATE_COLORS.phosphor;
    ions.forEach((c, i) => {
      const a = ((i * 2654435761) % 997) / 997 * Math.PI * 2;
      const d = r * 1.55;
      const ex = Math.min(x0 + w - 1, Math.max(x0 + 1, px(c) + Math.cos(a) * d));
      const ey = Math.min(y0 + h - 1, Math.max(y0 + 1, py(c) + Math.sin(a) * d));
      ctx.beginPath();
      ctx.arc(ex, ey, Math.max(1, r * 0.3), 0, Math.PI * 2);
      ctx.fill();
    });
  }
}

const BLOW_WORD = { cleaved: 'SPLIT', crumbled: 'CRUMBLED', bent: 'BENT', dented: 'DENTED', held: 'HELD' };

function paintSlab(ctx, p, state, o) {
  const v = slabView(p, state);
  const hw = SLAB_RECT.hw * o.sc;
  const hh = SLAB_RECT.hh * o.sc;
  const x0 = o.x - hw;
  const y0 = o.y - hh;
  const w = hw * 2;
  const h = hh * 2;
  frame(ctx, x0, y0, w, h, '#2a2620', o.lit);
  const picH = h * 0.72;
  paintSlabPicture(ctx, v.d, v.phase, { x0: x0 + 1.5, y0: y0 + 1.5, w: w - 3, h: picH - 1.5 }, v.lifted);
  // The lamp the leads light: a ring in the corner, filled while a current passes. A mark, never a glow.
  if (v.leads) {
    const lr = Math.max(2.5, h * 0.09);
    ctx.strokeStyle = v.current ? PLATE_COLORS.phosphor : PLATE_COLORS.dim;
    ctx.fillStyle = PLATE_COLORS.phosphor;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(x0 + w - lr * 1.8, y0 + lr * 1.8, lr, 0, Math.PI * 2);
    if (v.current) ctx.fill();
    ctx.stroke();
  }
  const size = Math.max(6, Math.round(h * 0.12));
  fitted(ctx, p.label, x0 + 3, y0 + h * 0.86, w * 0.5, { size, weight: 700, align: 'left', color: PLATE_COLORS.text });
  const status = v.molten ? 'MOLTEN' : v.blow ? BLOW_WORD[v.blow] : 'SOLID';
  fitted(ctx, status, x0 + w - 3, y0 + h * 0.86, w * 0.5, { size, align: 'right', color: v.molten ? AMBER : PLATE_COLORS.dust });
}

function paintSalt(ctx, p, state, o) {
  const v = saltView(p, state);
  const hw = SALT_RECT.hw * o.sc;
  const hh = SALT_RECT.hh * o.sc;
  const x0 = o.x - hw;
  const y0 = o.y - hh;
  const w = hw * 2;
  const h = hh * 2;
  frame(ctx, x0, y0, w, h, '#2a2620', o.lit);
  const picH = h * 0.62;
  const cy = y0 + picH * 0.52;
  const tintOf = sym => TINTS[{ Na: 'pale', K: 'pale', Mg: 'bone', F: 'sand', Cl: 'sand', O: 'rust' }[sym] || 'bone'];
  // Two ions to the same scale, touching: the distance between their centres is the sum of their radii.
  const k = Math.min((w * 0.86) / (v.cation.radius + v.anion.radius) / 1, (picH * 0.92) / (2 * Math.max(v.cation.radius, v.anion.radius)));
  if (v.molten) {
    const rand = mulberry32(hashId(p.id) ^ 0x51);
    for (let i = 0; i < 8; i++) {
      const cat = i % 2 === 0;
      const ion = cat ? v.cation : v.anion;
      const rr = ion.radius * k * 0.4;
      disc(ctx, x0 + w * 0.2 + rand() * w * 0.6, y0 + picH * 0.25 + rand() * picH * 0.5, rr, tintOf(ion.sym));
    }
  } else {
    const cr = v.cation.radius * k;
    const ar = v.anion.radius * k;
    const left = o.x - (cr + ar);
    const cx = left + cr;
    const ax = cx + cr + ar;
    disc(ctx, cx, cy, cr, tintOf(v.cation.sym));
    sign(ctx, cx, cy, Math.max(cr, 3), 1);
    disc(ctx, ax, cy, ar, tintOf(v.anion.sym));
    sign(ctx, ax, cy, Math.max(ar, 3), -1);
    // The charges, written in the corners: a 2 where an ion carries two.
    const mark = ion => `${Math.abs(ion.charge)}${ion.charge > 0 ? '+' : '−'}`;
    fitted(ctx, mark(v.cation), x0 + 3, y0 + h * 0.12, w * 0.3, { size: Math.max(6, Math.round(h * 0.13)), weight: 700, align: 'left', color: AMBER });
    fitted(ctx, mark(v.anion), x0 + w - 3, y0 + h * 0.12, w * 0.3, { size: Math.max(6, Math.round(h * 0.13)), weight: 700, align: 'right', color: AMBER });
  }
  const size = Math.max(7, Math.round(h * 0.15));
  fitted(ctx, p.label, o.x, y0 + h * 0.71, w * 0.9, { size: Math.max(7, Math.round(h * 0.18)), weight: 700, color: PLATE_COLORS.text });
  fitted(ctx, v.molten ? 'MOLTEN' : `centres ${v.centres} pm`, o.x, y0 + h * 0.89, w * 0.92, { size, color: v.molten ? AMBER : PLATE_COLORS.dust });
}

/** A mini pair: two discs to the same scale joined by as many rods as the pair shares. */
function miniPair(ctx, pairId, cx, cy, k) {
  const p = PAIRS[pairId];
  const ra = DISC_RADIUS[p.a] * k;
  const rb = DISC_RADIUS[p.b] * k;
  // The two atoms stand a little apart, so the rods between them (one for each shared pair) can be counted.
  const half = (ra + rb) * 0.68;
  const ax = cx - half;
  const bx = cx + half;
  ctx.strokeStyle = PLATE_COLORS.dust;
  ctx.lineWidth = Math.max(1, Math.min(ra, rb) * 0.22);
  for (let i = 0; i < p.order; i++) {
    const off = (i - (p.order - 1) / 2) * Math.max(2, Math.min(ra, rb) * 0.5);
    ctx.beginPath();
    ctx.moveTo(ax, cy + off);
    ctx.lineTo(bx, cy + off);
    ctx.stroke();
  }
  const tint = sym => TINTS[{ H: 'bone', C: 'iron', N: 'pale', O: 'rust', F: 'sand', Cl: 'sand' }[sym] || 'bone'];
  disc(ctx, ax, cy, ra, tint(p.a));
  disc(ctx, bx, cy, rb, tint(p.b));
}

function paintPairTag(ctx, p, state, o) {
  const hw = PAIRTAG_RECT.hw * o.sc;
  const hh = PAIRTAG_RECT.hh * o.sc;
  const x0 = o.x - hw;
  const y0 = o.y - hh;
  const w = hw * 2;
  const h = hh * 2;
  frame(ctx, x0, y0, w, h, '#2a2620', o.lit);
  fitted(ctx, p.label, o.x, y0 + h * 0.22, w * 0.92, { size: Math.max(7, Math.round(h * 0.26)), weight: 700, color: PLATE_COLORS.text });
  miniPair(ctx, p.props.pair, o.x, y0 + h * 0.66, Math.min((w * 0.74) / (2 * 76 + 20), (h * 0.5) / 2 / 76 * 0.95) * (p.props.scaleUp || 1));
}

function paintLeads(ctx, p, state, o) {
  const slabId = p.joinedTo.find(id => state.pieces[id]?.kind === 'slab');
  const v = slabId ? slabView(state.pieces[slabId], state) : null;
  ctx.fillStyle = PLATE_COLORS.steel;
  ctx.beginPath();
  ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = o.lit ? AMBER : PLATE_COLORS.dust;
  ctx.lineWidth = o.lit ? 2 : 1;
  ctx.stroke();
  // Two clips, and the lamp between them: filled while a current passes.
  ctx.strokeStyle = '#16140f';
  ctx.lineWidth = Math.max(1.4, o.r * 0.12);
  ctx.beginPath();
  ctx.moveTo(o.x - o.r * 0.58, o.y - o.r * 0.12); ctx.lineTo(o.x - o.r * 0.58, o.y - o.r * 0.62);
  ctx.moveTo(o.x + o.r * 0.58, o.y - o.r * 0.12); ctx.lineTo(o.x + o.r * 0.58, o.y - o.r * 0.62);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(o.x, o.y - o.r * 0.34, o.r * 0.22, 0, Math.PI * 2);
  if (v?.current) { ctx.fillStyle = PLATE_COLORS.phosphor; ctx.fill(); }
  ctx.stroke();
  plateText(ctx, p.label, o.x, o.y + o.r * 0.5, { size: Math.max(7, Math.round(o.r * 0.36)), weight: 700, align: 'center', base: 'middle', color: '#16140f' });
}

function paintBlockTool(ctx, p, state, o) {
  ctx.fillStyle = PLATE_COLORS.steel;
  ctx.beginPath();
  ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = o.lit ? AMBER : PLATE_COLORS.dust;
  ctx.lineWidth = o.lit ? 2 : 1;
  ctx.stroke();
  ctx.strokeStyle = '#16140f';
  ctx.fillStyle = '#16140f';
  ctx.lineWidth = Math.max(1.5, o.r * 0.14);
  if (p.kind === 'hammer') {
    ctx.beginPath();
    ctx.moveTo(o.x - o.r * 0.1, o.y - o.r * 0.06); ctx.lineTo(o.x + o.r * 0.42, o.y - o.r * 0.7);
    ctx.stroke();
    ctx.fillRect(o.x - o.r * 0.6, o.y - o.r * 0.3, o.r * 0.7, o.r * 0.3);
  } else {
    // Tongs: two arms crossed above a pivot, the jaws closing at the foot.
    ctx.beginPath();
    ctx.moveTo(o.x - o.r * 0.45, o.y - o.r * 0.66); ctx.lineTo(o.x + o.r * 0.15, o.y - o.r * 0.04); ctx.lineTo(o.x + o.r * 0.28, o.y + 0.02 * o.r);
    ctx.moveTo(o.x + o.r * 0.45, o.y - o.r * 0.66); ctx.lineTo(o.x - o.r * 0.15, o.y - o.r * 0.04); ctx.lineTo(o.x - o.r * 0.28, o.y + 0.02 * o.r);
    ctx.stroke();
    const held = (p.props.lifts || []).length;
    if (held) {
      const last = p.props.lifts[held - 1];
      plateText(ctx, String(last.n), o.x, o.y - o.r * 0.34, { size: Math.max(8, Math.round(o.r * 0.5)), weight: 700, align: 'center', base: 'middle', color: AMBER });
    }
  }
  plateText(ctx, p.label, o.x, o.y + o.r * 0.58, { size: Math.max(7, Math.round(o.r * 0.36)), weight: 700, align: 'center', base: 'middle', color: '#16140f' });
}

/**
 * LIGAR: A GUESS CARD (piece kind `guess`). A prediction is a card laid in a slot on a bench that holds no instrument (`engine/predict.js`),
 * and it is a few plain words on a plate, not a picture: `props.lines` is the wording split across at most three lines. It is never graded.
 */
function paintGuess(ctx, p, state, o) {
  const hw = GUESS_RECT.hw * o.sc;
  const hh = GUESS_RECT.hh * o.sc;
  const x0 = o.x - hw;
  const y0 = o.y - hh;
  frame(ctx, x0, y0, hw * 2, hh * 2, '#2a2620', o.lit);
  const lines = (p.props.lines && p.props.lines.length ? p.props.lines : [p.label]).slice(0, 3);
  const size = Math.max(7, Math.round(hh * (lines.length > 2 ? 0.27 : 0.32)));
  lines.forEach((text, i) => {
    fitted(ctx, text, o.x, y0 + hh * 2 * ((i + 0.5) / lines.length), hw * 1.8, { size, weight: i === 0 ? 700 : 500, color: i === 0 ? PLATE_COLORS.text : PLATE_COLORS.dust });
  });
}

const PAINTERS = {
  slab: paintSlab, salt: paintSalt, pairtag: paintPairTag, leads: paintLeads, hammer: paintBlockTool, tongs: paintBlockTool, guess: paintGuess
};

function paintPiece(ctx, p, state, o) {
  const fn = PAINTERS[p.kind];
  if (fn) { fn(ctx, p, state, o); return true; }
  const drawn = ATOMS_KIT.paintPiece(ctx, p, state, o);
  // An ion that now faces a like charge wears an alert ring and stencilled `!`.
  if (drawn && p.kind === 'ion') {
    const f = Object.values(state.fixtures).find(x => x.kind === 'lattice');
    if (f && gridRead(state, f.id).facing.has(p.id)) {
      ctx.strokeStyle = AMBER;
      ctx.lineWidth = Math.max(1.5, o.r * 0.14);
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.r * 0.92, 0, Math.PI * 2);
      ctx.stroke();
      lampMark(ctx, o.x + o.r * 0.62, o.y - o.r * 0.62, Math.max(8, o.r * 0.75));
    }
  }
  return drawn;
}

function printed(p, state) {
  // A guess card prints its wording across lines: the first line is what a test looks for.
  if (p.kind === 'guess') return String(p.props.lines?.[0] || p.label);
  if (PAINTERS[p.kind]) return String(p.label);
  return ATOMS_KIT.printed(p, state);
}

function faceKey(p, state) {
  switch (p.kind) {
    case 'slab': {
      const v = slabView(p, state);
      return `${p.label}|${v.phase}|${v.blow || ''}|${v.current === null ? '-' : v.current ? 1 : 0}|${v.lifted.length}`;
    }
    case 'salt': return `${p.label}|${saltView(p, state).molten ? 1 : 0}`;
    case 'pairtag': return p.label;
    case 'leads': {
      const slabId = p.joinedTo.find(id => state.pieces[id]?.kind === 'slab');
      const v = slabId ? slabView(state.pieces[slabId], state) : null;
      return `${v?.current ? 1 : 0}`;
    }
    case 'tongs': return `${(p.props.lifts || []).length}|${(p.props.lifts || []).slice(-1)[0]?.n ?? ''}`;
    case 'hammer': return '';
    case 'ion': {
      const f = Object.values(state.fixtures).find(x => x.kind === 'lattice');
      return `${ATOMS_KIT.faceKey(p, state)}|${f && gridRead(state, f.id).facing.has(p.id) ? 1 : 0}`;
    }
    default: return ATOMS_KIT.faceKey(p, state);
  }
}

/* ---- fixtures ---- */

/** A hotplate: the plate under the blocks, ruled with its coil. */
function paintHotplate(ctx, f, state, b) {
  const a = plateArea(f);
  const x0 = b.X(a.x0);
  const y0 = b.Y(a.y0);
  const x1 = b.X(a.x1);
  const y1 = b.Y(a.y1);
  ctx.fillStyle = '#16140f';
  ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  ctx.strokeStyle = f.dials.heat.value > 0 ? PLATE_COLORS.steel : PLATE_COLORS.rim;
  ctx.lineWidth = 1;
  // The coil: a few turns across the plate, steel when cold and dust once the plate is hot.
  const turns = 9;
  ctx.strokeStyle = f.dials.heat.value > 0 ? PLATE_COLORS.dust : PLATE_COLORS.dim;
  ctx.beginPath();
  for (let i = 0; i <= turns; i++) {
    const y = y0 + ((y1 - y0) * (i + 0.5)) / (turns + 1);
    ctx.moveTo(x0 + 4, y);
    ctx.lineTo(x1 - 4, y);
  }
  ctx.stroke();
  ctx.strokeStyle = PLATE_COLORS.steel;
  ctx.strokeRect(Math.round(x0) + 0.5, Math.round(y0) + 0.5, Math.round(x1 - x0), Math.round(y1 - y0));
}

/** The grid board: what it holds, in words and on the crystal lattice. */
function paintLattice(ctx, f, state, b) {
  const g = gridRead(state, f.id);
  const sc = b.sc;
  const X = b.X;
  const Y = b.Y;
  const size = Math.max(7, Math.round(2.1 * sc));
  const subSize = Math.max(6, Math.round(1.6 * sc));

  const cells = f.props.cells || [];
  const layer = f.props.layer ?? 0;

  if (!g.slid) {
    // Intact lattice: draw electrostatic attraction bonds between opposite charges
    ctx.lineWidth = Math.max(1.5, sc * 0.16);
    for (let r = 0; r < cells.length; r++) {
      for (let c = 0; c < cells[r].length; c++) {
        const p = ionIn(state, cells[r][c]);
        if (!p) continue;
        const pSign = signOf(p);

        if (c + 1 < cells[r].length) {
          const q = ionIn(state, cells[r][c + 1]);
          if (q) {
            const qSign = signOf(q);
            const pAt = state.pieces[p.id]?.at || p.at;
            const qAt = state.pieces[q.id]?.at || q.at;
            ctx.strokeStyle = pSign !== qSign ? 'rgba(90, 118, 142, 0.45)' : 'rgba(229, 155, 36, 0.7)';
            ctx.beginPath();
            ctx.moveTo(X(pAt.x), Y(pAt.y));
            ctx.lineTo(X(qAt.x), Y(qAt.y));
            ctx.stroke();
          }
        }
        if (r + 1 < cells.length) {
          const q = ionIn(state, cells[r + 1][c]);
          if (q) {
            const qSign = signOf(q);
            const pAt = state.pieces[p.id]?.at || p.at;
            const qAt = state.pieces[q.id]?.at || q.at;
            ctx.strokeStyle = pSign !== qSign ? 'rgba(90, 118, 142, 0.45)' : 'rgba(229, 155, 36, 0.7)';
            ctx.beginPath();
            ctx.moveTo(X(pAt.x), Y(pAt.y));
            ctx.lineTo(X(qAt.x), Y(qAt.y));
            ctx.stroke();
          }
        }
      }
    }
    ctx.lineWidth = 1;
  } else {
    // Slid state: draw the cleavage fracture plane and vertical repulsion indicators
    const yCleave = 19;
    const row0 = cells[layer] || [];
    const row1 = cells[layer + 1] || [];
    const sFirst = state.zones.slots[row0[0]];
    const sLast = state.zones.slots[row0[row0.length - 1]];
    const xStart = sFirst ? sFirst.at.x - 7 : 78;
    const xEnd = sLast ? sLast.at.x + 14 + 7 : 148;

    ctx.strokeStyle = AMBER;
    ctx.lineWidth = Math.max(1.8, sc * 0.2);
    ctx.setLineDash?.([5, 3]);
    ctx.beginPath();
    ctx.moveTo(X(xStart), Y(yCleave));
    ctx.lineTo(X(xEnd), Y(yCleave));
    ctx.stroke();
    ctx.setLineDash?.([]);

    plateText(ctx, 'CLEAVAGE PLANE', (X(xStart) + X(xEnd)) / 2, Y(yCleave) - 2.6 * sc, {
      size: subSize, weight: 700, align: 'center', color: AMBER
    });

    row0.forEach((id0, c) => {
      const p = ionIn(state, id0);
      const q = ionIn(state, row1[c + 1]);
      if (p && q && signOf(p) === signOf(q)) {
        const slotQ = state.zones.slots[row1[c + 1]];
        const xPos = slotQ ? slotQ.at.x : 85 + (c + 1) * 14;
        ctx.strokeStyle = AMBER;
        ctx.lineWidth = Math.max(1.4, sc * 0.16);
        ctx.beginPath();
        ctx.moveTo(X(xPos), Y(15.2));
        ctx.lineTo(X(xPos), Y(13.2));
        ctx.moveTo(X(xPos - 1.2), Y(14.2));
        ctx.lineTo(X(xPos), Y(13.2));
        ctx.lineTo(X(xPos + 1.2), Y(14.2));
        ctx.moveTo(X(xPos), Y(22.8));
        ctx.lineTo(X(xPos), Y(24.8));
        ctx.moveTo(X(xPos - 1.2), Y(23.8));
        ctx.lineTo(X(xPos), Y(24.8));
        ctx.lineTo(X(xPos + 1.2), Y(23.8));
        ctx.stroke();
      }
    });
    ctx.lineWidth = 1;
  }

  // Plate readout: two informative lines
  let l1 = '';
  let l2 = '';
  let c1 = PLATE_COLORS.dust;
  let c2 = PLATE_COLORS.dim;

  if (g.slid) {
    l1 = `${g.faced} like charges align and repel`;
    l2 = 'Repulsion cleaves the crystal';
    c1 = AMBER;
    c2 = AMBER;
  } else if (g.like > 0) {
    l1 = `${g.like} like charges touch`;
    l2 = 'Like charges repel: alternate charges';
    c1 = AMBER;
    c2 = PLATE_COLORS.dust;
  } else if (g.filled === g.total) {
    l1 = 'Lattice complete: all ions stable';
    l2 = 'Press "Slide a Layer" to test cleavage';
    c1 = AMBER;
    c2 = PLATE_COLORS.dust;
  } else if (g.filled > 0) {
    l1 = `${g.filled} of ${g.total} ions placed`;
    l2 = 'Alternate positive and negative charges';
    c1 = PLATE_COLORS.dust;
    c2 = PLATE_COLORS.dim;
  } else {
    l1 = '0 of 12 ions placed';
    l2 = 'Pack alternating charges into grid';
    c1 = PLATE_COLORS.dust;
    c2 = PLATE_COLORS.dim;
  }

  plateText(ctx, l1, b.x0 + 1.5 * sc, b.y0 + 5.8 * sc, { size, weight: 700, color: c1 });
  plateText(ctx, l2, b.x0 + 1.5 * sc, b.y0 + 10.2 * sc, { size: subSize, weight: 500, color: c2 });
}

/**
 * The wells: one plot of energy against separation, a curve over the stretch each hand has been through,
 * a mark where each pair stands now, and (on a single pair) the two atoms drawn to scale on the track.
 */
export function wellPlot(f) {
  const lay = (f.props.plot || {});
  const r = rectOf(f, SIZES.fixture);
  const rows = f.props.rows.length;
  const pitch = f.props.rowPitch ?? 5;
  const top = r.y0 + (f.props.top ?? 8);
  const y0 = r.y0 + (lay.y0 ?? (top - r.y0 + (rows - 1) * pitch + (f.props.discs ? (f.props.discsBelow ?? 8) : 3)));
  return { x0: r.x0 + (lay.x0 ?? 2), x1: r.x1 - 2, y0, y1: r.y1 - (lay.foot ?? 5), r };
}

const DASHES = [[], [5, 3], [1.5, 2.5]];

function paintWells(ctx, f, state, b) {
  const read = wellRead(state, f.id);
  const P = wellPlot(f);
  const dmax = f.dials[f.props.rows[0].id].max;
  const spans = read.rows.map(row => energySpan(PAIRS[row.pair]));
  const lo = Math.min(...spans.map(s => s.lo));
  const hi = Math.max(...spans.map(s => s.hi));
  const X = d => b.X(P.x0 + (d / dmax) * (P.x1 - P.x0));
  const Y = e => b.Y(P.y0 + ((hi - e) / (hi - lo)) * (P.y1 - P.y0));
  const size = Math.max(7, Math.round(2.1 * b.sc));
  // Axes: the zero line (parted), the separation ticks, the frame.
  ctx.strokeStyle = PLATE_COLORS.rim;
  ctx.lineWidth = 1;
  ctx.strokeRect(Math.round(b.X(P.x0)) + 0.5, Math.round(b.Y(P.y0)) + 0.5, Math.round(b.X(P.x1) - b.X(P.x0)), Math.round(b.Y(P.y1) - b.Y(P.y0)));
  ctx.strokeStyle = PLATE_COLORS.dim;
  ctx.setLineDash?.([3, 3]);
  ctx.beginPath();
  ctx.moveTo(b.X(P.x0), Y(0)); ctx.lineTo(b.X(P.x1), Y(0));
  ctx.stroke();
  ctx.setLineDash?.([]);
  plateText(ctx, '0', b.X(P.x0) - 2, Y(0), { size, align: 'right', base: 'middle', color: PLATE_COLORS.dim });
  const runKey = fixtureLayout(f).run;
  for (let d = 0; d <= dmax; d += 100) {
    // A tick's number leaves the Run key's corner alone.
    if (!runKey || X(d) < b.X(runKey.x0) - size * 2) plateText(ctx, String(d), X(d), b.Y(P.y1) + size * 1.15, { size, align: 'center', color: PLATE_COLORS.dim });
    ctx.strokeStyle = PLATE_COLORS.dim;
    ctx.beginPath();
    ctx.moveTo(X(d), b.Y(P.y1)); ctx.lineTo(X(d), b.Y(P.y1) + 2);
    ctx.stroke();
  }
  plateText(ctx, 'pm apart', b.X(P.x0) + 2, b.Y(P.y1) + size * 2.3, { size, color: PLATE_COLORS.dim });
  plateText(ctx, 'kJ/mol', b.X(P.x0) + 2, b.Y(P.y0) + size * 1.1, { size, color: PLATE_COLORS.dim });

  // The curves, over the stretch each hand has passed through.
  read.rows.forEach((row, i) => {
    const pair = PAIRS[row.pair];
    ctx.strokeStyle = PLATE_COLORS.text;
    ctx.lineWidth = 1.6;
    ctx.setLineDash?.(DASHES[i % DASHES.length]);
    ctx.beginPath();
    let started = false;
    const a = Math.max(1, Math.round(row.lo));
    const z = Math.round(row.hi);
    // The part of the curve above the plot (the nuclei pressing together) is left off the edge, not drawn flat along it.
    for (let d = a; d <= z; d += 1) {
      const e = morse(pair, d);
      if (e > hi) { started = false; continue; }
      const x = X(d);
      const y = Y(e);
      if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.setLineDash?.([]);
    // `props.components`: the two things the curve is made of, drawn over the same stretch. The Morse curve is exactly their sum:
    // the pull of the nuclei for the electrons (negative, long reach) plus the push of nucleus against nucleus and cloud against cloud (positive, short reach).
    if (f.props.components) {
      const parts = [
        { name: 'pull', color: PLATE_COLORS.phosphor, at: z => -2 * pair.de * Math.exp(-pair.k * (z - pair.r0)) },
        { name: 'push', color: PLATE_COLORS.dust, at: z => pair.de * Math.exp(-2 * pair.k * (z - pair.r0)) }
      ];
      for (const part of parts) {
        ctx.strokeStyle = part.color;
        ctx.lineWidth = 1.2;
        ctx.setLineDash?.([2, 3]);
        ctx.beginPath();
        let begun = false;
        let lastX = null;
        let lastY = null;
        for (let d = a; d <= z; d += 1) {
          const e = part.at(d);
          if (e > hi || e < lo) { begun = false; continue; }
          const x = X(d);
          const y = Y(e);
          if (!begun) { ctx.moveTo(x, y); begun = true; } else ctx.lineTo(x, y);
          lastX = x; lastY = y;
        }
        ctx.stroke();
        ctx.setLineDash?.([]);
        if (lastX != null) plateText(ctx, part.name, lastX + 2, lastY + (part.name === 'pull' ? size * 0.9 : -size * 0.4), { size, color: part.color });
      }
    }
    // Where the hand has the pair now: a small square on the curve, and the reading.
    const e = Math.min(hi, morse(pair, row.gap));
    ctx.fillStyle = AMBER;
    ctx.fillRect(X(row.gap) - 2.5, Y(e) - 2.5, 5, 5);
    const ty = b.Y(P.y0) + size * (1.1 + i * 1.2);
    plateText(ctx, `${row.label} ${row.gap} pm  ${row.energy > 0 ? '+' : row.energy < 0 ? '−' : ''}${Math.abs(row.energy).toFixed(1)}`, b.X(P.x1) - 2, ty, { size, align: 'right', weight: 700, color: AMBER });
  });

  // The level line a depth is set against.
  if (read.marker != null) {
    ctx.strokeStyle = AMBER;
    ctx.lineWidth = 1;
    ctx.setLineDash?.([6, 3]);
    ctx.beginPath();
    ctx.moveTo(b.X(P.x0), Y(-read.marker)); ctx.lineTo(b.X(P.x1), Y(-read.marker));
    ctx.stroke();
    ctx.setLineDash?.([]);
  }

  // One pair: its atoms drawn to the plot's own scale on the track, the near one under the hand.
  if (f.props.discs) {
    const row = read.rows[0];
    const pair = PAIRS[row.pair];
    const t = fixtureTrack(f);
    // The atoms are drawn to one scale of their own (`props.discK`, units a picometre of radius), so a bigger atom is a bigger disc;
    // the hand moves the near one along the track, and the track is the plot's own separation axis.
    const k = (f.props.discK ?? 0.085) * b.sc;
    const ay = b.Y(t.y);
    const ra = DISC_RADIUS[pair.a] * k;
    const rb = DISC_RADIUS[pair.b] * k;
    const tint = sym => TINTS[{ H: 'bone', C: 'iron', N: 'pale', O: 'rust', F: 'sand', Cl: 'sand' }[sym] || 'bone'];
    const ax = b.X(t.x0);
    const bx = ax + (row.gap / dmax) * (b.X(t.x1) - b.X(t.x0));
    ctx.strokeStyle = PLATE_COLORS.steel;
    ctx.lineWidth = Math.max(1, Math.min(ra, rb) * 0.2);
    for (let i = 0; i < pair.order; i++) {
      const off = (i - (pair.order - 1) / 2) * Math.max(2, Math.min(ra, rb) * 0.45);
      ctx.beginPath();
      ctx.moveTo(ax, ay + off); ctx.lineTo(bx, ay + off);
      ctx.stroke();
    }
    disc(ctx, ax, ay, ra, tint(pair.a));
    disc(ctx, bx, ay, rb, tint(pair.b), PLATE_COLORS.dust);
  }
  // A row of several pairs shows each pair's atoms beside its track.
  if (!f.props.discs) {
    const t0 = fixtureTrackAll(f);
    read.rows.forEach((row, i) => {
      const t = t0[i];
      miniPair(ctx, row.pair, b.X(t.x1) - 5 * b.sc * 0.9, b.Y(t.y) - 0.4 * b.sc, (f.props.icon ?? 0.034) * b.sc);
    });
  }
}

function fixtureTrackAll(f) {
  const r = rectOf(f, SIZES.fixture);
  const m = f.props.margin ?? 3;
  const pitch = f.props.rowPitch ?? 5;
  const top = r.y0 + (f.props.top ?? 8);
  return f.props.rows.map((row, i) => ({ x0: r.x0 + m, x1: r.x1 - m, y: top + i * pitch }));
}
const fixtureTrack = f => fixtureTrackAll(f)[0];

/** One dispatcher for every fixture this kit paints. */
function paintFixture(ctx, f, state, b) {
  if (f.kind === 'hotplate') paintHotplate(ctx, f, state, b);
  else if (f.kind === 'lattice') paintLattice(ctx, f, state, b);
  else if (f.kind === 'wells') paintWells(ctx, f, state, b);
  else ATOMS_KIT.paintFixture?.(ctx, f, state, b);
}

/* ------------------------------------------------------------------
   THE KIT
   ------------------------------------------------------------------ */

/* ------------------------------------------------------------------
   THE SOLID THINGS (`ligar-props.js`): what the built table stands on the bench
   ------------------------------------------------------------------ */

/** How tall a block of ore stands (metres): a tool laid on it rests on its face. */
const BLOCK_TOP = 0.078;

function piece3d(p, state, c) {
  if (c.skin && c.skin !== LIGAR_SKIN) return null;
  switch (p.kind) {
    case 'slab': {
      // The magnified picture stands up: the atoms `planSlab` lays (the same cells the flat picture paints, less any the tongs lifted) are
      // little balls under the glass, a plus or a minus on each ion.
      const v = slabView(p, state);
      const lay = v.d.sealed ? null : planSlab(v.d, v.phase);
      const gone = new Set(v.lifted);
      const atoms = lay ? lay.cells.map((cell, i) => ({ x: cell.x, y: cell.y, sign: cell.sign || 0, gone: gone.has(i) })) : [];
      return buildOreBlock(c, {
        decl: v.d,
        label: p.label,
        tint: v.d.tint,
        sealed: Boolean(v.d.sealed),
        molten: v.molten,
        temp: v.temp,
        phase: v.phase,
        blow: v.blow,
        leads: v.leads,
        current: v.current,
        seedId: p.id,
        piece: p,
        state,
        atoms,
        cols: lay?.cols || 0,
        rows: lay?.rows || 0,
        ions: v.d.build === 'grid'
      });
    }
    case 'salt': return buildSaltSpecimen(c, { seedId: p.id, molten: saltView(p, state).molten });
    case 'pairtag': return buildPairTag(c, { seedId: p.id });
    case 'hammer': return buildHammer(c);
    case 'tongs': return buildTongs(c, { text: p.label });
    case 'leads': {
      const slabId = p.joinedTo.find(id => state.pieces[id]?.kind === 'slab');
      const v = slabId ? slabView(state.pieces[slabId], state) : null;
      return buildLeads(c, { lit: Boolean(v?.current), text: p.label });
    }
    default: return ATOMS_KIT.piece3d(p, state, c);
  }
}

/** How high a hotplate's face stands (metres): a block or a salt set on it rests there, not on the mat beside it. */
const PLATE_TOP = 0.03;

/** A tool lying on a block rests on the block's face; a block on the hotplate rests on the plate, not on the table. */
function restHeight(p, state) {
  if (BLOCK_TOOLS.has(p.kind)) {
    const on = p.joinedTo.map(id => state.pieces[id]).find(o => o?.kind === 'slab');
    return on ? BLOCK_TOP + (hotplateUnder(on, state) ? PLATE_TOP : 0) : 0;
  }
  return (p.kind === 'slab' || p.kind === 'salt') && hotplateUnder(p, state) ? PLATE_TOP : 0;
}


export const BONDS_KIT = {
  ...ATOMS_KIT,
  id: BONDS_KIT_ID,
  kinds: {
    ...ATOMS_KIT.kinds,
    ion: { r: 6.5, nojoin: true },
    slab: { r: SLAB_R, rect: SLAB_RECT },
    salt: { r: SLAB_R, rect: SALT_RECT, nojoin: true },
    pairtag: { r: 7, rect: PAIRTAG_RECT, nojoin: true },
    guess: { r: 9, rect: GUESS_RECT, nojoin: true },
    // A tool laid on a block is the top thing there (`onTop`): a press on it takes it, never the block under it.
    hammer: { r: TOOL_R, tool: true, onTop: true },
    leads: { r: TOOL_R, tool: true, onTop: true },
    tongs: { r: TOOL_R, tool: true, onTop: true }
  },
  planJoin,
  pairable,
  run,
  dialed,
  piece3d,
  restHeight,
  deck3d: ligarDeck,
  paintPiece,
  printed,
  faceKey,
  paintFixture
};

registerKit(BONDS_KIT);

/* ------------------------------------------------------------------
   TABLE FURNITURE
   ------------------------------------------------------------------ */

/** A stage's declaration with the bonds kit's defaults: the kit, the bounds, a parked recorder strip. */
export function bondsTable(spec) {
  return { kit: BONDS_KIT_ID, bounds: { ...BONDS_BOUNDS }, tools: [], recorder: BONDS_RECORDER, ...spec };
}

/** A block piece: `decl` is the old bench's own slab declaration (`build`, `melt`, `tint`, `sealed`, `cluster`, `groups`). */
export const slabPiece = (id, label, decl, at, extra = {}) => ({ id, kind: 'slab', label, at, props: { slab: decl }, ...extra });

/** A guess card for a predict stage: `lines` is its wording on up to three lines, `label` the same words in one (the Tour and the prompt use it). */
export const guessCard = (id, label, lines, at) => ({ id, kind: 'guess', label, at, props: { lines } });

/** A salt piece (`lattice` is a `bonddata.LATTICES` id). */
export const saltPiece = (id, label, lattice, at, extra = {}) => ({ id, kind: 'salt', label, at, props: { lattice }, ...extra });

/** A pair card (`pair` is a `bonddata.PAIRS` id). */
export const pairTag = (id, label, pair, at, extra = {}) => ({ id, kind: 'pairtag', label, at, props: { pair }, ...extra });

/** A hotplate fixture: a header (name, one `heat` dial) over a plate that blocks are slid onto. */
export function hotplate(id, at, { w = 90, h = 32, max = 2000, step = 25, label = 'Hotplate' } = {}) {
  return { id, kind: 'hotplate', label, at, size: { w, h }, noRun: true, dials: { heat: { min: 0, max, step, value: 0, label: 'Heat' } } };
}

export { piecesIn } from './atoms.js';
