/**
 * starmap.js — Tactical Star Map screen
 */

import { stage } from '../three/stage.js';

export function renderStarMap(container) {
  if (stage.cameraRig) {
    stage.cameraRig.moveTo('starmap');
  }

  container.innerHTML = `
    <div class="screen-container">
      <div class="glass-panel" style="margin-bottom: 1.5rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
          <div>
            <h2 class="holo-title" style="margin-bottom: 0.2rem;">Star Map</h2>
            <p class="holo-subtitle">Available Quests</p>
          </div>
          <a href="#/quest" class="btn-primary" style="text-decoration: none;">
            <span>Launch Quest</span>
            <span>➔</span>
          </a>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1.25rem;">
        <!-- Sector 1 (Active) -->
        <div class="holo-card" style="border-color: var(--accent-cyan);">
          <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
            <span style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--accent-cyan);">SECTOR 1</span>
            <span style="color: var(--accent-green); font-size: 0.75rem; font-weight: 700;">● ACTIVE</span>
          </div>
          <h3 style="font-family: var(--font-display); font-size: 1.2rem; color: #fff; margin-bottom: 0.3rem;">Vareth-9</h3>
          <p style="font-size: 0.82rem; color: var(--text-secondary); margin-bottom: 1rem; line-height: 1.5;">
            Charge density analysis, nucleophilic attack, and leaving group displacement.
          </p>
          <a href="#/quest" class="btn-primary" style="width: 100%; text-decoration: none; font-size: 0.75rem; padding: 8px;">
            Launch Quest
          </a>
        </div>

        <!-- Sector 2 -->
        <div class="holo-card" style="opacity: 0.65;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
            <span style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--text-muted);">SECTOR 2</span>
            <span style="color: var(--text-muted); font-size: 0.75rem;">LOCKED</span>
          </div>
          <h3 style="font-family: var(--font-display); font-size: 1.2rem; color: var(--text-secondary); margin-bottom: 0.3rem;">Pyros Prime</h3>
          <p style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 1rem; line-height: 1.5;">
            Radical chlorination and bond enthalpies.
          </p>
          <div style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--accent-amber);">ETA: OCT 02</div>
        </div>

        <!-- Sector 3 -->
        <div class="holo-card" style="opacity: 0.65;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
            <span style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--text-muted);">SECTOR 3</span>
            <span style="color: var(--text-muted); font-size: 0.75rem;">LOCKED</span>
          </div>
          <h3 style="font-family: var(--font-display); font-size: 1.2rem; color: var(--text-secondary); margin-bottom: 0.3rem;">Cryo-Haven</h3>
          <p style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 1rem; line-height: 1.5;">
            Crystal lattices, dipole interactions, and phase equilibrium.
          </p>
          <div style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--accent-amber);">ETA: OCT 16</div>
        </div>

        <!-- Sector 4 -->
        <div class="holo-card" style="opacity: 0.65;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
            <span style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--text-muted);">SECTOR 4</span>
            <span style="color: var(--text-muted); font-size: 0.75rem;">LOCKED</span>
          </div>
          <h3 style="font-family: var(--font-display); font-size: 1.2rem; color: var(--text-secondary); margin-bottom: 0.3rem;">Aetheria</h3>
          <p style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 1rem; line-height: 1.5;">
            Acid-base proton transfers and buffer equilibria.
          </p>
          <div style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--accent-amber);">ETA: OCT 30</div>
        </div>
      </div>
    </div>
  `;
}
