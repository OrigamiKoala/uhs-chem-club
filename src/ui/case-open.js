/**
 * case-open.js — the card a quest opens on: Vess puts the quest's question (`mystery` in `story/quest-story.js`) to the
 * player before the first stage. The debrief (`story-anim.js`) shows the same question again above the Case Pin that
 * answers it, so every quest starts on a question and ends on its answer.
 *
 * Shown each time the quest is opened at stage 1, replays included, like a stage briefing. Start, Esc or a press outside
 * the card closes it. Resolves when it closes.
 */

import { showModal, closeModal } from './modal.js';
import { createTransmissionElement } from './transmission.js';
import { esc } from './layout.js';

export function showCaseOpen({ mystery, title = '' }) {
  return new Promise(resolve => {
    if (!mystery || typeof document === 'undefined') { resolve(); return; }
    let tx = null;
    const done = () => { tx?.destroy?.(); resolve(); };
    const modal = showModal(`
      <div class="quest-modal-head lq-modal-head">
        <div>
          ${title ? `<div class="eyebrow lit">${esc(title)}</div>` : ''}
          <h2 id="case-open-title" class="section-title">The question</h2>
        </div>
      </div>
      <div class="case-open-tx"></div>
      <div class="lq-modal-keys case-open-keys">
        <button type="button" class="btn-primary" data-start>Start</button>
      </div>`, { labelledBy: 'case-open-title', onClose: done });
    if (!modal) { resolve(); return; }
    tx = createTransmissionElement({ speaker: 'Vess', text: mystery, variant: 'hero' });
    modal.querySelector('.case-open-tx')?.appendChild(tx.element);
    const start = modal.querySelector('[data-start]');
    start?.addEventListener('click', () => {
      // A line still printing is finished first, as in any dialogue.
      if (!tx.element.classList.contains('finished')) { tx.finish?.(); return; }
      closeModal(done);
    });
    start?.focus();
  });
}
