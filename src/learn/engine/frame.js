/**
 * frame.js — The chrome a Learn quest is played inside.
 *
 * Every Learn quest needs the same furniture: a rail of stage lamps, a briefing
 * you can reopen, a prompt, a readout, whatever the stage's answer widget is, a
 * Commit key, a miss banner that names what went wrong, and a reward card that
 * appears only AFTER the solve. This builds all of it and hands the quest module
 * the empty regions it fills.
 *
 * What the frame does NOT do: chemistry, grading or content. It never sees an
 * answer. The quest module calls `clear()` or `miss()` and the frame reacts.
 *
 * The hint ladder here is the same bargain the campaign strikes (CLAUDE.md,
 * "Hints are earned, not bought"): rung 1 is free, rung 2 opens after one miss or
 * 45 seconds of looking, rung 3 after two misses. Nobody is stranded, and nobody
 * is handed the answer before they have looked. Hints cost nothing, because this
 * track pays nothing — there is no currency here to tax.
 */

import { showModal, closeModal } from '../../ui/modal.js';
import { esc } from '../../ui/layout.js';
import { soundscape } from '../../audio/soundscape.js';
import { createTransmissionElement } from '../../ui/transmission.js';

const RUNG2_AFTER_MS = 45000;

export class LearnFrame {
  /**
   * @param {HTMLElement} container the host screen's mount point
   * @param {{
   *   stageCount: number,
   *   speaker?: string,
   *   onSubmit: () => void,
   *   onNext: () => void,
   *   onJump?: (stageIndex: number) => void,
   *   onExit: () => void
   * }} opts
   */
  constructor(container, opts) {
    this.container = container;
    this.opts = opts;
    this.stageCount = opts.stageCount;
    this.cleared = 0;
    this.stage = null;
    this.misses = 0;
    this.rung = 0;
    this.solved = false;
    this.openedAt = 0;
    this.disposed = false;

    this.build();
  }

  build() {
    this.container.innerHTML = `
      <section class="lq">
        <div class="lq-rail" role="group" aria-label="Stages">
          ${Array.from({ length: this.stageCount }, (_, i) =>
            `<button type="button" class="lq-lamp" data-lamp="${i}" disabled><em>${String(i + 1).padStart(2, '0')}</em></button>`
          ).join('')}
        </div>

        <div class="lq-body">
          <div class="lq-stage">
            <div class="lq-stage-head">
              <div class="lq-stage-id">
                <span class="eyebrow lq-kicker"></span>
                <h2 class="lq-stage-title"></h2>
              </div>
              <div class="lq-stage-actions">
                <button type="button" class="btn-secondary quest-btn-sm" data-act="exit">Exit</button>
                <button type="button" class="btn-secondary quest-btn-sm" data-act="objective">Objective</button>
              </div>
            </div>
            <div class="lq-controls"></div>
            <div class="lq-scope"></div>
          </div>

          <aside class="lq-deck plate">
            <div class="lq-prompt"></div>
            <div class="lq-readout"></div>
            <div class="lq-banner" role="status" aria-live="polite"></div>
            <div class="lq-widget"></div>
            <div class="lq-actions">
              <button type="button" class="btn-secondary lq-hint-key" data-act="hint">Hint</button>
              <button type="button" class="btn-primary lq-commit" data-act="submit">Commit</button>
            </div>
            <div class="lq-hints"></div>
          </aside>
        </div>
      </section>
    `;

    const q = sel => this.container.querySelector(sel);
    this.el = {
      rail: q('.lq-rail'),
      kicker: q('.lq-kicker'),
      title: q('.lq-stage-title'),
      stageActions: q('.lq-stage-actions'),
      controls: q('.lq-controls'),
      scope: q('.lq-scope'),
      prompt: q('.lq-prompt'),
      readout: q('.lq-readout'),
      banner: q('.lq-banner'),
      widget: q('.lq-widget'),
      actions: q('.lq-actions'),
      hints: q('.lq-hints'),
      commit: q('.lq-commit'),
      hintKey: q('.lq-hint-key'),
      objective: q('[data-act="objective"]')
    };

    this.onClick = e => {
      const act = e.target.closest('[data-act]')?.dataset.act;
      if (act === 'submit') this.opts.onSubmit();
      else if (act === 'next') this.opts.onNext();
      else if (act === 'hint') this.takeHint();
      else if (act === 'objective') this.showBriefing();
      else if (act === 'exit') this.opts.onExit?.();
      else if (act === 'reward') this.showFindings();

      // Any stage already cleared can be walked back into. This is a study road
      // and re-reading is the point of it; there is no XP here for a replay to
      // farm, which is the only reason the campaign has to bolt this shut.
      const lamp = e.target.closest('.lq-lamp:not([disabled])');
      if (lamp && this.opts.onJump) this.opts.onJump(Number(lamp.dataset.lamp));
    };
    this.container.addEventListener('click', this.onClick);
  }

