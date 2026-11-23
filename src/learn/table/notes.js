/**
 * notes.js — Where a stage's printed how-to lines go.
 *
 * A bench teaches itself (`bench-tabletop.md`, design invariant 1): the lines a stage prints on the plate say what its tools and its
 * answer do ("Drag the lamp into its holder"). A quest says WHAT to print; this says WHERE, so a line never lands on a zone, a fixture,
 * a label, a piece or another line, and a table that is rearranged later does not leave a note under a tray.
 *
 * Pure, no DOM, no THREE, deterministic: the same stage always gets its lines in the same place, and `verify:table` holds the result to
 * the same layout audit as everything else (`audit.js`), so a line that could not be placed fails the build and is never half placed.
 *
 *   applyNotes(STAGES, { 1: ['Drag the lamp into its holder.', 'Turn the Colour dial.'], 3: [...] })
 *
 * keys are 1-based stage numbers; each value is one block of lines (printed one under the other, left aligned). A stage that already
 * declares `notes` keeps them; the new block is placed clear of those too.
 */

import { createTable } from './model.js';
import { getKit } from './kits/index.js';
import { SIZES, rectOf } from './snap.js';
import { labelRects, noteRect, captionRect, lineBox, LABEL, foePadOf, textUnits } from './layout.js';
import { pieceRect } from './audit.js';

/** Clear space kept round every other thing, in table units. */
const MARGIN = 0.8;
/** Clear space kept beside another printed word on the same line: closer, a how-to line reads as the end of a tray's label. */
const WORD_GAP = 6;
/** The distance between two lines of one block, in table units. */
const PITCHK = 1.5;

const hit = (a, b, gap = 0) => a.x0 < b.x1 + gap && b.x0 < a.x1 + gap && a.y0 < b.y1 + gap && b.y0 < a.y1 + gap;

/** The strips of a table printed with words (zone labels, how-to lines, tool captions). */
export function wordRects(state, kit) {
  const out = [];
  for (const [kind, zs] of [['tray', state.zones.trays], ['slot', state.zones.slots], ['container', state.zones.containers]]) {
    for (const z of Object.values(zs)) out.push(...labelRects(state, kind, z));
  }
  if (state.zones.rail) out.push(...labelRects(state, 'rail', state.zones.rail));
  for (const n of state.notes || []) out.push(noteRect(n));
  for (const p of Object.values(state.pieces)) if (p.caption && !p.hidden) out.push(captionRect(kit, p));
  return out;
}

/** Every rectangle of a stage's opening table that a printed line must stay clear of. */
export function occupied(state, kit) {
  const out = [];
  const add = r => { if (r) out.push(r); };
  for (const t of Object.values(state.zones.trays)) { add(rectOf(t, SIZES.tray)); labelRects(state, 'tray', t).forEach(add); }
  for (const t of Object.values(state.zones.slots)) { add(rectOf(t, SIZES.slot)); labelRects(state, 'slot', t).forEach(add); }
  for (const t of Object.values(state.zones.containers)) { add(rectOf(t, SIZES.container)); labelRects(state, 'container', t).forEach(add); }
  if (state.zones.rail) { add(rectOf(state.zones.rail, SIZES.rail)); labelRects(state, 'rail', state.zones.rail).forEach(add); }
  for (const f of Object.values(state.fixtures)) add(rectOf(f, SIZES.fixture));
  for (const f of Object.values(state.fetch)) if (f.at) add(rectOf(f, SIZES.site));
  add(rectOf(state.recorder.box, { w: 30, h: 18 }));
  for (const n of state.notes || []) add(noteRect(n));
  for (const p of Object.values(state.pieces)) {
    if (p.hidden) continue;
    if (p.caption) add(captionRect(kit, p));
    if (!p.zone) add(pieceRect(kit, p));
  }
  const prediction = state.prediction;
  if (prediction) for (const p of Object.values(state.pieces)) if (p.token && !p.zone) add(pieceRect(kit, p));
  return out;
}

/**
 * Find a spot for a block of `lines` (strings) on the table `spec` declares: the rectangle the block fills, as `{x, y}` of its first
 * line's left edge and baseline, or null when no clear strip is wide and tall enough.
 */
