/**
 * encounter.js — The foe plate: a bench stage drawn as a fight.
 *
 * The plate sits at the top of the stage deck and carries four things and no
 * more: the foes (one per sample or plate on the bench), the rig's Integrity,
 * the intent the foe telegraphs, and the beat that follows what the player just
 * did. It is NEVER a modal, and it never asks anything: the prompt on the deck
 * is still the whole task, stated as an objective and never as a route.
 *
 * WHAT IT CAN AND CANNOT DO (docs/plans/storyline-and-combat.md, section 4)
 *   - It OBSERVES. `LearnFrame` tells it a stage began, a commit missed, a
 *     commit cleared, or the bench was worked. It returns nothing the frame
 *     reads, so it has no way to refuse a correct answer, ever.
 *   - A MISS'S REASON COMES FIRST. The frame puts the reason in the live banner;
 *     this only writes to its own plate, and holds the foe's counter back
 *     `COUNTER_DELAY_MS` so the reason has landed before anything else speaks.
 *     It never touches the banner.
 *   - Knock-back refills Integrity and makes the foe whole. Hints, readings,
 *     answers and the miss count are not here to lose.
 *   - Reduced motion turns every beat into a held frame and a line of text.
 */

import { esc } from '../../ui/layout.js';
import { activeBenchViewer, setEncounterSource } from './bench-host.js';
import {
  COUNTER_DELAY_MS, planFoe, portraitSvg, newFight, afterMiss, afterWin
} from './foes.js';
import { getActiveBossArena } from './boss-arena.js';

