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
/** The distance between two lines of one block, in table units. */
const PITCHK = 1.5;

const hit = (a, b, gap = 0) => a.x0 < b.x1 + gap && b.x0 < a.x1 + gap && a.y0 < b.y1 + gap && b.y0 < a.y1 + gap;

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
export function findNoteSpot(spec, lines, { size = LABEL.note, foe = false } = {}) {
  const state = createTable(spec, 'notes');
  const kit = getKit(state.kit);
  const { w, h } = state.bounds;
  const busy = occupied(state, kit);
  // A stage that is a fight keeps the foe's corner clear (`layout.js` `FOE_PAD`); a line of words does not stand there.
  if (foe) busy.push(foePadOf(state.bounds).rect);
  const width = Math.max(...lines.map(l => textUnits(l, size)));
  const height = (lines.length - 1) * size * PITCHK + size * 1.35;
  const best = [];
  for (let y = 2.4; y + height < h - 1; y += 0.4) {
    for (let x = 2.4; x + width < w - 1.6; x += 0.8) {
      const r = { x0: x, x1: x + width, y0: y, y1: y + height };
      if (busy.some(b => hit(r, b, MARGIN))) continue;
      best.push({ x, y });
    }
  }
  if (!best.length) return null;
  // The lowest free strip, then the left-most: near the player's hands, where the pieces start, reading left to right.
  best.sort((a, b) => b.y - a.y || a.x - b.x);
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
      const at = findNoteSpot(current, [text], { size, foe });
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
