/**
 * leaderboard.js — Comms Array Telemetry & Guild Transmissions (Star Wars / Dune style)
 */

import { api } from '../api.js';
import { session } from '../session.js';
import { stage } from '../three/stage.js';

export async function renderLeaderboard(container) {
  if (stage.cameraRig) {
    stage.cameraRig.moveTo('comms');
  }

  let activeTab = 'teams'; // 'teams' | 'individual'
  let lbData = { individual: [], teams: [] };
  let loading = true;

  function render() {
    container.innerHTML = `
      <div class="screen-container">
        <div class="glass-panel" style="margin-bottom: 1.5rem; border-color: var(--border-durasteel); background: rgba(18, 20, 26, 0.94);">
          <!-- Comms Station Banner -->
          <div style="position: relative; border-radius: 2px; overflow: hidden; margin-bottom: 1.25rem; border: 1px solid var(--border-durasteel); height: 140px;">
            <img src="/art/comms.jpg" alt="Subspace Relay Station" style="width: 100%; height: 100%; object-fit: cover; filter: contrast(1.1) brightness(0.85);" />
            <div style="position: absolute; inset: 0; background: linear-gradient(180deg, transparent 20%, rgba(12, 13, 17, 0.9) 100%);"></div>
            <div style="position: absolute; bottom: 8px; left: 12px; font-family: var(--font-mono); font-size: 0.7rem; color: var(--accent-green); letter-spacing: 0.12em;">
              [ SUB-SPACE RELAY STATION // UNIT-7 // 419.2 MHZ ]
            </div>
            <div style="position: absolute; bottom: 8px; right: 12px; font-family: var(--font-mono); font-size: 0.7rem; color: var(--accent-amber);">
              ● SIGNAL LOCKED // RF OSCILLOSCOPE ACTIVE
            </div>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
            <div>
              <h2 style="font-family: var(--font-imperial); font-size: 1.6rem; letter-spacing: 0.12em; color: #fffdf7; margin-bottom: 0.2rem;">
                Comms Relay & Fleet Telemetry
              </h2>
              <p style="font-family: var(--font-main); font-size: 0.9rem; color: var(--text-secondary);">
                Intercepted guild telemetry, member participation multipliers, and operative service ranks.
              </p>
            </div>

            <div style="display: flex; gap: 0.5rem;">
              <button type="button" id="tab-teams" class="btn-chip ${activeTab === 'teams' ? 'active' : ''}" style="font-size: 0.85rem; padding: 8px 18px; font-family: var(--font-display); font-weight: 700;">
                Guild Standings
              </button>
              <button type="button" id="tab-indiv" class="btn-chip ${activeTab === 'individual' ? 'active' : ''}" style="font-size: 0.85rem; padding: 8px 18px; font-family: var(--font-display); font-weight: 700;">
                Operative Roster
              </button>
            </div>
          </div>
        </div>

        ${loading && (!lbData.teams || lbData.teams.length === 0) ? `
          <div class="glass-panel" style="text-align: center; padding: 3rem; color: var(--text-secondary); border-color: var(--border-durasteel); background: rgba(18, 20, 26, 0.94);">
            <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">📡</div>
            <div style="font-family: var(--font-mono); color: var(--accent-amber);">Synchronizing RF vacuum telemetry…</div>
          </div>
        ` : activeTab === 'teams' ? `
          <!-- Guild Normalized Leaderboard -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1.25rem;">
            ${(lbData.teams || []).map(t => `
              <div class="holo-card" style="border-color: ${t.color_hex || 'var(--border-durasteel)'}; background: #14161c;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                  <span style="font-family: var(--font-mono); font-size: 1.6rem; font-weight: 900; color: ${t.accent_hex || 'var(--accent-amber)'};">
                    #${t.rank}
                  </span>
                  <span style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--text-muted); background: #101216; padding: 3px 8px; border-radius: var(--radius-sm); border: 1px solid var(--border-durasteel);">
                    ${t.active_members}/${t.roster_size} OPERATIVES ACTIVE
                  </span>
                </div>

                <h3 style="font-family: var(--font-imperial); font-size: 1.35rem; font-weight: 800; color: ${t.accent_hex || '#fffdf7'}; margin-bottom: 1.25rem; text-transform: uppercase; letter-spacing: 0.08em;">
                  ${t.name || t.team_id}
                </h3>

                <div style="background: #101216; border: 1px solid var(--border-durasteel); border-radius: var(--radius-sm); padding: 0.75rem 1rem; display: flex; justify-content: space-between; align-items: center; box-shadow: inset 0 2px 4px rgba(0,0,0,0.8);">
                  <span style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--text-muted);">FLEET SCORE</span>
                  <span style="font-family: var(--font-mono); font-size: 1.35rem; font-weight: 800; color: var(--accent-amber);">
                    ${t.team_score} PTS
                  </span>
                </div>
              </div>
            `).join('')}
          </div>
          <div style="margin-top: 1.5rem; font-family: var(--font-mono); font-size: 0.75rem; color: var(--text-muted); text-align: center;">
            [ ALGORITHM: Mean Operative Yield × Roster Participation Coefficient ]
          </div>
        ` : `
          <!-- Individual Operative Telemetry -->
          <div class="glass-panel" style="padding: 1rem; border-color: var(--border-durasteel); background: rgba(18, 20, 26, 0.94);">
            <div style="overflow-x: auto;">
              <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem;">
                <thead>
                  <tr style="border-bottom: 1px solid var(--border-durasteel); color: var(--text-muted); font-size: 0.75rem; font-family: var(--font-mono);">
                    <th style="padding: 10px 12px;">RANK</th>
                    <th style="padding: 10px 12px;">CALLSIGN</th>
                    <th style="padding: 10px 12px;">GUILD</th>
                    <th style="padding: 10px 12px;">RANK TITLE</th>
                    <th style="padding: 10px 12px; text-align: right;">YIELD XP</th>
                  </tr>
                </thead>
                <tbody>
                  ${(lbData.individual || []).map(row => {
                    const isMe = session.player && (session.player.player_id === row.player_id || session.player.display_name === row.display_name);
                    return `
                      <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.05); background: ${isMe ? 'rgba(255, 159, 28, 0.12)' : 'transparent'};">
                        <td style="padding: 12px; font-family: var(--font-mono); font-weight: bold; color: ${row.rank <= 3 ? 'var(--accent-amber)' : 'var(--text-secondary)'};">
                          #${row.rank}
                        </td>
                        <td style="padding: 12px; font-weight: 700; color: var(--text-bright); font-family: var(--font-display);">
                          ${row.display_name} ${isMe ? '<span style="font-size:0.7rem; color:var(--accent-amber); font-family:var(--font-mono);">[YOU]</span>' : ''}
                        </td>
                        <td style="padding: 12px; font-size: 0.85rem; color: var(--text-secondary); text-transform: uppercase; font-family: var(--font-mono);">
                          ${row.team_id || '—'}
                        </td>
                        <td style="padding: 12px;">
                          <span class="level-badge" style="font-size: 0.65rem;">${row.level_title || 'Cadet'}</span>
                        </td>
                        <td style="padding: 12px; text-align: right; font-family: var(--font-mono); font-weight: bold; color: var(--accent-amber);">
                          ${row.xp} XP
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>
        `}
      </div>
    `;

    container.querySelector('#tab-teams')?.addEventListener('click', () => {
      activeTab = 'teams';
      render();
    });
    container.querySelector('#tab-indiv')?.addEventListener('click', () => {
      activeTab = 'individual';
      render();
    });
  }

  render();

  api.getLeaderboards().then(res => {
    loading = false;
    if (res) {
      lbData = res;
      if (container.querySelector('#tab-teams')) {
        render();
      }
    }
  }).catch(() => {
    loading = false;
  });
}
