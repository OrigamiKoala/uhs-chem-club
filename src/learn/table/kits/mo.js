/**
 * kits/mo.js — The orbital kit: boxes that electrons are poured into, a magnet that reads the real molecule, and cards laid on a rail.
 *
 * LIGAR'S LAST BENCH, WORKED WITH THE HANDS (plan `bench-tabletop.md`, T3c): `q9-orbitals` and the Warden's last phase.
 * A thin wrapper over `mo.js` (`rowsMO`, `readMO`, `fillMO`, `DIATOMICS`), the planners the box rack shared, and it authors
 * nothing: how many electrons a box holds, how many stand alone, the bond order and what the magnet says are the planner's
 * answers and the listed molecule's own, shown as the picture.
 *
 * THE RACK (fixture `rack`, a backdrop). The two atoms' boxes stand at the sides and the boxes they make between them stand in
 * the middle in order of energy, lowest at the bottom. Each of those boxes is a CONTAINER (`capacity` 2) holding a count of
 * electrons, and the supply is a container of loose electrons: an electron is poured from the supply into a box by a drag from
 * one to the other (or a tap on each), lifted out by pouring it back, and moved from box to box the same way. A box takes one
 * arrow of each direction and no more: a third is refused and the reason is the rack's own. Which way an arrow points is
 * the order it went in (the first stands up, the second points down), so a box can hold two electrons only as a pair.
 * `Join Atoms` (the rack's Run key, on a stage that starts with the atoms apart) draws the boxes the atoms make between them.
 *
 * THE MAGNET (fixture `magnet`) holds the REAL molecule to the field and reports how hard it is pulled, from
 * `DIATOMICS[mol].unpaired`: never the arrangement the player has built. With `props.slot` it tests whichever gas card stands
 * in that slot and writes the pull on the card.
 *
 * Everything a stage reads off the table is exported here (`rackOf`, `readOf`, `matchesGround`, `magnetRead`, `cardPull`),
 * derived from the containers and the dials. THE ARRANGEMENT A BOX HOLDS IS WHATEVER THE HAND PUT THERE, and the ground state
 * it is held against is `mo.js` `fillMO`.
 */

import { registerKit } from './registry.js';
import { pileSlots } from './heap.js';
import { PLATE_COLORS, plateText } from '../../engine/plates.js';
import { rowsMO, readMO, fillMO, boxKeyMO, DIATOMICS } from '../../engine/mo.js';
import { rectOf, SIZES } from '../snap.js';
import { LIGAR_SKIN, buildEnamelTile, ligarDeck } from '../../engine/ligar-props.js';

export const MO_KIT_ID = 'mo';

/** A table of the orbital kit is 150 x 64 units: a rack in the middle, the supply and the marker at its sides. */
export const MO_BOUNDS = Object.freeze({ w: 150, h: 64 });
/** Where the paper strip parks on a table that never prints on it. */
export const MO_RECORDER = Object.freeze({ at: { x: 147.4, y: 61.6 }, size: { w: 5, h: 3.4 } });

const AMBER = PLATE_COLORS.amber;
const PHOS = PLATE_COLORS.phosphor;

/** A card on a rail: wide enough to carry a formula and a count line. */
export const CARD_RECT = Object.freeze({ hw: 16, hh: 9 });

/* ------------------------------------------------------------------
   THE RACK'S GEOMETRY (pure; the fixture's picture and the containers' places both read it)
   ------------------------------------------------------------------ */

export const RACK_SIZE = Object.freeze({ w: 88, h: 60 });

/**
 * Where the rack's boxes stand, in table units, for a rack whose middle is `at`. `rank` 0 is the lowest. The two-row rack of
 * the 1s boxes has big boxes with room between them; the six-row rack packs nine boxes at nine units a rank.
 */
