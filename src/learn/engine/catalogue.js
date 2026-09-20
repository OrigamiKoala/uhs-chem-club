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
 * NO DRAG. Filing is two taps — take a card, then tap the slot. A drag on a
 * grid of 40 px cells is the one gesture a student on a phone cannot make
 * reliably, and the floor for this product is a phone (PRODUCT.md §4).
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
function readEntry(entry) {
  if (entry === null || entry === undefined) return { kind: 'gap' };
  const str = String(entry);
  return str.startsWith('#')
    ? { kind: 'slot', id: str.slice(1) }
    : { kind: 'fixed', id: str };
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

    this.onClick = e => this.handleClick(e);
    this.host.addEventListener('click', this.onClick);
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
    const cell = e.target.closest('[data-cat]');
    if (!cell) return;
    const role = cell.dataset.cat;

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
      const cardId = this.held;
      this.placed[slotId] = cardId;
      this.drawer = this.drawer.filter(x => x !== cardId);
      this.held = null;
      this.render();
      this.onPlace?.(slotId, cardId);
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
      ? `data-cat="slot" data-slot="${escText(slotId)}"`
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
    this.host.innerHTML = '';
  }
}
