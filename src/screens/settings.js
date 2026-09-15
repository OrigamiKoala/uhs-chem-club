/**
 * settings.js — Settings, Graphics Tier, and Password Change screen
 */

import { api } from '../api.js';
import { session } from '../session.js';
import { tierManager } from '../three/tier.js';
import { showToast } from '../ui/toast.js';

export function renderSettings(container) {
  container.innerHTML = `
    <div class="screen-container" style="max-width: 680px;">
      <div class="glass-panel" style="margin-bottom: 1.5rem;">
        <h2 class="holo-title" style="margin-bottom: 0;">Settings</h2>
      </div>

      <!-- Section 1: Graphics & Performance -->
      <div class="glass-panel" style="margin-bottom: 1.5rem;">
        <h3 class="holo-title" style="font-size: 1.1rem; color: var(--accent-cyan); margin-bottom: 0.5rem;">
          Graphics Quality
        </h3>
        <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 1.25rem;">
          Switch tiers if experiencing performance issues. All quests function across all tiers.
        </p>

        <div style="display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1.5rem;">
          <label class="choice-option ${tierManager.currentTier === 'T3' ? 'selected' : ''}">
            <input type="radio" name="gfx-tier" value="T3" ${tierManager.currentTier === 'T3' ? 'checked' : ''}>
            <div>
              <div style="font-family: var(--font-display); font-weight: bold; color: #fff;">T3 — High (Desktop)</div>
              <div style="font-size: 0.75rem; color: var(--text-secondary);">60 FPS, full visual effects.</div>
            </div>
          </label>

          <label class="choice-option ${tierManager.currentTier === 'T2' ? 'selected' : ''}">
            <input type="radio" name="gfx-tier" value="T2" ${tierManager.currentTier === 'T2' ? 'checked' : ''}>
            <div>
              <div style="font-family: var(--font-display); font-weight: bold; color: #fff;">T2 — Standard (Chromebook / Mobile)</div>
              <div style="font-size: 0.75rem; color: var(--text-secondary);">30 FPS, optimized performance.</div>
            </div>
          </label>

          <label class="choice-option ${tierManager.currentTier === 'T1' ? 'selected' : ''}">
            <input type="radio" name="gfx-tier" value="T1" ${tierManager.currentTier === 'T1' ? 'checked' : ''}>
            <div>
              <div style="font-family: var(--font-display); font-weight: bold; color: #fff;">T1 — Fallback (No WebGL)</div>
              <div style="font-size: 0.75rem; color: var(--text-secondary);">DOM inputs and static images. Zero WebGL required.</div>
            </div>
          </label>
        </div>

        <div style="border-top: 1px solid var(--border-subtle); padding-top: 1rem; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-weight: 600; font-size: 0.9rem; color: #fff;">Reduce Motion</div>
            <div style="font-size: 0.75rem; color: var(--text-secondary);">Disables camera transitions and motion effects.</div>
          </div>
          <input type="checkbox" id="reduce-motion-checkbox" ${session.reduceMotion ? 'checked' : ''} style="width: 20px; height: 20px; cursor: pointer;">
        </div>
      </div>

      <!-- Section 2: Change Password -->
      <div class="glass-panel">
        <h3 class="holo-title" style="font-size: 1.1rem; color: var(--accent-amber); margin-bottom: 0.5rem;">
          Change Password
        </h3>
        <form id="pw-form">
          <div class="form-group">
            <label class="form-label" for="old-pw">Current Password</label>
            <input type="password" id="old-pw" class="form-input" required autocomplete="current-password">
          </div>

          <div class="form-group">
            <label class="form-label" for="new-pw">New Password (Min 8 characters)</label>
            <input type="password" id="new-pw" class="form-input" minlength="8" required autocomplete="new-password">
          </div>

          <div id="pw-error" class="text-danger hidden" style="font-size: 0.85rem; margin-bottom: 1rem;"></div>

          <button type="submit" id="pw-btn" class="btn-primary" style="width: 100%;">
            Change Password
          </button>
        </form>
      </div>
    </div>
  `;

  // Tier radio changes
  container.querySelectorAll('input[name="gfx-tier"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      tierManager.setTier(e.target.value);
      showToast(`Graphics mode: ${e.target.value}`, 'info');
      renderSettings(container);
    });
  });

  // Motion checkbox
  const motionCheck = container.querySelector('#reduce-motion-checkbox');
  motionCheck.addEventListener('change', (e) => {
    session.setReduceMotion(e.target.checked);
    showToast(`Reduce motion ${e.target.checked ? 'enabled' : 'disabled'}`, 'info');
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
      pwError.textContent = err.message || 'Password update failed.';
      pwError.classList.remove('hidden');
      pwBtn.disabled = false;
      pwBtn.textContent = 'Change Password';
    }
  });
}