export function rackGeometry(order, at) {
  const rows = rowsMO(order);
  const n = rows.length;
  const two = n === 2;
  const pitch = two ? 17 : 9.4;
  const bw = two ? 16 : 14;
  const bh = two ? 10 : 8;
  const gap = 2;
  const yOf = rank => at.y + ((n - 1) / 2 - rank) * pitch;
  const out = rows.map((row, rank) => ({
    row,
    rank,
    y: yOf(rank),
    boxes: Array.from({ length: row.boxes }, (_, i) => ({ idx: i, x: at.x + (i - (row.boxes - 1) / 2) * (bw + gap), y: yOf(rank), w: bw, h: bh })),
    width: row.boxes * bw + (row.boxes - 1) * gap
  }));
  // The atoms' own boxes, one level each: a 1s box between the two, or the 2s below the 2p.
  const side = 31;
  const ao = two
    ? [{ name: '1s', y: (yOf(0) + yOf(1)) / 2, n: 1 }]
    : [{ name: '2s', y: (yOf(0) + yOf(1)) / 2, n: 1 }, { name: '2p', y: (yOf(3) + yOf(4)) / 2, n: 3 }];
  return { order, rows: out, bw, bh, pitch, side, ao, aoW: two ? 12 : 8.5, aoH: two ? 8 : 6, left: at.x - side, right: at.x + side };
}

/** The id of a box's container. */
export const boxId = (rack, rowId, idx) => `${rack}.${boxKeyMO(rowId, idx)}`;

/* ------------------------------------------------------------------
   READINGS (pure; a stage's check reads these)
   ------------------------------------------------------------------ */

const isBox = c => Boolean(c?.props?.mo && c.props.mo.row);
const isSupply = c => c?.props?.mo === 'supply';

/** The rack as the old box rack held it: `{'g2s:0': 'ud', ...}`. A box holds `u`, then `d`; more than two is a third letter the rack refuses to take. */
export function rackOf(state, rackId) {
  const out = {};
  for (const c of Object.values(state.zones.containers)) {
    if (!isBox(c) || c.props.mo.rack !== rackId) continue;
    const n = Math.round(c.contents.electron || 0);
    if (n > 0) out[boxKeyMO(c.props.mo.row, c.props.mo.idx)] = ['u', 'd', 'x', 'x'].slice(0, n).join('');
  }
  return out;
}

/** What the rack reads: `mo.js` `readMO`, the planner the old rack drew from. */
export function readOf(state, rackId, order) {
  return readMO(order ?? rackOrder(state, rackId), rackOf(state, rackId));
}

/** The order a rack's boxes were laid out in (`'1s'`, `'o2f2'` or `'b2n2'`), from its fixture. */
export function rackOrder(state, rackId) {
  const f = Object.values(state.fixtures).find(x => x.kind === 'rack' && x.props.rack === rackId);
  return f ? f.props.order : 'o2f2';
}

/**
 * Do the electrons stand where the ground state puts `e` of them? Row by row, the boxes of a row alike (the two pi boxes are
 * interchangeable), so a player who fills the other pi box first has the same rack. The ground state is `fillMO`'s.
 */
export function matchesGround(state, rackId, e, order = rackOrder(state, rackId)) {
  const want = fillMO(order, e);
  const have = rackOf(state, rackId);
  for (const row of rowsMO(order)) {
    const count = rack => Array.from({ length: row.boxes }, (_, i) => (rack[boxKeyMO(row.id, i)] || '').length).sort().join();
    if (count(want) !== count(have)) return false;
  }
  return true;
}

/** Electrons loose in the supply. */
export function supplyLeft(state, id = 'supply') {
  return Math.round(state.zones.containers[id]?.contents.electron || 0);
}

/** The magnet as it reads: has it been used, and the pull of the REAL molecule (the number of electrons standing alone in it). */
export function magnetRead(state, fid) {
  const f = state.fixtures[fid];
  const mol = f.props.mol;
  const v = f.dials.pull.value;
  const real = mol ? DIATOMICS[mol].unpaired : null;
  return { id: fid, mol, tested: v > 0, pull: v > 0 ? v - 1 : null, real };
}

/** The pull written on a gas card the magnet has tested (null until it has). */
export const cardPull = piece => (piece?.props?.pull ?? null);

/** What the bond tester has printed (it prints every molecule it was given, from the listed energies). */
export function bondTestRead(state, fid) {
  const f = state.fixtures[fid];
  const rows = (f.props.mols || []).map(id => ({ id, label: DIATOMICS[id].label, energy: DIATOMICS[id].energy }));
  return { id: fid, tested: f.dials.read.value > 0, rows };
}

