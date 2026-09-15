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
            <div style="font-family: var(--font-mono); font-size: 0.7rem; color: var(--text-muted); letter-spacing: 0.15em; text-transform: uppercase;">
              FLAGSHIP AVALON // COMMAND DECK // HIGH ORBIT
            </div>
            <h2 style="font-family: var(--font-imperial); font-size: 1.9rem; font-weight: 900; color: ${t.accent_hex || 'var(--accent-amber)'}; letter-spacing: 0.1em; text-transform: uppercase;">
              ${t.name || t.team_id || 'COMMAND BRIDGE'}
            </h2>
          </div>

          <div style="display: flex; gap: 1.5rem; align-items: center; flex-wrap: wrap;">
            <div>
              <div style="font-family: var(--font-mono); font-size: 0.68rem; color: var(--text-muted); text-transform: uppercase;">Operative</div>
              <div style="font-family: var(--font-display); font-weight: 700; color: var(--text-bright);">${p.display_name || 'Cadet'}</div>
            </div>
            <div>
              <div style="font-family: var(--font-mono); font-size: 0.68rem; color: var(--text-muted); text-transform: uppercase;">Cumulative XP</div>
              <div style="font-family: var(--font-mono); font-size: 1.25rem; font-weight: 800; color: var(--accent-amber);">${session.xp || 0} XP</div>
            </div>
            <div>
              <div style="font-family: var(--font-mono); font-size: 0.68rem; color: var(--text-muted); text-transform: uppercase;">Rank</div>
              <div class="level-badge" style="display: inline-block;">LVL ${session.level || 1} CADET</div>
            </div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 1.5rem;">
          <!-- Left: Active Chemical Crucible Quest -->
          <div class="glass-panel" style="border-color: var(--border-durasteel); background: rgba(18, 20, 26, 0.94);">
            <div style="position: relative; border-radius: 2px; overflow: hidden; margin-bottom: 1.25rem; border: 1px solid var(--border-durasteel); height: 130px;">
              <img src="/art/crucible.jpg" alt="Chemical Crucible" style="width: 100%; height: 100%; object-fit: cover; filter: contrast(1.1) brightness(0.85);" />
              <div style="position: absolute; inset: 0; background: linear-gradient(180deg, transparent 20%, rgba(12, 13, 17, 0.9) 100%);"></div>
              <div style="position: absolute; top: 10px; left: 10px; display: flex; gap: 6px;">
                <span class="stage-xp-tag" style="background: rgba(255,159,28,0.25);">ACTIVE SYNTHESIS</span>
              </div>
              <div style="position: absolute; top: 10px; right: 10px; font-family: var(--font-mono); font-size: 0.7rem; color: var(--accent-green);">
                ● CHAMBER READY
              </div>
              <div style="position: absolute; bottom: 8px; left: 10px; font-family: var(--font-mono); font-size: 0.68rem; color: var(--accent-gold);">
                EXPEDITION PROTOCOL: Q1-EREBUS
              </div>
            </div>

            <h3 class="holo-title" style="font-size: 1.35rem; color: var(--text-bright); margin-bottom: 0.4rem;">
              The Charge Gardens of Erebus
            </h3>
            <p class="holo-subtitle" style="margin-bottom: 1.25rem;">
              Examine molecular electrostatic potential fields, lone pair geometries, and multi-center transition states inside the heavy containment crucible.
            </p>

            <div style="background: #111317; border: 1px solid var(--border-durasteel); border-radius: var(--radius-sm); padding: 0.85rem 1rem; margin-bottom: 1.5rem; display: flex; justify-content: space-between; box-shadow: inset 0 2px 4px rgba(0,0,0,0.8);">
              <div>
                <div style="font-family: var(--font-mono); font-size: 0.65rem; color: var(--text-muted);">BASE YIELD</div>
                <div style="font-family: var(--font-mono); font-weight: 700; color: var(--accent-amber);">165 XP</div>
              </div>
              <div>
                <div style="font-family: var(--font-mono); font-size: 0.65rem; color: var(--text-muted);">SIM PHASES</div>
                <div style="font-family: var(--font-mono); font-weight: 700; color: var(--text-bright);">7 Stages</div>
              </div>
              <div>
                <div style="font-family: var(--font-mono); font-size: 0.65rem; color: var(--text-muted);">EST TIME</div>
                <div style="font-family: var(--font-mono); font-weight: 700; color: var(--text-bright);">25-35 MIN</div>
              </div>
            </div>

            <a href="#/quest" class="btn-primary" style="width: 100%; text-decoration: none;">
              <span>Engage Synthesis Crucible</span>
              <span>➔</span>
            </a>
          </div>

          <!-- Right: Planetary Event Telemetry -->
          <div class="glass-panel" style="border-color: var(--border-durasteel); background: rgba(18, 20, 26, 0.94);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
              <span style="font-family: var(--font-display); font-size: 0.75rem; color: var(--accent-amber); letter-spacing: 0.1em; font-weight: 700;">
                TACTICAL EVENT TELEMETRY
              </span>
              <div class="dice-cube" id="bridge-dice" style="width: 32px; height: 32px; font-size: 0.85rem;">20</div>
            </div>

            <h3 class="holo-title" style="font-size: 1.3rem; margin-bottom: 0.4rem;">
              ${activeEv ? activeEv.name : 'Atmospheric Dust Surge'}
            </h3>
            <p class="holo-subtitle" style="margin-bottom: 1.25rem;">
              ${activeEv ? activeEv.description : 'High-altitude coriolis dust storm detected over the northern salt flats. Telemetry calibrated for harsh atmospheric interference.'}
            </p>

            <div style="display: flex; gap: 0.5rem; margin-bottom: 1.5rem;">
              <span style="font-family: var(--font-mono); font-size: 0.75rem; padding: 4px 8px; border-radius: var(--radius-sm); background: rgba(56, 176, 0, 0.15); color: var(--accent-green); border: 1px solid rgba(56, 176, 0, 0.35);">
                POLARITY: ${activeEv ? activeEv.polarity.toUpperCase() : 'BENEFICIAL'}
              </span>
              <span style="font-family: var(--font-mono); font-size: 0.75rem; padding: 4px 8px; border-radius: var(--radius-sm); background: rgba(255, 159, 28, 0.15); color: var(--accent-amber); border: 1px solid rgba(255, 159, 28, 0.35);">
                ORBIT: EREBUS // SECTOR-01
              </span>
            </div>

            <div style="border-top: 1px solid var(--border-durasteel); padding-top: 1.25rem; display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
              <a href="#/starmap" class="btn-secondary" style="font-size: 0.8rem; text-decoration: none; text-align: center;">
                Tactical Holotable
              </a>
              <a href="#/leaderboard" class="btn-secondary" style="font-size: 0.8rem; text-decoration: none; text-align: center;">
                Guild Transmissions
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