  /** The element the quest's instrument renders into. */
  get instrumentHost() {
    return this.el.scope;
  }

  /* ---------------- per-stage setup ---------------- */

  /**
   * @param {{
   *   index: number, title: string, prompt: string,
   *   briefing?: {speaker: string, body: string},
   *   hints: string[], commitLabel?: string
   * }} stage
   */
  setStage(stage) {
    const advancing = this.stage !== null;
    if (this.activeBriefingTx?.destroy) {
      this.activeBriefingTx.destroy();
      this.activeBriefingTx = null;
    }
    this.stage = stage;
    this.misses = 0;
    this.rung = 0;
    this.solved = false;
    this.openedAt = Date.now();

    this.el.kicker.textContent = `Stage ${stage.index + 1} of ${this.stageCount}`;
    this.el.title.textContent = stage.title;
    this.el.prompt.innerHTML = `<p class="lq-prompt-body">${esc(stage.prompt)}</p>`;
    this.el.readout.innerHTML = '';
    this.el.banner.innerHTML = '';
    this.el.hints.innerHTML = '';
    this.el.controls.innerHTML = '';
    this.el.widget.innerHTML = '';
    this.el.objective.hidden = !stage.briefing;

    this.el.actions.innerHTML = `
      <button type="button" class="btn-secondary lq-hint-key" data-act="hint">Hint</button>
      <button type="button" class="btn-primary lq-commit" data-act="submit">${esc(stage.commitLabel || 'Commit')}</button>
    `;
    this.el.commit = this.el.actions.querySelector('.lq-commit');
    this.el.hintKey = this.el.actions.querySelector('.lq-hint-key');

    this.updateStageActions();
    this.updateRail();
    // Walking to the next stage should bring the bench back into view — on a
    // phone the Next key sits below it. Arriving at the quest should not move
    // the page at all.
    if (advancing) this.container.querySelector('.lq')?.scrollIntoView({ block: 'nearest' });
  }

  updateStageActions() {
    if (!this.el.stageActions) return;
    const canReview = this.stage?.reward && (this.cleared > (this.stage.index ?? 0) || this.solved);
    this.el.stageActions.innerHTML = `
      <button type="button" class="btn-secondary quest-btn-sm" data-act="exit">Exit</button>
      <button type="button" class="btn-secondary quest-btn-sm" data-act="objective">Objective</button>
      ${canReview ? '<button type="button" class="btn-secondary quest-btn-sm" data-act="reward">Findings</button>' : ''}
    `;
  }

  setControls(html) { this.el.controls.innerHTML = html; }
  setWidget(html) { this.el.widget.innerHTML = html; }
  setReadout(html) { this.el.readout.innerHTML = html; }

  setCommitEnabled(on) {
    if (this.el.commit) this.el.commit.disabled = !on;
  }

  setCleared(n) {
    this.cleared = n;
    this.updateRail();
  }

  updateRail() {
    const idx = this.stage ? this.stage.index : 0;
    this.el.rail.querySelectorAll('.lq-lamp').forEach((lamp, i) => {
      lamp.classList.toggle('done', i < this.cleared);
      lamp.classList.toggle('here', i === idx);
      const open = Boolean(this.opts.onJump) && i !== idx && i <= this.cleared;
      lamp.disabled = !open;
      lamp.setAttribute('aria-label', `Stage ${i + 1}${i < this.cleared ? ', cleared' : ''}`);
    });
  }

  /* ---------------- outcome ---------------- */

