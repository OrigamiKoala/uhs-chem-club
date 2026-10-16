/**
 * catalogue.js — The catalogue board: the third Learn instrument.
 *
 * The sampler scope resolved matter down to the piece. The core bench opened one
 * piece up. This one is the refinery's FILING SYSTEM: one card per kind the
 * scope has ever logged, and a board of empty slots to lay them out on.
 *
 * It is an INSTRUMENT, not a lesson. It knows how to show a card, how to read
 * one out loud when it is tapped, and how to move one between the drawer and a
 * slot. It knows no chemistry: what is printed on a card, what order the cards
 * belong in and whether a layout is right are all the quest's business. The
 * board has no opinion about where a card goes — it will file any card in any
 * slot and never says a word about it.
 *
 * WHY PLATE CARDS AND NOT A CANVAS. A catalogue is a card index. Drawing it into
 * an aperture would make it an optical reading of something, which it is not,
 * and it would put every code and every count into a bitmap that cannot be
 * selected, cannot be read out and cannot reflow at 375 px. Built as real
 * elements it is legible on a phone, it survives a text-size preference, and it
 * inherits the plate treatment the rest of the bench already has.
 *
 * FILING IS DRAG, AND TWO TAPS ALWAYS WORKS. Drag a card to a slot, or take it
 * with a tap and tap the slot. The two end in the same `fileCard`, so a stage
 * grades the same by either hand (plan §2.2). A board declared as a STRIP
 * (`board.strip`) is a row cards are laid along: a card dropped on a slot that
 * is already filled PUSHES the row along to the nearest gap instead of swapping
 * places with what was there, so putting a card "between" two others is one
 * move. This used to be taps only, on the argument that a drag on a grid of
 * 40 px cells is a gesture a phone cannot make reliably; the tap twin is what
 * keeps that true, and a drag now starts only after the pointer has moved.
 *
 * Aesthetic contract (CLAUDE.md §3, §4): machined plate with a cut corner,
 * engraved mono type, seams light above and dark below. Amber is a signal —
 * the card in the hand and a lit tag, and nothing else.
 */

