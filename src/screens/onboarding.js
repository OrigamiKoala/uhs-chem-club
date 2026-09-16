/**
 * onboarding.js — Step 2 of the sign-up journey: pick a team.
 */

import { api } from '../api.js';
import { session } from '../session.js';
import { stage } from '../three/stage.js';
import { showToast } from '../ui/toast.js';
import { stepRail } from '../ui/layout.js';

const TEAM_INFO = {
  earth: { title: 'Earth', guild: 'Mineral Mining Guild', accent: 'var(--team-earth)', mark: 'MM' },
  air: { title: 'Air', guild: 'Atmospheric Harvesters', accent: 'var(--team-air)', mark: 'AH' },
  fire: { title: 'Fire', guild: 'Thermal Smelters', accent: 'var(--team-fire)', mark: 'TS' },
  water: { title: 'Water', guild: 'Moisture Extraction', accent: 'var(--team-water)', mark: 'ME' }
};

const DEFAULT_TEAMS = [
  { team_id: 'earth', name: 'Earth', color_hex: '#241f14', accent_hex: '#8a7148', cap: 12, available: 12 },
  { team_id: 'air', name: 'Air', color_hex: '#1a2226', accent_hex: '#75818a', cap: 12, available: 12 },
  { team_id: 'fire', name: 'Fire', color_hex: '#2a1a0f', accent_hex: '#9c5423', cap: 12, available: 12 },
  { team_id: 'water', name: 'Water', color_hex: '#12231f', accent_hex: '#3f7d76', cap: 12, available: 12 }
];

const TEAM_ALIAS = { terra: 'earth', zephyr: 'air', ignis: 'fire', thalassa: 'water' };
const PROPER_NAMES = { earth: 'Earth', air: 'Air', fire: 'Fire', water: 'Water' };

function normalizeTeams(list) {
  if (!list || !Array.isArray(list) || list.length === 0) return DEFAULT_TEAMS;
  return list.map(t => {
    const tid = TEAM_ALIAS[String(t.team_id || '').toLowerCase()] || String(t.team_id || '').toLowerCase();
    return {
      ...t,
      team_id: tid,
      name: PROPER_NAMES[tid] || t.name || tid
    };
  });
}

