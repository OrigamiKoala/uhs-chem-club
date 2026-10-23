/**
 * story-anim.js — plays a quest's story animation: one scene, a few captions, once.
 *
 * It runs after the debrief of a quest the player has just finished (`stagerunner.js`), is skippable by click, Esc or
 * Space, and is never shown again once played (`session` flag `storyAnim:<quest>`, which syncs with the rest of the
 * player's state). With reduced motion or `3D Off` it shows the scene's last frame and its captions as a short read;
 * nothing is lost. It draws on a 2D canvas, so it needs no WebGL and no baked video.
 */

import { paintScene } from './story-scenes.js';
import { storyFor, storyFlag } from '../story/quest-story.js';
import { session } from '../session.js';

/** How long each caption holds, in ms: a little over a second plus the time to read it. */
const holdFor = text => 1400 + text.length * 38;

/** True when the animation has not been played for this quest and there is one to play. */
export function storyPending(key) {
  return Boolean(storyFor(key)) && !session.hasFlag(storyFlag(key));
}

/**
 * Play the animation for `key` (`'<world>/<quest>'`). Resolves when it ends or is skipped. Marks it as played as soon as it
 * starts, so closing the page mid-scene does not bring it back.
 */
export function playQuestStory(key) {
  return new Promise(resolve => {
    const story = storyFor(key);
    if (!story || typeof document === 'undefined' || session.hasFlag(storyFlag(key))) { resolve(); return; }
    session.setFlag(storyFlag(key), true);

    const still = Boolean(session.reduceMotion || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
    const overlay = document.createElement('div');
    overlay.className = 'story-anim';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Story');
    overlay.innerHTML = `
      <div class="story-anim-frame">
        <canvas class="story-anim-canvas" width="960" height="540"></canvas>
        <p class="story-anim-caption" aria-live="polite"></p>
        <span class="story-anim-skip">${still ? 'Click to continue' : 'Click or Esc to skip'}</span>
      </div>`;
    document.body.appendChild(overlay);
    const canvas = overlay.querySelector('canvas');
    const caption = overlay.querySelector('.story-anim-caption');
    const ctx = canvas.getContext('2d');

    // The captions, then the line that is filed to the case: the one thing this quest added to the investigation.
    const lines = [...story.captions, story.filed];
    const holds = lines.map(holdFor);
    const total = holds.reduce((a, b) => a + b, 0);
    let raf = 0;
    let closed = false;

    const close = () => {
      if (closed) return;
      closed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKey);
      overlay.remove();
      resolve();
    };
    const onKey = e => {
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') { e.preventDefault(); close(); }
    };
    window.addEventListener('keydown', onKey);
    overlay.addEventListener('click', close);

    if (still) {
      paintScene(story.scene, ctx, canvas.width, canvas.height, 1);
      caption.textContent = lines.join(' ');
      return;
    }

    const start = performance.now();
    const frame = now => {
      if (closed) return;
      const elapsed = now - start;
      paintScene(story.scene, ctx, canvas.width, canvas.height, Math.min(1, elapsed / total));
      let at = elapsed;
      let i = 0;
      while (i < holds.length - 1 && at >= holds[i]) { at -= holds[i]; i++; }
      if (caption.textContent !== lines[i]) caption.textContent = lines[i];
      caption.classList.toggle('story-anim-filed', i === lines.length - 1);
      if (elapsed >= total + 900) { close(); return; }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
  });
}
