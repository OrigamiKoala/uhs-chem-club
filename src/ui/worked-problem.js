/**
 * worked-problem.js — a worked problem, one small step at a time.
 *
 * A worked problem is a long problem that uses several ideas at once, cut into
 * steps the player can answer. Each step asks one small thing, then shows that
 * step worked out and carries the answer forward. A wrong answer gets the step's
 * hint; after two misses the step can be shown. Nothing is locked, nothing pays
 * XP, and the whole problem can be left at any step.
 *
 * Laid out as a worksheet: the problem on the left (kept in view), the steps on
 * the right as one numbered rail — worked steps above with their answers, the
 * step being asked in the middle, the steps still to come below by name only.
 * Below ~820px of host width the two panes stack and the problem folds.
 *
 * Renders into any host element (the bench-exit card, the world road and the
 * Drill Deck all use it) and reports back through callbacks.
 */

import { esc } from './layout.js';
import { checkStep, answerText } from '../learn/worked.js';
import { toggleCalculator, CALC_ICON } from './calculator.js';

const ICON = {
  check: '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="square" aria-hidden="true"><path d="M3 8.5l3.2 3L13 4.5"/></svg>',
  cross: '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="square" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8"/></svg>',
  close: '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="square" aria-hidden="true"><path d="M3.5 3.5l9 9M12.5 3.5l-9 9"/></svg>'
};

/* Figures in the setup are set in tabular type so the givens can be found at a glance:
   a number with a unit after it, or a number straight after "= ". */
const NUM = String.raw`[−-]?\d+(?:[.,]\d+)*(?:\s?×\s?10[⁻⁺]?[⁰¹²³⁴⁵⁶⁷⁸⁹]+)?`;
const UNIT = String.raw`(?:°C|%|mmHg|kJ\/mol|J\/s|J\/\(g·°C\)|J\/°C|g\/mol|g\/mL|M⁻¹·cm⁻¹|mol⁻¹|s⁻¹|mL|nm|pm|cm|atm|kJ|mol|J|g|L|M|K|W|V|s)(?![A-Za-z])`;
const FIGURE = new RegExp(String.raw`(${NUM}\s?${UNIT}|(?<==\s)${NUM})`, 'g');
function figures(text) {
  return esc(text).replace(FIGURE, '<span class="bp-fig">$1</span>');
}

