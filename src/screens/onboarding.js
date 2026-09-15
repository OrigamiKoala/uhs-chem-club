/**
 * onboarding.js — Team selection flow
 */

import { api } from '../api.js';
import { session } from '../session.js';
import { stage } from '../three/stage.js';
import { showToast } from '../ui/toast.js';

const TEAM_INFO = {
  earth: { title: 'Earth', accent: '#a3824c' },
  air: { title: 'Air', accent: '#8a9ba8' },
  fire: { title: 'Fire', accent: '#c85a17' },
  water: { title: 'Water', accent: '#2a9d8f' }
};

const DEFAULT_TEAMS = [
  { team_id: 'earth', name: 'Earth', color_hex: '#2b2114', accent_hex: '#a3824c', cap: 12, available: 12 },
  { team_id: 'air', name: 'Air', color_hex: '#1e242a', accent_hex: '#8a9ba8', cap: 12, available: 12 },
  { team_id: 'fire', name: 'Fire', color_hex: '#2d180d', accent_hex: '#c85a17', cap: 12, available: 12 },
  { team_id: 'water', name: 'Water', color_hex: '#0e2422', accent_hex: '#2a9d8f', cap: 12, available: 12 }
];

const TEAM_ALIAS = {
  terra: 'earth',
  zephyr: 'air',
  ignis: 'fire',
  thalassa: 'water'
};

const PROPER_NAMES = {
  earth: 'Earth',
  air: 'Air',
  fire: 'Fire',
  water: 'Water'
};

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
      <div class="screen-container" style="max-width: 680px; margin: 2rem auto;">
        <div class="glass-panel" style="padding: 2rem; border-color: var(--border-durasteel); background: rgba(18, 20, 26, 0.95);">
          
          <div style="border-bottom: 1px solid var(--border-durasteel); padding-bottom: 1rem; margin-bottom: 1.5rem; text-align: center;">
            <h2 style="font-family: var(--font-display); font-size: 1.6rem; font-weight: 800; color: #fff; margin-bottom: 0.35rem;">
              Select Your Team
            </h2>
            <p style="font-size: 0.9rem; color: var(--text-secondary); margin: 0;">
              Pick a team to record your progress and view team standings.
            </p>
          </div>

          <!-- Team Selection Grid -->
          <div style="margin-bottom: 1.75rem;">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1rem;">
              ${teamsData.map(t => {
                const isFull = (t.available !== undefined && t.available <= 0);
                const isSelected = selectedTeam === t.team_id;
                const meta = TEAM_INFO[t.team_id] || {
                  title: t.name || t.team_id,
                  accent: t.accent_hex || 'var(--accent-amber)'
                };

                return `
                  <div class="choice-option team-card ${isSelected ? 'selected' : ''} ${isFull ? 'disabled' : ''}"
                       data-team="${t.team_id}"
                       style="display: flex; flex-direction: column; align-items: flex-start; padding: 1.25rem; border-color: ${isSelected ? meta.accent : 'var(--border-durasteel)'}; opacity: ${isFull ? 0.45 : 1}; cursor: ${isFull ? 'not-allowed' : 'pointer'}; background: ${isSelected ? 'rgba(255,159,28,0.1)' : '#13151b'};">
                    <div style="display: flex; justify-content: space-between; width: 100%; margin-bottom: 0.5rem;">
                      <span style="font-family: var(--font-display); font-weight: 800; font-size: 1.2rem; color: ${meta.accent};">
                        ${meta.title}
                      </span>
                      <span style="font-family: var(--font-mono); font-size: 0.75rem; color: ${isFull ? 'var(--accent-danger)' : 'var(--accent-green)'};">
                        ${isFull ? 'Full' : `${t.available ?? 12} open`}
                      </span>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <div id="onboarding-error" class="text-danger hidden" style="font-size: 0.85rem; margin-bottom: 1.25rem; padding: 0.75rem; background: rgba(217, 4, 41, 0.15); border: 1px solid var(--accent-danger); border-radius: var(--radius-sm);"></div>

          <div style="display: flex; justify-content: space-between; gap: 1rem; align-items: center; flex-wrap: wrap;">
            ${hasExistingTeam ? `
              <a href="#/bridge" class="btn-secondary" style="font-size: 0.85rem; text-decoration: none;">
                Return to Bridge
              </a>
            ` : `<div></div>`}
            <button type="button" id="confirm-assignment-btn" class="btn-primary" ${!selectedTeam ? 'disabled' : ''}>
              <span>${hasExistingTeam ? 'Save Team' : 'Confirm Team'}</span>
              <span>➔</span>
            </button>
          </div>
        </div>
      </div>
    `;

    // Bind team clicks
    container.querySelectorAll('.team-card:not(.disabled)').forEach(el => {
      el.addEventListener('click', () => {
        selectedTeam = el.getAttribute('data-team');
        render();
      });
    });

    // Submit assignment
    const confirmBtn = container.querySelector('#confirm-assignment-btn');
    const errorEl = container.querySelector('#onboarding-error');

    if (confirmBtn) {
      confirmBtn.addEventListener('click', async () => {
        if (!selectedTeam) return;
        confirmBtn.disabled = true;
        confirmBtn.textContent = 'Saving...';
        errorEl.classList.add('hidden');

        try {
          const res = await api.claimTeam(selectedTeam, {
            suitColor: selectedTeam,
            helmet: 'mark1',
            visor: 'gold',
            skin: 'medium'
          });
          session.setUserData(res);
          showToast('Team saved.', 'success');
          window.location.hash = '#/bridge';
        } catch (err) {
          if (err.code === 'ALREADY_ASSIGNED') {
            if (session.player) session.player.team_id = selectedTeam;
            session.setUserData({ team: { team_id: selectedTeam, name: PROPER_NAMES[selectedTeam] || selectedTeam } });
            window.location.hash = '#/bridge';
            return;
          }

          errorEl.textContent = err.message || 'Failed to select team.';
          errorEl.classList.remove('hidden');
          confirmBtn.disabled = false;
          confirmBtn.innerHTML = `<span>${hasExistingTeam ? 'Save Team' : 'Confirm Team'}</span><span>➔</span>`;

          if (err.code === 'TEAM_FULL') {
            const boot = await api.bootstrap();
            teamsData = normalizeTeams(boot.teams || []);
            selectedTeam = null;
            errorEl.textContent = 'That team is currently full. Please pick another team.';
            render();
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
