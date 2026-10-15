/**
 * casefile.js — Case File & lore notebook: everything the player has been told.
 *
 * Diegetic investigation log kept by Quartermaster Vess aboard the Avalon.
 * Traces the Fifth / The Catalyst across the four acts.
 *
 * The NOTEBOOK tab is the whole storyline in one place. Nothing is added by
 * hand: briefings, transmissions and evidence are filed in `session.notebook`
 * by the screens that show them (see `story/lore.js` for the id grammar), the
 * list is synced to the Sheet, and this screen only reads it.
 */

import { session } from '../session.js';
import { stage } from '../three/stage.js';
import { tierManager } from '../three/tier.js';
import { pageHeader, statRow, esc } from '../ui/layout.js';
import { ACTS, CLUES, SPINE_BEATS, getAct, isBeatUnlocked } from '../story/saga.js';
import { LORE_KINDS, loreActs, loreEntries, allLoreIds } from '../story/lore.js';

/**
 * The Case File is where the spine's transmissions are delivered: opening it
 * files every one whose prerequisites the player has met. (Nothing else in the
 * game shows them, so without this the Transmissions tab could never open.)
 */
function fileUnlockedTransmissions(saga) {
  const bosses = Object.entries(session.learn || {})
    .filter(([k, v]) => k !== 'saga' && v && v.completedAt)
    .map(([k]) => k);
  const contracts = (session.progress || []).some(p => p.quest_id === 'q1' && p.completed_at)
    ? ['contract_erebus_01'] : [];
  const state = { bosses, contracts, clues: saga.clues || [] };
  for (const beat of SPINE_BEATS) {
    if (isBeatUnlocked(beat, state)) session.recordSagaBeat(beat.id);
  }
}

