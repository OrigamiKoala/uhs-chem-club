/**
 * landing.js — Landing screen (Star Wars / Dune 'Used Universe' field terminal)
 */

import { session } from '../session.js';
import { stage } from '../three/stage.js';

export function renderLanding(container) {
  if (stage.cameraRig) {
    stage.cameraRig.moveTo('bridge');
  }

  const isAuthed = session.token && session.player;
  const p = session.player || {};
  const t = session.team || {};

  container.innerHTML = `
    <div class="screen-container" style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 85vh; text-align: center;">
      <div class="glass-panel" style="max-width: 580px; width: 100%; padding: 2.5rem 2rem; border-color: var(--border-durasteel); background: rgba(18, 20, 26, 0.94); box-shadow: 0 16px 48px rgba(0,0,0,0.85);">
        
        <!-- Outpost Visual Header -->
        <div style="position: relative; border-radius: 2px; overflow: hidden; margin-bottom: 1.5rem; border: 1px solid var(--border-durasteel); height: 160px; box-shadow: inset 0 0 16px rgba(0,0,0,0.8);">
          <img src="/art/hero_desert_outpost.jpg" alt="Expedition Outpost" style="width: 100%; height: 100%; object-fit: cover; filter: contrast(1.1) brightness(0.9);" />
          <div style="position: absolute; inset: 0; background: linear-gradient(180deg, transparent 40%, rgba(12, 13, 17, 0.95) 100%);"></div>
          <div style="position: absolute; bottom: 8px; left: 12px; font-family: var(--font-mono); font-size: 0.7rem; color: var(--accent-amber); letter-spacing: 0.12em;">
            [ ARRAKIS SECTOR-4 // OUTPOST A-7 ]
          </div>
          <div style="position: absolute; bottom: 8px; right: 12px; font-family: var(--font-mono); font-size: 0.7rem; color: var(--accent-green); letter-spacing: 0.08em;">
            ● TERMINAL ONLINE
          </div>
        </div>

        <div style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--accent-amber); letter-spacing: 0.2em; margin-bottom: 0.4rem; text-transform: uppercase;">
          UHS CHEMISTRY CLUB // EXPEDITION CORPS
        </div>

        <h1 style="font-family: var(--font-imperial); font-size: 2.8rem; letter-spacing: 0.16em; font-weight: 900; margin-bottom: 0.75rem; color: #fffdf7; text-shadow: 0 2px 8px rgba(0, 0, 0, 0.9);">
          AVALON
        </h1>

        <p style="font-size: 0.95rem; color: var(--text-secondary); margin-bottom: 2rem; line-height: 1.5; font-family: var(--font-main);">
          ${isAuthed 
            ? `Active operative logged in: <strong style="color: var(--text-bright); font-family: var(--font-display);">${p.display_name || 'Explorer'}</strong> (${t.name || t.team_id || 'Unassigned'}).` 
            : 'Off-world chemical synthesis, molecular charge simulation, and tactical guild trials.'}
        </p>

        <div style="display: flex; flex-direction: column; gap: 0.85rem; max-width: 320px; margin: 0 auto;">
          ${isAuthed ? `
            <a href="${p.team_id ? '#/bridge' : '#/onboarding'}" class="btn-primary" style="text-decoration: none;">
              <span>${p.team_id ? 'Enter Command Bridge' : 'Complete Guild Roster'}</span>
              <span>➔</span>
            </a>
            <a href="#/leaderboard" class="btn-secondary" style="text-decoration: none;">
              <span>Telemetry & Leaderboard</span>
            </a>
            <button type="button" id="landing-signout-btn" class="btn-secondary" style="border-color: rgba(217, 4, 41, 0.4); color: var(--accent-danger);">
              <span>Disengage Terminal</span>
            </button>
          ` : `
            <a href="#/register" class="btn-primary" style="text-decoration: none;">
              <span>Enlist Operative</span>
              <span>➔</span>
            </a>
            <a href="#/demo" class="btn-secondary" style="text-decoration: none; border-color: var(--accent-amber); color: var(--accent-amber);">
              <span>Launch Sim Demo</span>
            </a>
            <a href="#/login" class="btn-secondary" style="text-decoration: none;">
              <span>Access Terminal</span>
            </a>
          `}
        </div>

        <div style="margin-top: 1.75rem; padding-top: 1rem; border-top: 1px solid rgba(255, 255, 255, 0.06); font-family: var(--font-mono); font-size: 0.68rem; color: var(--text-muted); display: flex; justify-content: space-between;">
          <span>SYS: BTR-994</span>
          <span>FLUX: OPTIMAL</span>
          <span>DECK: PERSISTENT 3D</span>
        </div>

      </div>
    </div>
  `;

  const signoutBtn = container.querySelector('#landing-signout-btn');
  if (signoutBtn) {
    signoutBtn.addEventListener('click', () => {
      session.clear();
      renderLanding(container);
    });
  }
}
