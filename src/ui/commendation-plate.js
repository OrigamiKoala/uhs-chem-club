/**
 * commendation-plate.js — Stencilled commendation plate component.
 */

import { esc } from './layout.js';

/**
 * Generates the HTML for a single commendation plate.
 * @param {object} params
 * @param {object} params.commendation
 * @param {boolean} [params.earned]
 * @param {boolean} [params.isPinned]
 * @param {boolean} [params.canPin]
 * @returns {string}
 */
export function renderCommendationPlate({ commendation, earned = false, isPinned = false, canPin = false }) {
  const isHidden = commendation.hidden && !earned;
  const finishClass = `finish-${commendation.tier || 'painted'}`;
  const stateClass = earned ? 'earned' : 'locked';
  const pinClass = isPinned ? 'pinned' : '';

  if (isHidden) {
    return `
      <div class="commendation-plate ${finishClass} locked" data-plate-id="${commendation.id}">
        <div class="plate-header">
          <span class="plate-name" style="color: var(--text-muted);">// UNDISCOVERED</span>
          <span class="plate-tier-badge">${esc(commendation.tier || 'painted')}</span>
        </div>
        <div class="plate-line" style="font-style: italic; color: var(--accent-gold);">
          "${esc(commendation.clue || 'A hidden mark awaits discovery.')}"
        </div>
      </div>
    `;
  }

  return `
    <div class="commendation-plate ${finishClass} ${stateClass} ${pinClass}" data-plate-id="${commendation.id}">
      <div class="plate-header">
        <span class="plate-name">${esc(commendation.name)}</span>
        <span class="plate-tier-badge">${esc(commendation.tier || 'painted')}</span>
      </div>
      <div class="plate-line">
        ${esc(commendation.line)}
      </div>
      ${earned && canPin ? `
        <div class="plate-actions">
          <button type="button" class="btn-chip pin-toggle-btn" data-plate-id="${commendation.id}" style="font-size: 0.68rem; padding: 3px 8px;">
            ${isPinned ? 'UNPIN' : 'PIN TO PROFILE'}
          </button>
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * Generates a compact plate chip for Standings rows or profile headers.
 */
export function renderPlateChip(commendation) {
  if (!commendation) return '';
  const finish = commendation.tier || 'painted';
  return `
    <span class="plate-chip finish-${finish}" title="${esc(commendation.name)}: ${esc(commendation.line)}">
      ${esc(commendation.name)}
    </span>
  `;
}