function escText(str) {
  return String(str ?? '').replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

/**
 * Split a board row entry.
 *   '#slot-id'  an empty slot a card can be filed into
 *   'card-id'   a card already filed, fixed, readable but not movable
 *   null        a gap in the layout — structure, not a place
 */
export function readEntry(entry) {
  if (entry === null || entry === undefined) return { kind: 'gap' };
  const str = String(entry);
  return str.startsWith('#')
    ? { kind: 'slot', id: str.slice(1) }
    : { kind: 'fixed', id: str };
}

/**
 * The slots of the board row that holds `slotId`, left to right. Gaps in the
 * layout are structure and not places, so a strip pushes straight across one.
 */
export function rowSlots(board, slotId) {
  for (const row of board?.rows || []) {
    const ids = [];
    for (const entry of row) {
      const e = readEntry(entry);
      if (e.kind === 'slot') ids.push(e.id);
    }
    if (ids.includes(slotId)) return ids;
  }
  return [slotId];
}

/**
 * File `cardId` into `slotId`. Pure: it takes the board's `placed` map and the
 * drawer and returns new ones, and the drawn and the built board both use it,
 * so a drag and two taps (and the two benches) cannot disagree.
 *
 *   - an empty slot takes the card;
 *   - on a STRIP (`board.strip`) a filled slot makes room: the cards from there
 *     along shift one place toward the nearest empty slot on the right, else on
 *     the left, and the card goes in. A full row sends the displaced card back
 *     to the drawer;
 *   - on any other board a filled slot hands its card to the place the dragged
 *     card came from, or back to the drawer when that was the drawer.
 * A card that was filed elsewhere leaves that slot first. Nothing is ever lost:
 * every card ends in a slot or in the drawer.
 *
 * @param {{rows: Array, strip?: boolean}|null} board
 * @param {Object<string,string>} placed slotId -> cardId
 * @param {string[]} drawer
 */
export function fileCard(board, placed, drawer, slotId, cardId) {
  const next = { ...placed };
  const loose = drawer.filter(c => c !== cardId);
  const from = Object.keys(next).find(k => next[k] === cardId) ?? null;
  if (from) delete next[from];

  const sitting = next[slotId];
  if (!sitting) { next[slotId] = cardId; return { placed: next, drawer: loose }; }

  if (!board?.strip) {
    if (from) next[from] = sitting; else loose.push(sitting);
    next[slotId] = cardId;
    return { placed: next, drawer: loose };
  }

  const row = rowSlots(board, slotId);
  const k = row.indexOf(slotId);
  const right = row.findIndex((id, i) => i > k && !next[id]);
  const left = row.reduce((at, id, i) => (i < k && !next[id] ? i : at), -1);
  if (right >= 0) {
    for (let i = right; i > k; i--) next[row[i]] = next[row[i - 1]];
  } else if (left >= 0) {
    for (let i = left; i < k; i++) next[row[i]] = next[row[i + 1]];
  } else {
    loose.push(sitting);
  }
  next[slotId] = cardId;
  return { placed: next, drawer: loose };
}

export class CatalogueBoard {
  /**
   * @param {HTMLElement} host element the board is rendered into
   * @param {{
   *   onProbe?: (cardId: string) => void,
   *   onPlace?: (slotId: string, cardId: string|null) => void,
   *   onLift?: (slotId: string, cardId: string) => void
   * }} opts
   */
  constructor(host, opts = {}) {
    this.host = host;
    this.onProbe = opts.onProbe || null;
    this.onPlace = opts.onPlace || null;
    this.onLift = opts.onLift || null;

    this.cards = {};      // id -> card record
    this.board = null;    // { rows: [...] }
    this.drawer = [];     // card ids loose in the drawer
    this.placed = {};     // slotId -> cardId
    this.held = null;     // the card in the hand
    this.tags = {};       // cardId | slotId -> short status text
    this.disposed = false;

    this.drag = null;     // { cardId, from, el, ghost, startX, startY, moved }
    this.skipClick = false;

    this.onClick = e => {
      if (this.skipClick) { this.skipClick = false; return; }
      this.handleClick(e);
    };
    this.onDown = e => this.dragDown(e);
    this.onMove = e => this.dragMove(e);
    this.onUp = e => this.dragUp(e);
    this.host.addEventListener('click', this.onClick);
    this.host.addEventListener('pointerdown', this.onDown);
  }

  /* ---------------- contents ---------------- */

  /**
   * @param {{
   *   cards: Object<string, {code: string, name: string, pips?: number, tag?: string}>,
   *   board?: {rows: Array<Array<string|null>>, label?: string, columns?: string[]},
   *   drawer?: string[],
   *   drawerLabel?: string
   * }} spec
   */
  setStage(spec) {
    this.cards = spec.cards || {};
    this.board = spec.board || null;
    this.drawer = (spec.drawer || []).slice();
    this.drawerLabel = spec.drawerLabel || 'Loose cards';
    this.placed = {};
    this.held = null;
    this.tags = {};
    this.render();
  }

  /** Every slot the board declares, in reading order. */
  slotIds() {
    const out = [];
    for (const row of this.board?.rows || []) {
      for (const entry of row) {
        const e = readEntry(entry);
        if (e.kind === 'slot') out.push(e.id);
      }
    }
    return out;
  }

  /** What is filed where, as a plain object the quest can grade. */
  placements() {
    return { ...this.placed };
  }

  /** Put every filed card back in the drawer. */
  clearBoard() {
    for (const [slotId, cardId] of Object.entries(this.placed)) {
      if (cardId && !this.drawer.includes(cardId)) this.drawer.push(cardId);
    }
    this.placed = {};
    this.held = null;
    this.render();
  }

  /** A short status stencilled on a card or a slot. '' clears it. */
  setTag(id, text) {
    if (text) this.tags[id] = text;
    else delete this.tags[id];
    this.render();
  }

  /** The card currently in the hand, or null. */
  heldCard() {
    return this.held;
  }

  /* ---------------- input ---------------- */

  handleClick(e) {
    const cell = e.target.closest('[data-cat], [data-slot]');
    if (!cell) return;
    const role = cell.dataset.cat || (cell.dataset.slot ? 'slot' : null);

    if (role === 'fixed') {
      this.onProbe?.(cell.dataset.card);
      return;
    }

    if (role === 'drawer') {
      const id = cell.dataset.card;
      // Tapping the card already in the hand puts it down again, so a player
      // who took the wrong one is never stuck holding it.
      this.held = this.held === id ? null : id;
      this.render();
      this.onProbe?.(id);
      return;
    }

    if (role === 'slot') {
      const slotId = cell.dataset.slot;
      const sitting = this.placed[slotId];

      // A card in the hand and a filled slot: file it there, as a drop would.
      if (sitting && this.held && this.held !== sitting) {
        this.fileInto(slotId, this.held);
        return;
      }

      if (sitting) {
        // A filed card lifts back into the drawer, and reads itself on the way.
        delete this.placed[slotId];
        if (!this.drawer.includes(sitting)) this.drawer.push(sitting);
        this.held = null;
        this.render();
        this.onLift?.(slotId, sitting);
        this.onProbe?.(sitting);
        return;
      }

      if (!this.held) {
        this.onPlace?.(slotId, null);
        return;
      }
      this.fileInto(slotId, this.held);
    }
  }

  /** The one way a card reaches a slot, by tap or by drag. */
  fileInto(slotId, cardId) {
    const r = fileCard(this.board, this.placed, this.drawer, slotId, cardId);
    this.placed = r.placed;
    this.drawer = r.drawer;
    this.held = null;
    this.render();
    this.onPlace?.(slotId, cardId);
  }

  /* ---------------- drag ----------------

     A press on a loose card or a filed one arms a drag. It becomes one only
     after the pointer has moved, so a tap is still a tap. The card follows the
     pointer as a ghost; released over a slot it is filed there, released over
     the drawer a filed card is taken back, released anywhere else nothing
     changes. The click that ends the press is swallowed. */

  dragDown(e) {
    if (e.button !== undefined && e.button !== 0) return;
    const el = e.target.closest?.('.cat-cell[data-card]');
    if (!el) return;
    const role = el.dataset.cat;
    if (role !== 'drawer' && role !== 'slot') return;
    this.drag = {
      cardId: el.dataset.card, from: role === 'slot' ? el.dataset.slot : null, el,
      startX: e.clientX, startY: e.clientY, ghost: null, moved: false
    };
    window.addEventListener('pointermove', this.onMove);
    window.addEventListener('pointerup', this.onUp);
    window.addEventListener('pointercancel', this.onUp);
  }

  dragMove(e) {
    const d = this.drag;
    if (!d) return;
    if (!d.moved) {
      if (Math.hypot(e.clientX - d.startX, e.clientY - d.startY) < 6) return;
      d.moved = true;
      const box = d.el.getBoundingClientRect();
      d.dx = d.startX - box.left;
      d.dy = d.startY - box.top;
      d.ghost = d.el.cloneNode(true);
      d.ghost.classList.add('cat-ghost');
      d.ghost.style.width = `${box.width}px`;
      d.ghost.style.height = `${box.height}px`;
      document.body.appendChild(d.ghost);
      d.el.classList.add('dragging');
    }
    d.ghost.style.left = `${e.clientX - d.dx}px`;
    d.ghost.style.top = `${e.clientY - d.dy}px`;
    this.host.querySelectorAll('.drop').forEach(n => n.classList.remove('drop'));
    this.dropCell(e)?.classList.add('drop');
  }

  /** The slot cell under the pointer, if any. */
  dropCell(e) {
    const under = document.elementFromPoint?.(e.clientX, e.clientY);
    return under?.closest?.('[data-slot]') || null;
  }

  dragUp(e) {
    const d = this.drag;
    window.removeEventListener('pointermove', this.onMove);
    window.removeEventListener('pointerup', this.onUp);
    window.removeEventListener('pointercancel', this.onUp);
    this.drag = null;
    if (!d || !d.moved) return;
    this.skipClick = true;
    setTimeout(() => { this.skipClick = false; }, 0);
    const cell = e.type === 'pointercancel' ? null : this.dropCell(e);
    d.ghost?.remove();
    d.el.classList.remove('dragging');
    this.host.querySelectorAll('.drop').forEach(n => n.classList.remove('drop'));
    if (cell) {
      const slotId = cell.dataset.slot;
      if (slotId !== d.from) this.fileInto(slotId, d.cardId);
      return;
    }
    // Dropped back on the drawer: a filed card is taken out of its slot.
    const back = document.elementFromPoint?.(e.clientX, e.clientY)?.closest?.('.cat-drawer-wrap');
    if (back && d.from) {
      delete this.placed[d.from];
      if (!this.drawer.includes(d.cardId)) this.drawer.push(d.cardId);
      this.held = null;
      this.render();
      this.onLift?.(d.from, d.cardId);
    }
  }

  /* ---------------- drawing ---------------- */

  render() {
    if (this.disposed) return;
    this.host.innerHTML = `
      <div class="cat-rig">
        ${this.board ? this.renderBoard() : ''}
        ${this.renderDrawer()}
      </div>
    `;
  }

  renderBoard() {
    const rows = this.board.rows || [];
    const cols = rows.reduce((n, r) => Math.max(n, r.length), 1);
    const heads = this.board.columns || null;

    const body = rows.map(row => row.map(entry => {
      const e = readEntry(entry);
      if (e.kind === 'gap') return '<span class="cat-gap" aria-hidden="true"></span>';
      if (e.kind === 'fixed') return this.cardCell(e.id, 'fixed');
      const sitting = this.placed[e.id];
      if (sitting) return this.cardCell(sitting, 'slot', e.id);
      const tag = this.tags[e.id];
      return `
        <button type="button" class="cat-slot${this.held ? ' open' : ''}" data-cat="slot" data-slot="${escText(e.id)}"
                aria-label="Empty slot ${escText(e.id)}">
          <span class="cat-slot-mark" aria-hidden="true">+</span>
          ${tag ? `<span class="cat-cell-tag">${escText(tag)}</span>` : ''}
        </button>
      `;
    }).join('')).join('');

    return `
      <div class="cat-board-wrap">
        ${this.board.label ? `<div class="eyebrow cat-board-label">${escText(this.board.label)}</div>` : ''}
        <div class="cat-board" style="--cat-cols: ${cols};" role="group" aria-label="Catalogue board">
          ${heads ? heads.map(h => `<span class="cat-head">${escText(h)}</span>`).join('') : ''}
          ${body}
        </div>
      </div>
    `;
  }

  renderDrawer() {
    const label = this.drawer.length
      ? this.drawerLabel
      : `${this.drawerLabel} — empty`;
    return `
      <div class="cat-drawer-wrap">
        <div class="eyebrow cat-board-label">${escText(label)}</div>
        <div class="cat-drawer" role="group" aria-label="Loose cards">
          ${this.drawer.length
            ? this.drawer.map(id => this.cardCell(id, 'drawer')).join('')
            : '<span class="cat-drawer-empty">Every card is on the board.</span>'}
        </div>
      </div>
    `;
  }

  /**
   * One card. `role` is where it is sitting: a fixed board entry, a card the
   * player has filed into a slot, or a loose card in the drawer.
   */
  cardCell(cardId, role, slotId = null) {
    const card = this.cards[cardId];
    if (!card) return '<span class="cat-gap" aria-hidden="true"></span>';
    const held = this.held === cardId;
    const tag = this.tags[cardId] || (slotId ? this.tags[slotId] : '');
    const pips = Number.isInteger(card.pips)
      ? `<span class="cat-cell-pips" aria-hidden="true">${'|'.repeat(Math.max(0, Math.min(8, card.pips)))}</span>`
      : '';

    const attrs = role === 'slot'
      ? `data-cat="slot" data-slot="${escText(slotId)}" data-card="${escText(cardId)}"`
      : `data-cat="${role}" data-card="${escText(cardId)}"`;

    return `
      <button type="button" class="cat-cell cat-${role}${held ? ' held' : ''}" ${attrs}
              aria-label="${escText(card.name || card.code)}${held ? ', in hand' : ''}">
        <span class="cat-cell-code">${escText(card.code)}</span>
        <span class="cat-cell-name">${escText(card.name || '')}</span>
        ${pips}
        ${tag ? `<span class="cat-cell-tag">${escText(tag)}</span>` : ''}
      </button>
    `;
  }

  dispose() {
    this.disposed = true;
    this.host.removeEventListener('click', this.onClick);
    this.host.removeEventListener('pointerdown', this.onDown);
    window.removeEventListener('pointermove', this.onMove);
    window.removeEventListener('pointerup', this.onUp);
    window.removeEventListener('pointercancel', this.onUp);
    this.drag?.ghost?.remove();
    this.drag = null;
    this.host.innerHTML = '';
  }
}
