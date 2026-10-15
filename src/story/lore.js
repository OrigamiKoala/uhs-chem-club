/**
 * lore.js — the registry behind the lore notebook.
 *
 * PURE DATA & LOGIC. Importable in Node (verify:story reads it).
 *
 * The notebook stores only IDS (`session.notebook`, synced to the Sheet), and
 * this file turns an id back into the words. Nothing here is copied from the
 * story files: an entry is a lookup into `saga.js` or `quest1.js`, so
 * correcting a line of story corrects it in every player's notebook, and a
 * notebook can never show a line the game did not.
 *
 * Id grammar:
 *   campaign:<n>            the main briefing, beat n
 *   world:<worldId>:<n>     a world's arrival briefing, paragraph n
 *   world-end:<worldId>     how that world's fight ended, and what the Case File made of it
 *   clue:<clueId>           a piece of evidence
 *   spine:<beatId>          a Vess transmission aboard the Avalon
 *   erebus:contract         the Charge Gardens contract
 *   erebus:pylon:<stage>    the transmission that opens a pylon
 *   erebus:milestone:<stage>
 *   erebus:debrief:<n>      a section of the contract debrief
 */

import { ACTS, CLUES, SPINE_BEATS, CAMPAIGN_STORY, EPISODES } from './saga.js';
import { QUEST1_STORY } from './quest1.js';

export const LORE_KINDS = {
  briefing: 'Briefing',
  transmission: 'Transmission',
  evidence: 'Evidence',
  outcome: 'Outcome',
  contract: 'Contract'
};

/** Story order: the prologue, then the acts, then the Erebus contract's own log. */
const ACT_ORDER = ['prologue', ...ACTS.map(a => a.id)];

export function actTitle(actId) {
  if (actId === 'prologue') return 'Prologue: The Rim';
  return ACTS.find(a => a.id === actId)?.title || actId;
}

export function loreActs() {
  return ACT_ORDER.map(id => ({ id, title: actTitle(id) }));
}

function worldOrder(worldId) {
  if (worldId === 'erebus') return -1;
  const n = Number(String(worldId).replace('unit', ''));
  return isFinite(n) ? n : 99;
}

/** Resolve one id to a displayable entry, or null if it names nothing. */
export function getLore(id) {
  const [kind, a, b] = String(id || '').split(':');

  if (kind === 'campaign') {
    const i = Number(a);
    const beat = CAMPAIGN_STORY[i];
    if (!beat) return null;
    return {
      id, kind: 'briefing', act: 'prologue', worldId: null, sort: [0, -2, i],
      title: 'Main Briefing', speaker: beat.speaker, text: beat.text,
      source: `Main · ${i + 1} of ${CAMPAIGN_STORY.length}`
    };
  }

  if (kind === 'world') {
    const ep = EPISODES[a];
    const i = Number(b);
    const paras = ep && (ep.paragraphs?.length ? ep.paragraphs : [ep.arrival, ep.incident, ep.objective].filter(Boolean));
    if (!ep || !paras || !paras[i]) return null;
    return {
      id, kind: 'briefing', act: ep.act, worldId: a, sort: [ACT_ORDER.indexOf(ep.act), worldOrder(a), i],
      title: `${ep.worldName} · Arrival`, speaker: 'Vess', text: paras[i],
      source: `${ep.worldName} · ${i + 1} of ${paras.length}`
    };
  }

  if (kind === 'world-end') {
    const ep = EPISODES[a];
    if (!ep || !ep.closing) return null;
    return {
      id, kind: 'outcome', act: ep.act, worldId: a, sort: [ACT_ORDER.indexOf(ep.act), worldOrder(a), 50],
      title: `${ep.worldName} · Aftermath`, speaker: 'Vess', text: ep.closing, note: ep.caseFileNote || '',
      source: `${ep.worldName} · after the fight`
    };
  }

  if (kind === 'clue') {
    const c = CLUES[a];
    if (!c) return null;
    const ep = Object.values(EPISODES).find(e => e.clueId === a);
    return {
      id, kind: 'evidence', act: c.act, worldId: ep ? ep.worldId : null,
      sort: [ACT_ORDER.indexOf(c.act), ep ? worldOrder(ep.worldId) : 98, 60],
      title: c.name, speaker: '', text: c.summary, note: c.note, source: c.source
    };
  }

  if (kind === 'spine') {
    const beat = SPINE_BEATS.find(x => x.id === a);
    if (!beat) return null;
    return {
      id, kind: 'transmission', act: beat.act, worldId: null,
      sort: [ACT_ORDER.indexOf(beat.act), 97, beat.order],
      title: beat.title, speaker: beat.speaker, text: beat.transmission, note: beat.onScreen,
      source: `Transmission ${beat.order}`
    };
  }

  if (kind === 'erebus') {
    const base = [ACT_ORDER.indexOf('act1'), -1];
    if (a === 'contract') {
      const br = QUEST1_STORY.briefing;
      return {
        id, kind: 'contract', act: 'act1', worldId: 'erebus', sort: [...base, 10],
        title: QUEST1_STORY.contract.title, speaker: br.speaker, text: br.message,
        source: `${br.contractor} · ${br.subtitle}`
      };
    }
    if (a === 'pylon') {
      const stageNo = Number(b);
      const p = QUEST1_STORY.pylons[stageNo - 1];
      if (!p || !p.transmission) return null;
      return {
        id, kind: 'transmission', act: 'act1', worldId: 'erebus', sort: [...base, 20 + stageNo],
        title: `Pylon ${stageNo}`, speaker: 'Vess', text: p.transmission,
        source: `Erebus · Pylon ${stageNo}`
      };
    }
    if (a === 'milestone') {
      const m = QUEST1_STORY.milestones[b];
      if (!m) return null;
      return {
        id, kind: 'transmission', act: 'act1', worldId: 'erebus', sort: [...base, 20 + Number(b) + 0.5],
        title: `Pylon ${b} Online`, speaker: 'Ship', text: m.line, source: `Erebus · Pylon ${b}`
      };
    }
    if (a === 'debrief') {
      const sec = (QUEST1_STORY.debrief.sections || [])[Number(b)];
      if (!sec) return null;
      return {
        id, kind: 'outcome', act: 'act1', worldId: 'erebus', sort: [...base, 60 + Number(b)],
        title: sec.title, speaker: sec.speaker || 'Vess', text: sec.text, source: 'Erebus · Contract debrief'
      };
    }
  }
  return null;
}

