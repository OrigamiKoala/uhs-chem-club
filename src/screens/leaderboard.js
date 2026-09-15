/**
 * leaderboard.js — Comms Array & Leaderboards screen
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
        <div class="glass-panel" style="margin-bottom: 1.5rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
            <div>
              <h2 class="holo-title" style="margin-bottom: 0;">Leaderboards</h2>
            </div>

            <div style="display: flex; gap: 0.5rem;">
              <button type="button" id="tab-teams" class="btn-chip ${activeTab === 'teams' ? 'active' : ''}" style="font-size: 0.85rem; padding: 8px 16px;">
                Teams
              </button>
              <button type="button" id="tab-indiv" class="btn-chip ${activeTab === 'individual' ? 'active' : ''}" style="font-size: 0.85rem; padding: 8px 16px;">
                Individuals
              </button>
            </div>
          </div>
        </div>

        ${loading && (!lbData.teams || lbData.teams.length === 0) ? `
          <div class="glass-panel" style="text-align: center; padding: 2.5rem; color: var(--text-secondary);">
            <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">📡</div>
            <div>Tuning comms array telemetry…</div>
          </div>
        ` : activeTab === 'teams' ? `
          <!-- Team Normalized Leaderboard (§4.4) -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1.25rem;">
            ${(lbData.teams || []).map(t => `
              <div class="holo-card" style="border-color: ${t.color_hex || 'var(--border-subtle)'};">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                  <span style="font-family: var(--font-mono); font-size: 1.5rem; font-weight: 900; color: ${t.accent_hex || 'var(--accent-cyan)'};">
                    #${t.rank}
                  </span>
                  <span style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--text-muted);">
                    ${t.active_members}/${t.roster_size} Active
                  </span>
                </div>

                <h3 style="font-family: var(--font-display); font-size: 1.25rem; font-weight: 800; color: #fff; margin-bottom: 0.2rem;">
                  ${t.corp_name}
                </h3>
                <div style="font-size: 0.85rem; font-style: italic; color: var(--text-secondary); margin-bottom: 1.25rem;">
                  ${t.ship_name}
                </div>

                <div style="background: rgba(3, 7, 18, 0.6); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 0.75rem 1rem; display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-size: 0.75rem; color: var(--text-muted);">Score</span>
                  <span style="font-family: var(--font-mono); font-size: 1.35rem; font-weight: 800; color: var(--accent-amber);">
                    ${t.team_score} PTS
                  </span>
                </div>
              </div>
            `).join('')}
          </div>
          <div style="margin-top: 1.5rem; font-size: 0.75rem; color: var(--text-muted); text-align: center;">
            Team score = mean member XP × participation rate.
          </div>
        ` : `
          <!-- Individual Leaderboard -->
          <div class="glass-panel" style="padding: 1rem;">
            <div style="overflow-x: auto;">
              <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem;">
                <thead>
                  <tr style="border-bottom: 1px solid var(--border-subtle); color: var(--text-muted); font-size: 0.75rem; font-family: var(--font-mono);">
                    <th style="padding: 10px 12px;">Rank</th>
                    <th style="padding: 10px 12px;">Player</th>
                    <th style="padding: 10px 12px;">Team</th>
                    <th style="padding: 10px 12px;">Role</th>
                    <th style="padding: 10px 12px;">Level</th>
                    <th style="padding: 10px 12px; text-align: right;">Total XP</th>
                  </tr>
                </thead>
                <tbody>
                  ${(lbData.individual || []).map(row => {
                    const isMe = session.player && (session.player.player_id === row.player_id || session.player.display_name === row.display_name);
                    return `
                      <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.05); background: ${isMe ? 'rgba(0, 229, 255, 0.12)' : 'transparent'};">
                        <td style="padding: 12px; font-family: var(--font-mono); font-weight: bold; color: ${row.rank <= 3 ? 'var(--accent-amber)' : 'var(--text-secondary)'};">
                          #${row.rank}
                        </td>
                        <td style="padding: 12px; font-weight: 700; color: var(--text-bright);">
                          ${row.display_name} ${isMe ? '<span style="font-size:0.7rem; color:var(--accent-cyan);">(YOU)</span>' : ''}
                        </td>
                        <td style="padding: 12px; text-transform: uppercase; font-size: 0.8rem; color: var(--text-secondary);">
                          ${row.team_id || '—'}
                        </td>
                        <td style="padding: 12px; font-size: 0.85rem; color: var(--text-muted);">
                          ${row.role || 'Cadet'}
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
