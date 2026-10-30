/**
 * worked-problem.js — a worked problem, one small step at a time.
 *
 * A worked problem is a long problem that uses several ideas at once, cut into
 * steps the player can answer. Each step asks one small thing, then shows that
 * step worked out and carries the answer forward. A wrong answer gets the step's
 * hint; after two misses the step can be shown. Nothing is locked, nothing pays
 * XP, and the whole problem can be left at any step.
 *
 * Renders into any host element (the bench-exit card and the Drill Deck both
 * use it) and reports back through callbacks.
 */

import { esc } from './layout.js';
import { checkStep, answerText } from '../learn/worked.js';

/**
 * @param {HTMLElement} host
 * @param {object} problem a Worked entry from the bank
 * @param {{ onDone?: Function, onLeave?: Function }} cb onDone: all steps worked; onLeave: the player left early
 * @returns {{ dispose: Function }}
 */
export function mountWorked(host, problem, { onDone, onLeave } = {}) {
  const steps = problem.steps;
  let i = 0;
  let misses = 0;
  let shown = false;      // this step's answer is on screen
  let note = '';          // hint or "check the figure"
  const done = [];        // { step, shownAnswer }
  let disposed = false;

  const logHtml = () => done.map(d => `
    <li class="bp-done">
      <span class="bp-done-q">${esc(d.step.say)}</span>
      <span class="bp-done-a">${esc(answerText(d.step))}</span>
      <span class="bp-done-w">${esc(d.step.explain)}</span>
    </li>`).join('');

  function render() {
    if (disposed) return;
    const step = steps[i];
    const answered = shown;
    const input = step.kind === 'choice'
      ? `<div class="lq-practice-options" role="group" aria-label="Answers">
          ${step.options.map(o => `<button type="button" class="choice-option lq-practice-opt" data-pick="${esc(o.id)}"${answered ? ' disabled' : ''}>${esc(o.label)}</button>`).join('')}
        </div>`
      : `<div class="bp-input-row">
          <input type="text" inputmode="decimal" autocomplete="off" class="form-input bp-input" id="bp-num" aria-label="Your answer"${answered ? ' disabled' : ''}>
          ${step.unit ? `<span class="bp-unit">${esc(step.unit)}</span>` : ''}
          <button type="button" class="btn-primary quest-btn-sm" id="bp-check"${answered ? ' disabled' : ''}>Check</button>
        </div>`;

    const last = i >= steps.length - 1;
    host.innerHTML = `
      <div class="bp-worked">
        <div class="bp-head">
          <div>
            <div class="eyebrow lit">Worked problem</div>
            <h2 class="section-title bp-title">${esc(problem.title)}</h2>
          </div>
          <span class="tag live">Step ${i + 1} / ${steps.length}</span>
        </div>
        <p class="bp-setup">${esc(problem.setup)}</p>
        ${done.length ? `<ol class="bp-log">${logHtml()}</ol>` : ''}
        <h3 class="bp-say">${esc(step.say)}</h3>
        ${input}
        <div class="lq-practice-feedback" role="status" aria-live="polite">
          ${answered
            ? `<div class="lq-practice-verdict correct"><span class="lq-practice-mark" aria-hidden="true">✓</span><span class="lq-practice-verdict-body"><strong>${esc(answerText(step))}.</strong> ${esc(step.explain)}</span></div>`
            : note ? `<div class="lq-practice-verdict incorrect"><span class="lq-practice-mark" aria-hidden="true">✗</span><span class="lq-practice-verdict-body">${esc(note)}</span></div>` : ''}
        </div>
        <div class="lq-practice-keys">
          <button type="button" class="btn-secondary quest-btn-sm" data-leave>Leave</button>
          ${!answered && misses >= 2 ? '<button type="button" class="btn-secondary quest-btn-sm" data-show>Show this step</button>' : ''}
          ${answered ? `<button type="button" class="btn-primary" data-next>${last ? 'Finish' : 'Next step'}</button>` : ''}
        </div>
      </div>`;

    host.querySelector('[data-leave]')?.addEventListener('click', () => onLeave?.());
    host.querySelector('[data-show]')?.addEventListener('click', () => reveal(true));
    host.querySelector('[data-next]')?.addEventListener('click', advance);
    host.querySelectorAll('[data-pick]').forEach(b => b.addEventListener('click', () => attempt(b.dataset.pick)));
    const num = host.querySelector('#bp-num');
    host.querySelector('#bp-check')?.addEventListener('click', () => attempt(num.value));
    num?.addEventListener('keydown', e => { if (e.key === 'Enter') attempt(num.value); });
    (num || host.querySelector('[data-next]'))?.focus({ preventScroll: true });
  }

  function attempt(given) {
    const step = steps[i];
    const r = checkStep(step, given);
    if (r.empty) { note = step.kind === 'choice' ? 'Pick an answer.' : 'Type a number.'; render(); return; }
    if (r.ok) { shown = true; note = ''; render(); return; }
    misses++;
    note = step.hint;
    render();
  }

  function reveal() { shown = true; note = ''; render(); }

  function advance() {
    done.push({ step: steps[i] });
    if (i >= steps.length - 1) { renderFinish(); return; }
    i++; misses = 0; shown = false; note = '';
    render();
  }

  function renderFinish() {
    if (disposed) return;
    host.innerHTML = `
      <div class="bp-worked">
        <div class="bp-head">
          <div>
            <div class="eyebrow lit">Worked problem</div>
            <h2 class="section-title bp-title">${esc(problem.title)}</h2>
          </div>
        </div>
        <ol class="bp-log">${logHtml()}</ol>
        <p class="lq-practice-summary">${esc(problem.finish)}</p>
        <div class="lq-practice-keys"><button type="button" class="btn-primary" data-done>Done</button></div>
      </div>`;
    const b = host.querySelector('[data-done]');
    b?.addEventListener('click', () => onDone?.());
    b?.focus({ preventScroll: true });
  }

  render();
  return { dispose() { disposed = true; } };
}
