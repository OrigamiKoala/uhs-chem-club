/**
 * stagerunner.js — The stage loop every table-driven bench quest shares.
 *
 * Tallow's and Ligar's quests each carry their own copy of the same hundred
 * lines: build a `LearnFrame`, load a stage, render the keys and the answer
 * widget, grade on Commit, report a clear, run the debrief, dispose. Lanternfall
 * has nine quests on four instruments, so the loop is written once here and a
 * quest supplies only what is its own: its stage table, its instrument, what
 * its keys do and what its readout says.
 *
 * WHAT IT OWNS
 *   - the `LearnFrame` and its stage lifecycle (load, submit, next, debrief),
 *   - the answer widgets, one implementation each: `number`, `decimal`,
 *     `choice`, `bins`, `order`, `pick` and `none`,
 *   - the key legend under the keys (`toolNotes`),
 *   - the dial for a tuned lamp, which prints the wavelength it is set to.
 *
 * WHAT IT NEVER DOES
 *   - read an answer. `stage.check(state)` is the quest's, and this passes it
 *     the state the widgets built.
 *   - award XP or touch the campaign rails. Progress goes through `ctx`.
 *
 * The widgets build exactly the state `verify:learn` hands `check()`:
 * `state.number`, `state.decimal`, `state.choice`, `state.bins`, `state.order`
 * and `state.sample`.
 */

import { LearnFrame, toolNotes } from './frame.js';
import { dialMarkup, bindDial, paintDial } from './dial.js';
import { esc } from '../../ui/layout.js';
import { soundscape } from '../../audio/soundscape.js';

/** The blank answer state every widget builds into. */
export function blankAnswer(stage) {
  const w = stage.widget || {};
  return {
    number: w.type === 'number' ? w.min : null,
    decimal: w.type === 'decimal' ? w.min : null,
    choice: null,
    bins: {},
    order: [],
    picks: [],
    sample: null
  };
}

/** A decimal kept to the step's own number of places, so 0.1 + 0.2 is 0.3. */
export function roundTo(x, step) {
  const places = Math.max(0, (String(step).split('.')[1] || '').length);
  return Number(x.toFixed(places));
}

/**
 * @param {HTMLElement} container
 * @param {object} ctx the host's context (`reportStage`, `reportComplete`, `exit`, ...)
 * @param {{
 *   STAGES: object[], DEBRIEF: object,
 *   blankState: (stage: object) => object,
 *   setup?: (runner: object) => void,   // builds the instrument, once, before stage one
 *   toolNoteFor?: (id: string, stageNumber: number) => object|null,
 *   onLoad: (stage: object, i: number, runner: object) => void,
 *   onDispose?: () => void,
 *   onWidgetChange?: (runner: object) => void
 * }} cfg
 */
