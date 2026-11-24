/**
 * npc-card.js — the card a crew member's lines appear on, and the carry chip for a task item.
 *
 * The card sits at the bottom of the view: the speaker's name and role, one line at a time. [E], a click or
 * a tap on it shows the next line; after the last it closes. Esc closes it. Walking away closes it (the
 * crew runtime calls `closeLineCard` when the player is more than 4 m off). The world keeps running behind
 * it; nothing over the live canvas carries a backdrop-filter.
 */

let card = null;
let state = null;   // { lines, i, onClose }
let chip = null;

const CSS = `
#npc-card { position: fixed; left: 50%; bottom: 128px; transform: translateX(-50%); width: min(560px, calc(100vw - 32px));
  background: var(--plate-200, #161519); border: 1px solid var(--border-durasteel, rgba(214,196,168,0.16));
  border-top: 1px solid var(--border-strong, rgba(229,155,36,0.42)); padding: 12px 16px 10px; z-index: 1001;
  font-family: var(--font-main, sans-serif); color: var(--text-primary, #e8e2d6); cursor: pointer; user-select: none; }
#npc-card[hidden] { display: none; }
#npc-card .npc-who { display: flex; gap: 10px; align-items: baseline; margin-bottom: 6px; }
#npc-card .npc-name { font-family: var(--font-mono, monospace); font-size: 0.78rem; letter-spacing: 0.12em; color: var(--accent-amber, #e59b24); text-transform: uppercase; }
#npc-card .npc-role { font-size: 0.72rem; color: var(--text-muted, #9a958c); }
#npc-card .npc-line { font-size: 0.95rem; line-height: 1.45; margin: 0; }
#npc-card .npc-next { margin-top: 8px; text-align: right; font-family: var(--font-mono, monospace); font-size: 0.72rem; font-weight: 600; letter-spacing: 0.1em; color: var(--accent-amber, #e59b24); }
#npc-carry { position: fixed; left: 16px; bottom: 16px; z-index: 1000; padding: 5px 10px; pointer-events: none;
  background: var(--plate-200, #161519); border: 1px solid var(--border-durasteel, rgba(214,196,168,0.16));
  font-family: var(--font-mono, monospace); font-size: 0.72rem; letter-spacing: 0.08em; color: var(--accent-gold, #cca56e); }
#npc-carry[hidden] { display: none; }
body.touch-walking #npc-card { bottom: 168px; }
`;

function ensure() {
  if (card || typeof document === 'undefined') return;
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);
  card = document.createElement('div');
  card.id = 'npc-card';
  card.hidden = true;
  card.setAttribute('role', 'dialog');
  card.setAttribute('aria-live', 'polite');
  card.innerHTML = '<div class="npc-who"><span class="npc-name"></span><span class="npc-role"></span></div><p class="npc-line"></p><div class="npc-next"></div>';
  card.addEventListener('click', e => { e.stopPropagation(); advanceLineCard(); });
  // The walk's mouse-look and click-to-act listen on the window; a press on the card is the card's.
  card.addEventListener('pointerdown', e => e.stopPropagation());
  card.addEventListener('mousedown', e => e.stopPropagation());
  card.addEventListener('touchstart', e => e.stopPropagation(), { passive: true });
  document.body.appendChild(card);
  chip = document.createElement('div');
  chip.id = 'npc-carry';
  chip.hidden = true;
  document.body.appendChild(chip);
  window.addEventListener('keydown', e => {
    if (!isLineCardOpen()) return;
    if (e.code === 'Escape') closeLineCard();
    else if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); advanceLineCard(); }
  });
}

function render() {
  const { lines, i } = state;
  card.querySelector('.npc-line').textContent = lines[i];
  const touch = document.body.classList.contains('touch-primary');
  card.querySelector('.npc-next').textContent = i < lines.length - 1
    ? (touch ? 'TAP FOR MORE' : '[E] MORE')
    : (touch ? 'TAP TO CLOSE' : '[E] CLOSE');
}

/** Show `lines` said by `name` (`role` under it). `onClose` runs once when the card closes, however it closes. */
export function openLineCard({ name, role, lines, onClose }) {
  ensure();
  if (!card || !lines?.length) { onClose?.(); return; }
  if (state) closeLineCard();
  state = { lines, i: 0, onClose };
  card.querySelector('.npc-name').textContent = name;
  card.querySelector('.npc-role').textContent = role || '';
  render();
  card.hidden = false;
}

export function isLineCardOpen() {
  return Boolean(state);
}

/** The next line, or close after the last. */
export function advanceLineCard() {
  if (!state) return;
  if (state.i < state.lines.length - 1) {
    state.i++;
    render();
  } else {
    closeLineCard();
  }
}

export function closeLineCard() {
  if (!state) return;
  const done = state.onClose;
  state = null;
  if (card) card.hidden = true;
  done?.();
}

/** The carry chip: what the player is carrying for a crew member, or `null` to clear it. */
export function setCrewCarry(label) {
  ensure();
  if (!chip) return;
  chip.hidden = !label;
  chip.textContent = label ? `Carrying ${label}` : '';
}
