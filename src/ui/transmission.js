/**
 * transmission.js — Diegetic comms transmission component.
 *
 * Displays a CRT inset showing the Vess silhouette / analog static raster,
 * with typewriter-printed transmission copy and subtle radio murmur audio.
 * Clicking/tapping skips typing immediately.
 */

import { soundscape } from '../audio/soundscape.js';

export function createTransmissionElement(opts = {}) {
  const {
    speaker = 'Vess // Comms',
    text = '',
    badge = '',
    subtitle = '',
    accentColor = '',
    variant = '',
    speed = 'normal',
    onComplete = null
  } = opts;

  let currentSpeaker = speaker;
  let currentText = text;
  let currentBadge = badge;
  let currentSubtitle = subtitle;
  let currentOnComplete = onComplete;

  const container = document.createElement('div');
  container.className = `transmission-card ${variant ? `transmission-${variant}` : ''}`.trim();
  container.setAttribute('role', 'status');
  container.setAttribute('aria-live', 'polite');
  if (accentColor) {
    container.style.borderLeftColor = accentColor;
  }

  container.innerHTML = `
    <div class="transmission-crt">
      <video class="transmission-video" poster="/video/vess_transmission.jpg" playsinline autoplay loop muted preload="auto">
        <source src="/video/vess_transmission.webm" type="video/webm">
        <source src="/video/vess_transmission.mp4" type="video/mp4">
      </video>
      <div class="transmission-raster" aria-hidden="true"></div>
    </div>
    <div class="transmission-body">
      <div class="transmission-header-row" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.2rem;">
        <div class="transmission-speaker eyebrow lit">${currentSpeaker}</div>
        <span class="transmission-badge tag live ${currentBadge ? '' : 'hidden'}" style="font-size: 0.58rem; padding: 1px 6px;">${currentBadge}</span>
      </div>
      <div class="transmission-subtitle eyebrow ${currentSubtitle ? '' : 'hidden'}" style="font-size: 0.62rem; color: var(--text-muted); margin-bottom: 0.25rem;">${currentSubtitle}</div>
      <div class="transmission-text" id="typewriter-text"></div>
      <div class="transmission-skip-hint">TAP TO SKIP</div>
    </div>
  `;

  const crtVideo = container.querySelector('video');
  if (crtVideo) {
    crtVideo.play().catch(() => {});
  }

  const textEl = container.querySelector('#typewriter-text');
  const speakerEl = container.querySelector('.transmission-speaker');
  const badgeEl = container.querySelector('.transmission-badge');
  const subtitleEl = container.querySelector('.transmission-subtitle');

  let charIndex = 0;
  let timer = null;
  let isDone = false;

  function finish() {
    if (isDone) return;
    isDone = true;
    if (timer) clearInterval(timer);
    timer = null;
    soundscape.stopMurmur();
    textEl.textContent = currentText;
    container.classList.add('finished');
    if (currentOnComplete) currentOnComplete();
  }

  container.addEventListener('click', () => {
    if (!isDone) finish();
  });

  function startTyping() {
    if (timer) clearInterval(timer);
    charIndex = 0;
    isDone = false;
    container.classList.remove('finished');
    textEl.textContent = '';

    soundscape.startMurmur();

    const isSlow = speed === 'slow';
    const step = isSlow ? 1 : 2;
    const interval = isSlow ? 38 : 28;
    const tickMod = isSlow ? 3 : 6;

    timer = setInterval(() => {
      charIndex += step;
      if (charIndex >= currentText.length) {
        charIndex = currentText.length;
        finish();
      } else {
        textEl.textContent = currentText.slice(0, charIndex);
        if (charIndex % tickMod === 0) {
          soundscape.playCrtTick();
        }
      }
    }, interval);
  }

  startTyping();

  function update(newOpts = {}) {
    if (newOpts.speaker !== undefined) {
      currentSpeaker = newOpts.speaker;
      if (speakerEl) speakerEl.textContent = currentSpeaker;
    }
    if (newOpts.badge !== undefined) {
      currentBadge = newOpts.badge;
      if (badgeEl) {
        badgeEl.textContent = currentBadge;
        badgeEl.classList.toggle('hidden', !currentBadge);
      }
    }
    if (newOpts.subtitle !== undefined) {
      currentSubtitle = newOpts.subtitle;
      if (subtitleEl) {
        subtitleEl.textContent = currentSubtitle;
        subtitleEl.classList.toggle('hidden', !currentSubtitle);
      }
    }
    if (newOpts.accentColor !== undefined) {
      container.style.borderLeftColor = newOpts.accentColor;
    }
    if (newOpts.onComplete !== undefined) {
      currentOnComplete = newOpts.onComplete;
    }
    if (newOpts.text !== undefined && newOpts.text !== currentText) {
      currentText = newOpts.text;
      startTyping();
    }
  }

  return {
    element: container,
    finish,
    update,
    destroy: () => {
      if (timer) clearInterval(timer);
      timer = null;
      soundscape.stopMurmur();
      if (crtVideo) crtVideo.pause();
    }
  };
}