export function findNoteSpot(spec, lines, { size = LABEL.note, foe = false, packed = false } = {}) {
  // Placed on the table as the quest draws it: `near.js` then moves the line with the band it stands in.
  const state = createTable({ ...spec, layout: 'as-drawn' }, 'notes');
  const kit = getKit(state.kit);
  const { w, h } = state.bounds;
  const busy = occupied(state, kit);
  // A stage that is a fight keeps the foe's corner clear (`layout.js` `FOE_PAD`); a line of words does not stand there.
  if (foe) busy.push(foePadOf(state.bounds).rect);
  // Another printed word on the same line is kept further off than a thing is (`WORD_GAP`), across the line only.
  const words = wordRects(state, kit);
  const width = Math.max(...lines.map(l => textUnits(l, size)));
  const height = (lines.length - 1) * size * PITCHK + size * 1.35;
  // The middle of what is on the table: a line is centred on it where the strip allows.
  const span = busy.reduce((a, r) => ({ x0: Math.min(a.x0, r.x0), x1: Math.max(a.x1, r.x1) }), { x0: Infinity, x1: -Infinity });
  const mid = Number.isFinite(span.x0) ? (span.x0 + span.x1) / 2 : w / 2;
  const best = [];
  for (let y = 2.4; y + height < h - 1; y += 0.4) {
    for (let x = 2.4; x + width < w - 1.6; x += 0.8) {
      const r = { x0: x, x1: x + width, y0: y, y1: y + height };
      if (busy.some(b => hit(r, b, MARGIN))) continue;
      const level = words.filter(b => b.y0 < r.y1 + MARGIN && r.y0 < b.y1 + MARGIN);
      const crowded = level.some(b => r.x0 < b.x1 + WORD_GAP && b.x0 < r.x1 + WORD_GAP);
      best.push({ x, y, alone: !level.length, roomy: !crowded });
    }
  }
  if (!best.length) return null;
  // A strip clear of the next word on its line by `WORD_GAP` (only a table with no such strip has one closer); a strip with no other words on its line (beside a tray's label, a line reads as part of it); then the lowest (near
  // the player's hands); then the place on it nearest the middle of the table: a line set in whatever corner is left
  // over reads as dropped there.
  const off = c => Math.abs(c.x + width / 2 - mid);
  // A block placed a line at a time (`withNotes`' last resort) packs each line lowest and left-most, so it leaves the most room for the next.
  if (packed) best.sort((a, b) => b.y - a.y || a.x - b.x);
  else best.sort((a, b) => (b.roomy - a.roomy) || (b.alone - a.alone) || b.y - a.y || off(a) - off(b));
  const pick = best[0];
  // `lineBox` takes a baseline: the first line's box top is `y`, so its baseline is a little under.
  return { x: pick.x, y: pick.y + size * 1.05 };
}

/**
 * `spec` with a block of printed lines added where `findNoteSpot` finds room; throws when there is none. A block that does not fit
 * whole is set a little smaller (never under `LABEL.min`), and failing that each line finds a strip of its own, in order.
 */
export function withNotes(spec, lines, opts = {}) {
  if (!lines?.length) return spec;
  const foe = Boolean(opts.foe);
  const notes = [...(spec.notes || [])];
  const put = (text, at, size) => notes.push({ at: { x: at.x, y: Math.round(at.y * 10) / 10 }, text, ...(size !== LABEL.note ? { size } : {}) });
  for (const size of [LABEL.note, 2.3, LABEL.min]) {
    const at = findNoteSpot(spec, lines, { size, foe });
    if (at) { lines.forEach((text, i) => put(text, { x: at.x, y: at.y + i * size * PITCHK }, size)); return { ...spec, notes }; }
  }
  // Line by line, each into the strip that is left after the one before it.
  let current = spec;
  for (const text of lines) {
    let placed = null;
    for (const size of [LABEL.note, 2.3, LABEL.min]) {
      const at = findNoteSpot(current, [text], { size, foe, packed: true });
      if (at) { placed = { at, size }; break; }
    }
    if (!placed) throw new Error(`notes: no clear strip for "${text}" (${spec.pieces?.length || 0} pieces)`);
    const n = { at: { x: placed.at.x, y: Math.round(placed.at.y * 10) / 10 }, text, ...(placed.size !== LABEL.note ? { size: placed.size } : {}) };
    current = { ...current, notes: [...(current.notes || []), n] };
  }
  return current;
}

/** Lines that found no clear strip. A table that is rearranged so a note no longer fits never crashes a quest; `verify:table` fails on this. */
export const lostNotes = [];

/**
 * Print a block of lines on a stage's table, for each stage number in `byStage`. Mutates `stages` (a quest's own array) once, at load.
 * A block that finds no room is left off and recorded in `lostNotes`.
 */
export function applyNotes(stages, byStage) {
  for (const [n, lines] of Object.entries(byStage)) {
    const stage = stages[Number(n) - 1];
    if (!stage?.table) { lostNotes.push(`stage ${n} has no table`); continue; }
    try { stage.table = withNotes(stage.table, lines, { foe: Boolean(stage.encounter) }); } catch (e) { lostNotes.push(`stage ${n} "${stage.title}": ${e.message}`); }
  }
  return stages;
}

export { lineBox };
