/**
 * casefile.js — Briefing, the one case board: every clue, message, briefing, and bench
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

  // Prologue lines the player has seen
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
    <div class="terminal-header case-terminal-head">
      <div class="case-terminal-title">
        <h2 class="section-title">Briefing</h2>
        <span class="case-terminal-count">${collectedCount} / ${totalClues} clues</span>
      </div>
      <div class="case-terminal-keys">
        <button type="button" id="caseboard-briefing-btn" class="btn-secondary quest-btn-sm m-tap">Prologue</button>
        <a href="#/bridge" class="terminal-close-btn">Close</a>
      </div>
    </div>
  ` : pageHeader({
    art: '/art/comms.jpg',
    title: 'Briefing',
    actions: `
      ${statRow([
        { label: 'Clues', value: `${collectedCount} / ${totalClues}`, plain: true },
        { label: 'Bench Notes', value: `${totalPinsEarned}`, plain: true }
      ])}
      <button type="button" id="caseboard-briefing-btn" class="btn-secondary quest-btn-sm m-tap">Prologue</button>
    `
  });

  const prologueMarkup = prologueEntries.length ? `
    <section class="holo-card case-prologue">
      <h3 class="case-section-label">Prologue · Vess</h3>
      ${prologueEntries.map(e => `<p class="case-prologue-line">${esc(e.text)}</p>`).join('')}
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
      <section class="holo-card case-act${solved ? ' is-solved' : ''}">
        <div class="case-act-head">
          <span class="case-act-worlds">Act ${act.order} · ${esc(worldList)}</span>
          <span class="tag ${solved ? 'live' : ''}">${solved ? 'Answered' : `${foundClues.length} / ${actClues.length} clues`}</span>
        </div>

        <h3 class="case-act-question">${esc(act.question)}</h3>

        <div class="case-clues">
          ${actClues.map(clue => {
            const unlocked = collectedClueIds.has(clue.id);
            return `
              <article class="case-clue${unlocked ? ' is-found' : ''}">
                <div class="case-clue-source">${esc(clue.source)}</div>
                <div class="case-clue-name">${unlocked ? esc(clue.name) : 'Not found yet'}</div>
                ${unlocked ? `
                  <p class="case-clue-summary">${esc(clue.summary)}</p>
                  <p class="case-clue-note">${esc(clue.note)}</p>
                ` : ''}
              </article>
            `;
          }).join('')}
        </div>

        ${actMessages.length ? `
          <div class="case-block">
            <h4 class="case-section-label">Messages</h4>
            ${actMessages.map(beat => `
              <div class="case-message">
                <div class="case-message-from">${esc(beat.speaker)} · ${esc(beat.title)}</div>
                <p class="case-message-text">"${esc(beat.transmission)}"</p>
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${actPins.length ? `
          <div class="case-block">
            <h4 class="case-section-label">Bench Notes (${actPins.length})</h4>
            ${actPins.map(p => `
              <div class="case-pin">
                ${p.ask ? `<div class="case-pin-ask">${esc(p.ask)}</div>` : ''}
                <span class="case-pin-world">${esc(p.world)}:</span> ${esc(p.pin)}
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${actSeenNotes.length ? `
          <details class="case-block case-log">
            <summary class="case-section-label">Field Log (${actSeenNotes.length})</summary>
            ${actSeenNotes.map(e => `
              <div class="case-log-entry">
                <div class="case-log-title">${esc(e.title)} · ${esc(e.source)}</div>
                <p class="case-log-text">${esc(e.text)}</p>
              </div>
            `).join('')}
          </details>
        ` : ''}

        <p class="case-answer${solved ? ' is-solved' : ''}">
          ${solved ? esc(act.answer) : 'Find every clue in this act to answer it.'}
        </p>
      </section>
    `;
  }).join('');

  container.innerHTML = `
    <div class="${isT4 ? 'in-world-terminal casefile-terminal' : 'screen-container case-screen'} m-screen m-casefile">
      ${headerMarkup}
      ${prologueMarkup}
      <div class="case-board">
        ${actsMarkup}
      </div>
      <div class="case-foot">
        <a href="#/bridge" class="btn-secondary quest-btn-sm m-tap">Bridge</a>
        <a href="#/starmap" class="btn-primary quest-btn-sm m-tap">Star Map</a>
      </div>
    </div>
  `;

  container.querySelector('#caseboard-briefing-btn')?.addEventListener('click', () => {
    openCampaignStoryModal();
  });

  session.setFlag('notebook_viewed', foundLoreIds.length);
}