export async function renderOnboarding(container) {
  if (stage.cameraRig) {
    stage.cameraRig.moveTo('cockpit');
  }

  let selectedTeam = session.teamId || null;
  let teamsData = normalizeTeams(session.teams && session.teams.length > 0 ? session.teams : DEFAULT_TEAMS);

  function render() {
    const hasExistingTeam = Boolean(session.teamId);

    container.innerHTML = `
      <div class="screen-container" style="max-width: 720px;">
        ${hasExistingTeam ? '' : stepRail(2)}
        <div class="glass-panel">

          <div style="text-align: center; border-bottom: 1px solid var(--border-durasteel); padding-bottom: 1.25rem; margin-bottom: 1.5rem;">
            <div class="eyebrow">Avalon · Assignment</div>
            <h1 class="page-title" style="font-size: 1.4rem;">${hasExistingTeam ? 'Change Guild' : 'Choose Guild'}</h1>
          </div>

          <div role="radiogroup" aria-label="Guild"
               style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; margin-bottom: 1.75rem;">
            ${teamsData.map(t => {
              const isFull = (t.available !== undefined && t.available <= 0);
              const isSelected = selectedTeam === t.team_id;
              const meta = TEAM_INFO[t.team_id] || {
                title: t.name || t.team_id,
                guild: '',
                accent: 'var(--accent-amber)',
                mark: '--'
              };

              return `
                <button type="button"
                     class="choice-option team-card ${isSelected ? 'selected' : ''} ${isFull ? 'disabled' : ''}"
                     role="radio"
                     aria-checked="${isSelected}"
                     ${isFull ? 'disabled aria-disabled="true"' : ''}
                     data-team="${t.team_id}"
                     style="flex-direction: column; align-items: flex-start; text-align: left; padding: 1.1rem; opacity: ${isFull ? 0.4 : 1}; cursor: ${isFull ? 'not-allowed' : 'pointer'}; ${isSelected ? `border-left-color: ${meta.accent};` : ''}">
                  <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; margin-bottom: 0.45rem;">
                    <span style="display: flex; align-items: baseline; gap: 0.6rem;">
                      <span aria-hidden="true" style="font-family: var(--font-mono); font-size: 0.7rem; letter-spacing: 0.12em; color: ${meta.accent};">${meta.mark}</span>
                      <span style="font-family: var(--font-imperial); font-weight: 700; font-size: 1.1rem; letter-spacing: 0.16em; text-transform: uppercase; color: ${meta.accent}; text-shadow: var(--engrave);">${meta.title}</span>
                    </span>
                    <span class="tag ${isFull ? 'danger' : 'live'}">
                      ${isFull ? 'Full' : `${t.available ?? 12} open`}
                    </span>
                  </div>
                  <span class="eyebrow">${meta.guild}</span>
                </button>
              `;
            }).join('')}
          </div>

          <div id="onboarding-error" class="form-banner hidden" role="alert"></div>

          <div style="display: flex; justify-content: space-between; gap: 1rem; align-items: center; flex-wrap: wrap;">
            ${hasExistingTeam ? `
              <a href="#/bridge" class="btn-secondary" style="font-size: 0.85rem; text-decoration: none;">
                Cancel
              </a>
            ` : '<span></span>'}
            <button type="button" id="confirm-assignment-btn" class="btn-primary" ${!selectedTeam ? 'disabled' : ''}>
              ${hasExistingTeam ? 'Save' : 'Confirm'}
            </button>
          </div>
        </div>
      </div>
    `;

    container.querySelectorAll('.team-card:not(.disabled)').forEach(el => {
      el.addEventListener('click', () => {
        selectedTeam = el.getAttribute('data-team');
        render();
        container.querySelector('#confirm-assignment-btn')?.focus();
      });
    });

    const confirmBtn = container.querySelector('#confirm-assignment-btn');
    const errorEl = container.querySelector('#onboarding-error');

    if (confirmBtn) {
      confirmBtn.addEventListener('click', async () => {
        if (!selectedTeam) return;
        confirmBtn.disabled = true;
        confirmBtn.textContent = 'Saving…';
        errorEl.classList.add('hidden');

        try {
          const res = await api.claimTeam(selectedTeam, {
            suitColor: selectedTeam,
            helmet: 'mark1',
            visor: 'gold',
            skin: 'medium'
          });
          // player/create does not return a real XP total — never let it zero the score.
          session.setUserData(res, { trustXp: false });
          showToast(`${PROPER_NAMES[selectedTeam] || selectedTeam} Guild.`, 'success');
          window.location.hash = '#/bridge';
        } catch (err) {
          if (err.code === 'ALREADY_ASSIGNED') {
            if (session.player) session.player.team_id = selectedTeam;
            session.setUserData(
              { team: { team_id: selectedTeam, name: PROPER_NAMES[selectedTeam] || selectedTeam } },
              { trustXp: false }
            );
            window.location.hash = '#/bridge';
            return;
          }

          const isFull = err.code === 'TEAM_FULL';
          errorEl.innerHTML = `<span>${
            isFull ? 'That guild just filled up. Pick another.' : (err.message || 'Could not save. Try again.')
          }</span>`;
          errorEl.classList.remove('hidden');
          confirmBtn.disabled = false;
          confirmBtn.textContent = hasExistingTeam ? 'Save' : 'Confirm';

          if (isFull) {
            try {
              const boot = await api.bootstrap();
              teamsData = normalizeTeams(boot.teams || []);
            } catch (e) { /* keep the cached roster */ }
            selectedTeam = null;
            render();
            const refreshedError = container.querySelector('#onboarding-error');
            refreshedError.innerHTML = '<span>That guild just filled up. Pick another.</span>';
            refreshedError.classList.remove('hidden');
          }
        }
      });
    }
  }

  render();

  api.bootstrap().then(boot => {
    if (boot && boot.teams && boot.teams.length > 0) {
      teamsData = normalizeTeams(boot.teams);
      session.teams = teamsData;
      render();
    }
  }).catch(() => {});
}
