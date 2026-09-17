/**
 * starmap.js — Sector cartography: which quests exist and which are open.
 *
 * Implements:
 * - Sector 01 launch sequence: plays `launch` cinematic on first venture.
 * - Locked sectors showing as dark pins with "No charts."
 */

import { stage } from '../three/stage.js';
import { session } from '../session.js';
import { pageHeader } from '../ui/layout.js';
import { TOTAL_STAGES } from '../quest3d/evaluator.js';
import { playCinematic } from '../ui/cinematic.js';

const SECTORS = [
  {
    code: '01',
    world: 'Erebus',
    place: 'Desert world',
    quest: 'The Charge Gardens',
    line: 'Find what pulls. Draw the line.',
    status: 'live'
  },
  {
    code: '02',
    world: 'Pyros Prime',
    place: 'Volcanic forge',
    quest: 'The Forge Line',
    line: 'No charts.',
    status: 'locked'
  },
  {
    code: '03',
    world: 'Cryo-Haven',
    place: 'Ice tundra',
    quest: 'The Lattice',
    line: 'No charts.',
    status: 'locked'
  },
  {
    code: '04',
    world: 'Aetheria',
    place: 'Gas giant',
    quest: 'The Swing',
    line: 'No charts.',
    status: 'locked'
  }
];

export function renderStarMap(container) {
  if (stage.cameraRig) {
    stage.cameraRig.moveTo('starmap');
  }

  const canPlay = Boolean(session.token && session.player);

  container.innerHTML = `
    <div class="screen-container m-screen m-starmap">
      ${pageHeader({
        art: '/art/starmap.jpg',
        video: '/video/starmap_loop.webm',
        artAlt: '',
        eyebrow: 'Charted sectors',
        title: 'Star Map',
        actions: canPlay
          ? `<button type="button" id="launch-sector1-btn" class="btn-primary">Sector 01</button>`
          : `<a href="#/register" class="btn-primary" style="text-decoration: none;">Create Account</a>`
      })}

      <div class="m-grid-1 sector-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem;">
        ${SECTORS.map(s => {
          const isLive = s.status === 'live';
          return `
            <article class="holo-card sector-card" style="${isLive ? '' : 'opacity: 0.5;'} display: flex; flex-direction: column;">
              <div class="m-head" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.9rem;">
                <span class="eyebrow ${isLive ? 'lit' : ''}">Sector ${s.code}</span>
                <span class="tag ${isLive ? 'live' : 'locked'}">${isLive ? 'Open' : 'No Charts'}</span>
              </div>

              <h2 class="sector-world" style="font-family: var(--font-imperial); font-size: 1.25rem; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: ${isLive ? 'var(--text-bright)' : 'var(--text-secondary)'}; text-shadow: var(--engrave);">
                ${s.world}
              </h2>
              <div class="eyebrow" style="margin-top: 4px;">${s.place}</div>

              <div style="height: 1px; background: var(--border-durasteel); margin: 0.9rem 0;"></div>

              <div style="font-family: var(--font-display); font-size: 0.85rem; letter-spacing: 0.1em; text-transform: uppercase; color: ${isLive ? 'var(--accent-gold)' : 'var(--text-muted)'}; margin-bottom: 0.3rem;">
                ${s.quest}
              </div>
              <p style="font-size: 0.86rem; color: var(--text-secondary); margin-bottom: 1.25rem; line-height: 1.5;">
                ${s.line}
              </p>

              <div style="margin-top: auto;">
                ${isLive ? `
                  <button type="button" class="btn-primary sector-enter-btn m-tap" style="width: 100%; font-size: 0.7rem; padding: 9px 14px; min-height: 38px;">
                    ${canPlay ? `Enter · ${TOTAL_STAGES} stages` : 'Free puzzle'}
                  </button>
                ` : `
                  <div class="eyebrow" style="text-align: center; padding: 10px 0; color: var(--text-muted);">No Charts</div>
                `}
              </div>
            </article>
          `;
        }).join('')}
      </div>
    </div>
  `;

  async function handleSector01Enter() {
    if (!canPlay) {
      window.location.hash = '#/demo';
      return;
    }

    const hasLaunched = localStorage.getItem('avalon_sector01_launched') === 'true';
    if (!hasLaunched) {
      try {
        localStorage.setItem('avalon_sector01_launched', 'true');
        await playCinematic('launch');
      } catch (e) {}
    }
    window.location.hash = '#/quest';
  }

  container.querySelector('#launch-sector1-btn')?.addEventListener('click', handleSector01Enter);
  container.querySelectorAll('.sector-enter-btn').forEach(b => {
    b.addEventListener('click', handleSector01Enter);
  });
}
