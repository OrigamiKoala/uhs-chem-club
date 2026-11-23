/**
 * near.js — The instrument stands nearest the player; what is picked from lies beyond it.
 *
 * Pure, no DOM, no THREE. Many tables were drawn with the instrument (every fixture) along the far
 * edge and the trays, slots, rail and loose pieces in a band under it, nearest the player. Worked
 * leaning in over the plate, that puts the thing the player acts on at the back and the pile in
 * the way. `nearInstrument` swaps the two bands on such a table, top to bottom: the pieces' band
 * moves to where the instrument's began, the instrument's band follows it, and the near edge is
 * kept clear (as far as the far edge was, up to `NEAR`). The table's how-to lines are printed again
 * in the gap between the bands, centred, on one line when they fit; a
 * rail moved to the far side prints its end words under it. A table too full for that is made a
 * little deeper (at most `GROW`). Each band moves as one piece, so nothing inside a band moves
 * against anything else in it; the table sets `near` so the built table leans in more steeply.
 *
 * It only touches a table it can read as two bands:
 *   - the cut is the lowest fixture's bottom edge; the instrument band is every fixture and everything
 *     above the cut (a piece standing on a fixture), the pieces band everything below it (how-to
 *     lines belong to neither: they go in the gap); a zone or piece the player takes that crosses the cut with its middle above it stands
 *     beside the instrument, and the table is left as drawn;
 *   - most of the options (what the player moves, but a fixture's own seat like `flask.well`) are in
 *     the pieces band, and no kind of loose piece, and no
 *     row of trays or containers, has some in each band;
 *   - nothing the player takes stands wholly above the instrument (that table has three bands);
 *   - the two bands, words included, do not overlap top to bottom.
 *   - nothing is moved into a fight's foe corner (`FOE_PAD`).
 * The recorder strip moves with the band it stands in. A stage keeps the drawn layout with
 * `layout: 'as-drawn'`. `createTable` calls this after the kit has settled the opening table, so
 * the drawn (`table2d.js`) and the built (`table3d.js`) table show the same thing.
 */

import { SIZES, rectOf, CELL } from './snap.js';
import { LABEL, labelRects, noteRect, captionRect, foePadOf, textUnits } from './layout.js';
import { pieceRect } from './audit.js';
import { radiusOf } from './kits/registry.js';

/** How far, in table units, the two bands may overlap and still be read as two (a label's descender). */
const TOUCH = 0.6;
/** The least gap, in table units, left between the two bands after the swap. */
const GAP_MIN = 1.5;
/** The near edge kept clear when the table has the room: at least what the far edge had, and never under this. */
const NEAR = 4;
/** The least near edge a table is made deeper for, and the most it is made deeper, in table units. */
const NEAR_MIN = 3.5;
const GROW = 14;
/** Clear table above and below the how-to lines in the gap, and the pitch of their lines (in sizes). */
const NOTE_PAD = 1.2;
const LINE = 1.5;

const union = rs => rs.reduce((a, r) => ({ y0: Math.min(a.y0, r.y0), y1: Math.max(a.y1, r.y1) }), { y0: Infinity, y1: -Infinity });

/**
 * Plan the swap without changing anything: `{dyInstrument, dyPieces, move}` or null when the table
 * is not a far-instrument table. `move` lists what moves, by band.
 */
