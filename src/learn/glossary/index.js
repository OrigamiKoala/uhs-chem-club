/** Glossaries by world: `glossaryFor(questId)` gives the terms the bench's Glossary key lists, or null when the world has none yet. */
import { TERMS as VERDIGRIS, QUESTS as VERDIGRIS_QUESTS, NEEDS as VERDIGRIS_NEEDS } from './verdigris.js';
import { TERMS as TEETER, QUESTS as TEETER_QUESTS, NEEDS as TEETER_NEEDS } from './teeter.js';
import { TERMS as EMBER, QUESTS as EMBER_QUESTS, NEEDS as EMBER_NEEDS } from './ember.js';
import { TERMS as BRINEWIRE, QUESTS as BRINEWIRE_QUESTS, NEEDS as BRINEWIRE_NEEDS } from './brinewire.js';
import { TERMS as LIGAR, QUESTS as LIGAR_QUESTS, NEEDS as LIGAR_NEEDS } from './ligar.js';
import { TERMS as MIRROWEN, QUESTS as MIRROWEN_QUESTS, NEEDS as MIRROWEN_NEEDS } from './mirrowen.js';
import { TERMS as BELLOWS, QUESTS as BELLOWS_QUESTS, NEEDS as BELLOWS_NEEDS } from './bellows.js';
import { TERMS as KETTLE, QUESTS as KETTLE_QUESTS, NEEDS as KETTLE_NEEDS } from './kettle.js';
import { TERMS as TALLOW, QUESTS as TALLOW_QUESTS, NEEDS as TALLOW_NEEDS } from './tallow.js';
import { TERMS as LANTERNFALL, QUESTS as LANTERNFALL_QUESTS, NEEDS as LANTERNFALL_NEEDS } from './lanternfall.js';

const WORLDS = [{ quests: TALLOW_QUESTS, terms: TALLOW, name: 'Tallow', needs: TALLOW_NEEDS }, { quests: TEETER_QUESTS, terms: TEETER, name: 'Teeter', needs: TEETER_NEEDS }, { quests: VERDIGRIS_QUESTS, terms: VERDIGRIS, name: 'Verdigris', needs: VERDIGRIS_NEEDS }, { quests: BRINEWIRE_QUESTS, terms: BRINEWIRE, name: 'Brinewire', needs: BRINEWIRE_NEEDS }, { quests: EMBER_QUESTS, terms: EMBER, name: 'Ember Reach', needs: EMBER_NEEDS }, { quests: MIRROWEN_QUESTS, terms: MIRROWEN, name: 'Mirrowen', needs: MIRROWEN_NEEDS }, { quests: LIGAR_QUESTS, terms: LIGAR, name: 'Ligar', needs: LIGAR_NEEDS }, { quests: BELLOWS_QUESTS, terms: BELLOWS, name: 'Bellows', needs: BELLOWS_NEEDS }, { quests: KETTLE_QUESTS, terms: KETTLE, name: 'Kettle', needs: KETTLE_NEEDS }, { quests: LANTERNFALL_QUESTS, terms: LANTERNFALL, name: 'Lanternfall', needs: LANTERNFALL_NEEDS }];

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
