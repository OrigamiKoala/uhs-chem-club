/**
 * quarters.js — Crew Quarters & Avatar Customization screen
 */

import { api } from '../api.js';
import { session } from '../session.js';
import { stage } from '../three/stage.js';
import { showToast } from '../ui/toast.js';

export function renderQuarters(container) {
  if (stage.cameraRig) {
    stage.cameraRig.moveTo('quarters');
  }

  const p = session.player || {};
  let avatar = { suitColor: 'default', helmet: 'mark1', visor: 'gold', skin: 'medium' };
  try {
    if (p.avatar_json) avatar = JSON.parse(p.avatar_json);
  } catch (e) {}

  container.innerHTML = `
    <div class="screen-container" style="max-width: 840px;">
      <div class="glass-panel" style="margin-bottom: 1.5rem;">
        <h2 class="holo-title" style="margin-bottom: 0.2rem;">Quarters</h2>
        <p class="holo-subtitle">Customize avatar and display name.</p>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.5rem;">
        <!-- Left: Suit & Badge Preview -->
        <div class="holo-card" style="text-align: center;">
          <h3 style="font-family: var(--font-display); font-size: 1.1rem; color: var(--accent-cyan); margin-bottom: 1rem;">
            Avatar
          </h3>

          <!-- Visual Layered Avatar SVG -->
          <div style="width: 140px; height: 140px; margin: 0 auto 1.25rem; background: rgba(3, 7, 18, 0.8); border: 2px solid var(--border-strong); border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: var(--glow-cyan);">
            <svg viewBox="0 0 100 100" width="100" height="100">
              <!-- Suit Body -->
              <path d="M 25 90 Q 50 70 75 90 L 75 100 L 25 100 Z" fill="${avatar.suitColor === 'ignis' ? '#bf360c' : avatar.suitColor === 'terra' ? '#1b5e20' : avatar.suitColor === 'thalassa' ? '#0d47a1' : '#006064'}"/>
              <!-- Helmet Outline -->
              <circle cx="50" cy="45" r="28" fill="#1e293b" stroke="#00e5ff" stroke-width="2.5"/>
              <!-- Visor -->
              <ellipse cx="50" cy="46" rx="20" ry="14" fill="${avatar.visor === 'gold' ? '#ffea46' : avatar.visor === 'cyan' ? '#00e5ff' : '#ff5252'}" opacity="0.85"/>
              <!-- Visor Glare -->
              <path d="M 36 40 Q 50 34 64 40" stroke="#ffffff" stroke-width="2" fill="none" opacity="0.75"/>
            </svg>
          </div>

          <div style="font-family: var(--font-display); font-size: 1.25rem; font-weight: 800; color: var(--text-bright); margin-bottom: 0.2rem;">
            ${p.display_name || 'Cadet'}
          </div>
          <div style="font-size: 0.85rem; color: var(--accent-cyan); margin-bottom: 1.5rem;">
            ${p.role || 'Unassigned'} // ${session.team?.corp_name || 'Freelancer'}
          </div>

          <!-- Avatar Customization Controls -->
          <div style="text-align: left; font-size: 0.8rem;">
            <div class="form-group">
              <label class="form-label">Visor Color</label>
              <select id="avatar-visor" class="form-select">
                <option value="gold" ${avatar.visor === 'gold' ? 'selected' : ''}>Solar Gold</option>
                <option value="cyan" ${avatar.visor === 'cyan' ? 'selected' : ''}>Ion Cyan</option>
                <option value="red" ${avatar.visor === 'red' ? 'selected' : ''}>Plasma Red</option>
              </select>
            </div>
            <button type="button" id="save-avatar-btn" class="btn-primary" style="width: 100%; font-size: 0.8rem;">
              Save Avatar
            </button>
          </div>
        </div>

        <!-- Right: Rename & Identity Badge -->
        <div class="glass-panel">
          <h3 class="holo-title" style="font-size: 1.1rem; color: var(--accent-amber); margin-bottom: 0.5rem;">
            Display Name
          </h3>
          <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 1.25rem; line-height: 1.5;">
            Public on leaderboards. 7-day cooldown between changes.
          </p>

          <form id="rename-form">
            <div class="form-group">
              <label class="form-label" for="new-display-name">New Display Name</label>
              <input type="text" id="new-display-name" class="form-input" placeholder="e.g. OrionPulse" minlength="3" maxlength="20" required>
            </div>

            <div id="rename-error" class="text-danger hidden" style="font-size: 0.85rem; margin-bottom: 1rem;"></div>

            <button type="submit" id="rename-btn" class="btn-primary" style="width: 100%;">
              Update Name
            </button>
          </form>
        </div>
      </div>
    </div>
  `;

  // Avatar save
  const saveAvatarBtn = container.querySelector('#save-avatar-btn');
  const visorSelect = container.querySelector('#avatar-visor');
  saveAvatarBtn.addEventListener('click', async () => {
    saveAvatarBtn.disabled = true;
    saveAvatarBtn.textContent = 'Saving…';
    avatar.visor = visorSelect.value;

    try {
      const res = await api.updateSettings({ avatar_json: avatar });
      session.setUserData(res);
      showToast('Avatar updated.', 'success');
      renderQuarters(container);
    } catch (e) {
      showToast(e.message || 'Failed to update avatar', 'error');
      saveAvatarBtn.disabled = false;
      saveAvatarBtn.textContent = 'Save Avatar';
    }
  });

  // Rename form
  const renameForm = container.querySelector('#rename-form');
  const renameError = container.querySelector('#rename-error');
  const renameBtn = container.querySelector('#rename-btn');

  renameForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    renameError.classList.add('hidden');
    renameBtn.disabled = true;
    renameBtn.textContent = 'Saving…';

    const newName = container.querySelector('#new-display-name').value.trim();

    try {
      const res = await api.rename(newName);
      session.setUserData(res);
      showToast('Display name updated.', 'success');
      renderQuarters(container);
    } catch (err) {
      renameError.textContent = err.message || 'Rename failed.';
      renameError.classList.remove('hidden');
      renameBtn.disabled = false;
      renameBtn.textContent = 'Update Name';
    }
  });
}
