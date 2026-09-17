/**
 * landing.js — Front door & Scene 0 Cold Open.
 *
 * An unauthenticated visitor lands directly into the Avalon cold open:
 * CRT powers on, Vess speaks over comms:
 * "Signal's weak out here. If you can read this, the Avalon's still hiring."
 * Two switches: Sign On (#/register) and Try a Pylon (#/demo).
 */

import { session } from '../session.js';
import { stage } from '../three/stage.js';
import { esc } from '../ui/layout.js';
import { soundscape } from '../audio/soundscape.js';

export function renderLanding(container) {
  if (stage.cameraRig) {
    stage.cameraRig.moveTo('cockpit');
  }

  const isAuthed = session.token && session.player;
  const p = session.player || {};
  const t = session.team || {};
  const isMuted = session.sound?.muted;

  container.innerHTML = `
    <div class="screen-container m-screen m-landing" style="max-width: 560px;">
      <div class="glass-panel" style="padding: 0;">

        <div class="panel-banner tall" style="margin-bottom: 0; border: none; border-bottom: 1px solid var(--border-durasteel);">
          <video class="banner-video" poster="/art/cockpit.jpg" playsinline autoplay loop muted preload="auto">
            <source src="/video/cockpit_loop.webm" type="video/webm">
            <source src="/video/cockpit_loop.mp4" type="video/mp4">
            <img src="/art/cockpit.jpg" alt="" />
          </video>
        </div>

        <div class="landing-body" style="padding: 1.8rem 1.8rem 2rem; text-align: center;">
          <div class="eyebrow">Sector 01 · Salvage Hauler Avalon</div>
          <h1 class="landing-title" style="font-family: var(--font-imperial); font-size: 2.3rem; letter-spacing: 0.32em; font-weight: 700; margin: 0.4rem 0 0 0.32em; color: var(--text-bright); text-shadow: var(--engrave);">
            AVALON
          </h1>
          <div style="height: 1px; background: linear-gradient(90deg, transparent, var(--border-durasteel) 25%, var(--border-durasteel) 75%, transparent); margin: 0.9rem 0 0.85rem;"></div>

          ${isAuthed ? `
            <p class="page-sub" style="margin: 0 auto 1.75rem; max-width: 34ch;">
              ${esc(p.display_name || 'Crew')} — ${esc(t.name || t.team_id || 'unassigned')}
            </p>

            <div class="m-cta-stack" style="display: flex; flex-direction: column; gap: 0.65rem; max-width: 280px; margin: 0 auto;">
              <a href="${session.teamId ? '#/bridge' : '#/onboarding'}" class="btn-primary" style="text-decoration: none;">
                ${session.teamId ? 'Bridge' : 'Choose Guild'}
              </a>
              <a href="#/leaderboard" class="btn-secondary" style="text-decoration: none;">Fleet Comms</a>
              <button type="button" id="landing-signout-btn" class="btn-secondary" style="color: var(--text-muted); border-style: dashed;">
                Sign Out
              </button>
            </div>
          ` : `
            <!-- Scene 0: Cold Open Comms Transmission -->
            <div class="cold-open-box m-inset" style="margin-bottom: 1.6rem; text-align: left; padding: 1rem 1.1rem; background: var(--plate-100); border: 1px solid var(--border-durasteel); border-left: 2px solid var(--accent-amber);">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
                <span class="eyebrow lit">VESS // QUARTERMASTER</span>
              </div>
              <p style="font-family: var(--font-mono); font-size: 0.84rem; line-height: 1.45; color: var(--accent-gold); margin: 0;">
                "Signal's weak out here. If you can read this, the Avalon's still hiring."
              </p>
            </div>

            <div class="m-cta-stack" style="display: flex; flex-direction: column; gap: 0.65rem; max-width: 280px; margin: 0 auto;">
              <a href="#/register" class="btn-primary" id="sign-on-cta" style="text-decoration: none;">
                Create Account
              </a>
              <a href="#/demo" class="btn-secondary" style="text-decoration: none;">
                Try a Pylon
              </a>
              <div class="m-foot" style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.8rem; font-family: var(--font-mono); font-size: 0.72rem;">
                <a href="#/login" class="link-accent">Sign in</a>
                <button type="button" id="landing-sound-btn" class="btn-chip" style="font-size: 0.65rem;">
                  ${isMuted ? '// SOUND OFF' : '// SOUND ON'}
                </button>
              </div>
            </div>
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

  const landingSoundBtn = container.querySelector('#landing-sound-btn');
  if (landingSoundBtn) {
    landingSoundBtn.addEventListener('click', () => {
      const nextMuted = !session.sound?.muted;
      session.setSound({ muted: nextMuted });
      landingSoundBtn.textContent = nextMuted ? '// SOUND OFF' : '// SOUND ON';
      landingSoundBtn.classList.toggle('warn', nextMuted);
      if (!nextMuted) soundscape.playToggleClack();
    });
  }
}