export function renderCaseFile(container) {
  if (stage.cameraRig && tierManager.currentTier !== 'T4') {
    stage.cameraRig.moveTo('comms');
  }

  const isT4 = tierManager.currentTier === 'T4';
  const saga = session.getSaga ? session.getSaga() : { beatsSeen: [], clues: [] };
  fileUnlockedTransmissions(saga);
  // How much of the notebook had been read before this visit: anything past it is NEW.
  const viewedAtOpen = Number(session.getFlag('notebook_viewed')) || 0;
  const collectedClueIds = new Set(saga.clues || []);
  const seenBeatIds = new Set(saga.beatsSeen || []);

  const allClues = Object.values(CLUES);
  const totalClues = allClues.length;
  const collectedCount = allClues.filter(c => collectedClueIds.has(c.id)).length;
  const seenBeatsCount = SPINE_BEATS.filter(b => seenBeatIds.has(b.id)).length;

  const totalLore = allLoreIds().length;
  let activeTab = 'notebook'; // 'notebook' | 'clues' | 'spine' | 'acts'
  let noteAct = 'all';
  let noteKind = 'all';
  let noteSort = 'story'; // 'story' | 'found'

  function render() {
    const headerMarkup = isT4 ? `
      <div class="terminal-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; border-bottom: 1px solid var(--border-durasteel); padding-bottom: 0.5rem;">
        <div>
          <span class="eyebrow lit" style="color: var(--accent-gold); letter-spacing: 0.15em;">CASE LOG</span>
          <h2 class="section-title" style="font-size: 1.15rem; margin-top: 2px;">CASE FILE &amp; NOTEBOOK</h2>
        </div>
        <a href="#/bridge" class="terminal-close-btn" style="text-decoration: none; padding: 4px 10px; font-family: var(--font-mono); font-size: 0.75rem; border: 1px solid var(--border-durasteel); color: var(--text-muted);">CLOSE</a>
      </div>
    ` : pageHeader({
      art: '/art/comms.jpg',
      title: 'Case File & Notebook',
      eyebrow: 'Investigation Log',
      actions: statRow([
        { label: 'Notebook', value: `${session.getNotebook().length} / ${totalLore}`, plain: true },
        { label: 'Clues Recovered', value: `${collectedCount} / ${totalClues}`, plain: true },
        { label: 'Spine Transcripts', value: `${seenBeatsCount} / ${SPINE_BEATS.length}`, plain: true },
        { label: 'Active Dossier', value: 'Act I', plain: true }
      ])
    });

    container.innerHTML = `
      <div class="${isT4 ? 'in-world-terminal casefile-terminal' : 'screen-container'} m-screen m-casefile" style="max-width: 960px; margin: 0 auto; padding: 1.25rem;">
        ${headerMarkup}

        <div class="casefile-tabs map-tabs" role="tablist" style="display: flex; gap: 0.5rem; margin-bottom: 1.25rem;">
          <button type="button" class="map-tab btn-secondary ${activeTab === 'notebook' ? 'active' : ''}" data-case-tab="notebook" style="flex: 1; padding: 8px 12px; font-family: var(--font-mono); font-size: 0.8rem; text-transform: uppercase;">
            Notebook (${session.getNotebook().length})
          </button>
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

  function chip(group, value, label, current) {
    return `<button type="button" class="map-tab btn-secondary quest-btn-sm m-tap ${current === value ? 'active' : ''}" data-note-${group}="${esc(value)}" aria-pressed="${current === value}" style="font-family: var(--font-mono); font-size: 0.7rem; padding: 4px 9px;">${esc(label)}</button>`;
  }

  function renderNotebook() {
    const found = session.getNotebook();
    if (!found.length) {
      return `
        <div class="holo-card" style="padding: 1.25rem; text-align: center; color: var(--text-muted); font-family: var(--font-mono); font-size: 0.82rem;">
          Nothing filed yet. Briefings, transmissions and evidence are written here as you meet them.
        </div>
      `;
    }
    let entries = loreEntries(found);
    if (noteSort === 'found') {
      entries = found.map(id => entries.find(e => e.id === id)).filter(Boolean);
    }
    const shown = entries.filter(e =>
      (noteAct === 'all' || e.act === noteAct) && (noteKind === 'all' || e.kind === noteKind)
    );
    const acts = loreActs().filter(a => entries.some(e => e.act === a.id));
    const kinds = Object.keys(LORE_KINDS).filter(k => entries.some(e => e.kind === k));
    const newCount = found.filter((id, i) => i >= viewedAtOpen).length;

    let lastGroup = null;
    const cards = shown.map(e => {
      const isNew = found.indexOf(e.id) >= viewedAtOpen;
      const group = noteSort === 'story' ? e.act : null;
      const heading = group && group !== lastGroup
        ? `<h3 class="eyebrow lit" style="color: var(--accent-gold); letter-spacing: 0.14em; margin: 1.1rem 0 0.4rem; font-size: 0.72rem;">${esc(actTitleOf(group))}</h3>`
        : '';
      lastGroup = group;
      return `${heading}
        <article class="holo-card notebook-entry" data-lore-id="${esc(e.id)}" style="padding: 0.9rem 1rem; border: 1px solid ${isNew ? 'var(--accent-gold)' : 'var(--border-durasteel)'}; background: var(--plate-200); margin-bottom: 0.6rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; margin-bottom: 0.35rem;">
            <span class="eyebrow" style="font-size: 0.66rem; color: var(--accent-bronze);">${esc(LORE_KINDS[e.kind] || e.kind)} · ${esc(e.source)}</span>
            ${isNew ? '<span class="tag live" style="font-size: 0.62rem;">NEW</span>' : ''}
          </div>
          <h4 style="font-family: var(--font-display); font-size: 0.95rem; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-bright); margin: 0 0 0.35rem;">${esc(e.title)}</h4>
          ${e.speaker ? `<div style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--accent-gold); margin-bottom: 0.25rem;">${esc(e.speaker)}</div>` : ''}
          <p style="font-size: 0.86rem; line-height: 1.55; color: var(--text-primary); margin: 0;">${esc(e.text)}</p>
          ${e.note ? `<div style="margin-top: 0.55rem; padding: 0.45rem 0.7rem; border-left: 2px solid var(--accent-amber); background: rgba(0,0,0,0.3); font-family: var(--font-mono); font-size: 0.74rem; color: var(--accent-amber);">${esc(e.note)}</div>` : ''}
        </article>`;
    }).join('');

    return `
      <div class="notebook-controls" style="display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 0.5rem;">
        <div style="display: flex; flex-wrap: wrap; gap: 0.35rem; align-items: center;">
          ${chip('act', 'all', 'All Acts', noteAct)}
          ${acts.map(a => chip('act', a.id, a.id === 'prologue' ? 'Prologue' : a.title.split(':')[0], noteAct)).join('')}
        </div>
        <div style="display: flex; flex-wrap: wrap; gap: 0.35rem; align-items: center; justify-content: space-between;">
          <div style="display: flex; flex-wrap: wrap; gap: 0.35rem;">
            ${chip('kind', 'all', 'Everything', noteKind)}
            ${kinds.map(k => chip('kind', k, LORE_KINDS[k], noteKind)).join('')}
          </div>
          <div style="display: flex; gap: 0.35rem; align-items: center;">
            ${chip('sort', 'story', 'Story order', noteSort)}
            ${chip('sort', 'found', 'Order found', noteSort)}
          </div>
        </div>
        <div style="font-family: var(--font-mono); font-size: 0.7rem; color: var(--text-muted);">
          ${found.length} of ${totalLore} entries filed${newCount ? ` · ${newCount} new` : ''}
        </div>
      </div>
      <div class="notebook-list">${cards || '<p style="color: var(--text-muted); font-family: var(--font-mono); font-size: 0.8rem;">No entries match.</p>'}</div>
    `;
  }

  function actTitleOf(id) {
    return (loreActs().find(a => a.id === id) || {}).title || id;
  }

  function renderTabContent() {
    if (activeTab === 'notebook') return renderNotebook();
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
    const rebind = (attr, set) => container.querySelectorAll(`[data-note-${attr}]`).forEach(btn => {
      btn.addEventListener('click', () => { set(btn.dataset[`note${attr[0].toUpperCase()}${attr.slice(1)}`]); render(); });
    });
    rebind('act', v => { noteAct = v; });
    rebind('kind', v => { noteKind = v; });
    rebind('sort', v => { noteSort = v; });
  }

  render();
  // Everything filed so far counts as read once the notebook has been shown.
  session.setFlag('notebook_viewed', session.getNotebook().length);
}
