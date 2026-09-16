/**
 * quarters.js — Profile & Avatar Customization
 */

import { api } from '../api.js';
import { session } from '../session.js';
import { stage } from '../three/stage.js';
import { showToast } from '../ui/toast.js';
import { pageHeader, esc } from '../ui/layout.js';
import { checkDisplayName } from './register.js';

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
      ${pageHeader({
        art: '/art/quarters.jpg',
        artAlt: '',
        eyebrow: 'Crew record',
        title: 'Crew Profile',
        actions: `<a href="#/settings" class="btn-secondary" style="text-decoration: none;">Settings</a>`
      })}

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.5rem;">
        <!-- Left: Avatar -->
        <div class="holo-card" style="text-align: center;">
          <div style="width: 126px; height: 126px; margin: 0 auto 1.25rem; background: var(--plate-100); border: 1px solid var(--border-durasteel); border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: inset 0 2px 14px rgba(0,0,0,0.9);">
            <svg viewBox="0 0 100 100" width="90" height="90">
              <circle cx="50" cy="45" r="28" fill="#1f1d1a" stroke="#393430" stroke-width="2"/>
              <ellipse cx="50" cy="46" rx="20" ry="14" fill="${avatar.visor === 'gold' ? '#c39a63' : avatar.visor === 'green' ? '#6f8f3f' : '#9c5423'}" opacity="0.85"/>
              <path d="M 38 40 Q 50 36 62 40" stroke="rgba(233,224,208,0.25)" stroke-width="1.5" fill="none"/>
              <path d="M 22 90 Q 50 68 78 90 L 78 100 L 22 100 Z" fill="${(avatar.suitColor === 'fire' || avatar.suitColor === 'ignis') ? '#9c5423' : (avatar.suitColor === 'earth' || avatar.suitColor === 'terra') ? '#8a7148' : (avatar.suitColor === 'water' || avatar.suitColor === 'thalassa') ? '#3f7d76' : '#75818a'}"/>
            </svg>
          </div>

          <div style="font-family: var(--font-display); font-size: 1.1rem; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: var(--text-bright); margin-bottom: 0.35rem; text-shadow: var(--engrave);">
            ${esc(p.display_name || 'Player')}
          </div>
          <div class="eyebrow" style="color: var(--accent-amber); margin-bottom: 1.5rem;">
            ${esc(session.team?.name || session.team?.team_id || 'Unassigned')} Guild
          </div>

          <!-- Avatar Customization Controls -->
          <div style="text-align: left; font-size: 0.8rem;">
            <div class="form-group">
              <label class="form-label" for="avatar-visor">Visor Color</label>
              <select id="avatar-visor" class="form-select">
                <option value="gold" ${avatar.visor === 'gold' ? 'selected' : ''}>Sand Gold</option>
                <option value="green" ${avatar.visor === 'green' ? 'selected' : ''}>Phosphor</option>
                <option value="red" ${avatar.visor === 'red' ? 'selected' : ''}>Rust</option>
              </select>
            </div>
            <button type="button" id="save-avatar-btn" class="btn-primary" style="width: 100%;">Save</button>
          </div>
        </div>

        <!-- Right: Rename -->
        <div class="glass-panel">
          <h2 class="section-title" style="margin-bottom: 1.25rem;">Display Name</h2>

          <form id="rename-form">
            <div class="form-group">
              <label class="form-label" for="new-display-name">New Name</label>
              <input type="text" id="new-display-name" class="form-input" placeholder="Enter name" minlength="3" maxlength="20" required autocapitalize="off">
              <span class="form-help" id="rename-help">3–20 chars · letters, numbers, space, - _</span>
            </div>

            <div id="rename-error" class="form-banner hidden" role="alert"></div>

            <button type="submit" id="rename-btn" class="btn-primary" style="width: 100%;">Update</button>
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
      showToast(e.message || 'Avatar update failed.', 'error');
      saveAvatarBtn.disabled = false;
      saveAvatarBtn.textContent = 'Save';
    }
  });

  // Rename form
  const renameForm = container.querySelector('#rename-form');
  const renameError = container.querySelector('#rename-error');
  const renameBtn = container.querySelector('#rename-btn');

  const renameInput = container.querySelector('#new-display-name');
  const renameHelp = container.querySelector('#rename-help');
  renameInput.addEventListener('input', () => {
    if (!renameInput.value) {
      renameHelp.className = 'form-help';
      renameHelp.textContent = '3–20 chars · letters, numbers, space, - _';
      return;
    }
    const res = checkDisplayName(renameInput.value);
    renameHelp.className = `form-help ${res.valid ? 'good' : 'bad'}`;
    renameHelp.textContent = res.message;
  });

  renameForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    renameError.classList.add('hidden');

    const newName = renameInput.value.trim();
    const check = checkDisplayName(newName);
    if (!check.valid) {
      renameError.innerHTML = `<span>${check.message}</span>`;
      renameError.classList.remove('hidden');
      renameInput.focus();
      return;
    }

    renameBtn.disabled = true;
    renameBtn.textContent = 'Updating…';

    try {
      const res = await api.rename(newName);
      session.setUserData(res);
      showToast('Display name updated.', 'success');
      renderQuarters(container);
    } catch (err) {
      renameError.innerHTML = `<span>${err.message || 'Name update failed.'}</span>`;
      renameError.classList.remove('hidden');
      renameBtn.disabled = false;
      renameBtn.textContent = 'Update';
    }
  });
}
