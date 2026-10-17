/**
 * rail.js — A row of pieces the player arranges by dragging them into place.
 *
 * ORDERING IS ALWAYS DRAGGING INTO PLACE, NEVER CLICKING IN SEQUENCE. A rail is
 * the one shape every "order / rank / arrange" task takes, on the drawn
 * tabletop (`table2d.js`), in the `order` answer widget (`stagerunner.js`) and,
 * at T4, on the plate. The answer is the left-to-right arrangement as it
 * stands, so a player who has not touched it still has an answer (a wrong one
 * by construction: `startArrangement` is never the identity).
 *
 * THIS FILE HOLDS THE RULES AND NO VIEW. Pick one up, and the others slide
 * apart to open a gap; drop it in. The two-tap twin is tap a piece, then tap
 * the gap it goes in. Both end in the same `reorder`, which is why a stage
 * grades the same by either hand (`verify:table` drives both).
 *
 * No DOM, no THREE. Deterministic and serialisable.
 */

import { mulberry32, hashId } from '../engine/plates.js';

/**
 * The arrangement a rail starts in: a fixed shuffle of `ids`, the same every
 * time for the same ids and key, and never the order they were declared in.
 * Quests declare items in answer-adjacent order more often than not, so the
 * identity is the one arrangement a rail must never start from. `verify:table`
 * also checks the start against each stage's solution.
 *
 * @param {string[]} ids
 * @param {string} [key] extra seed text (a stage title), so two rails with the
 *                       same ids need not shuffle alike
 */
export function startArrangement(ids, key = '') {
  const out = ids.slice();
  if (out.length < 2) return out;
  const rnd = mulberry32(hashId(`${key}|${ids.join('|')}`));
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  if (out.every((id, i) => id === ids[i])) out.push(out.shift());
  return out;
}

/**
 * Move `id` so it sits at `index` among the OTHER pieces (0 = before all of
 * them, n-1 = after all of them). That is the number a gap has, whichever way
 * the piece reached it. Returns a new array.
 */
export function reorder(order, id, index) {
  const at = order.indexOf(id);
  if (at < 0) return order.slice();
  const rest = order.filter(x => x !== id);
  const i = Math.max(0, Math.min(rest.length, Math.round(index)));
  rest.splice(i, 0, id);
  return rest;
}

/**
 * The gap a pointer at `x` is over, given the centre-x of every OTHER piece in
 * order: how many of them sit left of it.
 */
export function insertionIndex(centres, x) {
  let n = 0;
  for (const c of centres) if (c < x) n++;
  return n;
}

/**
 * The gaps a held piece can be tapped into. The gap it already fills is left
 * out: tapping it would change nothing and would only teach the player that
 * a tap can do nothing.
 */
export function gapsFor(order, id) {
  const at = order.indexOf(id);
  const out = [];
  for (let i = 0; i < order.length; i++) if (i !== at) out.push(i);
  return out;
}

/**
 * The state of one rail while a hand is on it. A view builds one over its
 * order, forwards what the player does and paints what it reports.
 *
 *   drag:   `dragStart(id)` → `dragTo(index)` as the pointer moves →
 *           `dragEnd()` (or `dragCancel()`)
 *   twin:   `tap(id)` picks a piece up (or puts it down again) →
 *           `tapGap(index)` drops it
 *
 * `order` is only ever changed by `dragEnd` and `tapGap`.
 */
export class RailController {
  constructor(order, onChange = null) {
    this.order = order.slice();
    this.held = null;       // two-tap: the piece in the hand
    this.dragging = null;   // drag: the piece on the pointer
    this.hover = null;      // drag: the gap it is over
    this.onChange = onChange;
  }

  setOrder(order) {
    this.order = order.slice();
    this.held = null;
    this.dragging = null;
    this.hover = null;
  }

  /** The id of whichever piece is lifted, by either hand. */
  lifted() { return this.dragging || this.held; }

  tap(id) {
    if (!this.order.includes(id)) return false;
    this.dragging = null;
    this.hover = null;
    this.held = this.held === id ? null : id;
    return true;
  }

  /** Drop the piece in the hand into gap `index`. True when the order changed. */
  tapGap(index) {
    if (!this.held) return false;
    const id = this.held;
    this.held = null;
    return this.commit(id, index);
  }

  dragStart(id) {
    if (!this.order.includes(id)) return false;
    this.held = null;
    this.dragging = id;
    this.hover = this.order.indexOf(id);
    return true;
  }

  dragTo(index) {
    if (!this.dragging) return;
    this.hover = Math.max(0, Math.min(this.order.length - 1, index));
  }

  dragEnd() {
    if (!this.dragging) return false;
    const id = this.dragging;
    const index = this.hover;
    this.dragging = null;
    this.hover = null;
    return this.commit(id, index);
  }

  dragCancel() {
    this.dragging = null;
    this.hover = null;
  }

  commit(id, index) {
    const next = reorder(this.order, id, index);
    const changed = next.join('|') !== this.order.join('|');
    this.order = next;
    if (changed) this.onChange?.(this.order.slice(), id);
    return changed;
  }
}
