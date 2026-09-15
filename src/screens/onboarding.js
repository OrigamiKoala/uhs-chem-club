/**
 * onboarding.js — Team / Imperial Guild onboarding selection flow
 */

import { api } from '../api.js';
import { session } from '../session.js';
import { showToast } from '../ui/toast.js';

const GUILD_METADATA = {
  earth: {
    title: 'Mineral Mining Guild',
    sub: 'Heavy extraction & crystallographic lattice synthesis',
    accent: '#a3824c',
    code: 'GUILD // SEC-01'
  },
  air: {
    title: 'Atmospheric Harvesters',
    sub: 'Vortex gas separation & noble vapor telemetry',
    accent: '#8a9ba8',
    code: 'GUILD // SEC-02'
  },
  fire: {
    title: 'Thermal Smelters Guild',
    sub: 'High-temp pyrosynthesis & plasma reaction containment',
    accent: '#c85a17',
    code: 'GUILD // SEC-03'
  },
  water: {
    title: 'Moisture Extraction Guild',
    sub: 'Hydro-recovery & ionic solvent filtration',
    accent: '#2a9d8f',
    code: 'GUILD // SEC-04'
  }
};

const DEFAULT_TEAMS = [
  { team_id: 'earth', name: 'earth', color_hex: '#2b2114', accent_hex: '#a3824c', cap: 12, available: 12 },
  { team_id: 'air', name: 'air', color_hex: '#1e242a', accent_hex: '#8a9ba8', cap: 12, available: 12 },
  { team_id: 'fire', name: 'fire', color_hex: '#2d180d', accent_hex: '#c85a17', cap: 12, available: 12 },
  { team_id: 'water', name: 'water', color_hex: '#0e2422', accent_hex: '#2a9d8f', cap: 12, available: 12 }
];