  /** A wrong commit. The message names what went wrong and where to go looking. */
  miss(message) {
    this.misses++;
    soundscape.playMissBuzzer?.();
    this.el.banner.innerHTML = `
      <div class="stage-error-banner">
        <span class="banner-mark" aria-hidden="true">!!</span>
        <span class="banner-body">${esc(message)}</span>
      </div>
    `;
  }

  clearBanner() { this.el.banner.innerHTML = ''; }

  /**
   * A message that is not a wrong answer: an instrument reading back, or a tool
   * asking for a selection. It must not count as a miss, or fumbling a button
   * would open the hint ladder the player has not earned yet.
   */
  note(message) {
    this.el.banner.innerHTML = `
      <div class="stage-error-banner soft">
        <span class="banner-mark" aria-hidden="true">//</span>
        <span class="banner-body">${esc(message)}</span>
      </div>
    `;
  }

  /**
   * A correct commit. The reward card is the payoff, so it lands here and not in
   * the briefing: concepts are earned, never handed out in advance.
   * @param {{title: string, body: string, log?: string, last?: boolean}} reward
   */
  clear(reward) {
    this.solved = true;
    soundscape.playBondSnap?.();
    this.el.hints.innerHTML = '';
    this.updateStageActions();
    this.el.banner.innerHTML = `
      <div class="stage-error-banner stage-success-banner">
        <span class="banner-mark" aria-hidden="true">//</span>
        <span class="banner-body">${esc(reward.log || 'Logged.')}</span>
      </div>
    `;
    this.el.widget.innerHTML = `
      <div class="lq-reward">
        <div class="eyebrow lit">What you just found</div>
        <h3 class="lq-reward-title">${esc(reward.title)}</h3>
        <p class="lq-reward-body">${esc(reward.body)}</p>
      </div>
    `;
    this.el.actions.innerHTML = `
      <button type="button" class="btn-primary lq-commit" data-act="next">${reward.last ? 'Finish' : 'Next Stage'}</button>
    `;
    this.el.commit = this.el.actions.querySelector('.lq-commit');
    this.el.commit.focus();
  }

  /* ---------------- hints ---------------- */

  /** Which rung the player has earned: looking and missing both open the ladder. */
  availableRung() {
    if (this.misses >= 2) return 3;
    if (this.misses >= 1 || Date.now() - this.openedAt > RUNG2_AFTER_MS) return 2;
    return 1;
  }

  takeHint() {
    if (!this.stage || this.solved) return;
    const hints = this.stage.hints || [];
    const allowed = Math.min(this.availableRung(), hints.length);
    if (this.rung >= allowed) {
      this.el.hints.innerHTML += `
        <p class="lq-hint lq-hint-wait">Keep looking. The next reading opens after another try or after 45 seconds.</p>
      `;
      return;
    }
    this.rung++;
    soundscape.playCrtTick?.();
    this.el.hints.innerHTML += `
      <p class="lq-hint"><span class="lq-hint-rung">${this.rung}</span>${esc(hints[this.rung - 1])}</p>
    `;
  }

  /* ---------------- briefing ---------------- */

  showBriefing() {
    const b = this.stage?.briefing;
    if (!b) return;

    if (this.activeBriefingTx?.destroy) {
      this.activeBriefingTx.destroy();
      this.activeBriefingTx = null;
    }

    const speaker = b.speaker || this.opts.speaker || 'VESS // COMMS';
    const stageIdx = this.stage ? this.stage.index + 1 : 1;

    showModal(`
      <div class="quest-modal-head lq-modal-head" style="margin-bottom: 0.85rem;">
        <div>
          <div class="eyebrow lit">${esc(speaker)}</div>
          <h2 id="lq-briefing-title" class="section-title">${esc(this.stage.title)}</h2>
        </div>
      </div>
      <div id="lq-modal-transmission" style="margin-bottom: 1.15rem;"></div>
      <div class="debrief-controls-left lq-modal-keys">
        <button type="button" class="btn-primary" data-lq-close>Understood</button>
      </div>
    `, {
      labelledBy: 'lq-briefing-title',
      onClose: () => {
        if (this.activeBriefingTx?.destroy) {
          this.activeBriefingTx.destroy();
          this.activeBriefingTx = null;
        }
      }
    });

    this.activeBriefingTx = createTransmissionElement({
      speaker,
      text: b.body,
      badge: `STAGE ${stageIdx} OF ${this.stageCount}`,
      variant: 'hero'
    });
    document.getElementById('lq-modal-transmission')?.appendChild(this.activeBriefingTx.element);

    document.querySelector('[data-lq-close]')?.addEventListener('click', () => {
      if (this.activeBriefingTx?.destroy) {
        this.activeBriefingTx.destroy();
        this.activeBriefingTx = null;
      }
      closeModal();
      soundscape.playNavRelayClick?.();
    });
  }

