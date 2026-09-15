/**
 * onboarding.js — Role and Team onboarding selection flow
 */

import { api } from '../api.js';
import { session } from '../session.js';
import { showToast } from '../ui/toast.js';

const ROLES = [
  { id: 'Navigator', title: 'Navigator', perk: 'One extra stage preview before starting each quest.', icon: '🧭' },
  { id: 'Engineer', title: 'Engineer', perk: 'One free sensor hint per quest without XP penalty.', icon: '⚙️' },
  { id: 'Xenobiologist', title: 'Xenobiologist', perk: '+10% XP bonus on bonus stages.', icon: '🧬' },
  { id: 'Quartermaster', title: 'Quartermaster', perk: '+1 item capacity and higher item drop odds.', icon: '📦' },
  { id: 'Comms Officer', title: 'Comms Officer', perk: 'View live teammate progress.', icon: '📡' }
];

const DEFAULT_TEAMS = [
  { team_id: 'terra', name: 'Terra', corp_name: 'Terra Dominion', ship_name: 'TDS Lodestone', color_hex: '#1b5e20', accent_hex: '#4caf50', cap: 12, available: 12, lore: 'Heavy metallurgy and mineral synthesis.', emblem: 'geo' },
  { team_id: 'zephyr', name: 'Zephyr', corp_name: 'Zephyr Aeronautics', ship_name: 'ZAS Windward', color_hex: '#006064', accent_hex: '#00e5ff', cap: 12, available: 12, lore: 'Atmospheric distillation and fluid kinetics.', emblem: 'aero' },
  { team_id: 'ignis', name: 'Ignis', corp_name: 'Ignis Combine', ship_name: 'ICS Emberline', color_hex: '#bf360c', accent_hex: '#ff6e40', cap: 12, available: 12, lore: 'High-energy combustion and plasma catalysis.', emblem: 'pyro' },
  { team_id: 'thalassa', name: 'Thalassa', corp_name: 'Thalassa Deepworks', ship_name: 'TDW Tideglass', color_hex: '#0d47a1', accent_hex: '#2979ff', cap: 12, available: 12, lore: 'Aqueous solvent extractions and deep pressure chemistry.', emblem: 'hydro' }
];

