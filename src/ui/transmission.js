/**
 * transmission.js — Diegetic comms transmission component.
 *
 * Displays a CRT inset showing the Vess silhouette / analog static raster,
 * with typewriter-printed transmission copy and subtle radio murmur audio.
 * Clicking/tapping skips typing immediately.
 */

import { soundscape } from '../audio/soundscape.js';

export function createTransmissionElement(opts = {}) {
  const { speaker = 'Vess // Comms', text = '', onComplete = null } = opts;

  const container = document.createElement('div');
  container.className = 'transmission-card';
  container.setAttribute('role', 'status');
  container.setAttribute('aria-live', 'polite');

  container.innerHTML = `
    <div class="transmission-crt">
      <video class="transmission-video" poster="/video/vess_transmission.jpg" playsinline autoplay loop muted preload="auto">
        <source src="/video/vess_transmission.webm" type="video/webm">
        <source src="/video/vess_transmission.mp4" type="video/mp4">
      </video>
      <div class="transmission-raster" aria-hidden="true"></div>
    </div>
    <div class="transmission-body">
      <div class="transmission-speaker eyebrow lit">${speaker}</div>
      <div class="transmission-text" id="typewriter-text"></div>
      <div class="transmission-skip-hint">TAP TO SKIP</div>
    </div>
  `;

  const crtVideo = container.querySelector('video');
  if (crtVideo) {
    crtVideo.play().catch(() => {});
  }

  const textEl = container.querySelector('#typewriter-text');
  let charIndex = 0;
  let timer = null;
  let isDone = false;

  function finish() {
    if (isDone) return;
    isDone = true;
    if (timer) clearInterval(timer);
    soundscape.stopMurmur();
    textEl.textContent = text;
    container.classList.add('finished');
    if (onComplete) onComplete();
  }

  container.addEventListener('click', () => {
    if (!isDone) finish();
  });

  // Start typewriter and murmur
  soundscape.startMurmur();

  timer = setInterval(() => {
    charIndex += 2;
    if (charIndex >= text.length) {
      charIndex = text.length;
      finish();
    } else {
      textEl.textContent = text.slice(0, charIndex);
      // Soft CRT tick every 6 chars
      if (charIndex % 6 === 0) {
        soundscape.playCrtTick();
      }
    }
  }, 28);

  return {
    element: container,
    finish,
    destroy: () => {
      if (timer) clearInterval(timer);
      soundscape.stopMurmur();
    }
  };
}
