/**
 * gardens-map.js — The Charge Gardens 20-pylon status map.
 *
 * Displays 20 pylon lamps across Sector 01:
 * - dark: unreached
 * - active: reached / current
 * - lit: cleared
 *
 * Used on Bridge (replaces progress bar) and Quest screen HUD.
 */

import { TOTAL_STAGES } from '../quest3d/evaluator.js';

/**
 * Render the Gardens Map HTML string.
 * @param {{ clearedCount: number, currentStageIdx?: number, compact?: boolean }} opts
 * @returns {string} HTML markup
 */
export function renderGardensMap(opts = {}) {
  const { clearedCount = 0, currentStageIdx = null, compact = false } = opts;
  const activeIdx = currentStageIdx !== null ? currentStageIdx : Math.min(clearedCount, TOTAL_STAGES - 1);

  const lamps = [];
  for (let i = 0; i < TOTAL_STAGES; i++) {
    const isLit = i < clearedCount;
    const isActive = i === activeIdx && !isLit;
    const isMilestone = i === 6 || i === 9 || i === 19; // Stage 7, 10, 20

    let stateClass = 'dark';
    if (isLit) stateClass = 'lit';
    else if (isActive) stateClass = 'active';

    lamps.push(`
      <div class="pylon-node ${stateClass} ${isMilestone ? 'milestone' : ''}"
           title="Stage ${i + 1}${isLit ? ' · Cleared' : isActive ? ' · Active' : ' · Locked'}"
           aria-label="Stage ${i + 1}: ${stateClass}">
        <span class="pylon-filament"></span>
        ${!compact ? `<span class="pylon-num">${i + 1}</span>` : ''}
      </div>
    `);
  }

  return `
    <div class="gardens-map ${compact ? 'compact' : ''}" role="region" aria-label="Stages">
      <div class="gardens-header">
        <span class="eyebrow lit">STAGES</span>
        <span class="tag ${clearedCount >= TOTAL_STAGES ? 'live' : 'warn'}">
          ${clearedCount} / ${TOTAL_STAGES} CLEARED
        </span>
      </div>
      <div class="pylon-grid">
        ${lamps.join('')}
      </div>
    </div>
  `;
}
