/**
 * cinematic.js — Full-screen cinematic player for Avalon story beats.
 *
 * Click / Esc / Space to skip. Handles T1 / reduced-motion fallback cleanly.
 */

import { MEDIA_MANIFEST } from '../media/manifest.js';
import { tierManager } from '../three/tier.js';
import { session } from '../session.js';
import { soundscape } from '../audio/soundscape.js';

let activeCinematicDismiss = null;

/**
 * Play a cinematic sequence. Returns a Promise that resolves when finished or skipped.
 * @param {string} id
 * @returns {Promise<void>}
 */
export function playCinematic(id) {
  return new Promise((resolve) => {
    // If a cinematic is already playing, dismiss it first
    if (activeCinematicDismiss) {
      activeCinematicDismiss();
    }

    const item = MEDIA_MANIFEST[id];
    if (!item) {
      console.warn(`Cinematic "${id}" not in manifest.`);
      resolve();
      return;
    }

    const isReducedMotion = session.reduceMotion || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isTier1 = tierManager.currentTier === 'T1';

    // Duck soundscape bed
    soundscape.duckBed(true);

    const overlay = document.createElement('div');
    overlay.className = 'cinematic-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Cinematic sequence');

    overlay.innerHTML = `
      <div class="cinematic-frame">
        ${(isTier1 || isReducedMotion) ? `
          <img class="cinematic-poster" src="${item.poster}" alt="" />
        ` : `
          <video class="cinematic-video" playsinline poster="${item.poster}" preload="auto">
            ${(item.sources || []).map(s => `<source src="${s.src}" type="${s.type}">`).join('')}
          </video>
        `}
        <div class="cinematic-scanlines" aria-hidden="true"></div>
        <div class="cinematic-caption-bar" id="cinematic-caption"></div>
        <div class="cinematic-skip-cue">
          <span>CLICK / ESC TO SKIP</span>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const captionEl = overlay.querySelector('#cinematic-caption');
    const video = overlay.querySelector('video');

    let cleanedUp = false;
    function cleanup() {
      if (cleanedUp) return;
      cleanedUp = true;
      activeCinematicDismiss = null;
      window.removeEventListener('keydown', onKey);
      overlay.removeEventListener('click', onClick);

      if (video) {
        video.pause();
        video.removeAttribute('src');
        video.load();
      }

      overlay.classList.add('cinematic-fade-out');
      setTimeout(() => {
        overlay.remove();
        soundscape.duckBed(false);
        resolve();
      }, 300);
    }

    activeCinematicDismiss = cleanup;

    function onClick(e) {
      e.stopPropagation();
      cleanup();
    }

    function onKey(e) {
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        cleanup();
      }
    }

    overlay.addEventListener('click', onClick);
    window.addEventListener('keydown', onKey);

    // Captions updater
    const captions = item.captions || [];
    function updateCaption(currentTime) {
      if (!captionEl) return;
      const current = captions.find(c => currentTime >= c.start && currentTime <= c.end);
      if (current) {
        captionEl.textContent = current.text;
        captionEl.classList.remove('hidden');
      } else {
        captionEl.textContent = '';
      }
    }

    if (isTier1 || isReducedMotion || !video) {
      // Show poster and sequence through captions over 3 seconds, then resolve
      if (captions.length > 0) {
        captionEl.textContent = captions[0].text;
        setTimeout(() => {
          if (captions[1]) captionEl.textContent = captions[1].text;
        }, 1500);
      }
      setTimeout(cleanup, 3200);
      return;
    }

    // Video playback
    video.addEventListener('timeupdate', () => {
      updateCaption(video.currentTime);
    });

    video.addEventListener('ended', cleanup);
    video.addEventListener('error', () => {
      console.warn(`Video playback error for "${id}". Falling back to poster.`);
      // If video file isn't present or codec unsupported, show poster and captions
      video.style.display = 'none';
      if (captions.length > 0) {
        captionEl.textContent = captions[0].text;
      }
      setTimeout(cleanup, 2500);
    });

    video.play().catch((err) => {
      console.warn('Cinematic autoplay failed or blocked:', err);
      if (captions.length > 0) {
        captionEl.textContent = captions[0].text;
      }
      setTimeout(cleanup, 2500);
    });
  });
}
