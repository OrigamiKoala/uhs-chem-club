/**
 * starmap.js — Sector cartography: which quests exist and which are open.
 *
 * A sector card carries three things and nothing else: where you go, what the
 * quest is called, and one line saying what you do there.
 */

import { stage } from '../three/stage.js';
import { session } from '../session.js';
import { pageHeader } from '../ui/layout.js';
import { TOTAL_STAGES } from '../quest3d/evaluator.js';

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
    line: 'Break bonds with heat.',
    status: 'locked'
  },
  {
    code: '03',
    world: 'Cryo-Haven',
    place: 'Ice tundra',
    quest: 'The Lattice',
    line: 'Lock molecules into pattern.',
    status: 'locked'
  },
  {
    code: '04',
    world: 'Aetheria',
    place: 'Gas giant',
    quest: 'The Swing',
    line: 'Acid to base and back.',
    status: 'locked'
  }
];

export function renderStarMap(container) {
  if (stage.cameraRig) {
    stage.cameraRig.moveTo('starmap');
  }

  const canPlay = Boolean(session.token && session.player);

  container.innerHTML = `
    <div class="screen-container">
      ${pageHeader({
        art: '/art/starmap.jpg',
        artAlt: '',
        eyebrow: 'Charted sectors',
        title: 'Star Map',
        actions: canPlay
          ? `<a href="#/quest" class="btn-primary" style="text-decoration: none;">Sector 01</a>`
          : `<a href="#/register" class="btn-primary" style="text-decoration: none;">Create Account</a>`
      })}

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem;">
        ${SECTORS.map(s => {
          const isLive = s.status === 'live';
          return `
            <article class="holo-card" style="${isLive ? '' : 'opacity: 0.55;'} display: flex; flex-direction: column;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.9rem;">
                <span class="eyebrow ${isLive ? 'lit' : ''}">Sector ${s.code}</span>
                <span class="tag ${isLive ? 'live' : 'locked'}">${isLive ? 'Open' : 'Sealed'}</span>
              </div>

              <h2 style="font-family: var(--font-imperial); font-size: 1.25rem; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: ${isLive ? 'var(--text-bright)' : 'var(--text-secondary)'}; text-shadow: var(--engrave);">
                ${s.world}
              </h2>
              <div class="eyebrow" style="margin-top: 4px;">${s.place}</div>

              <div style="height: 1px; background: var(--border-durasteel); margin: 0.9rem 0;"></div>

              <div style="font-family: var(--font-display); font-size: 0.85rem; letter-spacing: 0.1em; text-transform: uppercase; color: var(--accent-gold); margin-bottom: 0.3rem;">
                ${s.quest}
              </div>
              <p style="font-size: 0.86rem; color: var(--text-secondary); margin-bottom: 1.25rem; line-height: 1.5;">
                ${s.line}
              </p>

              <div style="margin-top: auto;">
                ${isLive ? `
                  <a href="${canPlay ? '#/quest' : '#/demo'}" class="btn-primary" style="width: 100%; text-decoration: none; font-size: 0.7rem; padding: 9px 14px; min-height: 38px;">
                    ${canPlay ? `Enter · ${TOTAL_STAGES} stages` : 'Free puzzle'}
                  </a>
                ` : `
                  <div class="eyebrow" style="text-align: center; padding: 10px 0;">Locked</div>
                `}
              </div>
            </article>
          `;
        }).join('')}
      </div>
    </div>
  `;
}
