/**
 * ui/scan.js — The site scanner readout.
 *
 * The quest's exploration loop: tapping a site reads out that site and nothing else,
 * so a stage is only ever solved by scanning several and comparing them. Shared by
 * the quest HUD and the free sample so both teach the identical loop.
 */

import { esc } from './layout.js';

/** A 0-10 reading drawn as a ten-segment bar, the way the ship's instruments would. */
export function meterBar(value) {
  const filled = Math.max(0, Math.min(10, Math.round(value)));
  let out = '';
  for (let i = 0; i < 10; i++) {
    out += `<span class="scan-seg${i < filled ? ' on' : ''}"></span>`;
  }
  return out;
}

/**
 * The scanner readout. Deliberately describes ONE site: a single scan is never enough
 * to solve a stage, so the player has to go and compare.
 */
export function renderScanReadout(scan, scannedCount, totalSites) {
  const counter = `<span class="scan-count">${scannedCount} / ${totalSites} scanned</span>`;

  if (!scan) {
    return `
      <div class="scan-readout idle" id="scan-readout" aria-live="polite">
        <div class="scan-head">
          <span class="scan-site">SCANNER IDLE</span>
          ${counter}
        </div>
        <div class="scan-note">Tap any glowing site to read its charge and how much room there is around it.</div>
      </div>
    `;
  }

  const isGiver = scan.polarity === 'giver';
  return `
    <div class="scan-readout ${isGiver ? 'giver' : 'taker'}" id="scan-readout" aria-live="polite">
      <div class="scan-head">
        <span class="scan-site">SITE ${esc(scan.site)}</span>
        <span class="scan-polarity ${isGiver ? 'giver' : 'taker'}">${isGiver ? 'GIVER' : 'TAKER'}</span>
        ${counter}
      </div>
      <div class="scan-meter">
        <span class="scan-meter-label">CHARGE</span>
        <span class="scan-meter-bar">${meterBar(scan.strength)}</span>
        <span class="scan-meter-val">${scan.strength}/10</span>
      </div>
      <div class="scan-meter">
        <span class="scan-meter-label">CLEARANCE</span>
        <span class="scan-meter-bar">${meterBar(scan.clearance)}</span>
        <span class="scan-meter-val">${scan.clearance}/10</span>
      </div>
      <div class="scan-note">${esc(scan.note)}</div>
    </div>
  `;
}
