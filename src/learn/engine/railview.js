/**
 * railview.js — The `order` answer widget: a rail of pieces dragged into place.
 *
 * The widget used to have the player tap the items one after another, each tap
 * numbering the next place, with a "Clear Order" key to start over. That is a
 * quiz. A row of pieces on a rail that you pick up and put down in another
 * place is a thing you DO, and the arrangement as it stands is the answer
 * (plan §2.2). The rules live in `table/rail.js` (`RailController`), shared
 * with the drawn tabletop's rail; this file is the DOM that shows them.
 *
 *   DRAG   press a piece and move: it comes off the rail and the others slide
 *          apart to open a gap where it would land; release to drop it in.
 *   TWIN   tap a piece (it is held), then tap the gap it goes in. Tapping the
 *          held piece again puts it down. Touch, a trackpad and a phone at
 *          375 px all use this one.
 *
 * Both end in `RailController.commit`, so a stage grades the same by either
 * hand, and both write the same `state.order`: the ids, left to right, which
 * is exactly what every stage's `check()` already reads.
 *
 * The rail's ends carry plain labels the prompt uses (`widget.rail.first` on
 * the left, `.last` on the right), so which way "first" runs is never a guess.
 */

import { esc } from '../../ui/layout.js';
import { RailController, insertionIndex, gapsFor } from '../table/rail.js';

/** Pixels the pointer must move before a press becomes a drag. */
const DRAG_SLOP = 5;

export function railMarkup(w, order) {
  const byId = new Map(w.items.map(o => [o.id, o]));
  const rail = w.rail || {};
  return `
    <div class="lq-answer lq-rail-answer">
      <span class="form-label">${esc(w.label)}</span>
      <div class="lq-rail" role="group" aria-label="${esc(w.label)}">
        <div class="lq-rail-ends">
          <span class="lq-rail-end lq-rail-end-first">${esc(rail.first || '')}</span>
          <span class="lq-rail-line" aria-hidden="true"></span>
          <span class="lq-rail-end lq-rail-end-last">${esc(rail.last || '')}</span>
        </div>
        <div class="lq-rail-track" data-rail-track>
          ${order.map(id => `
            <button type="button" class="lq-rail-piece" data-rail-piece="${esc(id)}" aria-pressed="false">
              <span class="lq-rail-label">${esc(byId.get(id)?.label ?? id)}</span>
            </button>
          `).join('')}
        </div>
      </div>
      <p class="form-help">Drag a piece into place, or tap it and then tap the gap.</p>
    </div>
  `;
}

/**
 * Wire a rendered rail. `opts.order` is the arrangement it starts in;
 * `opts.onOrder(order)` hears every change (and nothing else changes the order).
 * Returns `{ controller, dispose }`.
 */
