/**
 * modal.js — Centered overlay dialog.
 *
 * #modal-container previously had no styling at all, so anything rendered into it
 * (including the Quest 1 completion payoff) landed below the fold and was never seen.
 */

let lastFocused = null;
let keyHandler = null;
let backdropHandler = null;

// The container is one element reused by every dialog, so a listener left on it
// outlives the dialog that added it: the next dialog's backdrop press would also
// run every earlier dialog's close, with that dialog's onClose.
function detachHandlers(modal) {
  if (keyHandler) {
    document.removeEventListener('keydown', keyHandler);
    keyHandler = null;
  }
  if (backdropHandler) {
    modal?.removeEventListener('click', backdropHandler);
    backdropHandler = null;
  }
}

/**
 * @param {string} innerHtml markup for the card body (wrapped in .glass-panel .modal-card)
 * @param {{ dismissible?: boolean, onClose?: Function, labelledBy?: string }} opts
 * @returns {HTMLElement|null} the modal container
 */
export function showModal(innerHtml, opts = {}) {
  const { dismissible = true, onClose = null, labelledBy = null } = opts;
  const modal = document.getElementById('modal-container');
  if (!modal) return null;

  // Showing over an open dialog replaces it; keep the focus it will hand back to.
  detachHandlers(modal);
  if (modal.classList.contains('hidden') || !lastFocused) lastFocused = document.activeElement;

  modal.innerHTML = `
    <div class="glass-panel modal-card" role="document">
      ${innerHtml}
    </div>
  `;
  if (labelledBy) modal.setAttribute('aria-labelledby', labelledBy);
  modal.classList.remove('hidden');

  const close = () => closeModal(onClose);

  if (dismissible) {
    backdropHandler = (e) => {
      if (e.target === modal) close();
    };
    modal.addEventListener('click', backdropHandler);
  }

  keyHandler = (e) => {
    if (e.key === 'Escape' && dismissible) close();
  };
  document.addEventListener('keydown', keyHandler);

  // Move focus into the dialog for keyboard and screen-reader users.
  const focusTarget = modal.querySelector('button, a[href], input, select, textarea');
  if (focusTarget) focusTarget.focus();

  return modal;
}

export function closeModal(onClose = null) {
  const modal = document.getElementById('modal-container');
  if (!modal) return;
  modal.classList.add('hidden');
  modal.innerHTML = '';
  detachHandlers(modal);
  if (lastFocused && typeof lastFocused.focus === 'function') {
    lastFocused.focus();
  }
  lastFocused = null;
  if (onClose) onClose();
}