/* ------------------------------------------------------------------
   THE KIT'S RUN, POUR AND REFUSAL
   ------------------------------------------------------------------ */

function run(state, fixtureId) {
  const f = state.fixtures[fixtureId];
  if (!f || f.noRun) return null;
  if (f.kind === 'rack' && f.dials.merged) {
    if (f.dials.merged.value >= 1) return { noop: 'The atoms have already joined.' };
    return { dials: { [f.id]: { merged: 1 } } };
  }
  if (f.kind === 'magnet') {
    if (f.props.slot) {
      const piece = Object.values(state.pieces).find(p => !p.hidden && p.zone === `slot:${f.props.slot}`);
      if (!piece) return { noop: 'Put a gas in the slot to test it.' };
      return { stamp: { [piece.id]: { pull: DIATOMICS[piece.props.mol].unpaired } } };
    }
    return { dials: { [f.id]: { pull: 1 + DIATOMICS[f.props.mol].unpaired } } };
  }
  if (f.kind === 'bondtest') return { dials: { [f.id]: { read: 1 } } };
  return null;
}

/** Why a pour did not take: a box that already holds its pair. */
function pourRefusal(state, from, to) {
  if (isBox(to)) return 'A box takes one arrow of each direction and no more.';
  void from;
  return null;
}

/* ------------------------------------------------------------------
   PAINTING (the drawn table and the built table's faces call the same functions)
   ------------------------------------------------------------------ */

function fitted(ctx, text, x, y, maxW, o = {}) {
  ctx.font = `${o.weight || 500} ${o.size}px "JetBrains Mono", "Quantico", monospace`;
  ctx.textAlign = o.align || 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = o.color || PLATE_COLORS.text;
  ctx.fillText(text, x, y, maxW);
}

/** An arrow standing in a box: a shaft with its head, up for the first electron and down for the second. */
function spinArrow(ctx, x, y, len, up, color) {
  const h = len / 2;
  const tip = up ? y - h : y + h;
  const tail = up ? y + h : y - h;
  const d = up ? 1 : -1;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = Math.max(1.4, len * 0.09);
  ctx.beginPath();
  ctx.moveTo(x, tail);
  ctx.lineTo(x, tip);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, tip);
  ctx.lineTo(x - len * 0.2, tip + d * len * 0.3);
  ctx.lineTo(x + len * 0.2, tip + d * len * 0.3);
  ctx.closePath();
  ctx.fill();
  ctx.lineWidth = 1;
}

/** One supply's pile: the dots of the loose electrons (`heap.js` `pileSlots`, the slots shared with the built table). */
export function pileOf(c) {
  if (!isSupply(c)) return null;
  const total = Math.round(c.contents.electron || 0);
  const r = rectOf(c, SIZES.container);
  const cap = Math.max(c.capacity || 0, c.props.start || 0, total, 1);
  const { slots, r: dot } = pileSlots(cap, r.w, r.h);
  return { n: Math.min(slots.length, total), cap: slots.length, slots, r: dot, colour: PHOS, molecule: false, rect: r };
}

/** A box takes no slab of fill in the built table: its electrons are the arrows on its face. */
const noJarFill = c => isBox(c);

function paintContainer(ctx, c, state, o) {
  const { X, Y, sc } = o;
  const r = rectOf(c, SIZES.container);
  if (isBox(c)) {
    const n = Math.round(c.contents.electron || 0);
    ctx.fillStyle = '#0a0908';
    ctx.fillRect(X(r.x0) + 1, Y(r.y0) + 1, r.w * sc - 2, r.h * sc - 2);
    const len = Math.max(8, Math.min(r.h * sc * 0.78, r.w * sc * 0.4));
    const cy = Y(c.at.y);
    if (n >= 1) spinArrow(ctx, n >= 2 ? X(c.at.x) - r.w * sc * 0.2 : X(c.at.x), cy, len, true, PHOS);
    if (n >= 2) spinArrow(ctx, X(c.at.x) + r.w * sc * 0.2, cy, len, false, PHOS);
    return true;
  }
  if (isSupply(c)) {
    ctx.fillStyle = '#16140f';
    ctx.fillRect(X(r.x0) + 1, Y(r.y0) + 1, r.w * sc - 2, r.h * sc - 2);
    if (o.bodies) return true;
    const p = pileOf(c);
    const rad = Math.max(1.2, p.r * sc);
    ctx.fillStyle = PHOS;
    for (let i = 0; i < p.n; i++) {
      const s = p.slots[i];
      ctx.beginPath();
      ctx.arc(X(c.at.x + s.x), Y(c.at.y + s.y), rad, 0, Math.PI * 2);
      ctx.fill();
    }
    return true;
  }
  return false;
}

