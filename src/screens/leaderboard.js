/**
 * leaderboard.js — Club standings: teams and individuals.
 */

import { api } from '../api.js';
import { session } from '../session.js';
import { stage } from '../three/stage.js';
import { pageHeader, esc } from '../ui/layout.js';

const TEAM_ACCENTS = {
  earth: 'var(--team-earth)',
  air: 'var(--team-air)',
  fire: 'var(--team-fire)',
  water: 'var(--team-water)'
};

const PROPER = { earth: 'Earth', air: 'Air', fire: 'Fire', water: 'Water' };

export async function renderLeaderboard(container) {
  if (stage.cameraRig) {
    stage.cameraRig.moveTo('comms');
  }

  let activeTab = 'teams';
  let lbData = { individual: [], teams: [] };
  let loading = true;
  let failed = false;

  function render() {
    const hasData = (lbData.teams || []).length > 0 || (lbData.individual || []).length > 0;

    container.innerHTML = `
      <div class="screen-container">
        ${pageHeader({
          art: '/art/comms.jpg',
          video: 'comms_sweep',
          artAlt: 'Comms array',
          eyebrow: 'Sector 01 Comms & Standings',
          title: 'Fleet Comms',
          actions: `
            <div style="display: flex; gap: 0.5rem;" role="tablist" aria-label="Standings view">
              <button type="button" id="tab-teams" role="tab" aria-selected="${activeTab === 'teams'}"
                      class="btn-chip ${activeTab === 'teams' ? 'active' : ''}" style="font-size: 0.85rem; padding: 8px 18px; font-weight: 700;">
                Guilds
              </button>
              <button type="button" id="tab-indiv" role="tab" aria-selected="${activeTab === 'individual'}"
                      class="btn-chip ${activeTab === 'individual' ? 'active' : ''}" style="font-size: 0.85rem; padding: 8px 18px; font-weight: 700;">
                Players
              </button>
            </div>
          `
        })}

        <!-- Intercepted Comms Chatter -->
        <div class="glass-panel" style="margin-bottom: 1.25rem; padding: 0.85rem 1.1rem; border-left: 2px solid var(--accent-amber);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <span class="eyebrow lit" style="font-size: 0.65rem;">INTERCEPTED FLEET CHATTER // SECTOR 01</span>
            <span class="tag live" style="font-size: 0.62rem;">ENCRYPTED COMM LINK</span>
          </div>
          <div class="comms-ticker" style="display: flex; flex-direction: column; gap: 0.35rem; font-family: var(--font-mono); font-size: 0.76rem; color: var(--text-secondary);">
            <div style="display: flex; gap: 0.6rem; flex-wrap: wrap;">
              <span style="color: var(--accent-amber);">[04:12]</span>
              <span style="color: var(--team-fire);">Thermal Smelters:</span>
              <span>"Core temp nominal on Pylon 12. Transfer arc locked."</span>
            </div>
            <div style="display: flex; gap: 0.6rem; flex-wrap: wrap;">
              <span style="color: var(--accent-amber);">[04:08]</span>
              <span style="color: var(--team-earth);">Mineral Mining:</span>
              <span>"Conduit 7 cleared. Heavy silt dredged from lower manifold."</span>
            </div>
            <div style="display: flex; gap: 0.6rem; flex-wrap: wrap;">
              <span style="color: var(--accent-amber);">[03:59]</span>
              <span style="color: var(--team-water);">Moisture Rigs:</span>
              <span>"Pressure needle holding at Relay 8. Basin moisture rising."</span>
            </div>
            <div style="display: flex; gap: 0.6rem; flex-wrap: wrap;">
              <span style="color: var(--accent-amber);">[03:44]</span>
              <span style="color: var(--team-air);">Atmospheric Crew:</span>
              <span>"Squall clearing west of the dune rim. Field visibility 80%."</span>
            </div>
          </div>
        </div>

        ${loading && !hasData ? `
          <div class="glass-panel empty-state">
            <div class="empty-icon" aria-hidden="true">///</div>
            <div style="font-family: var(--font-mono); letter-spacing: 0.16em; color: var(--accent-amber);">LINKING…</div>
          </div>
        ` : failed && !hasData ? `
          <div class="glass-panel empty-state">
            <div class="empty-icon" aria-hidden="true">///</div>
            <h2 class="section-title">Link lost</h2>
            <div style="margin-top: 1.25rem;"><button type="button" id="lb-retry" class="btn-secondary">Retry</button></div>
          </div>
        ` : activeTab === 'teams' ? renderTeams() : renderIndividuals()}
      </div>
    `;

    container.querySelector('#tab-teams')?.addEventListener('click', () => { activeTab = 'teams'; render(); });
    container.querySelector('#tab-indiv')?.addEventListener('click', () => { activeTab = 'individual'; render(); });
    container.querySelector('#lb-retry')?.addEventListener('click', () => { loading = true; failed = false; render(); load(); });
  }

  function renderTeams() {
    const rows = lbData.teams || [];
    if (rows.length === 0) {
      return `<div class="glass-panel empty-state"><div class="empty-icon" aria-hidden="true">—</div><h2 class="section-title">No guild scores yet</h2></div>`;
    }
    return `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.25rem;">
        ${rows.map(t => {
          const tid = String(t.team_id || '').toLowerCase();
          const accent = TEAM_ACCENTS[tid] || 'var(--accent-amber)';
          const isMine = session.teamId === tid;
          return `
            <article class="holo-card" style="${isMine ? `border-left: 2px solid ${accent};` : ''}">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.8rem;">
                <span style="font-family: var(--font-mono); font-size: 1.5rem; color: ${accent};">${String(t.rank).padStart(2, '0')}</span>
                <span class="tag">${t.active_members ?? 0}/${t.roster_size ?? 0} active</span>
              </div>
              <h2 style="font-family: var(--font-imperial); font-size: 1.2rem; font-weight: 700; letter-spacing: 0.16em; color: ${accent}; margin-bottom: 1rem; text-transform: uppercase; text-shadow: var(--engrave);">
                ${esc(PROPER[tid] || t.name || t.team_id)} ${isMine ? '<span class="tag warn" style="vertical-align: middle;">Yours</span>' : ''}
              </h2>
              <div class="stat-row" style="justify-content: space-between;">
                <div class="stat-tile">
                  <div class="stat-label">Guild score</div>
                  <div class="stat-value">${t.team_score}</div>
                </div>
              </div>
            </article>
          `;
        }).join('')}
      </div>
    `;
  }

  function renderIndividuals() {
    const rows = lbData.individual || [];
    if (rows.length === 0) {
      return `<div class="glass-panel empty-state"><div class="empty-icon" aria-hidden="true">—</div><h2 class="section-title">No players ranked yet</h2></div>`;
    }
    return `
      <div class="glass-panel" style="padding: 1rem;">
        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem;">
            <thead>
              <tr style="border-bottom: 1px solid var(--border-durasteel); color: var(--text-muted); font-size: 0.72rem; font-family: var(--font-mono); letter-spacing: 0.08em;">
                <th style="padding: 10px 12px;">RANK</th>
                <th style="padding: 10px 12px;">PLAYER</th>
                <th style="padding: 10px 12px;">TEAM</th>
                <th style="padding: 10px 12px;">LEVEL</th>
                <th style="padding: 10px 12px; text-align: right;">XP</th>
              </tr>
            </thead>
            <tbody>
              ${rows.map(row => {
                const isMe = session.player &&
                  (session.player.player_id === row.player_id || session.player.display_name === row.display_name);
                const tid = String(row.team_id || '').toLowerCase();
                return `
                  <tr style="border-bottom: 1px solid var(--border-durasteel); background: ${isMe ? 'var(--plate-300)' : 'transparent'};">
                    <td style="padding: 12px; font-family: var(--font-mono); color: ${row.rank <= 3 ? 'var(--accent-amber)' : 'var(--text-muted)'};">${String(row.rank).padStart(2, '0')}</td>
                    <td style="padding: 12px; font-weight: 700; color: var(--text-bright);">
                      ${esc(row.display_name)} ${isMe ? '<span class="tag warn">You</span>' : ''}
                    </td>
                    <td style="padding: 12px; font-size: 0.85rem; color: ${TEAM_ACCENTS[tid] || 'var(--text-secondary)'};">
                      ${esc(PROPER[tid] || row.team_id || '—')}
                    </td>
                    <td style="padding: 12px;"><span class="level-badge" style="font-size: 0.65rem;">LVL ${row.level || 1}${row.level_title ? ' ' + esc(row.level_title).toUpperCase() : ''}</span></td>
                    <td style="padding: 12px; text-align: right; font-family: var(--font-mono); color: var(--accent-amber);">${row.xp}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function load() {
    api.getLeaderboards().then(res => {
      loading = false;
      if (res) lbData = res;
      render();
    }).catch(() => {
      loading = false;
      failed = true;
      render();
    });
  }

  render();
  load();
}
