/**
 * bridge.js — Command Bridge dashboard screen
 */

import { session } from '../session.js';
import { stage } from '../three/stage.js';

export function renderBridge(container) {
  if (stage.cameraRig) {
    stage.cameraRig.moveTo('bridge');
  }

  const p = session.player || {};
  const t = session.team || {};
  const activeEv = session.events ? session.events[p.team_id] : null;

  container.innerHTML = `
    <div class="screen-container">
      <!-- Top Status Banner -->
      <div class="glass-panel" style="margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
        <div>
          <div style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--accent-cyan); letter-spacing: 0.1em; margin-bottom: 0.2rem;">
            ${t.corp_name || 'Team'}
          </div>
          <h2 style="font-family: var(--font-display); font-size: 1.75rem; font-weight: 800; color: var(--text-bright);">
            ${t.ship_name || 'Bridge'}
          </h2>
        </div>

        <div style="display: flex; gap: 1.5rem; align-items: center;">
          <div>
            <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Role</div>
            <div style="font-family: var(--font-display); font-weight: 700; color: var(--text-bright);">${p.role || 'Cadet'}</div>
          </div>
          <div>
            <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Total XP</div>
            <div style="font-family: var(--font-mono); font-size: 1.25rem; font-weight: 800; color: var(--accent-amber);">${session.xp || 0} XP</div>
          </div>
          <div>
            <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Level</div>
            <div class="level-badge" style="display: inline-block;">LVL ${session.level || 1}</div>
          </div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.5rem;">
        <!-- Left: Active Quest -->
        <div class="glass-panel">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
            <span class="stage-xp-tag">ACTIVE QUEST</span>
            <span style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--accent-green);">● LIVE</span>
          </div>

          <h3 class="holo-title" style="font-size: 1.4rem; color: var(--text-bright); margin-bottom: 0.4rem;">
            The Charge Gardens of Vareth-9
          </h3>
          <p class="holo-subtitle" style="margin-bottom: 1.5rem;">
            Examine electron density maps, locate nucleophiles and electrophiles, and route substitution reactions.
          </p>

          <div style="background: rgba(3, 7, 18, 0.6); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1rem; margin-bottom: 1.5rem; display: flex; justify-content: space-between;">
            <div>
              <div style="font-size: 0.7rem; color: var(--text-muted);">BASE XP</div>
              <div style="font-family: var(--font-mono); font-weight: 700; color: var(--accent-amber);">165 XP</div>
            </div>
            <div>
              <div style="font-size: 0.7rem; color: var(--text-muted);">STAGES</div>
              <div style="font-family: var(--font-mono); font-weight: 700; color: var(--text-bright);">7 + Bonus</div>
            </div>
            <div>
              <div style="font-size: 0.7rem; color: var(--text-muted);">ESTIMATED TIME</div>
              <div style="font-family: var(--font-mono); font-weight: 700; color: var(--text-bright);">25-35 min</div>
            </div>
          </div>

          <a href="#/quest" class="btn-primary" style="width: 100%; text-decoration: none;">
            <span>Launch Quest</span>
            <span>➔</span>
          </a>
        </div>

        <!-- Right: Team Event -->
        <div class="glass-panel">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
            <span style="font-family: var(--font-display); font-size: 0.75rem; color: var(--accent-cyan); letter-spacing: 0.1em;">
              ACTIVE EVENT
            </span>
            <div class="dice-cube" id="bridge-dice" style="width: 32px; height: 32px; font-size: 0.85rem;">20</div>
          </div>

          <h3 class="holo-title" style="font-size: 1.3rem; margin-bottom: 0.4rem;">
            ${activeEv ? activeEv.name : 'Slipstream Current'}
          </h3>
          <p class="holo-subtitle" style="margin-bottom: 1.25rem;">
            ${activeEv ? activeEv.description : 'Gravitational wave detected along the planetary axis. Telemetry accelerated.'}
          </p>

          <div style="display: flex; gap: 0.5rem; margin-bottom: 1.5rem;">
            <span style="font-family: var(--font-mono); font-size: 0.75rem; padding: 4px 8px; border-radius: var(--radius-sm); background: rgba(0, 230, 118, 0.15); color: var(--accent-green); border: 1px solid rgba(0, 230, 118, 0.3);">
              POLARITY: ${activeEv ? activeEv.polarity.toUpperCase() : 'BENEFICIAL'}
            </span>
          </div>

          <div style="border-top: 1px solid var(--border-subtle); padding-top: 1rem; display: flex; justify-content: space-between;">
            <a href="#/starmap" class="btn-secondary" style="font-size: 0.8rem; text-decoration: none;">Star Map</a>
            <a href="#/leaderboard" class="btn-secondary" style="font-size: 0.8rem; text-decoration: none;">Leaderboard</a>
          </div>
        </div>
      </div>
    </div>
  `;
}
