/**
 * voyage.js (screen) — The helm plate while the Avalon is under way.
 *
 * Not a page and not a cutscene: the flight itself is the 3D view, and this
 * is one small plate in the corner of the glass saying where the ship is
 * going and what it is doing, in the ship's own words, with a key to hurry it
 * along. Once the ship is down it says how to get off it; the chevron aboard
 * (`guide-arrow.js`) shows the way.
 */

import { stage } from '../three/stage.js';

let listener = null;

export function renderVoyageHud(container) {
  if (listener) window.removeEventListener('voyage:phase', listener);

  container.innerHTML = `
    <div class="voyage-hud m-screen m-voyage">
      <section class="voyage-plate" aria-live="polite">
        <div class="voyage-plate-head">
          <span class="eyebrow lit">Avalon // Helm</span>
          <button type="button" class="btn-secondary quest-btn-sm voyage-skip m-tap">Skip</button>
        </div>
        <div class="voyage-dest"></div>
        <div class="voyage-phase"></div>
        <div class="voyage-bar" aria-hidden="true"><span></span></div>
      </section>
    </div>
  `;

  const plate = container.querySelector('.voyage-plate');
  const destEl = container.querySelector('.voyage-dest');
  const phaseEl = container.querySelector('.voyage-phase');
  const bar = container.querySelector('.voyage-bar span');
  const skip = container.querySelector('.voyage-skip');

  const paint = (d) => {
    if (!d || !plate.isConnected) return;
    destEl.textContent = d.dest || '';
    phaseEl.textContent = d.label || '';
    bar.style.width = `${Math.round((d.progress || 0) * 100)}%`;
    const flying = d.state === 'flight';
    skip.hidden = !flying || d.hurrying;
    plate.classList.toggle('is-down', d.state === 'landed');
  };

  skip.addEventListener('click', () => {
    stage.voyage?.hurry();
    skip.hidden = true;
  });

  listener = (e) => {
    if (!plate.isConnected) {
      window.removeEventListener('voyage:phase', listener);
      listener = null;
      return;
    }
    paint(e.detail);
  };
  window.addEventListener('voyage:phase', listener);
  paint(stage.voyage?.lastPhase);
}
