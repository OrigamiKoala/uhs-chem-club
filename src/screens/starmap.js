/**
 * starmap.js — Tactical Holotable & Sector Cartography screen (Dune & Star Wars style)
 */

import { stage } from '../three/stage.js';

export function renderStarMap(container) {
  if (stage.cameraRig) {
    stage.cameraRig.moveTo('starmap');
  }

  container.innerHTML = `
    <div class="screen-container">
      <div class="glass-panel" style="margin-bottom: 1.5rem; border-color: var(--border-durasteel); background: rgba(18, 20, 26, 0.94);">
        <!-- Starmap Banner -->
        <div style="position: relative; border-radius: 2px; overflow: hidden; margin-bottom: 1.25rem; border: 1px solid var(--border-durasteel); height: 140px;">
          <img src="/art/starmap.jpg" alt="Tactical Holotable" style="width: 100%; height: 100%; object-fit: cover; filter: contrast(1.1) brightness(0.85);" />
          <div style="position: absolute; inset: 0; background: linear-gradient(180deg, transparent 20%, rgba(12, 13, 17, 0.9) 100%);"></div>
          <div style="position: absolute; bottom: 8px; left: 12px; font-family: var(--font-mono); font-size: 0.7rem; color: var(--accent-amber); letter-spacing: 0.12em;">
            [ TACTICAL HOLOTABLE // ORBITAL NAVIGATION ARRAY // MULTI-PLANET CARTOGRAPHY ]
          </div>
          <div style="position: absolute; bottom: 8px; right: 12px; font-family: var(--font-mono); font-size: 0.7rem; color: var(--accent-green);">
            ● PROJECTION SYNCHRONIZED
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
          <div>
            <h2 style="font-family: var(--font-imperial); font-size: 1.6rem; letter-spacing: 0.12em; color: #fffdf7; margin-bottom: 0.2rem;">
              Planetary Sectors & Interstellar Expeditions
            </h2>
            <p style="font-family: var(--font-main); font-size: 0.9rem; color: var(--text-secondary);">
              Uncharted star systems across the Perseus Verge. Select an active celestial territory to initiate chemical synthesis and molecular probe trials.
            </p>
          </div>
          <a href="#/quest" class="btn-primary" style="text-decoration: none;">
            <span>Deploy to Active Sector</span>
            <span>➔</span>
          </a>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1.25rem;">
        <!-- Sector 1 (Active) -->
        <div class="holo-card" style="border-color: var(--accent-amber); background: #14161c;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
            <span style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--accent-amber);">SECTOR 01 // DUNE SEA</span>
            <span style="color: var(--accent-green); font-size: 0.75rem; font-weight: 700; font-family: var(--font-mono);">● DEPLOYED</span>
          </div>
          <h3 style="font-family: var(--font-display); font-size: 1.25rem; font-weight: 700; color: #fff; margin-bottom: 0.3rem;">Erebus</h3>
          <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 1.25rem; line-height: 1.45;">
            Electrostatic charge density mapping, nucleophilic attacks, and leaving group kinetics in harsh alkaline sand fields.
          </p>
          <a href="#/quest" class="btn-primary" style="width: 100%; text-decoration: none; font-size: 0.8rem; padding: 8px 14px;">
            Engage Quest
          </a>
        </div>

        <!-- Sector 2 -->
        <div class="holo-card" style="opacity: 0.7; background: #121419;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
            <span style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--text-muted);">SECTOR 02 // FORGE BASIN</span>
            <span style="color: var(--text-muted); font-size: 0.75rem; font-family: var(--font-mono);">LOCKED</span>
          </div>
          <h3 style="font-family: var(--font-display); font-size: 1.25rem; font-weight: 700; color: var(--text-secondary); margin-bottom: 0.3rem;">Pyros Prime</h3>
          <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1.25rem; line-height: 1.45;">
            Thermal pyrosynthesis, bond dissociation enthalpies, and radical halogen propagation.
          </p>
          <div style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--accent-amber);">TRANSIT WINDOW: OCT 02</div>
        </div>

        <!-- Sector 3 -->
        <div class="holo-card" style="opacity: 0.7; background: #121419;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
            <span style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--text-muted);">SECTOR 03 // SILT TUNDRA</span>
            <span style="color: var(--text-muted); font-size: 0.75rem; font-family: var(--font-mono);">LOCKED</span>
          </div>
          <h3 style="font-family: var(--font-display); font-size: 1.25rem; font-weight: 700; color: var(--text-secondary); margin-bottom: 0.3rem;">Cryo-Haven</h3>
          <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1.25rem; line-height: 1.45;">
            Lattice enthalpy, crystalline phase packing, and cryo-sublimation kinetics.
          </p>
          <div style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--accent-amber);">TRANSIT WINDOW: OCT 16</div>
        </div>

        <!-- Sector 4 -->
        <div class="holo-card" style="opacity: 0.7; background: #121419;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
            <span style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--text-muted);">SECTOR 04 // VORTEX STRATA</span>
            <span style="color: var(--text-muted); font-size: 0.75rem; font-family: var(--font-mono);">LOCKED</span>
          </div>
          <h3 style="font-family: var(--font-display); font-size: 1.25rem; font-weight: 700; color: var(--text-secondary); margin-bottom: 0.3rem;">Aetheria</h3>
          <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1.25rem; line-height: 1.45;">
            Atmospheric ionization, conjugate acid-base buffer equilibria, and Henderson-Hasselbalch dynamics.
          </p>
          <div style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--accent-amber);">TRANSIT WINDOW: OCT 30</div>
        </div>
      </div>
    </div>
  `;
}
