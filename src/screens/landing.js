/**
 * landing.js — Landing screen
 */

import { session } from '../session.js';
import { stage } from '../three/stage.js';

export function renderLanding(container) {
  if (stage.cameraRig) {
    stage.cameraRig.moveTo('bridge');
  }

  container.innerHTML = `
    <div class="screen-container" style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 80vh; text-align: center;">
      <div class="glass-panel" style="max-width: 540px; width: 100%; padding: 2.5rem 2rem;">
        <div style="font-family: var(--font-mono); font-size: 0.8rem; color: var(--accent-cyan); letter-spacing: 0.15em; margin-bottom: 0.5rem;">
          UHS CHEMISTRY CLUB
        </div>
        <h1 style="font-family: var(--font-display); font-size: 2.75rem; letter-spacing: 0.12em; font-weight: 900; margin-bottom: 1rem; background: linear-gradient(135deg, #ffffff 30%, var(--accent-cyan)); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
          AVALON
        </h1>
        <p style="font-size: 1rem; color: var(--text-secondary); margin-bottom: 1.75rem; line-height: 1.5;">
          Competition portal and chemical simulation.
        </p>

        <div style="display: flex; flex-direction: column; gap: 0.75rem; max-width: 320px; margin: 0 auto;">
          <a href="#/register" class="btn-primary" style="text-decoration: none;">
            <span>Register</span>
            <span>➔</span>
          </a>
          <a href="#/demo" class="btn-secondary" style="text-decoration: none; border-color: var(--accent-amber); color: var(--accent-amber);">
            <span>Try Demo</span>
          </a>
          <a href="#/login" class="btn-secondary" style="text-decoration: none;">
            <span>Sign In</span>
          </a>
        </div>
      </div>
    </div>
  `;
}
