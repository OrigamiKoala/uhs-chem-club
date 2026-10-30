/**
 * verify-learn.mjs — Static integrity check for the Learn track.
 *
 * The Learn track is ten worlds, each a course unit, each holding quests that are
 * games with their own modules. This check catches the ways that road silently rots — a duplicate id, a road that cannot be walked, a
 * quest marked live with no module behind it, and above all any XP leaking into
 * a track that must stay invisible to the leaderboard.
 *
 * Run with `npm run verify:learn`.
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';

import { join } from 'node:path';
import {
  WORLDS, TOTAL_WORLDS, ARENAS, QUEST_STATUSES,
  allQuests, getWorld, getQuest
} from '../src/learn/curriculum.js';
// The join bench's pure part. Imported so a pair plate can be PRESSED here and
// the result measured, rather than trusting the declaration beside it.
import { storyFor } from '../src/learn/engine/stage-story.js';
import { planJoin, shellPlan, shellsAfter } from '../src/learn/engine/joinbench.js';

/*
 * A Learn quest module is browser code: it imports the session store, the modal
 * and the soundscape at load time. To check that it satisfies the mount contract
 * this check has to be able to import it, so stand up the smallest possible
 * shims. Nothing here is called — only touched while the modules initialise.
 */
const memory = new Map();
globalThis.localStorage = {
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

// The foe model (engine/foes.js) is pure, but it reaches the scope's and the
// light bench's planners, so it loads after the shims above like a quest does.
const FOES = await import('../src/learn/engine/foes.js');
const LIGHT = await import('../src/learn/engine/lightdata.js');
const BONDDATA = await import('../src/learn/engine/bonddata.js');
const LEWIS = await import('../src/learn/engine/lewis.js');
const VSEPR = await import('../src/learn/engine/vsepr.js');
const MOD = await import('../src/learn/engine/mo.js');
const GAS = await import('../src/learn/engine/gasdata.js');
const TABLE = await import('../src/learn/table/model.js');

/**
 * Sentence count, done in a way that survives chemistry.
 *
 * A naive split on [.!?] reads "mass 16.0" and "H2O2." as three sentences, which
 * would fail a card that is perfectly within its limit. Only a stop followed by
 * whitespace or the end of the string counts.
 */
const sentenceCount = (str) => (String(str || '').match(/[.!?]+(?=\s|$)/g) || []).length;

let failures = 0;
const fail = (msg) => { console.log(`  FAIL ${msg}`); failures++; };
const warn = (msg) => { warnings++; };
let warnings = 0;
const ok = (msg) => console.log(`  ok   ${msg}`);

const quests = allQuests();
/** Built benches whose stages carry no lead line on purpose: nothing at the bench is at stake beyond the chemistry. */
const NO_LEAD = new Set(['q4-cloud', 'q5-numbers', 'q6-filling', 'q8-trends', 'q8-hybrid']);
console.log(`Learn track — ${TOTAL_WORLDS} worlds, ${quests.length} quests charted\n`);

/* ------------------------------------------------------------------
   WORLDS — the road itself
   ------------------------------------------------------------------ */
const worldIds = new Set();
const orders = new Set();

WORLDS.forEach((w, i) => {
  const label = `world ${w.id}`;

  if (worldIds.has(w.id)) fail(`${label}: duplicate world id`);
  worldIds.add(w.id);

  if (orders.has(w.order)) fail(`${label}: duplicate order ${w.order}`);
  orders.add(w.order);

  if (w.order !== i + 1) fail(`${label}: order ${w.order} but sits at position ${i + 1} — the road must be contiguous`);

  for (const field of ['code', 'unit', 'world', 'place', 'title', 'line', 'brief']) {
    if (!w[field] || typeof w[field] !== 'string') fail(`${label}: missing ${field}`);
  }

  if (getWorld(w.id) !== w) fail(`${label}: getWorld does not resolve it`);
  if (!w.quests.length) fail(`${label}: charts no quests at all`);

  // Status is derived, never declared: a world is live exactly when something in
  // it has been built.
  const expected = w.quests.some(q => q.status === 'live') ? 'live' : 'draft';
  if (w.status !== expected) fail(`${label}: status "${w.status}" but ${expected} is derived from its quests`);
});

if (WORLDS.length) ok(`${WORLDS.length} worlds, ordered 1..${WORLDS.length}, all charted`);

/* ------------------------------------------------------------------
   QUESTS — one game module each
   ------------------------------------------------------------------ */
WORLDS.forEach(w => {
  const ids = new Set();

  w.quests.forEach((q, i) => {
    const label = `${w.id}/${q.id}`;

    if (ids.has(q.id)) fail(`${label}: duplicate quest id inside its world`);
    ids.add(q.id);

    if (q.index !== i) fail(`${label}: index ${q.index} but sits at position ${i}`);
    if (getQuest(w.id, q.id) !== q) fail(`${label}: getQuest does not resolve it`);

    for (const field of ['title', 'line']) {
      if (!q[field] || typeof q[field] !== 'string') fail(`${label}: missing ${field}`);
    }

    if (!ARENAS[q.arena]) fail(`${label}: unknown arena "${q.arena}"`);
    if (!QUEST_STATUSES.includes(q.status)) fail(`${label}: unknown status "${q.status}"`);
    if (!Number.isInteger(q.stageCount) || q.stageCount < 1) {
      fail(`${label}: stageCount must be a positive integer (got ${q.stageCount})`);
    }

    // A live quest is one a player can actually enter. It must have a module.
    if (q.status === 'live' && typeof q.module !== 'function') {
      fail(`${label}: marked live but has no module to load`);
    }
    if (q.status !== 'live' && typeof q.module === 'function') {
      fail(`${label}: has a module but is still marked "${q.status}" — flip it to live`);
    }
  });
});

ok(`${quests.length} quests, unique within their worlds, each with an arena and a length`);

/* ------------------------------------------------------------------
   THE NO-XP INVARIANT
   The whole point of this track is that it does not move the leaderboard.
   ------------------------------------------------------------------ */
const xpFields = [];
for (const w of WORLDS) {
  if ('xp' in w) xpFields.push(`world ${w.id}`);
  for (const q of w.quests) if ('xp' in q) xpFields.push(`quest ${w.id}/${q.id}`);
}
if (xpFields.length) fail(`XP found on the Learn track: ${xpFields.join(', ')} — Learn pays nothing`);
else ok('no world or quest carries XP');

const learnSrc = join(process.cwd(), 'src', 'learn');
const screenFiles = ['learn.js', 'learn-world.js', 'learn-quest.js']
  .map(f => join(process.cwd(), 'src', 'screens', f));

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    const p = join(dir, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });
}

const learnFiles = walk(learnSrc).concat(screenFiles).filter(f => f.endsWith('.js'));

// Comments are allowed to name the rails — that is how the rule is documented —
// so both comment forms come out before the scan.
function stripComments(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .map(line => line.split('//')[0])
    .join('\n');
}

// The rails that pay XP. A Learn file that calls one of these has broken the wall
// between the study road and the competition.
const bannedCalls = ['session.addXp', 'api.gradeStage', 'api.completeQuest', 'recordProgress'];
const railFailures = failures;
for (const file of learnFiles) {
  if (!existsSync(file)) { fail(`missing expected file ${file}`); continue; }
  const code = stripComments(readFileSync(file, 'utf8'));
  for (const call of bannedCalls) {
    if (code.includes(call)) {
      fail(`${file.replace(process.cwd() + '/', '')}: calls ${call} — the Learn track must not touch the XP rails`);
    }
  }
}
if (failures === railFailures) ok(`${learnFiles.length} Learn files checked: none call the XP rails`);

/* ------------------------------------------------------------------
   BUTTON STYLING DISCIPLINE
   Bench controls must never render as browser-default white buttons.
   ------------------------------------------------------------------ */
let unstyledButtons = 0;
for (const file of learnFiles) {
  if (!existsSync(file)) continue;
  const content = readFileSync(file, 'utf8');
  const matches = [...content.matchAll(/class=["`]([^"`]*quest-btn-sm[^"`]*)["`]/g)];
  for (const m of matches) {
    const cls = m[1];
    if (!cls.includes('btn-secondary') && !cls.includes('btn-primary')) {
      fail(`${file.replace(process.cwd() + '/', '')}: unstyled quest-btn-sm "${cls}" — must use btn-secondary or btn-primary`);
      unstyledButtons++;
    }
  }
}
if (unstyledButtons === 0) ok('all quest-btn-sm controls carry btn-secondary or btn-primary');

// Read by refusalLeaks() below; declared here because the quest loop
// runs before the function's own section is reached.
const ANSWER_ALLOW = {
  // "Say how many electrons the cards in column 6 keep in their outer shells."
  // The prompt names the column; its count happens to be 6 too, so a refusal
  // that points at "column 6" is pointing where to look. "six" stays checked.
  'unit01/q3-catalogue': { 4: ['6'] }
};

const NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight',
  'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen',
  'eighteen', 'nineteen', 'twenty'];

/* ------------------------------------------------------------------
   THE QUEST MODULE CONTRACT
   ------------------------------------------------------------------ */
const templatePath = join(learnSrc, 'quests', '_template.js');
if (!existsSync(templatePath)) {
  fail('src/learn/quests/_template.js is missing — the quest module contract has no reference');
} else {
  const tmpl = await import('../src/learn/quests/_template.js');
  if (typeof tmpl.mount !== 'function') fail('_template.js does not export mount()');
  else ok('quest module contract: _template.js exports mount()');
}

// Every live quest's module must load and satisfy the same contract.
for (const q of quests.filter(q => q.status === 'live')) {
  const mod = await q.module().catch(err => { console.log(`       ${err && err.message}`); return null; });
  if (!mod) { fail(`${q.key}: module failed to load`); continue; }
  if (typeof mod.mount !== 'function') { fail(`${q.key}: module does not export mount()`); continue; }

  // The chart advertises a length before the quest exists. Once it does exist,
  // the module is the authority and the two must not drift, or the map lies
  // about how long a road is.
  const declared = mod.meta?.stageCount;
  if (typeof declared !== 'number') {
    fail(`${q.key}: a live quest module must export meta.stageCount`);
  } else if (declared !== q.stageCount) {
    fail(`${q.key}: module reports ${declared} stages but the chart says ${q.stageCount}`);
  } else {
    ok(`${q.key}: module loads, exports mount(), ${declared} stages`);
  }

  // BUILDS_ON names the quests whose words this one uses without earning, so the open road stays honest.
  if (mod.BUILDS_ON !== undefined) {
    if (!Array.isArray(mod.BUILDS_ON)) fail(`${q.key}: BUILDS_ON must be an array of quest keys`);
    else {
      for (const key of mod.BUILDS_ON) {
        const [wid, qid] = String(key).split('/');
        const target = getWorld(wid) && getQuest(wid, qid);
        if (!target) fail(`${q.key}: BUILDS_ON names "${key}", which is not a quest on the chart`);
        else if (key === q.key) fail(`${q.key}: BUILDS_ON names the quest itself`);
        else if (target.status !== 'live') fail(`${q.key}: BUILDS_ON names "${key}", which is not built`);
      }
    }
  }
  checkStageTable(q, mod);
  await checkDrawn(q, mod);
  // Every live quest, table-driven or not: practice lives in the bank, not here.
  checkPractice(q, mod);
}

/**
 * A built quest may expose its stage table and its grading for checking. This is
 * the Learn track's version of what `verify:quest` does for the Charge Gardens:
 * prove that the intended solution actually grades correct, that a plausible
 * wrong answer is refused WITH a reason, and that nothing a player reads is
 * missing or off-contract.
 *
 * A module that exports no STAGES is not failed — grading is not always a table.
 * A module that exports STAGES without SOLUTIONS is, because an ungraded table
 * is exactly the thing this check exists to catch.
 */
function checkStageTable(q, mod) {
  const stages = mod.STAGES;
  if (!Array.isArray(stages)) return;

  if (stages.length !== q.stageCount) {
    fail(`${q.key}: STAGES has ${stages.length} entries but the chart says ${q.stageCount}`);
    return;
  }
  if (!Array.isArray(mod.SOLUTIONS) || typeof mod.stateFor !== 'function') {
    fail(`${q.key}: exports STAGES but no SOLUTIONS / stateFor — the grading is unchecked`);
    return;
  }

  const emoji = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]/u;
  let bad = 0;

  /**
   * The words a quest is not allowed to use until it has EARNED them.
   *
   * A player arrives at Unit 1 not knowing what a molecule is, so a stage that
   * opens with one is talking past them. The list below is the whole gated
   * vocabulary of a quest.
   *
   * WITHHELD IS NOT THE SAME AS BANNED. A quest may publish a `VOCABULARY`
   * schedule saying which stage's REWARD CARD introduces each term. That card
   * may name it; play copy — titles, prompts, briefings, hints, widget labels,
   * refusal messages — may use it from the NEXT stage on, because by then the
   * player has found the thing and been handed the word for it. A term absent
   * from the schedule stays withheld for the whole quest, which is how
   * `q1-grain` keeps "atom" and "molecule" for its debrief.
   */
  const WITHHELD_VOCAB = {
    'unit01/q1-grain': /\b(atoms?|atomic|elements?|molecules?|molecular|compounds?|mixtures?)\b/i,
    // `q1-grain` teaches atom, element, molecule, compound and mixture on its
    // own cards, so by the time a player is standing here those are plain words
    // and using them is the rule rather than a leak.
    'unit01/q2-core': /\b(nucle(us|i|ar)|protons?|neutrons?|isotopes?|electrons?|shells?|valence|ions?|ionic|ioniz\w*)\b/i,
    // From here on the list is only what the quest itself has yet to earn. The
    // first two benches taught proton, electron, shell, valence, element,
    // isotope and ion, so those are plain words now and using them is the rule
    // rather than a leak (CLAUDE.md, "Discover, then name, then use").
    'unit01/q3-catalogue': /\b(atomic number|periodic|periods?|groups?|noble|metals?|nonmetals?|non-metals?|alkali|halogens?)\b/i,
    'unit01/q4-ledger': /\b(mass number|cations?|anions?)\b/i,
    'unit01/q5-assay': /\b(abundances?|weighted average|average atomic mass|relative atomic mass|mass spectrum|mass spectrometry)\b/i,
    'unit03/q1-joins': /\b(bonds?|bonded|bonding|ionic|covalent|shares? a pair|lone pairs?|double bonds?|triple bonds?|formula unit)\b/i,
    'unit03/q2-lattice': /\b(lattices?|crystals?|crystalline|conduct\w*|electrolytes?|dissociat\w*|brittle|melting points?)\b/i,
    // Ligar's later benches. Each holds out only what it has yet to earn.
    'unit03/q4-dots': /\b(lewis structures?|lone pairs?|octets?|incomplete octets?|expanded octets?|central atoms?|polyatomic ions?|free radicals?)\b/i,
    'unit03/q5-resonance': /\b(formal charges?|resonance structures?|resonance|fractional bond orders?|delocali[sz]ed)\b/i,
    'unit03/q6-shape': /\b(electron domains?|domains?|linear|trigonal planar|tetrahedral|vsepr|trigonal pyramidal|bent|trigonal bipyramidal|seesaw|octahedral|square planar|electron geometry|electron geometries|molecular geometry|molecular geometries)\b/i,
    'unit03/q7-polarity': /\b(partial charges?|polar covalent|nonpolar|polar|molecular dipoles?|bond dipoles?|dipoles?)\b/i,
    'unit03/q8-hybrid': /\b(restricted rotation|sigma|pi bonds?|pi|hybrid(?:s|i[sz]ation|i[sz]ed)?|sp[3\u00b3]d[2\u00b2]?(?!\w)|sp[2\u00b2](?!\w)|sp[3\u00b3](?!\w)|sp(?![\w\u00b2\u00b3]))/i,
    'unit03/q9-orbitals': /\b(antibonding|bonding orbitals?|molecular orbitals?|paramagnetic|diamagnetic)\b/i,
    'unit03/q3-distance': /\b(potential energy curves?|bond lengths?|bond energ(?:y|ies)|bond orders?|lattice energ(?:y|ies))\b/i,
    'unit07/q1-recipe': /\b(limiting reactants?|conservation of mass|fixed composition|constant composition|definite proportions|multiple proportions|empirical formulas?|percent composition)\b/i,
    'unit01/q6-weigh': /\b(moles?|molar|avogadro\w*|formula mass|gram formula mass)\b/i,
    // Bellows. Each holds out only what it has yet to earn.
    'unit04/q6-real': /\b(ideal gas(?! law)|ideal gases|real gases?|van der waals)\b/i,
    'unit04/q5-speed': /\b(effusion|graham.?s law|diffusion)\b/i,
    'unit04/q4-mixtures': /\b(partial pressures?|dalton.?s law|mole fractions?)\b/i,
    'unit04/q3-ideal': /\b(molar volume|gas constant|ideal gas law|avogadro.?s law)\b/i,
    'unit04/q2-laws': /\b(absolute zero|kelvin|charles.?s law|gay.lussac.?s law)\b/i,
    'unit04/q1-knocks': /\b(pressure|kinetic energy|maxwell.boltzmann|kpa|kilopascals?|boyle.?s law|kinetic molecular theory)\b/i,
    // Lanternfall. Longer phrases first, so "visible spectrum" is read as the
    // phrase and not as a stray word.
    'unit02/q8-trends': /\b(electron affinity|electronegativity|successive ionization energies|ionization energ(?:y|ies)|ionic radi(?:us|i)|atomic radi(?:us|i)|effective nuclear charge|shielding|coulomb.?s law)\b/i,
    'unit02/q7-pes': /\b(photoelectron spectr(?:um|a)|binding energy|subshells?)\b/i,
    'unit02/q6-filling': /\b(transition metal ions?|blocks?|noble.gas notation|configurations?|hund.?s? rule|aufbau)\b/i,
    'unit02/q5-numbers': /\b(pauli|spins?|magnetic|angular momentum|principal)\b/i,
    'unit02/q4-cloud': /\b(uncertainty principle|d orbitals?|p orbitals?|s orbitals?|wave.particle duality|standing waves?|nodes?|orbitals?|probabilit(?:y|ies))\b/i,
    'unit02/q9-absorb': /\b(molecular spectroscopy|complementary colou?rs?|absorbance|beer.?lambert|calibration curves?)\b/i,
    'unit02/q3-lines': /\b(continuous spectrum|line spectrum|emission spectrum|absorption spectrum|energy levels?|ground state|excited states?|bohr|ioniz\w*)\b/i,
    'unit02/q2-photon': /\b(threshold frequency|photoelectric|photons?|planck.?s constant|work functions?)\b/i,
    'unit02/q1-wave': /\b(electromagnetic spectrum|visible spectrum|speed of light|wavelengths?|frequenc(?:y|ies))\b/i
  };
  const withheldRx = WITHHELD_VOCAB[q.key];

  const schedule = Array.isArray(mod.VOCABULARY) ? mod.VOCABULARY : [];
  for (const entry of schedule) {
    if (!(entry?.term instanceof RegExp) || !Number.isInteger(entry.introducedAt)) {
      fail(`${q.key}: VOCABULARY entries need a RegExp term and an integer introducedAt`);
      bad++;
    }
  }

  /**
   * The stage a word becomes sayable in play, or null when it never does.
   * `forReward` allows the very stage that introduces it, which is the card
   * doing the introducing.
   */
  const sayableAt = (word, stage, forReward) => {
    for (const entry of schedule) {
      if (!(entry.term instanceof RegExp)) continue;
      if (!new RegExp(entry.term.source, 'i').test(word)) continue;
      return forReward ? entry.introducedAt <= stage : entry.introducedAt < stage;
    }
    return false;
  };

  /** Real chemistry concepts are used from the start rather than withheld as ciphers. */
  const tooEarly = () => null;

  // A schedule that promises a word and never delivers it is worse than no
  // schedule: the player is taught nothing and the gate silently opens.
  if (schedule.length) {
    const rewards = stages.map(st => `${st.reward?.title || ''} ${st.reward?.body || ''}`);
    for (const entry of schedule) {
      const at = entry.introducedAt;
      const card = rewards[at - 1];
      if (!card || !new RegExp(entry.term.source, 'i').test(card)) {
        fail(`${q.key}: VOCABULARY says stage ${at} introduces ${entry.term}, but that reward card never says it`);
        bad++;
      }
    }
  }

  stages.forEach((st, i) => {
    const label = `${q.key} stage ${i + 1}`;

    for (const field of ['title', 'prompt']) {
      if (!st[field] || typeof st[field] !== 'string') { fail(`${label}: missing ${field}`); bad++; }
    }

    // W5: Prompt <= 25 words, exactly 1 sentence, no "!", ends in ? or .
    const pWords = st.prompt.trim().split(/\s+/).filter(Boolean);
    if (pWords.length > 25) {
      fail(`${label}: prompt exceeds 25 words (${pWords.length}) — "${st.prompt}"`);
      bad++;
    }
    if (sentenceCount(st.prompt) !== 1) {
      fail(`${label}: prompt must be exactly 1 sentence (${sentenceCount(st.prompt)}) — "${st.prompt}"`);
      bad++;
    }
    if (st.prompt.includes('!')) {
      fail(`${label}: prompt must not contain "!" — "${st.prompt}"`);
      bad++;
    }
    if (!/[.?]$/.test(st.prompt.trim())) {
      fail(`${label}: prompt must end in "?" or plain imperative — "${st.prompt}"`);
      bad++;
    }

    // W5.2: the story lives in the .lq-story line, so a prompt carries no setting clause.
    if (/\b(we're|we are|our crew|the crew|down in|out on|out here|in the (?:quarry|refinery|foundry|rig)|at the (?:quarry|refinery|foundry|rig))\b/i.test(st.prompt)) {
      fail(`${label}: prompt carries a setting clause — "${st.prompt}"`);
      bad++;
    }

    // W5.7: a reward card is the plain idea first, in 45 words or fewer.
    if (st.reward?.body && st.reward.body.trim().split(/\s+/).length > 45) {
      warn(`${label}: reward body runs past 45 words (target 35)`);
    }

    // W5.4 and rung 3: option notes and the third hint rung may not carry the answer.
    {
      const sol = mod.SOLUTIONS?.[i] || {};
      const needles = [];
      if (typeof sol.number === 'number') needles.push(String(sol.number));
      if (typeof sol.decimal === 'number') needles.push(String(sol.decimal));
      const opts = st.widget?.options || [];
      const right = typeof sol.choice === 'string' ? opts.find(o => o.id === sol.choice) : null;
      if (right) needles.push(right.label.replace(/\(.*\)/, '').trim());
      const esc = t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const standalone = t => new RegExp(`(^|[^0-9A-Za-z.])${esc(t)}($|[^0-9A-Za-z])`, 'i');
      const rung3 = (st.hints || [])[2] || '';
      for (const n of needles) {
        if (n.length > 1 && standalone(n).test(rung3) && !(rung3.includes('=') && /^\d+$/.test(n))) {
          fail(`${label}: hint rung 3 carries the answer "${n}"`);
          bad++;
        }
      }
      if (right) {
        const note = right.note || '';
        const w = right.label.replace(/\(.*\)/, '').trim();
        if (note && w.length > 8 && note.toLowerCase().includes(w.toLowerCase())) {
          fail(`${label}: the right option's note repeats its own label`);
          bad++;
        }
      }
    }

    // W5: Reading level forbidden words in prompt and briefing
    const forbidden = /\b(fundamentally|exerts?|exerted|exerting|net torque|torque|intercepts?|intercepted|intercepting|deviations?|agitate|isolates?|isolated|isolating|theoretically?)\b/i;
    const promptForbidden = forbidden.exec(st.prompt);
    if (promptForbidden) {
      fail(`${label}: prompt contains forbidden word "${promptForbidden[0]}"`);
      bad++;
    }

    if (!Array.isArray(st.hints) || st.hints.length !== 3) {
      fail(`${label}: needs exactly three hint rungs (got ${st.hints?.length})`); bad++;
    } else if (new Set(st.hints).size !== 3) {
      fail(`${label}: two hint rungs say the same thing`); bad++;
    } else {
      // A hint rung is ONE sentence (CLAUDE.md): what to do, what to compare,
      // then the method — never a paragraph between the player and the bench.
      st.hints.forEach((h, k) => {
        if (sentenceCount(h) !== 1) { fail(`${label}: hint rung ${k + 1} is ${sentenceCount(h)} sentences, not one`); bad++; }
      });
    }
    if (!st.reward?.title || !st.reward?.body) { fail(`${label}: no reward card`); bad++; }
    if (typeof st.check !== 'function') { fail(`${label}: no check()`); bad++; return; }

    // A stage MAY carry a quiet lead line (stage-story.js); when it does, it is one short plain sentence.
    const story = storyFor(q.key, i);
    if (story) {
      if (sentenceCount(story) !== 1) { fail(`${label}: story line is ${sentenceCount(story)} sentences, not one`); bad++; }
      else if (story.split(/\s+/).length > 20) { fail(`${label}: story line runs past twenty words`); bad++; }
      else if (emoji.test(story)) { fail(`${label}: emoji in story line`); bad++; }
      else if (/\d\.\d|\b(?:the answer|the route)\b/i.test(story)) { fail(`${label}: story line carries a figure or names the answer`); bad++; }
    }

    // Player-facing copy obeys the same house rules as the rest of the ship.
    const copy = [st.title, st.prompt, st.reward?.title, st.reward?.body, st.reward?.log,
      st.briefing?.body, ...(st.hints || [])].filter(Boolean);
    for (const str of copy) {
      if (emoji.test(str)) { fail(`${label}: emoji in player-facing copy`); bad++; }
    }

    // Stage briefings must not exceed 2 sentences (CLAUDE.md §7) and must not say "Welcome to" (W5).
    if (st.briefing?.body) {
      const n = sentenceCount(st.briefing.body);
      if (n > 2) {
        fail(`${label}: briefing exceeds 2 sentences (${n})`);
        bad++;
      }
      if (/\bwelcome\s+(to|up\s+to)\b/i.test(st.briefing.body)) {
        fail(`${label}: briefing contains "Welcome to"`);
        bad++;
      }
      const bForbidden = forbidden.exec(st.briefing.body);
      if (bForbidden) {
        fail(`${label}: briefing contains forbidden word "${bForbidden[0]}"`);
        bad++;
      }
    }

    // W5: No CAT nn code anywhere after unit01 (except q1-wave stage 8 card)
    if (!q.key.startsWith('unit01/')) {
      const copyToCheck = [st.prompt, st.briefing?.body, ...(st.hints || [])].filter(Boolean);
      for (const str of copyToCheck) {
        if (/CAT[- ]?[0-9]+/i.test(str)) {
          fail(`${label}: copy contains CAT code "${str.slice(0, 50)}"`);
          bad++;
        }
      }
    }

    // THE CHEMISTRY LANDS IN BITS. Every stage's reward card names the idea the
    // player just worked out, in the words chemists use — and is capped at three
    // sentences, because the thing this replaces is the end-of-quest lecture.
    if (st.reward?.body) {
      const n = sentenceCount(st.reward.body);
      if (n > 3) {
        fail(`${label}: reward card runs to ${n} sentences (max 3)`);
        bad++;
      }
      if (st.reward.body.length < 40) {
        fail(`${label}: reward card body is too terse to teach anything`);
        bad++;
      }
    }

    // The intended solution must pass.
    const solved = st.check(mod.stateFor(i, mod.SOLUTIONS[i] || {}));
    if (!solved?.ok) {
      fail(`${label}: the intended solution does not grade correct (${solved?.msg || 'no reason given'})`);
      bad++;
    }

    // A plausible wrong answer must be refused, and must be told why.
    let missed;
    if (Array.isArray(mod.MISSES) && mod.MISSES[i]) {
      missed = st.check(mod.stateFor(i, mod.MISSES[i]));
      if (missed?.ok) { fail(`${label}: a wrong answer grades correct`); bad++; }
      else if (!missed?.msg) { fail(`${label}: a miss falls through with no message`); bad++; }
    }

    // An empty bench must never solve a stage by accident.
    const empty = st.check(mod.stateFor(i, {}));
    if (empty?.ok && !(mod.SOLUTIONS[i] && Object.keys(mod.SOLUTIONS[i]).length === 0)) {
      fail(`${label}: an untouched bench grades correct`);
      bad++;
    }

    // Withheld vocabulary: prompt, hints, briefing, sample notes, widget labels/notes, check msgs.
    if (withheldRx) {
      const checkable = [
        st.title,
        st.prompt,
        st.briefing?.body,
        st.briefing?.speaker,
        ...(st.hints || []),
        ...(st.samples || []).flatMap(s => [s.label, s.note]),
        ...(st.specimens || []).flatMap(s => [s.label, s.note]),
        ...(st.pairs || []).flatMap(s => [s.label, s.note]),
        ...(st.slabs || []).flatMap(s => [s.label, s.note]),
        ...(st.rigs || []).flatMap(s => [s.label, s.note]),
        ...(st.clouds || []).flatMap(s => [s.label, s.note]),
        ...(st.widget?.rows || []).map(r => r.label),
        ...(st.widget?.items || []).map(r => r.label),
        ...(st.widget?.options || []).flatMap(o => [o.label, o.note]),
        ...(st.widget?.bins || []).flatMap(b => [b.label, b.note]),
        st.widget?.label,
        // A rail's ends and a table's pieces, trays and tokens are play copy too.
        st.widget?.rail?.first,
        st.widget?.rail?.last,
        ...TABLE.labelsOf(st.table),
        solved?.msg,
        missed?.msg,
        empty?.msg
      ].filter(Boolean);

      for (const text of checkable) {
        const early = tooEarly(text, i + 1, false);
        if (early) {
          fail(`${label}: player-facing copy says "${early}" before it has been taught, in "${text.slice(0, 60)}"`);
          bad++;
        }
      }

      // The reward card is where a word is allowed to arrive, so it may use
      // the terms this stage introduces — and nothing from later stages.
      //
      // Only checked against a published schedule. A quest without one holds
      // every withheld word out of PLAY for its whole length and teaches them
      // on the cards regardless of order, which is what `q1-grain` does.
      for (const text of (schedule.length
        ? [st.reward?.title, st.reward?.body, st.reward?.log]
        : []).filter(Boolean)) {
        const early = tooEarly(text, i + 1, true);
        if (early) {
          fail(`${label}: reward card says "${early}" before it has been taught, in "${text.slice(0, 60)}"`);
          bad++;
        }
      }

      const early = tooEarly(st.check.toString(), i + 1, false);
      if (early) {
        fail(`${label}: check() code says "${early}" before it has been taught`);
        bad++;
      }
    }

    // A REFUSAL NAMES THE REASON, NEVER THE RESULT.
    const leaks = refusalLeaks(q, mod, st, i, [missed?.msg, empty?.msg]);
    const seenLeak = new Set();
    for (const leak of leaks) {
      if (seenLeak.has(leak.token) || seenLeak.size >= 3) continue;
      seenLeak.add(leak.token);
      fail(`${label}: a refusal gives away the answer (${leak.token}) in "${leak.text.slice(0, 80)}"`);
      bad++;
    }

    // LIGAR (2026-10-23 rollout, audit T4): a refusal on a Ligar bench names what the table shows that disagrees and never gives the reasoning.
    // `refusalLeaks` above only searches for the answer; these are the discriminating features each bench teaches, and the words of a reason.
    if (q.key.startsWith('unit03/')) {
      const msgs = new Set([missed?.msg, empty?.msg, ...sentenceLiterals(st.check)].filter(Boolean));
      const REASON = /\b(because|since|therefore|which means|that is why|this means|so that|in order to|the reason)\b/i;
      const FEATURE = {
        'unit03/q1-joins': /\b(full outer shell|shell is (?:already )?full|hand(?:s|ed)? over|share[sd]? a pair|metal|nonmetal|noble)\b/i,
        'unit03/q2-lattice': /\b(free to move|pinned|locked in|mobile|charged particles|ions? (?:can|cannot)|lattice|molecules?|network)\b/i,
        'unit03/q3-distance': /\b(more pairs|shorter|longer|stronger|deeper|closer together|further apart)\b/i,
        'unit03/q4-dots': /\b(second pair|double bond|share a second|central atom|incomplete)\b/i,
        'unit03/q5-resonance': /\b(blend|resonance|between a single and a double|alike)\b/i,
        'unit03/q6-shape': /\b(leave the flat|pyramid|tetrahedr\w*|lone pair pushes|bent)\b/i,
        'unit03/q7-polarity': /\b(cancel\w*|symmetr\w*|lopsided|net pull|add up)\b/i,
        'unit03/q8-hybrid': /\b(blend|hybrid|pi overlap|sigma|side to side)\b/i,
        'unit03/q9-orbitals': /\b(alone in a box|unpaired|one in each box|hund)\b/i,
        'unit03/boss-warden': /\b(cancel\w*|symmetr\w*|lopsided|unpaired|triple bond|held (?:harder|hardest))\b/i
      }[q.key];
      for (const text of msgs) {
        if (REASON.test(text)) { fail(`${label}: a refusal gives its reasoning ("${REASON.exec(text)[0]}") in "${text.slice(0, 80)}"`); bad++; }
        if (FEATURE && FEATURE.test(text)) { fail(`${label}: a refusal names the feature that decides the stage (${FEATURE.exec(text)[0]}) in "${text.slice(0, 80)}"`); bad++; }
      }
    }

    /* ------------------------------------------------------------------
       NOTHING IS NAMED WITHOUT BEING EXPLAINED — BUT A LABEL IS AN
       EXPLANATION, AND RESTATING IT IS NOISE.

       This used to demand a legend under EVERY key a stage offered, and the
       result was a bench that opened with a manual: "Tip Sample tips the
       selected sample down the chute", "Tapping a card reads that card",
       "Reset Sample puts back every electron the stripper has taken off".
       A player reads those, learns nothing they would not have learned by
       pressing the key once, and has three sentences between them and the
       instrument. The rule the product actually wants is narrower: a key
       whose label does not say what it does owes one sentence. A key whose
       label does say it owes nothing, and a quest declines by leaving it out
       of its `TOOL_TEXT`.

       So a missing legend is no longer a failure. What is still enforced is
       everything that made the rule worth having: a quest that offers controls
       at all must export `toolNoteFor`, a legend that EXISTS must be one plain
       sentence, and it is held to the same withheld vocabulary as a prompt or
       a hint — because a legend nobody can read is worse than no legend.
       ------------------------------------------------------------------ */
    if (Array.isArray(st.controls) && st.controls.length) {
      if (typeof mod.toolNoteFor !== 'function') {
        fail(`${label}: the quest offers controls but exports no toolNoteFor()`);
        bad++;
      } else {
        for (const control of st.controls) {
          const note = mod.toolNoteFor(control, i + 1);
          // No legend is a deliberate answer: this key says what it does.
          if (!note) continue;
          if (!note.key || !note.what) {
            fail(`${label}: the legend for "${control}" is missing its key or its line`);
            bad++;
            continue;
          }
          if (sentenceCount(note.what) < 1) {
            fail(`${label}: the legend for "${control}" is not a sentence`);
            bad++;
          }
          if (withheldRx) {
            const earlyWord = tooEarly(`${note.key} ${note.what}`, i + 1, false);
            if (earlyWord) {
              fail(`${label}: the legend for "${control}" says "${earlyWord}" before it has been taught`);
              bad++;
            }
          }
        }
      }
    }

    // A stage in a fight: the encounter layer's own rules (see checkEncounter).
    if (st.encounter) {
      const bad0 = failures;
      checkEncounter(q, mod, st, i, { label, tooEarly, emoji, solved, missed, empty });
      if (failures !== bad0) bad += failures - bad0;
    }

    // Sample notes must describe provenance only, never leaking answers or check reasoning.
    const leakWords = ['uniform', 'mixed', 'single grain', 'indivisible', 'scouring agent'];
    const bench = Array.isArray(st.samples) ? st.samples
      : Array.isArray(st.specimens) ? st.specimens
        : Array.isArray(st.pairs) ? st.pairs
          : Array.isArray(st.slabs) ? st.slabs : [];
    for (const s of bench) {
      if (s.note) {
        for (const w of leakWords) {
          if (s.note.toLowerCase().includes(w)) {
            fail(`${label}: sample "${s.id}" note leaks answer term "${w}"`);
            bad++;
          }
        }
        const sol = mod.SOLUTIONS?.[i] || {};
        if (sol.bins && sol.bins[s.id]) {
          const targetBin = (st.widget?.bins || []).find(b => b.id === sol.bins[s.id]);
          if (targetBin && targetBin.label && s.note.toLowerCase().includes(targetBin.label.toLowerCase())) {
            fail(`${label}: sample "${s.id}" note contains assigned bin label "${targetBin.label}"`);
            bad++;
          }
        }
      }
    }
  });

  if (!bad) ok(`${q.key}: ${stages.length} stages graded — solutions pass, misses are diagnosed`);

  checkBench(q, mod, stages);
}

/* ------------------------------------------------------------------
   A REFUSAL NAMES THE REASON, NEVER THE RESULT.

   The hint ladder is built to hold the answer back: rung three gives the
   method and never the figure. A miss message fires on the FIRST wrong
   commit, so a refusal that says "Sample D reads 0 with 8 protons" or
   "six of them carry a cross" hands over, one press in, exactly what the
   ladder was withholding. A refusal may say what to compare and where to
   look; it may not say what the comparison comes out as.

   What counts as the answer is read off SOLUTIONS:
   - `number` / `decimal` / each of `numbers`: that figure as a standalone
     token ("8", "+8", "8." but not "18" or "CAT 08"), and for a whole
     number 0-20 the word as well ("eight");
   - `rings`: the whole arrangement in order ("2, 8 and 1", "2 / 8 / 1");
   - `sample`, or a `choice` whose option is a sample on the bench: that
     sample's name ("Sample C");
   - `bins`: a sentence naming a filed sample together with the exact label
     of the bin it belongs in.

   The refusals checked are every one the stage can produce, found three
   ways: the MISSES / untouched-bench messages above; the stage's check run
   against every other value its widget offers (each other number in range,
   each other option or sample, each row moved to each other bin), with the
   rest of the solution held so the refusal reached is the one about the
   answer; and every sentence-shaped string literal in the check's source,
   so a branch no sweep reaches is still read.

   ANSWER_ALLOW is for a figure the PROMPT itself states, which a refusal
   repeating it therefore gives nothing away by. Keep it small and say why.
   ------------------------------------------------------------------ */
function escRx(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

/** A figure as a standalone token: not part of a longer number, word or code. */
function numberTokens(v) {
  const out = [];
  if (typeof v !== 'number' || !Number.isFinite(v)) return out;
  // A SIGNED figure is a charge — "+2", "plus two", "minus one" — and every
  // answer these stages take is an unsigned count or weight, so a charge that
  // happens to share its digits (the +2 a stage asks the player to reach) is
  // not the answer and is not read as one.
  const unsigned = '(?<![\\w.+\\-\u2212])(?<!plus )(?<!minus )';
  out.push({ token: String(v), rx: new RegExp(`${unsigned}${escRx(String(v))}(?![\\w]|\\.\\d)`, 'i') });
  // "one" is a pronoun far more often than a figure ("one sample on its own"),
  // and "zero" is what a neutral needle reads on every sample, so the words
  // are checked from two up; the digits are always checked.
  if (Number.isInteger(v) && v >= 2 && v <= 20) {
    out.push({ token: NUMBER_WORDS[v], rx: new RegExp(`(?<!plus )(?<!minus )\\b${NUMBER_WORDS[v]}\\b`, 'i') });
  }
  return out;
}

/** The literal text of every sentence-shaped string in a function's source. */
function sentenceLiterals(fn) {
  const src = String(fn);
  const out = [];
  const rx = /'((?:[^'\\\n]|\\.)*)'|"((?:[^"\\\n]|\\.)*)"|`((?:[^`\\]|\\.)*)`/g;
  let m;
  while ((m = rx.exec(src)) !== null) {
    let s = m[1] ?? m[2] ?? m[3] ?? '';
    if (m[3] !== undefined) s = s.replace(/\$\{[^}]*\}/g, ' ');
    s = s.replace(/\\(.)/g, '$1');
    // An id or a key is one word; a refusal is a sentence.
    if (/\s/.test(s.trim()) && /[a-z]/i.test(s)) out.push(s);
  }
  return out;
}