export async function renderOnboarding(container) {
  let selectedRole = 'Navigator';
  let selectedTeam = null;
  let teamsData = (session.teams && session.teams.length > 0) ? session.teams : DEFAULT_TEAMS;

  function render() {
    container.innerHTML = `
      <div class="screen-container" style="max-width: 960px; margin: 1rem auto;">
        <div class="glass-panel" style="margin-bottom: 1.5rem;">
          <div style="border-bottom: 1px solid var(--border-subtle); padding-bottom: 1rem; margin-bottom: 1.5rem;">
            <h2 class="holo-title" style="margin-bottom: 0.2rem;">Role & Team Selection</h2>
            <p class="holo-subtitle">Choose a role and team to begin.</p>
          </div>

          <!-- Section 1: Role Selection -->
          <div style="margin-bottom: 2rem;">
            <h3 style="font-family: var(--font-display); font-size: 1rem; color: var(--accent-amber); margin-bottom: 0.75rem; letter-spacing: 0.05em;">
              1. SELECT ROLE
            </h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 0.75rem;">
              ${ROLES.map(r => `
                <div class="choice-option role-card ${selectedRole === r.id ? 'selected' : ''}" data-role="${r.id}" style="flex-direction: column; align-items: flex-start; padding: 1rem;">
                  <div style="font-size: 1.75rem; margin-bottom: 0.25rem;">${r.icon}</div>
                  <div style="font-family: var(--font-display); font-size: 0.9rem; font-weight: 700; color: var(--text-bright);">${r.title}</div>
                  <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.4rem; line-height: 1.4;">${r.perk}</div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Section 2: Team Selection -->
          <div style="margin-bottom: 2rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
              <h3 style="font-family: var(--font-display); font-size: 1rem; color: var(--accent-cyan); letter-spacing: 0.05em;">
                2. SELECT TEAM
              </h3>
              <span style="font-size: 0.75rem; color: var(--text-muted);">Cap: 12 members per team</span>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 0.75rem;">
              ${teamsData.map(t => {
                const isFull = t.available <= 0;
                return `
                  <div class="choice-option team-card ${selectedTeam === t.team_id ? 'selected' : ''} ${isFull ? 'disabled' : ''}"
                       data-team="${t.team_id}"
                       style="flex-direction: column; align-items: flex-start; padding: 1.1rem; border-color: ${selectedTeam === t.team_id ? t.accent_hex : 'var(--border-subtle)'}; opacity: ${isFull ? 0.45 : 1}; cursor: ${isFull ? 'not-allowed' : 'pointer'};">
                    <div style="display: flex; justify-content: space-between; width: 100%; margin-bottom: 0.4rem;">
                      <span style="font-family: var(--font-display); font-weight: 800; font-size: 0.95rem; color: ${t.accent_hex};">${t.corp_name}</span>
                      <span style="font-family: var(--font-mono); font-size: 0.72rem; color: ${isFull ? 'var(--accent-danger)' : 'var(--accent-green)'};">
                        ${isFull ? 'Full' : `${t.available} slots left`}
                      </span>
                    </div>
                    <div style="font-size: 0.85rem; font-style: italic; color: var(--text-primary); margin-bottom: 0.5rem;">${t.ship_name}</div>
                    <div style="font-size: 0.75rem; color: var(--text-secondary); line-height: 1.4;">${t.lore}</div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <div id="onboarding-error" class="text-danger hidden" style="font-size: 0.9rem; margin-bottom: 1.25rem; padding: 0.75rem; background: rgba(255, 82, 82, 0.1); border-radius: var(--radius-sm);"></div>

          <div style="display: flex; justify-content: flex-end; gap: 1rem; align-items: center;">
            <button type="button" id="auto-assign-btn" class="btn-secondary" style="font-size: 0.8rem;">
              Auto-Assign Team
            </button>
            <button type="button" id="confirm-assignment-btn" class="btn-primary" ${!selectedTeam ? 'disabled' : ''}>
              <span>Confirm</span>
              <span>➔</span>
            </button>
          </div>
        </div>
      </div>
    `;

    // Bind role clicks
    container.querySelectorAll('.role-card').forEach(el => {
      el.addEventListener('click', () => {
        selectedRole = el.getAttribute('data-role');
        render();
      });
    });

    // Bind team clicks
    container.querySelectorAll('.team-card:not(.disabled)').forEach(el => {
      el.addEventListener('click', () => {
        selectedTeam = el.getAttribute('data-team');
        render();
      });
    });

    // Auto assign
    const autoBtn = container.querySelector('#auto-assign-btn');
    if (autoBtn) {
      autoBtn.addEventListener('click', () => {
        let bestTeam = null;
        let maxAvailable = -1;
        for (const t of teamsData) {
          if (t.available > maxAvailable) {
            maxAvailable = t.available;
            bestTeam = t.team_id;
          }
        }
        if (bestTeam) {
          selectedTeam = bestTeam;
          render();
        }
      });
    }

    // Submit assignment
    const confirmBtn = container.querySelector('#confirm-assignment-btn');
    const errorEl = container.querySelector('#onboarding-error');

    if (confirmBtn) {
      confirmBtn.addEventListener('click', async () => {
        if (!selectedTeam) return;
        confirmBtn.disabled = true;
        confirmBtn.textContent = 'Saving…';
        errorEl.classList.add('hidden');

        try {
          const res = await api.claimRoleAndTeam(selectedRole, selectedTeam, {
            suitColor: selectedTeam,
            helmet: 'mark1',
            visor: 'gold',
            skin: 'medium'
          });
          session.setUserData(res);
          showToast('Team selected.', 'success');
          window.location.hash = '#/bridge';
        } catch (err) {
          errorEl.textContent = err.message || 'Team assignment failed.';
          errorEl.classList.remove('hidden');
          confirmBtn.disabled = false;
          confirmBtn.innerHTML = '<span>Confirm</span><span>➔</span>';

          // If team was full, refresh live slots
          if (err.code === 'TEAM_FULL') {
            const boot = await api.bootstrap();
            teamsData = boot.teams || [];
            selectedTeam = null;
            errorEl.textContent = 'That ship filled up while you were deciding. Pick another ship, or let auto-assign choose the smallest team.';
            render();
          }
        }
      });
    }
  }

  render();

  // Refresh live team slots asynchronously in background
  api.bootstrap().then(boot => {
    if (boot && boot.teams && boot.teams.length > 0) {
      teamsData = boot.teams;
      session.teams = teamsData;
      if (container.querySelector('#confirm-assignment-btn')) {
        render();
      }
    }
  }).catch(() => {});
}