/** Every id the game can file. verify:story walks this to prove each resolves. */
export function allLoreIds() {
  const ids = [];
  CAMPAIGN_STORY.forEach((_, i) => ids.push(`campaign:${i}`));
  for (const ep of Object.values(EPISODES)) {
    const n = ep.paragraphs?.length ? ep.paragraphs.length : [ep.arrival, ep.incident, ep.objective].filter(Boolean).length;
    for (let i = 0; i < n; i++) ids.push(`world:${ep.worldId}:${i}`);
    if (ep.closing) ids.push(`world-end:${ep.worldId}`);
  }
  Object.keys(CLUES).forEach(c => ids.push(`clue:${c}`));
  SPINE_BEATS.forEach(b => ids.push(`spine:${b.id}`));
  ids.push('erebus:contract');
  QUEST1_STORY.pylons.forEach((p, i) => { if (p.transmission) ids.push(`erebus:pylon:${i + 1}`); });
  Object.keys(QUEST1_STORY.milestones).forEach(m => ids.push(`erebus:milestone:${m}`));
  (QUEST1_STORY.debrief.sections || []).forEach((_, i) => ids.push(`erebus:debrief:${i}`));
  return ids;
}

/** Ids a world's briefing files when it opens. */
export function worldBriefingIds(worldId) {
  const ep = EPISODES[worldId];
  if (!ep) return [];
  const n = ep.paragraphs?.length ? ep.paragraphs.length : [ep.arrival, ep.incident, ep.objective].filter(Boolean).length;
  return Array.from({ length: n }, (_, i) => `world:${worldId}:${i}`);
}

export function campaignBriefingIds() {
  return CAMPAIGN_STORY.map((_, i) => `campaign:${i}`);
}

/** Entries for a list of ids, in story order. Unknown ids are dropped. */
export function loreEntries(ids) {
  return ids.map(getLore).filter(Boolean).sort((x, y) => {
    for (let k = 0; k < 3; k++) {
      const d = (x.sort[k] || 0) - (y.sort[k] || 0);
      if (d) return d;
    }
    return 0;
  });
}

/** Ids filed when a clue is recovered: the evidence, and how its world's fight ended. */
export function loreIdsForClue(clueId) {
  const ids = [`clue:${clueId}`];
  const ep = Object.values(EPISODES).find(e => e.clueId === clueId);
  if (ep && ep.closing) ids.push(`world-end:${ep.worldId}`);
  return ids;
}