export function planNear(state, kit) {
  const fixtures = Object.values(state.fixtures || {});
  if (!fixtures.length) return null;
  const fixBottom = Math.max(...fixtures.map(f => rectOf(f, SIZES.fixture).y1));
  const fixTop = Math.min(...fixtures.map(f => rectOf(f, SIZES.fixture).y0));

  // Every thing that can move, with the rectangles it takes on the table (words included).
  const things = [];
  const zoneOf = (kind, z, fallback) => {
    const r = rectOf(z, fallback);
    // What a zone holds may stand past its edges (a block is taller than the rail it lies on).
    const held = zonePieces(state, kit, { kind, z });
    const t = { type: 'zone', kind, z, rect: r, rects: [r, ...held, ...labelRects(state, kind, z)], player: true };
    // A rail moved to the far side prints its end words under it (`layout.js` `labelsBelow`): it takes that room instead.
    if (kind === 'rail') t.rectsBelow = [r, ...held, ...labelRects(state, kind, { ...z, labelsBelow: true })];
    things.push(t);
  };
  for (const z of Object.values(state.zones.trays)) zoneOf('tray', z, SIZES.tray);
  for (const z of Object.values(state.zones.slots)) zoneOf('slot', z, SIZES.slot);
  for (const z of Object.values(state.zones.containers)) zoneOf('container', z, SIZES.container);
  if (state.zones.rail) zoneOf('rail', state.zones.rail, SIZES.rail);
  for (const f of fixtures) {
    const r = rectOf(f, SIZES.fixture);
    things.push({ type: 'fixture', z: f, rect: r, rects: [r], instrument: true });
  }
  for (const f of Object.values(state.fetch || {})) {
    if (!f.at) continue;
    const r = rectOf(f, SIZES.site);
    things.push({ type: 'site', z: f, rect: r, rects: [r] });
  }
  // The recorder strip (a kit may park it, a point wide, in a corner) goes with the band it stands in.
  if (state.recorder?.box) {
    const r = rectOf(state.recorder.box, { w: 30, h: 18 });
    things.push({ type: 'recorder', z: state.recorder.box, rect: r, rects: [r] });
  }
  // A block of how-to lines (one under the other, same left edge) moves as one.
  let block = null;
  for (const n of state.notes || []) {
    const r = noteRect(n);
    const prev = block?.z[block.z.length - 1];
    if (prev && prev.at.x === n.at.x && n.at.y > prev.at.y && n.at.y - prev.at.y <= (n.size || LABEL.note) * 2) {
      block.z.push(n);
      block.rects.push(r);
      block.rect = { ...block.rect, y1: r.y1, x0: Math.min(block.rect.x0, r.x0), x1: Math.max(block.rect.x1, r.x1) };
    } else {
      block = { type: 'notes', z: [n], rect: { ...r }, rects: [r] };
      things.push(block);
    }
  }
  // A piece in a zone goes with its zone; a loose piece by where it stands.
  for (const p of Object.values(state.pieces)) {
    if (p.zone) continue;
    const r = pieceRect(kit, p);
    // The checks hold a piece to its round reach too, which may stand past its drawn box.
    const reach = radiusOf(kit, p);
    const rects = [r, { x0: p.at.x - reach, x1: p.at.x + reach, y0: p.at.y - reach, y1: p.at.y + reach }];
    if (p.caption && !p.hidden) rects.push(captionRect(kit, p));
    const t = { type: 'piece', z: p, rect: r, rects: p.hidden ? [] : rects, player: !p.fixed && !p.hidden };
    things.push(t);
  }

  // The cut is the lowest fixture's bottom edge. A thing's body (its words only make room) stands above it, below it, or
  // across it. Across it, a piece the player takes or a zone goes below only when its middle is below the cut (a sample
  // hanging just under the instrument); one whose middle is above it stands beside the instrument, and that table is
  // laid out side by side, not in two bands. A line of text or a plate goes with the side its middle is on.
  const instrument = [];
  const pieces = [];
  for (const t of things) {
    const mid = (t.rect.y0 + t.rect.y1) / 2;
    if (t.instrument || t.rect.y1 <= fixBottom + TOUCH) instrument.push(t);
    else if (t.rect.y0 >= fixBottom - TOUCH) pieces.push(t);
    else if (mid > fixBottom) pieces.push(t);
    else if (t.player) return null;
    else instrument.push(t);
  }
  if (!pieces.some(t => t.player)) return null;
  // Something the player takes standing wholly beyond the instrument already: the table has three bands, not two.
  if (instrument.some(t => t.player && t.rect.y1 <= fixTop)) return null;
  // The options are what the player takes and puts: everything they move but a fixture's own seat (`flask.well`). Most of
  // them must be below the instrument, or the table is laid out side by side; and a set of like pieces is never split.
  const option = t => t.player && !(t.type === 'zone' && t.kind === 'slot' && String(t.z.id).includes('.'));
  const beside = instrument.filter(option);
  const below = pieces.filter(option);
  if (below.length <= beside.length) return null;
  // Like pieces (the player's or fixed ones: a row of a table of elements) stay together.
  const shown = t => t.type === 'piece' && !t.z.hidden;
  const kinds = new Set(instrument.filter(shown).map(t => t.z.kind));
  if (pieces.some(t => shown(t) && kinds.has(t.z.kind))) return null;
  for (const k of ['tray', 'container']) if (beside.some(t => t.kind === k) && below.some(t => t.kind === k)) return null;

  // The how-to lines below the instrument are printed again in the gap between the bands, centred (`gapNotes`); the rail's
  // end words go under it.
  const lines = things.filter(t => t.type === 'notes');
  const band = pieces.filter(t => t.type !== 'notes');
  instrument.splice(0, instrument.length, ...instrument.filter(t => t.type !== 'notes'));
  for (const t of band) if (t.rectsBelow) t.rects = t.rectsBelow;

  // The bands are stacked by everything they take, words included, so they cannot meet after the swap.
  const I = union(instrument.flatMap(t => t.rects.length ? t.rects : [t.rect]));
  const P = union(band.flatMap(t => t.rects.length ? t.rects : [t.rect]));
  if (!(P.y1 > P.y0)) return null;
  const span = band.concat(instrument).flatMap(t => t.rects.length ? t.rects : [t.rect])
    .reduce((a, r) => ({ x0: Math.min(a.x0, r.x0), x1: Math.max(a.x1, r.x1) }), { x0: Infinity, x1: -Infinity });

  // From the far edge: the pieces, the gap (with the lines in it), the instrument, and the near edge kept clear as far as
  // the far edge was (at least NEAR), so the instrument does not stand on the lip of the plate.
  const notes = gapNotes(state, lines, span);
  const need = notes ? Math.max(GAP_MIN, notes.h + NOTE_PAD * 2) : GAP_MIN;
  const stack = top => {
    // A full table is made deeper by what the gap and a clear near edge lack (never more than GROW): the plate's picture
    // shrinks a little rather than the lines crowding the bands or the instrument standing on the lip.
    let free = state.bounds.h - top - (P.y1 - P.y0) - (I.y1 - I.y0);
    const grow = Math.max(0, Math.ceil(need + NEAR_MIN - free));
    if (grow > GROW) return null;
    free += grow;
    const near = Math.min(Math.max(NEAR, top), free - need);
    const gap = Math.max(need, Math.min(P.y0 - I.y1, free - near));
    const dyPieces = top - P.y0;
    const dyInstrument = top + (P.y1 - P.y0) + gap - I.y0;
    const gapAt = { y0: top + (P.y1 - P.y0), y1: top + (P.y1 - P.y0) + gap };
    return { dyInstrument, dyPieces, grow, cut: fixBottom, move: { instrument, pieces: band }, notes, lines, gapAt };
  };
  const top = Math.min(I.y0, P.y0);
  const plan = stack(top);
  // A fight's foe watches from the table's top-right corner (`FOE_PAD`): nothing is moved into it. Where the pieces would
  // reach it, their band starts under it instead.
  if (!plan || !state.foe) return plan;
  const clear = p => {
    const pad = foePadOf({ ...state.bounds, h: state.bounds.h + p.grow }).rect;
    const hits = (r, dy) => r.x0 < pad.x1 && pad.x0 < r.x1 && r.y0 + dy < pad.y1 && pad.y0 < r.y1 + dy;
    return [[instrument, p.dyInstrument], [band, p.dyPieces]].every(([moved, dy]) => moved.every(t => !t.rects.some(r => hits(r, dy) && !hits(r, 0))));
  };
  if (clear(plan)) return plan;
  const under = stack(Math.max(top, foePadOf(state.bounds).rect.y1 + GAP_MIN));
  if (under && clear(under)) return under;
  // Else the pieces' band slides left, out of the corner, when the table has the room on that side.
  const pad = foePadOf({ ...state.bounds, h: state.bounds.h + plan.grow }).rect;
  const rs = band.flatMap(t => t.rects).filter(r => r.y0 + plan.dyPieces < pad.y1);
  const right = Math.max(...rs.map(r => r.x1));
  const left = Math.min(...band.flatMap(t => t.rects).map(r => r.x0));
  const dx = Math.min(0, pad.x0 - GAP_MIN - right);
  if (left + dx < 1) return null;
  const slid = { ...plan, dxPieces: dx };
  return [[instrument, plan.dyInstrument]].every(([moved, dy]) => moved.every(t => !t.rects.some(r => r.x0 < pad.x1 && pad.x0 < r.x1 && r.y0 + dy < pad.y1 && pad.y0 < r.y1 + dy))) ? slid : null;
}

