/**
 * bench-practice.js — what a bench asks once its debrief is over.
 *
 * Two short problems from the question bank, then, on a computational bench, an
 * offer of a guided worked problem. All of it is skippable at every point and
 * gates nothing: the player leaves for the next bench either way. No XP — an
 * answer only moves the cosmetic mastery record the Drill Deck keeps.
 */

import { showModal, closeModal } from './modal.js';
import { esc } from './layout.js';
import { session } from '../session.js';
import { getWorld } from '../learn/curriculum.js';
import { benchProblems, benchWorked } from '../learn/bank.js';
import { normalizePractice, recordAnswer, withShuffledOptions, mulberry32 } from '../learn/drills.js';
import { mountWorked } from './worked-problem.js';

/** True when the bench has anything to ask. */
export function hasBenchPractice(worldId, questId) {
  const world = getWorld(worldId);
  return Boolean(world && (benchProblems(world, questId).length || benchWorked(world, questId)));
}

/**
 * Run the bench's problems in the shared modal. Resolves when the player
 * finishes or skips; it never rejects.
 */
export function runBenchPractice(worldId, questId) {
  const world = getWorld(worldId);
  if (!world || typeof document === 'undefined') return Promise.resolve();
  const rng = mulberry32((Date.now() ^ (Math.random() * 0xffffffff)) >>> 0);
  const problems = benchProblems(world, questId).map(p => withShuffledOptions(p, rng));
  const worked = benchWorked(world, questId);
  if (!problems.length && !worked) return Promise.resolve();

  return new Promise(resolve => {
    let settled = false;
    let view = null;
    const finish = () => {
      if (settled) return;
      settled = true;
      view?.dispose();
      resolve();
    };
    const leave = () => closeModal(finish);

    const note = (id, ok) => {
      const p = (session.practice = normalizePractice(session.practice));
      recordAnswer(p, id, ok);
      session.savePractice?.();
    };

    function askProblem(n) {
      if (n >= problems.length) { offerWorked(); return; }
      const q = problems[n];
      let picked = null;
      showModal(`
        <div class="quest-modal-head lq-modal-head">
          <div>
            <div class="eyebrow lit">${esc(q.questTitle)}</div>
            <h2 id="bp-title" class="section-title">Practice</h2>
          </div>
          <span class="tag live">${n + 1} / ${problems.length}</span>
        </div>
        <p class="lq-practice-question">${esc(q.question)}</p>
        <div class="lq-practice-options" role="group" aria-label="Answers">
          ${q.options.map(o => `<button type="button" class="choice-option lq-practice-opt" data-opt="${esc(o.id)}">${esc(o.label)}</button>`).join('')}
        </div>
        <div class="lq-practice-feedback" role="status" aria-live="polite"></div>
        <div class="lq-practice-keys">
          <button type="button" class="btn-secondary" data-skip>Skip</button>
          <button type="button" class="btn-primary" data-next hidden>Next</button>
        </div>
      `, { labelledBy: 'bp-title', onClose: finish });

      const modal = document.getElementById('modal-container');
      modal.querySelector('[data-skip]').addEventListener('click', leave);
      modal.querySelectorAll('[data-opt]').forEach(btn => btn.addEventListener('click', () => {
        if (picked !== null) return;
        picked = btn.dataset.opt;
        const ok = picked === q.answer;
        note(q.id, ok);
        modal.querySelectorAll('[data-opt]').forEach(b => {
          if (b.dataset.opt === q.answer) b.classList.add('correct');
          else if (b === btn) b.classList.add('incorrect');
          b.disabled = true;
        });
        modal.querySelector('.lq-practice-feedback').innerHTML = `
          <div class="lq-practice-verdict ${ok ? 'correct' : 'incorrect'}">
            <span class="lq-practice-mark" aria-hidden="true">${ok ? '✓' : '✗'}</span>
            <span class="lq-practice-verdict-body"><strong>${ok ? 'Correct.' : 'Not this one.'}</strong> ${esc(q.explanation)}</span>
          </div>`;
        const next = modal.querySelector('[data-next]');
        next.hidden = false;
        next.textContent = n + 1 < problems.length || worked ? 'Next' : 'Finish';
        next.addEventListener('click', () => askProblem(n + 1));
        next.focus({ preventScroll: true });
      }));
    }

    function offerWorked() {
      if (!worked) { leave(); return; }
      showModal(`
        <div class="quest-modal-head lq-modal-head">
          <div>
            <div class="eyebrow lit">${esc(worked.questTitle)}</div>
            <h2 id="bp-title" class="section-title">${esc(worked.title)}</h2>
          </div>
          <span class="tag">Worked problem</span>
        </div>
        <p class="lq-practice-question">${esc(worked.setup)}</p>
        <p class="lq-practice-note">${worked.steps.length} steps. You work each one out.</p>
        <div class="lq-practice-keys">
          <button type="button" class="btn-secondary" data-skip>Skip</button>
          <button type="button" class="btn-primary" data-start>Start</button>
        </div>
      `, { labelledBy: 'bp-title', onClose: finish });
      const modal = document.getElementById('modal-container');
      modal.querySelector('[data-skip]').addEventListener('click', leave);
      modal.querySelector('[data-start]').addEventListener('click', startWorked);
      modal.querySelector('[data-start]').focus({ preventScroll: true });
    }

    function startWorked() {
      showModal('<div id="bp-host"></div>', { labelledBy: 'bp-title', onClose: finish });
      const host = document.getElementById('bp-host');
      view = mountWorked(host, worked, {
        onDone: () => { note(worked.id, true); leave(); },
        onLeave: leave
      });
    }

    askProblem(0);
  });
}
