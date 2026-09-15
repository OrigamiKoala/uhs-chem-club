/**
 * landing.js — Landing screen (Star Wars / Dune 'Used Universe' field terminal)
 */

import { session } from '../session.js';
import { stage } from '../three/stage.js';

export function renderLanding(container) {
  if (stage.cameraRig) {
    stage.cameraRig.moveTo('cockpit');
  }

  const isAuthed = session.token && session.player;
  const p = session.player || {};
  const t = session.team || {};

  container.innerHTML = `
    <div class="screen-container" style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 85vh; text-align: center;">
      <div class="glass-panel" style="max-width: 580px; width: 100%; padding: 2.5rem 2rem; border-color: var(--border-durasteel); background: rgba(18, 20, 26, 0.94); box-shadow: 0 16px 48px rgba(0,0,0,0.85);">
        
        <!-- Starship Cockpit Visual Header -->
        <div style="position: relative; border-radius: 2px; overflow: hidden; margin-bottom: 1.5rem; border: 1px solid var(--border-durasteel); height: 160px;">
          <img src="/art/cockpit.jpg" alt="Cockpit View" style="width: 100%; height: 100%; object-fit: cover; filter: contrast(1.1) brightness(0.9);" />
          <div style="position: absolute; inset: 0; background: linear-gradient(180deg, transparent 40%, rgba(12, 13, 17, 0.95) 100%);"></div>
        </div>

        <div style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--accent-amber); letter-spacing: 0.12em; margin-bottom: 0.4rem;">
          UHS CHEMISTRY CLUB
        </div>

        <h1 style="font-family: var(--font-imperial); font-size: 2.8rem; letter-spacing: 0.12em; font-weight: 900; margin-bottom: 0.75rem; color: #fffdf7;">
          AVALON
        </h1>

        <p style="font-size: 0.95rem; color: var(--text-secondary); margin-bottom: 2rem; line-height: 1.5;">
          ${isAuthed 
            ? `Signed in as <strong style="color: var(--text-bright);">${p.display_name || 'Explorer'}</strong> (${t.name || t.team_id || 'No Team'}).` 
            : 'Interactive 3D chemistry mechanism challenges.'}
        </p>

        <div style="display: flex; flex-direction: column; gap: 0.85rem; max-width: 300px; margin: 0 auto;">
          ${isAuthed ? `
            <a href="${session.teamId ? '#/bridge' : '#/onboarding'}" class="btn-primary" style="text-decoration: none;">
              <span>${session.teamId ? 'Go to Bridge' : 'Choose Team'}</span>
              <span>➔</span>
            </a>
            <a href="#/leaderboard" class="btn-secondary" style="text-decoration: none;">
              <span>Standings</span>
            </a>
            <button type="button" id="landing-signout-btn" class="btn-secondary" style="border-color: rgba(217, 4, 41, 0.4); color: var(--accent-danger);">
              <span>Sign Out</span>
            </button>
          ` : `
            <a href="#/register" class="btn-primary" style="text-decoration: none;">
              <span>Sign Up</span>
              <span>➔</span>
            </a>
            <a href="#/login" class="btn-secondary" style="text-decoration: none;">
              <span>Log In</span>
            </a>
            <a href="#/demo" class="btn-secondary" style="text-decoration: none; border-color: var(--accent-amber); color: var(--accent-amber);">
              <span>Try Demo</span>
            </a>
          `}
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