  showFindings() {
    if (!this.stage?.reward) return;
    const r = this.stage.reward;
    showModal(`
      <div class="quest-modal-head lq-modal-head" style="margin-bottom: 0.85rem;">
        <div>
          <div class="eyebrow lit">What you found</div>
          <h2 id="lq-findings-title" class="section-title">${esc(r.title)}</h2>
        </div>
      </div>
      <p style="font-size: 0.95rem; line-height: 1.6; color: var(--text-primary); margin-bottom: 1.2rem;">${esc(r.body)}</p>
      <div class="debrief-controls-left lq-modal-keys">
        <button type="button" class="btn-primary" data-lq-close>Close</button>
      </div>
    `, {
      labelledBy: 'lq-findings-title'
    });
    document.querySelector('[data-lq-close]')?.addEventListener('click', () => {
      closeModal();
      soundscape.playNavRelayClick?.();
    });
  }

  /**
   * The debrief: an RPG dialogue stepper, the way the campaign epilogue works.
   * This is where the Learn track finally says the words out loud — the intuition
   * has already been built by then, which is the only order that works.
   * @param {{speaker: string, sections: Array<{heading: string, body: string}>}} debrief
   */
  showDebrief(debrief, onDone) {
    let i = 0;
    const total = debrief.sections.length;
    let debriefTx = null;

    const cleanupTx = () => {
      if (debriefTx?.destroy) {
        debriefTx.destroy();
        debriefTx = null;
      }
    };

    const render = () => {
      cleanupTx();
      const s = debrief.sections[i];
      const speaker = debrief.speaker || 'VESS // DEBRIEF';

      showModal(`
        <div class="quest-modal-head lq-modal-head" style="margin-bottom: 0.85rem;">
          <div>
            <div class="eyebrow lit">${esc(speaker)}</div>
            <h2 id="lq-debrief-title" class="section-title">${esc(s.heading)}</h2>
          </div>
          <span class="tag live">${i + 1} / ${total}</span>
        </div>
        <div id="lq-debrief-transmission" style="margin-bottom: 1.15rem;"></div>
        <div class="debrief-controls-left lq-modal-keys">
          <button type="button" class="btn-secondary" data-step="-1" ${i === 0 ? 'disabled' : ''}>Back</button>
          ${i < total - 1
            ? '<button type="button" class="btn-primary" data-step="1">Next</button>'
            : '<button type="button" class="btn-primary" data-step="done">Close Channel</button>'}
        </div>
      `, {
        dismissible: false,
        labelledBy: 'lq-debrief-title',
        onClose: cleanupTx
      });

      debriefTx = createTransmissionElement({
        speaker,
        text: s.body,
        badge: `${i + 1} / ${total}`,
        variant: 'hero'
      });
      document.getElementById('lq-debrief-transmission')?.appendChild(debriefTx.element);

      document.querySelectorAll('[data-step]').forEach(btn => {
        btn.addEventListener('click', () => {
          const v = btn.dataset.step;
          if (v === 'done') {
            cleanupTx();
            closeModal();
            soundscape.playNavRelayClick?.();
            onDone?.();
            return;
          }
          i = Math.max(0, Math.min(total - 1, i + Number(v)));
          soundscape.playCrtTick?.();
          render();
        });
      });
    };

    render();
  }

  dispose() {
    this.disposed = true;
    if (this.activeBriefingTx?.destroy) {
      this.activeBriefingTx.destroy();
      this.activeBriefingTx = null;
    }
    this.container.removeEventListener('click', this.onClick);
    closeModal();
    this.container.innerHTML = '';
  }
}
