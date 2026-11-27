import { api } from '../api.js';
import { session } from '../session.js';
import { stage } from '../three/stage.js';
import { tierManager, isT4Capable, isTouchPrimary } from '../three/tier.js';
import { showToast } from '../ui/toast.js';
import { pageHeader } from '../ui/layout.js';
import { bindPasswordReveal } from './register.js';
import { soundscape } from '../audio/soundscape.js';

export function renderSettings(container) {
  const sound = session.sound || { master: 60, ambience: 60, effects: 60, muted: false };
  const pct = v => Math.round(Number.isFinite(Number(v)) ? Number(v) : 60);
  const isT4 = tierManager.currentTier === 'T4';
  // The device's capability: a player on a lower tier can always ask for T4.
  const eligibleT4 = isT4Capable();
  const is3D = tierManager.is3D();
  const help3D = !eligibleT4
    ? 'This device cannot run it (it needs WebGL2).'
    : (isTouchPrimary() ? 'Walk the ship and the worlds in 3D with the on-screen sticks.' : 'Walk the ship and the worlds in 3D.');

  const terminalHeaderMarkup = isT4 ? `
    <div class="terminal-header">
      <h2 class="section-title settings-terminal-title">Settings</h2>
      <button type="button" id="close-settings-terminal-btn" class="terminal-close-btn">Close</button>
    </div>
  ` : pageHeader({
    title: 'Settings',
    actions: `<a href="#/bridge" class="btn-secondary settings-back">Bridge</a>`
  });

  const slider = (id, valId, label, value) => `
    <div class="settings-slider-row">
      <div class="settings-slider-head">
        <label class="settings-row-label" for="${id}">${label}</label>
        <output id="${valId}" class="settings-value" for="${id}">${value}%</output>
      </div>
      <input type="range" class="settings-slider" id="${id}" min="0" max="100" value="${value}">
    </div>`;

  container.innerHTML = `
    <div class="${isT4 ? 'in-world-terminal settings-terminal m-screen m-settings' : 'screen-container m-screen m-settings settings-screen'}">
      ${terminalHeaderMarkup}

      <section class="glass-panel settings-section" aria-labelledby="settings-gfx">
        <h2 id="settings-gfx" class="section-title">Graphics</h2>

        <div class="settings-choices" role="radiogroup" aria-labelledby="settings-gfx">
          <label class="choice-option settings-choice ${is3D ? 'selected' : ''} ${!eligibleT4 ? 'disabled' : ''}">
            <input type="radio" class="settings-lamp" name="gfx-3d" value="on" ${is3D ? 'checked' : ''} ${!eligibleT4 ? 'disabled' : ''}>
            <span class="settings-choice-text">
              <span class="settings-choice-name">3D On</span>
              <span class="settings-choice-help">${help3D}</span>
            </span>
          </label>

          <label class="choice-option settings-choice ${!is3D ? 'selected' : ''}">
            <input type="radio" class="settings-lamp" name="gfx-3d" value="off" ${!is3D ? 'checked' : ''}>
            <span class="settings-choice-text">
              <span class="settings-choice-name">3D Off</span>
              <span class="settings-choice-help">Flat 2D screens. Use this on slower devices.</span>
            </span>
          </label>
        </div>

        <label class="settings-row">
          <span class="settings-row-label">Reduce Motion</span>
          <input type="checkbox" class="settings-switch" id="reduce-motion-checkbox" ${session.reduceMotion ? 'checked' : ''}>
        </label>
      </section>

      <section class="glass-panel settings-section" aria-labelledby="settings-audio">
        <h2 id="settings-audio" class="section-title">Audio</h2>

        <label class="settings-row settings-row-first">
          <span class="settings-row-label">Mute</span>
          <input type="checkbox" class="settings-switch" id="audio-mute-checkbox" ${sound.muted ? 'checked' : ''}>
        </label>

        <div class="settings-sliders${sound.muted ? ' is-muted' : ''}">
          ${slider('slider-master', 'val-master', 'Volume', pct(sound.master))}
          ${slider('slider-ambience', 'val-ambience', 'Ambience', pct(sound.ambience))}
          ${slider('slider-effects', 'val-effects', 'Sound Effects', pct(sound.effects))}
        </div>
      </section>

      <!-- Section: Privacy & Standings (accounts only: a guest is never on a board) -->
      ${session.isGuest ? '' : `
      <section class="glass-panel settings-section" aria-labelledby="settings-privacy">
        <h2 id="settings-privacy" class="section-title">Privacy & Standings</h2>
        <label class="settings-row settings-row-first">
          <span>
            <span class="settings-row-label">Hide My Name on Standings</span>
            <span class="settings-choice-help">Other players see "Crew · [Guild]" instead of your name.</span>
          </span>
          <input type="checkbox" class="settings-switch" id="board-optout-checkbox" ${session.player?.board_optout ? 'checked' : ''}>
        </label>
      </section>

      <section class="glass-panel settings-section" aria-labelledby="settings-pw">
        <h2 id="settings-pw" class="section-title">Change Password</h2>
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
            <span class="form-help">8+ characters</span>
          </div>

          <div id="pw-error" class="form-banner hidden" role="alert"></div>

          <button type="submit" id="pw-btn" class="btn-primary settings-submit">
            Change Password
          </button>
        </form>
      </section>
      `}
    </div>
  `;

  bindPasswordReveal(container);

  // 3D radio changes
  container.querySelectorAll('input[name="gfx-3d"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      const enable = e.target.value === 'on';
      tierManager.choose3D(enable);
      showToast(enable ? 'Graphics: 3D On' : 'Graphics: 3D Off', 'info');
      renderSettings(container);
    });
  });

  // Audio. The soundscape listens to the session, so writing the setting is
  // what changes the gain; there is no separate audio call to make.
  const muteCheck = container.querySelector('#audio-mute-checkbox');
  const sliders = container.querySelector('.settings-sliders');
  muteCheck?.addEventListener('change', (e) => {
    const muted = e.target.checked;
    session.setSound({ muted });
    sliders?.classList.toggle('is-muted', muted);
    if (!muted) soundscape.playToggleClack?.();
  });

  [['#slider-master', '#val-master', 'master'],
   ['#slider-ambience', '#val-ambience', 'ambience'],
   ['#slider-effects', '#val-effects', 'effects']].forEach(([sel, outSel, key]) => {
    const input = container.querySelector(sel);
    const out = container.querySelector(outSel);
    input?.addEventListener('input', (e) => {
      if (out) out.textContent = `${e.target.value}%`;
      session.setSound({ [key]: Number(e.target.value) });
    });
  });

  // Motion checkbox
  const motionCheck = container.querySelector('#reduce-motion-checkbox');
  motionCheck?.addEventListener('change', (e) => {
    session.setReduceMotion(e.target.checked);
    showToast(`Reduce motion ${e.target.checked ? 'on' : 'off'}.`, 'info');
  });

  // Privacy checkbox
  const optoutCheck = container.querySelector('#board-optout-checkbox');
  optoutCheck?.addEventListener('change', async (e) => {
    const checked = e.target.checked;
    if (session.player) session.player.board_optout = checked;
    try {
      await api.updateSettings({ board_optout: checked });
      showToast(checked ? 'Public board name hidden.' : 'Public board name shown.', 'info');
    } catch (err) {
      showToast('Setting saved locally.', 'info');
    }
  });

  // Password form
  const pwForm = container.querySelector('#pw-form');
  const pwError = container.querySelector('#pw-error');
  const pwBtn = container.querySelector('#pw-btn');

  pwForm?.addEventListener('submit', async (e) => {
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

  container.querySelector('#close-settings-terminal-btn')?.addEventListener('click', () => {
    const term = container.querySelector('.in-world-terminal');
    if (term) term.style.display = 'none';
    stage.syncTouchControls?.(performance.now(), true);
  });
}