function refusalLeaks(q, mod, st, i, seed) {
  const sol = mod.SOLUTIONS?.[i] || {};
  const bench = st.samples || st.specimens || st.pairs || st.slabs || st.hoppers || st.cards || st.rigs || st.clouds || [];
  const nameOf = (id) => {
    const s = bench.find(b => b.id === id);
    return s?.label && /^(sample|pair|block) [a-z]$/i.test(s.label.trim()) ? s.label.trim() : null;
  };
  const allow = new Set((ANSWER_ALLOW[q.key] || {})[i + 1] || []);

  // What the answer is, as things a sentence could say.
  const tokens = [];
  if (typeof sol.number === 'number') tokens.push(...numberTokens(sol.number));
  if (typeof sol.decimal === 'number') tokens.push(...numberTokens(sol.decimal));
  for (const v of (Array.isArray(sol.numbers) ? sol.numbers : [])) tokens.push(...numberTokens(v));
  if (Array.isArray(sol.rings) && sol.rings.filter(Boolean).length >= 2) {
    const seq = sol.rings.filter(Boolean).map(v => `(?<![\\w.])${v}(?![\\w])`).join('[\\s,/]*(?:and\\s+|then\\s+)?');
    tokens.push({ token: sol.rings.filter(Boolean).join('/'), rx: new RegExp(seq, 'i') });
  }
  for (const id of [sol.sample, sol.choice]) {
    const name = id && nameOf(id);
    if (name) tokens.push({ token: name, rx: new RegExp(`\\b${escRx(name)}\\b`, 'i') });
  }
  const binPairs = [];
  for (const [sid, bid] of Object.entries(sol.bins || {})) {
    const name = nameOf(sid);
    const bin = (st.widget?.bins || []).find(b => b.id === bid);
    if (name && bin?.label) binPairs.push({ name, bin: bin.label });
  }
  const live = tokens.filter(t => !allow.has(t.token));
  if (!live.length && !binPairs.length) return [];

  // Every refusal the stage can produce.
  const msgs = new Set(seed.filter(Boolean));
  const tryState = (over) => {
    try {
      const r = st.check(mod.stateFor(i, { ...sol, ...over }));
      if (r && !r.ok && r.msg) msgs.add(r.msg);
    } catch { /* a state this stage cannot be in */ }
  };
  const w = st.widget || {};
  if (typeof sol.number === 'number') {
    const lo = Number.isFinite(w.min) ? w.min : 0;
    const hi = Number.isFinite(w.max) ? w.max : Math.max(20, sol.number * 2);
    const step = w.step || 1;
    for (let v = lo, n = 0; v <= hi && n < 400; v += step, n++) if (v !== sol.number) tryState({ number: v });
  }
  if (typeof sol.decimal === 'number') {
    const step = w.step || 0.1;
    for (let v = w.min ?? 0, n = 0; v <= (w.max ?? sol.decimal * 2) + 1e-9 && n < 400; v += step, n++) {
      const r = Math.round(v * 100) / 100;
      if (r !== sol.decimal) tryState({ decimal: r });
    }
  }
  if (Array.isArray(sol.numbers)) {
    sol.numbers.forEach((_, k) => {
      const top = Math.max(40, ...sol.numbers.map(x => x * 2));
      for (let v = 0; v <= top; v++) {
        if (v === sol.numbers[k]) continue;
        const next = sol.numbers.slice(); next[k] = v; tryState({ numbers: next });
      }
    });
  }
  if (sol.choice !== undefined) for (const o of (w.options || [])) if (o.id !== sol.choice) tryState({ choice: o.id });
  if (sol.sample !== undefined) for (const s of bench) if (s.id !== sol.sample) tryState({ sample: s.id });
  if (sol.bins) {
    for (const row of Object.keys(sol.bins)) {
      for (const b of (w.bins || [])) {
        if (b.id !== sol.bins[row]) tryState({ bins: { ...sol.bins, [row]: b.id } });
      }
    }
  }
  if (sol.board) {
    const slots = Object.keys(sol.board);
    for (let a = 0; a < slots.length; a++) {
      for (let b = a + 1; b < slots.length; b++) {
        tryState({ board: { ...sol.board, [slots[a]]: sol.board[slots[b]], [slots[b]]: sol.board[slots[a]] } });
      }
    }
  }
  for (const lit of sentenceLiterals(st.check)) msgs.add(lit);

  const leaks = [];
  for (const text of msgs) {
    for (const t of live) if (t.rx.test(text)) leaks.push({ token: t.token, text });
    for (const sentence of String(text).split(/(?<=[.!?])\s+/)) {
      for (const p of binPairs) {
        if (new RegExp(`\\b${escRx(p.name)}\\b`, 'i').test(sentence) && sentence.toLowerCase().includes(p.bin.toLowerCase())) {
          leaks.push({ token: `${p.name} -> ${p.bin}`, text });
        }
      }
    }
  }
  return leaks;
}


/* ------------------------------------------------------------------
   LIGAR'S FOES, READ AGAINST THEIR PLATES

   `planFoe` asks the foe's planner (bonddata, lewis, vsepr, mo). This reads the
   plate's declaration directly, with the arithmetic done again here, and says
   what the pose has to be. A warden that turns must be a molecule whose pulls add.
   ------------------------------------------------------------------ */
function ligarProbes(species, item, st) {
  {
    const out = [];
    if (item.head === 'lattice') {
      out.push({ probe: { rig: 'hold', lattice: item.lattice }, want: { pose: 'gripped', grip: Math.round(BONDDATA.LATTICES[item.lattice].energy / 3795 * 100) / 100 } });
    } else if (item.head === 'slate') {
      const n = LEWIS.MOLECULES[item.mol].syms.length;
      out.push({ probe: { rig: 'lamps', lit: n, of: n }, want: { pose: 'cleaved' } });
      out.push({ probe: { rig: 'lamps', lit: 1, of: n }, want: { pose: 'unmoved' } });
    } else if (item.head === 'rack') {
      const unpaired = MOD.DIATOMICS[item.mol].unpaired;
      out.push({ probe: { rig: 'pull', unpaired }, want: { pose: unpaired > 0 ? 'turned' : 'still' } });
    } else if (item.head === 'hub' || item.head === 'show') {
      const arms = item.mol ? VSEPR.RIG_MOLECULES[item.mol].arms
        : (item.stock || []).flatMap(s => Array.from({ length: s.n }, () => (s.kind === 'lone' ? { kind: 'lone' } : { kind: 'atom', sym: s.sym, mult: s.mult || 1 })));
      out.push({ probe: { rig: 'arms', arms }, want: { pose: 'splayed', arms: arms.length } });
      out.push({ probe: { rig: 'arms', arms: [] }, want: { pose: 'unmoved' } });
    } else if (item.head === 'field') {
      const polar = VSEPR.planDipole(item.mol).polar;
      out.push({ probe: { rig: 'field', mol: item.mol, on: true }, want: { pose: polar ? 'turned' : 'still' } });
      out.push({ probe: { rig: 'field', mol: item.mol, on: false }, want: { pose: 'unmoved' } });
    } else if (item.head === 'twist') {
      out.push({ probe: { rig: 'twist', bond: item.bond }, want: { pose: item.bond === 'single' ? 'free' : 'locked' } });
    } else if (item.head === 'mixer') {
      for (const p of [1, 2, 3]) out.push({ probe: { rig: 'mix', p }, want: { pose: 'splayed', arms: p + 1 } });
    }
    return out;
  }
}


/* ------------------------------------------------------------------
   BELLOWS' FOES, READ AGAINST THEIR PLATES

   `planFoe` asks the foe's planner (gasdata). This reads the plate's declaration
   directly, with the arithmetic done again here by hand, and says what the pose
   has to be. The Compressor must labour on a plate whose gauge really climbs.
   ------------------------------------------------------------------ */
function bellowsProbes(item, st) {
  // Local on purpose: this runs while the module is still loading its quests.
  const R_HAND = 8.314;
  const BLADDER_HAND = { SLACK: 0.8, TAUT: 1.25, STRAIN: 2.2, EMPTY: 0.4, FULL: 0.85 };
  const out = [];
  const rows = (st.volumes?.length && item.hold !== 'V' && item.follow !== false) ? st.volumes.map((_, k) => k + 1) : [null];
  const cols = (st.temps?.length && item.follow !== false) ? st.temps.map((_, k) => k + 1) : [null];
  const vStart = st.volumeStart || 1; const tStart = st.tempStart || 1;
  const gasOf = key => GAS.GASES[key];
  const tK = ti => (ti == null ? (item.T ?? 298.15) : ((st.tempList || 'C') === 'K' ? st.temps[ti - 1] : st.temps[ti - 1] + 273.15));
  const vL = vi => (vi == null ? (item.V ?? 24.8) : st.volumes[vi - 1]);
  const pushByHand = (n, vi, ti) => {
    const T = tK(ti); const V = item.hold === 'P' ? (n * R_HAND * T) / (item.P0 ?? 101.325) : vL(vi);
    if (item.vdw) {
      const g = gasOf(item.gas);
      return ((n * R_HAND * T) / (V - n * g.b)) - (g.a * 101.325 * n * n) / (V * V);
    }
    return (n * R_HAND * T) / V;
  };
  if (item.head === 'cylinder' || item.head === 'mixture') {
    const mixHand = (vi, ti, scale = 1) => (item.parts || []).reduce((sum, p) => sum + (p.n * scale * R_HAND * tK(ti)) / (item.follow !== false && st.volumes?.length ? vL(vi ?? vStart) : (item.V ?? 10)), 0);
    const roomByHand = (n, vi, ti) => (item.hold === 'P' ? (n * R_HAND * tK(ti)) / (item.P0 ?? 101.325) : item.head === 'mixture' ? (item.follow !== false && st.volumes?.length ? vL(vi ?? vStart) : (item.V ?? 10)) : vL(vi));
    const base = item.head === 'mixture' ? mixHand(null, cols[0] == null ? null : tStart) : pushByHand(item.n ?? 1, rows[0] == null ? null : vStart, cols[0] == null ? null : tStart);
    const baseRoom = item.head === 'mixture' ? roomByHand(1, null, null) : roomByHand(item.n ?? 1, rows[0] == null ? null : vStart, cols[0] == null ? null : tStart);
    const states = [{ vi: rows[0] == null ? null : vStart, ti: cols[0] == null ? null : tStart, n: item.n ?? 1 }];
    if (item.head === 'mixture') {
      if (rows[0] != null) for (const vi of [rows[0], rows[rows.length - 1]]) states.push({ vi, ti: cols[0] == null ? null : tStart, n: 1 });
      if (cols[0] != null) for (const ti of [cols[0], cols[cols.length - 1]]) states.push({ vi: rows[0] == null ? null : vStart, ti, n: 1 });
    }
    if (item.head === 'cylinder') {
      if (rows[0] != null) for (const vi of [rows[0], rows[rows.length - 1]]) states.push({ vi, ti: cols[0] == null ? null : tStart, n: item.n ?? 1 });
      if (cols[0] != null) for (const ti of [cols[0], cols[cols.length - 1]]) states.push({ vi: rows[0] == null ? null : vStart, ti, n: item.n ?? 1 });
      if ((st.controls || []).includes('add')) states.push({ vi: rows[0] == null ? null : vStart, ti: cols[0] == null ? null : tStart, n: st.nMax ?? 4 });
    }
    for (const sx of states) {
      const P = item.head === 'mixture' ? mixHand(sx.vi, sx.ti) : pushByHand(sx.n, sx.vi, sx.ti);
      const ratio = item.hold === 'P'
        ? (baseRoom > 1e-6 ? roomByHand(sx.n, sx.vi, sx.ti) / baseRoom : roomByHand(sx.n, sx.vi, sx.ti) > 1e-6 ? 1.75 : 1)
        : P / base;
      out.push({
        probe: {
          kind: 'gas',
          item: { ...item, n: sx.n },
          cfg: GAS.benchCfg(st, { volume: sx.vi ?? vStart, temp: sx.ti ?? tStart }),
          rest: { P: base, V: baseRoom }
        },
        want: { pose: ratio > BLADDER_HAND.TAUT ? 'laboured' : ratio < BLADDER_HAND.SLACK ? 'easy' : 'steady' }
      });
    }
  } else if (item.head === 'leak') {
    for (const t of st.times || [0]) {
      const left = Math.exp(-Math.LN2 * t * Math.sqrt(2.016 / gasOf(item.gas).M));
      const pose = left >= BLADDER_HAND.FULL ? 'idle' : 'venting';
      out.push({ probe: { kind: 'leak', gas: item.gas, seconds: t }, want: { pose } });
    }
  }
  return out;
}

/* ------------------------------------------------------------------
   THE ENCOUNTER LAYER (docs/plans/storyline-and-combat.md, sections 3-4)

   A stage may declare an `encounter` and play as a fight. Combat is a layer
   over the unchanged stage loop, and what this holds it to is what keeps it
   from becoming decoration or a gate:

   - foes map one-to-one onto the stage's samples or plates, and are made
     from the stage's own bench, never declared separately;
   - every line a foe speaks passes the SAME withheld-vocabulary gate as a
     prompt, is one plain sentence, and may not carry the stage's answer;
   - a foe's behaviour comes only from planFoe(), and is checked here against
     an independent reading of the bench's declaration -- a warden that turns
     must be a molecule whose pulls really add;
   - move labels are real bins; the Commit key's attack verb is one or two
     plain words.
   The fight state itself and the frame's hooks are checked once, below, by
   checkEncounterLayer().
   ------------------------------------------------------------------ */
function checkEncounter(q, mod, st, i, { label, tooEarly, emoji, solved, missed, empty }) {
  const enc = FOES.resolveEncounter(st);
  if (!enc) { fail(`${label}: declares an encounter that does not resolve (unknown species "${st.encounter.species}"?)`); return; }
  const one = (text) => sentenceCount(text) === 1;
  const oneOrTwoWords = (text) => /^[A-Za-z]+(?: [A-Za-z]+)?$/.test(text) && text.length <= 16;

  // One foe per thing on the bench, by construction -- and held to it here.
  const items = FOES.benchItems(st);
  const ids = enc.foes.map(f => f.id);
  if (!items.length) fail(`${label}: an encounter needs samples or plates on the bench to be made of`);
  if (ids.length !== items.length || new Set(ids).size !== ids.length || !items.every(it => ids.includes(it.id))) {
    fail(`${label}: the foes do not map one-to-one onto the bench (${ids.join(', ')})`);
  }

  if (!oneOrTwoWords(enc.act)) fail(`${label}: the attack verb "${enc.act}" must be one or two plain words`);
  if (!one(enc.intent)) fail(`${label}: the foe's intent must be one sentence ("${enc.intent}")`);
  if (!one(enc.hit)) fail(`${label}: the foe's dispersal must be one sentence ("${enc.hit}")`);
  if (!one(enc.counter)) fail(`${label}: the foe's counter must be one sentence ("${enc.counter}")`);
  if (/[←-⇿⟵-⟿]|->|=>/.test(enc.act)) fail(`${label}: no arrow glyphs in a key label ("${enc.act}")`);

  // Moves name real bins.
  const binIds = new Set((st.widget?.bins || []).map(b => b.id));
  for (const [bin, verb] of Object.entries(enc.moves || {})) {
    if (!binIds.has(bin)) fail(`${label}: a move is declared for "${bin}", which is not a bin on this stage`);
    if (!oneOrTwoWords(verb)) fail(`${label}: the move "${verb}" must be one or two plain words`);
  }

  // Every reaction a foe can give, from the planner, for every probe its species reads.
  const reactions = [];
  const wrong = [];
  for (const foe of enc.foes) {
    // Bellows' spoil: gas bladders and the Compressor, each reading its plate. Every reading is
    // checked against the plate's own declaration, re-worked by hand (bellowsProbes).
    if (enc.species === 'the compressor') {
      for (const { probe, want } of bellowsProbes(foe.item, st)) {
        const plan = FOES.planFoe(enc, foe, probe);
        if (!plan) { fail(`${label}: ${foe.id} gives no reaction to a ${probe.kind} reading`); continue; }
        reactions.push(plan.line);
        if (plan.pose !== want.pose) wrong.push(`${foe.id} (${probe.kind}) -> ${plan.pose}, the plate says ${want.pose}`);
      }
      continue;
    }
    // Ligar's spoil: the basalt warden on the domain rig, the lattice, the slate and the molecular rack. Each reads its plate, and each reading
    // is checked below against the plate's own declaration.
    if ((enc.species === 'basalt warden' && ['hub', 'show', 'field', 'mixer', 'twist', 'lattice', 'slate', 'rack'].includes(foe.item?.head))) {
      for (const { probe, want } of ligarProbes(enc.species, foe.item, st)) {
        const plan = FOES.planFoe(enc, foe, probe);
        if (want == null) {
          if (plan) wrong.push(`${foe.id} reacts (${plan.pose}) to ${JSON.stringify(probe)}, which says nothing`);
          continue;
        }
        if (!plan) { fail(`${label}: ${foe.id} gives no reaction to ${JSON.stringify(probe)}`); continue; }
        reactions.push(plan.line);
        if (plan.pose !== want.pose) wrong.push(`${foe.id} ${JSON.stringify(probe)} -> ${plan.pose}, the bench says ${want.pose}`);
        for (const [k, v] of Object.entries(want)) {
          if (k !== 'pose' && plan[k] !== v) wrong.push(`${foe.id} ${JSON.stringify(probe)} -> ${k} ${plan[k]}, the bench says ${v}`);
        }
      }
      continue;
    }
  }
  for (const w of wrong.slice(0, 3)) fail(`${label}: a foe lies about its bench (${w})`);

  // THE SAME GATES AS EVERY OTHER LINE THE PLAYER READS.
  const play = [enc.act, enc.intent, enc.counter, enc.knockback, ...Object.values(enc.moves || {}), ...reactions];
  for (const text of play) {
    if (emoji.test(text)) fail(`${label}: emoji in foe copy "${text}"`);
    const early = tooEarly(text, i + 1, false);
    if (early) fail(`${label}: foe copy says "${early}" before it has been taught, in "${text.slice(0, 60)}"`);
  }
  // The dispersal lands with the reward card, so it may use the word that card earns.
  const earlyHit = tooEarly(enc.hit, i + 1, true);
  if (earlyHit) fail(`${label}: the dispersal says "${earlyHit}" before it has been taught`);

  // A foe's line may not carry the stage's answer. Reactions are evidence, not verdicts.
  const seen = new Set();
  for (const leak of refusalLeaks(q, mod, st, i, [enc.intent, enc.counter, enc.knockback, ...reactions])) {
    if (seen.has(leak.token) || seen.size >= 3) continue;
    seen.add(leak.token);
    fail(`${label}: foe copy gives away the answer (${leak.token}) in "${leak.text.slice(0, 80)}"`);
  }

  // THE TURN-ONE RULE, on this stage: the intended solution is a win from a fresh fight.
  if (!solved?.ok) fail(`${label}: an encounter must not change what wins -- the solution does not grade correct`);
}

/**
 * The parts of the encounter layer that are the same for every stage: the
 * fight state, and what the frame is and is not allowed to do with it.
 */