function reducedMotion() {
  try {
    if (localStorage.getItem('avalon_motion_pref') === 'true') return true;
  } catch { /* storage can be blocked */ }
  try {
    return Boolean(globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  } catch { return false; }
}

export class Encounter {
  /** @param {HTMLElement} host the `.lq-foe` mount inside the deck */
  constructor(host) {
    this.host = host;
    this.enc = null;
    this.fight = null;
    this.poses = new Map();   // foe id -> { pose, plan }
    this.timer = null;
    this.line = '';
    this.tag = '';
    // At T4 the foes are built bodies on the bench (encounter3d.js). They
    // OBSERVE this plate: it hands them a snapshot and never reads one back.
    setEncounterSource(() => this.snapshot());
  }

  /** What the 3D foes are shown: the stage's foes, the fight, and every pose. */
  snapshot() {
    return this.enc ? { enc: this.enc, fight: this.fight, poses: this.poses } : null;
  }

  publish() {
    activeBenchViewer()?.foes?.sync(this.snapshot());
  }

  /**
   * A stage began. `enc` is `resolveEncounter(stage)`, or null for a plain stage.
   * `phase` is `{ index, count }`: which stage of how many, so a boss arena can
   * wear down over the whole fight and not fall over after the first answer.
   */
  begin(enc, phase = null) {
    this.cancel();
    this.enc = enc || null;
    this.poses = new Map();
    this.tag = '';
    this.phase = phase || null;
    if (!this.enc) {
      this.fight = null;
      this.line = '';
      this.host.hidden = true;
      this.host.innerHTML = '';
      this.publish();
      return;
    }
    this.fight = newFight();
    this.line = this.enc.intent;
    this.host.hidden = false;
    this.paint();
    if (this.phase) {
      try { getActiveBossArena()?.setPhase(this.phase.index, this.phase.count, this.rig()); } catch (e) { /* the arena is scenery */ }
    }
  }

  /** The rig's Integrity as the boss plate draws it. */
  rig() {
    return this.fight ? { integrity: this.fight.integrity, max: this.fight.max } : null;
  }

  /**
   * The bench was worked and the foe answers. `probe` is whatever the species'
   * planner reads;
   * the pose comes from `planFoe`, which asks the instrument's own planner.
   */
  react(foeId, probe, quiet = false) {
    if (!this.enc || this.fight?.won) return;
    const foe = this.enc.foes.find(f => f.id === foeId);
    if (!foe) return;
    const plan = planFoe(this.enc, foe, probe);
    if (!plan) return;
    this.poses.set(foeId, plan);
    if (!quiet) {
      // A lone foe's reaction is what the line says, until the player commits
      // or something else moves. In a pack each foe carries its own caption
      // instead, or the last one planned would speak for all of them. A quiet
      // reaction is the bench reporting where it STARTS (the dials as the stage
      // loaded them), which must not talk over the intent.
      if (this.enc.foes.length === 1) this.line = plan.line || this.line;
      this.tag = '';
    }
    this.paint();
  }

  /** A committed miss. The frame has already put the reason on screen. */
  onMiss() {
    if (!this.enc || !this.fight) return;
    const { fight, knockedBack } = afterMiss(this.fight);
    this.fight = fight;
    try {
      getActiveBossArena()?.onWrong({ ...this.rig(), knockedBack });
    } catch (e) { /* the arena is scenery */ }
    this.cancel();
    this.tag = 'counter';
    this.paint();   // Integrity drops now; the words wait for the reason.
    this.timer = setTimeout(() => {
      this.timer = null;
      if (!this.enc) return;
      if (knockedBack) {
        // The foe is whole again. The bench is untouched.
        this.poses = new Map();
        this.tag = 'knockback';
        this.line = this.enc.knockback;
      } else {
        this.line = this.enc.counter;
      }
      this.paint();
    }, COUNTER_DELAY_MS);
  }

  /** A correct commit. Wins on any turn, at any Integrity. */
  onClear() {
    if (!this.enc || !this.fight) return;
    this.cancel();
    const { fight, flawless } = afterWin(this.fight);
    this.fight = fight;
    this.poses = new Map(this.enc.foes.map(f => [f.id, { pose: 'dispersed', line: '' }]));
    this.tag = flawless ? 'flawless' : 'won';
    this.line = this.enc.hit;
    this.paint();
    // A boss has several phases. Every one is won, but only the LAST takes the
    // boss down: the arena is told which phase this was.
    const index = this.phase?.index ?? 0;
    const count = this.phase?.count ?? 1;
    try {
      getActiveBossArena()?.onCorrect({ index, total: count, last: index >= count - 1 });
    } catch (e) { /* the arena is scenery */ }
  }

  cancel() {
    if (this.timer) { clearTimeout(this.timer); this.timer = null; }
  }

  dispose() {
    this.cancel();
    this.enc = null;
    this.publish();
    setEncounterSource(null);
  }

  /* ---------------- drawing ---------------- */

  paint() {
    const enc = this.enc;
    if (!enc) return;
    const f = this.fight;
    const pack = enc.foes.length > 1;
    const pips = Array.from({ length: f.max }, (_, i) =>
      `<i class="${i < f.integrity ? 'on' : ''}"></i>`).join('');

    const foes = enc.foes.map(foe => {
      const got = this.poses.get(foe.id);
      const pose = got?.pose || 'idle';
      return `
        <li class="lq-foe-one" data-foe="${esc(foe.id)}" data-pose="${esc(pose)}">
          ${portraitSvg(enc.species, pose, got)}
          <span class="lq-foe-name">${esc(foe.label)}</span>
          ${pack && got?.line ? `<span class="lq-foe-cap">${esc(got.line)}</span>` : ''}
        </li>`;
    }).join('');

    const tagText = {
      counter: 'Missed Trial',
      knockback: 'Knocked back',
      won: 'Dispersed',
      flawless: 'Flawless'
    }[this.tag] || '';

    this.publish();
    this.host.className = `lq-foe${pack ? ' lq-foe-pack' : ''}${reducedMotion() ? ' lq-foe-still' : ''}`;
    this.host.dataset.beat = this.tag || 'idle';
    this.host.innerHTML = `
      <div class="lq-foe-top">
        <span class="lq-foe-species eyebrow">${esc(enc.speciesName)}${pack ? ` x ${enc.foes.length}` : ''}</span>
        ${tagText ? `<span class="lq-foe-tag">${esc(tagText)}</span>` : ''}
        <span class="lq-integrity" role="img" aria-label="${f.integrity} of ${f.max} attempts remaining">
          ${pips}
        </span>
      </div>
      <ul class="lq-foe-row">${foes}</ul>
      <p class="lq-foe-line" role="status" aria-live="polite">${esc(this.line)}</p>
    `;
  }

  /**
   * A `bins` widget whose stage declares `moves` names the move beside each
   * category: the category IS the move that works on that kind of matter.
   * Called by the frame whenever the answer region is redrawn.
   */
  decorate(widgetEl) {
    const moves = this.enc?.moves;
    if (!moves || !widgetEl?.querySelectorAll) return;
    widgetEl.querySelectorAll('[data-bin]').forEach(key => {
      const verb = moves[key.dataset.bin];
      if (!verb || key.querySelector('.lq-move')) return;
      key.insertAdjacentHTML('beforeend', `<span class="lq-move">Move: ${esc(verb)}</span>`);
    });
  }
}
