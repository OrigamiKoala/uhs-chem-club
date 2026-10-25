/**
 * story-anim.js — plays the animation a quest ends on: one scene, and Vess saying what the player has just worked out.
 *
 * It is the quest's debrief (`stagerunner.js` plays it when the last stage is cleared, in place of the debrief card). Each
 * of Vess's lines is shown with the part of the scene that illustrates it, and the last is the line filed to the case. The
 * player steps at their own pace (Next, Back, Enter, Space or the arrow keys; a line that is still printing finishes first),
 * and can leave at any point with Skip or Esc: leaving loses nothing, because the quest was recorded as complete when its last
 * stage was solved. With reduced motion or `3D Off` each line's picture is its last frame. It draws on a 2D canvas, so it needs
 * no WebGL and no baked video.
 */

import { paintScene } from './story-scenes.js';
import { setLabelScale } from './story-kit.js';
import { storyFor, storyFlag, storyLines } from '../story/quest-story.js';
import { createTransmissionElement } from './transmission.js';
import { soundscape } from '../audio/soundscape.js';
import { session } from '../session.js';

/** True when this quest ends on an animation. */
export function hasStory(key) {
  return Boolean(storyFor(key));
}

const easeInOut = v => v * v * (3 - 2 * v);
/** How long a picture takes to get from one scene time to another. */
const travel = dt => Math.max(1300, Math.min(3600, Math.abs(dt) * 9500));

/**
 * Play the animation for `key` (`'<world>/<quest>'`). Resolves when it ends or is skipped.
 */
export function playQuestStory(key) {
  return new Promise(resolve => {
    const story = storyFor(key);
    if (!story || typeof document === 'undefined') { resolve(); return; }
    try { session.setFlag(storyFlag(key), true); } catch (err) { /* a seen-mark is never worth a failed ending */ }

    const still = Boolean(session.reduceMotion || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
    const lines = storyLines(story);
    const last = lines.length - 1;

    const overlay = document.createElement('div');
    overlay.className = 'story-anim';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Vess');
    overlay.innerHTML = `
      <div class="story-anim-frame">
        <canvas class="story-anim-canvas" width="1280" height="720" aria-hidden="true"></canvas>
        <div class="story-anim-side">
          <div class="story-anim-tx"></div>
          <div class="story-anim-keys lq-modal-keys">
            <span class="story-anim-pips" aria-hidden="true">${lines.map(() => '<i></i>').join('')}</span>
            <button type="button" class="btn-secondary quest-btn-sm" data-act="back">Back</button>
            <button type="button" class="btn-secondary quest-btn-sm" data-act="skip">Skip</button>
            <button type="button" class="btn-primary quest-btn-sm" data-act="next">Next</button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    const canvas = overlay.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    const txHost = overlay.querySelector('.story-anim-tx');
    const pips = [...overlay.querySelectorAll('.story-anim-pips i')];
    const backBtn = overlay.querySelector('[data-act="back"]');
    const nextBtn = overlay.querySelector('[data-act="next"]');

    let index = 0;
    let tx = null;
    let closed = false;
    let raf = 0;
    // The scene time on screen, and the move it is making to the current line's picture.
    let sceneT = 0;
    let move = { from: 0, to: 0, start: 0, dur: 1 };
    let lastPaint = 0;

    // Printed labels grow when the picture is small, so a phone can still read them.
    const fit = () => setLabelScale(586 / (canvas.getBoundingClientRect().width || 960));
    window.addEventListener('resize', fit);
    fit();

    const draw = (now, clock) => {
      try { paintScene(story.scene, ctx, canvas.width, canvas.height, sceneT, clock); } catch (err) { /* a bad frame never stops the lines */ }
    };

    const close = () => {
      if (closed) return;
      closed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKey, true);
      window.removeEventListener('resize', fit);
      setLabelScale(1);
      tx?.destroy?.();
      overlay.remove();
      resolve();
    };

    const show = (i, now) => {
      index = i;
      const line = lines[i];
      move = { from: sceneT, to: line.to, start: now, dur: still ? 1 : travel(line.to - sceneT) };
      if (still) sceneT = line.to;
      pips.forEach((p, k) => { p.className = k < i ? 'done' : k === i ? 'on' : ''; });
      backBtn.disabled = i === 0;
      nextBtn.textContent = i === last ? 'Done' : 'Next';
      overlay.classList.toggle('story-anim-filed', Boolean(line.filed));
      if (!tx) {
        tx = createTransmissionElement({ speaker: 'Vess', text: line.say, variant: 'hero', badge: line.filed ? 'Filed' : `${i + 1} / ${last + 1}` });
        txHost.appendChild(tx.element);
      } else {
        tx.update({ text: line.say, badge: line.filed ? 'Filed' : `${i + 1} / ${last + 1}` });
      }
      if (still) draw(now, 0);
    };

    const step = dir => {
      const now = performance.now();
      // A line that is still printing is finished first, as in any dialogue.
      if (dir > 0 && tx && !tx.element.classList.contains('finished')) { tx.finish(); return; }
      if (dir > 0 && index === last) { soundscape.playNavRelayClick?.(); close(); return; }
      const to = index + dir;
      if (to < 0 || to > last) return;
      soundscape.playCrtTick?.();
      show(to, now);
    };

    const onKey = e => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); return; }
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight') { e.preventDefault(); e.stopPropagation(); step(1); return; }
      if (e.key === 'ArrowLeft' || e.key === 'Backspace') { e.preventDefault(); e.stopPropagation(); step(-1); }
    };
    window.addEventListener('keydown', onKey, true);
    overlay.querySelector('[data-act="skip"]').addEventListener('click', e => { e.stopPropagation(); close(); });
    backBtn.addEventListener('click', e => { e.stopPropagation(); step(-1); });
    nextBtn.addEventListener('click', e => { e.stopPropagation(); step(1); });
    // A press on the picture steps on, like a press on the dialogue.
    overlay.querySelector('.story-anim-canvas').addEventListener('click', () => step(1));

    const start = performance.now();
    show(0, start);
    if (still) { nextBtn.focus(); return; }

    const frame = now => {
      if (closed) return;
      // 30 frames a second is plenty for a plate, and kindest to a phone.
      if (now - lastPaint >= 32) {
        lastPaint = now;
        const k = Math.min(1, (now - move.start) / move.dur);
        sceneT = move.from + (move.to - move.from) * easeInOut(k);
        draw(now, (now - start) / 1000);
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    nextBtn.focus();
  });
}