export function createRunner(container, ctx, cfg) {
  const { STAGES } = cfg;
  const frame = new LearnFrame(container, {
    stageCount: STAGES.length,
    rewards: STAGES.map(s => s.reward),
    onSubmit: () => submit(),
    onNext: () => next(),
    onJump: i => loadStage(i),
    onExit: () => ctx.exit()
  });

  let index = ctx.isComplete ? 0 : Math.min(ctx.stagesCleared, STAGES.length - 1);
  let cleared = ctx.isComplete ? STAGES.length : ctx.stagesCleared;
  let state = null;
  let busy = false;
  let disposed = false;
  let dialTeardowns = [];

  const runner = {
    frame,
    get state() { return state; },
    get index() { return index; },
    get stage() { return STAGES[index]; },
    get busy() { return busy; },
    set busy(v) { busy = v; },
    get disposed() { return disposed; },
    loadStage,
    renderWidget,
    setControls,
    readout,
    clack: () => soundscape.playToggleClack?.(),
    dispose
  };

  /* ---------------- lifecycle ---------------- */

  function loadStage(i) {
    index = i;
    const stage = STAGES[i];
    state = { ...blankAnswer(stage), ...cfg.blankState(stage) };

    frame.setCleared(cleared);
    frame.setStage({
      index: i,
      title: stage.title,
      prompt: stage.prompt,
      briefing: stage.briefing,
      hints: stage.hints,
      commitLabel: 'Commit'
    });

    cfg.onLoad(stage, i, runner);
    renderWidget();

    if (stage.briefing && !ctx.isComplete && cleared <= i) frame.showBriefing();
  }

  function next() {
    if (index >= STAGES.length - 1) {
      frame.showDebrief(cfg.DEBRIEF, () => ctx.exit());
      return;
    }
    loadStage(index + 1);
  }

  function submit() {
    if (busy) return;
    const stage = STAGES[index];
    const result = stage.check(state);
    if (!result.ok) {
      if (result.notYet) frame.note(result.msg);
      else frame.miss(result.msg);
      return;
    }
    frame.clearBanner();
    if (index + 1 > cleared) {
      cleared = index + 1;
      ctx.reportStage(index);
    }
    frame.setCleared(cleared);
    frame.clear(stage.reward);
    if (index === STAGES.length - 1) ctx.reportComplete();
  }

  /* ---------------- keys ---------------- */

  /**
   * Put the stage's keys under the prompt. `parts` is HTML the quest built from
   * its own keys; the legend for any key that needs one is added here, and every
   * `[data-tool]` button is wired to `onTool`.
   */
  function setControls(parts, onTool, extra = {}) {
    const stage = STAGES[index];
    dialTeardowns.forEach(t => t());
    dialTeardowns = [];
    const legend = toolNotes(
      (stage.controls || []).map(id => cfg.toolNoteFor?.(id, index + 1)).filter(Boolean)
    );
    frame.setControls(`${parts.join('')}${legend}`);
    // A harness may ask to hear the stage's tool handler (tools/verify-quest-run.mjs).
    globalThis.__LQ_TEST__?.tool?.(onTool);
    const host = frame.el.controls;
    host.querySelectorAll('[data-tool]').forEach(btn => {
      btn.addEventListener('click', () => onTool?.(btn.dataset.tool, btn));
    });
    if (extra.dials) runner.bindDials(extra.dials);
  }

  /* ---------------- dials ----------------

     A bench can carry more than one dial (a lamp's wavelength and its
     brightness), so each lives in its own wrapper and is bound and painted
     through that wrapper; the shared dial helpers look for the first knob in
     whatever element they are handed. */

  /** Markup for one dial in its own wrapper. */
  runner.dialHtml = (id, o) =>
    `<div class="lq-dialwrap" data-dialwrap="${id}">${dialMarkup({ ...o, id: `dial-${id}` })}</div>`;

  /** Wire every dial the stage drew: `{ id: { min, max, onChange } }`. */
  runner.bindDials = specs => {
    for (const [id, spec] of Object.entries(specs || {})) {
      const wrap = frame.el.controls.querySelector(`[data-dialwrap="${id}"]`);
      if (wrap) dialTeardowns.push(bindDial(wrap, spec));
    }
  };

  /** Turn a dial's cap to `value`. `text` replaces the printed readout (a wavelength in nm). */
  runner.paintDial = (id, value, { min, max, text } = {}) => {
    const wrap = frame.el.controls.querySelector(`[data-dialwrap="${id}"]`);
    if (!wrap) return;
    paintDial(wrap, value, { min, max });
    if (text != null) {
      const readout = wrap.querySelector('.lq-dial-value');
      if (readout) readout.textContent = text;
    }
  };

  /* ---------------- readout ---------------- */

  function readout(head, body, opts = {}) {
    if (head == null) {
      frame.setReadout(`
        <div class="lq-readout-card lq-readout-idle">
          <div class="lq-readout-head">${esc(opts.idleHead || 'Bench // standby')}</div>
          <p class="lq-readout-line">${esc(opts.idle || '')}</p>
        </div>
      `);
      return;
    }
    frame.setReadout(`
      <div class="lq-readout-card">
        <div class="lq-readout-head">${esc(head)}</div>
        ${opts.code ? `<div class="lq-readout-code">${esc(opts.code)}</div>` : ''}
        <p class="lq-readout-line">${esc(body)}</p>
      </div>
    `);
  }

  /* ---------------- answer widgets ---------------- */

  function renderWidget() {
    const stage = STAGES[index];
    const w = stage.widget;
    if (!w || w.type === 'none') { frame.setWidget(''); return; }

    const changed = () => cfg.onWidgetChange?.(runner);

    if (w.type === 'number' || w.type === 'decimal') {
      const key = w.type;
      const step = w.step || 1;
      const show = v => (w.type === 'decimal' ? roundTo(v, step).toFixed(Math.max(0, (String(step).split('.')[1] || '').length)) : String(v));
      frame.setWidget(`
        <div class="lq-answer">
          <span class="form-label">${esc(w.label)}</span>
          <div class="lq-number">
            <button type="button" class="btn-secondary quest-btn-sm" data-num="-1" aria-label="Lower">&minus;</button>
            <span class="lq-number-value" aria-live="polite">${show(state[key])}</span>
            <button type="button" class="btn-secondary quest-btn-sm" data-num="1" aria-label="Raise">+</button>
          </div>
          <p class="form-help">Steps of ${step}, between ${w.min} and ${w.max}.</p>
        </div>
      `);
      frame.el.widget.querySelectorAll('[data-num]').forEach(btn => {
        btn.addEventListener('click', () => {
          const next = state[key] + Number(btn.dataset.num) * step;
          state[key] = roundTo(Math.max(w.min, Math.min(w.max, next)), step);
          frame.el.widget.querySelector('.lq-number-value').textContent = show(state[key]);
          runner.clack();
          changed();
        });
      });
      return;
    }

    if (w.type === 'choice') {
      frame.setWidget(`
        <div class="lq-answer">
          <span class="form-label">${esc(w.label)}</span>
          <div class="lq-bin-keys">
            ${w.options.map(o => `
              <button type="button" class="choice-option lq-bin-key" data-choice="${esc(o.id)}">
                <span class="lq-bin-label">${esc(o.label)}</span>
                ${o.note ? `<span class="lq-bin-note">${esc(o.note)}</span>` : ''}
              </button>
            `).join('')}
          </div>
        </div>
      `);
      frame.el.widget.querySelectorAll('[data-choice]').forEach(btn => {
        btn.addEventListener('click', () => {
          state.choice = btn.dataset.choice;
          frame.el.widget.querySelectorAll('[data-choice]')
            .forEach(o => o.classList.toggle('selected', o === btn));
          runner.clack();
          changed();
        });
      });
      return;
    }

    if (w.type === 'bins') {
      frame.setWidget(`
        <div class="lq-answer">
          <span class="form-label">${esc(w.label || 'Your answer')}</span>
          <div class="lq-bins">
            ${w.rows.map(r => `
              <div class="lq-bin-row" data-row="${esc(r.id)}">
                <span class="lq-bin-sample">${esc(r.label)}</span>
                <div class="lq-bin-keys">
                  ${w.bins.map(b => `
                    <button type="button" class="choice-option lq-bin-key" data-bin="${esc(b.id)}">
                      <span class="lq-bin-label">${esc(b.label)}</span>
                      ${b.note ? `<span class="lq-bin-note">${esc(b.note)}</span>` : ''}
                    </button>
                  `).join('')}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `);
      frame.el.widget.querySelectorAll('[data-bin]').forEach(btn => {
        btn.addEventListener('click', () => {
          const row = btn.closest('[data-row]');
          state.bins[row.dataset.row] = btn.dataset.bin;
          row.querySelectorAll('[data-bin]').forEach(o => o.classList.toggle('selected', o === btn));
          runner.clack();
          changed();
        });
      });
      return;
    }

    if (w.type === 'order') {
      const paint = () => {
        frame.el.widget.querySelectorAll('[data-pick]').forEach(btn => {
          const at = state.order.indexOf(btn.dataset.pick);
          btn.classList.toggle('selected', at >= 0);
          btn.setAttribute('aria-pressed', String(at >= 0));
          const tag = btn.querySelector('.lq-bin-note');
          if (tag) tag.textContent = at >= 0 ? `Place ${at + 1}` : '';
        });
      };
      frame.setWidget(`
        <div class="lq-answer">
          <span class="form-label">${esc(w.label)}</span>
          <div class="lq-bin-keys">
            ${w.items.map(o => `
              <button type="button" class="choice-option lq-bin-key" data-pick="${esc(o.id)}" aria-pressed="false">
                <span class="lq-bin-label">${esc(o.label)}</span>
                <span class="lq-bin-note"></span>
              </button>
            `).join('')}
          </div>
          <button type="button" class="btn-secondary quest-btn-sm" data-clear-order>Clear Order</button>
        </div>
      `);
      frame.el.widget.querySelectorAll('[data-pick]').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.pick;
          if (!state.order.includes(id)) state.order.push(id);
          paint();
          runner.clack();
          changed();
        });
      });
      frame.el.widget.querySelector('[data-clear-order]')?.addEventListener('click', () => {
        state.order = [];
        paint();
        changed();
      });
      return;
    }

    if (w.type === 'multi') {
      frame.setWidget(`
        <div class="lq-answer">
          <span class="form-label">${esc(w.label)}</span>
          <div class="lq-bin-keys">
            ${w.options.map(o => `
              <button type="button" class="choice-option lq-bin-key" data-multi="${esc(o.id)}" aria-pressed="false">
                <span class="lq-bin-label">${esc(o.label)}</span>
                ${o.note ? `<span class="lq-bin-note">${esc(o.note)}</span>` : ''}
              </button>
            `).join('')}
          </div>
          <p class="form-help">Pick every one that applies.</p>
        </div>
      `);
      frame.el.widget.querySelectorAll('[data-multi]').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.multi;
          const at = state.picks.indexOf(id);
          if (at >= 0) state.picks.splice(at, 1); else state.picks.push(id);
          btn.classList.toggle('selected', at < 0);
          btn.setAttribute('aria-pressed', String(at < 0));
          runner.clack();
          changed();
        });
      });
      return;
    }

    if (w.type === 'pick') {
      frame.setWidget(`
        <div class="lq-answer">
          <span class="form-label">${esc(w.label || 'Logged')}</span>
          <div class="lq-answer-value">${state.sample ? esc(labelOf(state.sample)) : '—'}</div>
          <p class="form-help">${esc(w.help || 'Tap a sample on the bench to pick it.')}</p>
        </div>
      `);
    }
  }

  function labelOf(id) {
    const stage = STAGES[index];
    const bench = stage.rigs || stage.samples || stage.specimens || stage.boxes || [];
    return bench.find(b => b.id === id)?.label || id;
  }

  /** Quests call this from `onSelect` when the widget is `pick`. */
  runner.pick = id => {
    state.sample = id;
    if (STAGES[index].widget?.type === 'pick') renderWidget();
  };

  /* ---------------- go ---------------- */

  function dispose() {
    if (disposed) return;
    disposed = true;
    dialTeardowns.forEach(t => t());
    cfg.onDispose?.();
    frame.dispose();
  }

  globalThis.__LQ_TEST__?.runner?.(runner);
  cfg.setup?.(runner);

  /**
   * The first stage is loaded by `start()`, called by the quest once it holds
   * the runner. Loading it here would run the quest's own `onLoad` before the
   * quest's `runner` variable was assigned, and anything in it that reads the
   * runner would fault on the first stage of every quest.
   */
  runner.start = () => { if (!disposed) loadStage(index); };
  return runner;
}