/** The rack: its ladder of levels, the atoms' boxes at the sides, the boxes between them, and the counts it reads. */
function paintRack(ctx, f, state, b) {
  const { X, Y, sc } = b;
  const order = f.props.order;
  const g = rackGeometry(order, f.at);
  const merged = f.dials.merged ? f.dials.merged.value >= 1 : true;
  const size = Math.max(7, 2.3 * sc);
  ctx.fillStyle = '#100e0b';
  ctx.fillRect(b.x0 + 1, b.y0 + 1, b.x1 - b.x0 - 2, b.y1 - b.y0 - 2);

  // The energy axis up the left edge.
  const top = Y(g.rows[g.rows.length - 1].y - g.bh / 2 - 1);
  const bottom = Y(g.rows[0].y + g.bh / 2 + 1);
  const ax = X(f.at.x - RACK_SIZE.w / 2 + 4);
  ctx.strokeStyle = PLATE_COLORS.dim;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(ax, bottom);
  ctx.lineTo(ax, top + 5);
  ctx.moveTo(ax, top);
  ctx.lineTo(ax - 3, top + 6);
  ctx.lineTo(ax + 3, top + 6);
  ctx.closePath();
  ctx.stroke();
  plateText(ctx, 'ENERGY', ax, bottom + size * 1.1, { size: size * 0.8, align: 'center', color: PLATE_COLORS.dim });

  // The atoms' own boxes, one at each side.
  for (const side of [-1, 1]) {
    const cx = f.at.x + side * g.side;
    for (const a of g.ao) {
      for (let k = 0; k < a.n; k++) {
        const x = cx + (k - (a.n - 1) / 2) * (g.aoW + 1.5);
        ctx.fillStyle = '#0a0908';
        ctx.fillRect(X(x - g.aoW / 2), Y(a.y - g.aoH / 2), g.aoW * sc, g.aoH * sc);
        ctx.strokeStyle = PLATE_COLORS.rim;
        ctx.strokeRect(Math.round(X(x - g.aoW / 2)) + 0.5, Math.round(Y(a.y - g.aoH / 2)) + 0.5, g.aoW * sc - 1, g.aoH * sc - 1);
      }
      plateText(ctx, a.name, X(cx), Y(a.y + g.aoH / 2 + 3), { size: size * 0.85, align: 'center', color: PLATE_COLORS.dim });
    }
    plateText(ctx, f.props.atom || '', X(cx), Y(g.rows[0].y + g.bh / 2 + 3.2), { size, align: 'center', color: PLATE_COLORS.dust, weight: 700 });
  }

  if (merged) {
    // Where each box came from: dashed lines to the atoms' levels.
    ctx.strokeStyle = PLATE_COLORS.rim;
    ctx.setLineDash?.([3, 4]);
    for (const r of g.rows) {
      const from = g.ao.reduce((best, a) => (!best || Math.abs(a.y - r.y) < Math.abs(best.y - r.y) ? a : best), null);
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(X(f.at.x + side * (g.side - ((from.n - 1) / 2) * (g.aoW + 1.5) - g.aoW / 2)), Y(from.y));
        ctx.lineTo(X(f.at.x + side * (r.width / 2 + 1)), Y(r.y));
        ctx.stroke();
      }
    }
    ctx.setLineDash?.([]);
    // The boxes between them: a row's name at its left, a box (empty here: the electrons are its container's) for each.
    for (const r of g.rows) {
      plateText(ctx, r.row.label, X(f.at.x - r.width / 2 - 2), Y(r.y) + size * 0.35, {
        size: size * 1.1, align: 'right', weight: 700, color: r.row.anti ? PLATE_COLORS.dust : PHOS
      });
      for (const box of r.boxes) {
        const x0 = Math.round(X(box.x - box.w / 2));
        const y0 = Math.round(Y(box.y - box.h / 2));
        ctx.fillStyle = '#0a0908';
        ctx.fillRect(x0, y0, box.w * sc, box.h * sc);
        ctx.strokeStyle = PLATE_COLORS.steel;
        ctx.strokeRect(x0 + 0.5, y0 + 0.5, box.w * sc - 1, box.h * sc - 1);
        const tag = f.props.tags?.[r.row.id];
        if (tag) fitted(ctx, tag, X(box.x), Y(box.y), box.w * sc * 0.8, { size: size * 1.3, weight: 700, color: AMBER });
      }
    }
  } else {
    plateText(ctx, 'APART', X(f.at.x), Y(g.rows[0].y - 2), { size, align: 'center', color: PLATE_COLORS.dim });
  }

  // What the rack reads, when there are electrons to count.
  if (f.props.live && merged) {
    const read = readOf(state, f.props.rack, order);
    const lines = [`PLACED ${read.total}`, `ALONE IN A BOX ${read.unpaired}`];
    if (f.props.counts) lines.push(`LOWER ${read.bonding}  UPPER ${read.anti}`);
    lines.forEach((t, i) => plateText(ctx, t, b.x1 - 3, b.y0 + size * (1.4 + i * 1.5), { size, align: 'right', weight: 700, color: PHOS }));
  }
}