/**
 * The how-to lines to print in the gap: every block on the table, on one line when the whole of it fits across the table,
 * else each block wrapped to the table's width; each line centred on the bands. `{texts, size, h, x}`.
 */
function gapNotes(state, blocks, span) {
  if (!blocks.length) return null;
  const size = Math.max(...blocks.flatMap(b => b.z.map(n => n.size || LABEL.note)));
  const room = state.bounds.w - 4;
  const fits = text => textUnits(text, size) <= room;
  const joined = blocks.map(b => b.z.map(n => n.text).join(' '));
  // Wrapped where the table runs out, never where the drawn layout happened to break it.
  const wrap = text => text.split(/\s+/).reduce((out, word) => {
    const last = out[out.length - 1];
    if (last && fits(`${last} ${word}`)) out[out.length - 1] = `${last} ${word}`;
    else out.push(word);
    return out;
  }, []);
  const texts = fits(joined.join(' ')) ? [joined.join(' ')] : joined.flatMap(wrap);
  const h = (texts.length - 1) * size * LINE + size * 1.35;
  const x = Math.min(Math.max((span.x0 + span.x1) / 2, 2 + Math.max(...texts.map(t => textUnits(t, size))) / 2), state.bounds.w - 2 - Math.max(...texts.map(t => textUnits(t, size))) / 2);
  return { texts, size, h, x };
}

