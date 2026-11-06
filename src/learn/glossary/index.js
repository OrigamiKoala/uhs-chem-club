/** Glossaries by world: `glossaryFor(questId)` gives the terms the bench's Glossary key lists, or null when the world has none yet. */
import { TERMS as VERDIGRIS, QUESTS as VERDIGRIS_QUESTS, NEEDS as VERDIGRIS_NEEDS } from './verdigris.js';
import { TERMS as TEETER, QUESTS as TEETER_QUESTS, NEEDS as TEETER_NEEDS } from './teeter.js';
import { TERMS as BRINEWIRE, QUESTS as BRINEWIRE_QUESTS, NEEDS as BRINEWIRE_NEEDS } from './brinewire.js';

const WORLDS = [{ quests: TEETER_QUESTS, terms: TEETER, name: 'Teeter', needs: TEETER_NEEDS }, { quests: VERDIGRIS_QUESTS, terms: VERDIGRIS, name: 'Verdigris', needs: VERDIGRIS_NEEDS }, { quests: BRINEWIRE_QUESTS, terms: BRINEWIRE, name: 'Brinewire', needs: BRINEWIRE_NEEDS }];

export function glossaryFor(questId) {
  const id = String(questId || '').split('/').pop();
  const w = WORLDS.find(x => x.quests.includes(id));
  if (!w) return null;
  const upto = w.quests.indexOf(id);
  // The terms of this quest and the quests before it: a word first used later is not shown early.
  return { name: w.name, terms: w.terms.filter(t => w.quests.indexOf(t.quest) <= upto) };
}

/** The primers a stage offers (ids from `engine/primers.js`); `stageNo` is 1-based. */
export function needsFor(questId, stageNo) {
  const id = String(questId || '').split('/').pop();
  const w = WORLDS.find(x => x.quests.includes(id));
  return (w?.needs?.[`${id}:${stageNo}`]) || [];
}
