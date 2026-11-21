/**
 * casefile.js — The ONE Case Board: every clue, message, briefing, and bench
 * note the player has seen, organized around the 4 Fifth Guild Act questions.
 *
 * No separate Case Board / Notebook / Messages tabs: everything lives in one
 * chronological, act-by-act investigation view.
 */

import { session } from '../session.js';
import { stage } from '../three/stage.js';
import { tierManager } from '../three/tier.js';
import { pageHeader, statRow, esc } from '../ui/layout.js';
import { ACTS, CLUES, SPINE_BEATS, isBeatUnlocked } from '../story/saga.js';
import { QUEST_STORY } from '../story/quest-story.js';
import { loreEntries } from '../story/lore.js';
import { openCampaignStoryModal } from '../story/story-modal.js';
import { WORLDS } from '../learn/curriculum.js';

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

  const collectedClueIds = new Set(saga.clues || []);
  const seenBeatIds = new Set(saga.beatsSeen || []);
  const learnMap = session.learn || {};
  const foundLoreIds = session.getNotebook();
  const foundLore = loreEntries(foundLoreIds);

  const allClues = Object.values(CLUES);
  const totalClues = allClues.length;
  const collectedCount = allClues.filter(c => collectedClueIds.has(c.id)).length;
  const worldNames = new Map(WORLDS.map(w => [w.id, w.world]));

  // Prologue / Main Briefing lines the player has seen
  const prologueEntries = foundLore.filter(e => e.act === 'prologue');

  // Quest Case Pins earned from completed Learn quests, grouped by Act
  const earnedPinsByAct = new Map(ACTS.map(a => [a.id, []]));
  let totalPinsEarned = 0;
  for (const act of ACTS) {
    const list = earnedPinsByAct.get(act.id);
    for (const wid of act.worlds) {
      const w = WORLDS.find(x => x.id === wid);
      if (!w) continue;
      for (const q of w.quests) {
        if (q.id.startsWith('boss-')) continue;
        const key = `${wid}/${q.id}`;
        const st = QUEST_STORY[key];
        if (!st || !st.pin) continue;
        if (learnMap[key]?.completedAt) {
          list.push({ key, world: w.world, title: q.title, pin: st.pin, ask: st.mystery || '' });
          totalPinsEarned++;
        }
      }
    }
  }

  // World briefings, Erebus transmissions, and aftermath notes the player has seen, grouped by Act
  // (Exclude 'evidence' and 'transmission' spine beats since those render directly in their dedicated slots above.)
  const seenNotesByAct = new Map(ACTS.map(a => [a.id, []]));
  for (const entry of foundLore) {
    if (entry.act === 'prologue') continue;
    if (entry.kind === 'evidence' || entry.id.startsWith('spine:')) continue;
    const list = seenNotesByAct.get(entry.act);
    if (list) list.push(entry);
  }

  const headerMarkup = isT4 ? `
    <div class="terminal-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; border-bottom: 1px solid var(--border-durasteel); padding-bottom: 0.5rem;">
      <div>
        <span class="eyebrow lit" style="color: var(--accent-gold); letter-spacing: 0.15em;">FIFTH GUILD MYSTERY</span>
        <h2 class="section-title" style="font-size: 1.15rem; margin-top: 2px;">CASE BOARD</h2>
      </div>
      <div style="display: flex; gap: 0.5rem; align-items: center;">
        <button type="button" id="caseboard-briefing-btn" class="btn-secondary quest-btn-sm" style="font-size: 0.72rem;">Main Briefing</button>
        <a href="#/bridge" class="terminal-close-btn" style="text-decoration: none; padding: 4px 10px; font-family: var(--font-mono); font-size: 0.75rem; border: 1px solid var(--border-durasteel); color: var(--text-muted);">CLOSE</a>
      </div>
    </div>
  ` : pageHeader({
    art: '/art/comms.jpg',
    title: 'Case Board',
    eyebrow: 'The Fifth Guild Mystery',
    actions: `
      <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
        ${statRow([
          { label: 'Clues', value: `${collectedCount} / ${totalClues}`, plain: true },
          { label: 'Bench Notes', value: `${totalPinsEarned}`, plain: true }
        ])}
        <button type="button" id="caseboard-briefing-btn" class="btn-secondary quest-btn-sm" style="font-size: 0.72rem;">Main Briefing</button>
      </div>
    `
  });

  const prologueMarkup = prologueEntries.length ? `
    <section class="holo-card" style="padding: 0.95rem 1.1rem; border: 1px solid var(--border-durasteel); background: var(--plate-200); margin-bottom: 1.1rem;">
      <div class="eyebrow lit" style="font-size: 0.68rem; color: var(--accent-gold); letter-spacing: 0.12em; margin-bottom: 0.45rem;">
        THE CASE · VESS BRIEFING
      </div>
      <div style="display: flex; flex-direction: column; gap: 0.45rem;">
        ${prologueEntries.map(e => `
          <p style="font-size: 0.84rem; line-height: 1.5; color: var(--text-primary); margin: 0;">${esc(e.text)}</p>
        `).join('')}
      </div>
    </section>
  ` : '';

  const actsMarkup = ACTS.map(act => {
    const actClues = allClues.filter(c => c.act === act.id);
    const foundClues = actClues.filter(c => collectedClueIds.has(c.id));
    const actPins = earnedPinsByAct.get(act.id) || [];
    const actMessages = SPINE_BEATS.filter(b => b.act === act.id && seenBeatIds.has(b.id));
    const actSeenNotes = seenNotesByAct.get(act.id) || [];
    const actWorldClues = actClues.filter(c => c.id !== 'clue_erebus_mark');
    const solved = actWorldClues.length > 0 && actWorldClues.every(c => collectedClueIds.has(c.id));
    const worldList = act.worlds.map(id => worldNames.get(id) || id).join(' · ');

    return `
      <section class="holo-card case-act-panel" style="padding: 1.1rem 1.15rem; border: 1px solid ${solved ? 'var(--accent-gold)' : 'var(--border-durasteel)'}; background: var(--plate-200);">
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; margin-bottom: 0.35rem;">
          <span class="eyebrow ${solved ? 'lit' : ''}" style="font-size: 0.68rem; color: var(--accent-gold); letter-spacing: 0.12em;">
            ACT 0${act.order} · ${esc(worldList)}
          </span>
          <span class="tag ${solved ? 'live' : ''}" style="font-size: 0.64rem;">
            ${solved ? 'ANSWERED' : `${foundClues.length} / ${actClues.length} CLUES`}
          </span>
        </div>

        <h3 style="font-family: var(--font-display); font-size: 1.05rem; letter-spacing: 0.04em; color: var(--text-bright); margin: 0 0 0.75rem;">
          ${esc(act.question)}
        </h3>

        <div class="case-clue-strip" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 0.6rem; margin-bottom: 0.8rem;">
          ${actClues.map(clue => {
            const unlocked = collectedClueIds.has(clue.id);
            return `
              <article style="padding: 0.65rem 0.75rem; border: 1px solid ${unlocked ? 'var(--accent-bronze)' : 'var(--border-durasteel)'}; background: ${unlocked ? 'var(--plate-100)' : 'rgba(0,0,0,0.22)'}; opacity: ${unlocked ? '1' : '0.6'};">
                <div style="font-family: var(--font-mono); font-size: 0.64rem; color: ${unlocked ? 'var(--accent-gold)' : 'var(--text-muted)'}; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 0.2rem;">
                  ${esc(clue.source)}
                </div>
                <div style="font-family: var(--font-display); font-size: 0.86rem; color: ${unlocked ? 'var(--text-bright)' : 'var(--text-muted)'}; margin-bottom: 0.25rem;">
                  ${unlocked ? esc(clue.name) : 'Not found yet'}
                </div>
                ${unlocked ? `
                  <div style="font-size: 0.78rem; line-height: 1.4; color: var(--text-secondary); margin-bottom: 0.35rem;">
                    ${esc(clue.summary)}
                  </div>
                  <div style="font-family: var(--font-mono); font-size: 0.71rem; color: var(--accent-amber); border-left: 2px solid var(--accent-amber); padding-left: 0.45rem;">
                    ${esc(clue.note)}
                  </div>
                ` : ''}
              </article>
            `;
          }).join('')}
        </div>

        ${actMessages.length ? `
          <div style="margin-bottom: 0.8rem; padding-top: 0.6rem; border-top: 1px solid var(--border-durasteel); display: flex; flex-direction: column; gap: 0.5rem;">
            <div style="font-family: var(--font-mono); font-size: 0.64rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-muted);">
              Messages
            </div>
            ${actMessages.map(beat => `
              <div style="padding: 0.6rem 0.75rem; background: var(--plate-100); border-left: 2px solid var(--accent-gold);">
                <div style="font-family: var(--font-mono); font-size: 0.68rem; color: var(--accent-gold); margin-bottom: 0.2rem;">
                  ${esc(beat.speaker)} · ${esc(beat.title)}
                </div>
                <div style="font-size: 0.83rem; line-height: 1.45; color: var(--text-bright);">
                  "${esc(beat.transmission)}"
                </div>
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${actPins.length ? `
          <div style="margin-bottom: 0.8rem; padding-top: 0.6rem; border-top: 1px solid var(--border-durasteel);">
            <div style="font-family: var(--font-mono); font-size: 0.64rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-muted); margin-bottom: 0.4rem;">
              Bench Notes (${actPins.length})
            </div>
            <div style="display: flex; flex-direction: column; gap: 0.3rem;">
              ${actPins.map(p => `
                <div style="font-family: var(--font-mono); font-size: 0.74rem; color: var(--text-primary); padding: 0.3rem 0.55rem; background: var(--plate-100); border-left: 2px solid var(--accent-bronze);">
                  ${p.ask ? `<div style="color: var(--text-muted); margin-bottom: 0.15rem;">${esc(p.ask)}</div>` : ''}
                  <span style="color: var(--accent-gold);">${esc(p.world)}:</span> ${esc(p.pin)}
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        ${actSeenNotes.length ? `
          <details style="margin-bottom: 0.8rem; padding-top: 0.55rem; border-top: 1px solid var(--border-durasteel);">
            <summary style="font-family: var(--font-mono); font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); cursor: pointer;">
              Briefings &amp; Field Log (${actSeenNotes.length})
            </summary>
            <div style="display: flex; flex-direction: column; gap: 0.4rem; margin-top: 0.5rem;">
              ${actSeenNotes.map(e => `
                <div style="padding: 0.45rem 0.65rem; background: var(--plate-100); border: 1px solid var(--border-durasteel);">
                  <div style="font-family: var(--font-mono); font-size: 0.64rem; color: var(--accent-bronze); margin-bottom: 0.15rem;">
                    ${esc(e.title)} · ${esc(e.source)}
                  </div>
                  <div style="font-size: 0.8rem; line-height: 1.45; color: var(--text-primary);">${esc(e.text)}</div>
                </div>
              `).join('')}
            </div>
          </details>
        ` : ''}

        <div style="padding: 0.55rem 0.75rem; border-left: 2px solid ${solved ? 'var(--accent-gold)' : 'var(--border-durasteel)'}; background: rgba(0, 0, 0, 0.3); font-family: var(--font-mono); font-size: 0.76rem; color: ${solved ? 'var(--accent-amber)' : 'var(--text-muted)'};">
          ${solved
            ? esc(act.answer)
            : 'Open question — recover the world clues in this act to stamp the answer.'}
        </div>
      </section>
    `;
  }).join('');

  container.innerHTML = `
    <div class="${isT4 ? 'in-world-terminal casefile-terminal' : 'screen-container'} m-screen m-casefile" style="max-width: 960px; margin: 0 auto; padding: 1.25rem;">
      ${headerMarkup}
      ${prologueMarkup}
      <div class="case-board" style="display: flex; flex-direction: column; gap: 1.1rem;">
        ${actsMarkup}
      </div>
      <div style="margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--border-durasteel); display: flex; justify-content: space-between; align-items: center;">
        <a href="#/bridge" class="btn-secondary quest-btn-sm" style="text-decoration: none; font-size: 0.75rem;">◀ Bridge</a>
        <a href="#/starmap" class="btn-primary quest-btn-sm" style="text-decoration: none; font-size: 0.75rem;">Star Map ▶</a>
      </div>
    </div>
  `;

  container.querySelector('#caseboard-briefing-btn')?.addEventListener('click', () => {
    openCampaignStoryModal();
  });

  session.setFlag('notebook_viewed', foundLoreIds.length);
}
