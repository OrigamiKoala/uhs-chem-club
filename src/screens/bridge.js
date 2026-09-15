/**
 * bridge.js — Command Bridge tactical dashboard (Star Wars / Dune industrial deck)
 */

import { session } from '../session.js';
import { stage } from '../three/stage.js';

export function renderBridge(container) {
  if (stage.cameraRig) {
    stage.cameraRig.moveTo('bridge');
  }

  function render() {
    const p = session.player || {};
    const t = session.team || {};
    const activeEv = session.events ? session.events[p.team_id] : null;

    container.innerHTML = `
      <div class="screen-container">
        <!-- Top Status Banner -->
        <div class="glass-panel" style="margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; border-color: var(--border-durasteel); background: rgba(18, 20, 26, 0.94);">
          <div>
            <h2 style="font-family: var(--font-imperial); font-size: 1.8rem; font-weight: 800; color: ${t.accent_hex || 'var(--accent-amber)'}; text-transform: uppercase;">
              ${t.name || t.team_id || 'Bridge'}
            </h2>
          </div>

          <div style="display: flex; gap: 1.5rem; align-items: center; flex-wrap: wrap;">
            <div>
              <div style="font-size: 0.72rem; color: var(--text-muted);">Player</div>
              <div style="font-weight: 700; color: var(--text-bright);">${p.display_name || 'Cadet'}</div>
            </div>
            <div>
              <div style="font-size: 0.72rem; color: var(--text-muted);">Total XP</div>
              <div style="font-family: var(--font-mono); font-size: 1.2rem; font-weight: 800; color: var(--accent-amber);">${session.xp || 0} XP</div>
            </div>
            <div>
              <div style="font-size: 0.72rem; color: var(--text-muted);">Level</div>
              <div class="level-badge" style="display: inline-block;">LVL ${session.level || 1}</div>
            </div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 1.5rem;">
          <!-- Left: Active Quest -->
          <div class="glass-panel" style="border-color: var(--border-durasteel); background: rgba(18, 20, 26, 0.94);">
            <div style="position: relative; border-radius: 2px; overflow: hidden; margin-bottom: 1.25rem; border: 1px solid var(--border-durasteel); height: 130px;">
              <img src="/art/crucible.jpg" alt="Chamber" style="width: 100%; height: 100%; object-fit: cover; filter: contrast(1.1) brightness(0.85);" />
              <div style="position: absolute; inset: 0; background: linear-gradient(180deg, transparent 20%, rgba(12, 13, 17, 0.9) 100%);"></div>
            </div>

            <h3 class="holo-title" style="font-size: 1.35rem; color: var(--text-bright); margin-bottom: 0.4rem;">
              Quest 1: Charge Density & Trajectory Arrows
            </h3>
            <p style="font-size: 0.88rem; color: var(--text-secondary); margin-bottom: 1.25rem; line-height: 1.45;">
              Survey charge distributions across molecular structures, then route curved trajectory arrows from donor regions to acceptor centers.
            </p>

            <div style="background: #111317; border: 1px solid var(--border-durasteel); border-radius: var(--radius-sm); padding: 0.85rem 1rem; margin-bottom: 1.5rem; display: flex; justify-content: space-between;">
              <div>
                <div style="font-size: 0.68rem; color: var(--text-muted);">Base XP</div>
                <div style="font-family: var(--font-mono); font-weight: 700; color: var(--accent-amber);">165 XP</div>
              </div>
              <div>
                <div style="font-size: 0.68rem; color: var(--text-muted);">Stages</div>
                <div style="font-weight: 700; color: var(--text-bright);">7 Stages</div>
              </div>
              <div>
                <div style="font-size: 0.68rem; color: var(--text-muted);">Est. Time</div>
                <div style="font-weight: 700; color: var(--text-bright);">~20 min</div>
              </div>
            </div>

            <a href="#/quest" class="btn-primary" style="width: 100%; text-decoration: none;">
              <span>Start Quest</span>
              <span>➔</span>
            </a>
          </div>

          <!-- Right: Team Event Telemetry -->
          <div class="glass-panel" style="border-color: var(--border-durasteel); background: rgba(18, 20, 26, 0.94);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
              <span style="font-size: 0.78rem; color: var(--accent-amber); font-weight: 700;">
                ACTIVE EVENT
              </span>
            </div>

            <h3 class="holo-title" style="font-size: 1.3rem; margin-bottom: 0.4rem;">
              ${activeEv ? activeEv.name : 'Clear Conditions'}
            </h3>
            <p style="font-size: 0.88rem; color: var(--text-secondary); margin-bottom: 1.25rem; line-height: 1.45;">
              ${activeEv ? activeEv.description : 'Normal sector conditions. No active environmental modifiers affecting XP or hints.'}
            </p>

            <div style="display: flex; gap: 0.5rem; margin-bottom: 1.5rem;">
              <span style="font-size: 0.75rem; padding: 4px 8px; border-radius: var(--radius-sm); background: rgba(56, 176, 0, 0.15); color: var(--accent-green); border: 1px solid rgba(56, 176, 0, 0.35);">
                EFFECT: ${activeEv ? activeEv.polarity.toUpperCase() : 'NEUTRAL'}
              </span>
            </div>

            <div style="border-top: 1px solid var(--border-durasteel); padding-top: 1.25rem; display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
              <a href="#/starmap" class="btn-secondary" style="font-size: 0.8rem; text-decoration: none; text-align: center;">
                Sectors
              </a>
              <a href="#/leaderboard" class="btn-secondary" style="font-size: 0.8rem; text-decoration: none; text-align: center;">
                Standings
              </a>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  render();

  session.subscribe(() => {
    if (document.body.contains(container) && (window.location.hash.includes('bridge') || window.location.hash === '')) {
      render();
    }
  });
}
