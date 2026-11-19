/**
 * cutscene-player.js — plays a lore cutscene (`cutscene/index.js`): a letterboxed 2D scene with Vess's lines as subtitles.
 *
 * The scene runs on its own. When it reaches the end of a beat that has a line, it holds there (the dust still drifts)
 * until the player goes on, so nobody has to read against the clock. Beats without a line play straight through.
 *   Next / Enter / Space / right arrow: finish the line that is printing, else go on to the next beat.
 *   Back / left arrow: back to the previous line.
 *   Skip: end it now (as if it had played out).  Esc / Close: leave without going on.
 * With reduced motion, only the spoken beats are shown, each as its last frame.
 *
 * Resolves 'done' when it plays out or is skipped, and 'closed' when it is closed.
 */

import { cutsceneFor } from './cutscene/index.js';
import { soundscape } from '../audio/soundscape.js';
import { session } from '../session.js';

const CHAR_MS = 24;

/** True when `id` has a cutscene. */
export function hasCutscene(id) {
  return Boolean(cutsceneFor(id));
}

/**
 * @param {string} id
 * @param {{ doneLabel?: string, title?: string }} opts
 * @returns {Promise<'done' | 'closed'>}
 */
export function playCutscene(id, opts = {}) {
  return new Promise(resolve => {
    const scene = cutsceneFor(id);
    if (!scene || typeof document === 'undefined') { resolve('done'); return; }

    const still = Boolean(session.reduceMotion || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
    const beats = scene.beats;
    const starts = [];
    beats.reduce((t, b) => { starts.push(t); return t + b.dur; }, 0);
    const endOf = i => starts[i] + beats[i].dur;
    const spoken = beats.map((b, i) => (b.say ? i : -1)).filter(i => i >= 0);
    const lastBeat = beats.length - 1;

    const overlay = document.createElement('div');
    overlay.className = 'cutscene';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', opts.title || 'Briefing');
    overlay.innerHTML = `
      <div class="cutscene-frame">
        <div class="cutscene-stage">
          <canvas class="cutscene-canvas" width="1280" height="720" aria-hidden="true"></canvas>
          <button type="button" class="cutscene-close" data-act="close" aria-label="Close">Close</button>
        </div>
        <div class="cutscene-sub" aria-live="polite">
          <span class="cutscene-speaker"></span>
          <p class="cutscene-line"></p>
        </div>
        <div class="cutscene-keys">
          <span class="cutscene-pips" aria-hidden="true">${spoken.map(() => '<i></i>').join('')}</span>
          <button type="button" class="btn-secondary quest-btn-sm" data-act="back">Back</button>
          <button type="button" class="btn-secondary quest-btn-sm" data-act="skip">Skip</button>
          <button type="button" class="btn-primary quest-btn-sm" data-act="next">Next</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    const canvas = overlay.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    const speakerEl = overlay.querySelector('.cutscene-speaker');
    const lineEl = overlay.querySelector('.cutscene-line');
    const pips = [...overlay.querySelectorAll('.cutscene-pips i')];
    const backBtn = overlay.querySelector('[data-act="back"]');
    const nextBtn = overlay.querySelector('[data-act="next"]');
    try { soundscape.duckBed?.(true); } catch (err) { /* sound is never worth a failed scene */ }

    let T = 0;
    let beat = 0;
    let holding = false;
    let closed = false;
    let raf = 0;
    let last = performance.now();
    const t0 = last;
    let lastPaint = 0;
    // The line on screen and when it began printing.
    let say = '';
    let sayStart = 0;
    let typed = true;

    const paint = clock => {
      try { scene.paint(ctx, T, clock); } catch (err) { /* a bad frame never stops the scene */ }
    };

    const setLine = (text, speaker, now) => {
      say = text || '';
      sayStart = now;
      typed = !say || still;
      speakerEl.textContent = say ? (speaker || 'Vess') : '';
      lineEl.textContent = typed ? say : '';
      overlay.classList.toggle('cutscene-quiet', !say);
    };

    const refreshKeys = () => {
      const cur = spoken.filter(i => i <= beat).length - 1;
      const speaking = Boolean(beats[beat].say);
      pips.forEach((p, i) => { p.className = i < cur || (i === cur && !speaking) ? 'done' : i === cur ? 'on' : ''; });
      backBtn.disabled = !spoken.some(i => i < beat) && !(speaking && (holding || !still));
      nextBtn.textContent = beat === lastBeat && holding ? (opts.doneLabel || 'Done') : 'Next';
    };

    const enter = (i, now) => {
      beat = i;
      T = starts[i];
      holding = false;
      setLine(beats[i].say, beats[i].speaker, now);
      if (still) { T = endOf(i); holding = true; paint(0); }
      refreshKeys();
    };

    const close = result => {
      if (closed) return;
      closed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKey, true);
      try { soundscape.duckBed?.(false); } catch (err) { /* ignore */ }
      overlay.remove();
      resolve(result);
    };

    const next = () => {
      const now = performance.now();
      if (!typed) { typed = true; lineEl.textContent = say; return; }
      soundscape.playToggleClack?.();
      if (holding || beats[beat].say) {
        if (beat === lastBeat) { close('done'); return; }
        // Still: step to the next spoken beat. Moving: on to the next beat, which plays from its start.
        if (still) { const n = spoken.find(i => i > beat); if (n == null) close('done'); else enter(n, now); return; }
        enter(beat + 1, now);
        return;
      }
      // A beat with no line: jump to the next one that has one.
      const n = spoken.find(i => i > beat);
      if (n == null) { close('done'); return; }
      enter(n, now);
    };

    const back = () => {
      const now = performance.now();
      // A line that has been up a moment starts over; otherwise go to the line before it.
      const restart = !still && beats[beat].say && (holding || T > starts[beat] + 0.6);
      const to = restart ? beat : [...spoken].reverse().find(i => i < beat);
      if (to == null) return;
      soundscape.playToggleClack?.();
      enter(to, now);
    };

    const onKey = e => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close('closed'); return; }
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight') { e.preventDefault(); e.stopPropagation(); next(); return; }
      if (e.key === 'ArrowLeft') { e.preventDefault(); e.stopPropagation(); back(); }
    };
    window.addEventListener('keydown', onKey, true);
    overlay.querySelector('[data-act="close"]').addEventListener('click', e => { e.stopPropagation(); close('closed'); });
    overlay.querySelector('[data-act="skip"]').addEventListener('click', e => { e.stopPropagation(); close('done'); });
    backBtn.addEventListener('click', e => { e.stopPropagation(); back(); });
    nextBtn.addEventListener('click', e => { e.stopPropagation(); next(); });
    canvas.addEventListener('click', () => next());

    enter(still ? spoken[0] : 0, t0);
    nextBtn.focus();
    if (still) return;

    const frame = now => {
      if (closed) return;
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      if (!holding) {
        T += dt;
        if (T >= endOf(beat)) {
          if (beats[beat].say || beat === lastBeat) { T = endOf(beat); holding = true; refreshKeys(); }
          else enter(beat + 1, now);
        }
      }
      if (!typed) {
        const n = Math.floor((now - sayStart) / CHAR_MS);
        if (n >= say.length) { typed = true; lineEl.textContent = say; } else lineEl.textContent = say.slice(0, n);
      }
      // 30 frames a second is plenty, and kindest to a phone.
      if (now - lastPaint >= 32) { lastPaint = now; paint((now - t0) / 1000); }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
  });
}
