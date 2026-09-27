/**
 * rank-plate.js — Stamped rank plate UI component (two-grade chamfer, engraved level numeral).
 */

import { levelTitle } from '../progression/levels.js';
import { esc } from './layout.js';

/**
 * Generates the HTML for a stamped rank plate.
 * @param {object} params
 * @param {number} params.level
 * @param {string} [params.customTitle]
 * @param {string} [params.subtext]
 * @returns {string}
 */
export function renderRankPlate({ level = 1, customTitle, subtext }) {
  const title = customTitle || levelTitle(level);

  return `
    <div class="rank-plate" role="img" aria-label="Level ${level} ${esc(title)} Rank Plate">
      <span class="rank-plate-eyebrow">AVALON QUARTERMASTER ISSUE</span>
      <div class="rank-plate-num">${level}</div>
      <div class="rank-plate-title">${esc(title)}</div>
      ${subtext ? `<div style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--text-secondary); margin-top: 0.35rem;">${esc(subtext)}</div>` : ''}
    </div>
  `;
}