export function bindRail(root, opts) {
  const ctl = new RailController(opts.order, order => opts.onOrder?.(order));
  const track = root.querySelector('[data-rail-track]');
  const labelOf = new Map(opts.items.map(o => [o.id, o.label]));
  const listeners = [];
  let drag = null;       // { id, el, hole, scale, at, startX, startY, moved }
  let suppressClick = false;

  const on = (el, type, fn, o) => {
    el.addEventListener(type, fn, o);
    listeners.push(() => el.removeEventListener(type, fn, o));
  };

  /**
   * Repaint the track from the controller: pieces in order, and while one is
   * held a gap before each place it could go. A gap's `data-rail-gap` is its
   * INSERTION index among the pieces other than the held one, which is the
   * number `reorder` takes; the gap that would leave the order as it is is not
   * drawn.
   */
  function paint() {
    if (!track) return;
    const held = ctl.held;
    const gaps = new Set(held ? gapsFor(ctl.order, held) : []);
    let html = '';
    let j = 0;
    for (const id of ctl.order) {
      const isHeld = held === id;
      if (!isHeld && gaps.has(j)) html += gapMarkup(j);
      html += `
        <button type="button" class="lq-rail-piece${isHeld ? ' held' : ''}" data-rail-piece="${esc(id)}" aria-pressed="${isHeld}">
          <span class="lq-rail-label">${esc(labelOf.get(id) ?? id)}</span>
        </button>`;
      if (!isHeld) j++;
    }
    if (gaps.has(j)) html += gapMarkup(j);
    track.innerHTML = html;
    track.classList.toggle('holding', Boolean(held));
  }

  function gapMarkup(i) {
    return `<button type="button" class="lq-rail-gap" data-rail-gap="${i}" aria-label="Place here"></button>`;
  }

  on(root, 'click', e => {
    if (suppressClick) { suppressClick = false; return; }
    const gap = e.target.closest?.('[data-rail-gap]');
    if (gap) {
      if (ctl.tapGap(Number(gap.dataset.railGap))) { opts.onMoved?.(); }
      paint();
      return;
    }
    const piece = e.target.closest?.('[data-rail-piece]');
    if (piece) {
      ctl.tap(piece.dataset.railPiece);
      paint();
    }
  });

  on(root, 'pointerdown', e => {
    const el = e.target.closest?.('[data-rail-piece]');
    if (!el || (e.button !== undefined && e.button !== 0)) return;
    const box = el.getBoundingClientRect();
    drag = {
      id: el.dataset.railPiece, el, hole: null, pointer: e.pointerId,
      startX: e.clientX, startY: e.clientY, w: box.width, h: box.height, moved: false
    };
    try { el.setPointerCapture?.(e.pointerId); } catch { /* a stub or a lost pointer */ }
  });

  on(root, 'pointermove', e => {
    if (!drag || e.pointerId !== drag.pointer) return;
    if (!drag.moved) {
      if (Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY) < DRAG_SLOP) return;
      lift();
    }
    place(e);
  });

  const release = e => {
    if (!drag || (e && e.pointerId !== drag.pointer)) return;
    const d = drag;
    drag = null;
    try { d.el.releasePointerCapture?.(d.pointer); } catch { /* already gone */ }
    if (!d.moved) return;          // a tap: the click that follows is the two-tap
    suppressClick = true;
    // A click only follows a press that ended on the same element; clear the
    // flag on the next turn so a drag never swallows the NEXT real tap.
    setTimeout(() => { suppressClick = false; }, 0);
    ctl.dragEnd();
    paint();
    opts.onMoved?.();
  };
  on(root, 'pointerup', release);
  on(root, 'pointercancel', e => {
    if (!drag) return;
    const d = drag;
    drag = null;
    if (d.moved) { ctl.dragCancel(); paint(); }
  });

  /*
   * The piece on the pointer is moved with a TRANSFORM, never with
   * `position: fixed`: at T4 this widget lives on a panel that is itself
   * transformed, and a fixed child of a transformed parent is positioned
   * against that parent, not the window. A translate is relative to the piece's
   * own place, so it follows the pointer on a flat page and on a panel alike;
   * `scale` is how many screen pixels one of the piece's own pixels is.
   */

  /** Take the piece off the rail: lift it out of the flow and leave a hole the same size. */
  function lift() {
    drag.moved = true;
    ctl.dragStart(drag.id);
    const el = drag.el;
    const hole = document.createElement('span');
    hole.className = 'lq-rail-hole';
    hole.style.flex = '1 1 0';
    el.before(hole);
    drag.hole = hole;
    const own = el.offsetWidth || drag.w || 1;
    drag.scale = (drag.w / own) || 1;
    const s = el.style;
    s.position = 'absolute';
    s.left = `${el.offsetLeft || 0}px`;
    s.top = `${el.offsetTop || 0}px`;
    s.width = `${own}px`;
    s.height = `${el.offsetHeight || drag.h}px`;
    s.margin = '0';
    s.zIndex = '30';
    s.pointerEvents = 'none';
    el.classList.add('lifted');
  }

  /** Follow the pointer, and slide the hole to the gap it is over. */
  function place(e) {
    drag.el.style.transform = `translate(${(e.clientX - drag.startX) / drag.scale}px, ${(e.clientY - drag.startY) / drag.scale}px)`;
    const others = [...track.querySelectorAll('[data-rail-piece]')].filter(p => p !== drag.el);
    const centres = others.map(p => { const r = p.getBoundingClientRect(); return r.left + r.width / 2; });
    const index = insertionIndex(centres, e.clientX);
    ctl.dragTo(index);
    if (drag.at === index) return;
    drag.at = index;
    const before = new Map(others.map(p => [p, p.getBoundingClientRect().left]));
    const anchor = others[index] || null;
    if (anchor) anchor.before(drag.hole); else track.appendChild(drag.hole);
    // The others slide to their new places instead of jumping.
    for (const p of others) {
      const dx = before.get(p) - p.getBoundingClientRect().left;
      if (!dx) continue;
      p.style.transition = 'none';
      p.style.transform = `translateX(${dx / drag.scale}px)`;
      requestAnimationFrame(() => {
        p.style.transition = 'transform 0.14s ease-out';
        p.style.transform = '';
      });
    }
  }

  return {
    controller: ctl,
    dispose() { listeners.forEach(off => off()); listeners.length = 0; drag = null; }
  };
}
