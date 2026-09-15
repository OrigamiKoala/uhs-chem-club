/**
 * quarters.js — Profile & Avatar Customization
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
    <div class="screen-container" style="max-width: 860px;">
      <div class="glass-panel" style="margin-bottom: 1.5rem; border-color: var(--border-durasteel); background: rgba(18, 20, 26, 0.94);">
        <h2 style="font-family: var(--font-imperial); font-size: 1.6rem; letter-spacing: 0.08em; color: #fffdf7; margin-bottom: 0.2rem;">
          Profile Settings
        </h2>
        <p style="font-family: var(--font-main); font-size: 0.9rem; color: var(--text-secondary);">
          Customize your avatar appearance and display name.
        </p>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.5rem;">
        <!-- Left: Avatar -->
        <div class="holo-card" style="text-align: center; border-color: var(--border-durasteel); background: #14161c;">
          <div style="width: 130px; height: 130px; margin: 0 auto 1.25rem; background: #0c0e12; border: 2px solid var(--border-durasteel); border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: inset 0 0 14px rgba(0,0,0,0.9), 0 0 16px rgba(255,159,28,0.2);">
            <svg viewBox="0 0 100 100" width="90" height="90">
              <circle cx="50" cy="45" r="28" fill="#1b1e25" stroke="#3e4554" stroke-width="3"/>
              <ellipse cx="50" cy="46" rx="20" ry="14" fill="${avatar.visor === 'gold' ? '#f4a261' : avatar.visor === 'green' ? '#38b000' : '#c85a17'}" opacity="0.9"/>
              <path d="M 38 40 Q 50 36 62 40" stroke="rgba(255,255,255,0.4)" stroke-width="2" fill="none"/>
              <path d="M 22 90 Q 50 68 78 90 L 78 100 L 22 100 Z" fill="${(avatar.suitColor === 'fire' || avatar.suitColor === 'ignis') ? '#c85a17' : (avatar.suitColor === 'earth' || avatar.suitColor === 'terra') ? '#a3824c' : (avatar.suitColor === 'water' || avatar.suitColor === 'thalassa') ? '#2a9d8f' : '#8a9ba8'}"/>
            </svg>
          </div>

          <div style="font-family: var(--font-display); font-size: 1.25rem; font-weight: 800; color: #fffdf7; margin-bottom: 0.2rem;">
            ${p.display_name || 'Player'}
          </div>
          <div style="font-family: var(--font-mono); font-size: 0.8rem; font-weight: 700; color: var(--accent-amber); margin-bottom: 1.5rem; text-transform: uppercase;">
            ${session.team?.name || session.team?.team_id || 'No Team'}
          </div>

          <!-- Avatar Customization Controls -->
          <div style="text-align: left; font-size: 0.8rem;">
            <div class="form-group">
              <label class="form-label" for="avatar-visor">Visor Color</label>
              <select id="avatar-visor" class="form-select">
                <option value="gold" ${avatar.visor === 'gold' ? 'selected' : ''}>Amber Gold</option>
                <option value="green" ${avatar.visor === 'green' ? 'selected' : ''}>Sensor Green</option>
                <option value="red" ${avatar.visor === 'red' ? 'selected' : ''}>Rust Orange</option>
              </select>
            </div>
            <button type="button" id="save-avatar-btn" class="btn-primary" style="width: 100%; font-size: 0.85rem;">
              Save Avatar
            </button>
          </div>
        </div>

        <!-- Right: Rename -->
        <div class="glass-panel" style="border-color: var(--border-durasteel); background: rgba(18, 20, 26, 0.94);">
          <h3 style="font-family: var(--font-imperial); font-size: 1.25rem; color: #fffdf7; margin-bottom: 0.5rem;">
            Display Name
          </h3>
          <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 1.25rem; line-height: 1.45; font-family: var(--font-main);">
            Your name visible on leaderboards and team rosters.
          </p>

          <form id="rename-form">
            <div class="form-group">
              <label class="form-label" for="new-display-name">New Name</label>
              <input type="text" id="new-display-name" class="form-input" placeholder="Enter name" minlength="3" maxlength="20" required>
            </div>

            <div id="rename-error" class="text-danger hidden" style="font-family: var(--font-mono); font-size: 0.85rem; margin-bottom: 1rem; padding: 0.5rem; background: rgba(217,4,41,0.15); border-radius: var(--radius-sm);"></div>

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
    renameBtn.textContent = 'Updating…';

    const newName = container.querySelector('#new-display-name').value.trim();

    try {
      const res = await api.rename(newName);
      session.setUserData(res);
      showToast('Display name updated.', 'success');
      renderQuarters(container);
    } catch (err) {
      renameError.textContent = err.message || 'Name update failed.';
      renameError.classList.remove('hidden');
      renameBtn.disabled = false;
      renameBtn.textContent = 'Update Name';
    }
  });
}
