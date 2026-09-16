/**
 * bridge.js — Command Bridge dashboard: where a player lands after signing in.
 */

import { session, levelProgress, levelTitle } from '../session.js';
import { stage } from '../three/stage.js';
import { pageHeader, statRow, esc } from '../ui/layout.js';
import { TOTAL_STAGES, TOTAL_QUEST_XP } from '../quest3d/evaluator.js';

// Held at module scope so a re-entry always releases the previous subscription.
let unsubscribeBridge = null;

export function renderBridge(container) {
  if (unsubscribeBridge) {
    unsubscribeBridge();
    unsubscribeBridge = null;
  }

  if (stage.cameraRig) {
    stage.cameraRig.moveTo('bridge');
  }

  function stagesCleared() {
    const prog = (session.progress || []).find(p => p.quest_id === 'q1');
    let reached = prog && typeof prog.stage_reached === 'number' ? Number(prog.stage_reached) : 0;
    try {
      const local = parseInt(localStorage.getItem('avalon_q1_stage_reached'), 10);
      if (!isNaN(local)) reached = Math.max(reached, local);
    } catch (e) {}
    return Math.max(0, Math.min(reached, TOTAL_STAGES));
  }

  function render() {
    const p = session.player || {};
    const t = session.team || {};
    const activeEv = session.events ? session.events[session.teamId] : null;
    const prog = levelProgress(session.xp || 0);
    const cleared = stagesCleared();
    const isComplete = cleared >= TOTAL_STAGES;
    const pct = Math.round((cleared / TOTAL_STAGES) * 100);

    container.innerHTML = `
      <div class="screen-container">
        ${pageHeader({
          eyebrow: esc(t.name || t.team_id || 'Unassigned') + ' Guild',
          title: esc(p.display_name || 'Explorer'),
          actions: statRow([
            { label: 'Total XP', value: `${session.xp || 0}` },
            { label: 'Level', value: `${prog.level} · ${levelTitle(prog.level)}`, plain: true },
            { label: 'To next level', value: `${Math.max(0, prog.needed - prog.into)} XP`, plain: true }
          ])
        })}

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 1.5rem;">
          <!-- Active Quest -->
          <section class="glass-panel">
            <div class="panel-banner" style="height: 130px;">
              <img src="/art/crucible.jpg" alt="The reaction chamber" loading="lazy" />
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
              <span class="eyebrow lit">Sector 01 · Erebus</span>
              <span class="tag ${isComplete ? 'live' : 'warn'}">${isComplete ? 'Complete' : cleared > 0 ? 'Underway' : 'Sealed'}</span>
            </div>

            <h2 class="section-title">The Charge Gardens</h2>
            <p class="page-sub" style="margin-bottom: 1.1rem;">Find what pulls. Draw the line.</p>

            <div style="margin-bottom: 1.25rem;">
              <div style="display: flex; justify-content: space-between; font-family: var(--font-mono); font-size: 0.72rem; color: var(--text-muted); margin-bottom: 5px;">
                <span>PROGRESS</span>
                <span>${cleared} / ${TOTAL_STAGES} STAGES</span>
              </div>
              <div style="height: 8px; background: var(--plate-100); box-shadow: inset 0 1px 3px rgba(0,0,0,0.8); overflow: hidden;">
                <div style="width: ${pct}%; height: 100%; background: var(--accent-amber); transition: width 0.4s ease;"></div>
              </div>
            </div>

            ${statRow([
              { label: 'Stages', value: TOTAL_STAGES, plain: true },
              { label: 'Quest XP', value: TOTAL_QUEST_XP },
              { label: 'Run time', value: '~30 min', plain: true }
            ])}

            <a href="#/quest" class="btn-primary" style="width: 100%; text-decoration: none; margin-top: 1.25rem;">
              ${isComplete ? 'Replay' : cleared > 0 ? `Resume · Stage ${Math.min(cleared + 1, TOTAL_STAGES)}` : 'Begin'}
            </a>
          </section>

          <!-- Team status -->
          <section class="glass-panel">
            <span class="eyebrow">Guild Conditions</span>
            <h2 class="section-title" style="margin-top: 0.4rem;">
              ${activeEv ? esc(activeEv.name) : 'All Clear'}
            </h2>
            ${activeEv && activeEv.description ? `<p class="page-sub" style="margin-bottom: 1rem;">${esc(activeEv.description)}</p>` : '<div style="margin-bottom: 1rem;"></div>'}

            ${activeEv ? `
              <div style="margin-bottom: 1.25rem;">
                <span class="tag ${activeEv.polarity === 'bad' ? 'danger' : activeEv.polarity === 'good' ? 'live' : ''}">
                  ${esc(String(activeEv.polarity || 'neutral').toUpperCase())}
                </span>
              </div>
            ` : ''}

            <div style="border-top: 1px solid var(--border-durasteel); padding-top: 1.25rem; margin-top: 1.25rem;">
              <div class="eyebrow" style="margin-bottom: 0.8rem;">Decks</div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                <a href="#/starmap" class="btn-secondary" style="font-size: 0.72rem; text-decoration: none;">Star Map</a>
                <a href="#/leaderboard" class="btn-secondary" style="font-size: 0.72rem; text-decoration: none;">Standings</a>
                <a href="#/inventory" class="btn-secondary" style="font-size: 0.72rem; text-decoration: none;">Inventory</a>
                <a href="#/quarters" class="btn-secondary" style="font-size: 0.72rem; text-decoration: none;">Crew</a>
              </div>
            </div>
          </section>
        </div>
      </div>
    `;
  }

  render();

  // One subscription per mount — this used to stack a new listener on every visit.
  unsubscribeBridge = session.subscribe(() => {
    if (!window.location.hash.includes('bridge')) {
      if (unsubscribeBridge) unsubscribeBridge();
      unsubscribeBridge = null;
      return;
    }
    render();
  });
}
