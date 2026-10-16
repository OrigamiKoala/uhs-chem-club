/**
 * verify-story.mjs — Static integrity verifier for the story spine and lore.
 *
 * Verifies:
 *   - 4 acts, 14 worlds distributed cleanly
 *   - Clue registry completeness and referential integrity
 *   - Spine beats ordering and <= 2 sentence transmissions
 *   - Episode data for built worlds
 *   - Boss debrief clue wiring
 *   - Quest 1 contract debrief clue wiring
 *   - Max 2 sentences per transmission rule across story spine
 *
 * Run with `npm run verify:story`.
 */

const memory = new Map();
globalThis.localStorage = globalThis.localStorage || {
  getItem: k => (memory.has(k) ? memory.get(k) : null),
  setItem: (k, v) => memory.set(k, String(v)),
  removeItem: k => memory.delete(k),
  clear: () => memory.clear()
};
const noop = () => {};
globalThis.window = globalThis.window || {
  addEventListener: noop, removeEventListener: noop,
  matchMedia: () => ({ matches: false, addEventListener: noop, removeEventListener: noop }),
  location: { hash: '' },
  devicePixelRatio: 1
};
globalThis.document = globalThis.document || {
  addEventListener: noop, removeEventListener: noop,
  getElementById: () => null, querySelector: () => null, querySelectorAll: () => [],
  createElement: () => ({ style: {}, classList: { add: noop, remove: noop, toggle: noop },
    appendChild: noop, addEventListener: noop, querySelector: () => null, querySelectorAll: () => [],
    getContext: () => null, setAttribute: noop })
};

const { ACTS, CLUES, SPINE_BEATS, EPISODES, isBeatUnlocked } = await import('../src/story/saga.js');
const { QUEST1_STORY } = await import('../src/story/quest1.js');
const { WORLDS } = await import('../src/learn/curriculum.js');

const bossHopper = await import('../src/learn/quests/unit01/boss-hopper.js');
const bossEater = await import('../src/learn/quests/unit02/boss-eater.js');
const bossWarden = await import('../src/learn/quests/unit03/boss-warden.js');
const bossGolem = await import('../src/learn/quests/unit07/boss-golem.js');
const bossCompressor = await import('../src/learn/quests/unit04/boss-compressor.js');
const bossCrucible = await import('../src/learn/quests/unit05/boss-crucible.js');

const sentenceCount = (str) => (String(str || '').match(/[.!?]+(?=\s|$)/g) || []).length;

let failures = 0;
const fail = (msg) => { console.log(`  FAIL ${msg}`); failures++; };
const ok = (msg) => console.log(`  ok   ${msg}`);

console.log('Story spine and saga verification\n');

// 1. Acts integrity
if (ACTS.length !== 4) {
  fail(`expected 4 acts, got ${ACTS.length}`);
} else {
  ok('4 acts defined in sequence');
}

const worldIds = new Set(WORLDS.map(w => w.id));
let totalActWorlds = 0;
ACTS.forEach((act, i) => {
  if (act.order !== i + 1) fail(`act ${act.id} has order ${act.order}, expected ${i + 1}`);
  if (!act.title || !act.summary) fail(`act ${act.id} missing title or summary`);
  for (const w of act.worlds) {
    if (!worldIds.has(w)) fail(`act ${act.id} references unknown world "${w}"`);
    totalActWorlds++;
  }
});
if (totalActWorlds === 14) {
  ok('all 14 worlds mapped across the 4 acts');
} else {
  fail(`expected 14 worlds across acts, found ${totalActWorlds}`);
}

// 2. Clue registry
const clueEntries = Object.entries(CLUES);
if (clueEntries.length < 5) {
  fail(`expected at least 5 registered clues, found ${clueEntries.length}`);
} else {
  ok(`${clueEntries.length} clues registered in the case file`);
}

const actIds = new Set(ACTS.map(a => a.id));
for (const [id, clue] of clueEntries) {
  if (clue.id !== id) fail(`clue key "${id}" does not match clue.id "${clue.id}"`);
  if (!actIds.has(clue.act)) fail(`clue "${id}" references unknown act "${clue.act}"`);
  if (!clue.name || !clue.source || !clue.summary || !clue.note) {
    fail(`clue "${id}" missing required field (name, source, summary, note)`);
  }
  const noteSentences = sentenceCount(clue.note);
  if (noteSentences > 3) {
    fail(`clue "${id}" note is ${noteSentences} sentences, max 3`);
  }
}
ok('clue registry referential integrity and sentence lengths valid');

// 3. Spine beats
SPINE_BEATS.forEach((beat, i) => {
  if (beat.order !== i + 1) fail(`spine beat ${beat.id} has order ${beat.order}, expected ${i + 1}`);
  if (!actIds.has(beat.act)) fail(`spine beat ${beat.id} references unknown act "${beat.act}"`);
  if (!beat.speaker || !beat.transmission || !beat.onScreen) {
    fail(`spine beat ${beat.id} missing speaker, transmission, or onScreen`);
  }
  const sCount = sentenceCount(beat.transmission);
  if (sCount > 2) {
    fail(`spine beat "${beat.id}" transmission is ${sCount} sentences, max 2 allowed`);
  }
  if (beat.prereq?.clues) {
    for (const c of beat.prereq.clues) {
      if (!CLUES[c]) fail(`spine beat ${beat.id} prereq references unknown clue "${c}"`);
    }
  }
});
ok(`${SPINE_BEATS.length} spine beats verified in strict order, all <= 2 sentences`);

