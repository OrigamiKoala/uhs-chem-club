/**
 * settings.js — Settings, Graphics Tier, and Password Change screen
 */

import { api } from '../api.js';
import { session } from '../session.js';
import { tierManager } from '../three/tier.js';
import { showToast } from '../ui/toast.js';
import { pageHeader } from '../ui/layout.js';
import { bindPasswordReveal } from './register.js';
import { soundscape } from '../audio/soundscape.js';

export function renderSettings(container) {
  const soundPrefs = session.sound;

  container.innerHTML = `
    <div class="screen-container m-screen m-settings" style="max-width: 680px;">
      ${pageHeader({
        eyebrow: 'Ship systems',
        title: 'Settings',
        actions: `<a href="#/bridge" class="btn-secondary" style="text-decoration: none;">Bridge</a>`
      })}

      <!-- Section 1: Graphics & Performance -->
      <div class="glass-panel" style="margin-bottom: 1.5rem;">
        <h2 class="section-title" style="margin-bottom: 1.25rem;">Graphics Quality</h2>

        <div style="display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1.5rem;">
          <label class="choice-option ${tierManager.currentTier === 'T3' ? 'selected' : ''}">
            <input type="radio" name="gfx-tier" value="T3" ${tierManager.currentTier === 'T3' ? 'checked' : ''}>
            <div>
              <div style="font-family: var(--font-display); font-weight: 600; letter-spacing: 0.12em; color: var(--text-bright);">T3 — HIGH</div>
              <div class="eyebrow" style="margin-top: 3px;">Full effects</div>
            </div>
          </label>

          <label class="choice-option ${tierManager.currentTier === 'T2' ? 'selected' : ''}">
            <input type="radio" name="gfx-tier" value="T2" ${tierManager.currentTier === 'T2' ? 'checked' : ''}>
            <div>
              <div style="font-family: var(--font-display); font-weight: 600; letter-spacing: 0.12em; color: var(--text-bright);">T2 — STANDARD</div>
              <div class="eyebrow" style="margin-top: 3px;">Lighter effects</div>
            </div>
          </label>

          <label class="choice-option ${tierManager.currentTier === 'T1' ? 'selected' : ''}">
            <input type="radio" name="gfx-tier" value="T1" ${tierManager.currentTier === 'T1' ? 'checked' : ''}>
            <div>
              <div style="font-family: var(--font-display); font-weight: 600; letter-spacing: 0.12em; color: var(--text-bright);">T1 — MINIMAL</div>
              <div class="eyebrow" style="margin-top: 3px;">No 3D · menu input</div>
            </div>
          </label>
        </div>

        <div class="settings-motion-row" style="border-top: 1px solid var(--border-durasteel); padding-top: 1rem; display: flex; justify-content: space-between; align-items: center;">
          <div style="font-family: var(--font-display); font-size: 0.85rem; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: var(--text-bright);">Reduce Motion</div>
          <input type="checkbox" id="reduce-motion-checkbox" ${session.reduceMotion ? 'checked' : ''} style="width: 20px; height: 20px; cursor: pointer;">
        </div>
      </div>

      <!-- Section 2: Audio Systems -->
      <div class="glass-panel" style="margin-bottom: 1.5rem;">
        <div class="m-head settings-audio-head" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
          <h2 class="section-title" style="margin: 0;">Audio Systems</h2>
          <button type="button" id="audio-mute-btn" class="btn-secondary" style="font-size: 0.75rem; padding: 6px 14px;">
            ${soundPrefs.muted ? 'UNMUTE SOUND' : 'MUTE SOUND'}
          </button>
        </div>

        <div style="display: flex; flex-direction: column; gap: 1rem;">
          <div>
            <div class="settings-slider-head" style="display: flex; justify-content: space-between; font-size: 0.82rem; margin-bottom: 0.35rem;">
              <span style="font-family: var(--font-display); font-weight: 600; color: var(--text-bright);">Master Volume</span>
              <span id="val-master" style="font-family: var(--font-mono); color: var(--accent-amber);">${Math.round(soundPrefs.masterVolume * 100)}%</span>
            </div>
            <input type="range" class="settings-slider" id="slider-master" min="0" max="100" value="${Math.round(soundPrefs.masterVolume * 100)}" style="width: 100%; accent-color: var(--accent-amber);">
          </div>

          <div>
            <div class="settings-slider-head" style="display: flex; justify-content: space-between; font-size: 0.82rem; margin-bottom: 0.35rem;">
              <span style="font-family: var(--font-display); font-weight: 600; color: var(--text-bright);">Ambience & Engine Hum</span>
              <span id="val-ambience" style="font-family: var(--font-mono); color: var(--accent-amber);">${Math.round(soundPrefs.ambienceVolume * 100)}%</span>
            </div>
            <input type="range" class="settings-slider" id="slider-ambience" min="0" max="100" value="${Math.round(soundPrefs.ambienceVolume * 100)}" style="width: 100%; accent-color: var(--accent-amber);">
          </div>

          <div>
            <div class="settings-slider-head" style="display: flex; justify-content: space-between; font-size: 0.82rem; margin-bottom: 0.35rem;">
              <span style="font-family: var(--font-display); font-weight: 600; color: var(--text-bright);">Effects & Foley</span>
              <span id="val-effects" style="font-family: var(--font-mono); color: var(--accent-amber);">${Math.round(soundPrefs.effectsVolume * 100)}%</span>
            </div>
            <input type="range" class="settings-slider" id="slider-effects" min="0" max="100" value="${Math.round(soundPrefs.effectsVolume * 100)}" style="width: 100%; accent-color: var(--accent-amber);">
          </div>
        </div>
      </div>

      <!-- Section 3: Change Password -->
      <div class="glass-panel">
        <h2 class="section-title">Change Password</h2>
        <form id="pw-form">
          <div class="form-group">
            <label class="form-label" for="old-pw">Current Password</label>
            <div class="input-wrap">
              <input type="password" id="old-pw" class="form-input" required autocomplete="current-password">
              <button type="button" class="reveal-btn" data-reveal="old-pw" aria-label="Show password">SHOW</button>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="new-pw">New Password</label>
            <div class="input-wrap">
              <input type="password" id="new-pw" class="form-input" minlength="8" required autocomplete="new-password">
              <button type="button" class="reveal-btn" data-reveal="new-pw" aria-label="Show password">SHOW</button>
            </div>
            <span class="form-help">8+ characters. No reset email.</span>
          </div>

          <div id="pw-error" class="form-banner hidden" role="alert"></div>

          <button type="submit" id="pw-btn" class="btn-primary" style="width: 100%;">
            Change Password
          </button>
        </form>
      </div>
    </div>
  `;

  bindPasswordReveal(container);

  // Tier radio changes
  container.querySelectorAll('input[name="gfx-tier"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      tierManager.setTier(e.target.value);
      showToast(`Graphics: ${e.target.value}`, 'info');
      renderSettings(container);
    });
  });

  // Audio controls
  const muteBtn = container.querySelector('#audio-mute-btn');
  muteBtn?.addEventListener('click', () => {
    const isMuted = soundscape.toggleMute();
    muteBtn.textContent = isMuted ? 'UNMUTE SOUND' : 'MUTE SOUND';
    showToast(isMuted ? 'Audio muted.' : 'Audio unmuted.', 'info');
  });

  const masterSlider = container.querySelector('#slider-master');
  const masterVal = container.querySelector('#val-master');
  masterSlider?.addEventListener('input', (e) => {
    const val = Number(e.target.value) / 100;
    soundscape.setMasterVolume(val);
    if (masterVal) masterVal.textContent = `${e.target.value}%`;
  });

  const ambSlider = container.querySelector('#slider-ambience');
  const ambVal = container.querySelector('#val-ambience');
  ambSlider?.addEventListener('input', (e) => {
    const val = Number(e.target.value) / 100;
    soundscape.setAmbienceVolume(val);
    if (ambVal) ambVal.textContent = `${e.target.value}%`;
  });

  const effSlider = container.querySelector('#slider-effects');
  const effVal = container.querySelector('#val-effects');
  effSlider?.addEventListener('input', (e) => {
    const val = Number(e.target.value) / 100;
    soundscape.setEffectsVolume(val);
    if (effVal) effVal.textContent = `${e.target.value}%`;
  });

  // Motion checkbox
  const motionCheck = container.querySelector('#reduce-motion-checkbox');
  motionCheck.addEventListener('change', (e) => {
    session.setReduceMotion(e.target.checked);
    showToast(`Reduce motion ${e.target.checked ? 'on' : 'off'}.`, 'info');
  });

  // Password form
  const pwForm = container.querySelector('#pw-form');
  const pwError = container.querySelector('#pw-error');
  const pwBtn = container.querySelector('#pw-btn');

  pwForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    pwError.classList.add('hidden');
    pwBtn.disabled = true;
    pwBtn.textContent = 'Saving…';

    const oldPw = container.querySelector('#old-pw').value;
    const newPw = container.querySelector('#new-pw').value;

    try {
      await api.changePassword(oldPw, newPw);
      showToast('Password changed.', 'success');
      pwForm.reset();
      pwBtn.disabled = false;
      pwBtn.textContent = 'Change Password';
    } catch (err) {
      pwError.innerHTML = `<span>${err.message || 'Password update failed.'}</span>`;
      pwError.classList.remove('hidden');
      pwBtn.disabled = false;
      pwBtn.textContent = 'Change Password';
    }
  });
}
