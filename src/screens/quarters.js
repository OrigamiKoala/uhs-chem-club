/**
 * quarters.js — Profile & Avatar Customization
 */

import { api } from '../api.js';
import { session } from '../session.js';
import { stage } from '../three/stage.js';
import { showToast } from '../ui/toast.js';
import { pageHeader, esc } from '../ui/layout.js';
import { tierManager } from '../three/tier.js';
import { checkDisplayName } from './register.js';
import { BACKGROUNDS } from '../story/trinkets.js';
import { QUEST1_STORY } from '../story/quest1.js';
import { STAGE_CONFIGS } from '../quest3d/evaluator.js';

export function renderQuarters(container) {
  if (stage.cameraRig && tierManager.currentTier !== 'T4') {
    stage.cameraRig.moveTo('quarters');
  }

  const p = session.player || {};
  const isT4 = tierManager.currentTier === 'T4';
  let avatar = { suitColor: 'default', helmet: 'mark1', visor: 'gold', skin: 'medium' };
  try {
    if (p.avatar_json) avatar = JSON.parse(p.avatar_json);
  } catch (e) {}

  const bg = BACKGROUNDS[p.background] || null;
  const trinket = p.trinket || session.trinket || null;

  let clearedCount = 0;
  try {
    const saved = parseInt(localStorage.getItem('avalon_q1_stage_reached'), 10);
    if (!isNaN(saved) && saved >= 0) clearedCount = saved;
  } catch (e) {}
  const prog = (session.progress || []).find(pr => pr.quest_id === 'q1');
  if (prog && typeof prog.stage_reached === 'number') {
    clearedCount = Math.max(clearedCount, prog.stage_reached);
  }

  const terminalHeaderMarkup = isT4 ? `
    <div class="terminal-header">
      <div>
        <h2 class="section-title" style="font-size: 1.15rem; margin-top: 2px;">PROFILE</h2>
      </div>
      <button type="button" id="close-quarters-terminal-btn" class="terminal-close-btn">CLOSE</button>
    </div>
  ` : pageHeader({
    art: '/art/quarters.jpg',
    video: '/video/airlock_loop.webm',
    artAlt: '',
    title: 'Profile',
    actions: `<a href="#/settings" class="btn-secondary" style="text-decoration: none;">Settings</a>`
  });

  container.innerHTML = `
    <div class="${isT4 ? 'in-world-terminal quarters-terminal' : 'screen-container m-screen m-quarters'}" ${isT4 ? '' : 'style="max-width: 860px;"'}>
      ${terminalHeaderMarkup}

      <div class="m-grid-1 quarters-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1.25rem; margin-bottom: 1.25rem;">
        <!-- Left: Avatar & Dossier -->
        <div class="holo-card quarters-dossier" style="text-align: center;">
          <div class="quarters-avatar" style="width: 126px; height: 126px; margin: 0 auto 1.25rem; background: var(--plate-100); border: 1px solid var(--border-durasteel); border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: inset 0 2px 14px rgba(0,0,0,0.9);">
            <svg viewBox="0 0 100 100" width="90" height="90">
              <circle cx="50" cy="45" r="28" fill="#1f1d1a" stroke="#393430" stroke-width="2"/>
              <ellipse cx="50" cy="46" rx="20" ry="14" fill="${avatar.visor === 'gold' ? '#c39a63' : avatar.visor === 'green' ? '#6f8f3f' : '#9c5423'}" opacity="0.85"/>
              <path d="M 38 40 Q 50 36 62 40" stroke="rgba(233,224,208,0.25)" stroke-width="1.5" fill="none"/>
              <path d="M 22 90 Q 50 68 78 90 L 78 100 L 22 100 Z" fill="${(avatar.suitColor === 'fire' || avatar.suitColor === 'ignis') ? '#9c5423' : (avatar.suitColor === 'earth' || avatar.suitColor === 'terra') ? '#8a7148' : (avatar.suitColor === 'water' || avatar.suitColor === 'thalassa') ? '#3f7d76' : '#75818a'}"/>
            </svg>
          </div>

          <div class="m-wrap" style="font-family: var(--font-display); font-size: 1.1rem; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: var(--text-bright); margin-bottom: 0.35rem; text-shadow: var(--engrave);">
            ${esc(p.display_name || 'Player')}
          </div>
          <div class="eyebrow" style="color: var(--accent-amber); margin-bottom: 0.75rem;">
            ${esc(session.team?.name || session.team?.team_id || 'Unassigned')} Guild
          </div>

          ${bg ? `
            <div style="margin-bottom: 0.75rem;">
              <span class="tag warn">${esc(bg.name)}</span>
            </div>
          ` : ''}

          ${trinket ? `
            <div style="font-family: var(--font-mono); font-size: 0.76rem; color: var(--accent-gold); margin-bottom: 1.25rem;">
              Trinket: <strong>${esc(trinket.name)}</strong> (#${trinket.roll || '20'})
            </div>
          ` : ''}

          <!-- Avatar Customization Controls -->
          <div style="text-align: left; font-size: 0.8rem; border-top: 1px solid var(--border-durasteel); padding-top: 1rem;">
            <div class="form-group">
              <label class="form-label" for="avatar-visor">Visor Color</label>
              <select id="avatar-visor" class="form-select">
                <option value="gold" ${avatar.visor === 'gold' ? 'selected' : ''}>Gold</option>
                <option value="green" ${avatar.visor === 'green' ? 'selected' : ''}>Green</option>
                <option value="red" ${avatar.visor === 'red' ? 'selected' : ''}>Red</option>
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
              <input type="text" id="new-display-name" class="form-input" minlength="3" maxlength="20" required autocapitalize="off">
              <span class="form-help" id="rename-help">3–20 chars · letters, numbers, space, - _</span>
            </div>

            <div id="rename-error" class="form-banner hidden" role="alert"></div>

            <button type="submit" id="rename-btn" class="btn-primary" style="width: 100%;">Update</button>
          </form>
        </div>
      </div>

      <!-- Section: Guild Members -->
      <div class="glass-panel quarters-section" style="margin-bottom: 1.5rem; padding: 1.25rem;">
        <div class="m-head" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
          <h2 class="section-title" style="margin: 0;">Guild Members</h2>
          <span class="eyebrow lit">${esc(session.team?.name || session.teamId || 'Guild')}</span>
        </div>
        <div id="crew-roster-slot">
          <div style="font-family: var(--font-mono); font-size: 0.8rem; color: var(--text-muted);">Loading…</div>
        </div>
      </div>

      <!-- Section: Progress -->
      <div class="glass-panel quarters-section" style="padding: 1.25rem;">
        <div class="m-head" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
          <h2 class="section-title" style="margin: 0;">Progress</h2>
          <span class="tag live">${clearedCount} / 20 Cleared</span>
        </div>
        ${clearedCount === 0 ? `
          <div style="font-family: var(--font-mono); font-size: 0.8rem; color: var(--text-muted); padding: 1rem 0;">
            No stages completed yet.
          </div>
        ` : `
          <div style="display: flex; flex-direction: column; gap: 0.75rem;">
            ${Array.from({ length: Math.min(clearedCount, 20) }, (_, i) => {
              const pylon = QUEST1_STORY.pylons[i];
              const cfg = STAGE_CONFIGS[i] || {};
              return `
                <div class="mission-log-entry" style="padding: 0.75rem 1rem; background: var(--plate-200); border: 1px solid var(--border-durasteel); border-left: 2px solid var(--accent-green);">
                  <div class="m-head" style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
                    <span style="font-family: var(--font-display); font-size: 0.85rem; font-weight: 600; color: var(--text-bright);">
                      Stage ${i + 1} · ${esc(cfg.title || ('Stage ' + (i + 1)))}
                    </span>
                    <span class="tag live" style="font-size: 0.65rem;">CLEARED</span>
                  </div>
                  <div style="font-family: var(--font-mono); font-size: 0.76rem; color: var(--accent-gold);">
                    ${esc(pylon?.onClear || '')}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>
    </div>
  `;

  // Fetch and render crew party roster
  if (session.teamId) {
    api.getTeamRoster(session.teamId).then(roster => {
      const slot = container.querySelector('#crew-roster-slot');
      if (!slot) return;
      if (!Array.isArray(roster) || roster.length === 0) {
        slot.innerHTML = `<div style="font-family: var(--font-mono); font-size: 0.8rem; color: var(--text-muted);">No members registered yet.</div>`;
        return;
      }
      slot.innerHTML = `
        <div class="crew-roster-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.75rem;">
          ${roster.map(m => `
            <div class="crew-roster-card m-wrap" style="background: var(--plate-200); border: 1px solid var(--border-durasteel); padding: 0.75rem 1rem;">
              <div style="font-family: var(--font-display); font-size: 0.9rem; font-weight: 600; color: var(--text-bright);">
                ${esc(m.display_name || 'Member')}
              </div>
              <div style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--text-secondary); margin-top: 0.2rem;">
                LVL ${m.level || 1}
              </div>
              ${m.trinket ? `
                <div style="font-family: var(--font-mono); font-size: 0.7rem; color: var(--accent-gold); margin-top: 0.35rem;">
                  ${esc(m.trinket.name || 'Trinket')}
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      `;
    }).catch(() => {
      const slot = container.querySelector('#crew-roster-slot');
      if (slot) slot.innerHTML = `<div style="font-family: var(--font-mono); font-size: 0.8rem; color: var(--text-muted);">Could not load roster.</div>`;
    });
  }

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

  container.querySelector('#close-quarters-terminal-btn')?.addEventListener('click', () => {
    const term = container.querySelector('.in-world-terminal');
    if (term) term.style.display = 'none';
  });
}