export async function renderOnboarding(container) {
  let selectedTeam = null;
  let teamsData = (session.teams && session.teams.length > 0) ? session.teams : DEFAULT_TEAMS;

  function render() {
    container.innerHTML = `
      <div class="screen-container" style="max-width: 760px; margin: 1.5rem auto;">
        <div class="glass-panel" style="margin-bottom: 1.5rem; border-color: var(--border-durasteel); background: rgba(18, 20, 26, 0.95);">
          
          <!-- Banner showing 4 imperial guild insignias -->
          <div style="position: relative; border-radius: 2px; overflow: hidden; margin-bottom: 1.5rem; border: 1px solid var(--border-durasteel); height: 140px; box-shadow: inset 0 0 16px rgba(0,0,0,0.8);">
            <img src="/art/factions.jpg" alt="Imperial Guild Insignias" style="width: 100%; height: 100%; object-fit: cover; filter: contrast(1.1) brightness(0.9);" />
            <div style="position: absolute; inset: 0; background: linear-gradient(180deg, transparent 30%, rgba(12, 13, 17, 0.95) 100%);"></div>
            <div style="position: absolute; bottom: 8px; left: 12px; font-family: var(--font-mono); font-size: 0.7rem; color: var(--accent-amber); letter-spacing: 0.12em;">
              [ EXPEDITION CONSORTIUM // GUILD CHARTER PACT ]
            </div>
          </div>

          <div style="border-bottom: 1px solid var(--border-durasteel); padding-bottom: 1rem; margin-bottom: 1.5rem; text-align: center;">
            <h2 style="font-family: var(--font-imperial); font-size: 1.6rem; letter-spacing: 0.12em; color: #fffdf7; margin-bottom: 0.25rem;">
              Enlist With A Guild
            </h2>
            <p style="font-family: var(--font-main); font-size: 0.9rem; color: var(--text-secondary);">
              Select your expedition syndicate to claim your division colors and access field quests.
            </p>
          </div>

          <!-- Guild Selection Grid -->
          <div style="margin-bottom: 1.75rem;">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem;">
              ${teamsData.map(t => {
                const isFull = (t.available !== undefined && t.available <= 0);
                const isSelected = selectedTeam === t.team_id;
                const meta = GUILD_METADATA[t.team_id] || {
                  title: t.name || t.team_id,
                  sub: 'Expeditionary chemical operations',
                  accent: t.accent_hex || 'var(--accent-amber)',
                  code: 'GUILD'
                };

                return `
                  <div class="choice-option team-card ${isSelected ? 'selected' : ''} ${isFull ? 'disabled' : ''}"
                       data-team="${t.team_id}"
                       style="display: flex; flex-direction: column; align-items: flex-start; padding: 1.25rem; border-color: ${isSelected ? meta.accent : 'var(--border-durasteel)'}; opacity: ${isFull ? 0.45 : 1}; cursor: ${isFull ? 'not-allowed' : 'pointer'}; background: ${isSelected ? 'rgba(255,159,28,0.1)' : '#13151b'}; box-shadow: ${isSelected ? '0 0 16px rgba(255,159,28,0.25)' : 'none'};">
                    <div style="display: flex; justify-content: space-between; width: 100%; margin-bottom: 0.4rem;">
                      <span style="font-family: var(--font-mono); font-size: 0.65rem; color: var(--text-muted);">${meta.code}</span>
                      <span style="font-family: var(--font-mono); font-size: 0.7rem; color: ${isFull ? 'var(--accent-danger)' : 'var(--accent-green)'};">
                        ${isFull ? 'FULL' : `${t.available ?? 12} SLOTS OPEN`}
                      </span>
                    </div>
                    <span style="font-family: var(--font-display); font-weight: 800; font-size: 1.15rem; color: ${meta.accent}; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 0.25rem;">
                      ${meta.title}
                    </span>
                    <span style="font-family: var(--font-main); font-size: 0.8rem; color: var(--text-secondary); line-height: 1.35;">
                      ${meta.sub}
                    </span>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <div id="onboarding-error" class="text-danger hidden" style="font-family: var(--font-mono); font-size: 0.85rem; margin-bottom: 1.25rem; padding: 0.75rem; background: rgba(217, 4, 41, 0.15); border: 1px solid var(--accent-danger); border-radius: var(--radius-sm);"></div>

          <div style="display: flex; justify-content: space-between; gap: 1rem; align-items: center; flex-wrap: wrap;">
            <button type="button" id="auto-assign-btn" class="btn-secondary" style="font-size: 0.8rem;">
              Draft to Understaffed Guild
            </button>
            <button type="button" id="confirm-assignment-btn" class="btn-primary" ${!selectedTeam ? 'disabled' : ''}>
              <span>Confirm Guild Assignment</span>
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

    // Auto assign
    const autoBtn = container.querySelector('#auto-assign-btn');
    if (autoBtn) {
      autoBtn.addEventListener('click', () => {
        let bestTeam = null;
        let maxAvailable = -1;
        for (const t of teamsData) {
          const avail = t.available !== undefined ? t.available : 12;
          if (avail > maxAvailable) {
            maxAvailable = avail;
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
        confirmBtn.textContent = 'Transmitting Roster...';
        errorEl.classList.add('hidden');

        try {
          const res = await api.claimTeam(selectedTeam, {
            suitColor: selectedTeam,
            helmet: 'mark1',
            visor: 'gold',
            skin: 'medium'
          });
          session.setUserData(res);
          showToast('Guild assignment confirmed. Welcome to the fleet.', 'success');
          window.location.hash = '#/bridge';
        } catch (err) {
          errorEl.textContent = err.message || 'Guild assignment transmission failed.';
          errorEl.classList.remove('hidden');
          confirmBtn.disabled = false;
          confirmBtn.innerHTML = '<span>Confirm Guild Assignment</span><span>➔</span>';

          if (err.code === 'TEAM_FULL') {
            const boot = await api.bootstrap();
            teamsData = boot.teams || [];
            selectedTeam = null;
            errorEl.textContent = 'Guild reached capacity during transmission. Select another guild.';
            render();
          }
        }
      });
    }
  }

  render();

  api.bootstrap().then(boot => {
    if (boot && boot.teams && boot.teams.length > 0) {
      teamsData = boot.teams;
      session.teams = teamsData;
      render();
    }
  }).catch(() => {});
}
