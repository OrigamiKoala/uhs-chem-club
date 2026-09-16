/**
 * landing.js — Front door.
 *
 * The ship's name plate and two switches. A visitor who wants to know what this
 * is presses the free puzzle; nothing here needs to argue for itself.
 */

import { session } from '../session.js';
import { stage } from '../three/stage.js';
import { esc } from '../ui/layout.js';

export function renderLanding(container) {
  if (stage.cameraRig) {
    stage.cameraRig.moveTo('cockpit');
  }

  const isAuthed = session.token && session.player;
  const p = session.player || {};
  const t = session.team || {};

  container.innerHTML = `
    <div class="screen-container" style="max-width: 560px;">
      <div class="glass-panel" style="padding: 0;">

        <div class="panel-banner tall" style="margin-bottom: 0; border: none; border-bottom: 1px solid var(--border-durasteel);">
          <img src="/art/cockpit.jpg" alt="" />
        </div>

        <div style="padding: 1.9rem 1.9rem 2rem; text-align: center;">
          <div class="eyebrow">UHS Chemistry Club</div>
          <h1 style="font-family: var(--font-imperial); font-size: 2.4rem; letter-spacing: 0.34em; font-weight: 700; margin: 0.5rem 0 0 0.34em; color: var(--text-bright); text-shadow: var(--engrave);">
            AVALON
          </h1>
          <div style="height: 1px; background: linear-gradient(90deg, transparent, var(--border-durasteel) 25%, var(--border-durasteel) 75%, transparent); margin: 1rem 0 0.9rem;"></div>

          <p class="page-sub" style="margin: 0 auto 1.9rem; max-width: 34ch;">
            ${isAuthed
              ? `${esc(p.display_name || 'Explorer')} — ${esc(t.name || t.team_id || 'no guild')}`
              : 'Puzzles you solve by drawing. No chemistry required.'}
          </p>

          <div style="display: flex; flex-direction: column; gap: 0.6rem; max-width: 280px; margin: 0 auto;">
            ${isAuthed ? `
              <a href="${session.teamId ? '#/bridge' : '#/onboarding'}" class="btn-primary" style="text-decoration: none;">
                ${session.teamId ? 'Bridge' : 'Choose Guild'}
              </a>
              <a href="#/leaderboard" class="btn-secondary" style="text-decoration: none;">Standings</a>
              <button type="button" id="landing-signout-btn" class="btn-secondary" style="color: var(--text-muted); border-style: dashed;">
                Sign Out
              </button>
            ` : `
              <a href="#/register" class="btn-primary" style="text-decoration: none;">Create Account</a>
              <a href="#/demo" class="btn-secondary" style="text-decoration: none;">Try One Puzzle</a>
              <div style="font-family: var(--font-mono); font-size: 0.7rem; letter-spacing: 0.08em; color: var(--text-muted); margin-top: 0.4rem;">
                <a href="#/login" class="link-accent">Sign in</a>
              </div>
            `}
          </div>
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