/** The magnet: a horseshoe over a sample, and what it did. */
function paintMagnet(ctx, f, state, b) {
  const { sc } = b;
  const size = Math.max(7, 2.3 * sc);
  const w = b.x1 - b.x0;
  const cx = b.x0 + w / 2;
  const top = b.y0 + 5.5 * sc;
  const r = Math.min(w * 0.2, 6 * sc);
  ctx.strokeStyle = PLATE_COLORS.steel;
  ctx.lineWidth = Math.max(2, 1.4 * sc);
  ctx.beginPath();
  ctx.moveTo(cx - r, top + r * 1.6);
  ctx.lineTo(cx - r, top + r);
  ctx.arc(cx, top + r, r, Math.PI, 0);
  ctx.lineTo(cx + r, top + r * 1.6);
  ctx.stroke();
  // The two poles, told apart by a bar, never by colour.
  ctx.fillStyle = PLATE_COLORS.dust;
  ctx.fillRect(cx - r - sc, top + r * 1.6, 2 * sc, 1.4 * sc);
  ctx.fillRect(cx + r - sc, top + r * 1.6, 2 * sc, 1.4 * sc);
  ctx.lineWidth = 1;
  const read = f.props.slot ? null : magnetRead(state, f.id);
  let l1 = f.props.slot ? 'TEST THE GAS IN THE SLOT' : 'NOT TESTED';
  let l2 = '';
  if (read?.tested) {
    l1 = read.pull > 0 ? 'PULLED IN' : 'PUSHED OUT';
    l2 = read.pull > 0 ? `STRENGTH ${read.pull}` : 'SLIGHTLY';
  }
  fitted(ctx, l1, cx, top + r * 3.2, w - 4, { size: size * 0.95, weight: 700, color: read?.tested ? AMBER : PLATE_COLORS.dim });
  if (l2) fitted(ctx, l2, cx, top + r * 3.2 + size * 1.5, w - 4, { size: size * 0.95, weight: 700, color: AMBER });
}

/** The bond tester: the listed bond energy of each molecule it was given, once it has been run. */
function paintBondTest(ctx, f, state, b) {
  const { sc } = b;
  const size = Math.max(7, 2.3 * sc);
  const cx = (b.x0 + b.x1) / 2;
  const read = bondTestRead(state, f.id);
  fitted(ctx, 'BOND ENERGY', cx, b.y0 + 8 * sc, b.x1 - b.x0 - 4, { size: size * 0.9, color: PLATE_COLORS.dim });
  read.rows.forEach((row, i) => {
    const y = b.y0 + (12.5 + i * 3.8) * sc;
    plateText(ctx, row.label, b.x0 + 3 * sc, y, { size: size * 1.05, weight: 700, color: PLATE_COLORS.dust, base: 'middle' });
    plateText(ctx, read.tested ? String(row.energy) : '--', b.x1 - 3 * sc, y, { size: size * 1.05, weight: 700, align: 'right', base: 'middle', color: read.tested ? AMBER : PLATE_COLORS.dim });
  });
}

