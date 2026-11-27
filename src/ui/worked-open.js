/**
 * worked-open.js — open one worked problem over the current screen.
 *
 * Used by the world road (a bench's worked problem once it is cleared, and the
 * AP / Olympiad problems placed after the benches they draw on). The sheet takes
 * the whole view; Leave, Escape and Done all close it. Finishing marks the
 * problem worked in the Drill Deck's mastery record. No XP.
 */

import { showModal, closeModal } from './modal.js';
import { session } from '../session.js';
import { normalizePractice, recordAnswer } from '../learn/drills.js';
import { mountWorked } from './worked-problem.js';
import { closeCalculator } from './calculator.js';

/** True once the player has worked this problem to the end. */
export function isWorkedDone(id) {
  return Boolean(normalizePractice(session.practice).q?.[id]?.c);
}

/**
 * @param {object} problem a Worked entry (bench or deep) as the bank returns it
 * @param {{ onClose?: Function }} [opts] onClose runs after the sheet closes, finished or not
 */
export function openWorkedProblem(problem, { onClose } = {}) {
  if (!problem || typeof document === 'undefined') return;
  let view = null;
  let settled = false;
  const modalEl = document.getElementById('modal-container');
  const finish = () => {
    if (settled) return;
    settled = true;
    closeCalculator();
    modalEl?.classList.remove('modal-worked');
    view?.dispose();
    onClose?.();
  };
  modalEl?.classList.add('modal-worked');
  showModal('<div id="bp-host" class="bp-host"></div>', { labelledBy: 'bp-title', onClose: finish });
  const host = document.getElementById('bp-host');
  if (!host) { finish(); return; }
  view = mountWorked(host, problem, {
    onDone: () => {
      const p = (session.practice = normalizePractice(session.practice));
      recordAnswer(p, problem.id, true);
      session.savePractice?.();
      closeModal(finish);
    },
    onLeave: () => closeModal(finish)
  });
}
