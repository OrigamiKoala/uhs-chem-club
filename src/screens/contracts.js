/**
 * contracts.js — Contract Board (Guild Requisitions & Side Expeditions).
 *
 * Diegetic job board posted by the Four Guilds.
 * Features Sector 01 (The Charge Gardens of Erebus) and future contracts.
 */

import { session, levelProgress, levelTitle } from '../session.js';
import { stage } from '../three/stage.js';
import { tierManager } from '../three/tier.js';
import { pageHeader, statRow, esc } from '../ui/layout.js';
import { TOTAL_STAGES, TOTAL_QUEST_XP } from '../quest3d/evaluator.js';
import { QUEST1_STORY } from '../story/quest1.js';

export function renderContracts(container) {
  if (stage.cameraRig && tierManager.currentTier !== 'T4') {
    stage.cameraRig.moveTo('starmap');
  }

  const isT4 = tierManager.currentTier === 'T4';
  const canPlay = Boolean(session.token && session.player);

  function stagesCleared() {
    const prog = (session.progress || []).find(p => p.quest_id === 'q1');
    let reached = prog && typeof prog.stage_reached === 'number' ? Number(prog.stage_reached) : 0;
    try {
      const local = parseInt(localStorage.getItem('avalon_q1_stage_reached'), 10);
      if (!isNaN(local)) reached = Math.max(reached, local);
    } catch (e) {}
    return Math.max(0, Math.min(reached, TOTAL_STAGES));
  }

  const cleared = stagesCleared();
  const isComplete = cleared >= TOTAL_STAGES;
  const currentPylon = Math.min(cleared + 1, TOTAL_STAGES);

  const CONTRACTS = [
    {
      id: 'contract_erebus_01',
      code: 'CON-01',
      title: 'The Charge Gardens of Erebus',
      type: 'Industrial Grid Restoration',
      issuer: 'Imperial Survey Board',
      status: isComplete ? 'complete' : cleared > 0 ? 'underway' : 'open',
      statusLabel: isComplete ? 'RESOLVED' : cleared > 0 ? `UNDERWAY (${cleared}/${TOTAL_STAGES})` : 'OPEN',
      summary: 'Deep perimeter survey in the southern hydrocarbon basins. Re-align 20 pylon resonance coils across the Charge Gardens.',
      payout: `${TOTAL_QUEST_XP} XP + Salvage Items`,
      clueYield: 'Unliveried Stencil (Stage 20 Debrief)',
      stages: TOTAL_STAGES,
      actionUrl: '#/quest',
      actionLabel: isComplete ? 'Replay Contract' : cleared > 0 ? `Resume Stage ${currentPylon}` : 'Accept Contract'
    },
    {
      id: 'contract_siphon_02',
      code: 'CON-02',
      title: 'The Siphon Drift',
      type: 'Atmospheric Fleet Extraction',
      issuer: 'Zephyr League',
      status: 'locked',
      statusLabel: 'SEALED',
      summary: 'Atmospheric pressure anomalies detected above the cloud shelf. Neutralize rogue pressure bladders.',
      payout: '700 XP + Rare Catalyst',
      clueYield: 'Unknown',
      stages: 15,
      actionUrl: null,
      actionLabel: 'Awaiting Authorization'
    },
    {
      id: 'contract_cinder_03',
      code: 'CON-03',
      title: 'Cinder Gate Purge',
      type: 'Thermal Lattice Stabilization',
      issuer: 'Ignis Foundry',
      status: 'locked',
      statusLabel: 'SEALED',
      summary: 'Sub-surface geothermal venting along the magma shelf. Clear calcified conduit obstructions.',
      payout: '750 XP + Crucible Core',
      clueYield: 'Unknown',
      stages: 18,
      actionUrl: null,
      actionLabel: 'Awaiting Authorization'
    },
    {
      id: 'contract_thalassa_04',
      code: 'CON-04',
      title: 'The Deep Vent Rig',
      type: 'High-Pressure Solution Survey',
      issuer: 'Thalassa Deep Rig',
      status: 'locked',
      statusLabel: 'SEALED',
      summary: 'Abyssal brine reservoirs showing fluctuating solute concentrations. Calibrate osmotic relays.',
      payout: '800 XP + High-Density Battery',
      clueYield: 'Unknown',
      stages: 20,
      actionUrl: null,
      actionLabel: 'Awaiting Authorization'
    }
  ];

  const headerMarkup = isT4 ? `
    <div class="terminal-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; border-bottom: 1px solid var(--border-durasteel); padding-bottom: 0.5rem;">
      <div>
        <span class="eyebrow lit" style="color: var(--accent-gold); letter-spacing: 0.15em;">CONTRACTS</span>
        <h2 class="section-title" style="font-size: 1.15rem; margin-top: 2px;">EXPEDITIONS</h2>
      </div>
      <a href="#/bridge" class="terminal-close-btn" style="text-decoration: none; padding: 4px 10px; font-family: var(--font-mono); font-size: 0.75rem; border: 1px solid var(--border-durasteel); color: var(--text-muted);">CLOSE</a>
    </div>
  ` : pageHeader({
    art: '/art/starmap.jpg',
    title: 'Contract Board',
    eyebrow: 'Contracts',
    actions: statRow([
      { label: 'Active Contracts', value: '1 Live', plain: true },
      { label: 'Pending Postings', value: '3 Sealed', plain: true },
      { label: 'Contract XP Paid', value: `${isComplete ? TOTAL_QUEST_XP : cleared * 20} XP`, plain: true }
    ])
  });

  container.innerHTML = `
    <div class="${isT4 ? 'in-world-terminal contracts-terminal' : 'screen-container'} m-screen m-contracts" style="max-width: 960px; margin: 0 auto; padding: 1.25rem;">
      ${headerMarkup}

      <div class="contracts-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem;">
        ${CONTRACTS.map(c => {
          const isLive = c.status !== 'locked';
          return `
            <article class="holo-card contract-card" style="padding: 1.15rem; border: 1px solid ${isLive ? 'var(--accent-gold)' : 'var(--border-durasteel)'}; background: ${isLive ? 'var(--plate-200)' : 'var(--plate-100)'}; opacity: ${isLive ? '1' : '0.6'}; display: flex; flex-direction: column;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                <span class="eyebrow ${isLive ? 'lit' : ''}" style="font-size: 0.7rem; color: var(--accent-gold);">${esc(c.code)} · ${esc(c.type)}</span>
                <span class="tag ${c.status === 'complete' ? 'live' : c.status === 'underway' ? 'warn' : 'locked'}" style="font-size: 0.65rem;">${esc(c.statusLabel)}</span>
              </div>

              <h3 style="font-family: var(--font-imperial); font-size: 1.1rem; letter-spacing: 0.1em; text-transform: uppercase; color: ${isLive ? 'var(--text-bright)' : 'var(--text-muted)'}; margin: 0 0 0.35rem;">
                ${esc(c.title)}
              </h3>

              <div style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--accent-bronze); margin-bottom: 0.65rem;">
                POSTED BY: ${esc(c.issuer)}
              </div>

              <p style="font-size: 0.83rem; line-height: 1.45; color: var(--text-secondary); margin-bottom: 0.85rem; flex: 1;">
                ${esc(c.summary)}
              </p>

              <div style="background: rgba(0, 0, 0, 0.35); border: 1px solid var(--border-durasteel); padding: 0.55rem 0.75rem; margin-bottom: 0.85rem; font-family: var(--font-mono); font-size: 0.75rem;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                  <span style="color: var(--text-muted);">Payout:</span>
                  <span style="color: var(--accent-gold);">${esc(c.payout)}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: var(--text-muted);">Intel Clue:</span>
                  <span style="color: var(--text-bright);">${esc(c.clueYield)}</span>
                </div>
              </div>

              <div style="margin-top: auto;">
                ${c.actionUrl && canPlay ? `
                  <a href="${c.actionUrl}" class="btn-primary quest-btn-sm" style="display: block; text-align: center; text-decoration: none; padding: 8px 14px; font-size: 0.75rem;">
                    ${esc(c.actionLabel)}
                  </a>
                ` : c.actionUrl && !canPlay ? `
                  <a href="#/register" class="btn-primary quest-btn-sm" style="display: block; text-align: center; text-decoration: none; padding: 8px 14px; font-size: 0.75rem;">
                    Sign In to Accept
                  </a>
                ` : `
                  <div style="text-align: center; padding: 8px; font-family: var(--font-mono); font-size: 0.75rem; color: var(--text-muted); border: 1px dashed var(--border-durasteel);">
                    ${esc(c.actionLabel)}
                  </div>
                `}
              </div>
            </article>
          `;
        }).join('')}
      </div>

      <div style="margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--border-durasteel); display: flex; justify-content: space-between; align-items: center;">
        <a href="#/bridge" class="btn-secondary quest-btn-sm" style="text-decoration: none; font-size: 0.75rem;">◀ Bridge</a>
        <a href="#/casefile" class="btn-secondary quest-btn-sm" style="text-decoration: none; font-size: 0.75rem;">Case File ▶</a>
      </div>
    </div>
  `;
}