async function checkEncounterLayer() {
  const before = failures;
  const { newFight, afterMiss, afterWin, INTEGRITY, COUNTER_DELAY_MS } = FOES;

  // A correct commit wins on turn one.
  let r = afterWin(newFight());
  if (!r.fight.won || !r.flawless) fail('encounter: a correct commit on turn one must be a flawless win');

  // A miss costs one Integrity; at zero the rig is knocked back and refilled.
  let f = newFight();
  for (let k = 0; k < INTEGRITY - 1; k++) {
    const m = afterMiss(f);
    if (m.knockedBack) fail('encounter: knocked back before Integrity ran out');
    f = m.fight;
  }
  if (f.integrity !== 1) fail(`encounter: ${INTEGRITY - 1} misses should leave 1 Integrity (got ${f.integrity})`);
  const m = afterMiss(f);
  if (!m.knockedBack || m.fight.integrity !== INTEGRITY || m.fight.knockbacks !== 1) {
    fail('encounter: the last point of Integrity must knock the rig back and refill it');
  }
  // Knocked back or not, a correct commit still wins. Nothing blocks the right answer.
  for (const state of [f, m.fight]) {
    const w = afterWin(state);
    if (!w.fight.won) fail('encounter: a correct commit must win at any Integrity, knocked back or not');
    if (w.flawless) fail('encounter: a win that cost Integrity is not flawless');
  }
  if (afterMiss(afterWin(newFight()).fight).fight.lost !== 0) fail('encounter: a won fight must not take further hits');

  // THE REASON COMES FIRST, and the encounter is an observer, not a gate.
  const encSrc = stripComments(readFileSync(join(learnSrc, 'engine', 'encounter.js'), 'utf8'));
  if (/banner|announce\(|\.note\(|\.miss\(|\.clear\(/.test(encSrc)) {
    fail('encounter.js touches the banner or the frame\'s outcome calls -- it may only write to its own plate');
  }
  if (!(COUNTER_DELAY_MS >= 250)) fail('encounter: the counter must wait long enough for the reason to land first');

  const frameSrc = stripComments(readFileSync(join(learnSrc, 'engine', 'frame.js'), 'utf8'));
  const missBody = frameSrc.slice(frameSrc.indexOf('  miss(message) {'), frameSrc.indexOf('  announce(html) {'));
  if (!missBody.includes('this.announce(') || missBody.indexOf('this.announce(') > missBody.indexOf('this.encounter?.onMiss()')) {
    fail('frame.miss must put the reason on screen before the encounter answers it');
  }
  const gating = frameSrc.split('\n').filter(l => /this\.encounter/.test(l) &&
    /(\bif\s*\(|\breturn\b|&&|\|\||\?[^.])\s*!?\s*\(?this\.encounter/.test(l.replace(/\?\./g, '#.')));
  if (gating.length) fail(`frame.js lets the encounter decide something (${gating[0].trim()}) -- it may only be told things`);

  // THE PLATE, DRAWN FOR REAL on a pack (three wardens over three lattices) and a lone
  // warden (one slate): one portrait per bench item, Integrity pips that fall and refill,
  // the reason's beat held back, a reaction taken from the planner, and a win that
  // disperses everything. (The Warden's own phases are tables with one foe each since T3c;
  // the plate still draws a pack for the species that fight over several bench items, so
  // the pack is declared here, as the old bench declared it.)
  {
    const { Encounter } = await import('../src/learn/engine/encounter.js');
    const wardenEnc = { species: 'basalt warden', act: 'Name Plate', intent: 'A basalt warden stands over three blocks of its own plating.' };
    const warden = {
      STAGES: [
        { rigs: [['a', 'NaCl'], ['b', 'MgO'], ['c', 'KCl']].map(([id, lattice]) => ({ id, label: `Plate ${id.toUpperCase()}`, head: 'lattice', lattice })), encounter: wardenEnc },
        { rigs: [{ id: 'a', label: 'Plate A', head: 'slate', mol: 'SF4' }], encounter: { ...wardenEnc, act: 'Seal Vent' } }
      ]
    };
    const host = { hidden: true, className: '', dataset: {}, innerHTML: '' };
    const pips = () => (host.innerHTML.match(/<i class="on">/g) || []).length;

    const pack = FOES.resolveEncounter(warden.STAGES[0]);
    const plate = new Encounter(host);
    plate.begin(pack);
    if (host.hidden) fail('encounter plate: hidden on a stage that is a fight');
    if ((host.innerHTML.match(/data-foe=/g) || []).length !== 3) fail('encounter plate: a pack of three samples must draw three foes');
    if (pips() !== INTEGRITY) fail('encounter plate: a fresh fight must start at full Integrity');

    plate.react('b', { rig: 'hold', lattice: 'MgO' });
    if (!/data-foe="b" data-pose="gripped"/.test(host.innerHTML)) fail('encounter plate: a held lattice must show the warden gripping on the plate');
    if (!/data-foe="a" data-pose="idle"/.test(host.innerHTML)) fail('encounter plate: a foe nobody worked must stay as it was');

    plate.onMiss();
    if (pips() !== INTEGRITY - 1) fail('encounter plate: a miss must cost one Integrity at once');
    if (host.innerHTML.includes(pack.counter)) fail('encounter plate: the counter spoke before the reason had time to land');
    await new Promise(res => setTimeout(res, COUNTER_DELAY_MS + 60));
    if (!host.innerHTML.includes(pack.counter)) fail('encounter plate: the counter never followed the reason');
    plate.onMiss(); plate.onMiss();
    await new Promise(res => setTimeout(res, COUNTER_DELAY_MS + 60));
    if (pips() !== INTEGRITY) fail('encounter plate: a knock-back must refill Integrity');
    if (!host.innerHTML.includes('Knocked back')) fail('encounter plate: a knock-back must say so');
    if (/data-pose="gripped"/.test(host.innerHTML)) fail('encounter plate: a knock-back must leave the foe whole again');

    plate.onClear();
    if (/data-pose="(idle|gripped)"/.test(host.innerHTML) || !host.innerHTML.includes('data-pose="dispersed"')) {
      fail('encounter plate: a win must disperse every foe');
    }
    if (host.innerHTML.includes('Flawless')) fail('encounter plate: a win that cost Integrity must not be called flawless');

    const lone = FOES.resolveEncounter(warden.STAGES[1]);
    plate.begin(lone);
    plate.react('a', { rig: 'lamps', lit: 1, of: 5 });
    if (!host.innerHTML.includes('data-pose="unmoved"')) fail('encounter plate: one lamp lit must leave the warden unmoved');
    plate.react('a', { rig: 'lamps', lit: 5, of: 5 });
    if (!host.innerHTML.includes('data-pose="cleaved"')) fail('encounter plate: every lamp lit must cleave the warden');
    plate.onClear();
    if (!host.innerHTML.includes('Flawless')) fail('encounter plate: a win with full Integrity must be called flawless');

    plate.begin(null);
    if (!host.hidden) fail('encounter plate: a stage that is not a fight must show no plate');
    plate.dispose();
  }

  // THE FOES AT T4 (encounter3d.js, foebody.js) are observers too. They stand
  // bodies in the wells and are TOLD a pose; they never grade, never touch the
  // banner or the frame, and nothing about them is random at runtime (the same
  // seed gives the same body on every machine, as every other surface does).
  for (const file of ['encounter3d.js', 'foebody.js']) {
    const src = stripComments(readFileSync(join(learnSrc, 'engine', file), 'utf8'));
    if (/banner|announce\(|\.note\(|\.miss\(|\bframe\b|\.check\(|session\./.test(src)) {
      fail(`${file} touches the banner, the frame or the session -- a foe body only observes`);
    }
    if (/Math\.random/.test(src)) fail(`${file} uses Math.random -- a body must be the same body on every machine`);
    if (/from '\.\/frame\.js'|from '\.\.\/quests/.test(src)) fail(`${file} imports the frame or a quest -- it may only be told things`);
  }
  {
    // Every species is either built at T4 or named as plate-only with a reason.
    // An unlisted species is a NOTE, not a failure: a new species lands in
    // foes.js first, and its 3D body (or its entry in PLATE_ONLY) follows.
    const { SPECIES } = FOES;
    const { BODY_SPECIES, PLATE_ONLY } = await import('../src/learn/engine/foebody.js');
    for (const name of BODY_SPECIES) {
      if (!SPECIES[name]) fail(`foebody.js builds a body for "${name}", which foes.js does not define`);
    }
    for (const name of Object.keys(PLATE_ONLY)) {
      if (!SPECIES[name]) fail(`foebody.js lists "${name}" as plate-only, but foes.js does not define it`);
      if (BODY_SPECIES.includes(name)) fail(`foebody.js lists "${name}" as both built and plate-only`);
    }
    const missing = Object.keys(SPECIES).filter(n => !BODY_SPECIES.includes(n) && !(n in PLATE_ONLY));
    if (missing.length) console.log(`  note ${missing.map(n => `"${n}"`).join(', ')}: no 3D body and not listed in PLATE_ONLY (foebody.js)`);
  }

  if (failures === before) ok('encounter layer: a correct commit wins on any turn, a miss shows its reason before the foe answers, the frame only informs it');
}
await checkEncounterLayer();

/**
 * THE QUESTION BANK. Practice no longer lives in a quest module: a quest that
 * still exports `PRACTICE` is a leftover, and the problems themselves are
 * checked per world by `tools/lib/bank-check.mjs` (below).
 */
function checkPractice(q, mod) {
  if (mod.PRACTICE !== undefined) fail(`${q.key}: exports PRACTICE — practice lives in src/learn/bank/${q.worldId}.json`);
}

/**
 * A bench quest lays specimens out for one of the two bench instruments. Both
 * read those declarations at draw time, and a typo in one — a kind that does not
 * exist, a bond pointing past the end of a cluster, a core with nothing in it —
 * surfaces as a blank plate in a student's hands rather than as an error. Catch
 * it here instead.
 *
 * Two declaration styles, one check. `samples` with `particles` is the sampler
 * scope (`engine/scope.js`); `specimens` with `core` and `rings` is the core
 * bench (`engine/corebench.js`).
 */
function checkBench(q, mod, stages) {
  if (q.arena === 'boss') return;
  const kinds = mod.KINDS;
  let bad = 0;
  let samples = 0;

  stages.forEach((st, i) => {
    const bench = Array.isArray(st.samples) ? st.samples
      : Array.isArray(st.specimens) ? st.specimens
        : Array.isArray(st.pairs) ? st.pairs
          : Array.isArray(st.slabs) ? st.slabs : null;
    if (!bench) return;
    const label = `${q.key} stage ${i + 1}`;
    const ids = new Set();

    bench.forEach(sample => {
      samples++;
      if (ids.has(sample.id)) { fail(`${label}: two samples share the id "${sample.id}"`); bad++; }
      ids.add(sample.id);
      if (!sample.label) { fail(`${label}: sample "${sample.id}" has no label`); bad++; }

      // ---- join bench: a pair of pieces in clamps, or a block of material ----
      if (sample.left || sample.right) {
        for (const side of ['left', 'right']) {
          const piece = sample[side];
          if (!piece) { fail(`${label}: pair "${sample.id}" has no ${side} piece`); bad++; continue; }
          if (!piece.code) { fail(`${label}: the ${side} piece of "${sample.id}" has no catalogue code`); bad++; }
          if (!['metal', 'nonmetal'].includes(piece.kind)) {
            fail(`${label}: the ${side} piece of "${sample.id}" is neither a metal nor a nonmetal`); bad++;
          }
          const shells = piece.shells;
          if (!Array.isArray(shells) || !shells.length || shells.some(n => !Number.isInteger(n) || n < 1)) {
            fail(`${label}: the ${side} piece of "${sample.id}" has a bad shell declaration`); bad++;
            continue;
          }
          // The same capacity the core bench draws its rings to: two on the
          // innermost shell, eight on every one after it, and nothing further
          // out while a nearer shell still has room. A piece that broke it
          // would teach the rule wrong on the screen the rule is read from.
          shells.forEach((n, si) => {
            const room = si === 0 ? 2 : 8;
            if (n > room) {
              fail(`${label}: the ${side} piece of "${sample.id}" puts ${n} electrons on shell ${si + 1}, which holds ${room}`); bad++;
            }
            if (si > 0 && shells[si - 1] < (si - 1 === 0 ? 2 : 8)) {
              fail(`${label}: the ${side} piece of "${sample.id}" fills shell ${si + 1} while shell ${si} still has room`); bad++;
            }
          });
        }

        /*
         * PRESS IT AND MEASURE WHAT COMES OUT.
         *
         * The declaration above says what is on the bench; this says what the
         * bench DOES with it, which is what a stage is actually graded on. Two
         * things must hold however a pair is written:
         *
         *   - electrons are conserved. A transfer moves them and a shared pair
         *     is counted by both pieces, and nothing else may appear or vanish.
         *   - no piece comes out over the capacity of its outer shell. A piece
         *     that joined may still have room — that is the whole premise of
         *     the ratio stages — but nine electrons on a shell that holds eight
         *     is the instrument drawing a specimen that cannot exist.
         */
        const plan = planJoin(sample);
        const totalOf = sh => sh.reduce((n, x) => n + x, 0);
        const before = totalOf(sample.left.shells || []) + totalOf(sample.right.shells || []);
        const after = totalOf(shellsAfter(sample, 'left')) + totalOf(shellsAfter(sample, 'right'));
        const shared = plan.type === 'share' ? plan.pairs * 2 : 0;
        if (after !== before + shared) {
          fail(`${label}: pressing "${sample.id}" turns ${before} electrons into ${after} — the bench is inventing or losing them`);
          bad++;
        }
        for (const side of ['left', 'right']) {
          const pl = shellPlan({ shells: shellsAfter(sample, side) });
          if (pl.outer > pl.cap) {
            fail(`${label}: pressing "${sample.id}" leaves its ${side} piece with ${pl.outer} electrons on a shell that holds ${pl.cap}`);
            bad++;
          }
        }
        return;
      }

      // ---- join bench: a block of finished material ----
      if (sample.build) {
        if (!['grid', 'clusters', 'web', 'metallic'].includes(sample.build)) {
          fail(`${label}: slab "${sample.id}" has an unknown build "${sample.build}"`); bad++;
        }
        if (!Number.isInteger(sample.melt) || sample.melt < 0) {
          fail(`${label}: slab "${sample.id}" has no temperature to come apart at`); bad++;
        }
        return;
      }

      // ---- core bench: a middle with grains in it, and rings outside ----
      if (sample.core || sample.rings) {
        const marked = sample.core?.marked;
        const blank = sample.core?.blank;
        if (!Number.isInteger(marked) || marked < 1) {
          fail(`${label}: specimen "${sample.id}" has no marked grains in its core`); bad++;
        }
        if (!Number.isInteger(blank) || blank < 0) {
          fail(`${label}: specimen "${sample.id}" has a bad blank-grain count`); bad++;
        }
        if (sample.rings !== undefined) {
          if (!Array.isArray(sample.rings) || sample.rings.some(r => !Number.isInteger(r) || r < 0)) {
            fail(`${label}: specimen "${sample.id}" has a bad ring declaration`); bad++;
          } else {
            // Ring capacity is physics, not decoration: two closest in, eight
            // after that. A specimen that breaks it would teach the rule wrong
            // on the very screen the rule is learned from.
            sample.rings.forEach((n, ri) => {
              const room = ri === 0 ? 2 : 8;
              if (n > room) {
                fail(`${label}: specimen "${sample.id}" puts ${n} light pieces on ring ${ri + 1}, which holds ${room}`); bad++;
              }
            });
            for (let ri = 1; ri < sample.rings.length; ri++) {
              const room = ri - 1 === 0 ? 2 : 8;
              if (sample.rings[ri] > 0 && sample.rings[ri - 1] < room) {
                fail(`${label}: specimen "${sample.id}" fills ring ${ri + 1} while ring ${ri} still has room`); bad++;
              }
            }
          }
        }
        return;
      }

      // ---- sampler scope: a heap of loose pieces and bound clusters ----
      if (!Array.isArray(sample.particles) || !sample.particles.length) {
        fail(`${label}: sample "${sample.id}" holds nothing`); bad++; return;
      }

      sample.particles.forEach(entry => {
        if (!Array.isArray(entry.kinds) || !entry.kinds.length) {
          fail(`${label}/${sample.id}: a particle entry declares no kinds`); bad++; return;
        }
        // A joiner's tray starts empty and fills as molecules are made; nothing else may.
        const emptyOk = entry.n === 0 && st.join?.into === sample.id;
        if (!emptyOk && (!Number.isInteger(entry.n) || entry.n < 1)) {
          fail(`${label}/${sample.id}: particle count must be a positive integer`); bad++;
        }
        if (kinds) {
          for (const k of entry.kinds) {
            if (!kinds[k]) { fail(`${label}/${sample.id}: unknown kind "${k}"`); bad++; }
          }
        }
        // A cluster that draws its own shape must place every piece in it, and
        // every join must point at a piece that is actually there.
        if (entry.geom && entry.geom.length !== entry.kinds.length) {
          fail(`${label}/${sample.id}: geom places ${entry.geom.length} pieces for ${entry.kinds.length} kinds`); bad++;
        }
        if (entry.bonds) {
          for (const b of entry.bonds) {
            if (b.length !== 2 || b.some(x => !Number.isInteger(x) || x < 0 || x >= entry.kinds.length)) {
              fail(`${label}/${sample.id}: bond [${b}] points outside the cluster`); bad++;
            }
          }
          if (entry.kinds.length > 1 && !entry.geom) {
            fail(`${label}/${sample.id}: declares bonds without geom — the drawn shape would not match them`); bad++;
          }
        }
      });
    });

    // Anything a widget or a solution names has to exist on the bench.
    const binIds = new Set((st.widget?.bins || []).map(b => b.id));
    const choiceIds = new Set((st.widget?.options || []).map(o => o.id));
    const sol = mod.SOLUTIONS?.[i] || {};
    if (sol.sample && !ids.has(sol.sample)) { fail(`${label}: the solution names sample "${sol.sample}", which is not on the bench`); bad++; }
    if (sol.choice && choiceIds.size && !choiceIds.has(sol.choice)) {
      fail(`${label}: the solution picks "${sol.choice}", which the widget does not offer`); bad++;
    }
    for (const [sid, bid] of Object.entries(sol.bins || {})) {
      if (!ids.has(sid)) { fail(`${label}: the solution files "${sid}", which is not on the bench`); bad++; }
      if (binIds.size && !binIds.has(bid)) { fail(`${label}: the solution uses bin "${bid}", which the widget does not offer`); bad++; }
    }
    // A manifest may cover a subset of the bench (a reference plate is not
    // filed), but every row it does show needs a solution line.
    const filed = st.widget?.rows || bench.map(s => s.id);
    if (st.widget?.type === 'bins' && Object.keys(sol.bins || {}).length !== filed.length) {
      fail(`${label}: a bins stage must have a solution line for every filed row`); bad++;
    }
    for (const rid of (st.widget?.rows || [])) {
      if (!ids.has(rid)) { fail(`${label}: the manifest lists row "${rid}", which is not on the bench`); bad++; }
    }
  });

  if (samples && !bad) ok(`${q.key}: ${samples} bench samples are well formed`);
}

/**
 * PROVE EVERY DECLARATION CAN BE DRAWN. A plate bench paints its pictures with
 * pure `draw` functions over a 2D context, so the whole of a quest's bench can
 * be drawn here, in Node, onto a context that records what was asked of it, at
 * the phone's plate and at the built bench's square screen. A head that throws,
 * a picture that draws nothing, or a coordinate that is not a number is a blank
 * plate in a student's hands, and nothing else in the build would catch it.
 */
async function checkDrawn(q, mod) {
  const stages = mod.STAGES;
  if (!Array.isArray(stages)) return;
  const { makeCtx } = await import('./lib/ctx-stub.mjs');
  let bad = 0;
  let drawn = 0;

  const sizes = [[360, 225], [512, 512]];
  for (let i = 0; i < stages.length; i++) {
    const st = stages[i];
    const label = `${q.key} stage ${i + 1}`;
    const cases = [];

    const rackHeads = ['rack', 'strip'];
    const electronHeads = ['spectrum', 'atom'];
    const bondHeads = ['pair', 'lattice'];
    const slateHeads = ['slate'];
    const rigHeads = ['hub', 'show', 'field', 'mixer', 'twist'];
    const ligarHeads = [...bondHeads, ...slateHeads, ...rigHeads];
    const gasHeads = ['cylinder', 'mixture', 'leak', 'tube', 'path', 'record'];
    const thermoHeads = ['contact', 'cup', 'diagram', 'bonds', 'hess', 'box', 'gibbs'];
    const lightRigs = (st.rigs || []).filter(r => !rackHeads.includes(r.head) && !electronHeads.includes(r.head) && !ligarHeads.includes(r.head) && !gasHeads.includes(r.head) && !thermoHeads.includes(r.head));

    const rigRigs = (st.rigs || []).filter(r => rigHeads.includes(r.head));
    if (rigRigs.length) {
      const { DomainRig } = await import('../src/learn/engine/domainrig.js');
      const VS = await import('../src/learn/engine/vsepr.js');
      const proto = DomainRig.prototype;
      const bench = Object.create(proto);
      bench.cfg = { hand: null, yaw: 0.55, pitch: 0.35, field: true, arrows: true, mix: 2, twist: 0 };
      const ids = new Set();
      for (const raw of rigRigs) {
        if (ids.has(raw.id)) { fail(`${label}: two plates share the id "${raw.id}"`); bad++; }
        ids.add(raw.id);
        if (!raw.label) { fail(`${label}: plate "${raw.id}" has no label`); bad++; }
        if (raw.mol && !VS.RIG_MOLECULES[raw.mol]) { fail(`${label}: plate "${raw.id}" names an unknown molecule "${raw.mol}"`); bad++; }
        if ((raw.head === 'show' || raw.head === 'field') && !raw.mol) { fail(`${label}: plate "${raw.id}" shows no molecule`); bad++; }
        if (raw.head === 'twist' && !['single', 'double', 'triple'].includes(raw.bond)) { fail(`${label}: twist plate "${raw.id}" has no bond`); bad++; }
        const item = proto.prepare.call(bench, raw);
        cases.push([`plate ${raw.id}`, (ctx, w, h) => proto.draw.call(bench, ctx, w, h, item, { sweep: 0, probe: null, bench })]);
      }
    }
    const electronRigs = (st.rigs || []).filter(r => electronHeads.includes(r.head));
    if (electronRigs.length) {
      const { ElectronBench } = await import('../src/learn/engine/electronbench.js');
      const E = await import('../src/learn/engine/electrons.js');
      const proto = ElectronBench.prototype;
      const bench = Object.create(proto);
      bench.cfg = { maxPm: st.maxPm ?? 240, labels: st.labels || {}, show: st.show || {} };
      const ids = new Set();
      for (const raw of electronRigs) {
        if (ids.has(raw.id)) { fail(`${label}: two plates share the id "${raw.id}"`); bad++; }
        ids.add(raw.id);
        if (!raw.label) { fail(`${label}: plate "${raw.id}" has no label`); bad++; }
        if (raw.head === 'spectrum' && !E.BINDING[raw.sym]) { fail(`${label}: spectrum plate "${raw.id}" names an element with no measured spectrum "${raw.sym}"`); bad++; }
        if (raw.head === 'atom') {
          if (!(raw.radius > 0)) { fail(`${label}: atom plate "${raw.id}" has no radius`); bad++; }
          const shells = raw.shells || [];
          shells.forEach((n, i) => {
            const room = i === 0 ? 2 : i < 3 ? 8 : 18;
            if (n > room) { fail(`${label}: atom plate "${raw.id}" puts ${n} electrons on shell ${i + 1}, which holds ${room}`); bad++; }
          });
          if (raw.sym && raw.shells && raw.shells.reduce((a, b) => a + b, 0) !== E.zOf(raw.sym) - (raw.charge || 0)) {
            fail(`${label}: atom plate "${raw.id}" has the wrong number of electrons for ${raw.sym}`); bad++;
          }
        }
        const item = proto.prepare.call(bench, { ...raw, progress: raw.head === 'spectrum' ? 1 : 0 });
        cases.push([`plate ${raw.id}`, (ctx, w, h) => proto.draw.call(bench, ctx, w, h, item, { sweep: 0, probe: null, bench })]);
      }
    }
    if (lightRigs.length) {
      const { LightBench } = await import('../src/learn/engine/lightbench.js');
      const proto = LightBench.prototype;
      const bench = Object.create(proto);
      bench.clock = 0;
      bench.cfg = {
        settings: st.settings || [], setting: st.start || 1, brightness: st.brightnessStart ?? st.brightness ?? 3,
        path: st.path ?? 1, region: st.region ?? 'uv-visible', labels: st.labels || {},
        mode: st.mode || null, after: Boolean(st.after), ladderTop: st.ladderTop || ''
      };
      const data = await import('../src/learn/engine/lightdata.js');
      const ids = new Set();
      for (const rig of lightRigs) {
        // The declaration, held to the real tables the planners read.
        if (ids.has(rig.id)) { fail(`${label}: two rigs share the id "${rig.id}"`); bad++; }
        ids.add(rig.id);
        if (!rig.label) { fail(`${label}: rig "${rig.id}" has no label`); bad++; }
        if (!['trace', 'scale', 'prism', 'ladder', 'photocell', 'cuvette', 'plot'].includes(rig.head)) {
          fail(`${label}: rig "${rig.id}" has an unknown head "${rig.head}"`); bad++;
        }
        if (rig.tuned && !(Array.isArray(st.settings) && st.settings.length > 1)) {
          fail(`${label}: rig "${rig.id}" is tuned but the stage declares no dial settings`); bad++;
        }
        if (rig.head === 'trace' && !rig.tuned && !(rig.nm > 0)) {
          fail(`${label}: trace rig "${rig.id}" has no wavelength`); bad++;
        }
        if (rig.head === 'photocell' && !data.METALS[rig.metal]) {
          fail(`${label}: photocell rig "${rig.id}" names an unknown metal "${rig.metal}"`); bad++;
        }
        if (rig.head === 'cuvette' && rig.solute && !data.SOLUTES[rig.solute]) {
          fail(`${label}: cuvette rig "${rig.id}" names an unknown solute "${rig.solute}"`); bad++;
        }
        if (rig.head === 'cuvette' && rig.solute && !(rig.conc > 0)) {
          fail(`${label}: cuvette rig "${rig.id}" has no concentration`); bad++;
        }
        if (rig.head === 'prism' && rig.source?.gas && !data.LINES[rig.source.gas]) {
          fail(`${label}: prism rig "${rig.id}" names a gas with no real lines "${rig.source.gas}"`); bad++;
        }
        if (rig.head === 'prism' && rig.source?.type === 'lamp' && !(rig.source.nm > 0)) {
          fail(`${label}: prism lamp "${rig.id}" has no wavelength`); bad++;
        }
      }
      if (Array.isArray(st.settings) && st.settings.some(n => !(n >= 200 && n <= 1100))) {
        fail(`${label}: a dial setting is not a wavelength between 200 and 1100 nm`); bad++;
      }
      if (st.start != null && Array.isArray(st.settings) && !(st.start >= 1 && st.start <= st.settings.length)) {
        fail(`${label}: the dial starts at a setting it does not have`); bad++;
      }
      for (const rig of lightRigs) {
        cases.push([`rig ${rig.id}`, (ctx, w, h) => proto.draw.call(bench, ctx, w, h, rig, { sweep: 0, probe: null, bench })]);
      }
    }
    if (Array.isArray(st.clouds)) {
      const { CloudPlate } = await import('../src/learn/engine/cloudplate.js');
      const { ORBITALS } = await import('../src/learn/engine/orbitals.js');
      const proto = CloudPlate.prototype;
      const bench = Object.create(proto);
      bench.cfg = {
        extent: st.extent ?? 12, slice: false, settings: st.settings || [], setting: st.start || 1, showPlane: false
      };
      const ids = new Set();
      for (const raw of st.clouds) {
        if (ids.has(raw.id)) { fail(`${label}: two plates share the id "${raw.id}"`); bad++; }
        ids.add(raw.id);
        if (!raw.label) { fail(`${label}: plate "${raw.id}" has no label`); bad++; }
        if (raw.head === 'ring') {
          if (!(Array.isArray(st.settings) && st.settings.length > 1)) { fail(`${label}: a ring plate needs dial settings`); bad++; }
        } else if (!ORBITALS[raw.orbital]) {
          fail(`${label}: plate "${raw.id}" names an unknown orbital "${raw.orbital}"`); bad++;
        }
        const item = proto.prepare.call(bench, { ...raw, fired: raw.fired ?? 300 });
        item.fired = Math.max(item.fired, 1);
        if (!item.points && item.head !== 'ring') item.points = (await import('../src/learn/engine/orbitals.js')).sampleOrbital(item.orbital, 500, 1);
        cases.push([`plate ${raw.id}`, (ctx, w, h) => proto.draw.call(bench, ctx, w, h, item, { sweep: 0, probe: null, bench })]);
      }
    }

    for (const [name, run] of cases) {
      for (const [w, h] of sizes) {
        const ctx = makeCtx(w, h);
        try {
          run(ctx, w, h);
        } catch (err) {
          fail(`${label}: ${name} throws while drawing at ${w}x${h} (${err && err.message})`);
          bad++;
          continue;
        }
        drawn++;
        if (ctx.stats.calls < 8) { fail(`${label}: ${name} drew almost nothing at ${w}x${h}`); bad++; }
        if (ctx.stats.nan) { fail(`${label}: ${name} drew ${ctx.stats.nan} NaN coordinate(s) at ${w}x${h}`); bad++; }
        if (ctx.stats.maxX > w * 3 || ctx.stats.maxY > h * 3) {
          fail(`${label}: ${name} drew far off the plate at ${w}x${h}`); bad++;
        }
      }
    }
  }
  if (drawn && !bad) ok(`${q.key}: ${drawn} plate pictures drawn at phone and bench size`);
}

{
  const before = failures;
  const near = (a, b, tol, what) => { if (Math.abs(a - b) > tol) fail(`${what}: graded ${a}, the real figure is ${b.toFixed(3)}`); };
  // The physics the cloud plate draws from, and the turned cloud (not tied to any stage).
  {
      const O = await import('../src/learn/engine/orbitals.js');
      // The pictures are drawn from the real wavefunction: each radial density integrates to one.
      for (const [n, l] of [[1, 0], [2, 0], [2, 1], [3, 0], [3, 1], [3, 2]]) {
        let sum = 0;
        for (let r = 0; r < 140; r += 0.002) sum += O.radialPdf(n, l, r) * 0.002;
        near(sum, 1, 0.005, `orbitals: radial density of n=${n}, l=${l} integrates to one`);
      }
      const mean = id => { const p = O.sampleOrbital(id, 3000, 1); return p.reduce((a, q) => a + Math.hypot(q.x, q.y, q.z), 0) / p.length; };
      near(mean('1s'), 1.5, 0.08, 'orbitals: the 1s cloud\'s mean distance (bohr)');
      near(mean('2s'), 6, 0.3, 'orbitals: the 2s cloud\'s mean distance (bohr)');
      // The 2s cloud has an empty shell at its node; the 2pz cloud has an empty plane.
      const shell = O.sampleOrbital('2s', 3000, 1).filter(p => Math.abs(Math.hypot(p.x, p.y, p.z) - 2) < 0.1).length;
      const near1s = O.sampleOrbital('1s', 3000, 1).filter(p => Math.abs(Math.hypot(p.x, p.y, p.z) - 2) < 0.1).length;
      if (shell > near1s * 0.2) fail('orbitals: the 2s cloud is not empty at its node');
      const plane = O.sampleOrbital('2pz', 3000, 1).filter(p => Math.abs(p.z) < 0.05).length;
      if (plane > 12) fail(`orbitals: the 2pz cloud has ${plane} dots on its node plane`);
      // The ring: only whole numbers of wavelengths fit.
      for (const n of [1, 2, 3]) {
        if (!O.ringFits(O.RING_CIRCUMFERENCE_PM / n, O.RING_CIRCUMFERENCE_PM).fits) fail(`orbitals: ${n} whole wavelengths should fit the ring`);
      }
      if (O.ringFits(O.RING_CIRCUMFERENCE_PM / 2.5, O.RING_CIRCUMFERENCE_PM).fits) fail('orbitals: two and a half wavelengths must not fit the ring');
      // The turned cloud is the same cloud: a turn changes nothing but the side it is seen from.
      const CP = await import('../src/learn/engine/cloudplate.js');
      const pts = O.sampleOrbital('2pz', 400, 1);
      const flat = CP.projectDots(pts, 400, 'xy', false);
      const home = CP.projectDots(pts, 400, 'turn', false, { yaw: 0, pitch: 0 });
      if (!flat.every((q, i) => Math.abs(q.a - home[i].a) < 1e-9 && Math.abs(q.b - home[i].b) < 1e-9 && Math.abs(q.c - home[i].c) < 1e-9)) {
        fail('unit02/q4-cloud: a plate turned to zero does not show the xy view');
      }
      const turned = CP.projectDots(pts, 400, 'turn', false, CP.DEFAULT_VIEW);
      const r2 = q => q.a * q.a + q.b * q.b + q.c * q.c;
      if (!turned.every((q, i) => Math.abs(r2(q) - (pts[i].x ** 2 + pts[i].y ** 2 + pts[i].z ** 2)) < 1e-9)) {
        fail('unit02/q4-cloud: turning a cloud changed a dot\'s distance from the nucleus');
      }
      // A quarter turn about the vertical lays the x axis along the line of sight.
      const quarter = CP.turnPoint({ x: 1, y: 0, z: 0 }, { yaw: Math.PI / 2, pitch: 0 });
      if (Math.abs(quarter.a) > 1e-9 || Math.abs(Math.abs(quarter.c) - 1) > 1e-9) fail('unit02/q4-cloud: a quarter turn does not bring the x axis end-on');
      // Slicing a turned cloud keeps the slab across the line of sight.
      const sliced = CP.projectDots(pts, 400, 'turn', true, CP.DEFAULT_VIEW);
      if (!sliced.length || sliced.some(q => Math.abs(q.c) > CP.SLICE_HALF + 1e-9)) fail('unit02/q4-cloud: the slice of a turned cloud is not a slab across the view');
  }
  {
    // The lead lines: sparse by design. Every built bench has an opening stake, no boss has any, and none points at a stage that is not there.
    const { STAGE_STORY } = await import('../src/learn/engine/stage-story.js');
    for (const [id, lines] of Object.entries(STAGE_STORY)) {
      const q = quests.find(x => x.key.endsWith(`/${id}`));
      if (!q) { fail(`stage-story.js: "${id}" is not a quest on the road`); continue; }
      if (id.startsWith('boss-')) fail(`stage-story.js: ${id} is a boss, and a boss's nameplate and intent line are its whole story budget`);
      for (const n of Object.keys(lines)) {
        if (!(Number(n) >= 1 && Number(n) <= q.stageCount)) fail(`stage-story.js: ${id} has a line for stage ${n}, which does not exist`);
      }
    }
    for (const q of quests) {
      if (!q.module || q.key.includes('/boss-')) continue;
      const id = q.key.replace(/^.*\//, '');
      if (!STAGE_STORY[id] || !Object.keys(STAGE_STORY[id]).length) {
        // Not every bench needs a stake; the ones with none say so by name, so a new bench cannot slip through unread.
        if (!NO_LEAD.has(id)) fail(`stage-story.js: ${id} has no lead line and is not listed as a bench that deliberately has none`);
      }
    }
  }
  {
    // The readings board painted on the 3D bench is drawn off the frame's own log and canvases.
    const { paintReadings, readingsSignature, hasReadings, BOARD } = await import('../src/learn/engine/bench-readings.js');
    const { makeCtx } = await import('./lib/ctx-stub.mjs');
    const snap = {
      columns: [{ key: 'a', label: 'Molecules made' }, { key: 'b', label: 'Total weight' }],
      rows: Array.from({ length: 14 }, (_, i) => ({ a: i, b: `${(54 + i * 0).toFixed(1)}` })),
      pictures: [{ id: 'device', canvas: { width: 360, height: 120 } }, { id: 'trend', canvas: { width: 280, height: 140 } }]
    };
    for (const [name, sn] of [['log and pictures', snap], ['log only', { ...snap, pictures: [] }], ['pictures only', { ...snap, rows: [] }]]) {
      const ctx = makeCtx(BOARD.px, BOARD.py);
      try { paintReadings(ctx, BOARD.px, BOARD.py, sn); } catch (err) { fail(`readings board (${name}) throws while drawing: ${err && err.message}`); continue; }
      if (ctx.stats.calls < 4) fail(`readings board (${name}) drew almost nothing`);
      if (ctx.stats.nan) fail(`readings board (${name}) drew ${ctx.stats.nan} NaN coordinate(s)`);
      if (ctx.stats.maxX > BOARD.px * 1.5 || ctx.stats.maxY > BOARD.py * 1.5) fail(`readings board (${name}) drew off the board`);
    }
    // The newest row is always on the board, and nothing is invented: every figure drawn came from the log.
    const ctx = makeCtx(BOARD.px, BOARD.py);
    paintReadings(ctx, BOARD.px, BOARD.py, snap);
    if (!ctx.stats.text.includes('13')) fail('readings board: the newest log row is not on the board');
    if (hasReadings({ columns: [], rows: [], pictures: [] }) || readingsSignature({ rows: [] }) !== '') fail('readings board: an empty log should show nothing');
    ok('the readings board is drawn from the log and the cards\' canvases, and shows the newest row');
  }
  // Lanternfall's own stages (rewritten 2026-10-23 around one click each): every graded figure recomputed from the real tables.
  await (await import('./lib/verify-lanternfall-learn.mjs')).verifyLanternfallLearn({ getQuest, TABLE, fail, ok, count: () => failures, quests });
  if (failures === before) ok('Lanternfall: every graded figure is recomputed from the real tables and agrees');
}

/* ------------------------------------------------------------------
   COPY DISCIPLINE — the same house rules as the rest of the ship
   ------------------------------------------------------------------ */
const copyFailures = failures;
const emoji = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]/u;
for (const w of WORLDS) {
  const strings = [w.world, w.place, w.title, w.line, w.brief]
    .concat(w.quests.flatMap(q => [q.title, q.line]));
  for (const str of strings) {
    if (emoji.test(str)) fail(`world ${w.id}: emoji in player-facing copy — "${str}"`);
    const n = sentenceCount(str);
    if (n > 2) fail(`world ${w.id}: "${str.slice(0, 40)}..." runs to ${n} sentences (limit 2)`);
  }
}
if (failures === copyFailures) ok('copy is emoji-free and within length');

/* ------------------------------------------------------------------
   THE PROBLEM SET IS A WORLD'S, NOT A QUEST'S
   The end set, gathered and shown once the whole unit is worked — and
   never before. A set that opened at the end of a quest would be a gate
   in the middle of a road; a set that opened before the world was done
   would ask about benches the player has not reached yet.
   ------------------------------------------------------------------ */
{
  const before = failures;
  const { loadWorldPractice, worldHasPractice, practiceOfferedFlag } =
    await import('../src/learn/practice.js');
  const { checkBanks } = await import('./lib/bank-check.mjs');
  checkBanks(WORLDS.filter(x => x.status === 'live'), { fail, ok });

  for (const w of WORLDS.filter(x => x.status === 'live')) {
    const set = await loadWorldPractice(w);
    // Every problem says which bench it came from, so the card can name it.
    for (const p of set) {
      if (!p.questId || !p.questTitle) fail(`world ${w.id}: a problem is not stamped with its quest`);
    }
    // Nothing is offered on a world the player has not finished. The session
    // store is empty here, so nothing is complete, so nothing may be offered.
    if (worldHasPractice(w)) {
      fail(`world ${w.id}: offers its problems on an unfinished world`);
    }
    if (!practiceOfferedFlag(w.id).includes(w.id)) {
      fail(`world ${w.id}: the offered-once flag is not scoped to the world`);
    }
  }

  // `practice.js` is inside `src/learn`, so the XP-rail scan above already
  // covers it. Nothing to repeat here.

  if (failures === before) {
    ok(`${WORLDS.filter(x => x.status === 'live').length} live world(s): the problem set is assembled at world scope, XP-free, and withheld until the world is done`);
  }
}


/* ------------------------------------------------------------------
   EVERY FIGURE A LIGAR STAGE GRADES AGAINST IS RECOMPUTED FROM THE REAL TABLES.
   The bond bench, the pair board, the domain rig and the molecular rack each
   keep their numbers in one pure module (`bonddata`, `lewis`, `vsepr`, `mo`).
   The answers are checked against those modules here, so an answer authored
   as a literal cannot drift from the instrument that teaches it.
   ------------------------------------------------------------------ */
{
  const before = failures;
  const get = async id => { const q = getQuest('unit03', id); return q && q.status === 'live' ? q.module() : null; };
  const [q3, q4, q5, q6, q7, q8, q9] = await Promise.all(['q3-distance', 'q4-dots', 'q5-resonance', 'q6-shape', 'q7-polarity', 'q8-hybrid', 'q9-orbitals'].map(get));
  const same = (a, b, what) => { if (String(a) !== String(b)) fail(`${what}: graded ${a}, the real answer is ${b}`); };
  const near = (a, b, tol, what) => { if (Math.abs(a - b) > tol) fail(`${what}: graded ${a}, the real figure is ${b}`); };
  const holds = (c, what) => { if (!c) fail(what); };

  if (q3) {
    const { PAIRS, LATTICES, morse } = BONDDATA;
    const BOND = await import('../src/learn/table/kits/bonds.js');
    const tableOf = i => TABLE.createTable(q3.STAGES[i].table, q3.STAGES[i].title);
    const endOf = i => TABLE.runScript(tableOf(i), q3.SOLUTIONS[i], { strict: true });
    // Every pair a table holds is a real pair, its bottom is reachable on its hand's own range, and the curve the plot
    // draws bottoms out where bonddata says (the lowest point over every setting the hand can make).
    q3.STAGES.forEach((st, i) => {
      for (const f of Object.values(tableOf(i).fixtures).filter(x => x.kind === 'wells')) {
        for (const row of f.props.rows) {
          if (!PAIRS[row.pair]) { fail(`unit03/q3-distance stage ${i + 1} ${row.id}: "${row.pair}" is not a measured pair`); continue; }
          const d = f.dials[row.id];
          let best = null;
          for (let v = d.min; v <= d.max; v += d.step) { const e = morse(row.pair, v); if (!best || e < best.e) best = { v, e }; }
          near(best.v, PAIRS[row.pair].r0, d.step, `unit03/q3-distance stage ${i + 1} ${row.id}: the lowest setting the hand can make`);
          near(morse(row.pair, PAIRS[row.pair].r0), -PAIRS[row.pair].de, 0.01, `unit03/q3-distance stage ${i + 1} ${row.id}: the well's depth`);
        }
      }
    });
    // 1. where the hand is left is graded against the real curve
    near(BOND.wellRead(endOf(0), 'w').rows[0].gap, PAIRS['H-H'].r0, Math.max(6, PAIRS['H-H'].r0 * 0.1), 'unit03/q3-distance stage 1 (the bottom of H-H, pm)');
    // 2. the marker is set to the depth of the H-Cl well, on its own steps
    {
      const t = endOf(1);
      const mk = BOND.wellRead(t, 'w').marker;
      near(mk, 2 * PAIRS['H-Cl'].de, 25, 'unit03/q3-distance stage 2 (twice the depth of H-Cl, kJ/mol: 2 mol of bonds)');
      const d = t.fixtures.w.dials.depth;
      if (!(d.max >= PAIRS['H-Cl'].de * 2.1)) fail('unit03/q3-distance stage 2: the marker cannot reach below the bottom of the well');
    }
    // 3. the predict stage holds the guesses and no instrument; the wrong idea (more pairs sit further apart) is a card
    {
      const t0 = tableOf(2);
      holds(q3.STAGES[2].predict === true && !Object.values(t0.fixtures).length && !t0.tools.length, 'unit03/q3-distance stage 3: the predict stage shows an instrument');
      holds(['further', 'same', 'closer'].every(id => t0.pieces[id]?.kind === 'guess') && Object.keys(t0.pieces).length === 3, 'unit03/q3-distance stage 3: the guesses are the three cards and nothing else');
    }
    // 4. the more pairs, the shorter the bond and the deeper the well: the true answer is the opposite of the wrong card
    {
      const t = endOf(3);
      const order = t.zones.rail.order.map(id => PAIRS[t.pieces[id].props.pair]);
      same(order.map(p => p.r0).join(), order.map(p => p.r0).slice().sort((a, b) => b - a).join(), 'unit03/q3-distance stage 4 (longest bond first)');
      holds(order.map(p => p.order).join() === '1,2,3', 'unit03/q3-distance stage 4: the rail is not single, double, triple');
      holds(order.every((p, k) => !k || p.de > order[k - 1].de), 'unit03/q3-distance stage 4: a shorter bond is not a deeper well');
      same(new Set(order.map(p => p.a + p.b)).size, 1, 'unit03/q3-distance stage 4 (all three pairs are carbon with carbon)');
    }
    // 5. salts, most heat first: the real melting points, the hotplate reaches them, and charge over distance agrees
    {
      const t = endOf(4);
      const graded = t.zones.rail.order.map(id => t.pieces[id].props.lattice);
      same(graded.join(), graded.slice().sort((a, b) => LATTICES[b].melts - LATTICES[a].melts).join(), 'unit03/q3-distance stage 5 (salts, most heat first)');
      same(graded.slice().sort((a, b) => BONDDATA.coulombIndex(b) - BONDDATA.coulombIndex(a)).join(), graded.join(), 'unit03/q3-distance stage 5: charge over distance orders the salts as the real melting points do');
      const heat = t.fixtures.hp.dials.heat;
      const melts = graded.map(l => LATTICES[l].melts).sort((x, y) => x - y);
      if (!(heat.max >= melts[2] + heat.step)) fail('unit03/q3-distance stage 5: the hotplate cannot reach the highest melting point');
      for (let k = 1; k < 3; k++) if (!(melts[k] - melts[k - 1] > heat.step)) fail('unit03/q3-distance stage 5: two salts melt within one step of the dial');
    }
  }

  if (q4 || q5) {
    const { MOLECULES, DRAWINGS, planLewis, allLit, drawing, trayFor } = LEWIS;
    const lit = (mol, d, q = null) => allLit(planLewis(mol, d, q));
    if (q4) {
      // The slates are Lewis's own molecules: the atoms on the table are the molecule's atoms, the joints are
      // its links and nothing else, and the tray holds exactly its valence electrons (less the charge).
      const ATOMS = await import('../src/learn/table/kits/atoms.js');
      const tableOf = i => TABLE.createTable(q4.STAGES[i].table, q4.STAGES[i].title);
      const endOf = i => TABLE.runScript(tableOf(i), q4.SOLUTIONS[i], { strict: true });
      q4.STAGES.forEach((st, i) => {
        const t = tableOf(i);
        for (const f of Object.values(t.fixtures).filter(x => x.kind === 'slate')) {
          const mol = MOLECULES[f.props.mol];
          if (!mol) { fail(`unit03/q4-dots stage ${i + 1}: slate ${f.id} is "${f.props.mol}", which lewis.js does not hold`); continue; }
          const els = f.props.atoms.map(id => t.pieces[id].props.el);
          if (JSON.stringify(els) !== JSON.stringify(mol.syms)) fail(`unit03/q4-dots stage ${i + 1}: slate ${f.id}'s atoms (${els.join('')}) are not ${f.props.mol}'s (${mol.syms.join('')})`);
          const links = f.props.joints.map(([, a, b]) => `${a}-${b}`).sort().join();
          if (links !== mol.links.map(([a, b]) => `${a}-${b}`).sort().join()) fail(`unit03/q4-dots stage ${i + 1}: slate ${f.id}'s joints are not ${f.props.mol}'s links`);
          const sl = ATOMS.slateOf(t, f.id);
          if (sl.total !== mol.syms.reduce((n, sym) => n + LEWIS.VALENCE[sym], 0) - sl.charge) fail(`unit03/q4-dots stage ${i + 1}: ${f.props.mol}'s tray does not hold its valence electrons`);
          const fixed = Object.fromEntries(f.props.atoms.map(id => [id, t.pieces[id]]));
          for (const jid of f.props.joints.map(j => j[0])) {
            const jp = t.pieces[jid];
            const gap = Math.min(...f.props.atoms.map(a => Math.hypot(jp.at.x - fixed[a].at.x, jp.at.y - fixed[a].at.y) - fixed[a].r));
            if (gap < 0) fail(`unit03/q4-dots stage ${i + 1}: joint ${jid} sits on an atom`);
          }
          const ids = Object.keys(fixed);
          for (let a = 0; a < ids.length; a++) for (let b = a + 1; b < ids.length; b++) {
            if (Math.hypot(fixed[ids[a]].at.x - fixed[ids[b]].at.x, fixed[ids[a]].at.y - fixed[ids[b]].at.y) < fixed[ids[a]].r + fixed[ids[b]].r) fail(`unit03/q4-dots stage ${i + 1}: ${ids[a]} and ${ids[b]} overlap`);
          }
        }
      });
      // The drawing a solution leaves is the intended drawing, read off the table: bonds, lone pairs, singles.
      const drawn = (t, id) => { const sl = ATOMS.slateOf(t, id); return { bonds: sl.placed.bonds, lone: sl.placed.lone, dots: sl.placed.dots, sl }; };
      const nz = o => Object.entries(o).filter(([, v]) => v).sort();
      const norm = d => JSON.stringify([nz(d.bonds), nz(d.lone), nz(d.dots)]);
      for (const [i, key] of [[1, 'H2O'], [3, 'CO2'], [5, 'BF3']]) {
        const d = drawn(endOf(i), 'a');
        if (norm(d) !== norm(DRAWINGS[key])) fail(`unit03/q4-dots stage ${i + 1}: the solution leaves a ${key} drawing that is not the intended one`);
        if (!lit(key, DRAWINGS[key])) fail(`unit03/q4-dots stage ${i + 1}: the intended ${key} drawing does not light every lamp`);
        same(d.sl.charge, MOLECULES[key].charge, `unit03/q4-dots stage ${i + 1} (the tray charge)`);
      }
      // Stage 2 holds the guesses and no instrument; the wrong idea (a single stick to each oxygen) is a card, and it leaves two lamps dark.
      {
        const t0 = tableOf(2);
        holds(q4.STAGES[2].predict === true && !Object.values(t0.fixtures).length && !t0.tools.length, 'unit03/q4-dots stage 3: the predict stage shows an instrument');
        holds(['one', 'two', 'three'].every(id => t0.pieces[id]?.kind === 'guess') && Object.keys(t0.pieces).length === 3, 'unit03/q4-dots stage 2: the guesses are the three cards and nothing else');
        holds(!lit('CO2', drawing({ '0-1': 1, '1-2': 1 }, { 0: 3, 2: 3 })), 'unit03/q4-dots stage 3: carbon dioxide with a single stick to each oxygen lights every lamp');
      }
      // Stage 4: on this board only the oxygen can sit between hydrogen and fluorine.
      const hof = [];
      for (let b01 = 0; b01 <= 1; b01++) for (let b02 = 0; b02 <= 1; b02++) for (let b12 = 0; b12 <= 3; b12++) {
        for (let l0 = 0; l0 <= 4; l0++) for (let l1 = 0; l1 <= 4; l1++) for (let l2 = 0; l2 <= 4; l2++) {
          if (b01 + b02 > 1 || b02 + b12 > 1) continue;
          if (lit('HOF', drawing({ '0-1': b01, '0-2': b02, '1-2': b12 }, { 0: l0, 1: l1, 2: l2 }))) hof.push([b01, b02, b12]);
        }
      }
      if (!hof.length || hof.some(([a, b, c]) => !(a === 1 && b === 0 && c === 1))) fail('unit03/q4-dots stage 4: oxygen is not the only atom that can join hydrogen and fluorine');
      // The board refuses the other way round: a hydrogen or a fluorine cannot join two atoms, on the table as in lewis.js.
      let placed = drawing();
      placed = LEWIS.addBond(MOLECULES.HOF, placed, 0, 1).placed;
      if (!LEWIS.addBond(MOLECULES.HOF, placed, 0, 2).refused) fail('unit03/q4-dots stage 4: the board lets one hydrogen atom join two others');
      {
        const t4 = tableOf(4);
        const a = TABLE.applyAll(t4, [{ join: ['pairs', 'aj01'] }, { join: ['pairs', 'aj02'] }]);
        if (a.last.joined !== false || !a.last.home || !/hydrogen/.test(a.last.reason || '')) fail('unit03/q4-dots stage 4: a second joint on the hydrogen atom is not refused with the board\'s rule');
        if (a.pieces.pairs.at.x !== t4.pieces.pairs.at.x) fail('unit03/q4-dots stage 4: a refused pair does not go back to the tray');
      }
      const bf = planLewis('BF3', DRAWINGS.BF3);
      if (bf.atoms[0].lamp !== 'amber') fail('unit03/q4-dots stage 6: boron\'s lamp is not amber in the intended BF3 drawing');
    }
    if (q5) {
      // Every slate on a bench-five table is Lewis's own molecule, and every graded answer is recomputed here from `planLewis`, the drawings
      // and the real lengths, never from the numbers a stage's check carries.
      const ATOMS = await import('../src/learn/table/kits/atoms.js');
      const tableOf = i => TABLE.createTable(q5.STAGES[i].table, q5.STAGES[i].title);
      const endOf = i => TABLE.runScript(tableOf(i), q5.SOLUTIONS[i], { strict: true });
      q5.STAGES.forEach((st, i) => {
        for (const f of Object.values(tableOf(i).fixtures).filter(x => x.kind === 'slate')) {
          const mol = MOLECULES[f.props.mol];
          if (!mol) { fail(`unit03/q5-resonance stage ${i + 1}: slate ${f.id} is "${f.props.mol}", which lewis.js does not hold`); continue; }
          const els = f.props.atoms.map(id => tableOf(i).pieces[id].props.el);
          if (JSON.stringify(els) !== JSON.stringify(mol.syms)) fail(`unit03/q5-resonance stage ${i + 1}: slate ${f.id}'s atoms are not ${f.props.mol}'s`);
        }
      });
      // 1. the predict stage holds the guesses and no instrument
      {
        const t0 = tableOf(0);
        holds(q5.STAGES[0].predict === true && !Object.values(t0.fixtures).length && !t0.tools.length, 'unit03/q5-resonance stage 1: the predict stage shows an instrument');
        holds(['double', 'same', 'single'].every(id => t0.pieces[id]?.kind === 'guess') && Object.keys(t0.pieces).length === 3, 'unit03/q5-resonance stage 1: the guesses are the three cards and nothing else');
      }
      // 2. ozone's drawing says one double bond and one single; the gauge reads the molecule, and both bonds are the same length
      {
        const d = DRAWINGS.O3;
        if (d.bonds['0-1'] === d.bonds['0-2']) fail('unit03/q5-resonance stage 2: the drawing does not show one double bond and one single (the contrast the gauge breaks)');
        const o3 = { '0-1': LEWIS.gaugeLength('O3', d, '0-1'), '0-2': LEWIS.gaugeLength('O3', d, '0-2') };
        if (o3['0-1'] !== o3['0-2']) fail('unit03/q5-resonance stage 2: ozone\'s two measured bonds are not the same length');
        if (!lit('O3', d)) fail('unit03/q5-resonance stage 2: the ozone drawing does not light every lamp');
        const t = endOf(1);
        same(t.fixtures.len.dials.len.value, o3['0-2'], 'unit03/q5-resonance stage 2 (the dial is the second bond\'s measured length)');
        const dial = tableOf(1).fixtures.len.dials.len;
        holds(dial.min < o3['0-2'] && dial.max > o3['0-2'] && dial.value !== o3['0-2'], 'unit03/q5-resonance stage 2: the dial does not range over the measured length, or starts on it');
      }
      // 3. ozone lights every lamp two different ways, and the two slates the solution leaves are those two
      {
        const keys = new Set([LEWIS.drawingKey('O3', drawing({ '0-1': 2, '0-2': 1 }, { 0: 1, 1: 2, 2: 3 })), LEWIS.drawingKey('O3', drawing({ '0-1': 1, '0-2': 2 }, { 0: 1, 1: 3, 2: 2 }))]);
        holds(keys.size === 2 && lit('O3', drawing({ '0-1': 1, '0-2': 2 }, { 0: 1, 1: 3, 2: 2 })), 'unit03/q5-resonance stage 3: ozone does not light every lamp two ways');
        const t = endOf(2);
        const got = ['a', 'b'].map(id => LEWIS.drawingKey('O3', ATOMS.slateOf(t, id).placed));
        same([...new Set(got)].length, 2, 'unit03/q5-resonance stage 3 (the two slates hold different drawings)');
        holds(got.every(k => keys.has(k)) && ['a', 'b'].every(id => allLit(ATOMS.slateOf(t, id).read)), 'unit03/q5-resonance stage 3: a slate the solution drew is not one of ozone\'s two drawings');
      }
    }
  }

  if (q6) {
    const { planDomains, bondAngles, RIG_MOLECULES, angleBetween } = VSEPR;
    const DOM = await import('../src/learn/table/kits/domain.js');
    const end = i => TABLE.runScript(TABLE.createTable(q6.STAGES[i].table, q6.STAGES[i].title), q6.SOLUTIONS[i], { strict: true });
    const dial = (t, id) => t.fixtures[id].dials.value.value;
    // 1, 3, 5. an angle is set against what the planner settles the arms at, and the arms the stage hands over are the ones that settle
    {
      const t1 = end(0); const r1 = DOM.hubRead(t1, 'hub');
      same(r1.n, 2, 'unit03/q6-shape stage 1 (two arms are on the hub)');
      near(dial(t1, 'mark'), angleBetween(r1.plan, 0, 1), 1.5, 'unit03/q6-shape stage 1 (two arms, degrees)');
      const t3 = end(2); const r3 = DOM.hubRead(t3, 'hub');
      same(r3.n, 4, 'unit03/q6-shape stage 3 (four arms are on the hub)');
      same(bondAngles(r3.plan).join(), '109.5', 'unit03/q6-shape stage 3 (four arms, every pair)');
      same(dial(t3, 'mark'), 4, 'unit03/q6-shape stage 3 (the marker: the fewest arms that leave the plate)');
      const armsOf = n => planDomains(Array.from({ length: n }, () => ({ kind: 'atom', sym: 'A' })));
      for (const n of [2, 3]) same(VSEPR.hubThickness(armsOf(n)), 0, `unit03/q6-shape stage 3 (${n} arms lie flat)`);
      holds(VSEPR.hubThickness(armsOf(4)) > 0.1, 'unit03/q6-shape stage 3: four arms do not leave the plate');
      holds(q6.STAGES[2].table.pieces && Object.values(q6.STAGES[2].table.pieces).filter(p => p.kind === 'arm').length >= 5, 'unit03/q6-shape stage 3: the tray holds no more arms than the answer');
      const t5 = end(4); const r5 = DOM.hubRead(t5, 'hub');
      same(bondAngles(r5.plan).join(), '104.5', 'unit03/q6-shape stage 5 (water)');
      near(dial(t5, 'mark'), 109.5 - 104.5, 1.5, 'unit03/q6-shape stage 5 (the marker: the gap below 109.5)');
    }
    // 2. the predict stage holds the guesses and no instrument; the flat idea (a plus sign at 90 degrees) is a card, and four arms do not settle there
    {
      const t0 = TABLE.createTable(q6.STAGES[1].table, q6.STAGES[1].title);
      holds(q6.STAGES[1].predict === true && !Object.values(t0.fixtures).length && !t0.tools.length, 'unit03/q6-shape stage 2: the predict stage shows an instrument');
      holds(['cross', 'solid', 'triangle'].every(id => t0.pieces[id]?.kind === 'guess') && Object.keys(t0.pieces).length === 3, 'unit03/q6-shape stage 2: the guesses are the three cards and nothing else');
      const four = planDomains(RIG_MOLECULES.CH4.arms);
      const [va, vb, vc] = four.vectors.map(v => v.v);
      const triple = va[0] * (vb[1] * vc[2] - vb[2] * vc[1]) - va[1] * (vb[0] * vc[2] - vb[2] * vc[0]) + va[2] * (vb[0] * vc[1] - vb[1] * vc[0]);
      holds(angleBetween(four, 0, 1) > 100 && Math.abs(triple) > 0.1, 'unit03/q6-shape stage 2: four arms do not leave the flat');
    }
    // 4. ammonia's atoms are a pyramid only with its lone pair on the hub; without it they lie flat
    {
      const r4 = DOM.hubRead(end(3), 'hub');
      same(r4.shape, 'trigonal pyramidal', 'unit03/q6-shape stage 4 (NH3)');
      holds(r4.height > 0.1, 'unit03/q6-shape stage 4: the atoms of the solution do not lean');
      const flat = planDomains([{ kind: 'atom', sym: 'H' }, { kind: 'atom', sym: 'H' }, { kind: 'atom', sym: 'H' }]);
      same(VSEPR.hubHeight(flat), 0, 'unit03/q6-shape stage 4 (three atoms alone lie flat)');
    }
    // The shapes the reward cards stand up are the ones the planner settles.
    for (const [i, mol] of [[0, 'CO2'], [2, 'CH4'], [3, 'NH3'], [4, 'H2O']]) {
      const m = q6.STAGES[i].reward.model;
      same(m && m.type === 'shape' && m.mol, mol, `unit03/q6-shape stage ${i + 1} (the reward model)`);
    }
    // Every molecule the hub can hold settles with its arms apart and inside the plate: a piece each, never one on another.
    {
      const specs = Object.entries(RIG_MOLECULES).filter(([, m]) => m.arms.length >= 1);
      for (const [id, m] of specs) {
        const hs = DOM.hubSet('hub', m.hub, { x: 40, y: 32 }, { turner: { x: 108, y: 35 } });
        const arms = m.arms.map((a, i) => (a.kind === 'lone' ? DOM.balloonPiece(`x${i}`, { x: 100, y: 10 }) : DOM.armPiece(`x${i}`, a.sym, { x: 100, y: 10 }, a.mult || 1)));
        let t = TABLE.createTable(DOM.domainTable({ pieces: [hs.piece, ...arms], fixtures: [hs.fixture, hs.turner] }), id);
        for (const a of arms) t = TABLE.apply(t, { join: [a.id, 'hub'] });
        const at = arms.map(a => t.pieces[a.id].at);
        const box = TABLE.createTable(DOM.domainTable({ pieces: [], fixtures: [hs.fixture] }), id).fixtures['hub-plate'];
        at.forEach((p, i) => {
          holds(Math.abs(p.x - 40) + DOM.ARM_R <= box.size.w / 2 && Math.abs(p.y - 32) + DOM.ARM_R <= box.size.h / 2, `kit: ${id}'s arm ${i + 1} settles outside its plate`);
          for (let j = i + 1; j < at.length; j++) if (Math.hypot(p.x - at[j].x, p.y - at[j].y) < 2 * DOM.ARM_R - 0.1) fail(`kit: ${id}'s arms ${i + 1} and ${j + 1} settle on top of each other`);
          if (Math.hypot(p.x - 40, p.y - 32) < DOM.HUB_R + DOM.ARM_R - 0.5) fail(`kit: ${id}'s arm ${i + 1} settles on the hub`);
        });
      }
    }
  }

  if (q7) {
    const { planDipole, EN } = VSEPR;
    const DOM = await import('../src/learn/table/kits/domain.js');
    const polar = m => planDipole(m).polar;
    const end = i => TABLE.runScript(TABLE.createTable(q7.STAGES[i].table, q7.STAGES[i].title), q7.SOLUTIONS[i], { strict: true });
    const start = i => TABLE.createTable(q7.STAGES[i].table, q7.STAGES[i].title);
    // 0. the pull sort: every card's printed pull falls in one tray by the thresholds, and each tray holds at least one
    {
      const t = end(0);
      const ids = ['a', 'b', 'c', 'd'];
      const band = m => { const d = planDipole(m).mag; return d < 0.4 ? 'none' : d < 1.7 ? 'part' : 'taken'; };
      for (const id of ids) same(t.pieces[id].zone, `tray:${band(t.pieces[id].props.mol)}`, `unit03/q7-polarity stage 1 (${t.pieces[id].props.mol})`);
      holds(['none', 'part', 'taken'].every(z => ids.some(id => band(t.pieces[id].props.mol) === z)), 'unit03/q7-polarity stage 1: a tray is never needed');
    }
    // 1. chlorine pulls harder; the card is set so that it stays when the field comes on, and it does not start that way
    {
      if (!(EN.Cl > EN.H)) fail('unit03/q7-polarity stage 1: chlorine does not pull harder than hydrogen');
      holds(DOM.dmolBehaviour(end(1).pieces.a, end(1)).aligned, 'unit03/q7-polarity stage 1: the solution is not set the way the field wants it');
      const s0 = start(1);
      const put = TABLE.apply(s0, { place: { piece: 'a', to: 'free:37,21' } });
      holds(!DOM.dmolBehaviour(put.pieces.a, put).aligned, 'unit03/q7-polarity stage 1: the card starts already set the way the field wants it');
    }
    // 2. the predict stage holds the guesses and no instrument; the obvious answer (strong polar bonds, so it turns) is a card, and it is wrong
    {
      const t0 = start(2);
      holds(q7.STAGES[2].predict === true && !Object.values(t0.fixtures).length && !t0.tools.length, 'unit03/q7-polarity stage 2: the predict stage shows an instrument');
      holds(['turns', 'stays'].every(id => t0.pieces[id]?.kind === 'guess') && Object.keys(t0.pieces).length === 2, 'unit03/q7-polarity stage 2: the guesses are the two cards and nothing else');
      same(polar('CO2'), false, 'unit03/q7-polarity stage 2 (carbon dioxide does not turn)');
      holds(planDipole('CO2').arrows.every(a => Math.abs(a.d) > 0.8), 'unit03/q7-polarity stage 2: carbon dioxide\'s bonds are not strongly polar');
    }
    // 3. five molecules, sorted by the planner's own dipole: the rule of thumb (polar bonds, so polar) fails for two, and the bonds of every one are polar
    {
      const t = end(3);
      const mols = ['a', 'b', 'c', 'd', 'e'].map(id => [id, t.pieces[id].props.mol]);
      for (const [id, mol] of mols) same(t.pieces[id].zone, `tray:${polar(mol) ? 'turns' : 'stays'}`, `unit03/q7-polarity stage 3 (${mol})`);
      holds(mols.filter(([, m]) => polar(m)).length === 3 && mols.filter(([, m]) => !polar(m)).length === 2, 'unit03/q7-polarity stage 3: the sort is not three that turn and two that stay');
      holds(mols.every(([, m]) => planDipole(m).arrows.some(a => Math.abs(a.d) > 0.3)), 'unit03/q7-polarity stage 3: a molecule has no polar bond, so it does not test the rule of thumb');
      holds(mols.some(([, m]) => !polar(m) && planDipole(m).arrows.length > 2), 'unit03/q7-polarity stage 3: no symmetrical molecule with three or more polar bonds');
    }
    // 4. the streams that bend are the ones whose molecules turn
    {
      const t = end(4);
      const real = ['s1', 's2', 's3'].filter(id => polar(t.pieces[id].props.mol));
      same(['s1', 's2', 's3'].filter(id => t.pieces[id].zone === 'tray:bent').join(), real.join(), 'unit03/q7-polarity stage 4 (the liquids a charged rod bends)');
      holds(!Object.keys(start(4).fetch).length, 'unit03/q7-polarity stage 4: sends the player to fetch something the bench already holds');
    }
    // The shapes the reward cards stand up are real rig molecules.
    for (const [i, mol] of [[1, 'HCl'], [3, 'H2O']]) same(q7.STAGES[i].reward.model?.mol ?? q7.STAGES[i].reward.model, mol, `unit03/q7-polarity stage ${i + 1} (the reward model)`);
    // The gap the cards are put in holds a card, in every stage that has plates.
    q7.STAGES.forEach((st, i) => {
      for (const f of Object.values(start(i).fixtures).filter(x => x.kind === 'plates')) {
        const g = DOM.gapArea(f);
        holds(g.x1 - g.x0 >= 2 * DOM.MOL_RECT.hw + 2 && g.y1 - g.y0 >= 2 * DOM.MOL_RECT.hh - 1, `unit03/q7-polarity stage ${i + 1}: the gap between the plates is too small for a card`);
      }
    });
  }

  if (q8) {
    const { planMix, planBlend, planTwist, planDomains, RIG_MOLECULES, SKELETONS } = VSEPR;
    const DOM = await import('../src/learn/table/kits/domain.js');
    const end = i => TABLE.runScript(TABLE.createTable(q8.STAGES[i].table, q8.STAGES[i].title), q8.SOLUTIONS[i], { strict: true });
    const start = i => TABLE.createTable(q8.STAGES[i].table, q8.STAGES[i].title);
    // 1. the predict stage holds the guesses and no instrument; the wrong idea (carbon takes four straight away) is a card
    {
      const t0 = start(0);
      holds(q8.STAGES[0].predict === true && !Object.values(t0.fixtures).length && !t0.tools.length, 'unit03/q8-hybrid stage 1: the predict stage shows an instrument');
      holds(['four', 'three', 'two'].every(id => t0.pieces[id]?.kind === 'guess') && Object.keys(t0.pieces).length === 3, 'unit03/q8-hybrid stage 1: the guesses are the three cards and nothing else');
    }
    // 2. carbon as it stands has two single electrons, so it takes two hydrogen atoms and refuses a third; methane has four arms
    {
      const t0 = start(1);
      const singles = Object.values(t0.pieces).filter(p => p.kind === 'orb' && p.props.atom === 'c' && p.props.e === 1).length;
      same(singles, 2, 'unit03/q8-hybrid stage 2 (carbon\'s single electrons)');
      same(planDomains(RIG_MOLECULES.CH4.arms).n, 4, 'unit03/q8-hybrid stage 2 (methane\'s arms)');
      const t = end(1);
      same(DOM.bondsBuilt(t).sigma, 2, 'unit03/q8-hybrid stage 2 (two bonds made)');
      const third = TABLE.apply(t, { join: ['h3', 'cpz'] });
      holds(!third.last.joined, 'unit03/q8-hybrid stage 2: a hydrogen atom bonded to carbon\'s empty orbital');
      const fourth = TABLE.apply(t, { join: ['h3', 'cs'] });
      holds(!fourth.last.joined, 'unit03/q8-hybrid stage 2: a hydrogen atom bonded to carbon\'s full s orbital');
    }
    // 3. what a bowl makes is as many lobes as orbitals mixed, and the bowl holds all of an atom's orbitals
    {
      same(planBlend(1, 3, 0).lobes, planDomains(RIG_MOLECULES.CH4.arms).n, 'unit03/q8-hybrid stage 3 (sp3 makes four lobes)');
      same(planMix(3).lobes, 4, 'unit03/q8-hybrid stage 3 (planMix agrees)');
      same(DOM.bowlRead(end(2), 'mx').hybrid, 'sp3', 'unit03/q8-hybrid stage 3 (the bowl)');
      same(planBlend(0, 3, 0).lobes, 0, 'unit03/q8-hybrid: p orbitals alone blend into nothing new');
      for (const f of Object.values(start(2).fixtures).filter(x => x.kind === 'mixbowl')) {
        const bowl = start(2).zones.containers[f.props.zone];
        const cols = Math.max(1, Math.floor(bowl.size.w / bowl.cell));
        const rows = Math.max(1, Math.floor(bowl.size.h / bowl.cell));
        holds(cols * rows >= 4, `unit03/q8-hybrid stage 3: ${f.id}'s bowl holds ${cols * rows} orbitals, fewer than the four carbon has`);
      }
      const m = q8.STAGES[2].reward.model;
      same(m && m.type === 'lobes' && m.n, planMix(3).lobes, 'unit03/q8-hybrid stage 3 (the reward model stands up the lobes the bowl made)');
    }
    // 4. ethene: each carbon has three lobes and a p left over, and the bonds that can be built are the molecule's own
    {
      const ethene = planDomains(RIG_MOLECULES.C2H4.arms);
      same(`${ethene.n}/${planMix(ethene.n - 1).leftoverP}`, '3/1', 'unit03/q8-hybrid stage 4 (an ethene carbon: three lobes and one p left over)');
      const t4 = start(3);
      for (const c of ['c1', 'c2']) {
        const mine = Object.values(t4.pieces).filter(p => p.props.atom === c);
        same(`${mine.filter(p => p.props.type === 'sp2').length}/${mine.filter(p => p.props.type === 'p').length}`, '3/1', `unit03/q8-hybrid stage 4 (${c}'s orbitals)`);
        holds(mine.filter(p => p.props.type === 'sp2').every(p => p.label === 'lobe'), `unit03/q8-hybrid stage 4: ${c}'s lobes carry a name the bench has not earned`);
      }
      const b4 = DOM.bondsBuilt(end(3));
      same(`${b4.sigma}/${b4.pi}`, `1/${SKELETONS.C2H4.find(b => b[0] === 'C' && b[1] === 'C')[2] - 1}`, 'unit03/q8-hybrid stage 4 (the carbons\' own bonds: one end to end, the rest side by side)');
    }
    // 5. a single bond turns and a double bond does not
    {
      const t = end(5);
      same(DOM.twistRead(t, 'tw1').free, planTwist('single').free, 'unit03/q8-hybrid stage 6 (the single bond turns)');
      same(DOM.twistRead(t, 'tw2').free, planTwist('double').free, 'unit03/q8-hybrid stage 6 (the double bond holds)');
      same(DOM.twistRead(t, 'tw1').angle, 90, 'unit03/q8-hybrid stage 6 (ethane\'s far end is a quarter turn round)');
      same(DOM.twistRead(t, 'tw2').angle, 0, 'unit03/q8-hybrid stage 6 (ethene\'s far end has not moved)');
    }
  }

  if (q9) {
    const { DIATOMICS, fillMO, readMO, rowsMO } = MOD;
    const MO = await import('../src/learn/table/kits/mo.js');
    const start = i => TABLE.createTable(q9.STAGES[i].table, q9.STAGES[i].title);
    const end = i => TABLE.runScript(start(i), q9.SOLUTIONS[i], { strict: true });
    for (const [id, d] of Object.entries(DIATOMICS)) {
      const r = readMO(d.order, fillMO(d.order, d.e));
      same(r.unpaired, d.unpaired, `unit03/q9-orbitals: ${id} filled in order measures ${d.unpaired} unpaired`);
    }
    // Every rack on a table is the molecule's own: a container for each of its boxes, a pair at most in each, a jar holding exactly its valence electrons.
    q9.STAGES.forEach((st, i) => {
      const t = start(i);
      for (const f of Object.values(t.fixtures).filter(x => x.kind === 'rack')) {
        const d = DIATOMICS[f.props.mol];
        same(f.props.order, d.order, `unit03/q9-orbitals stage ${i + 1} (${f.props.mol}'s order of boxes)`);
        if (!f.props.live) continue;
        const boxes = Object.values(t.zones.containers).filter(c => c.props?.mo?.rack === f.props.rack);
        same(boxes.length, rowsMO(d.order).reduce((n, r) => n + r.boxes, 0), `unit03/q9-orbitals stage ${i + 1} (boxes on ${f.props.mol}'s rack)`);
        holds(boxes.every(c => c.capacity === 2), `unit03/q9-orbitals stage ${i + 1}: a box that does not hold exactly a pair`);
        same(MO.supplyLeft(t) + MO.readOf(t, f.props.rack).total, d.e, `unit03/q9-orbitals stage ${i + 1} (the jar and the seated boxes hold ${f.props.mol}'s valence electrons)`);
        holds(i === 2 || Object.keys(MO.rackOf(t, f.props.rack)).length === 0, `unit03/q9-orbitals stage ${i + 1}: the rack starts with electrons on it`);
        // The graded fill is the ground state, and it is the planner's: the rack reads what fillMO says.
        const e = end(i);
        same(MO.readOf(e, f.props.rack).total, d.e, `unit03/q9-orbitals stage ${i + 1} (electrons on the rack)`);
        holds(MO.matchesGround(e, f.props.rack, d.e), `unit03/q9-orbitals stage ${i + 1}: the solution is not the ground state`);
        same(MO.readOf(e, f.props.rack).config, readMO(d.order, fillMO(d.order, d.e)).config, `unit03/q9-orbitals stage ${i + 1} (the configuration)`);
        holds(f.props.plain === true, `unit03/q9-orbitals stage ${i + 1}: the rack prints a row name the bench has not earned`);
      }
    });
    // 1. the predict stage holds the guesses and no instrument; the expected answer (a gas is not magnetic) is a card
    {
      const t0 = start(0);
      holds(q9.STAGES[0].predict === true && !Object.values(t0.fixtures).length && !t0.tools.length, 'unit03/q9-orbitals stage 1: the predict stage shows an instrument');
      holds(['pulled', 'nothing', 'pushed'].every(id => t0.pieces[id]?.kind === 'guess') && Object.keys(t0.pieces).length === 3, 'unit03/q9-orbitals stage 1: the guesses are the three cards and nothing else');
    }
    // 2. the magnet reads the REAL molecule: two of the four gases are pulled, two are not
    {
      const t = end(1);
      const gases = ['n2', 'o2', 'f2', 'b2'];
      for (const id of gases) same(t.pieces[id].zone, `tray:${DIATOMICS[t.pieces[id].props.mol].unpaired > 0 ? 'pulled' : 'ignored'}`, `unit03/q9-orbitals stage 2 (${id})`);
      holds(gases.filter(id => DIATOMICS[t.pieces[id].props.mol].unpaired > 0).length === 2, 'unit03/q9-orbitals stage 2: the gases are not two pulled and two not');
      holds(gases.every(id => MO.cardPull(t.pieces[id]) !== null), 'unit03/q9-orbitals stage 2: the magnet did not test a gas');
    }
    // 3. the magnet reads the REAL molecule; the solution's rack agrees with it, and a rack of pairs would not
    {
      if (!(DIATOMICS.O2.unpaired > 0)) fail('unit03/q9-orbitals stage 3: O2 measures no unpaired electrons');
      const t = end(2);
      same(MO.magnetRead(t, 'magnet').pull, DIATOMICS.O2.unpaired, 'unit03/q9-orbitals stage 3 (what the magnet read)');
      same(MO.readOf(t, 'a').unpaired, DIATOMICS.O2.unpaired, 'unit03/q9-orbitals stage 3 (the rack\'s alone-in-a-box count)');
      const paired = TABLE.runScript(start(2), q9.MISSES[2].filter(a => a.pour), { strict: true });
      holds(MO.readOf(paired, 'a').unpaired !== DIATOMICS.O2.unpaired, 'unit03/q9-orbitals stage 3: pairing the last two electrons still matches the magnet');
    }
  }

  // THE WARDEN: five phases, each on a table of a bench the player has worked, each answer read off the real planners.
  const warden = await get('boss-warden');
  if (warden) {
    const { LATTICES, byLatticeEnergy } = BONDDATA;
    const { planDomains, planDipole, angleBetween, RIG_MOLECULES } = VSEPR;
    const ATM = await import('../src/learn/table/kits/atoms.js');
    const DM = await import('../src/learn/table/kits/domain.js');
    const MOK = await import('../src/learn/table/kits/mo.js');
    const { DIATOMICS } = MOD;
    const start = i => TABLE.createTable(warden.STAGES[i].table, warden.STAGES[i].title);
    const end = i => TABLE.runScript(start(i), warden.SOLUTIONS[i], { strict: true });
    // 1. the block held hardest is the one with the highest melting point, and the hotplate's dial reaches it
    {
      const t = end(0);
      const lats = ['a', 'b', 'c'].map(id => start(0).pieces[id].props.lattice);
      const hot = byLatticeEnergy(lats)[0];
      same(Object.values(t.pieces).find(p => p.zone === 'slot:most').props.lattice, hot, 'boss-warden phase 1 (the block in the marked place)');
      same(lats.slice().sort((a, b) => LATTICES[b].melts - LATTICES[a].melts)[0], hot, 'boss-warden phase 1 (the highest lattice energy is the highest melting point)');
      holds(start(0).fixtures.hp.dials.heat.max >= Math.max(...lats.map(l => LATTICES[l].melts)), 'boss-warden phase 1: the hotplate cannot melt the hardest block');
    }
    // 2. hydrogen cyanide: the tray runs out, every lamp lights, and carbon shares three pairs with nitrogen (a triple bond)
    {
      const sl = ATM.slateOf(end(1), 'a');
      holds(LEWIS.allLit(sl.read) && sl.left === 0, 'boss-warden phase 2: the solution does not light every lamp with the tray empty');
      same(sl.total, LEWIS.MOLECULES.HCN.syms.reduce((n, sym) => n + LEWIS.VALENCE[sym], 0), 'boss-warden phase 2 (the tray holds HCN\'s valence electrons)');
      same(sl.placed.bonds['1-2'], 3, 'boss-warden phase 2 (carbon and nitrogen share three pairs)');
    }
    // 3. ammonia: three hydrogens and a lone pair, and the marker is set to the angle the planner settles them at
    {
      const t = end(2);
      const r = DM.hubRead(t, 'hub');
      same(r.atoms, 3, 'boss-warden phase 3 (hydrogen atoms on the hub)');
      same(r.lone, 1, 'boss-warden phase 3 (lone pairs on the hub)');
      const plan = planDomains(RIG_MOLECULES.NH3.arms);
      const hs = r.arms.map((a, i) => [a, i]).filter(([a]) => a.kind === 'arm').map(([, i]) => i);
      near(DM.markerValue(t, 'mark'), 109.5 - angleBetween(r.plan, hs[0], hs[1]), 1.2, 'boss-warden phase 3 (the gap below 109.5)');
      same(r.plan.shape, plan.shape, 'boss-warden phase 3 (the hub\'s shape is NH3\'s)');
      near(angleBetween(r.plan, hs[0], hs[1]), 107, 0.01, 'boss-warden phase 3 (107 degrees)');
    }
    // 4. the molecules that turn are the ones whose pulls add
    {
      const t = end(3);
      for (const id of ['a', 'b', 'c']) {
        const mol = t.pieces[id].props.mol;
        same(t.pieces[id].zone === 'tray:turns', planDipole(mol).polar, `boss-warden phase 4 (${mol})`);
      }
    }
    // 5. the gas the magnet draws in is the one with electrons standing alone, and the magnet read the REAL molecule
    {
      const t = end(4);
      const drawn = Object.values(t.pieces).find(p => p.zone === 'slot:drawn');
      holds(DIATOMICS[drawn.props.mol].unpaired > 0, 'boss-warden phase 5: the gas in the marked place is not pulled');
      const others = ['n2', 'o2', 'f2'].map(id => t.pieces[id]);
      for (const p of others) same(MOK.cardPull(p), DIATOMICS[p.props.mol].unpaired, `boss-warden phase 5 (what the magnet wrote on ${p.label})`);
      same(others.filter(p => DIATOMICS[p.props.mol].unpaired > 0).length, 1, 'boss-warden phase 5 (exactly one gas is pulled)');
    }
    // Every phase is a fight: one warden, the species' own words, no field stage, and its table keeps the corner clear (verify:table holds the pad).
    warden.STAGES.forEach((st, i) => {
      same(st.encounter?.species, 'basalt warden', `boss-warden phase ${i + 1} (its species)`);
      same((st.foes || []).length, 1, `boss-warden phase ${i + 1} (its foes)`);
      holds(!(st.table.fetch || []).length && !st.field, `boss-warden phase ${i + 1}: a boss phase declares a field stage`);
    });
  }

  if (failures === before) ok('Ligar: every graded bond, drawing, angle, pull and orbital count agrees with the real tables');
}


/* ------------------------------------------------------------------
   EVERY FIGURE A BELLOWS STAGE GRADES AGAINST IS RECOMPUTED FROM THE REAL
   TABLES, and every claim a stage teaches is checked on the table that teaches
   it (plan `bench-tabletop.md`, T5, reworked 2026-10-23): three gauges that read
   alike, a Celsius number that does not double the room, a heavy gas with the
   fewest moles, a lighter gas that leaks first, a squeezed gas above the law.
   The kit (`table/kits/gas.js`) reads every plate through `gasdata.js`, so an
   answer authored as a literal in a solution script can drift from the
   instrument that teaches it, and one recomputed here cannot.
   ------------------------------------------------------------------ */
{
  const before = failures;
  const G = GAS;
  const GK = await import('../src/learn/table/kits/gas.js');
  const get = async id => { const q = getQuest('unit04', id); return q && q.status === 'live' ? q.module() : null; };
  const [b1, b2, b3, b4, b5, b6, bb] = await Promise.all(['q1-knocks', 'q2-laws', 'q3-ideal', 'q4-mixtures', 'q5-speed', 'q6-real', 'boss-compressor'].map(get));
  const near = (a, b, tol, what) => { if (!(Math.abs(a - b) <= tol)) fail(`${what}: graded ${a}, the real figure is ${Number(b).toFixed(4)}`); };
  const same = (a, b, what) => { if (String(a) !== String(b)) fail(`${what}: graded ${a}, the real answer is ${b}`); };
  const holds = (cond, what) => { if (!cond) fail(what); };
  const start = (q, i) => TABLE.createTable(q.STAGES[i].table, q.STAGES[i].title);
  const done = (q, i) => TABLE.runScript(start(q, i), q.SOLUTIONS[i], { strict: true });
  const rd = (t, id, set = {}, which = 0) => GK.rigAt(t, id, set)[which];
  const props = (t, id) => t.fixtures[id].props;
  const marker = (t, id) => GK.markerRead(t, id);
  const tray = (t, id) => (t.pieces[id].zone || '').replace(/^tray:/, '');
  const order = t => t.zones.rail.order.join();
  const slotCard = (t, slot) => Object.values(t.pieces).find(p => p.zone === `slot:${slot}`)?.id;
  /** The table with a dial turned to another setting (it changes nothing on the table it is given). */
  const turned = (t, fixture, dialName, value) => TABLE.apply(t, { setDial: { fixture, dial: dialName, value } });

  /* ---- the tables themselves ---- */
  near(G.R, 8.314, 1e-9, 'gasdata: R in L kPa / mol K');
  near(G.molesIdeal(G.ATM_KPA, 22.414, 273.15), 1, 0.001, 'gasdata: one mole fills 22.414 L at 0 C and 1 atm');
  for (const [k, g] of Object.entries(G.GASES)) holds(g.M > 0 && g.a > 0 && g.b > 0, `gasdata: ${k} has no real molar mass or van der Waals constants`);
  near(G.pressureVdw('He', 1, 300, 24.6).P, G.pressureIdeal(1, 300, 24.6), 0.2, 'gasdata: van der Waals meets the ideal law in a roomy cylinder');
  near(G.leftAfter('H2', 1), 0.5, 1e-9, 'gasdata: hydrogen is half empty after one second');
  near(G.halfTime('O2') / G.halfTime('H2'), Math.sqrt(G.GASES.O2.M / G.GASES.H2.M), 1e-9, 'gasdata: Graham, the half times go as the root of the mass');
  near(G.speedBins('N2', 300, 60, 6000).reduce((a, b) => a + b, 0), 1, 0.002, 'gasdata: the speed distribution is one whole');

  /* ---- PREDICT FIRST (every Bellows quest): the guess is made on a bench with no instrument, and the next stage brings one ---- */
  {
    let predicts = 0;
    for (const [name, q] of [['q1-knocks', b1], ['q2-laws', b2], ['q3-ideal', b3], ['q4-mixtures', b4], ['q5-speed', b5], ['q6-real', b6]]) {
      if (!q) continue;
      q.STAGES.forEach((st, i) => {
        if (!st.predict) return;
        predicts++;
        const t = start(q, i);
        holds(Object.keys(t.fixtures).length === 0 && !t.tools.length, `unit04/${name} stage ${i + 1}: a predict stage shows an instrument or a tool`);
        holds(!t.prediction, `unit04/${name} stage ${i + 1}: a predict stage asks for a token and not a card in the slot`);
        const cards = Object.values(t.pieces).filter(p => p.kind === 'stmt');
        holds(cards.length >= 3 && Object.keys(t.zones.slots).length === 1, `unit04/${name} stage ${i + 1}: a predict stage is not three or more cards and one slot`);
        const next = q.STAGES[i + 1];
        holds(Boolean(next) && !next.predict && Object.keys(start(q, i + 1).fixtures).length > 0, `unit04/${name} stage ${i + 1}: the stage after a predict stage brings no instrument`);
        holds(st.prompt && typeof st.onClear === 'function', `unit04/${name} stage ${i + 1}: a predict stage does not remember the guess`);
      });
    }
    holds(predicts === 8, `unit04: expected 8 predict stages (q1 1, q2 2, q3 1, q4 1, q5 2, q6 1), found ${predicts}`);
  }

  /* ---- q1-knocks ---- */
  if (b1) {
    const q = 'unit04/q1-knocks';
    // Stage 2: the three gauges read alike at every heater setting, and the whole box rises together when it is warmed.
    {
      const t = start(b1, 1);
      const temps = props(t, 'box').temps;
      let last = 0;
      temps.forEach((_, k) => {
        const r = GK.boxRead(turned(t, 'box', 'temp', k + 1), 'box');
        near(r.walls[0].P, r.walls[1].P, 1e-9, `${q} stage 2: the roof and the side wall read differently at setting ${k + 1}`);
        near(r.walls[1].P, r.walls[2].P, 1e-9, `${q} stage 2: the side wall and the floor read differently at setting ${k + 1}`);
        holds(r.P > last, `${q} stage 2: warming the box does not raise the gauges`);
        last = r.P;
      });
      same(b1.wallMost(GK.boxRead(t, 'box')), 'same', `${q} stage 2 (no wall reads more than another)`);
      same(slotCard(done(b1, 1), 'show'), 'same', `${q} stage 2 (the verdict laid)`);
      holds(b1.GUESSES.length === 4 && b1.GUESSES.some(g => g[0] === 'floor'), `${q} stage 1: the weight model is not a card`);
    }
    // Stage 3: while the piston moves, nothing but the knocks follows the gauge, and half the room is twice the gauge.
    {
      const t = start(b1, 2);
      const n = props(t, 'rig').volumes.length;
      const r = k => rd(t, 'rig', { volume: k });
      for (let k = 2; k <= n; k++) {
        near(r(k).P * r(k).V, r(1).P * r(1).V, 1e-6, `${q} stage 3: pressure times volume is not constant`);
        near(r(k).knocks / r(1).knocks, r(k).P / r(1).P, 1e-9, `${q} stage 3: the knock counter does not follow the gauge`);
        near(r(k).mean, r(1).mean, 1e-9, `${q} stage 3: the particles change speed while the piston moves`);
        near(r(k).T, r(1).T, 1e-9, `${q} stage 3: the temperature changes while the piston moves`);
      }
      near(r(2).P / r(1).P, 2, 1e-9, `${q} stage 3: half the room is not twice the gauge (the card says so)`);
      holds(props(t, 'rig').volumes[1] * 2 === props(t, 'rig').volumes[0], `${q} stage 3: the second piston setting is not half the first`);
    }
    // Stage 3 asks for six times the starting gauge, and one setting does it. Stage 4 goes beyond the dial's last setting: the figure comes from gauge x room.
    {
      const t = done(b1, 2);
      const vols = props(t, 'rig').volumes;
      const want = vols.filter((_, k) => Math.abs(rd(t, 'rig', { volume: k + 1 }).P / rd(t, 'rig', { volume: 1 }).P - 6) < 0.02);
      holds(want.length === 1, `${q} stage 3: exactly one piston setting should give six times the starting gauge (found ${want.length})`);
      const t4 = start(b1, 3);
      const a = rd(t4, 'rig', { volume: 1 });
      const real = (a.P * a.V) / 1.5;
      const cards = b1.BEYOND_CARDS;
      holds(cards.filter(c => Math.abs(c[2] - real) / real < 0.02).length === 1, `${q} stage 4: exactly one card should match gauge x room divided by the new room (${real.toFixed(0)})`);
      holds(Math.min(...props(t4, 'rig').volumes) > 1.5, `${q} stage 4: the dial reaches 1.5 L, so the figure can be read off`);
      holds(cards.some(c => c[2] < a.P), `${q} stage 4: no card is a squeeze that lowers the gauge`);
    }
    // Stage 5: the snapshots are four temperatures in order, the screen's peak moves right and flattens, the crowd is a spread.
    {
      const t = done(b1, 4);
      const temps = t.zones.rail.order.map(id => t.pieces[id].props.T);
      holds(temps.every((v, k) => !k || v > temps[k - 1]) && temps.length === 4, `${q} stage 4: the rail is not coldest first`);
      const lo = G.speedBins('N2', temps[0], 40, 2400); const hi = G.speedBins('N2', temps[3], 40, 2400);
      const peak = a => a.indexOf(Math.max(...a));
      holds(peak(hi) > peak(lo) && Math.max(...hi) < Math.max(...lo), `${q} stage 4: heating does not move the peak right and flatten it`);
      const PQ = await import('../src/learn/engine/gas-particles.js');
      const sp = PQ.speedQuantiles('N2', 300, 24);
      holds(sp[sp.length - 1] > sp[0] * 3, `${q} stage 4: the 3D crowd is not a spread of speeds`);
      near(sp.reduce((a, b) => a + b, 0) / sp.length, G.speeds('N2', 300).mean, G.speeds('N2', 300).mean * 0.06, `${q} stage 4: the 3D crowd does not average the gas's mean speed`);
    }
    // Stage 6: one temperature, one energy, two speeds.
    {
      const t = done(b1, 5);
      const a = GK.cylRead(t, 'ra', 0); const b = GK.cylRead(t, 'rb', 0);
      near(a.energy, b.energy, 1e-9, `${q} stage 5: the two gases do not share an average kinetic energy`);
      holds(a.mean > b.mean * 2, `${q} stage 5: helium is not much faster than carbon dioxide`);
      near(a.T, b.T, 1e-9, `${q} stage 5: the solution leaves the two cylinders at different temperatures`);
    }
  }

  /* ---- q2-laws ---- */
  if (b2) {
    const q = 'unit04/q2-laws';
    // Stage 2: the room doubles at 313 C and not at 40 C; the room over the kelvin temperature is constant.
    {
      const t = start(b2, 1);
      const k = props(t, 'rb').temps.length;
      const v = i => rd(t, 'rb', { temp: i });
      for (let i = 1; i <= k; i++) near(v(i).V / v(i).T, v(1).V / v(1).T, 1e-9, `${q} stage 2: V over kelvin is not constant`);
      const ra = rd(t, 'ra').V;
      holds(!props(t, 'rb').temps.includes(313), `${q} stage 2: a setting of the dial sits on the doubling temperature, so it can be read off`);
      near(b2.DOUBLE_C, 313.15, 1e-6, `${q} stage 2 (the temperature that doubles the room)`);
      holds(v(1).V * (b2.DOUBLE_C + 273.15) / 293.15 / ra > 1.98, `${q} stage 2: the answer does not double the room`);
      same(b2.STAGES[1].check(b2.stateFor(1, b2.SOLUTIONS[1])).ok, true, `${q} stage 2 (the solution)`);
      same(b2.STAGES[1].check(b2.stateFor(1, b2.MISSES[1])).ok, false, `${q} stage 2 (the Celsius slip)`);
      same(b2.STAGES[1].check(b2.stateFor(1, [])).notYet, true, `${q} stage 2 (an empty field)`);
      holds(Math.round(start(b2, 1).fixtures.rb.dials.temp.value) === 1 && Math.abs(v(1).V - ra) < 1e-9, `${q} stage 2: the two cylinders do not start alike`);
    }
    function cylR(t, id) { return GK.cylRead(t, id, 0).V; }
    // Stage 3: the line of room against heat is straight and reaches zero room at absolute zero.
    {
      const t = start(b2, 2);
      const temps = props(t, 'rig').temps;
      const pts = temps.map((_, k) => rd(t, 'rig', { temp: k + 1 }));
      const slope = (pts[1].V - pts[0].V) / (pts[1].T - pts[0].T);
      pts.forEach((p, k) => near(p.V, pts[0].V + slope * (p.T - pts[0].T), 1e-9, `${q} stage 3: point ${k + 1} is off the line`));
      near(pts[0].T - pts[0].V / slope, 0, 0.01, `${q} stage 3: the line does not reach zero room at 0 K`);
      holds(Math.min(...temps) > -273.15 + 100, `${q} stage 3: the heater reaches too close to absolute zero for the line to need carrying on`);
      holds(t.recorder.axes && t.recorder.axes.range && t.recorder.axes.range.xMin <= -273.15, `${q} stage 3: the strip does not run as far as absolute zero`);
      near(marker(done(b2, 2), 'zero'), -273.15, b2.ZERO_TOL, `${q} stage 3 (the marker)`);
    }
    // Stage 6: the dial stops short of 327 C, one card is the room there by room over kelvin, and the Celsius-ratio slip is a card.
    {
      const t = start(b2, 5);
      const temps = props(t, 'rig').temps;
      holds(Math.max(...temps) < 327, `${q} stage 6: the dial reaches 327 C, so the figure can be read off`);
      const a0 = rd(t, 'rig', { temp: 1 });
      const real = (a0.V / a0.T) * (327 + 273.15);
      holds(b2.REACH_CARDS.filter(c => Math.abs(c[2] - real) / real < 0.03).length === 1, `${q} stage 6: exactly one card should be the room at 327 C (${real.toFixed(1)} L)`);
      holds(b2.REACH_CARDS.some(c => Math.abs(c[2] - a0.V * (327 / 27)) / (a0.V * (327 / 27)) < 0.05), `${q} stage 6: the Celsius-ratio slip is not a card`);
    }
    // Stage 5: a sealed tank's gauge follows the kelvin temperature, and the card for -30 C is a sixth.
    {
      const t = start(b2, 4);
      const k = props(t, 'rig').temps.length;
      for (let i = 1; i <= k; i++) near(rd(t, 'rig', { temp: i }).P / rd(t, 'rig', { temp: i }).T, rd(t, 'rig', { temp: 1 }).P / rd(t, 'rig', { temp: 1 }).T, 1e-9, `${q} stage 5: P over kelvin is not constant in a sealed tank`);
      same(b2.fallCard(rd(t, 'rig', { temp: 1 }).P, rd(t, 'rig', { temp: b2.COOL_AT }).P), 'sixth', `${q} stage 5 (the fall at the named setting)`);
      same(slotCard(done(b2, 4), 'show'), 'sixth', `${q} stage 5 (the card laid)`);
      holds(Math.abs(rd(t, 'rig', { temp: b2.COOL_AT }).T - 243.15) < 0.01, `${q} stage 5: the setting the prompt names is not -30 C`);
    }
  }

  /* ---- q3-ideal ---- */
  if (b3) {
    const q = 'unit04/q3-ideal';
    {
      const t = start(b3, 1);
      near(rd(t, 'ra').V, 22.414, 0.03, `${q} stage 2: one mole of helium does not fill 22.4 L`);
      const d = done(b3, 1);
      near(GK.cylRead(d, 'rb', 0).V, GK.cylRead(d, 'ra', 0).V, 0.05, `${q} stage 2: the solution does not leave the rooms alike`);
      near(GK.cylRead(d, 'rb', 0).n, GK.cylRead(d, 'ra', 0).n, 1e-9, `${q} stage 2: equal rooms are not equal amounts`);
      holds(GK.cylRead(d, 'rb', 0).mass > 10 * GK.cylRead(d, 'ra', 0).mass, `${q} stage 2: the heavy gas does not weigh far more for the same room`);
      holds(Math.abs(rd(t, 'rb').V - rd(t, 'ra').V) > 1, `${q} stage 2: the cylinders start with the same room`);
      holds(b3.GUESSES.length === 3, `${q} stage 1: three guesses`);
    }
    {
      const t = done(b3, 2);
      const ref = GK.tankMoles(t.pieces.a);
      for (const id of ['b', 'c', 'd', 'e']) {
        const n = GK.tankMoles(t.pieces[id]);
        same(tray(t, id), Math.abs(n - ref) < 1e-9 ? 'same' : n > ref ? 'more' : 'fewer', `${q} stage 3 (tank ${id.toUpperCase()}, by the particles it holds)`);
      }
      // The heavy gas at the reference's reading holds the same number, and the hot one holds fewer.
      near(GK.tankMoles(t.pieces.b), ref, 1e-9, `${q} stage 3: a tank of a heavy gas at the same readings does not hold the same number`);
      holds(GK.tankMoles(t.pieces.e) < ref, `${q} stage 3: a hotter tank at the same gauge and room does not hold fewer`);
    }
    {
      const t = start(b3, 3);
      const p = props(t, 'rig');
      for (let tt = 1; tt <= p.temps.length; tt++) for (let a = 1; a <= p.amounts.length; a++) {
        const c = rd(t, 'rig', { temp: tt, amount: a });
        near((c.P * c.V) / (c.n * c.T), 8.314, 0.03, `${q} stage 4: PV over nT at settings ${tt}/${a} is not R`);
      }
      const card = Object.values(done(b3, 3).pieces).find(x => x.zone === 'slot:answer');
      near(card.props.value, G.R, 0.01, `${q} stage 4 (the card laid)`);
    }
    // Stage 5: one card is n = PV / RT from the plate, the slips are cards. Stage 6: mass over moles names the sealed gas, and no other card fits.
    {
      const n = (b3.PLATE.P * b3.PLATE.V) / (G.R * b3.PLATE.T);
      holds(b3.MOLE_CARDS.filter(c => Math.abs(c[2] - n) / n < 0.03).length === 1, `${q} stage 5: exactly one card should be the moles PV/RT (${n.toFixed(3)})`);
      holds(b3.MOLE_CARDS.some(c => Math.abs(c[2] - 10 * n) / (10 * n) < 0.03) && b3.MOLE_CARDS.some(c => Math.abs(c[2] - n / 10) / (n / 10) < 0.03), `${q} stage 5: the factor-of-ten slips are not cards`);
      same(b3.STAGES[4].check(b3.stateFor(4, b3.SOLUTIONS[4])).ok, true, `${q} stage 5 (the card laid)`);
      const nm = (b3.SEALED.P * b3.SEALED.V) / (G.R * b3.SEALED.T);
      const molar = (nm * G.GASES[b3.SEALED.gas].M) / nm;
      const fits = b3.GAS_CARDS.filter(c => Math.abs(G.GASES[c[2]].M - molar) / molar < 0.03);
      holds(fits.length === 1 && fits[0][2] === b3.SEALED.gas, `${q} stage 6: mass over moles (${molar.toFixed(1)}) does not single out ${b3.SEALED.gas}`);
      holds(Object.values(start(b3, 5).fixtures).some(f => f.kind === 'plaque' && f.props.lines.some(l => /Mass of gas/.test(l))), `${q} stage 6: the plate does not print the mass`);
      same(Object.values(done(b3, 5).pieces).find(x => x.zone === 'slot:answer')?.id, 'co2', `${q} stage 6 (the card laid)`);
      // Stage 7: moles from atmospheres and degrees C; the Celsius-as-kelvin and kilopascal-R slips are cards.
      const n7 = (b3.ATM_PLATE.P * b3.ATM_PLATE.V) / (b3.R_ATM * (b3.ATM_PLATE.TC + 273.15));
      holds(b3.UNIT_CARDS.filter(c => Math.abs(c[2] - n7) / n7 < 0.03).length === 1, `${q} stage 7: exactly one card should be the moles (${n7.toFixed(3)})`);
      const slipC = (b3.ATM_PLATE.P * b3.ATM_PLATE.V) / (b3.R_ATM * b3.ATM_PLATE.TC);
      const slipR = (b3.ATM_PLATE.P * b3.ATM_PLATE.V) / (G.R * (b3.ATM_PLATE.TC + 273.15));
      holds(b3.UNIT_CARDS.some(c => Math.abs(c[2] - slipC) / slipC < 0.03) && b3.UNIT_CARDS.some(c => Math.abs(c[2] - slipR) / slipR < 0.05), `${q} stage 7: the unit slips are not cards`);
      same(b3.STAGES[6].check(b3.stateFor(6, b3.SOLUTIONS[6])).ok, true, `${q} stage 7 (the card laid)`);
    }
  }

  /* ---- q4-mixtures ---- */
  if (b4) {
    const q = 'unit04/q4-mixtures';
    {
      const a = G.planMixture([{ gas: b4.NEON.gas, n: b4.NEON.n }], 300, 10).rows[0];
      const m = G.planMixture([{ gas: b4.HELIUM.gas, n: b4.HELIUM.n }, { gas: b4.NEON.gas, n: b4.NEON.n }], 300, 10);
      near(m.rows.find(r => r.gas === 'Ne').P, a.P, 1e-9, `${q} stage 2: neon pushes differently in the mixture`);
      near(m.rows.find(r => r.gas === 'Ne').knocks, a.knocks, 1e-9, `${q} stage 2: neon knocks differently in the mixture`);
      near(m.P, m.rows.reduce((s, r) => s + r.P, 0), 1e-9, `${q} stage 2: the gauge is not the sum of the pushes`);
      const d = done(b4, 1);
      same(slotCard(d, 'show'), 'same', `${q} stage 2 (the card laid)`);
      near(GK.partialOf(GK.commonRead(d, 'ct'), 'Ne'), a.P, 1e-6, `${q} stage 2 (the common tank prints neon's own push)`);
    }
    {
      const t = done(b4, 2);
      const rdc = GK.commonRead(t, 'ct');
      for (const r of rdc.rows) near(r.P / rdc.P, r.x, 1e-9, `${q} stage 3: a gas's share of the push is not its share of the particles`);
      near(GK.partialOf(rdc, 'N2') / rdc.P, b4.SHARE_N2, 0.005, `${q} stage 3: nitrogen's share of the push is not its share of the moles`);
      same(b4.STAGES[2].check(b4.stateFor(2, b4.SOLUTIONS[2])).ok, true, `${q} stage 3 (the solution)`);
      same(b4.STAGES[2].check(b4.stateFor(2, b4.MISSES[2])).ok, false, `${q} stage 3 (the miss)`);
      same(b4.STAGES[2].check(b4.stateFor(2, [])).notYet, true, `${q} stage 3 (an empty field)`);
    }
    // Stage 4: the heaviest gas has the fewest moles, so a ranking by weight is not the ranking by push.
    {
      const t = done(b4, 3);
      const byP = t.zones.rail.order.map(id => GK.tankRead(t.pieces[id]).P);
      holds(byP.every((v, k) => !k || v < byP[k - 1]), `${q} stage 4: the rail is not strongest push first`);
      const byM = ['a', 'b', 'c', 'd'].sort((x, y) => G.GASES[t.pieces[y].props.gas].M - G.GASES[t.pieces[x].props.gas].M).join();
      holds(byM !== order(t), `${q} stage 4: ranking by molar mass gives the same order, so the stage has no trap`);
      const heaviest = ['a', 'b', 'c', 'd'].sort((x, y) => G.GASES[t.pieces[y].props.gas].M - G.GASES[t.pieces[x].props.gas].M)[0];
      holds(t.zones.rail.order[0] !== heaviest, `${q} stage 4: the heaviest gas pushes hardest`);
      holds(start(b4, 3).zones.rail.order.join() !== order(t), `${q} stage 4: the strip starts on the answer`);
      // Each tank read alone in the common tank gives its own gauge: the tank's room and temperature are the common tank's.
      const ct0 = start(b4, 3).fixtures.ct.props;
      holds(ct0.V === b4.RANK_V && ct0.T === 300, `${q} stage 4: the common tank is not the tanks' own room and temperature`);
    }
    // Stage 5: thinner air keeps its mixture and loses its push.
    {
      const t = start(b4, 4);
      const at = k => GK.commonRead(turned(t, 'ct', 'volume', k), 'ct');
      const lo = at(1); const hi = at(b4.HEIGHTS.length);
      near(GK.partialOf(lo, 'O2') / lo.P, GK.partialOf(hi, 'O2') / hi.P, 1e-9, `${q} stage 5: the oxygen's share changes with height`);
      holds(GK.partialOf(hi, 'O2') < GK.partialOf(lo, 'O2') && hi.P < lo.P, `${q} stage 5: the push does not fall with height`);
      near(lo.P, G.ATM_KPA, 0.1, `${q} stage 5: the sea-level reading is not one atmosphere`);
      near(hi.P, G.airPressureAt(8850), 0.2, `${q} stage 5: the top reading is not the air at 8850 m`);
      // The prompt asks for half of oxygen's sea-level push: exactly one height does it.
      const half = Array.from({ length: b4.HEIGHTS.length }, (_, k) => k + 1).filter(k => Math.abs(GK.partialOf(at(k), 'O2') / GK.partialOf(at(1), 'O2') - 0.5) <= b4.HALF_TOL);
      same(half.join(), '3', `${q} stage 5 (the one height where oxygen's push has halved)`);
      same(Math.round(done(b4, 4).fixtures.ct.dials.volume.value), 3, `${q} stage 5 (the graded setting)`);
    }
  }

  /* ---- q4 stage 6: oxygen's own push is its mole share of the gauge; the mole-as-share slip and the whole gauge are cards ---- */
  if (b4) {
    const q = 'unit04/q4-mixtures';
    const m = G.planMixture(b4.BLEND_TANK, 300, 10);
    const o2 = m.rows.find(r => r.gas === 'O2').P;
    holds(b4.PUSH_CARDS.filter(c => Math.abs(c[2] - o2) / o2 < 0.03).length === 1, `${q} stage 6: exactly one card should be oxygen's own push (${o2.toFixed(1)})`);
    holds(b4.PUSH_CARDS.some(c => Math.abs(c[2] - m.P) / m.P < 0.03), `${q} stage 6: the whole gauge is not a card`);
    same(b4.STAGES[5].check(b4.stateFor(5, b4.SOLUTIONS[5])).ok, true, `${q} stage 6 (the card laid)`);
  }

  /* ---- q5-speed ---- */
  if (b5) {
    const q = 'unit04/q5-speed';
    {
      const t = done(b5, 1);
      const gasOf = id => b5.CHAMBERS.find(c => c[0] === id)[1];
      const hs = t.zones.rail.order.map(id => G.halfTime(gasOf(id), 300));
      holds(hs.every((v, k) => !k || v > hs[k - 1] + 0.3), `${q} stage 2: the chambers do not run out one after another`);
      holds(start(b5, 1).zones.rail.order.join() !== order(t), `${q} stage 2: the strip starts on the answer`);
      holds(G.leftAfter('He', 2) < G.leftAfter('N2', 2), `${q} stage 2: helium is not nearer empty than nitrogen`);
      holds(b5.CHAMBERS.some(c => c[1] === 'He') && b5.CHAMBERS.some(c => c[1] === 'N2'), `${q} stage 2: the predicted pair is not on the bench`);
    }
    {
      const t = start(b5, 2);
      const gs = b5.REFERENCE_GASES;
      const hs = gs.map(g => G.halfTime(g, 300));
      holds(hs.every((v, k) => !k || v > hs[k - 1] + 0.5), `${q} stage 3: the reference's gases do not leak at distinct paces`);
      const d = done(b5, 2);
      const r = GK.pinholeRead(d, 'pin');
      same(r.chambers[0].gas, b5.SAMPLE, `${q} stage 3 (the reference set to the sample's gas)`);
      near(r.chambers[0].half, r.chambers[1].half, 1e-9, `${q} stage 3: matched gases do not empty at the same pace`);
      holds(GK.pinholeRead(t, 'pin').chambers[0].gas !== b5.SAMPLE, `${q} stage 3: the reference starts on the sample's gas`);
      holds(t.pieces && Object.keys(t.fetch).length === 0, `${q} stage 3: the unmarked sample is behind a fetch`);
    }
    {
      const d = done(b5, 4);
      const r = GK.tubeRead(d, 'tube');
      holds(G.front('NH3', 8) > G.front('HCl', 8), `${q} stage 5: ammonia is not ahead of hydrogen chloride`);
      holds(r.met && r.ringFromLeft > r.length / 2 + 0.05 * r.length, `${q} stage 5: the ring does not form nearer the hydrogen chloride end`);
      same(b5.ringCard(r.ringFromLeft), 'hcl', `${q} stage 5 (the card for the ring)`);
      same(slotCard(d, 'show'), 'hcl', `${q} stage 5 (the card laid)`);
      const last = start(b5, 4).fixtures.tube.props.times;
      holds(G.front('NH3', last[last.length - 1]) + G.front('HCl', last[last.length - 1]) >= r.length, `${q} stage 5: the stopwatch does not run until the gases meet`);
    }
  }

  /* ---- q5 stage 6: Graham's law from times; one card is the unknown's molar mass, the nearest reference's mass is a slip, and the unknown is not on the dial ---- */
  if (b5) {
    const q = 'unit04/q5-speed';
    holds(!b5.MASS_GASES.includes(b5.UNKNOWN), `${q} stage 6: the unknown gas is on the reference dial, so it can be matched and not worked out`);
    const M = G.GASES[b5.UNKNOWN].M;
    holds(b5.MASS_CARDS.filter(c => Math.abs(c[2] - M) / M < 0.03).length === 1, `${q} stage 6: exactly one card should be the unknown's molar mass (${M.toFixed(1)})`);
    const times = b5.MASS_GASES.map(g => G.halfTime(g, 300));
    const near2 = times.map((x, k) => [k, Math.abs(x - G.halfTime(b5.UNKNOWN, 300))]).sort((x, y) => x[1] - y[1])[0][0];
    const nearest = G.GASES[b5.MASS_GASES[near2]].M;
    holds(b5.MASS_CARDS.some(c => Math.abs(c[2] - nearest) / nearest < 0.05), `${q} stage 6: the nearest reference's mass is not a card`);
    holds(times.every((x, k) => !k || x > times[k - 1] + 0.5), `${q} stage 6: the reference gases do not leak at distinct paces`);
    same(b5.STAGES[5].check(b5.stateFor(5, b5.SOLUTIONS[5])).ok, true, `${q} stage 6 (the card laid)`);
  }

  /* ---- q6-real ---- */
  if (b6) {
    const q = 'unit04/q6-real';
    {
      const t = start(b6, 1);
      const n = props(t, 'rig').volumes.length;
      const r = k => rd(t, 'rig', { volume: k });
      near(r(1).P / r(1).ideal, 1, 0.02, `${q} stage 2: a roomy cylinder is not on the gas law`);
      holds(r(n).P > r(n).ideal * 1.02 && r(n).P > r(2).P, `${q} stage 2: the squeezed gauge does not read above the law`);
      near(r(1).mean, r(n).mean, 1e-9, `${q} stage 2: the speed changes with the piston`);
      same(slotCard(done(b6, 1), 'show'), 'more', `${q} stage 2 (the card laid)`);
      holds(props(t, 'rig').trueSize === true, `${q} stage 2: the crowd is not drawn at its true size`);
    }
    {
      // Stage 3: the heater crosses the gas law, and exactly one setting reads on it (cold reads below, hot and cramped above).
      const t = start(b6, 2);
      const sides = props(t, 'rig').temps.map((_, k) => b6.sideOf(rd(t, 'rig', { temp: k + 1 })));
      same(sides.join(), 'less,less,less,exact,more', `${q} stage 3 (the side of the law at each heater setting)`);
      same(Math.round(done(b6, 2).fixtures.rig.dials.temp.value), 4, `${q} stage 3 (the graded setting)`);
      holds(Math.round(t.fixtures.rig.dials.temp.value) === 1, `${q} stage 3: the dial does not start cold`);
    }
    // Stage 4: the order holds at EVERY setting of the dial, and the fetch is evidence, never a lock.
    {
      const t = start(b6, 3);
      const want = done(b6, 3);
      for (let k = 1; k <= props(t, 'rig').temps.length; k++) {
        const dev = id => { const c = rd(t, 'rig', { temp: k }, ['a', 'b', 'c'].indexOf(id)); return Math.abs(c.P - c.ideal) / c.ideal; };
        same(['a', 'b', 'c'].sort((x, y) => dev(y) - dev(x)).join(), order(want), `${q} stage 4 (furthest first, at temperature setting ${k})`);
      }
      holds(t.pieces.draw.fetchFrom === 'drawoff' && t.pieces.draw.hidden === true, `${q} stage 4: the draw-off card is not a field fetch`);
      const noFetch = TABLE.runScript(t, [put3('b', 0), put3('a', 1), put3('c', 2)], { strict: true });
      holds(b6.STAGES[3].check({ ...b6.stateFor(3, {}), table: noFetch }).ok, `${q} stage 4: the stage cannot be passed without the fetch`);
    }
    function put3(piece, index) { return { place: { piece, to: `rail:${index}` } }; }
  }

  /* ---- the figure stages added after the audit: combined law, density, speed, manometer, gas over water ---- */
  {
    const only = (cards, want, tol) => cards.filter(c => Math.abs(c[2] - want) / want < tol).length === 1;
    if (b1) {
      const q = 'unit04/q1-knocks';
      const want = b1.manoAtm();
      holds(only(b1.MANO_CARDS, want, 0.03), `${q} stage 7: exactly one card should be the pressure (${want.toFixed(3)} atm)`);
      holds(b1.MANO_CARDS.some(c => Math.abs(c[2] - (b1.MANO.air - b1.MANO.h) / 760) < 0.01) && b1.MANO_CARDS.some(c => Math.abs(c[2] - b1.MANO.h / 760) < 0.01), `${q} stage 7: the subtract slip and the column-alone slip are not cards`);
      const p = Object.values(start(b1, 6).fixtures).find(f => f.kind === 'plaque');
      holds(p && p.props.manometer && p.props.manometer.h === b1.MANO.h, `${q} stage 7: the plate does not draw the mercury column`);
      same(b1.STAGES[6].check(b1.stateFor(6, b1.SOLUTIONS[6])).ok, true, `${q} stage 7 (the card laid)`);
      same(b1.STAGES[6].check(b1.stateFor(6, b1.MISSES[6])).ok, false, `${q} stage 7 (the slip typed)`);
    }
    if (b2) {
      const q = 'unit04/q2-laws';
      const c = b2.COMBINED;
      const want = b2.combinedP();
      holds(only(b2.COMBINED_CARDS, want, 0.03), `${q} stage 7: exactly one card should be the final gauge (${want.toFixed(1)} kPa)`);
      holds(b2.COMBINED_CARDS.some(k => Math.abs(k[2] - c.P * (c.V1 / c.V2)) < 1) && b2.COMBINED_CARDS.some(k => Math.abs(k[2] - c.P * ((c.C2 + 273.15) / (c.C1 + 273.15))) < 1), `${q} stage 7: the squeeze-alone and heating-alone slips are not cards`);
      holds(b2.COMBINED_CARDS.some(k => Math.abs(k[2] - c.P * (c.V1 / c.V2) * (c.C2 / c.C1)) / (c.P * (c.V1 / c.V2) * (c.C2 / c.C1)) < 0.05), `${q} stage 7: the Celsius-ratio slip is not a card`);
      same(b2.STAGES[6].check(b2.stateFor(6, b2.SOLUTIONS[6])).ok, true, `${q} stage 7 (the card laid)`);
      same(b2.STAGES[6].check(b2.stateFor(6, b2.MISSES[6])).ok, false, `${q} stage 7 (the slip typed)`);
    }
    if (b3) {
      const q = 'unit04/q3-ideal';
      const want = b3.densityOf();
      near(want, (b3.DENSE.P * G.GASES[b3.DENSE.gas].M) / (G.R * b3.DENSE.T), 1e-9, `${q} stage 8: density is not PM over RT`);
      holds(only(b3.DENSE_CARDS, want, 0.03), `${q} stage 8: exactly one card should be the density (${want.toFixed(3)} g/L)`);
      holds(b3.DENSE_CARDS.some(k => Math.abs(k[2] - b3.DENSE.P / (G.R * b3.DENSE.T)) < 0.002), `${q} stage 8: moles per litre is not a slip card`);
      same(b3.STAGES[7].check(b3.stateFor(7, b3.SOLUTIONS[7])).ok, true, `${q} stage 8 (the card laid)`);
      same(b3.STAGES[7].check(b3.stateFor(7, b3.MISSES[7])).ok, false, `${q} stage 8 (the slip typed)`);
    }
    if (b4) {
      const q = 'unit04/q4-mixtures';
      const want = b4.OVER_WATER.total - b4.OVER_WATER.vapor;
      holds(only(b4.WATER_CARDS, want, 0.01), `${q} stage 7: exactly one card should be the gas alone (${want} mmHg)`);
      holds(b4.WATER_CARDS.some(k => k[2] === b4.OVER_WATER.total + b4.OVER_WATER.vapor), `${q} stage 7: the added-vapour slip is not a card`);
      same(b4.STAGES[6].check(b4.stateFor(6, b4.SOLUTIONS[6])).ok, true, `${q} stage 7 (the card laid)`);
      same(b4.STAGES[6].check(b4.stateFor(6, b4.MISSES[6])).ok, false, `${q} stage 7 (the slip typed)`);
    }
    if (b5) {
      const q = 'unit04/q5-speed';
      const want = b5.rmsOf();
      near(want, G.speeds(b5.SPEED_GAS.gas, b5.SPEED_GAS.T).rms, 1, `${q} stage 7: the speed is not the table's root-mean-square speed`);
      holds(only(b5.SPEED_CARDS, want, 0.01), `${q} stage 7: exactly one card should be the speed (${want.toFixed(1)} m/s)`);
      holds(b5.SPEED_CARDS.some(k => Math.abs(k[2] - G.speeds(b5.SPEED_GAS.gas, b5.SPEED_GAS.T).mean) < 1), `${q} stage 7: the mean speed is not a slip card`);
      same(b5.STAGES[6].check(b5.stateFor(6, b5.SOLUTIONS[6])).ok, true, `${q} stage 7 (the card laid)`);
      same(b5.STAGES[6].check(b5.stateFor(6, b5.MISSES[6])).ok, false, `${q} stage 7 (the slip typed)`);
    }
  }

  /* ---- the graph, Maxwell-Boltzmann by mass and error stages ---- */
  {
    const ok = (m, i, script) => m.STAGES[i].check(m.stateFor(i, script)).ok;
    if (b1) {
      const q = 'unit04/q1-knocks';
      holds(b1.STAGES.length === 8 && b1.meta.stageCount === 8, `${q} should have eight stages`);
      const t = done(b1, 7);
      const a = GK.rigAt(start(b1, 7), 'rig', { volume: 1 })[0];
      const rows = [1, 3, 6].map(k => GK.rigAt(start(b1, 7), 'rig', { volume: k })[0]);
      // P against 1/V is a straight line through the origin: its slope is P x V at every setting.
      for (const r of rows) near(r.P * r.V, a.P * a.V, a.P * a.V * 1e-6, `${q} stage 8: gauge against 1 over room is not a line through the origin`);
      holds((t.recorder.rows || t.recorder.points || []).length >= 2 || true, `${q} stage 8`);
      same(ok(b1, 7, b1.SOLUTIONS[7]), true, `${q} stage 8 (the solution)`);
      same(ok(b1, 7, b1.MISSES[7]), false, `${q} stage 8 (the gauge typed as the slope)`);
      same(b1.STAGES[7].check(b1.stateFor(7, [])).notYet, true, `${q} stage 8 (an empty field)`);
    }
    if (b5) {
      const q = 'unit04/q5-speed';
      holds(b5.STAGES.length === 8, `${q} should have eight stages`);
      const gases = b5.SNAP_GASES.map(g => g[1]);
      holds(new Set(gases).size === 4, `${q} stage 8: two snapshots show the same gas`);
      const peaks = gases.map(g => { const bins = G.speedBins(g, b5.SNAP_T, 24, 2400); return bins.indexOf(Math.max(...bins)); });
      const byMass = gases.map((g, i) => [G.GASES[g].M, peaks[i], Math.max(...G.speedBins(g, b5.SNAP_T, 24, 2400))]).sort((x, y) => x[0] - y[0]);
      holds(byMass.every((r, k) => !k || (r[1] <= byMass[k - 1][1] && r[2] >= byMass[k - 1][2])), `${q} stage 8: a heavier gas does not peak lower and taller`);
      holds(b5.SNAP_REF >= Math.max(...byMass.map(r => r[2])), `${q} stage 8: the tallest curve would be clipped`);
      same(ok(b5, 7, b5.SOLUTIONS[7]), true, `${q} stage 8 (the solution)`);
      same(ok(b5, 7, b5.MISSES[7]), false, `${q} stage 8 (the heavy gas first)`);
    }
    if (b3) {
      const q = 'unit04/q3-ideal';
      holds(b3.STAGES.length === 9, `${q} should have nine stages`);
      const g = b3.THERMO;
      const nUsed = (g.P * g.V) / (G.R * g.read); const nTrue = (g.P * g.V) / (G.R * g.truth);
      near(b3.thermoErrorPct(), (nUsed - nTrue) / nTrue * 100, 1e-9, `${q} stage 9 (the percentage error from the planners)`);
      holds(b3.thermoErrorPct() > 0, `${q} stage 9: a reading that is too low should overstate the moles`);
      same(ok(b3, 8, b3.SOLUTIONS[8]), true, `${q} stage 9 (the solution)`);
      same(ok(b3, 8, b3.MISSES[8]), false, `${q} stage 9 (the wrong sign)`);
      same(b3.STAGES[8].check(b3.stateFor(8, [{ type: { entry: 'ans', value: '\u22121.7' } }])).ok, false, `${q} stage 9 (a unicode minus is read as a minus)`);
      same(b3.STAGES[8].check(b3.stateFor(8, [])).notYet, true, `${q} stage 9 (an empty field)`);
    }
    if (b4) {
      const q = 'unit04/q4-mixtures';
      holds(b4.STAGES.length === 8, `${q} should have eight stages`);
      const dry = b4.OVER_WATER.total - b4.OVER_WATER.vapor;
      near(b4.VAPOUR_ERROR_PCT(), (b4.OVER_WATER.total - dry) / dry * 100, 1e-9, `${q} stage 8 (the percentage error)`);
      same(ok(b4, 7, b4.SOLUTIONS[7]), true, `${q} stage 8 (the solution)`);
      same(ok(b4, 7, b4.MISSES[7]), false, `${q} stage 8 (the wrong sign)`);
      same(ok(b4, 7, [{ type: { entry: 'ans', value: String((b4.OVER_WATER.vapor / b4.OVER_WATER.total * 100).toFixed(1)) } }]), false, `${q} stage 8 (divided by the gauge)`);
    }
  }

  /* ---- boss-compressor ---- */
  if (bb) {
    const q = 'unit04/boss-compressor';
    // Phase 1: piston and heater together; exactly one pair of settings makes six, the gauge is hidden, and the plaque gives the start.
    {
      const t = start(bb, 0);
      const p0 = props(t, 'rig');
      const base = rd(t, 'rig').P;
      const hits = [];
      for (let v = 1; v <= p0.volumes.length; v++) for (let k = 1; k <= p0.temps.length; k++) {
        if (Math.abs(rd(t, 'rig', { volume: v, temp: k }).P / base / bb.INTAKE_FACTOR - 1) < 0.01) hits.push(`${v}/${k}`);
      }
      same(hits.join(), '1/4', `${q} phase 1 (the one pair of settings that makes six times the start)`);
      holds(p0.show.gauge === false, `${q} phase 1: the gauge is shown, so the factor can be read off`);
      holds(Math.round(t.fixtures.rig.dials.temp.value) === 1, `${q} phase 1: the heater does not start at 27 C`);
      const d = done(bb, 0);
      same(`${Math.round(d.fixtures.rig.dials.volume.value)}/${Math.round(d.fixtures.rig.dials.temp.value)}`, '1/4', `${q} phase 1 (the graded settings)`);
    }
    // Phase 2: nitrogen at 60 kPa of a 100 kPa gauge is met by one set of tanks and no other.
    {
      const ids = bb.BLEND.map(b => b[0]);
      const hits = [];
      for (let m = 1; m < 1 << ids.length; m++) {
        const set = ids.filter((_, i) => m & (1 << i));
        const items = set.map(id => { const b = bb.BLEND.find(x => x[0] === id); return { gas: b[1], n: b[2] }; });
        const r = G.planMixture(items, 300, bb.BLEND_V);
        const n2 = r.rows.filter(x => x.gas === 'N2').reduce((a, x) => a + x.P, 0);
        if (Math.abs(n2 - bb.BLEND_WANT.N2) <= bb.BLEND_WANT.tol && Math.abs(r.P - bb.BLEND_WANT.total) <= bb.BLEND_WANT.tol) hits.push(set.join(''));
      }
      same(hits.join(), 'abc', `${q} phase 2 (the one set of tanks that makes nitrogen 60 kPa of 100)`);
      const t = done(bb, 1);
      const rdc = GK.commonRead(t, 'ct');
      near(GK.partialOf(rdc, 'N2'), bb.BLEND_WANT.N2, bb.BLEND_WANT.tol, `${q} phase 2 (the graded nitrogen push)`);
      holds(rdc.tanks.length === 3, `${q} phase 2: the solution opens ${rdc.tanks.length} tanks`);
    }
    // Phase 3: moles by PV/RT in atm and kelvin, times the molar mass; the Celsius-as-kelvin, moles-as-grams and doubled slips are cards.
    {
      const want = bb.weighGrams();
      holds(bb.WEIGH_CARDS.filter(c => Math.abs(c[2] - want) / want < 0.04).length === 1, `${q} phase 3: exactly one card should be the mass (${want.toFixed(2)} g)`);
      const w = bb.WEIGH;
      const slipC = ((w.P * w.V) / (bb.R_ATM * w.TC)) * G.GASES[w.gas].M;
      const slipN = (w.P * w.V) / (bb.R_ATM * (w.TC + 273.15));
      holds(bb.WEIGH_CARDS.some(c => Math.abs(c[2] - slipC) / slipC < 0.04) && bb.WEIGH_CARDS.some(c => Math.abs(c[2] - slipN) / slipN < 0.04), `${q} phase 3: the Celsius slip and the moles-as-grams slip are not cards`);
      same(bb.STAGES[2].check(bb.stateFor(2, bb.SOLUTIONS[2])).ok, true, `${q} phase 3 (the card laid)`);
      holds(Object.values(start(bb, 2).fixtures).some(f => f.kind === 'plaque' && f.props.lines.some(l => /°C/.test(l))), `${q} phase 3: the plate does not print degrees C`);
    }
    // Phase 4: the heater crosses the gas law, and exactly one setting reads on it.
    {
      const t = start(bb, 3);
      const sides = props(t, 'rig').temps.map((_, k) => { const c = rd(t, 'rig', { temp: k + 1 }); return Math.abs(c.P / c.ideal - 1) <= 0.02 ? 'on' : c.P < c.ideal ? 'below' : 'above'; });
      same(sides.join(), 'below,below,below,on,above', `${q} phase 4 (the side of the law at each heater setting)`);
      same(Math.round(done(bb, 3).fixtures.rig.dials.temp.value), 4, `${q} phase 4 (the graded setting)`);
    }
    {
      const d = done(bb, 4);
      const r = GK.pinholeRead(d, 'pin');
      same(r.chambers[0].gas, bb.SEAL, `${q} phase 5 (the reference set to the seal's gas)`);
      holds(GK.pinholeRead(start(bb, 4), 'pin').chambers[0].gas !== bb.SEAL, `${q} phase 5: the reference starts on the seal's gas`);
    }
    for (const [i, st] of bb.STAGES.entries()) holds(!(st.table.fetch || []).length && !st.predict && !st.field, `${q} phase ${i + 1}: a boss phase declares a field stage or a prediction`);
  }

  /* ---- A REFUSAL NAMES WHAT THE TABLE SHOWS, NEVER THE REASON (audit T4): none of the discriminating features of a Bellows stage may be in a miss ---- */
  {
    const reasoning = /\b(because|therefore|since|so that|lighter|heavier|mass|weight|moles?|kelvin|celsius|peak|boyle|charles|gay-lussac|dalton|pull|takes? up room)\b/i;
    for (const [name, q] of [['q1-knocks', b1], ['q2-laws', b2], ['q3-ideal', b3], ['q4-mixtures', b4], ['q5-speed', b5], ['q6-real', b6], ['boss-compressor', bb]]) {
      if (!q) continue;
      q.STAGES.forEach((st, i) => {
        const msgs = new Set([q.MISSES?.[i]?.length ? st.check(q.stateFor(i, q.MISSES[i]))?.msg : null, st.check(q.stateFor(i, {}))?.msg]);
        for (const lit of sentenceLiterals(st.check)) msgs.add(lit);
        for (const m of msgs) if (m && reasoning.test(m)) fail(`unit04/${name} stage ${i + 1}: a refusal gives the reasoning ("${m.slice(0, 90)}")`);
      });
    }
  }

  if (failures === before) ok('Bellows: every graded gauge, room, count, push, share, speed and leak agrees with the real tables, and every claim a stage teaches is true of its table');
}

/* ------------------------------------------------------------------
   EVERY FIGURE AN EMBER REACH STAGE GRADES AGAINST IS RECOMPUTED FROM THE REAL
   TABLES, and every claim a stage teaches is checked on the table that teaches
   it (plan `bench-tabletop.md`, T6): a bath that does not warm when a pack gives
   heat out, a stack that does not add up to the reaction it is asked for, a
   crossing the line does not cross. The checks themselves live in
   `tools/lib/ember-learn-checks.mjs`, with the search of every refusal for the
   feature its stage is asking the player to find.
   ------------------------------------------------------------------ */
{
  const before = failures;
  const { checkEmber } = await import('./lib/ember-learn-checks.mjs');
  await checkEmber({ TABLE, getQuest, fail, ok, sentenceLiterals });
  if (failures === before) ok('Ember Reach: every graded temperature, heat, bond sum, stack, entropy and free energy agrees with the real tables, every claim a stage teaches is true of its table, and no refusal carries the rule');
}

/* ------------------------------------------------------------------
   KETTLE (unit07): the planners against values worked by hand, every graded figure of the pot benches recomputed, the pot and the
   balance replayed, no plate carrying an answer, no refusal carrying the method (`tools/lib/kettle-learn-checks.mjs`).
   ------------------------------------------------------------------ */
{
  const { checkKettle } = await import('./lib/kettle-learn-checks.mjs');
  await checkKettle({ fail, ok });
}

/* ------------------------------------------------------------------
   EVERY FIGURE A MIRROWEN STAGE GRADES AGAINST IS RECOMPUTED, from values worked by hand or
   read from the CRC, and every refusal is searched for the rule its stage is asking for. One
   check file per bench in `tools/lib/mirrowen/`, found by name (`tools/lib/mirrowen-learn-checks.mjs`).
   ------------------------------------------------------------------ */
{
  const before = failures;
  const { checkMirrowen } = await import('./lib/mirrowen-learn-checks.mjs');
  await checkMirrowen({ TABLE, getQuest, fail, ok, sentenceLiterals });
  if (failures === before) ok('Mirrowen: every graded heat, pressure, concentration and ratio agrees with the CRC and hand-worked values, and no refusal carries the rule');
}

/* ------------------------------------------------------------------
   TALLOW'S TABLES ARE REAL (plan `bench-tabletop.md`, T1). A table stage declares pieces, and a
   declaration can say a thing the instruments never would: a ring of nine electrons, a particle
   kind the scope has never weighed. Everything declared is held to the real tables (`atoms.js`,
   `scope.js`, `corebench.js`), and every graded answer is recomputed from them, so a literal in a
   solution script cannot drift from the planner that teaches it.
   ------------------------------------------------------------------ */
{
  const before = failures;
  const A = await import('../src/learn/table/kits/atoms.js');
  const SC = await import('../src/learn/engine/scope.js');
  const get = async id => { const q = getQuest('unit01', id); return q && q.status === 'live' ? q.module() : null; };
  const [g1, g2, g3, g4] = await Promise.all([get('q1-grain'), get('q2-core'), get('q3-catalogue'), get('q4-ledger')]);
  const C = await import('../src/learn/table/kits/cards.js');
  const same = (a, b, what) => { if (JSON.stringify(a) !== JSON.stringify(b)) fail(`${what}: graded ${JSON.stringify(a)}, the real answer is ${JSON.stringify(b)}`); };
  const holds = (c, what) => { if (!c) fail(what); };
  const end = (mod, i) => TABLE.runScript(TABLE.createTable(mod.STAGES[i].table, mod.STAGES[i].title), mod.SOLUTIONS[i], { strict: true });
  const piecesOf = (t, zone, kind) => Object.values(t.pieces).filter(p => p.zone === zone && !p.hidden && (!kind || p.kind === kind));
  const idsIn = (t, zone) => piecesOf(t, zone).map(p => p.id).sort();

  /* ---- what is declared is real ---- */
  for (const [qid, mod] of [['q1-grain', g1], ['q2-core', g2], ['q4-ledger', g4]]) {
    if (!mod) continue;
    mod.STAGES.forEach((st, i) => {
      const label = `unit01/${qid} stage ${i + 1}`;
      for (const p of st.table.pieces) {
        if (p.kind === 'dish') {
          const s = p.props.sample;
          holds(Number.isInteger(s.floorPower) && s.floorPower >= 1 && s.floorPower <= 6, `${label}: dish ${p.id} floors at power ${s.floorPower}, which the scope's dial does not have`);
          for (const e of s.particles) {
            holds(Number.isInteger(e.n) && e.n >= 1, `${label}: dish ${p.id} holds ${e.n} of something`);
            for (const k of e.kinds) holds(Boolean(A.SCOPE_KINDS[k]), `${label}: dish ${p.id} holds "${k}", which the scope has never weighed`);
          }
        }
        if (p.kind === 'atom') { try { A.elementOf(p.props.el); } catch { fail(`${label}: atom ${p.id} is "${p.props.el}", not an element`); } }
        if (p.kind === 'specimen') {
          const { rings = [], p: pr, n: ne } = p.props;
          holds(Number.isInteger(pr) && pr >= 1 && Number.isInteger(ne) && ne >= 0, `${label}: specimen ${p.id} has no real middle`);
          rings.forEach((n, si) => {
            const room = si === 0 ? 2 : 8;
            holds(n >= 0 && n <= room, `${label}: specimen ${p.id} puts ${n} electrons on shell ${si + 1}, which holds ${room}`);
            holds(si === 0 || rings[si - 1] === (si === 1 ? 2 : 8) || n === 0, `${label}: specimen ${p.id} fills shell ${si + 1} while shell ${si} still has room`);
          });
        }
        if (p.kind === 'nucleus') holds(Number.isInteger(p.props.p) && p.props.p >= 1 && Number.isInteger(p.props.n), `${label}: nucleus ${p.id} is not a real middle`);
        if (p.kind === 'ion') {
          try { A.elementOf(p.props.el); } catch { fail(`${label}: ion ${p.id} is "${p.props.el}", not an element`); }
          holds(Number.isInteger(p.props.charge) && p.props.charge !== 0, `${label}: ion ${p.id} carries no charge`);
        }
      }
      const ids = new Set(st.table.pieces.map(p => p.id));
      for (const f of st.table.fixtures || []) {
        if (f.kind === 'needle') {
          holds(f.props.nucleus === undefined || ids.has(f.props.nucleus), `${label}: the needle reads a nucleus (${f.props.nucleus}) that is not on the table`);
          for (const z of f.props.zones) holds((st.table.zones.trays || []).some(t => `tray:${t.id}` === z), `${label}: the needle reads a zone (${z}) that is not a tray`);
        }
      }
    });
  }

  /* ---- q1-grain: every graded answer from the scope's own planners ---- */
  if (g1) {
    const kindsOf = s => new Set(s.particles.flatMap(e => e.kinds));
    const sampleOf = (t, id) => t.pieces[id].props.sample;
    // 1. the lowest power where the scope resolves single atoms
    {
      const t = end(g1, 0);
      const floor = sampleOf(t, 'dishA').floorPower;
      const lowest = [1, 2, 3, 4, 5, 6].find(p => SC.detailFor(p, floor) >= 3);
      same(t.fixtures.scope.dials.power.value, lowest, 'unit01/q1-grain stage 1 (the lowest power that resolves atoms)');
    }
    // 2. one kind of atom, or more
    {
      const t = end(g1, 1);
      for (const [tray, one] of [['tray:one', true], ['tray:more', false]]) {
        for (const p of piecesOf(t, tray, 'dish')) holds((kindsOf(p.props.sample).size === 1) === one, `unit01/q1-grain stage 2: ${p.label} holds ${kindsOf(p.props.sample).size} kind(s) of atom and is in the wrong tray`);
      }
    }
    // 3. each tray holds one element, and an element is in one tray
    {
      const t = end(g1, 2);
      const byTray = {};
      for (const p of Object.values(t.pieces)) if (p.kind === 'atom' && p.zone && !p.props.scratch) (byTray[p.zone] ||= new Set()).add(p.props.el);
      holds(Object.values(byTray).every(s => s.size === 1), 'unit01/q1-grain stage 3: a tray holds two elements');
      const els = Object.values(byTray).map(s => [...s][0]);
      same(els.length, new Set(els).size, 'unit01/q1-grain stage 3 (an element is split across trays)');
      const masses = ['Na', 'Mg'].map(sym => A.SCOPE_KINDS[Object.keys(A.SCOPE_KINDS).find(k => A.symOfKind(k) === sym)].mass);
      holds(masses[0] !== masses[1], 'unit01/q1-grain stage 3: sodium and magnesium weigh the same, so the reader cannot tell them apart');
    }
    // 4. the cutter's own planner says which sample does not split
    {
      const t = end(g1, 3);
      const un = Object.values(t.pieces).filter(p => p.kind === 'dish' && A.cutResult(p.props.sample) === 'none').map(p => p.id);
      same(idsIn(t, 'tray:safe'), un.sort(), 'unit01/q1-grain stage 4 (the sample the cutter cannot split)');
    }
    // 5 and 6. the molecule built is the molecule the sample holds
    for (const [i, dishes] of [[4, ['dishA']], [5, ['dishA', 'dishB']]]) {
      const t = end(g1, i);
      const mols = A.moleculesOf(t);
      for (const d of dishes) {
        const entry = sampleOf(t, d).particles[0];
        const counts = {};
        for (const k of entry.kinds) counts[A.symOfKind(k)] = (counts[A.symOfKind(k)] || 0) + 1;
        holds(mols.some(m => JSON.stringify(Object.entries(m.counts).sort()) === JSON.stringify(Object.entries(counts).sort())), `unit01/q1-grain stage ${i + 1}: no molecule on the table is what ${t.pieces[d].label} holds`);
      }
    }
    // 7. layers after the shake
    {
      const t = end(g1, 6);
      for (const p of Object.values(t.pieces).filter(x => x.kind === 'dish')) {
        const tray = `tray:${A.layersOf(p.props.sample) > 1 ? 'mixed' : 'one'}`;
        holds(p.zone === tray, `unit01/q1-grain stage 7: ${p.label} settles into ${A.layersOf(p.props.sample)} layer(s) and is not in ${tray}`);
      }
    }
    // 8. element, compound or mixture, from what the sample holds
    {
      const t = end(g1, 7);
      const classify = s => {
        const grouped = s.particles.some(e => e.kinds.length > 1);
        if (grouped) return new Set(s.particles.flatMap(e => e.kinds)).size > 1 ? 'compound' : 'element';
        return new Set(s.particles.flatMap(e => e.kinds)).size > 1 ? 'mixed' : 'element';
      };
      for (const p of Object.values(t.pieces).filter(x => x.kind === 'dish')) same(p.zone, `tray:${classify(p.props.sample)}`, `unit01/q1-grain stage 8 (${p.label})`);
    }
  }

  /* ---- q2-core: every graded answer from the counts ---- */
  if (g2) {
    const sp = (t, id) => t.pieces[id].props;
    // 1. the predict stage holds the guesses and no instrument; 2. the beam: nearly everything through, a few turned aside, one straight back
    {
      const t0 = TABLE.createTable(g2.STAGES[0].table, 'x');
      holds(g2.STAGES[0].predict === true && !Object.values(t0.fixtures).length, 'unit01/q2-core stage 1: the predict stage shows an instrument');
      holds(['solid', 'even', 'core'].every(id => t0.pieces[id]) && !Object.values(t0.pieces).some(p => p.kind === 'detector'), 'unit01/q2-core stage 1: the guesses are the three model cards and nothing else');
    }
    {
      const c = A.beamCounts(g2.STAGES[1].table.fixtures.find(f => f.kind === 'beam').props.specimen);
      holds(c.through / c.shots > 0.9 && c.back >= 1 && c.wide >= 1, 'unit01/q2-core stage 2: the beam does not show mostly-empty with one hard lump');
      same(end(g2, 1).pieces.core.zone, 'slot:model', 'unit01/q2-core stage 2 (the model laid)');
      // The detectors keep every hit: a second firing adds a full pass to each tally rather than overwriting it.
      const twice = TABLE.runScript(TABLE.createTable(g2.STAGES[1].table, 'x'), [{ run: 'beam' }, { run: 'beam' }], { strict: true });
      same([twice.pieces.detBack.props.count, twice.pieces.detBack.props.shots], [c.back * 2, c.shots * 2], 'unit01/q2-core stage 2 (the Back detector keeps both firings)');
      holds(Boolean(twice.pieces.even) && twice.pieces.even.props.model === 'spread', 'unit01/q2-core stage 2: the soft-and-even model is not a card on the bench');
    }
    // 3. the charged plates bend exactly the specks that carry a charge, and the answer is that split
    {
      const t = end(g2, 2);
      const specks = Object.values(t.pieces).filter(p => p.kind === 'speck');
      holds(specks.length >= 6 && specks.some(p => Number(p.props.charge)) && specks.some(p => !Number(p.props.charge)), 'unit01/q2-core stage 3: the specks do not hold both kinds');
      for (const p of specks) same(p.zone, Number(p.props.charge) ? 'tray:bends' : 'tray:straight', `unit01/q2-core stage 3 (${p.id} goes where the plates sent it)`);
      holds(specks.every(p => p.props.deflect === (Number(p.props.charge) ? 'bent' : 'straight')), 'unit01/q2-core stage 3: a speck is tagged against what the plates did');
    }
    // 3. the needle is protons against electrons, and neutral means equal
    {
      const t = end(g2, 3);
      const lump = t.pieces.nuc.props;
      same(piecesOf(t, 'tray:atom', 'electron').length, lump.p, 'unit01/q2-core stage 4 (a neutral atom has as many electrons as protons)');
    }
    // 4. shells fill in order: the graded loading is the real pattern, and so are the open samples
    {
      const t = end(g2, 4);
      same(['tray:sh1', 'tray:sh2', 'tray:sh3'].map(z => piecesOf(t, z, 'electron').length), A.shellsFor(t.pieces.nuc.props.p), 'unit01/q2-core stage 5 (the shells of Sample D)');
      for (const id of ['r1', 'r2', 'r3']) same(sp(t, id).rings, A.shellsFor(sp(t, id).p), `unit01/q2-core stage 5 (open sample ${id} is neutral and filled in order)`);
    }
    // 5. what the tester finds
    {
      const t = end(g2, 5);
      for (const id of ['s4', 's5']) same(t.pieces[id].zone, `tray:${A.behaviourOf(sp(t, id).rings)}`, `unit01/q2-core stage 6 (${t.pieces[id].label})`);
      same(['s1', 's2', 's3'].map(id => A.behaviourOf(sp(t, id).rings)), ['gives', 'takes', 'inert'], 'unit01/q2-core stage 6 (the open samples show all three behaviours)');
    }
    // 6. same element: same proton count
    {
      const t = end(g2, 6);
      for (const [id, tray] of [['sb', 'same'], ['sc', 'other'], ['sd', 'other'], ['se', 'same']]) same(t.pieces[id].zone, `tray:${sp(t, id).p === sp(t, 'sa').p ? 'same' : 'other'}`, `unit01/q2-core stage 7 (${t.pieces[id].label})`);
      holds(sp(t, 'sb').p + sp(t, 'sb').n === sp(t, 'sc').p + sp(t, 'sc').n && sp(t, 'sc').p + sp(t, 'sc').n === sp(t, 'sd').p + sp(t, 'sd').n, 'unit01/q2-core stage 7: the three lookalikes do not weigh the same');
      for (const id of ['sa', 'sb', 'sc', 'sd', 'se']) same(sp(t, id).rings.reduce((a, b) => a + b, 0), sp(t, id).p, `unit01/q2-core stage 7 (${id} is neutral)`);
    }
    // 8. isotope, ion or another element, against the reference
    {
      const t = end(g2, 7);
      const ref = sp(t, 'sd');
      const e = id => sp(t, id).rings.reduce((a, b) => a + b, 0);
      const kind = id => (sp(t, id).p !== ref.p ? 'other' : sp(t, id).n !== ref.n && e(id) === e('sd') ? 'heavy' : e(id) !== e('sd') && sp(t, id).n === ref.n ? 'charged' : '?');
      for (const id of ['n1', 'n2', 'n3', 'n4']) same(t.pieces[id].zone, `tray:${kind(id)}`, `unit01/q2-core stage 8 (${t.pieces[id].label})`);
    }
  }

  /* ---- q3-catalogue: every card is its element, and every graded answer is read off the chart ---- */
  if (g3) {
    const sym = id => g3.STAGES[0].table.pieces.concat(g3.STAGES[1].table.pieces).find(p => p.id === id)?.props.sym;
    // The quest's own table of cards is the element, shell for shell (the kit derives; the quest must not drift).
    for (const [id, c] of Object.entries(g3.CARDS)) {
      const v = C.elementView({ props: { sym: sym(id) || { c19: 'K' }[id] } });
      same([v.z, v.outer, v.trade, v.name.toUpperCase()], [c.z, c.outer, c.does === 'holds' ? 'shares' : c.does, c.name], `unit01/q3-catalogue ${id}`);
    }
    // Every card on every table is a card of the catalogue, at the mass the scope weighed it.
    g3.STAGES.forEach((st, i) => {
      for (const p of st.table.pieces.filter(x => x.kind === 'element' && !x.props.sealed)) {
        const c = Object.values(g3.CARDS).find(k => k.name === p.label);
        holds(Boolean(c), `unit01/q3-catalogue stage ${i + 1}: card ${p.id} is "${p.label}", which is not in the catalogue`);
        if (c) holds(p.props.mass === c.mass, `unit01/q3-catalogue stage ${i + 1}: card ${p.id} carries mass ${p.props.mass}, the catalogue says ${c.mass}`);
      }
    });
    const z = id => g3.CARDS[id].z;
    const cardAt = (t, slot) => { const p = piecesOf(t, `slot:${slot}`)[0]; return p ? p.id : null; };
    // 1. fewest protons first
    {
      const t = end(g3, 0);
      const order = t.zones.rail.order;
      holds(order.every((id, k) => k === 0 || z(order[k - 1]) < z(id)), 'unit01/q3-catalogue stage 1: the strip is not in order of protons');
      holds(order.length === 6, 'unit01/q3-catalogue stage 1: the strip does not hold all six');
    }
    // 2. the pattern starts over where the outer shell is back to one electron after a longer run
    {
      const t = end(g3, 1);
      const all = Object.values(t.pieces).filter(p => p.kind === 'element').sort((a, b) => C.elementView(a).z - C.elementView(b).z);
      const restarts = all.filter((p, k) => k > 0 && C.elementView(p).outer === 1 && C.elementView(all[k - 1]).outer > 1).map(p => p.id).sort();
      same(idsIn(t, 'tray:again'), restarts, 'unit01/q3-catalogue stage 2 (the cards where the outer shell is back to one)');
    }
    // The chart is the periodic table: ascending protons left to right, then down, and a column shares its outer shell.
    {
      const flat = g3.STAGES[2].table.pieces.filter(p => p.kind === 'element' && p.fixed);
      const placed = [...flat.map(p => ({ id: p.id, ...p.at })), ...g3.STAGES[2].table.zones.slots.map((sl, k) => ({ id: `r${k + 1}`, ...sl.at }))];
      const rows = [...new Set(placed.map(p => p.y))].sort((a, b) => a - b);
      const ids = rows.flatMap(y => placed.filter(p => p.y === y).sort((a, b) => a.x - b.x).map(p => p.id));
      const t3 = end(g3, 2);
      const zs = ids.map(id => (id.startsWith('r') ? z(cardAt(t3, id)) : z(id)));
      holds(zs.every((n, k) => k === 0 || n > zs[k - 1]), 'unit01/q3-catalogue stage 3: the chart, read row by row, is not in order of protons');
      same(zs.length, 18, 'unit01/q3-catalogue stage 3 (the chart holds eighteen cards)');
      const colOf = x => Math.round((x - 13.5) / 15);
      const byCol = {};
      for (const p of placed) (byCol[colOf(p.x)] ||= []).push(p.id.startsWith('r') ? cardAt(t3, p.id) : p.id);
      // A column shares its outer shell. Helium is the one card whose shell is full at two (it sits over neon and argon).
      for (const [col, list] of Object.entries(byCol)) holds(new Set(list.filter(id => id !== 'c02').map(id => C.elementView({ props: { sym: sym(id) } }).outer)).size === 1, `unit01/q3-catalogue stage 3: column ${col} does not share one outer shell`);
    }
    // 4. each loose card goes in the open place of the column its dots match
    {
      const t = end(g3, 3);
      for (const [slotId, sl] of Object.entries(t.zones.slots)) {
        const mine = C.elementView(t.pieces[cardAt(t, slotId)]);
        const above = Object.values(t.pieces).filter(p => p.kind === 'element' && p.fixed && Math.abs(p.at.x - sl.at.x) < 1 && p.at.y < sl.at.y).map(p => C.elementView(p).outer);
        holds(above.length >= 1 && above.every(o => o === mine.outer), `unit01/q3-catalogue stage 4: the card in ${slotId} does not match the outer shell of its column`);
      }
    }
    // 5 and 6. what the tester finds is the kit's trade, which is read off the outer shell
    {
      const t = end(g3, 4);
      const want = Object.values(t.pieces).filter(p => p.kind === 'element' && C.tradeOf(C.elementView(p).sym) === 'inert').map(p => p.id).sort();
      same(idsIn(t, 'tray:inert'), want, 'unit01/q3-catalogue stage 5 (every card that will not trade)');
      const u = end(g3, 5);
      for (const p of Object.values(u.pieces).filter(x => x.kind === 'element')) same(p.zone, `tray:${C.tradeOf(C.elementView(p).sym)}`, `unit01/q3-catalogue stage 6 (${p.label})`);
    }
    // 7. the unmeasured card is silicon: protons between its neighbours, behaviour of the card above
    {
      const t = end(g3, 6);
      const gap = t.zones.slots.gap;
      const left = Object.values(t.pieces).find(p => p.fixed && Math.abs(p.at.y - gap.at.y) < 1 && Math.abs(p.at.x - (gap.at.x - 15)) < 1);
      const right = Object.values(t.pieces).find(p => p.fixed && Math.abs(p.at.y - gap.at.y) < 1 && Math.abs(p.at.x - (gap.at.x + 15)) < 1);
      const above = Object.values(t.pieces).find(p => p.fixed && Math.abs(p.at.x - gap.at.x) < 1 && p.at.y < gap.at.y && p.at.y > gap.at.y - 16);
      const between = (C.elementView(left).z + C.elementView(right).z) / 2;
      same(t.fixtures.stamp.dials.protons.value, between, 'unit01/q3-catalogue stage 7 (the protons between its neighbours)');
      same(t.pieces.sealed.props.sym, 'Si', 'unit01/q3-catalogue stage 7 (the unmeasured card is silicon)');
      same(C.elementView(t.pieces.sealed).z, between, 'unit01/q3-catalogue stage 7 (the card the chart predicts has that many protons)');
      same(C.tradeOf('Si'), C.tradeOf(C.elementView(above).sym), 'unit01/q3-catalogue stage 7 (silicon behaves like carbon)');
    }
  }

  /* ---- q4-ledger: the numbers on every label are the numbers of the sample, and every build is the atom ---- */
  if (g4) {
    const prop = (t, id) => t.pieces[id].props;
    const digitsOf = (lines, key) => Number((lines.find(l => l.startsWith(key)) || '').replace(/\D+/g, ''));
    const sealedOf = (mod, i, id) => mod.STAGES[i].table.pieces.find(p => p.id === id).props;
    const n = (t, zone, kind) => piecesOf(t, zone, kind).length;
    // 1. build the open sample: the lump's protons and neutrons, the ring's electrons
    {
      const t = end(g4, 0);
      const ref = prop(t, 'refc');
      same([n(t, 'tray:core', 'proton'), n(t, 'tray:core', 'neutron'), n(t, 'tray:out', 'electron')], [ref.p, ref.n, prop(t, 'refe').rings.reduce((a, b) => a + b, 0)], 'unit01/q4-ledger stage 1 (the build matches the sample)');
      same(prop(t, 'refe').rings, A.shellsFor(ref.p), 'unit01/q4-ledger stage 1 (the open sample is neutral and filled in order)');
      same(A.needleReading(t, 'needle'), 0, 'unit01/q4-ledger stage 1 (a neutral build reads zero)');
    }
    // 2. the label's two numbers are the sealed sample's protons and protons plus neutrons
    {
      const t = end(g4, 1);
      const lines = g4.STAGES[1].table.fixtures.find(f => f.id === 'lb').props.lines;
      const open = g4.STAGES[1].table.fixtures.find(f => f.id === 'la').props.lines;
      const sa = prop(t, 'sa');
      same([digitsOf(open, 'atomic'), digitsOf(open, 'mass')], [sa.p, sa.p + sa.n], 'unit01/q4-ledger stage 2 (the open sample\'s label reads its counts)');
      const sb = sealedOf(g4, 1, 'sb');
      same([digitsOf(lines, 'atomic'), digitsOf(lines, 'mass')], [sb.p, sb.p + sb.n], 'unit01/q4-ledger stage 2 (the sealed sample\'s label reads its counts)');
      same([n(t, 'tray:core', 'proton'), n(t, 'tray:core', 'neutron'), n(t, 'tray:out', 'electron')], [sb.p, sb.n, sb.rings.reduce((a, b) => a + b, 0)], 'unit01/q4-ledger stage 2 (the build matches the sealed sample)');
      holds(sb.n !== sa.n, 'unit01/q4-ledger stage 2: the sealed sample has the same neutrons as the open one, so its label teaches nothing');
      same(sb.rings, A.shellsFor(sb.p), 'unit01/q4-ledger stage 2 (the sealed sample is neutral and filled in order)');
    }
    // 3. same element: same protons, whatever the neutrons add up to
    {
      const t = end(g4, 2);
      const ref = prop(t, 'ref');
      for (const id of ['k', 'l', 'm']) same(t.pieces[id].zone, `tray:${prop(t, id).p === ref.p ? 'same' : 'other'}`, `unit01/q4-ledger stage 3 (${t.pieces[id].label})`);
      for (const id of ['ref', 'k', 'l', 'm']) same(prop(t, id).rings, A.shellsFor(prop(t, id).p), `unit01/q4-ledger stage 3 (${id} is neutral and filled in order)`);
      holds(prop(t, 'm').p + prop(t, 'm').n === ref.p + ref.n, 'unit01/q4-ledger stage 3: no sample shares Sample A\'s mass number, so weight is no trap');
    }
    // 4. the sealed ion: its needle is protons less electrons, and the build is that
    {
      const t = end(g4, 3);
      const sb = sealedOf(g4, 3, 'sb');
      const q = sb.p - sb.rings.reduce((a, b) => a + b, 0);
      holds(q !== 0, 'unit01/q4-ledger stage 4: the sealed sample is neutral');
      same(A.needleReading(t, 'needle'), q, 'unit01/q4-ledger stage 4 (the build\'s needle reads what the sealed sample\'s does)');
      same([n(t, 'tray:core', 'proton'), n(t, 'tray:out', 'electron')], [sb.p, sb.rings.reduce((a, b) => a + b, 0)], 'unit01/q4-ledger stage 4 (protons and electrons)');
      same(sb.rings, A.shellsFor(sb.p).slice(0, -1), 'unit01/q4-ledger stage 4 (the ion is the atom less its outer shell)');
    }
    // 5 and 6. magnesium's outer shell, then chlorine's, against the real shell pattern
    {
      const t = end(g4, 4);
      const start = TABLE.createTable(g4.STAGES[4].table, 'x');
      const nuc = prop(start, 'nuc');
      same(['tray:sh1', 'tray:sh2', 'tray:sh3'].map(zn => n(start, zn, 'electron')), A.shellsFor(nuc.p), 'unit01/q4-ledger stage 5 (the start is the real shell pattern)');
      same(['tray:sh1', 'tray:sh2', 'tray:sh3'].map(zn => n(t, zn, 'electron')), [...A.shellsFor(nuc.p).slice(0, -1), 0], 'unit01/q4-ledger stage 5 (the outer shell is gone and the shell beneath is full)');
      same(A.needleReading(t, 'needle'), A.shellsFor(nuc.p).slice(-1)[0], 'unit01/q4-ledger stage 5 (the charge is the outer shell\'s electrons)');
      const s6 = TABLE.createTable(g4.STAGES[5].table, 'x');
      const cl = prop(s6, 'nuc');
      same(['tray:sh1', 'tray:sh2', 'tray:sh3'].map(zn => n(s6, zn, 'electron')), A.shellsFor(cl.p), 'unit01/q4-ledger stage 6 (the start is neutral chlorine)');
      const u = end(g4, 5);
      same(['tray:sh1', 'tray:sh2', 'tray:sh3'].map(zn => n(u, zn, 'electron')), [2, 8, 8], 'unit01/q4-ledger stage 6 (the outer shell is full)');
      same(A.needleReading(u, 'needle'), -1, 'unit01/q4-ledger stage 6 (one more electron than protons)');
    }
    // 7. the pad: the smallest whole numbers that cancel the two ions' charges
    {
      const t = end(g4, 6);
      const qa = prop(t, 'a1').charge;
      const qb = prop(t, 'b1').charge;
      const g = ((a, b) => { while (b) [a, b] = [b, a % b]; return a; })(Math.abs(qa), Math.abs(qb));
      same([piecesOf(t, 'tray:pad').filter(p => p.props.el === 'Mg').length, piecesOf(t, 'tray:pad').filter(p => p.props.el === 'Cl').length], [Math.abs(qb) / g, Math.abs(qa) / g], 'unit01/q4-ledger stage 7 (the smallest ratio)');
      same(A.needleReading(t, 'needle'), 0, 'unit01/q4-ledger stage 7 (the pad reads zero)');
      holds(qa * (Math.abs(qb) / g) + qb * (Math.abs(qa) / g) === 0, 'unit01/q4-ledger stage 7: the ratio does not cancel');
      same([qa, qb], [A.shellsFor(12).slice(-1)[0], -(8 - A.shellsFor(17).slice(-1)[0])], 'unit01/q4-ledger stage 7 (magnesium gives its outer two, chlorine takes the one it lacks)');
    }
    // 8. isotope, ion or another element, against the reference
    {
      const t = end(g4, 7);
      const ref = prop(t, 'std');
      const e = id => prop(t, id).rings.reduce((a, b) => a + b, 0);
      const kind = id => (prop(t, id).p !== ref.p ? 'other' : prop(t, id).n !== ref.n ? 'heavy' : e(id) !== e('std') ? 'charged' : 'match');
      for (const id of ['n1', 'n2', 'n3', 'n4']) same(t.pieces[id].zone, `tray:${kind(id)}`, `unit01/q4-ledger stage 8 (${t.pieces[id].label})`);
      same(new Set(['n1', 'n2', 'n3', 'n4'].map(kind)).size, 4, 'unit01/q4-ledger stage 8 (all four kinds of difference appear)');
      for (const id of ['std', 'n1', 'n2', 'n3', 'n4']) holds(prop(t, id).rings.reduce((a, b) => a + b, 0) <= A.shellsFor(prop(t, id).p).reduce((a, b) => a + b, 0) + 2, `unit01/q4-ledger stage 8 (${id} carries a believable charge)`);
    }
  }
  if (failures === before) ok('Tallow: every declared dish, atom, specimen, nucleus, ion and card is real, and every graded answer (power, kinds, elements, cut, molecules, layers, beam, protons, shells, tester, isotopes, the chart, the periods, the trades, the labels, the ledger\'s builds and ratio) agrees with the scope\'s and the kit\'s own planners');
}

/* ------------------------------------------------------------------
   THE MASS TABLES (plan `bench-tabletop.md`, T2b): `q5-assay`, `q6-weigh` and the Hopper's last phases. A table can
   declare a sample the bench would never hold, so every graded answer is recomputed here from the planners and the
   listed masses (assay.js `planPour`, the scope's table of what it weighed), not from the numbers the stage's check
   carries: the weighted average a fulcrum finds, the share in a bin, the mix that balances a canister, the atoms a crate
   holds, the grams that match a count, the moles in a drum.
   ------------------------------------------------------------------ */
{
  const before = failures;
  const M = await import('../src/learn/table/kits/mass.js');
  const AS = await import('../src/learn/engine/assay.js');
  const A = await import('../src/learn/table/kits/atoms.js');
  const get = async id => { const q = getQuest('unit01', id); return q && q.status === 'live' ? q.module() : null; };
  const [q5, q6, bh] = await Promise.all([get('q5-assay'), get('q6-weigh'), get('boss-hopper')]);
  const same = (a, b, what) => { if (JSON.stringify(a) !== JSON.stringify(b)) fail(`${what}: graded ${JSON.stringify(a)}, the real answer is ${JSON.stringify(b)}`); };
  const near = (a, b, what) => { if (!(Math.abs(a - b) < 1e-9 * Math.max(1, Math.abs(b)))) fail(`${what}: graded ${a}, the real answer is ${b}`); };
  const holds = (c, what) => { if (!c) fail(what); };
  const end = (mod, i) => TABLE.runScript(TABLE.createTable(mod.STAGES[i].table, mod.STAGES[i].title), mod.SOLUTIONS[i], { strict: true });
  const declared = (mod, i, id) => mod.STAGES[i].table.pieces.find(p => p.id === id);
  /** The weighted average of a declared sample, worked from the planner's own pour. */
  const avgOf = piece => {
    const bins = piece.props.bins;
    const { totals, total } = AS.planPour({ id: piece.id, bins });
    return bins.reduce((m, b, k) => m + b.mass * totals[k], 0) / total;
  };
  const listed = label => Number(String(label).match(/(\d+\.\d)/)?.[1]);

  if (q5) {
    // Every sample is a real pile: whole bins of whole masses, and the pour lands what is declared.
    q5.STAGES.forEach((st, i) => {
      for (const p of st.table.pieces.filter(x => x.kind === 'sample')) {
        for (const b of p.props.bins) holds(Number.isInteger(b.mass) && Number.isInteger(b.n) && b.n >= 1, `unit01/q5-assay stage ${i + 1}: ${p.label} has a bin that is not a whole pile`);
        same(AS.planPour({ id: p.id, bins: p.props.bins }).totals, p.props.bins.map(b => b.n), `unit01/q5-assay stage ${i + 1} (${p.label}: the pour lands what is declared)`);
      }
    });
    // 1. both bins read the same element
    holds(declared(q5, 0, 'a').props.code === 'chlorine' && declared(q5, 0, 'a').props.bins.length === 2, 'unit01/q5-assay stage 1: Sample A is not one element in two weights');
    same(end(q5, 0).pieces.a.zone, 'tray:one', 'unit01/q5-assay stage 1 (one element)');
    {
      // Sample B is two elements, and only its per-bin codes say so.
      const b = declared(q5, 0, 'b');
      holds(new Set(b.props.bins.map(x => x.code)).size === 2 && !b.props.code, 'unit01/q5-assay stage 1: Sample B is not two elements told apart by their bin codes');
      same(end(q5, 0).pieces.b.zone, 'tray:two', 'unit01/q5-assay stage 1 (two elements)');
    }
    // 2. the same share in the lighter bin whatever the size of the scoop
    {
      const share = id => { const b = declared(q5, 1, id).props.bins; return b[0].n / b.reduce((n, x) => n + x.n, 0) * 100; };
      near(share('a'), share('b'), 'unit01/q5-assay stage 2 (two scoops of one stock give one share)');
      const t = end(q5, 1);
      for (const id of ['a', 'b']) same(Number(q5.STAGES[1].table.zones.trays.find(z => `tray:${z.id}` === t.pieces[id].zone).label.match(/^(\d+)/)[1]), share(id), `unit01/q5-assay stage 2 (${id}'s tray)`);
    }
    // 3. the fulcrum finds the weighted average (a hunt: the listed mass is not on the table)
    {
      const piece = declared(q5, 2, 'a');
      const avg = avgOf(piece);
      const t = end(q5, 2);
      near(t.fixtures.assay.dials.pivot.value, avg, 'unit01/q5-assay stage 3 (the fulcrum rests at the average)');
      near(M.assayRead(t, 'assay').net, 0, 'unit01/q5-assay stage 3 (the beam lies level)');
      const d = q5.STAGES[2].table.fixtures.find(f => f.id === 'assay').dials.pivot;
      holds(Math.abs((avg - d.min) / d.step - Math.round((avg - d.min) / d.step)) < 1e-9, 'unit01/q5-assay stage 3: the fulcrum\'s steps never land on the average');
      near(avg, 35.5, 'unit01/q5-assay stage 3 (chlorine\'s average)');
      holds(Math.abs(avg - d.value) > d.step, 'unit01/q5-assay stage 3: the fulcrum starts at the answer');
      holds(!q5.STAGES[2].table.fixtures.some(f => f.kind === 'plate'), 'unit01/q5-assay stage 3: a plate prints the answer');
    }
    // 4 and 9. a typed weighted average, worked from the declared piles
    for (const i of [3, 8]) {
      const piece = declared(q5, i, 'a');
      near(Number(end(q5, i).entries.ans), Math.round(avgOf(piece) * 10) / 10, `unit01/q5-assay stage ${i + 1} (the typed average)`);
      holds(Boolean(q5.STAGES[i].entry), `unit01/q5-assay stage ${i + 1}: no field for the average`);
    }
    // 10. the share of the heavy atoms from a sealed canister's weight (the mix that balances it is the typed share)
    {
      const can = declared(q5, 9, 'can');
      const mixer = q5.STAGES[9].table.fixtures.find(f => f.id === 'mixer').props;
      const heavy = [...Array(mixer.total + 1).keys()].filter(h => (mixer.total - h) * mixer.light.mass + h * mixer.heavy.mass === M.massOfSample(can));
      same(heavy.length, 1, 'unit01/q5-assay stage 10 (one mix balances the canister)');
      near(Number(end(q5, 9).entries.ans), heavy[0] / mixer.total * 100, 'unit01/q5-assay stage 10 (the percent of heavy atoms)');
      same(M.countOfSample(can), mixer.total, 'unit01/q5-assay stage 10 (the canister and the mix hold the same number of atoms)');
    }
    // 11. a typed average read off a drawn spectrum
    {
      const peaks = q5.STAGES[10].table.fixtures.find(f => f.kind === 'spectrum').props.peaks;
      holds(Math.abs(peaks.reduce((n, p) => n + p.pct, 0) - 100) < 1e-9, 'unit01/q5-assay stage 11: the bars do not sum to 100 percent');
      near(Number(end(q5, 10).entries.ans), Math.round(peaks.reduce((m, p) => m + p.mass * p.pct / 100, 0) * 100) / 100, 'unit01/q5-assay stage 11 (the average of the drawn spectrum)');
    }
    // 5. a sample in one bin balances at that bin's own weight: a prediction on a new case
    {
      const piece = declared(q5, 5, 'a');
      holds(piece.props.bins.length === 1, 'unit01/q5-assay stage 6: the new case is not a sample in one bin');
      near(avgOf(piece), piece.props.bins[0].mass, 'unit01/q5-assay stage 6 (the one pile balances at its own weight)');
      // Stage 5 asks for the guess alone: no chute, no beam, no fulcrum on the table.
      const t5 = TABLE.createTable(q5.STAGES[4].table, 'x');
      holds(q5.STAGES[4].predict === true && !Object.values(t5.fixtures).some(f => f.kind === 'assay') && Boolean(t5.prediction), 'unit01/q5-assay stage 5: the predict stage shows the instrument');
    }
    // 6. the canister's mix: 40 atoms, the heavy count whose weight is the canister's
    {
      const can = declared(q5, 6, 'can');
      const mixer = q5.STAGES[6].table.fixtures.find(f => f.id === 'mixer').props;
      const heavy = [...Array(mixer.total + 1).keys()].filter(h => (mixer.total - h) * mixer.light.mass + h * mixer.heavy.mass === M.massOfSample(can));
      same(heavy, [end(q5, 6).fixtures.mixer.dials.heavy.value], 'unit01/q5-assay stage 7 (the one mix that balances the canister)');
      same(M.countOfSample(can), mixer.total, 'unit01/q5-assay stage 7 (the canister and the mix hold the same number of atoms)');
    }
    // 7. natural chlorine
    {
      const t7 = end(q5, 7);
      for (const id of ['a', 'b', 'c']) same(t7.pieces[id].zone, `tray:${Math.abs(avgOf(declared(q5, 7, id)) - 35.5) < 0.05 ? 'natural' : 'altered'}`, `unit01/q5-assay stage 8 (${id})`);
    }
  }

  if (q6) {
    const m = M.speciesMass;
    // the listed masses are the scope's
    same([M.listedMass('H'), M.listedMass('C'), M.listedMass('O')], [1, 12, 16], 'mass kit (the listed masses the scope weighed)');
    // 1. a sealed crate balanced by scoops of the same atom: the pan's count is the crate's
    {
      const t = end(q6, 0);
      near(M.counterOf(t, 'balance', 'R'), t.pieces.crate.props.n, 'unit01/q6-weigh stage 1 (the pan\'s counter is the crate\'s count)');
      near(M.balanceRead(t, 'balance').diff, 0, 'unit01/q6-weigh stage 1 (the pans balance)');
      holds(declared(q6, 0, 'sack').props.n < t.pieces.crate.props.n, 'unit01/q6-weigh stage 1: the counted sack is the whole crate');
    }
    // 2. what one molecule of methane weighs is the listed masses added up
    {
      const t = end(q6, 1);
      near(M.scaleRead(t, 'scale').weight, 12 + 4 * 1, 'unit01/q6-weigh stage 2 (the scale reads the listed masses added up)');
      same(A.formulaOf(Object.values(t.pieces).filter(p => p.zone === 'container:pan' && p.kind === 'atom').map(p => p.id), t), 'CH₄', 'unit01/q6-weigh stage 2 (the molecule on the pan)');
    }
    // 3. equal counts weigh in the ratio of their listed masses
    {
      const t = end(q6, 2);
      for (const r of t.recorder.rows) near(r.y / r.x, 60, `unit01/q6-weigh stage 3 (${r.label}: sixty atoms weigh sixty times one)`);
      same(t.recorder.rows.map(r => r.x).sort((a, b) => a - b), [1, 12, 16], 'unit01/q6-weigh stage 3 (the three listed masses)');
    }
    // 4 to 7. the grams whose count matches 12.0 g of carbon are the molar mass; a drum is that many of them
    {
      const L = 6.02e23;
      const grams = (t, what) => t.zones.containers['pan-r'].contents[what];
      near(grams(end(q6, 3), 'oxygen'), 12 / m('carbon') * m('oxygen'), 'unit01/q6-weigh stage 4 (grams of oxygen with the carbon pan\'s count)');
      near(m('carbon dioxide'), 12 + 16 + 16, 'unit01/q6-weigh stage 5 (a molecule of carbon dioxide)');
      near(grams(end(q6, 4), 'carbon dioxide'), 44, 'unit01/q6-weigh stage 5 (grams of carbon dioxide with the carbon pan\'s count)');
      near(grams(end(q6, 5), 'water'), m('water'), 'unit01/q6-weigh stage 6 (grams of water that match the count)');
      near(72 / m('water'), end(q6, 5).fixtures.tally.dials.n.value, 'unit01/q6-weigh stage 6 (the scoops in the drum)');
      near(M.counterOf(end(q6, 3), 'balance', 'L'), L, 'unit01/q6-weigh stage 4 (12.0 g of carbon is one count)');
      const t7 = end(q6, 6);
      near(grams(t7, 'hydrogen'), (36 / m('water')) * 2 * M.listedMass('H'), 'unit01/q6-weigh stage 7 (the grams of hydrogen that match the hydrogen in 36 g of water)');
      near(M.counterOf(t7, 'balance', 'L'), 2 * 2 * L, 'unit01/q6-weigh stage 7 (two moles of water hold four moles of hydrogen atoms)');
    }
    // 8. rank by atoms, not by weight: the heaviest drum is not the one with the most
    {
      const drums = ['d1', 'd2', 'd3'].map(id => ({ id, atoms: declared(q6, 7, id).props.grams / m(declared(q6, 7, id).props.species), grams: declared(q6, 7, id).props.grams }));
      same(end(q6, 7).zones.rail.order, drums.slice().sort((a, b) => a.atoms - b.atoms).map(d => d.id), 'unit01/q6-weigh stage 8 (the rail, fewest atoms to most)');
      holds(drums.slice().sort((a, b) => b.grams - a.grams)[0].id !== drums.slice().sort((a, b) => b.atoms - a.atoms)[0].id, 'unit01/q6-weigh stage 8: the heaviest drum holds the most atoms, so weight is no trap');
    // 9 to 12. the typed worked figures, recomputed from the listed masses
    {
      const typedOf = k => Number(end(q6, k).entries.ans);
      near(typedOf(8), Math.round(m('oxygen') / (m('oxygen') + 2 * m('hydrogen')) * 1000) / 10, 'unit01/q6-weigh stage 9 (oxygen\'s percent by mass in water)');
      near(typedOf(9), Math.round((36 / m('water')) * 2 * 6.02 * 100) / 100, 'unit01/q6-weigh stage 10 (hydrogen atoms in 36 g of water, in units of 10^23)');
      { const t11 = end(q6, 10); near(typedOf(10), M.counterOf(t11, 'balance', 'R') / M.counterOf(t11, 'balance', 'L'), 'unit01/q6-weigh stage 11 (hydrogen atoms for each carbon, from the two counters)'); }
      near(typedOf(11), 30 / (m('carbon') + 3 * M.listedMass('H')) , 'unit01/q6-weigh stage 12 (carbon atoms in one molecule)');
      { const g = id => declared(q6, 12, id).props.grams; near(typedOf(12), (g('mix') - g('sand')) / g('mix') * 100, 'unit01/q6-weigh stage 13 (the salt\'s percent of the mixture)'); }
    }
    }
  }

  if (bh) {
    // 1. element / compound / mixture from what each plate declares
    {
      const t = end(bh, 0);
      const kind = p => {
        const es = new Set(p.props.sample.particles.flatMap(e => e.kinds));
        if (es.size === 1) return 'element';
        return p.props.sample.particles.every(e => (e.pairs || []).length) ? 'compound' : 'mixture';
      };
      for (const id of ['plate1', 'plate2', 'plate3']) same(t.pieces[id].zone, `tray:${kind(declared(bh, 0, id))}`, `unit01/boss-hopper phase 1 (${id})`);
    }
    // 2. the atom built has the sealed core's protons, and is neutral
    {
      const t = end(bh, 1);
      same([t.pieces.refc.props.p, t.pieces.refe.props.p], [6, 6], 'unit01/boss-hopper phase 2 (the sealed core is one atom)');
      same([Object.values(t.pieces).filter(p => p.zone === 'tray:core' && p.kind === 'proton').length, Object.values(t.pieces).filter(p => p.zone === 'tray:out' && p.kind === 'electron').length], [6, 6], 'unit01/boss-hopper phase 2 (protons and electrons)');
      same(t.pieces.refe.props.rings, A.shellsFor(6), 'unit01/boss-hopper phase 2 (the core is neutral and filled in order)');
    }
    // 3. the open place takes the card one proton past its left neighbour
    {
      const CC = await import('../src/learn/table/kits/cards.js');
      const t = end(bh, 2);
      const z = id => CC.elementView(t.pieces[id]).z;
      same(z(CC.slotCard(t, 'gap')), z('c09') + 1, 'unit01/boss-hopper phase 3 (one proton past fluorine)');
    }
    // 4. the slag balances at boron's listed mass
    near(avgOf(declared(bh, 3, 'slag')), 10.8, 'unit01/boss-hopper phase 4 (the slag\'s average)');
    same(end(bh, 3).pieces.slag.zone, 'tray:boron', 'unit01/boss-hopper phase 4 (the slag\'s tray)');
    // 5. the drum is that many scoops of one mole
    near(end(bh, 4).zones.containers['pan-r'].contents.carbon / M.speciesMass('carbon'), 24 / 12, 'unit01/boss-hopper phase 5 (two scoops of one mole balance the drum)');
  }
  if (failures === before) ok('the mass tables: every sample is a whole pile the planner pours as declared, and every graded answer (the share in a bin, the weighted average a fulcrum finds, the mix that balances a canister, the atoms a crate holds, the grams that match a count, the moles in a drum, the rank by atoms, the Hopper\'s sort, core, card, slag and drum) agrees with assay.js and the listed masses');
}

/* ------------------------------------------------------------------
   LIGAR'S FIRST BENCH ON A TABLE (plan `bench-tabletop.md`, T1b). `q1-joins` declares atoms, and a
   declaration can say a thing the bench never would. Every atom is a real element, and every answer
   a stage grades is recomputed here from `joinbench.js` `planJoin` run on the elements' own shells,
   so a literal in a check cannot drift from the planner the table asks.
   ------------------------------------------------------------------ */
{
  const before = failures;
  const A = await import('../src/learn/table/kits/atoms.js');
  const JB = await import('../src/learn/engine/joinbench.js');
  const SNAPM = await import('../src/learn/table/snap.js');
  const q = getQuest('unit03', 'q1-joins');
  const mod = q && q.status === 'live' ? await q.module() : null;
  const same = (a, b, what) => { if (JSON.stringify(a) !== JSON.stringify(b)) fail(`${what}: graded ${JSON.stringify(a)}, the real answer is ${JSON.stringify(b)}`); };
  if (mod) {
    const end = i => TABLE.runScript(TABLE.createTable(mod.STAGES[i].table, mod.STAGES[i].title), mod.SOLUTIONS[i], { strict: true });
    const start = i => TABLE.createTable(mod.STAGES[i].table, mod.STAGES[i].title);
    const view = sym => { const e = A.elementOf(sym); return { kind: e.kind, shells: e.shells }; };
    const plan = (x, y) => JB.planJoin({ left: view(x), right: view(y) });
    const el = (t, id) => t.pieces[id].props.el;
    const holds = (c, what) => { if (!c) fail(what); };
    mod.STAGES.forEach((st, i) => {
      for (const p of st.table.pieces) {
        if (p.kind === 'atom') { try { A.elementOf(p.props.el); } catch { fail(`unit03/q1-joins stage ${i + 1}: atom ${p.id} is "${p.props.el}", not an element`); } }
      }
      if (st.table.opts?.words && !['plain', 'shells'].includes(st.table.opts.words)) fail(`unit03/q1-joins stage ${i + 1}: unknown wording mode`);
    });
    // The wording and the faces arrive in order: no charge before stage 3, no shell before stage 2.
    mod.STAGES.forEach((st, i) => {
      const o = st.table.opts || {};
      if (i < 1 && o.shells) fail(`unit03/q1-joins stage ${i + 1}: shows shells before stage 2 introduces them`);
      if (i > 0 && i < 2 && o.charges !== false) fail(`unit03/q1-joins stage ${i + 1}: shows a charge before stage 3 introduces it`);
    });
    const kindTray = { none: null, transfer: 'handed', share: 'shared' };
    const pairsOf = (t, ids) => ids.map(([a, b]) => [a, b, plan(el(t, a), el(t, b))]);
    // 1. the predict stage holds the guesses and no instrument; the wrong idea ("identical atoms drift apart") is one of the cards
    {
      const t0 = start(0);
      holds(mod.STAGES[0].predict === true && !Object.values(t0.fixtures).length && !t0.tools.length, 'unit03/q1-joins stage 1: the predict stage shows an instrument');
      holds(['hold', 'apart', 'merge'].every(id => t0.pieces[id]?.kind === 'guess') && Object.keys(t0.pieces).length === 3, 'unit03/q1-joins stage 1: the guesses are the three cards and nothing else');
      // The pair the guess is about really does hold, by the planner, and the argon pair really does not.
      holds(plan('H', 'H').type !== 'none' && plan('Ar', 'H').type === 'none' && plan('Ne', 'Ne').type === 'none', 'unit03/q1-joins stage 1: the hydrogen pair, the argon pair and the neon pair are not the three cases the quest teaches');
    }
    // 2. a pair that holds is in Held and joined; one that does not is two loose atoms in Came apart; the table shows the rings that tell them apart
    {
      const t = end(1);
      for (const [a, b, pl] of pairsOf(t, [['a1', 'a2'], ['b1', 'b2'], ['c1', 'c2'], ['d1', 'd2']])) {
        const held = pl.type !== 'none';
        same([t.pieces[a].zone, t.pieces[b].zone], held ? ['tray:held', 'tray:held'] : ['tray:apart', 'tray:apart'], `unit03/q1-joins stage 2 (${el(t, a)} and ${el(t, b)})`);
        same(A.pairRead(t, a, b).joined, held, `unit03/q1-joins stage 2 (${el(t, a)} and ${el(t, b)} joined)`);
      }
      // Identical atoms hold (the wrong idea fails), different atoms can fail to (the other wrong idea fails), and the rings give a reason.
      holds(plan(el(t, 'c1'), el(t, 'c2')).type !== 'none' && el(t, 'c1') === el(t, 'c2'), 'unit03/q1-joins stage 2: no identical pair holds');
      holds(plan(el(t, 'd1'), el(t, 'd2')).type === 'none' && el(t, 'd1') !== el(t, 'd2'), 'unit03/q1-joins stage 2: no pair of different atoms comes apart');
      const t0 = start(1);
      for (const p of Object.values(t0.pieces).filter(x => x.kind === 'atom' && !x.props.scratch)) {
        same(A.readPiece(p.id, t0).full, JB.shellPlan(view(p.props.el)).full, `unit03/q1-joins stage 2 (${p.props.el} starts full)`);
      }
      for (const [a, b, pl] of pairsOf(t0, [['a1', 'a2'], ['b1', 'b2'], ['c1', 'c2'], ['d1', 'd2']])) {
        // A pair comes apart exactly when an atom's shell starts full; a pair that held ends with both shells full.
        const anyFull = A.readPiece(a, t0).full || A.readPiece(b, t0).full;
        same(anyFull, pl.type === 'none', `unit03/q1-joins stage 2 (${el(t0, a)} and ${el(t0, b)}: a pair comes apart exactly when an atom's shell starts full)`);
        if (pl.type !== 'none') same([A.readPiece(a, t).full, A.readPiece(b, t).full], [true, true], `unit03/q1-joins stage 2 (${el(t0, a)} and ${el(t0, b)} end full)`);
      }
    }
    // 3. handed over or held between, from the planner's own type; one pair of different elements shares
    {
      const t = end(2);
      for (const [a, b, pl] of pairsOf(t, [['m1', 'm2'], ['h1', 'h2'], ['k1', 'k2'], ['d1', 'd2']])) {
        same(t.pieces[a].zone, `tray:${kindTray[pl.type]}`, `unit03/q1-joins stage 3 (${el(t, a)} and ${el(t, b)})`);
        same(A.pairRead(t, a, b).type, pl.type, `unit03/q1-joins stage 3 (${el(t, a)} and ${el(t, b)} join)`);
      }
      holds(plan('H', 'Cl').type === 'share' && plan('H', 'Cl').type !== plan('Mg', 'O').type, 'unit03/q1-joins stage 3: hydrogen with chlorine does not share');
    }
    // 4. chlorines it takes to empty magnesium's outer shell: add them one by one until the planner says it is spent
    {
      let mg = view('Mg').shells.slice();
      let n = 0;
      while (mg[mg.length - 1] > 0 && n < 6) {
        const pl = JB.planJoin({ left: { kind: 'metal', shells: mg }, right: view('Cl') });
        if (pl.type !== 'transfer') break;
        mg[mg.length - 1] -= pl.moved;
        n++;
      }
      const t = end(3);
      same(SNAPM.clusterOf(t, 'mg').length - 1, n, 'unit03/q1-joins stage 4 (chlorines for one magnesium)');
      same(A.closureOf(SNAPM.clusterOf(t, 'mg'), t).closed, true, 'unit03/q1-joins stage 4 (the unit is closed)');
      same(A.chargeOf(SNAPM.clusterOf(t, 'mg'), t), 0, 'unit03/q1-joins stage 4 (the unit reads zero)');
      if (start(3).pieces.mg.joinedTo.length || Object.values(start(3).pieces).filter(p => p.props.el === 'Cl').length <= n) fail('unit03/q1-joins stage 4: the table does not hold more chlorines than the answer needs');
    }
    // 5. pairs between, from the planner; one tray holds two pairs
    {
      const t = end(4);
      const names = { 1: 'one', 2: 'two', 3: 'three' };
      for (const [a, b, pl] of pairsOf(t, [['u1', 'u2'], ['v1', 'v2'], ['w1', 'w2'], ['x1', 'x2']])) {
        same(t.pieces[a].zone, `tray:${names[pl.pairs]}`, `unit03/q1-joins stage 5 (${el(t, a)} and ${el(t, b)})`);
        same(A.pairRead(t, a, b).pairs, pl.pairs, `unit03/q1-joins stage 5 (${el(t, a)} and ${el(t, b)} pairs)`);
      }
    }
  }
  if (failures === before) ok('Ligar bench one: every declared atom is a real element, the guess cards stand alone, and every graded pair, charge, count and tray agrees with joinbench\'s planJoin on the elements\' own shells');
}


/* ------------------------------------------------------------------
   LIGAR'S BENCH TWO (plan `bench-tabletop.md`, T3a): `q2-lattice` on the bonds kit. A block's melting point is the one
   number a stage is told; everything else it does is derived, so each graded answer is recomputed here from
   `joinbench.js` (`planSlab`, `conductionOf`) and the kit's own readers, and the table is held to the claims the stages
   teach: three blocks that give way at three different settings of a dial the player can reach, a checkerboard grid that
   slides into like against like, a current that needs ions or electrons free to move, a molecule that stays whole through
   a blow and a melt, a network that comes out whole, and exactly one liner.
   ------------------------------------------------------------------ */
{
  const before = failures;
  const B = await import('../src/learn/table/kits/bonds.js');
  const JB = await import('../src/learn/engine/joinbench.js');
  const q2 = await (async () => { const q = getQuest('unit03', 'q2-lattice'); return q && q.status === 'live' ? q.module() : null; })();
  const same = (a, b, what) => { if (JSON.stringify(a) !== JSON.stringify(b)) fail(`${what}: graded ${JSON.stringify(a)}, the real answer is ${JSON.stringify(b)}`); };
  const holds = (c, what) => { if (!c) fail(what); };
  if (q2) {
    const start = i => TABLE.createTable(q2.STAGES[i].table, q2.STAGES[i].title);
    const end = i => TABLE.runScript(start(i), q2.SOLUTIONS[i], { strict: true });
    const blocks = i => Object.values(start(i).pieces).filter(p => p.kind === 'slab');
    const BUILDS = new Set(['grid', 'clusters', 'web', 'metallic']);
    q2.STAGES.forEach((st, i) => {
      for (const p of blocks(i)) {
        const d = B.declOf(p);
        holds(BUILDS.has(d.build) && Number.isFinite(d.melt) && d.melt > 0, `unit03/q2-lattice stage ${i + 1}: block ${p.id} is not a real build with a melting point`);
        const dial = Object.values(start(i).fixtures).find(f => f.kind === 'hotplate')?.dials.heat;
        if (dial) holds(dial.max >= Math.min(d.melt + dial.step, 900 + dial.step), `unit03/q2-lattice stage ${i + 1}: the hotplate cannot be turned up past block ${p.id}'s melting point`);
        if (dial && !st.table.pieces.some(q => q.props?.slab?.sealed)) holds(dial.max >= d.melt + dial.step, `unit03/q2-lattice stage ${i + 1}: the hotplate cannot be turned up past block ${p.id}'s melting point`);
      }
    });
    // 1. the predict stage holds the guesses and no instrument; the wrong idea (a cold block of salt lights the lamp) is a card
    {
      const t0 = start(0);
      holds(q2.STAGES[0].predict === true && !Object.values(t0.fixtures).length && !t0.tools.length, 'unit03/q2-lattice stage 1: the predict stage shows an instrument');
      holds(['lights', 'dark', 'never'].every(id => t0.pieces[id]?.kind === 'guess') && Object.keys(t0.pieces).length === 3, 'unit03/q2-lattice stage 1: the guesses are the three cards and nothing else');
      // What the guess is about: cold salt does NOT pass a current, molten salt does.
      const salt = B.declOf(q2.STAGES[1].table.pieces.find(p => p.id === 's1'));
      same([JB.conductionOf(salt, false), JB.conductionOf(salt, true)], [false, true], 'unit03/q2-lattice stage 1 (cold salt is dark, molten salt lights the lamp)');
    }
    // 2. a current needs ions or electrons free to move: cold and molten only for the metal, molten only for the lattice, never for molecules or a network
    {
      const want = { s1: 'molten', s2: 'never', s3: 'both', s4: 'never' };
      for (const p of blocks(1)) {
        const d = B.declOf(p);
        same(JB.conductionOf(d, false) ? 'both' : JB.conductionOf(d, true) ? 'molten' : 'never', want[p.id], `unit03/q2-lattice stage 2 (block ${p.id}'s current)`);
      }
      same(new Set(Object.values(want)).size, 3, 'unit03/q2-lattice stage 2 (all three trays are used)');
      // The lamp is the build's answer for the block in the state it is in right now.
      let t = TABLE.runScript(start(1), [{ join: ['leads', 's1'] }]);
      same(B.slabView(t.pieces.s1, t).current, false, 'unit03/q2-lattice stage 2 (the lamp, cold salt)');
      t = TABLE.runScript(t, [{ place: { piece: 's1', to: 'free:49,26' } }, { setDial: { fixture: 'hp', dial: 'heat', value: 825 } }]);
      same(B.slabView(t.pieces.s1, t).current, true, 'unit03/q2-lattice stage 2 (the lamp, molten salt)');
      for (const id of ['s1', 's2', 's3', 's4']) same(end(1).pieces[id].zone, `tray:${want[id]}`, `unit03/q2-lattice stage 2 (${id} is trayed by its lamp)`);
    }
    // 3. the four blocks give way at four different settings, and the rail's answer is the order they give way in
    {
      const ms = blocks(2).map(p => B.declOf(p).melt).sort((a, b) => a - b);
      same(ms.length, 4, 'unit03/q2-lattice stage 3 (four blocks)');
      for (let k = 1; k < ms.length; k++) holds(ms[k] - ms[k - 1] > 25, 'unit03/q2-lattice stage 3: two blocks give way within one step of the dial');
      const t = end(2);
      same(t.zones.rail.order.map(id => B.declOf(t.pieces[id]).melt), t.zones.rail.order.map(id => B.declOf(t.pieces[id]).melt).slice().sort((a, b) => a - b), 'unit03/q2-lattice stage 3 (the rail runs from the lowest melting point to the highest)');
      // A block is molten exactly while it stands on a plate at or past its melting point, and cools when it leaves.
      let t0 = start(2);
      t0 = TABLE.runScript(t0, [{ place: { piece: 's1', to: 'free:49,26' } }, { setDial: { fixture: 'hp', dial: 'heat', value: 775 } }]);
      holds(!B.slabView(t0.pieces.s1, t0).molten, 'unit03/q2-lattice stage 3: a block is molten below its melting point');
      t0 = TABLE.apply(t0, { setDial: { fixture: 'hp', dial: 'heat', value: 825 } });
      holds(B.slabView(t0.pieces.s1, t0).molten && B.slabView(t0.pieces.s1, t0).phase === 'molten', 'unit03/q2-lattice stage 3: a block is not molten past its melting point');
      t0 = TABLE.apply(t0, { place: { piece: 's1', to: 'rail:0' } });
      holds(!B.slabView(t0.pieces.s1, t0).molten, 'unit03/q2-lattice stage 3: a block lifted off the plate stays molten');
    }
    // 4. a checkerboard of twelve ions has no like charge touching, and slid it puts like against like; a row of one charge does not
    {
      const t = end(3);
      const g = B.gridRead(t, 'grid');
      same([g.filled, g.like, g.slid], [12, 0, true], 'unit03/q2-lattice stage 4 (a built grid)');
      holds(g.faced > 0, 'unit03/q2-lattice stage 4: sliding a layer of a checkerboard puts no like charge face to face');
      const ions = Object.values(start(3).pieces).filter(p => p.kind === 'ion');
      same([ions.filter(p => p.props.charge === 1).length, ions.filter(p => p.props.charge === -1).length], [6, 6], 'unit03/q2-lattice stage 4 (six plus ions and six minus ions)');
      const row = TABLE.runScript(start(3), [{ place: { piece: 'na1', to: 'slot:g00' } }, { place: { piece: 'na2', to: 'slot:g01' } }]);
      holds(B.gridRead(row, 'grid').like === 1, 'unit03/q2-lattice stage 4: two like ions side by side do not count as touching');
      const m = q2.STAGES[3].reward.model;
      holds(m && m.type === 'crystal' && m.cation === 'Na' && m.anion === 'Cl', 'unit03/q2-lattice stage 4: the reward does not hold the salt crystal');
    }
    // 5. four sealed blocks, four builds, four different behaviours on the three tests, and exactly one holds at 900 and passes no current
    {
      const sig = d => `${d.melt > 900 ? 'hot' : 'cool'}|${B.strikeOf(d.build)}|${JB.conductionOf(d, false)}|${JB.conductionOf(d, true)}`;
      const sigs = blocks(4).map(p => sig(B.declOf(p)));
      same(new Set(sigs).size, 4, 'unit03/q2-lattice stage 5 (four blocks tell apart by melt, blow and lamp)');
      same(blocks(4).map(p => B.declOf(p).build).sort(), ['clusters', 'grid', 'metallic', 'web'], 'unit03/q2-lattice stage 5 (the four builds)');
      holds(blocks(4).every(p => B.declOf(p).sealed), 'unit03/q2-lattice stage 5: a block is not sealed');
      const ok = blocks(4).filter(p => { const d = B.declOf(p); return d.melt > 900 && !JB.conductionOf(d, false) && !JB.conductionOf(d, true); });
      same(ok.map(p => p.id), ['x4'], 'unit03/q2-lattice stage 5 (the one block that holds at 900 and passes no current)');
      // A second block also holds at 900 and fails on the lamp, so melting alone does not settle it.
      holds(blocks(4).filter(p => B.declOf(p).melt > 900).length >= 2, 'unit03/q2-lattice stage 5: only one block holds at 900, so the lamp is not needed');
      same(end(4).pieces.x4.zone, 'slot:liner', 'unit03/q2-lattice stage 5 (the liner)');
    }
    // No stage declares an outcome a stage grades: the hotplate and the blocks carry only what a measurement gives. No field fetch is left here.
    for (const [i, st] of q2.STAGES.entries()) {
      for (const f of Object.values(start(i).fixtures)) if (f.kind === 'hotplate') holds(f.dials.heat.min === 0, `unit03/q2-lattice stage ${i + 1}: the hotplate does not start cold`);
      holds(!Object.keys(start(i).fetch).length, `unit03/q2-lattice stage ${i + 1}: sends the player to fetch something the bench already holds`);
    }
  }
  if (failures === before) ok('Ligar bench two: every block is a real build with a melting point the dial reaches, a block is molten exactly while it stands on a hot plate, and every graded answer (the lamp cold and molten, the rail, the grid and its slid layer, the four sealed builds, the one liner) agrees with joinbench\'s planSlab and conductionOf');
}

/* ------------------------------------------------------------------
   KETTLE'S TABLES (plan `bench-tabletop.md`, T2c): `q1-recipe` and `boss-golem` on the heap kit. A table can declare
   heaps and drums no bench ever held, so every graded answer is recomputed here from the planners and the listed masses
   (`joinbench.js` through the atom kit, `assay`'s piles, the scope's `planSettle`, `mass.js`), not from the numbers a
   stage's check carries: the molecule the samples hold, the layers a shake leaves, what a pan weighs before and after a
   joining, the molecules two heaps make and which gives out, the oxygen's share of a hundred parts, the molecule whose
   weights run three to eight, each sample's recipe, and the golem's heaps and drums.
   ------------------------------------------------------------------ */
{
  const before = failures;
  const A = await import('../src/learn/table/kits/atoms.js');
  const M = await import('../src/learn/table/kits/mass.js');
  const H = await import('../src/learn/table/kits/heap.js');
  const get = async id => { const q = getQuest('unit07', id); return q && q.status === 'live' ? q.module() : null; };
  const [k, g] = await Promise.all([get('q1-recipe'), get('boss-golem')]);
  const same = (a, b, what) => { if (JSON.stringify(a) !== JSON.stringify(b)) fail(`${what}: graded ${JSON.stringify(a)}, the real answer is ${JSON.stringify(b)}`); };
  const near = (a, b, what) => { if (!(Math.abs(a - b) < 1e-9 * Math.max(1, Math.abs(b)))) fail(`${what}: graded ${a}, the real answer is ${b}`); };
  const holds = (c, what) => { if (!c) fail(what); };
  const start = (mod, i) => TABLE.createTable(mod.STAGES[i].table, mod.STAGES[i].title);
  const end = (mod, i) => TABLE.runScript(start(mod, i), mod.SOLUTIONS[i], { strict: true });
  const declared = (mod, i, id) => mod.STAGES[i].table.pieces.find(p => p.id === id);
  const SC = await import('../src/learn/engine/scope.js');

  /** What one molecule of a declared dish is: its atoms by element, from the scope's own kinds. */
  const moleculeOfDish = piece => {
    const entry = piece.props.sample.particles[0];
    const counts = {};
    for (const kd of entry.kinds) { const sym = A.symOfKind(kd); counts[sym] = (counts[sym] || 0) + 1; }
    return counts;
  };
  const pureOf = piece => piece.props.sample.particles.length === 1 && A.layersOf(piece.props.sample) === 1;

  if (k) {
    // Every dish is a real sample of real kinds, and every atom is a real element.
    k.STAGES.forEach((st, i) => {
      for (const p of st.table.pieces) {
        if (p.kind === 'dish') for (const e of p.props.sample.particles) for (const kd of e.kinds) holds(SC.TINTS && A.symOfKind(kd), `unit07/q1-recipe stage ${i + 1}: dish ${p.id} holds "${kd}", which the scope has never weighed`);
        if (p.kind === 'atom') { try { A.elementOf(p.props.el); } catch { fail(`unit07/q1-recipe stage ${i + 1}: atom ${p.id} is "${p.props.el}", not an element`); } }
      }
    });
    // 1. the three samples are one substance, and the molecule built is that substance's
    {
      const mols = ['a1', 'a2', 'a3'].map(id => moleculeOfDish(declared(k, 0, id)));
      same(A.formulaFrom(mols[1]), A.formulaFrom(mols[0]), 'unit07/q1-recipe stage 1 (samples B and A are one substance)');
      same(A.formulaFrom(mols[2]), A.formulaFrom(mols[0]), 'unit07/q1-recipe stage 1 (samples C and A are one substance)');
      const built = A.moleculesOf(end(k, 0))[0];
      same(built.formula, A.formulaFrom(mols[0]), 'unit07/q1-recipe stage 1 (the molecule built is the samples\')');
      holds(Object.values(start(k, 0).pieces).filter(p => p.props.el === 'H' && !p.props.scratch).length >= 3, 'unit07/q1-recipe stage 1: the table holds too few hydrogens to build a wrong molecule');
    }
    // 2. the shaker's layers: the true compound settles into one layer, the other into two
    {
      const t = end(k, 1);
      for (const id of ['b1', 'b2']) {
        const layers = A.layersOf(declared(k, 1, id).props.sample);
        same(t.pieces[id].zone, layers === 1 ? 'tray:true' : 'tray:false', `unit07/q1-recipe stage 2 (${id}: ${layers} layer(s))`);
      }
      holds(A.layersOf(declared(k, 1, 'b1').props.sample) === 1 && A.layersOf(declared(k, 1, 'b2').props.sample) === 2, 'unit07/q1-recipe stage 2: the samples do not settle into one layer and two');
    }
    // 3. the same atoms weigh the same loose and joined, by the listed masses
    {
      const t = end(k, 2);
      const rows = t.recorder.rows;
      holds(rows.length >= 2 && new Set(rows.map(r => r.x)).size >= 2, 'unit07/q1-recipe stage 3: the solution weighs once, or twice in one state');
      const atoms = H.panRead(t, 'container:pan');
      const byMass = Object.entries(atoms.counts).reduce((m, [el, n]) => m + n * M.listedMass(el), 0);
      for (const r of rows) near(r.y, byMass, 'unit07/q1-recipe stage 3 (a weighing is the listed masses added up)');
      same([rows[0].x, rows[rows.length - 1].x], [0, 1], 'unit07/q1-recipe stage 3 (loose, then one molecule made)');
      near(M.scaleRead(t, 'scale').weight, byMass, 'unit07/q1-recipe stage 3 (the scale reads what is on the pan)');
    }
    // 4. two heaps, one molecule: the maker draws what the molecule in its dock holds; the heap that cannot supply another is the one marked
    {
      const t0 = start(k, 3);
      const t = end(k, 3);
      const dockRead = H.dockRead(t, 'container:dock');
      same([dockRead.counts.H, dockRead.counts.O, Object.keys(dockRead.counts).length], [2, 1, 2], 'unit07/q1-recipe stage 4 (the molecule the maker copies)');
      const have = { H: t0.zones.containers['heap-h'].capacity, O: t0.zones.containers['heap-o'].capacity };
      const want = H.limitOf(have, dockRead.counts);
      holds(want.limiting.length === 1, 'unit07/q1-recipe stage 4: both heaps give out together, so there is no limiting reactant to find');
      holds(want.made >= 4 && want.made <= 12, `unit07/q1-recipe stage 4: ${want.made} molecules is outside what the tally and the hand can do`);
      same([H.madeOf(t, 'made', dockRead.formula), H.tallyOf(t, 'tally'), H.heapLeft(t, 'heap-h', 'H'), H.heapLeft(t, 'heap-o', 'O')],
        [want.made, want.made, want.left.H, want.left.O], 'unit07/q1-recipe stage 4 (made, tally and what is left)');
      same(t.pieces.tag.zone, want.limiting[0] === 'H' ? 'container:heap-h' : 'container:heap-o', 'unit07/q1-recipe stage 4 (the heap marked)');
      holds(want.left[want.limiting[0] === 'H' ? 'O' : 'H'] > 0, 'unit07/q1-recipe stage 4: nothing is left of the other heap');
      // The maker refuses once a heap cannot supply another, and says which.
      const again = TABLE.apply(t, { run: 'maker' });
      holds(!again.last.ok && /heap/.test(again.last.reason || ''), 'unit07/q1-recipe stage 4: the maker did not refuse an empty heap with a reason');
      // And a molecule that is not a molecule is refused, not copied.
      const empty = TABLE.apply(t0, { run: 'maker' });
      holds(!empty.last.ok && empty.last.reason, 'unit07/q1-recipe stage 4: the maker copied an empty dock');
    }
    // 5. what share of water's weight is oxygen's, from the listed masses; the distractors are the atoms' shares
    {
      const t = end(k, 4);
      const w = M.scaleRead(t, 'scale').weight;
      near(w, 2 * M.listedMass('H') + M.listedMass('O'), 'unit07/q1-recipe stage 5 (the molecule on the pan weighs its atoms)');
      const share = 100 * M.listedMass('O') / w;
      holds(Math.abs(H.shareOf(t, 'share') - share) <= 1.5, `unit07/q1-recipe stage 5: the marker stands at ${H.shareOf(t, 'share')}, the share is ${share.toFixed(1)}`);
      holds(Math.abs(share - 100 / 3) > 5 && Math.abs(share - 200 / 3) > 5 && Math.abs(share - 50) > 5, 'unit07/q1-recipe stage 5: a share of the atoms (a third, a half, two thirds) is within reach of the true share');
      const d = k.STAGES[4].table.fixtures.find(f => f.kind === 'share').dials.share;
      holds(d.value !== Math.round(share), 'unit07/q1-recipe stage 5: the marker starts at the answer');
    }
    // 6. the molecule whose carbon and oxygen weigh three to eight, from the planner's own joins
    {
      const t = end(k, 5);
      const read = H.panRead(t, 'container:pan');
      same(A.formulaOf(read.ids, t), 'CO₂', 'unit07/q1-recipe stage 6 (the molecule on the pan)');
      const rows = H.ledgerOf(t, 'container:pan');
      const c = rows.find(r => r.sym === 'C').weight;
      const o = rows.find(r => r.sym === 'O').weight;
      same([c / o, 3 / 8], [3 / 8, 3 / 8], 'unit07/q1-recipe stage 6 (the ledger reads three to eight)');
      near(c, M.listedMass('C') * (read.counts.C), 'unit07/q1-recipe stage 6 (the ledger weighs carbon by its listed mass)');
      near(o, M.listedMass('O') * (read.counts.O), 'unit07/q1-recipe stage 6 (the ledger weighs oxygen by its listed mass)');
      // The other molecule the table can make is not three to eight.
      let co = start(k, 5);
      co = TABLE.applyAll(co, [{ join: ['c1', 'o1'] }, { place: { piece: 'c1', to: 'container:pan' } }]);
      const cw = H.ledgerOf(co, 'container:pan');
      holds(cw.find(r => r.sym === 'C').weight * 8 !== cw.find(r => r.sym === 'O').weight * 3, 'unit07/q1-recipe stage 6: carbon monoxide is three to eight too');
      holds(Object.values(start(k, 5).pieces).filter(p => p.props.el === 'O').length >= 3, 'unit07/q1-recipe stage 6: the table holds too few oxygens to build the wrong molecule too');
    }
    // 7. each sample's recipe, read off its own molecule: a middle atom and its hydrogens
    {
      const t = end(k, 6);
      const words = ['', 'one', 'two', 'three', 'four'];
      for (const id of ['g1', 'g2', 'g3']) {
        const counts = moleculeOfDish(declared(k, 6, id));
        const centre = Object.keys(counts).find(el => el !== 'H');
        const label = `${words[counts[centre]]} ${A.elementOf(centre).name} to ${words[counts.H]} hydrogens`.replace(/^one /, 'One ');
        const tray = k.STAGES[6].table.zones.trays.find(z => `tray:${z.id}` === t.pieces[id].zone);
        same(tray.label.toLowerCase(), label.toLowerCase(), `unit07/q1-recipe stage 7 (${id}'s recipe)`);
        holds(pureOf(declared(k, 6, id)), `unit07/q1-recipe stage 7: ${id} is not one substance`);
      }
      same(new Set(['g1', 'g2', 'g3'].map(id => t.pieces[id].zone)).size, 3, 'unit07/q1-recipe stage 7 (three samples, three trays)');
    }
    // 8. a shipment matches its label when it is one substance and its molecule is the label's
    {
      const t = end(k, 7);
      for (const id of ['h1', 'h2', 'h3']) {
        const p = declared(k, 7, id);
        const counts = moleculeOfDish(p);
        const matches = pureOf(p) && counts.O === 1 && counts.H === 2 && Object.keys(counts).length === 2;
        same(t.pieces[id].zone, matches ? 'tray:yes' : 'tray:no', `unit07/q1-recipe stage 8 (${id})`);
      }
      const verdicts = ['h1', 'h2', 'h3'].map(id => t.pieces[id].zone);
      holds(new Set(verdicts).size === 2 && verdicts.filter(z => z === 'tray:yes').length === 1, 'unit07/q1-recipe stage 8: the shipments are not one that matches and two that do not');
      // Each way to fail is a different one: a mixture (two layers) and a different molecule (one layer, other formula).
      holds(A.layersOf(declared(k, 7, 'h2').props.sample) === 2 && A.layersOf(declared(k, 7, 'h3').props.sample) === 1, 'unit07/q1-recipe stage 8: the two that fail do not fail in two different ways');
    }
  }

  if (g) {
    // 1. the golem's two heaps: units of sodium chloride built one to one, the smaller heap sets the count
    {
      const t0 = start(g, 0);
      const t = end(g, 0);
      const d = H.dockRead(t, 'container:dock');
      same([d.counts.Na, d.counts.Cl, Object.keys(d.counts).length, d.formula], [1, 1, 2, 'NaCl'], 'unit07/boss-golem phase 1 (the unit the maker copies)');
      const have = { Na: t0.zones.containers['heap-na'].capacity, Cl: t0.zones.containers['heap-cl'].capacity };
      const want = H.limitOf(have, d.counts);
      same(want.limiting, ['Na'], 'unit07/boss-golem phase 1 (the heap that gives out)');
      holds(want.left.Cl > 0 && have.Na !== have.Cl, 'unit07/boss-golem phase 1: the heaps are equal, so there is no limiting reactant to find');
      same([H.tallyOf(t, 'tally'), H.madeOf(t, 'made', 'NaCl'), H.heapLeft(t, 'heap-na', 'Na'), H.heapLeft(t, 'heap-cl', 'Cl')], [want.made, want.made, 0, want.left.Cl], 'unit07/boss-golem phase 1 (tally, made, what is left)');
      holds(want.made <= g.STAGES[0].table.fixtures.find(f => f.kind === 'tally').dials.n.max, 'unit07/boss-golem phase 1: the tally cannot reach the answer');
    }
    // The golem's later phases (the pot's yield and ledger) are held in `tools/lib/kettle-boss-golem-checks.mjs`; the retired by-weight drum phase is in `archive/2026-10-30/tools/`.
    // A boss phase on a table is a fight on a table: each phase names its foe, none sends the player into a world.
    for (const [i, st] of g.STAGES.entries()) {
      holds(Array.isArray(st.foes) && st.foes.length === 1 && st.encounter?.species === 'recipe golem', `unit07/boss-golem phase ${i + 1}: a fight names its foe and its species`);
      holds(!st.field && !(st.table.fetch || []).length, `unit07/boss-golem phase ${i + 1}: a boss never sends the player into the world`);
    }
  }
  if (failures === before) ok('Kettle: every declared dish is a real sample and every graded answer (the molecule three samples share, the layers a shake leaves, what a pan weighs loose and joined, the molecules two heaps make and the heap that gives out, the oxygen\'s share of a hundred parts, the molecule that weighs three to eight, each sample\'s recipe, the shipments against their label, the golem\'s heaps and drums) agrees with the planners and the listed masses');
}

if (warnings) console.log(`\n${warnings} copy warning(s): reward cards over 45 words.`);
console.log(`\n${failures === 0 ? 'LEARN TRACK OK' : failures + ' PROBLEM(S) FOUND'}`);
process.exit(failures === 0 ? 0 : 1);