function paintFixture(ctx, f, state, b) {
  if (f.kind === 'rack') paintRack(ctx, f, state, b);
  else if (f.kind === 'magnet') paintMagnet(ctx, f, state, b);
  else if (f.kind === 'bondtest') paintBondTest(ctx, f, state, b);
}

/** A card: a dark slab with a hairline edge, amber while it is in the hand. */
function slab(ctx, x0, y0, w, h, lit) {
  ctx.fillStyle = '#2a2620';
  ctx.fillRect(x0, y0, w, h);
  ctx.strokeStyle = lit ? AMBER : PLATE_COLORS.dust;
  ctx.lineWidth = lit ? 2 : 1;
  ctx.strokeRect(x0 + 0.5, y0 + 0.5, w - 1, h - 1);
  ctx.lineWidth = 1;
}

/** What a species card prints under its name: the electrons in the lower boxes and in the upper ones, from `fillMO`. */
export function cardCounts(mol) {
  const d = DIATOMICS[mol];
  const r = readMO(d.order, fillMO(d.order, d.e));
  return { bonding: r.bonding, anti: r.anti, text: `LOWER ${r.bonding}  UPPER ${r.anti}` };
}

function paintCard(ctx, p, state, o) {
  const hw = CARD_RECT.hw * o.sc;
  const hh = CARD_RECT.hh * o.sc;
  const x0 = o.x - hw;
  const y0 = o.y - hh;
  slab(ctx, x0, y0, hw * 2, hh * 2, o.lit);
  const size = Math.max(8, Math.round(hh * 0.46));
  const mol = p.props.mol;
  if (!mol) {
    fitted(ctx, p.label, o.x, o.y, hw * 1.8, { size: size * 1.05, weight: 700 });
    return;
  }
  fitted(ctx, p.label, o.x, y0 + hh * 0.62, hw * 1.8, { size: size * 1.25, weight: 700 });
  if (p.props.counts) fitted(ctx, cardCounts(mol).text, o.x, y0 + hh * 1.4, hw * 1.86, { size: Math.max(7, size * 0.78), color: PLATE_COLORS.dust });
  const pull = cardPull(p);
  if (pull !== null) {
    fitted(ctx, pull > 0 ? `PULLED IN ${pull}` : 'PUSHED OUT', o.x, y0 + hh * 1.4, hw * 1.86, { size: Math.max(7, size * 0.82), weight: 700, color: AMBER });
  }
}

function paintPiece(ctx, p, state, o) {
  if (p.kind === 'mocard') { paintCard(ctx, p, state, o); return true; }
  return false;
}

const printed = p => String(p.label);

function faceKey(p) {
  if (p.kind === 'mocard') return `${p.label}|${p.props.counts ? 1 : 0}|${cardPull(p) ?? '-'}`;
  return '';
}

/* ------------------------------------------------------------------
   THE KIT
   ------------------------------------------------------------------ */

/** An orbital card is an enamelled tile with a lip at its foot, standing where the rack can hold it (`ligar-props.js`). */
function piece3d(p, state, c) {
  if (c.skin !== LIGAR_SKIN) return null;
  return p.kind === 'mocard' ? buildEnamelTile(c, { lip: true }) : null;
}

export const MO_KIT = {
  id: MO_KIT_ID,
  kinds: {
    mocard: { r: 9, rect: CARD_RECT, nojoin: true }
  },
  run,
  piece3d,
  deck3d: ligarDeck,
  pourRefusal,
  pileOf,
  noJarFill,
  paintContainer,
  paintPiece,
  printed,
  faceKey,
  paintFixture
};

registerKit(MO_KIT);

/* ------------------------------------------------------------------
   TABLE FURNITURE
   ------------------------------------------------------------------ */