function tierLine(problem) {
  const where = [problem.worldName, problem.tier ? null : problem.questTitle].filter(Boolean).join(' · ');
  const tier = problem.tier === 'olympiad' ? 'Olympiad · Beyond AP' : problem.tier === 'ap' ? 'AP' : 'Worked problem';
  return where ? `${tier} · ${where}` : tier;
}

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
  let note = '';          // hint or "type a number"
  let typed = '';         // what is in the number field, kept across a re-render
  let wrongPicks = [];    // choice options already tried on this step
  let briefOpen = true;
  let revealed = false;   // this step was shown, not worked
  let finished = false;
  const done = [];        // { step, revealed }
  let disposed = false;

  const tier = problem.tier === 'olympiad' ? 'olympiad' : problem.tier === 'ap' ? 'ap' : 'bench';

  function meterHtml() {
    const n = finished ? steps.length : i;
    return `<div class="bp-meter" role="img" aria-label="${finished ? 'All steps worked' : `Step ${i + 1} of ${steps.length}`}">
      ${steps.map((_, k) => `<span class="bp-meter-seg${k < n ? ' is-done' : k === i && !finished ? ' is-now' : ''}"></span>`).join('')}
      <span class="bp-meter-count">${finished ? steps.length : i + 1}/${steps.length}</span>
    </div>`;
  }

  function doneHtml(d, k) {
    return `
      <li class="bp-step is-done${d.revealed ? ' is-revealed' : ''}">
        <span class="bp-node" aria-hidden="true">${k + 1}</span>
        <div class="bp-step-body">
          ${d.step.beat ? `<span class="bp-beat">${esc(d.step.beat)}</span>` : ''}
          <p class="bp-q">${esc(d.step.say)}</p>
          <div class="bp-result">
            <span class="bp-val">${esc(answerText(d.step))}</span>
            <p class="bp-how">${esc(d.step.explain)}</p>
          </div>
        </div>
      </li>`;
  }

  function currentHtml() {
    const step = steps[i];
    const last = i >= steps.length - 1;
    let input;
    if (step.kind === 'choice') {
      input = `<div class="bp-opts" role="group" aria-label="Answers">
        ${step.options.map(o => {
          const right = shown && o.id === step.answer;
          const wrong = wrongPicks.includes(o.id);
          return `<button type="button" class="bp-opt${right ? ' is-right' : ''}${wrong ? ' is-wrong' : ''}" data-pick="${esc(o.id)}"${shown || wrong ? ' disabled' : ''}>
            <span class="bp-opt-key" aria-hidden="true">${esc(o.id.toUpperCase())}</span><span>${esc(o.label)}</span>
          </button>`;
        }).join('')}
      </div>`;
    } else {
      input = `<div class="bp-entry">
        <label class="bp-field${shown ? ' is-right' : ''}">
          <span class="sr-only">Your answer${step.unit ? ` in ${esc(step.unit)}` : ''}</span>
          <input type="text" inputmode="decimal" autocomplete="off" spellcheck="false" class="bp-input" id="bp-num" value="${esc(shown ? answerText({ ...step, unit: '' }) : typed)}"${shown ? ' disabled' : ''}>
          ${step.unit ? `<span class="bp-unit" aria-hidden="true">${esc(step.unit)}</span>` : ''}
        </label>
        ${shown ? '' : '<button type="button" class="btn-primary bp-check" id="bp-check">Check</button>'}
      </div>`;
    }

    const feedback = shown
      ? `<div class="bp-verdict is-right">${ICON.check}<p><strong>${esc(answerText(step))}.</strong> ${esc(step.explain)}</p></div>`
      : note
        ? `<div class="bp-verdict${misses ? ' is-miss' : ''}">${misses ? ICON.cross : ''}<p>${misses ? '<strong>Hint.</strong> ' : ''}${esc(note)}</p></div>`
        : '';

    return `
      <li class="bp-step is-current" aria-current="step">
        <span class="bp-node" aria-hidden="true">${i + 1}</span>
        <div class="bp-step-body">
          ${step.beat ? `<span class="bp-beat">${esc(step.beat)}</span>` : ''}
          <h3 class="bp-q bp-q-now" id="bp-q-now">${esc(step.say)}</h3>
          ${input}
          <div class="bp-feedback" role="status" aria-live="polite">${feedback}</div>
          <div class="bp-keys">
            ${!shown && misses >= 2 ? '<button type="button" class="btn-secondary quest-btn-sm" data-show>Show this step</button>' : ''}
            ${shown ? `<button type="button" class="btn-primary" data-next>${last ? 'Finish' : 'Next step'}</button>` : ''}
          </div>
        </div>
      </li>`;
  }

  function aheadHtml(step, k) {
    return `
      <li class="bp-step is-ahead">
        <span class="bp-node" aria-hidden="true">${k + 1}</span>
        <div class="bp-step-body">${step.beat ? `<span class="bp-beat">${esc(step.beat)}</span>` : '<span class="bp-ahead-bar"></span>'}</div>
      </li>`;
  }

  function finishHtml() {
    return `
      <li class="bp-step is-finish">
        <span class="bp-node" aria-hidden="true">${ICON.check}</span>
        <div class="bp-step-body">
          <h3 class="bp-q bp-q-now" id="bp-q-now">Result</h3>
          <p class="bp-finish">${esc(problem.finish)}</p>
          ${problem.takeaway ? `<div class="bp-note"><span class="bp-label">Pattern</span><p>${esc(problem.takeaway)}</p></div>` : ''}
          <div class="bp-keys"><button type="button" class="btn-primary" data-done>Done</button></div>
        </div>
      </li>`;
  }

  function render({ scroll = true, retry = false } = {}) {
    if (disposed) return;
    const steps$ = [
      ...done.map(doneHtml),
      ...(finished ? [finishHtml()] : [currentHtml(), ...steps.slice(i + 1).map((s, k) => aheadHtml(s, i + 1 + k))])
    ].join('');

    host.innerHTML = `
      <div class="bp-worked${retry ? ' is-retry' : ''}" data-tier="${tier}">
        <header class="bp-bar">
          <div class="bp-id">
            <h2 class="bp-title" id="bp-title">${esc(problem.title)}</h2>
            <p class="bp-where">${esc(tierLine(problem))}</p>
          </div>
          <div class="bp-tools">
            ${meterHtml()}
            <button type="button" class="btn-secondary quest-btn-sm bp-tool" data-calc title="Scientific calculator" aria-label="Open scientific calculator">${CALC_ICON}</button>
            <button type="button" class="btn-secondary quest-btn-sm bp-tool bp-leave" data-leave>${ICON.close}<span>Leave</span></button>
          </div>
        </header>
        <div class="bp-body">
          <details class="bp-brief"${briefOpen ? ' open' : ''}>
            <summary class="bp-brief-tab"><span class="bp-label">Problem</span></summary>
            <div class="bp-brief-inner">
              <p class="bp-setup">${figures(problem.setup)}</p>
              ${problem.strategy ? `<div class="bp-note"><span class="bp-label">Approach</span><p>${esc(problem.strategy)}</p></div>` : ''}
            </div>
          </details>
          <div class="bp-work">
            <ol class="bp-steps" aria-label="Steps">${steps$}</ol>
          </div>
        </div>
      </div>`;
    wire(scroll);
  }

  function wire(scroll) {
    const num = host.querySelector('#bp-num');
    host.querySelector('.bp-brief')?.addEventListener('toggle', e => { briefOpen = e.currentTarget.open; });
    host.querySelector('[data-calc]')?.addEventListener('click', () => toggleCalculator({ targetInput: num && !num.disabled ? num : null }));
    host.querySelector('[data-leave]')?.addEventListener('click', () => onLeave?.());
    host.querySelector('[data-show]')?.addEventListener('click', reveal);
    host.querySelector('[data-next]')?.addEventListener('click', advance);
    host.querySelector('[data-done]')?.addEventListener('click', () => onDone?.());
    host.querySelectorAll('[data-pick]').forEach(b => b.addEventListener('click', () => attempt(b.dataset.pick)));
    host.querySelector('#bp-check')?.addEventListener('click', () => attempt(num.value));
    num?.addEventListener('input', () => { typed = num.value; });
    num?.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); attempt(num.value); } });

    const now = host.querySelector('.bp-step.is-current, .bp-step.is-finish');
    if (scroll && now) now.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    const focusEl = (num && !num.disabled ? num : null)
      || host.querySelector('[data-next], [data-done]')
      || host.querySelector('.bp-opt:not(:disabled)');
    focusEl?.focus({ preventScroll: true });
    if (num && !num.disabled && typed) num.setSelectionRange(typed.length, typed.length);
  }

  function attempt(given) {
    const step = steps[i];
    const r = checkStep(step, given);
    if (r.empty) { note = step.kind === 'choice' ? 'Pick an answer.' : 'Type a number.'; render({ scroll: false, retry: true }); return; }
    if (r.ok) { shown = true; note = ''; render(); return; }
    misses++;
    if (step.kind === 'choice') wrongPicks.push(given);
    note = step.hint;
    render({ scroll: false, retry: true });
  }

  function reveal() { shown = true; note = ''; revealed = true; render(); }

  function advance() {
    done.push({ step: steps[i], revealed });
    revealed = false;
    if (i >= steps.length - 1) { finished = true; render(); return; }
    i++; misses = 0; shown = false; note = ''; typed = ''; wrongPicks = [];
    // Once the first step is worked the problem has been read; on a narrow host it folds away.
    if (i === 1 && host.clientWidth < 820) briefOpen = false;
    render();
  }

  render({ scroll: false });
  return { dispose() { disposed = true; } };
}