/** The rectangles of the pieces a zone holds. */
function zonePieces(state, kit, t) {
  const key = t.kind === 'rail' ? 'rail' : `${t.kind}:${t.z.id}`;
  return Object.values(state.pieces).filter(p => p.zone === key && !p.hidden).flatMap(p => {
    const reach = radiusOf(kit, p);
    return [pieceRect(kit, p), { x0: p.at.x - reach, x1: p.at.x + reach, y0: p.at.y - reach, y1: p.at.y + reach }];
  });
}

const shift = (at, dy, dx = 0) => ({ ...at, x: Math.round((at.x + dx) * 100) / 100, y: Math.round((at.y + dy) * 100) / 100 });

/** Swap the bands of a far-instrument table, in place. Returns true when it moved anything. */
export function nearInstrument(state, kit) {
  const plan = planNear(state, kit);
  if (!plan) return false;
  const zoneKeys = { tray: 'tray', slot: 'slot', container: 'container' };
  const moveZone = (t, dy, dx) => {
    t.z.at = shift(t.z.at, dy, dx);
    const key = t.kind === 'rail' ? 'rail' : `${zoneKeys[t.kind]}:${t.z.id}`;
    for (const p of Object.values(state.pieces)) {
      if (p.zone !== key) continue;
      p.at = shift(p.at, dy, dx);
    }
  };
  for (const [band, dy, dx] of [['instrument', plan.dyInstrument, 0], ['pieces', plan.dyPieces, plan.dxPieces || 0]]) {
    for (const t of plan.move[band]) {
      if (t.type === 'zone') moveZone(t, dy, dx);
      else if (t.type === 'piece') t.z.at = shift(t.z.at, dy, dx);
      else if (t.type === 'notes') for (const n of t.z) n.at = shift(n.at, dy, dx);
      else t.z.at = shift(t.z.at, dy, dx);
      if (t.rectsBelow) t.z.labelsBelow = true;
    }
  }
  // A tray or container now at the near edge that could be given more pieces than it holds fills upward (`snap.js`).
  const loose = Object.values(state.pieces).filter(p => !p.fixed && !p.hidden).length;
  for (const t of plan.move.instrument) {
    if (t.type !== 'zone' || (t.kind !== 'tray' && t.kind !== 'container') || t.z.orbit || t.z.spot || t.z.nucleus || t.z.round) continue;
    const cell = t.z.cell || CELL;
    const holds = Math.max(1, Math.floor(t.rect.w / cell)) * Math.max(1, Math.floor(t.rect.h / (t.z.cellH || cell)));
    if (holds < loose) t.z.growUp = true;
  }
  // A piece's home (where it goes back to when put out of a seat) moves with the band it stands in, which need not be
  // the band of the zone it starts in.
  for (const p of Object.values(state.pieces)) {
    const far = p.home.y > plan.cut;
    p.home = shift(p.home, far ? plan.dyPieces : plan.dyInstrument, far ? plan.dxPieces || 0 : 0);
  }
  if (plan.grow) state.bounds = { ...state.bounds, h: state.bounds.h + plan.grow };
  if (plan.notes) {
    const gone = new Set(plan.lines.flatMap(b => b.z));
    const { texts, size, h, x } = plan.notes;
    // Baseline of the first line: the block's box is centred in the gap.
    const first = (plan.gapAt.y0 + plan.gapAt.y1) / 2 - h / 2 + size * 1.05;
    state.notes = state.notes.filter(n => !gone.has(n)).concat(texts.map((text, i) => ({
      at: { x: Math.round(x * 100) / 100, y: Math.round((first + i * size * LINE) * 100) / 100 },
      text, align: 'center', ...(size !== LABEL.note ? { size } : {})
    })));
  }
  state.near = true;
  return true;
}

/**
 * Mark the tables of a quest's fight stages (`encounter`) as fights, so the swap keeps the foe's corner clear on them and
 * only on them. A boss file calls it once on its `STAGES`; the table spec is copied, never changed, because a phase may
 * share its spec with the bench it reviews.
 */
export function markFights(stages) {
  for (const st of stages) {
    if (!st?.encounter || !st.table) continue;
    const d = Object.getOwnPropertyDescriptor(st, 'table');
    if (d && 'value' in d) st.table = { ...st.table, foe: true };
    else if (d?.get) {
      const get = d.get;
      Object.defineProperty(st, 'table', { ...d, get() { return { ...get.call(this), foe: true }; } });
    }
  }
  return stages;
}
