/**
 * casefile.js — Case File terminal & dossier: clues, spine beats, and acts.
 *
 * Diegetic investigation log kept by Quartermaster Vess aboard the Avalon.
 * Traces the Fifth / The Catalyst across the four acts.
 */

import { session } from '../session.js';
import { stage } from '../three/stage.js';
import { tierManager } from '../three/tier.js';
import { pageHeader, statRow, esc } from '../ui/layout.js';
import { ACTS, CLUES, SPINE_BEATS, getAct } from '../story/saga.js';

export function renderCaseFile(container) {
  if (stage.cameraRig && tierManager.currentTier !== 'T4') {
    stage.cameraRig.moveTo('comms');
  }

  const isT4 = tierManager.currentTier === 'T4';
  const saga = session.getSaga ? session.getSaga() : { beatsSeen: [], clues: [] };
  const collectedClueIds = new Set(saga.clues || []);
  const seenBeatIds = new Set(saga.beatsSeen || []);

  const allClues = Object.values(CLUES);
  const totalClues = allClues.length;
  const collectedCount = allClues.filter(c => collectedClueIds.has(c.id)).length;
  const seenBeatsCount = SPINE_BEATS.filter(b => seenBeatIds.has(b.id)).length;

  let activeTab = 'clues'; // 'clues' | 'spine' | 'acts'

  function render() {
    const headerMarkup = isT4 ? `
      <div class="terminal-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; border-bottom: 1px solid var(--border-durasteel); padding-bottom: 0.5rem;">
        <div>
          <span class="eyebrow lit" style="color: var(--accent-gold); letter-spacing: 0.15em;">CASE LOG</span>
          <h2 class="section-title" style="font-size: 1.15rem; margin-top: 2px;">CASE FILE: THE CATALYST</h2>
        </div>
        <a href="#/bridge" class="terminal-close-btn" style="text-decoration: none; padding: 4px 10px; font-family: var(--font-mono); font-size: 0.75rem; border: 1px solid var(--border-durasteel); color: var(--text-muted);">CLOSE</a>
      </div>
    ` : pageHeader({
      art: '/art/comms.jpg',
      title: 'Case File',
      eyebrow: 'Investigation Log',
      actions: statRow([
        { label: 'Clues Recovered', value: `${collectedCount} / ${totalClues}`, plain: true },
        { label: 'Spine Transcripts', value: `${seenBeatsCount} / ${SPINE_BEATS.length}`, plain: true },
        { label: 'Active Dossier', value: 'Act I', plain: true }
      ])
    });

    container.innerHTML = `
      <div class="${isT4 ? 'in-world-terminal casefile-terminal' : 'screen-container'} m-screen m-casefile" style="max-width: 960px; margin: 0 auto; padding: 1.25rem;">
        ${headerMarkup}

        <div class="casefile-tabs map-tabs" role="tablist" style="display: flex; gap: 0.5rem; margin-bottom: 1.25rem;">
          <button type="button" class="map-tab btn-secondary ${activeTab === 'clues' ? 'active' : ''}" data-case-tab="clues" style="flex: 1; padding: 8px 12px; font-family: var(--font-mono); font-size: 0.8rem; text-transform: uppercase;">
            Evidence & Clues (${collectedCount}/${totalClues})
          </button>
          <button type="button" class="map-tab btn-secondary ${activeTab === 'spine' ? 'active' : ''}" data-case-tab="spine" style="flex: 1; padding: 8px 12px; font-family: var(--font-mono); font-size: 0.8rem; text-transform: uppercase;">
            Spine Transcripts (${seenBeatsCount}/${SPINE_BEATS.length})
          </button>
          <button type="button" class="map-tab btn-secondary ${activeTab === 'acts' ? 'active' : ''}" data-case-tab="acts" style="flex: 1; padding: 8px 12px; font-family: var(--font-mono); font-size: 0.8rem; text-transform: uppercase;">
            Acts & Charter
          </button>
        </div>

        <div id="casefile-tab-content">
          ${renderTabContent()}
        </div>

        <div style="margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--border-durasteel); display: flex; justify-content: space-between; align-items: center;">
          <a href="#/bridge" class="btn-secondary quest-btn-sm" style="text-decoration: none; font-size: 0.75rem;">◀ Bridge</a>
          <a href="#/starmap" class="btn-primary quest-btn-sm" style="text-decoration: none; font-size: 0.75rem;">Star Map ▶</a>
        </div>
      </div>
    `;

    bindEvents();
  }

  function renderTabContent() {
    if (activeTab === 'clues') {
      return `
        <div class="clues-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem;">
          ${allClues.map(clue => {
            const unlocked = collectedClueIds.has(clue.id);
            const act = getAct(clue.act);
            return `
              <article class="holo-card clue-card" style="padding: 1rem; border: 1px solid ${unlocked ? 'var(--accent-gold)' : 'var(--border-durasteel)'}; background: ${unlocked ? 'var(--plate-200)' : 'var(--plate-100)'}; opacity: ${unlocked ? '1' : '0.65'}; display: flex; flex-direction: column;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                  <span class="eyebrow ${unlocked ? 'lit' : ''}" style="font-size: 0.68rem; color: ${unlocked ? 'var(--accent-gold)' : 'var(--text-muted)'};">${esc(act?.title || clue.act)}</span>
                  <span class="tag ${unlocked ? 'live' : 'locked'}" style="font-size: 0.65rem;">${unlocked ? 'EVIDENCE FILED' : 'SEALED'}</span>
                </div>

                <h3 style="font-family: var(--font-display); font-size: 1rem; color: ${unlocked ? 'var(--text-bright)' : 'var(--text-muted)'}; margin: 0 0 0.35rem; letter-spacing: 0.08em; text-transform: uppercase;">
                  ${unlocked ? esc(clue.name) : 'CLASSIFIED SPECIMEN'}
                </h3>

                <div class="clue-source" style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--accent-bronze); margin-bottom: 0.65rem;">
                  SOURCE: ${esc(clue.source)}
                </div>

                <p style="font-size: 0.82rem; line-height: 1.45; color: var(--text-secondary); margin-bottom: 0.85rem; flex: 1;">
                  ${unlocked ? esc(clue.summary) : 'Specimen sealed pending recovery in the field. Defeat the sector boss or complete the contract to log this item.'}
                </p>

                ${unlocked ? `
                  <div class="vess-marginalia" style="background: rgba(0, 0, 0, 0.35); border-left: 2px solid var(--accent-amber); padding: 0.55rem 0.75rem; font-family: var(--font-mono); font-size: 0.75rem; color: var(--accent-amber);">
                    <div style="font-size: 0.62rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-muted); margin-bottom: 2px;">Notes</div>
                    "${esc(clue.note)}"
                  </div>
                ` : `
                  <div style="text-align: center; padding: 0.5rem; font-family: var(--font-mono); font-size: 0.7rem; color: var(--text-muted); border: 1px dashed var(--border-durasteel);">
                    [AWAITING RECOVERY]
                  </div>
                `}
              </article>
            `;
          }).join('')}
        </div>
      `;
    }

    if (activeTab === 'spine') {
      return `
        <div class="spine-timeline" style="display: flex; flex-direction: column; gap: 1rem;">
          ${SPINE_BEATS.map(beat => {
            const seen = seenBeatIds.has(beat.id);
            const act = getAct(beat.act);
            return `
              <article class="holo-card spine-card" style="padding: 1.1rem; border: 1px solid ${seen ? 'var(--accent-bronze)' : 'var(--border-durasteel)'}; background: var(--plate-200); opacity: ${seen ? '1' : '0.6'};">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                  <span class="eyebrow ${seen ? 'lit' : ''}" style="font-size: 0.7rem; color: var(--accent-gold);">${esc(act?.title || beat.act)} · RECORD ${beat.order}</span>
                  <span class="tag ${seen ? 'live' : 'locked'}" style="font-size: 0.65rem;">${seen ? 'TRANSMISSION LOGGED' : 'ENCRYPTED'}</span>
                </div>

                <h3 style="font-family: var(--font-imperial); font-size: 1.1rem; letter-spacing: 0.1em; text-transform: uppercase; color: var(--text-bright); margin: 0 0 0.5rem;">
                  ${seen ? esc(beat.title) : 'ENCRYPTED COMM FREQUENCY'}
                </h3>

                ${seen ? `
                  <div style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--accent-gold); margin-bottom: 0.4rem;">
                    ${esc(beat.speaker)}
                  </div>
                  <blockquote style="margin: 0 0 0.75rem; padding: 0.65rem 0.85rem; background: rgba(0, 0, 0, 0.4); border-left: 2px solid var(--accent-gold); font-size: 0.88rem; line-height: 1.5; color: var(--text-bright);">
                    "${esc(beat.transmission)}"
                  </blockquote>
                  <div style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--text-muted); font-style: italic;">
                    Visual Feed: ${esc(beat.onScreen)}
                  </div>
                ` : `
                  <p style="font-size: 0.82rem; color: var(--text-muted); margin: 0; font-family: var(--font-mono);">
                    Frequency locked. Prerequisites: ${formatPrereq(beat.prereq)}.
                  </p>
                `}
              </article>
            `;
          }).join('')}
        </div>
      `;
    }

    if (activeTab === 'acts') {
      return `
        <div class="acts-list" style="display: flex; flex-direction: column; gap: 1rem;">
          ${ACTS.map(act => `
            <article class="holo-card act-card" style="padding: 1.1rem; border: 1px solid var(--border-durasteel); background: var(--plate-200);">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
                <span class="eyebrow lit" style="color: var(--accent-gold);">ACT 0${act.order}</span>
                <span class="tag live">${act.worlds.length} WORLDS</span>
              </div>
              <h3 style="font-family: var(--font-imperial); font-size: 1.15rem; letter-spacing: 0.12em; text-transform: uppercase; color: var(--text-bright); margin: 0 0 0.5rem;">
                ${esc(act.title)}
              </h3>
              <p style="font-size: 0.86rem; line-height: 1.5; color: var(--text-secondary); margin-bottom: 0.75rem;">
                ${esc(act.summary)}
              </p>
              <div style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--text-muted);">
                Sectors: ${act.worlds.join(' · ')}
              </div>
            </article>
          `).join('')}
        </div>
      `;
    }
    return '';
  }

  function formatPrereq(prereq = {}) {
    const parts = [];
    if (prereq.bosses?.length) parts.push(`Bosses: ${prereq.bosses.join(', ')}`);
    if (prereq.contracts?.length) parts.push(`Contracts: ${prereq.contracts.join(', ')}`);
    if (prereq.clues?.length) parts.push(`Clues: ${prereq.clues.join(', ')}`);
    return parts.join(' | ') || 'None';
  }

  function bindEvents() {
    container.querySelectorAll('[data-case-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        activeTab = btn.dataset.caseTab;
        render();
      });
    });
  }

  render();
}