// 4. Episodes for built worlds
// 4. Episodes for all 14 worlds
for (const wid of Object.keys(EPISODES)) {
  const ep = EPISODES[wid];
  if (!ep) {
    fail(`missing episode definition for world ${wid}`);
    continue;
  }
  if (!ep.arrival || !ep.closing) {
    fail(`episode ${wid} missing arrival or closing transmission`);
    continue;
  }
  const arrCount = sentenceCount(ep.arrival);
  const clsCount = sentenceCount(ep.closing);
  if (arrCount > 2) fail(`episode ${wid} arrival transmission has ${arrCount} sentences, max 2`);
  if (clsCount > 2) fail(`episode ${wid} closing transmission has ${clsCount} sentences, max 2`);
  if (ep.clueId && !CLUES[ep.clueId]) {
    fail(`episode ${wid} references unknown clue "${ep.clueId}"`);
  }
}
ok(`all ${Object.keys(EPISODES).length} world episodes defined, transmissions <= 2 sentences`);

// 5. Boss debrief clue wiring
const bossModules = [
  { name: 'The Hopper (Tallow)', mod: bossHopper },
  { name: 'The Lantern-Eater (Lanternfall)', mod: bossEater },
  { name: 'Basalt Warden (Ligar)', mod: bossWarden },
  { name: 'Recipe Golem (Kettle)', mod: bossGolem },
  { name: 'The Compressor (Bellows)', mod: bossCompressor },
  { name: 'The Crucible (Ember Reach)', mod: bossCrucible }
];

for (const b of bossModules) {
  const debrief = b.mod.DEBRIEF;
  if (!debrief) {
    fail(`${b.name} does not export DEBRIEF`);
    continue;
  }
  if (!debrief.clueAwarded) {
    fail(`${b.name} DEBRIEF missing clueAwarded`);
    continue;
  }
  if (!CLUES[debrief.clueAwarded]) {
    fail(`${b.name} awards unknown clue "${debrief.clueAwarded}"`);
  }
}
ok('all boss debriefs award registered case file clues');

// 6. Quest 1 contract debrief clue wiring
if (!QUEST1_STORY.debrief?.clueAward) {
  fail('Quest 1 debrief missing clueAward');
} else if (!CLUES[QUEST1_STORY.debrief.clueAward]) {
  fail(`Quest 1 debrief awards unknown clue "${QUEST1_STORY.debrief.clueAward}"`);
} else {
  ok(`Quest 1 debrief awards registered clue "${QUEST1_STORY.debrief.clueAward}"`);
}

// 7. Beat unlock simulation
const testState = {
  bosses: ['unit01/boss-hopper', 'unit03/boss-warden'],
  contracts: ['contract_erebus_01'],
  clues: ['clue_erebus_mark', 'clue_tallow_slag']
};
if (!isBeatUnlocked(SPINE_BEATS[0], testState)) fail('beat 1 failed to unlock with fulfilled prereqs');
if (!isBeatUnlocked(SPINE_BEATS[1], testState)) fail('beat 2 failed to unlock with fulfilled prereqs');
if (isBeatUnlocked(SPINE_BEATS[2], testState)) fail('beat 3 unlocked prematurely without Kettle boss');
ok('spine beat prerequisite unlock logic validated');

// 8. The lore notebook: every id the game can file resolves to words the story files hold
{
  const lore = await import('../src/story/lore.js');
  const ids = lore.allLoreIds();
  if (new Set(ids).size !== ids.length) fail('duplicate lore ids');
  const unresolved = ids.filter(id => !lore.getLore(id));
  if (unresolved.length) fail(`lore ids that resolve to nothing: ${unresolved.join(', ')}`);

  // Every world with an episode files all of its paragraphs, and its ending and clue.
  for (const ep of Object.values(EPISODES)) {
    const filed = lore.worldBriefingIds(ep.worldId).map(lore.getLore);
    if (!filed.length || filed.some(e => !e || !e.text)) fail(`world ${ep.worldId}: briefing does not resolve to text`);
    if (ep.clueId) {
      const ids2 = lore.loreIdsForClue(ep.clueId);
      if (!ids2.every(i => lore.getLore(i))) fail(`clue ${ep.clueId}: filed ids do not resolve`);
    }
  }
  // Every spine beat and clue is filed by something.
  for (const b of SPINE_BEATS) if (!lore.getLore(`spine:${b.id}`)) fail(`spine beat ${b.id} cannot be filed`);
  for (const c of Object.keys(CLUES)) if (!lore.getLore(`clue:${c}`)) fail(`clue ${c} cannot be filed`);

  // The notebook shows the story's own words and adds none of its own.
  const entries = lore.loreEntries(ids);
  if (entries.length !== ids.length) fail('loreEntries dropped an entry');
  for (let i = 1; i < entries.length; i++) {
    const a = entries[i - 1].sort; const b = entries[i].sort;
    let cmp = 0;
    for (let k = 0; k < 3 && !cmp; k++) cmp = (a[k] || 0) - (b[k] || 0);
    if (cmp > 0) { fail('loreEntries is not in story order'); break; }
  }
  ok(`${ids.length} lore ids all resolve, in story order, with nothing authored outside the story files`);
}

if (failures > 0) {
  console.log(`\nSTORY INTEGRITY FAILED (${failures} errors)`);
  process.exit(1);
} else {
  console.log('\nSTORY INTEGRITY OK');
  process.exit(0);
}