/** A stage's declaration with the orbital kit's defaults: the kit, the bounds, a parked recorder strip. */
export function moTable(spec) {
  return { kit: MO_KIT_ID, bounds: { ...MO_BOUNDS }, tools: [], recorder: MO_RECORDER, ...spec };
}

/**
 * A rack: the fixture (a backdrop with the ladder drawn on it) and one container for each box of the molecule `mol`.
 * `live` puts the readings on it (electrons placed, alone in a box), `counts` adds the lower and upper tallies, `merged: false`
 * starts with the atoms apart and a Run key that joins them, `tags` writes a name in a row's boxes.
 */
export function moRack(rackId, mol, at, { live = true, counts = false, merged = true, tags = null, size = RACK_SIZE, atom = null } = {}) {
  const d = DIATOMICS[mol];
  const g = rackGeometry(d.order, at);
  const containers = [];
  if (live) {
    for (const r of g.rows) {
      for (const box of r.boxes) {
        containers.push({
          id: boxId(rackId, r.row.id, box.idx), label: ' ', at: { x: box.x, y: box.y }, size: { w: box.w, h: box.h },
          capacity: 2, contents: {}, props: { mo: { rack: rackId, row: r.row.id, idx: box.idx } }
        });
      }
    }
  }
  const fixture = {
    id: `rack-${rackId}`, kind: 'rack', label: d.label, at: { ...at }, size: { ...size },
    ...(merged ? { noRun: true } : { runLabel: 'Join Atoms' }),
    dials: { merged: { min: 0, max: 1, step: 1, value: merged ? 1 : 0 } },
    props: { backdrop: true, hidden: ['merged'], rack: rackId, mol, order: d.order, atom: atom ?? atomOf(mol), live, counts, ...(tags ? { tags } : {}) }
  };
  return { containers, fixture, geometry: g };
}

const ATOM_OF = { H2: 'H', He2: 'He', B2: 'B', C2: 'C', N2: 'N', O2: 'O', O2p: 'O', O2m: 'O', F2: 'F' };
export const atomOf = mol => ATOM_OF[mol] || '';

/** The loose electrons: a container with `n` of them, poured into boxes. */
export function moSupply(id, label, at, n, size = { w: 28, h: 22 }) {
  return { id, label, at, size, capacity: null, contents: { electron: n }, props: { mo: 'supply', start: n } };
}

/** The magnet fixture: `mol` for a rack's own sample, or `slot` for a gas card put in it. */
export function magnet(id, at, { mol = null, slot = null, size = { w: 28, h: 30 }, label = 'Magnet', runLabel = 'Test Sample' } = {}) {
  return {
    id, kind: 'magnet', label, at, size, runLabel,
    dials: { pull: { min: 0, max: 9, step: 1, value: 0 } },
    props: { hidden: ['pull'], ...(mol ? { mol } : {}), ...(slot ? { slot } : {}) }
  };
}

/** The bond tester: it prints the listed bond energy of each molecule (`DIATOMICS` ids) in `mols`. */
export function bondTester(id, at, mols, size = { w: 30, h: 26 }) {
  return {
    id, kind: 'bondtest', label: 'Test Bond', at, size, runLabel: 'Test Bond',
    dials: { read: { min: 0, max: 1, step: 1, value: 0 } },
    props: { hidden: ['read'], mols }
  };
}

/** A plain dial a player sets to a number they have read off the rack (the bond order). */
export function marker(id, label, at, { max = 4, value = 1, size = { w: 30, h: 16 } } = {}) {
  return { id, kind: 'marker', label, at, size, noRun: true, dials: { n: { min: 0, max, step: 1, value, label } }, props: {} };
}

/** A card for a rail or a slot. `mol` makes it a species card (its counts, or the pull a magnet gave it). */
export const moCard = (id, label, at, props = {}, extra = {}) => ({ id, kind: 'mocard', label, at, props, ...extra });

/** The pours that put `e` electrons into a rack in the ground state, as a player would pour them (one step per box). */
export function fillSteps(rackId, order, e, from = 'supply') {
  const rack = fillMO(order, e);
  return Object.entries(rack).map(([key, spins]) => ({
    pour: { from, to: `${rackId}.${key}`, what: 'electron', amount: spins.length }
  }));
}

export { rowsMO, readMO, fillMO, DIATOMICS };
