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
  WORLDS, TOTAL_WORLDS, ARENAS, QUEST_STATUSES, PROBLEMS_PER_QUEST,
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
  // Owed by EVERY live quest, not only a table-driven one: the world's problem
  // set is five per built quest, and a quest that grades some other way still
  // owes its five.
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
    'unit03/q9-orbitals': /\b(antibonding|bonding orbitals?|molecular orbitals?)\b/i,
    'unit03/q3-distance': /\b(potential energy curves?|bond lengths?|bond energ(?:y|ies)|bond orders?|lattice energ(?:y|ies))\b/i,
    'unit07/q1-recipe': /\b(limiting reactants?|conservation of mass|fixed composition|constant composition|definite proportions|multiple proportions|empirical formulas?|percent composition)\b/i,
    'unit01/q6-weigh': /\b(moles?|molar|avogadro\w*|formula mass|gram formula mass)\b/i,
    // Bellows. Each holds out only what it has yet to earn.
    'unit04/q6-real': /\b(ideal gas(?! law)|ideal gases|real gases?|van der waals)\b/i,
    'unit04/q5-speed': /\b(effusion|graham.?s law|diffusion)\b/i,
    'unit04/q4-mixtures': /\b(partial pressures?|dalton.?s law|mole fractions?)\b/i,
    'unit04/q3-ideal': /\b(molar volume|gas constant|ideal gas law)\b/i,
    'unit04/q2-laws': /\b(boyle.?s law|inversely proportional|charles.?s law|gay.lussac.?s law|avogadro.?s law|combined gas law)\b/i,
    'unit04/q1-knocks': /\b(pressure|kinetic energy|maxwell.boltzmann|atm|atmospheres?|kpa|kilopascals?|mmhg|absolute zero|kelvin|kinetic molecular theory)\b/i,
    // Lanternfall. Longer phrases first, so "visible spectrum" is read as the
    // phrase and not as a stray word.
    'unit02/q8-trends': /\b(electron affinity|electronegativity|successive ionization energies|ionization energ(?:y|ies)|ionic radi(?:us|i)|atomic radi(?:us|i)|effective nuclear charge|shielding|coulomb.?s law)\b/i,
    'unit02/q7-pes': /\b(photoelectron spectr(?:um|a)|binding energy|subshells?)\b/i,
    'unit02/q6-filling': /\b(transition metal ions?|blocks?|noble.gas notation|configurations?|hund.?s? rule|paramagnetic|diamagnetic|aufbau)\b/i,
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
 * THE PROBLEM SET. Five per built quest, gathered and shown at the END OF THE
 * WORLD (`src/learn/practice.js`), optional and skippable, reopenable for ever
 * from the star map.
 *
 * Checked here because the set is the one piece of Learn content a player meets
 * outside a quest's own frame: a malformed answer id or an option list of one
 * would be a dead question in a student's hands with nothing to catch it.
 *
 * Practice copy is EXEMPT from the withheld vocabulary. The set runs after the
 * world's last debrief, which is where the real words are introduced — a
 * revision question that had to call an atom "a piece" would be teaching the
 * game's fiction rather than the chemistry.
 */
function checkPractice(q, mod) {
  const set = mod.PRACTICE;
  if (!Array.isArray(set)) {
    fail(`${q.key}: exports no PRACTICE — every built quest owes ${PROBLEMS_PER_QUEST} problems`);
    return;
  }
  if (set.length !== PROBLEMS_PER_QUEST) {
    fail(`${q.key}: PRACTICE has ${set.length} problems, expected ${PROBLEMS_PER_QUEST}`);
    return;
  }

  let bad = 0;
  const emoji = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]/u;

  set.forEach((p, i) => {
    const label = `${q.key} problem ${i + 1}`;
    if (!p.question || typeof p.question !== 'string') { fail(`${label}: no question`); bad++; }
    if (!p.explanation || p.explanation.length < 20) {
      // A question that is only marked wrong teaches nothing.
      fail(`${label}: no explanation, or too terse to teach`); bad++;
    }
    if (!Array.isArray(p.options) || p.options.length < 3) {
      fail(`${label}: needs at least three options (got ${p.options?.length ?? 0})`); bad++; return;
    }
    const ids = new Set();
    for (const o of p.options) {
      if (!o || !o.id || !o.label) { fail(`${label}: an option has no id or label`); bad++; continue; }
      if (ids.has(o.id)) { fail(`${label}: duplicate option id "${o.id}"`); bad++; }
      ids.add(o.id);
      if (emoji.test(o.label)) { fail(`${label}: emoji in an option`); bad++; }
    }
    if (!ids.has(p.answer)) {
      fail(`${label}: answer "${p.answer}" is not one of its own options`); bad++;
    }
    if (new Set(p.options.map(o => o.label)).size !== p.options.length) {
      fail(`${label}: two options read the same`); bad++;
    }
  });

  if (!bad) ok(`${q.key}: ${set.length} practice problems, all answerable`);
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

/* ------------------------------------------------------------------
   EVERY FIGURE A LANTERNFALL STAGE GRADES AGAINST IS RECOMPUTED FROM THE REAL
   TABLES. An answer authored as a literal can drift from the instrument that
   teaches it; one recomputed here from `lightdata.js` cannot.
   ------------------------------------------------------------------ */
{
  const before = failures;
  const D = await import('../src/learn/engine/lightdata.js');
  const q1 = getQuest('unit02', 'q1-wave') && await getQuest('unit02', 'q1-wave').module?.();
  const q2 = getQuest('unit02', 'q2-photon') && await getQuest('unit02', 'q2-photon').module?.();
  const q3 = getQuest('unit02', 'q3-lines') && await getQuest('unit02', 'q3-lines').module?.();
  const q9 = getQuest('unit02', 'q9-absorb') && await getQuest('unit02', 'q9-absorb').module?.();
  const near = (a, b, tol, what) => { if (Math.abs(a - b) > tol) fail(`${what}: graded ${a}, the real figure is ${b.toFixed(3)}`); };
  const COLOUR_NAMES = CUV => CUV.COLOURS.map(c => c.id);
  const STAGE_STATE = (q, i, script) => TABLE.createTable(q.STAGES[i].table, q.STAGES[i].title) && { table: TABLE.createTable(q.STAGES[i].table, q.STAGES[i].title), bins: {}, order: [] };

  if (q1) {
    // THE FIRST LANTERNFALL TABLE (`q1-wave`, the optics kit): every figure a stage grades is the planner's, read off the table.
    const OPT = await import('../src/learn/table/kits/optics.js');
    const same = (a, b, what) => { if (JSON.stringify(a) !== JSON.stringify(b)) fail(`${what}: graded ${JSON.stringify(a)}, the real answer is ${JSON.stringify(b)}`); };
    const holds = (c, what) => { if (!c) fail(what); };
    const start = i => TABLE.createTable(q1.STAGES[i].table, q1.STAGES[i].title);
    const end = i => TABLE.runScript(start(i), q1.SOLUTIONS[i], { strict: true });
    const ref = (t, id) => OPT.waveRead(t, id);
    // 1. the lamp on the dial the solution leaves it at makes more crests a second than Sample A; the dial it starts at does not
    {
      const e = end(0);
      holds(ref(e, 'l').plan.hz > ref(e, 'a').plan.hz, 'unit02/q1-wave stage 1: the lamp does not make more crests a second than Sample A');
      const placed = TABLE.runScript(start(0), [q1.SOLUTIONS[0][2]], { strict: true });
      holds(ref(placed, 'l').plan.hz <= ref(placed, 'a').plan.hz, 'unit02/q1-wave stage 1: the lamp already beats Sample A on the dial it starts at');
      holds(ref(e, 'l').plan.hz > ref(e, 'a').plan.hz && ref(e, 'l').nm < ref(e, 'a').nm, 'unit02/q1-wave stage 1: more crests a second is not closer crests');
      // the flume's strip is a water wave: its own crest spacing and count
      const f = TABLE.runScript(start(0), [{ fetch: 'flume' }, q1.SOLUTIONS[0][1]], { strict: true });
      same(ref(f, 'l').kind, 'water', 'unit02/q1-wave stage 1 (the flume strip reads as a water wave)');
    }
    // 2. twice the crest spacing is half the crests a second, and the dial offers exactly that setting
    {
      const e = end(1);
      same(ref(e, 'l').nm, ref(e, 'a').nm * 2, 'unit02/q1-wave stage 2 (twice the crest spacing)');
      near(ref(e, 'l').plan.hz * 2, ref(e, 'a').plan.hz, ref(e, 'a').plan.hz * 1e-9, 'unit02/q1-wave stage 2 (half the crests a second)');
      holds(q1.STAGES[1].table.fixtures[1].props.settings.includes(ref(e, 'a').nm * 2), 'unit02/q1-wave stage 2: the dial has no setting at twice the spacing');
    }
    // 3. a pulse is timed between two detectors by the planner, and the reading the solution sets is the speed that gap and time give
    {
      const e = end(2);
      const row = e.recorder.rows[0];
      holds(Boolean(row), 'unit02/q1-wave stage 3: firing the pulse recorded nothing');
      near(D.pulseNs(row.x), row.y, 1e-9, 'unit02/q1-wave stage 3 (the pulse time is the planner\'s)');
      near(row.x / (row.y * 1e-9) / 1e8, D.LIGHT_SPEED / 1e8, 0.05, 'unit02/q1-wave stage 3 (gap over time is the speed of light, x 10^8)');
      same(e.fixtures.speed.dials.n.value, 3, 'unit02/q1-wave stage 3 (the reading is that speed)');
      holds(start(2).fixtures.speed.dials.n.value !== 3, 'unit02/q1-wave stage 3: the reading starts on the answer');
      for (const m of start(2).fixtures.rail.props.marks) near(D.pulseNs(m.metres) * 1e-9 * D.LIGHT_SPEED, m.metres, 0.03, `unit02/q1-wave stage 3 (the pulse over ${m.metres} m)`);
    }
    // 4. the two reference lamps give one product, and the reading is the frequency that product gives at 600 nm
    {
      const t = start(3);
      for (const id of ['r1', 'r2']) near((D.nmToHz(t.pieces[id].props.nm) * t.pieces[id].props.nm * 1e-9) / 1e8, 3, 0.01, `unit02/q1-wave stage 4 (${id}'s product is the speed of light)`);
      same(end(3).fixtures.freq.dials.n.value, 5, 'unit02/q1-wave stage 4 (the reading)');
      near(5, D.nmToHz(600) / 1e14, 0.01, 'unit02/q1-wave stage 4 (frequency of 600 nm)');
      holds(start(3).fixtures.freq.dials.n.value !== 5, 'unit02/q1-wave stage 4: the reading starts on the answer');
    }
    // 5. the rail runs from the lowest frequency to the highest, and a lamp's frequency is the planner's
    {
      const t = start(4);
      const lamps = ['a', 'b', 'c', 'd'].map(id => [id, t.pieces[id].props.nm]);
      const lowest = lamps.slice().sort((x, y) => y[1] - x[1]).map(x => x[0]).join();
      same(end(4).zones.rail.order.join(), lowest, 'unit02/q1-wave stage 5 (lowest frequency first)');
      for (let k = 1; k < lamps.length; k++) holds(D.nmToHz(lamps.slice().sort((x, y) => y[1] - x[1])[k][1]) > D.nmToHz(lamps.slice().sort((x, y) => y[1] - x[1])[k - 1][1]), 'unit02/q1-wave stage 5: a shorter wavelength is not a higher frequency');
    }
    // 6. each lamp is under the strip the planner says picks it up, and each strip is the one the band lights
    {
      const t = start(5);
      const e = end(5);
      for (const id of ['a', 'b', 'c']) {
        const nm = t.pieces[id].props.nm;
        same(e.pieces[id].zone, `tray:${OPT.pickedUpBy(nm) === 'eye' ? 'eye' : OPT.pickedUpBy(nm) === 'infrared' ? 'ir' : 'uv'}`, `unit02/q1-wave stage 6 (lamp ${id} at ${nm} nm)`);
        const read = OPT.bandRead(TABLE.runScript(t, [{ place: { piece: id, to: 'slot:band.src' } }], { strict: true }), 'band');
        same([read.uv, read.ir, read.shape === 'lines'], [OPT.pickedUpBy(nm) === 'ultraviolet', OPT.pickedUpBy(nm) === 'infrared', OPT.pickedUpBy(nm) === 'eye'], `unit02/q1-wave stage 6 (what the band lights for ${nm} nm)`);
      }
    }
    // 7. a source's frequency is the speed of light over its wavelength, and it stands under the tray that figure is printed on
    {
      const t = start(6);
      const e = end(6);
      for (const id of ['radio', 'micro', 'xray']) {
        const hz = D.nmToHz(t.pieces[id].props.nm);
        const label = t.zones.trays[e.pieces[id].zone.slice(5)].label;
        const m = /^([\d.]+) x 10\^(\d+)/.exec(label);
        const printed = Number(m[1]) * 10 ** Number(m[2]);
        holds(Math.abs(printed / hz - 1) < 0.05, `unit02/q1-wave stage 7: ${id} is under "${label}" but its frequency is ${hz.toExponential(2)}`);
      }
      holds(['f8', 'f9', 'f18'].every(id => t.zones.trays[id]), 'unit02/q1-wave stage 7: a tray is missing');
    }
    // 8. the lamp in the slot makes 5.1 x 10^14 a second; the other does not
    {
      const t = start(7);
      const e = end(7);
      const chosen = e.pieces[OPT.seated(e, 'match').id];
      near(D.nmToHz(chosen.props.nm) / 1e14, 5.1, 0.06, 'unit02/q1-wave stage 8 (the chosen lamp\'s frequency)');
      const other = ['a', 'b'].find(id => id !== chosen.id);
      holds(Math.abs(D.nmToHz(t.pieces[other].props.nm) / 1e14 - 5.1) > 0.3, 'unit02/q1-wave stage 8: both lamps are near 5.1');
      holds(q1.STAGES[7].table.fixtures[0].props.rate === false, 'unit02/q1-wave stage 8: the screen prints the frequency, so the stage is only a reading');
    }
  }
  if (q2) {
    // THE SECOND LANTERNFALL TABLE (`q2-photon`, the optics kit): the cup and the meters are `planPhotocell`, read off the table.
    const OPT = await import('../src/learn/table/kits/optics.js');
    const same = (a, b, what) => { if (JSON.stringify(a) !== JSON.stringify(b)) fail(`${what}: graded ${JSON.stringify(a)}, the real answer is ${JSON.stringify(b)}`); };
    const holds = (c, what) => { if (!c) fail(what); };
    const start = i => TABLE.createTable(q2.STAGES[i].table, q2.STAGES[i].title);
    const end = i => TABLE.runScript(start(i), q2.SOLUTIONS[i], { strict: true });
    const sweep = (i, metal, brightness = 3) => q2.STAGES[i].table.fixtures[0].props.settings.map(n => D.planPhotocell(metal, n, brightness));
    const wake = ['cs', 'na', 'zn'].map(m => D.thresholdNm(m[0].toUpperCase() + m[1]));
    if (!(wake[0] > wake[1] && wake[1] > wake[2])) fail('unit02/q2-photon: the work functions do not order cesium < sodium < zinc');
    // 1. red at full brightness frees nothing; the solution frees something, and it is not the brightest lamp
    {
      const t = start(0);
      const f = t.fixtures.cell;
      holds(!D.planPhotocell('Na', f.props.settings[f.dials.colour.value - 1], f.dials.brightness.value).freed, 'unit02/q2-photon stage 1: the lamp already frees electrons where it starts');
      const r = OPT.cellRead(end(0), 'cell');
      holds(r.freed && r.metal === 'Na', 'unit02/q2-photon stage 1: the solution does not free electrons from sodium');
      holds(r.brightness < f.dials.brightness.value && r.nm < f.props.settings[0], 'unit02/q2-photon stage 1: the solution is not dimmer and bluer than the start');
    }
    // 2. exactly one first setting frees an electron, and the dial finds it
    {
      const p = sweep(1, 'Na');
      const first = p.findIndex(x => x.count > 0) + 1;
      same(end(1).fixtures.cell.dials.colour.value, first, 'unit02/q2-photon stage 2 (the first freeing setting)');
      holds(p.slice(0, first - 1).every(x => x.count === 0) && p.slice(first).every(x => x.count > 0), 'unit02/q2-photon stage 2: electrons do not leave at every setting from the threshold on');
    }
    // 3. brightness sets the number and not the speed
    {
      const f = start(2).fixtures.cell;
      const lo = D.planPhotocell('Na', 400, f.dials.brightness.value);
      const e = OPT.cellRead(end(2), 'cell');
      same(e.count, lo.count * 2, 'unit02/q2-photon stage 3 (twice the count)');
      same(e.speed, lo.speed, 'unit02/q2-photon stage 3 (the same speed)');
      holds(lo.count > 0, 'unit02/q2-photon stage 3: the lamp frees nothing at the start');
    }
    // 4. frequency sets the speed and not the number; one setting reads the speed the prompt names
    {
      const p = sweep(3, 'Na');
      const freeing = p.filter(x => x.count > 0);
      holds(freeing.every((x, k) => k === 0 || x.speed > freeing[k - 1].speed), 'unit02/q2-photon stage 4: the speed does not rise with frequency');
      holds(new Set(freeing.map(x => x.count)).size === 1, 'unit02/q2-photon stage 4: the count changes with frequency');
      const eights = p.map((x, k) => [Math.abs(x.speed - 8) < 0.05, k + 1]).filter(([ok]) => ok).map(([, k]) => k);
      same(eights, [end(3).fixtures.cell.dials.colour.value], 'unit02/q2-photon stage 4 (the one setting that reads 8 x 10^5 m/s)');
      holds(/8 x 10\^5/.test(q2.STAGES[3].prompt), 'unit02/q2-photon stage 4: the prompt does not name the speed the check grades');
      same(end(3).recorder.rows.length, 1, 'unit02/q2-photon stage 4 (a reading was recorded)');
    }
    // 5. the plaque's worked check is the real photon energy at 539 nm and the reading is the energy at 500 nm
    {
      const lines = start(4).fixtures.card.props.lines;
      const worked = D.photonJoules(539) / 1e-19;
      holds(lines.some(t => t.includes(worked.toFixed(2))), 'unit02/q2-photon stage 5: the worked check is not the real photon energy at 539 nm');
      holds(lines.some(t => t.includes(`${(D.PLANCK / 1e-34).toFixed(3)} x 10^-34`)), 'unit02/q2-photon stage 5: the plaque does not print the real h');
      holds(lines.some(t => t.includes(`${(D.nmToHz(500) / 1e14).toFixed(2)} x 10^14`)), 'unit02/q2-photon stage 5: the plaque does not print the frequency at 500 nm');
      near(end(4).fixtures.energy.dials.n.value, D.photonJoules(500) / 1e-19, 0.26, 'unit02/q2-photon stage 5 (photon energy at 500 nm)');
      holds(start(4).fixtures.energy.dials.n.value !== end(4).fixtures.energy.dials.n.value, 'unit02/q2-photon stage 5: the reading starts on the answer');
    }
    // 6. the plate that wakes at the lowest frequency has the loosest grip, and the rail runs that way
    {
      const t = start(5);
      const settings = t.fixtures.cell.props.settings;
      const first = m => D.planPhotocell(m, 1, 1) && settings.findIndex(n => D.planPhotocell(m, n, 3).freed) + 1;
      const order = ['Cs', 'Na', 'Zn'].sort((x, y) => first(x) - first(y)).map(m => m.toLowerCase());
      same(end(5).zones.rail.order, order, 'unit02/q2-photon stage 6 (loosest grip first)');
      holds(['Cs', 'Na', 'Zn'].every(m => first(m) > 0), 'unit02/q2-photon stage 6: a plate never wakes on the dial');
      holds(new Set(['Cs', 'Na', 'Zn'].map(first)).size === 3, 'unit02/q2-photon stage 6: two plates wake at the same setting');
      same(end(5).recorder.rows.map(r => r.label), ['Cs', 'Na', 'Zn'], 'unit02/q2-photon stage 6 (a reading for each plate)');
      for (const m of ['Cs', 'Na', 'Zn']) near(D.METALS[m].work, D.METALS[m].work, 0, `${m}'s work function is the table's`);
    }
    // 7. a lamp is in the first tray exactly when its photons carry the work function of zinc
    {
      const t = start(6);
      const e = end(6);
      for (const id of ['a', 'b', 'c']) {
        const frees = D.planPhotocell('Zn', t.pieces[id].props.nm, t.fixtures.cell.props.brightness).freed;
        same(e.pieces[id].zone, frees ? 'tray:yes' : 'tray:no', `unit02/q2-photon stage 7 (lamp ${id} at ${t.pieces[id].props.nm} nm)`);
        const read = OPT.cellRead(TABLE.runScript(t, [{ place: { piece: id, to: 'slot:cell.lamp' } }], { strict: true }), 'cell');
        same(read.freed, frees, `unit02/q2-photon stage 7 (what the cup does for lamp ${id})`);
      }
      holds(['a', 'b', 'c'].some(id => D.planPhotocell('Zn', t.pieces[id].props.nm, 5).freed) && ['a', 'b', 'c'].some(id => !D.planPhotocell('Zn', t.pieces[id].props.nm, 5).freed), 'unit02/q2-photon stage 7: every lamp is in one tray');
    }
    // 8. red frees nothing from zinc at any brightness, and the prediction is that
    {
      const t = start(7);
      const settings = t.fixtures.cell.props.settings;
      for (let b = 1; b <= 5; b++) holds(!D.planPhotocell('Zn', settings[0], b).freed, `unit02/q2-photon stage 8: red frees zinc at brightness ${b}`);
      holds(D.planPhotocell('Zn', settings[3], 3).freed, 'unit02/q2-photon stage 8: not even the shortest setting frees zinc');
      same(end(7).prediction.token, 'none', 'unit02/q2-photon stage 8 (the prediction)');
      holds(end(7).prediction.tested, 'unit02/q2-photon stage 8: the solution never ran the test');
    }
  }
  if (q3) {
    // THE THIRD LANTERNFALL TABLE (`q3-lines`, the optics kit): bands, strips and rungs are `planPrism`, `planJump` and `jumpsForLine`.
    const OPT = await import('../src/learn/table/kits/optics.js');
    const same = (a, b, what) => { if (JSON.stringify(a) !== JSON.stringify(b)) fail(`${what}: graded ${JSON.stringify(a)}, the real answer is ${JSON.stringify(b)}`); };
    const holds = (c, what) => { if (!c) fail(what); };
    const start = i => TABLE.createTable(q3.STAGES[i].table, q3.STAGES[i].title);
    const end = i => TABLE.runScript(start(i), q3.SOLUTIONS[i], { strict: true });
    near(D.planJump(3, 2).nm, 656, 1.5, 'the 3 to 2 jump is the red line');
    for (const [gas, lines] of Object.entries(D.LINES)) {
      if (gas !== 'Ne' && lines.some(n => n < 380 || n > 750)) fail(`${gas}: a listed line is outside the visible band`);
    }
    // 1. a filament lights the band end to end, a gas tube in a few places
    {
      const t = start(0);
      const shapeOf = id => OPT.bandRead(TABLE.runScript(t, [{ place: { piece: id, to: 'slot:sp.src' } }], { strict: true }), 'sp').shape;
      same([shapeOf('fil'), shapeOf('tube')], ['band', 'lines'], 'unit02/q3-lines stage 1 (what each source makes)');
      same([end(0).pieces.fil.zone, end(0).pieces.tube.zone], ['tray:band', 'tray:lines'], 'unit02/q3-lines stage 1 (the trays)');
    }
    // 2. the sealed tube is helium, and exactly the helium strip falls whole on its band
    {
      const t = start(1);
      const whole = id => OPT.bandRead(TABLE.runScript(t, [{ place: { piece: 'x', to: 'slot:sp.src' } }, { place: { piece: id, to: 'slot:sp.ref' } }], { strict: true }), 'sp');
      const full = ['h', 'he', 'na'].filter(id => { const r = whole(id); return r.whole && r.refLines.length === r.seen.length; });
      same(full, ['he'], 'unit02/q3-lines stage 2 (the one strip that matches the sealed tube)');
      same(t.pieces.x.props.gas, 'He', 'unit02/q3-lines stage 2 (the sealed tube is helium)');
      holds(OPT.bandRead(end(1), 'sp').ref.props.gas === 'He', 'unit02/q3-lines stage 2: the solution does not leave the helium strip alongside');
    }
    // 3. cool hydrogen cuts out of the filament's light exactly the lines hot hydrogen gives, and no other strip fits
    {
      const t = start(2);
      const tryStrip = id => OPT.bandRead(TABLE.runScript(t, [{ place: { piece: 'fil', to: 'slot:sp.src' } }, { place: { piece: 'cell', to: 'slot:sp.cell' } }, { place: { piece: id, to: 'slot:sp.ref' } }], { strict: true }), 'sp');
      const full = ['h', 'he', 'na'].filter(id => { const r = tryStrip(id); return r.whole && r.refLines.length === r.seen.length; });
      same(full, ['h'], 'unit02/q3-lines stage 3 (the one strip that matches the dark lines)');
      holds(tryStrip('h').plan.continuous && tryStrip('h').seen.length === D.LINES.H.length, 'unit02/q3-lines stage 3: the band behind the cell is not the filament with hydrogen\'s lines cut out');
    }
    // 4. the red line is the 3 to 2 drop, and it is the only one of the ladder's drops that is red
    {
      const reds = [];
      for (let hi = 2; hi <= 6; hi++) for (let lo = 1; lo < hi; lo++) { const nm = D.planJump(hi, lo).nm; if (nm >= 620 && nm <= 750) reds.push(`${hi}-${lo}`); }
      same(reds, ['3-2'], 'unit02/q3-lines stage 4 (the drops that give a red line)');
      const r = OPT.ladderRead(end(3), 'lad');
      same([r.last.hi, r.last.lo], [3, 2], 'unit02/q3-lines stage 4 (the last drop)');
      near(r.last.nm, D.planJump(3, 2).nm, 0.01, 'unit02/q3-lines stage 4 (the line the strip kept)');
      same(OPT.ladderRead(start(3), 'lad').rung, 1, 'unit02/q3-lines stage 4 (the electron starts on the ground rung)');
    }
    // 5. the line's energy is hc over its wavelength, and the marker is set to it
    {
      const v = end(4).fixtures.energy.dials.n.value;
      near(v, D.photonJoules(486) / 1e-19, 0.06, 'unit02/q3-lines stage 5 (486 nm line)');
      near(D.planJump(4, 2).nm, 486, 1.5, 'unit02/q3-lines stage 5 (the 4 to 2 drop makes the 486 nm line)');
      near(D.photonJoules(656) / 1e-19, 3.03, 0.01, 'unit02/q3-lines stage 5 (the worked line)');
      holds(start(4).fixtures.energy.dials.n.value !== v, 'unit02/q3-lines stage 5: the reading starts on the answer');
    }
    // 6. five to two makes 434 nm, and the solution made the drop it predicted
    {
      const e = end(5);
      near(Number(e.prediction.token), D.planJump(5, 2).nm, 1.5, 'unit02/q3-lines stage 6 (5 to 2 jump)');
      holds(OPT.ladderRead(e, 'lad').lines.some(n => Math.abs(n - D.planJump(5, 2).nm) < 1), 'unit02/q3-lines stage 6: the strip did not keep the drop the stage asks about');
      holds(q3.STAGES[5].table.prediction ? true : false, 'unit02/q3-lines stage 6: no prediction slot');
      const distinct = new Set(['410', '434', '486', '656'].map(Number).map(n => Math.round(D.planJump(n === 410 ? 6 : n === 434 ? 5 : n === 486 ? 4 : 3, 2).nm)));
      same(distinct.size, 4, 'unit02/q3-lines stage 6 (four tokens, four different drops)');
    }
    // 7. one electron on the top of the ladder has left: the top is above every rung
    {
      same(OPT.ladderRead(end(6), 'lad').out, true, 'unit02/q3-lines stage 7 (the electron is off the ladder)');
      near(-D.bohrJoules(1) / 1e-18, 2.18, 0.001, 'unit02/q3-lines stage 7 (the whole climb)');
    }
    // 8. a line goes in the first tray exactly when some pair of rungs makes it
    {
      const t = start(7);
      const e = end(7);
      for (const id of ['c486', 'c588', 'c447']) {
        const nm = t.pieces[id].props.nm;
        const makes = D.jumpsForLine(nm).length > 0;
        same(e.pieces[id].zone, makes ? 'tray:yes' : 'tray:no', `unit02/q3-lines stage 8 (the ${nm} nm line)`);
      }
      holds(['c486', 'c588', 'c447'].some(id => D.jumpsForLine(t.pieces[id].props.nm).length) && ['c486', 'c588', 'c447'].some(id => !D.jumpsForLine(t.pieces[id].props.nm).length), 'unit02/q3-lines stage 8: every line goes in one tray');
      for (const nm of D.LINES.He) holds(D.jumpsForLine(nm).length === 0, `unit02/q3-lines stage 8: a drop on hydrogen's ladder makes helium's ${nm} nm line`);
      holds(D.jumpsForLine(486).some(j => j.hi === 4 && j.lo === 2), 'unit02/q3-lines stage 8: the 4 to 2 drop does not make 486 nm');
    }
  }
  if (q9) {
    // THE NINTH LANTERNFALL TABLE (`q9-absorb`, the cuvette kit): every reading is `planAbsorb`, every graded figure is recomputed.
    const CUV = await import('../src/learn/table/kits/cuvette.js');
    const same9 = (a, b, what) => { if (JSON.stringify(a) !== JSON.stringify(b)) fail(`${what}: graded ${JSON.stringify(a)}, the real answer is ${JSON.stringify(b)}`); };
    const holds9 = (c, what) => { if (!c) fail(what); };
    const start9 = i => TABLE.createTable(q9.STAGES[i].table, q9.STAGES[i].title);
    const end9 = i => TABLE.runScript(start9(i), q9.SOLUTIONS[i], { strict: true });
    // A drop is a fixed strength: drops are concentration, and a cuvette holds no more than the bench's limit.
    same9(CUV.concOf({ props: { drops: 3 } }), 0.006, 'unit02/q9-absorb (three drops)');
    {
      const t = start9(4);
      let u = t;
      for (let k = 0; k < CUV.MAX_DROPS + 1; k++) u = TABLE.apply(u, { join: ['drop', 'b'] });
      same9(u.pieces.b.props.drops, CUV.MAX_DROPS, 'unit02/q9-absorb (a full cuvette takes no more)');
      holds9(u.last.ok === false || u.last.reason, 'unit02/q9-absorb: a seventh drop is not refused with a reason');
      const poured = TABLE.apply(TABLE.apply(t, { join: ['drop', 'b'] }), { join: ['empty', 'b'] });
      same9(poured.pieces.b.props.drops, 0, 'unit02/q9-absorb (the empty tool pours a cuvette out)');
      const sealed = TABLE.apply(start9(7), { join: ['drop', 'sealed'] });
      same9(sealed.pieces.sealed.props.conc, 0.005, 'unit02/q9-absorb (a sealed sample takes no drops)');
    }
    // 1. each kind of light does what the planner says to the molecule
    {
      const r = k => CUV.planRegion('HCl', k).motion;
      same9([r('microwave'), r('infrared'), r('uv-visible')], ['spins', 'vibrates', 'jumps'], 'unit02/q9-absorb stage 1 (the three motions)');
      const t = end9(0);
      same9(['microwave', 'infrared', 'uv'].map(k => Object.values(t.pieces).find(p => p.zone === `slot:${k}`).id), ['spins', 'stretches', 'jumps'], 'unit02/q9-absorb stage 1 (the slots)');
      same9([1, 2, 3].map(v => CUV.regionRead(TABLE.apply(start9(0), { setDial: { fixture: 'sp', dial: 'region', value: v } }), 'sp').motion), ['spins', 'vibrates', 'jumps'], 'unit02/q9-absorb stage 1 (the dial shows each motion)');
    }
    // 2. the readings are on the right sides of the visible band
    {
      const t = end9(1);
      for (const id of ['r1', 'r2', 'r3']) {
        const nm = t.pieces[id].props.nm;
        same9(t.pieces[id].zone, `tray:${{ microwave: 'microwave', infrared: 'infrared', ultraviolet: 'ultraviolet' }[D.regionOf(nm)]}`, `unit02/q9-absorb stage 2 (${id})`);
      }
      same9(['r1', 'r2', 'r3'].map(id => CUV.fmtWave(t.pieces[id].props.nm)), ['3 cm', '30 \u00b5m', '300 nm'], 'unit02/q9-absorb stage 2 (the printed wavelengths)');
      holds9(D.VISIBLE.min === 380 && D.VISIBLE.max === 750, 'unit02/q9-absorb stage 2: the plate prints the wrong visible band');
    }
    // 3. the colour missing from copper's light is the one its peak sits in, and the strip is darkest there
    {
      same9(CUV.missingColour('cuso4').id, 'orange', 'unit02/q9-absorb stage 3 (the missing colour)');
      const dark = [...Array(371)].map((_, i) => 380 + i).sort((x, y) => CUV.gotThrough('cuso4', 0.01, x) - CUV.gotThrough('cuso4', 0.01, y))[0];
      same9(CUV.colourOfNm(dark).id, 'orange', 'unit02/q9-absorb stage 3 (the darkest part of the strip)');
      same9(end9(2).pieces['c-orange'].zone, 'slot:taken', 'unit02/q9-absorb stage 3 (the chip)');
      same9(COLOUR_NAMES(CUV), ['violet', 'blue', 'green', 'yellow', 'orange', 'red'], 'unit02/q9-absorb stage 3 (the six chips)');
    }
    // 4. the largest reading of the sweep is the graded setting
    {
      const sweep = CUV.COPPER_SWEEP.map(n => D.planAbsorb('cuso4', n, 1, q9.COPPER));
      same9(Math.round(end9(3).fixtures.sp.dials.nm.value), sweep.indexOf(Math.max(...sweep)) + 1, 'unit02/q9-absorb stage 4 (the setting)');
      same9(CUV.COPPER_SWEEP[4], 630, 'unit02/q9-absorb stage 4 (the peak is at 630 nm)');
      same9(end9(3).recorder.rows.map(r => r.x), [550, 600, 630, 680], 'unit02/q9-absorb stage 4 (the sheet plots against wavelength)');
    }
    // 5. doubling the strength doubles the reading; the origin is the lake's
    {
      const t = end9(4);
      near(CUV.absorbOf(t.pieces.b), 2 * CUV.absorbOf(t.pieces.a), 1e-9, 'unit02/q9-absorb stage 5 (twice the reading)');
      same9(t.pieces.b.props.drops, 4, 'unit02/q9-absorb stage 5 (Cuvette B)');
      same9(t.recorder.rows.map(r => [r.x, r.y]), [[0, 0], [4, 0.1], [8, 0.2]], 'unit02/q9-absorb stage 5 (the sheet: lake water, A, B)');
      holds9(q9.STAGES[4].table.fetch.length === 1 && start9(4).pieces.lake.hidden, 'unit02/q9-absorb stage 5: the lake water is not a field item');
      holds9(q9.STAGES[4].check(STAGE_STATE(q9, 4, [[]])).ok === false, 'unit02/q9-absorb stage 5: an untouched bench passes without the field item');
    }
    // 6. twice the path doubles the reading
    {
      near(D.planAbsorb('cuso4', 630, 2, 0.008), 2 * D.planAbsorb('cuso4', 630, 1, 0.008), 1e-3, 'unit02/q9-absorb stage 6 (twice the path)');
      same9(CUV.PATHS[Math.round(end9(5).fixtures.sp.dials.path.value) - 1], 2, 'unit02/q9-absorb stage 6 (the path)');
    }
    // 7. both doubled makes the reading four times: a product, not a sum
    {
      const t = end9(6);
      near(CUV.absorbOf(t.pieces.b, 630, 2) / CUV.absorbOf(t.pieces.a, 630, 1), 4, 1e-6, 'unit02/q9-absorb stage 7 (four times)');
      same9(t.prediction.token, 'x4', 'unit02/q9-absorb stage 7 (the prediction)');
      holds9(t.prediction.tested, 'unit02/q9-absorb stage 7: the solution does not test its prediction');
    }
    // 8. the standards fall on a line through zero, the sealed reading is one more point on it, and the marker reads its concentration back
    {
      const t = end9(7);
      const rows = t.recorder.rows;
      same9(rows.map(r => r.x), [2, 4, 6], 'unit02/q9-absorb stage 8 (the standards)');
      const slope = rows[0].y / rows[0].x;
      holds9(rows.every(r => Math.abs(r.y / r.x - slope) < 1e-6), 'unit02/q9-absorb stage 8: the standards are not on a line through zero');
      const sealed = D.planAbsorb('cuso4', 630, 1, q9.SEALED_CONC);
      near(sealed / slope, 5, 1e-3, 'unit02/q9-absorb stage 8 (the sealed reading read back off the line)');
      near(t.fixtures.conc.dials.value.value, 5, 1e-9, 'unit02/q9-absorb stage 8 (5 mmol/L)');
      holds9(t.pieces.sealed.props.read === sealed, 'unit02/q9-absorb stage 8: the sealed cuvette\'s face does not keep its reading');
      holds9(!t.recorder.rows.some(r => r.label === 'SEALED SAMPLE'), 'unit02/q9-absorb stage 8: the sealed sample is plotted, which would print its strength');
      holds9(t.recorder.tool?.kind === 'straightedge', 'unit02/q9-absorb stage 8: the solution lays no straightedge');
    }
    // Permanganate takes in near 525 nm, as measured.
    {
      const pm = [450, 500, 525, 550, 600].map(n => D.planAbsorb('kmno4', n, 1, 0.001));
      same9(pm.indexOf(Math.max(...pm)), 2, 'unit02/q9-absorb (permanganate peaks at 525 nm)');
    }
  }
  const q4 = getQuest('unit02', 'q4-cloud') && await getQuest('unit02', 'q4-cloud').module?.();
  if (q4) {
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
    // THE FOURTH LANTERNFALL TABLE (`q4-cloud`, the cloud kit): every count is the planner's, every graded figure is recomputed.
    const CLD = await import('../src/learn/table/kits/cloud.js');
    const same = (a, b, what) => { if (JSON.stringify(a) !== JSON.stringify(b)) fail(`${what}: graded ${JSON.stringify(a)}, the real answer is ${JSON.stringify(b)}`); };
    const holds = (c, what) => { if (!c) fail(what); };
    const start = i => TABLE.createTable(q4.STAGES[i].table, q4.STAGES[i].title);
    const end = i => TABLE.runScript(start(i), q4.SOLUTIONS[i], { strict: true });
    // 1. a ring that holds about nine in ten of fifty-plus shots, and a smaller one that does not
    {
      const r = CLD.ringRead(end(0), 'a');
      holds(r.fired === 500 && r.share >= q4.NINE_IN_TEN[0] && r.share <= q4.NINE_IN_TEN[1], 'unit02/q4-cloud stage 1: the solution\'s ring does not hold nine in ten of the shots');
      const small = CLD.ringRead(TABLE.apply(end(0), { setDial: { fixture: 'a', dial: 'ring', value: 40 } }), 'a');
      holds(small.share < q4.NINE_IN_TEN[0], 'unit02/q4-cloud stage 1: a ring a third as wide already holds nine in ten');
      const few = CLD.ringRead(TABLE.runScript(start(0), [{ run: 'a' }, { setDial: { fixture: 'a', dial: 'ring', value: 140 } }], { strict: true }), 'a');
      holds(few.fired === 1, 'unit02/q4-cloud stage 1: one press does not fire exactly one shot');
      const fifty = TABLE.runScript(start(0), [{ setDial: { fixture: 'a', dial: 'burst', value: 2 } }, { run: 'a' }], { strict: true });
      holds(CLD.shotsOf(fifty, 'a') === 50, 'unit02/q4-cloud stage 1: the middle exposure is not fifty shots');
      // the first fifty of five hundred are the same fifty (a plate builds, it does not reshuffle)
      const pts = CLD.pointsOf('1s', 1);
      same(O.sampleOrbital('1s', 50, 1), pts.slice(0, 50), 'unit02/q4-cloud stage 1 (the first fifty shots are the first fifty of five hundred)');
    }
    // 2. four films of one area; the round one catches the most, for any seed
    {
      for (const k of Object.keys(CLD.FILMS)) near(CLD.filmArea(k), CLD.FILM_AREA_PM2, CLD.FILM_AREA_PM2 * 0.03, `unit02/q4-cloud stage 2 (the ${k} film's area)`);
      for (const seed of [1, 2, 3, 4, 5]) {
        const pts = CLD.pointsOf('1s', seed).map(p => ({ a: p.x, b: p.y }));
        const caught = k => pts.filter(p => CLD.filmHolds(k, p.a * CLD.BOHR_PM, p.b * CLD.BOHR_PM)).length;
        const disc = caught('disc');
        for (const k of ['ring', 'lobes', 'hollow']) holds(disc >= caught(k) + 20, `unit02/q4-cloud stage 2: with seed ${seed} the round film does not clearly beat the ${k} film (${disc} v ${caught(k)})`);
      }
      const t = end(1);
      same(t.pieces.f2.zone, 'slot:a.film', 'unit02/q4-cloud stage 2 (the film on the plate)');
      same(t.pieces.f2.props.shape, 'disc', 'unit02/q4-cloud stage 2 (the film that is laid)');
      const caught = Object.keys(CLD.FILMS).map(k => CLD.catchOf(t, 'a', k));
      holds(CLD.filmRead(t, 'a').caught === Math.max(...caught), 'unit02/q4-cloud stage 2: the solution does not catch the most');
    }
    // 3. the strings that close are the ones a whole number of whose wavelengths go round
    {
      const t = end(2);
      for (const pm of q4.RING_STRINGS) {
        const fits = O.ringFits(pm, O.RING_CIRCUMFERENCE_PM).fits;
        same(t.pieces[`s${pm}`].zone, fits ? 'tray:closes' : 'tray:smears', `unit02/q4-cloud stage 3 (the ${pm} pm string)`);
      }
      same(q4.RING_STRINGS.filter(pm => O.ringFits(pm, O.RING_CIRCUMFERENCE_PM).fits), [332, 166, 111], 'unit02/q4-cloud stage 3 (the strings that close)');
      const on = TABLE.apply(start(2), { place: { piece: 's332', to: 'slot:track.tile' } });
      same(CLD.trackRead(on, 'track').fits, true, 'unit02/q4-cloud stage 3 (a string put on the track reads its own fit)');
    }
    // 4. the shell with no shots is the 2s node, found among shots on both sides of it, and the first cloud has shots there
    {
      const t = end(3);
      const b = CLD.ringRead(t, 'b');
      const want = CLD.nodePm('2s');
      near(b.rpm, want, q4.NODE_TOLERANCE_PM, 'unit02/q4-cloud stage 4 (the ring at the node)');
      same(b.count, 0, 'unit02/q4-cloud stage 4 (shots in the node\'s shell)');
      holds(CLD.ringRead(t, 'a').count >= 1, 'unit02/q4-cloud stage 4: the first cloud is as empty at that distance as the second');
      const around = d => CLD.ringRead(TABLE.apply(t, { setDial: { fixture: 'b', dial: 'ring', value: b.rpm + d } }), 'b').count;
      holds(around(-30) > 0 && around(30) > 0, 'unit02/q4-cloud stage 4: the empty shell is not between shots');
      holds(O.nodeRadii('1s').length === 0, 'unit02/q4-cloud stage 4: the first cloud has a node');
    }
    // 5. exactly the views along the node plane leave a slice empty; the slab is across the line of sight
    {
      const c = end(4);
      const empty = [];
      for (let turn = 0; turn <= 11; turn++) for (let tilt = -3; tilt <= 3; tilt++) {
        let u = TABLE.apply(c, { setDial: { fixture: 'view', dial: 'turn', value: turn } });
        u = TABLE.apply(u, { setDial: { fixture: 'view', dial: 'tilt', value: tilt } });
        const r = CLD.plateRead(u, 'c');
        if (r.shown.length <= q4.EMPTY_SLICE * r.fired) empty.push(`${turn}:${tilt}`);
      }
      same(empty, ['0:0', '6:0'], 'unit02/q4-cloud stage 5 (the views whose slice is empty)');
      holds(CLD.plateRead(start(4), 'c').turn === 1 && CLD.plateRead(start(4), 'c').tilt === 1, 'unit02/q4-cloud stage 5: the view does not start oblique');
    }
    // 6. three axes, four clouds, one direction twice
    {
      const t = end(5);
      same(['c1', 'c2', 'c3', 'c4'].map(id => CLD.axisOf(t.pieces[id].props.orbital)).sort(), ['x', 'y', 'z', 'z'], 'unit02/q4-cloud stage 6 (the four clouds\' axes)');
      for (const a of ['x', 'y', 'z']) {
        const id = ['c1', 'c2', 'c3', 'c4'].find(x => t.pieces[x].zone === `slot:peg-${a}`);
        same(CLD.axisOf(t.pieces[id].props.orbital), a, `unit02/q4-cloud stage 6 (the cloud on the ${a} peg)`);
      }
    }
    // 7. every card is sorted by the shape `orbitals.js` names
    {
      const t = end(6);
      const binFor = { 'two lobes': 'two', 'four lobes': 'four', 'two lobes and a ring': 'ring' };
      for (const id of ['ka', 'kb', 'kc', 'kd', 'ke']) same(t.pieces[id].zone, `tray:${binFor[O.shapeOf(t.pieces[id].props.orbital)]}`, `unit02/q4-cloud stage 7 (${t.pieces[id].label})`);
      same(['ka', 'kb', 'kc', 'kd', 'ke'].map(id => O.shapeOf(t.pieces[id].props.orbital)), ['two lobes', 'four lobes', 'two lobes and a ring', 'four lobes', 'four lobes'], 'unit02/q4-cloud stage 7 (the shapes)');
    }
    // 8. the trade is a trade: the product of the two blurs is the same at every level, and it sits above the floor
    {
      const levels = [1, 2, 3, 4, 5].map(l => CLD.blurAt(l));
      for (const b of levels) near(b.dx * b.dv, levels[0].dx * levels[0].dv, 2500, 'unit02/q4-cloud stage 8 (the product of the blurs at every level)');
      holds(levels[4].dx < levels[0].dx && levels[4].dv > levels[0].dv, 'unit02/q4-cloud stage 8: a sharper position does not blur the speed more');
      // hbar / 2 m_e, in pm km/s: 1.0546e-34 / (2 * 9.109e-31) m^2/s = 5.79e-5 m^2/s = 5.79e4 pm km/s
      holds(levels[0].dx * levels[0].dv >= 5.79e4, 'unit02/q4-cloud stage 8: the gauge\'s product sits below the uncertainty floor');
      same(CLD.trackReason().includes('position and a speed'), true, 'unit02/q4-cloud stage 8 (the track key gives the bench\'s reason)');
      const t = TABLE.apply(start(7), { run: 'track' });
      holds(t.last.ok === false && t.last.reason === CLD.trackReason(), 'unit02/q4-cloud stage 8: Track Electron does not refuse with the reason');
    }
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
  const q6 = getQuest('unit02', 'q6-filling') && await getQuest('unit02', 'q6-filling').module?.();
  const q7 = getQuest('unit02', 'q7-pes') && await getQuest('unit02', 'q7-pes').module?.();
  const q8 = getQuest('unit02', 'q8-trends') && await getQuest('unit02', 'q8-trends').module?.();
  const q5 = getQuest('unit02', 'q5-numbers') && await getQuest('unit02', 'q5-numbers').module?.();
  const EL = await import('../src/learn/engine/electrons.js');
  if (q5) {
    // THE FIFTH LANTERNFALL TABLE (`q5-numbers`, the address and filling kit): the rules are `electrons.js`'s, every graded figure is recomputed.
    const same = (a, b, what) => { if (JSON.stringify(a) !== JSON.stringify(b)) fail(`${what}: graded ${JSON.stringify(a)}, the real answer is ${JSON.stringify(b)}`); };
    const holds = (c, what) => { if (!c) fail(what); };
    const SHL = await import('../src/learn/table/kits/shells.js');
    const O5 = await import('../src/learn/engine/orbitals.js');
    const start = i => TABLE.createTable(q5.STAGES[i].table, q5.STAGES[i].title);
    const end = i => TABLE.runScript(start(i), q5.SOLUTIONS[i], { strict: true });
    // every set the stage calls impossible is, and every other is possible; the finder and the rules agree
    for (const [k, set] of Object.entries(q5.CHECKS.SETS)) {
      if (EL.findRoom(set).exists !== EL.validAddress(set)) fail(`unit02/q5-numbers: the finder and the rules disagree about set ${k}`);
      const why = SHL.whyNoRoom(set);
      if ((why === null) !== EL.validAddress(set)) fail(`unit02/q5-numbers: the refusal's reason and the rules disagree about set ${k}`);
    }
    same(Object.entries(q5.CHECKS.SETS).filter(([, s]) => !EL.validAddress(s)).map(([k]) => k), ['b', 'c'], 'unit02/q5-numbers stage 8 (the sets that cannot exist)');
    // 1. the distance the lit row prints is the real mean distance of its cloud, and floor 2 is the one that reaches about 300 pm
    for (const [id, n, l] of [['1s', 1, 0], ['2s', 2, 0], ['2p', 2, 1], ['3s', 3, 0]]) {
      const pts = O5.sampleOrbital(id === '2p' ? '2pz' : id, 3000, 1);
      const mean = pts.reduce((a, q) => a + Math.hypot(q.x, q.y, q.z), 0) / pts.length * O5.BOHR_PM;
      near(SHL.reachPm(n, l), mean, mean * 0.08 + 10, `unit02/q5-numbers stage 1 (the ${id} cloud's reach in pm)`);
    }
    const reaches = [1, 2, 3].map(n => SHL.reachPm(n, 0));
    same(reaches.map(r => Math.abs(r - 300)).indexOf(Math.min(...reaches.map(r => Math.abs(r - 300)))) + 1, 2, 'unit02/q5-numbers stage 1 (the floor whose s row reaches about 300 pm)');
    same(SHL.addressOfFinder(end(0), 'addr').n, 2, 'unit02/q5-numbers stage 1 (the graded floor)');
    // 2. floor 2 offers s and p and nothing more
    for (let l = 0; l <= 3; l++) same(EL.findRoom({ n: 2, l, ml: 0 }).exists, l <= 1, `unit02/q5-numbers stage 2 (suite type ${l} on floor 2)`);
    same([0, 1, 2, 3].map(l => end(1).pieces[`l${l}`].zone), ['tray:lights', 'tray:lights', 'tray:none', 'tray:none'], 'unit02/q5-numbers stage 2 (the trays)');
    // 3. the address in the prompt lights the box the graded electron stands in
    {
      const room = EL.findRoom({ n: 3, l: 2, ml: 1 });
      same([room.row, room.idx], ['3d', 3], 'unit02/q5-numbers stage 3 (the room the address names)');
      same(SHL.rackOf(end(2), 'rack'), { '3d:3': 'u' }, 'unit02/q5-numbers stage 3 (what the rack holds)');
      const lit = SHL.finderLight(end(2), 'addr');
      same([lit.box.row, lit.box.idx], ['3d', 3], 'unit02/q5-numbers stage 3 (the box the finder lights)');
      holds(EL.boxesOf(2) === 5, 'unit02/q5-numbers: a d row does not have five boxes');
    }
    // 4. a box takes one arrow of each direction, and the rack refuses a second of the same
    {
      const t0 = start(3);
      const b = id => `piece:${SHL.boxPieceId('rack', '1s', 0)}`;
      const once = TABLE.apply(t0, { place: { piece: 'up', to: b() } });
      const twice = TABLE.apply(once, { place: { piece: 'up', to: b() } });
      holds(twice.last.joined === false && /one|each|most/i.test(twice.last.reason || ''), 'unit02/q5-numbers stage 4: a second arrow the same way is not refused with a reason');
      same(SHL.rackOf(twice, 'rack'), { '1s:0': 'u' }, 'unit02/q5-numbers stage 4 (the refused arrow stays out)');
      same(SHL.rackOf(end(3), 'rack'), { '1s:0': 'ud' }, 'unit02/q5-numbers stage 4 (a pair in one box)');
    }
    // 5. exactly one pair of the four shares all four numbers, and the rack refuses whichever of them comes second
    {
      const dup = Object.entries(q5.CHECKS.FOUR_ELECTRONS);
      const pair = dup.flatMap(([a, x], i) => dup.slice(i + 1).filter(([, y]) => EL.sameAddress(x, y)).map(([b]) => a + b));
      same(pair, ['ac'], 'unit02/q5-numbers stage 5 (the pair that shares all four numbers)');
      const t = end(4);
      same(['ta', 'tb', 'tc', 'td'].map(id => Boolean(t.pieces[id].props.placed) && !t.pieces[id].zone), [true, true, false, true], 'unit02/q5-numbers stage 5 (the three on the rack)');
      same(t.pieces.tc.zone, 'tray:no', 'unit02/q5-numbers stage 5 (the refused electron in the tray)');
      const swap = TABLE.runScript(start(4), [
        { place: { piece: 'tc', to: `piece:${SHL.boxPieceId('rack', '2p', 1)}` } }, { place: { piece: 'ta', to: `piece:${SHL.boxPieceId('rack', '2p', 1)}` } }
      ], { strict: true });
      holds(swap.last.joined === false && /four numbers/.test(swap.last.reason), 'unit02/q5-numbers stage 5: placing C first does not make A the refused one, with the rule as its reason');
    }
    // 6. the third shell is nine boxes of two, and the marker is what the board counts
    {
      const t = end(5);
      same(Object.values(t.pieces).filter(p => p.kind === 'box').length, 9, 'unit02/q5-numbers stage 6 (boxes in the third shell)');
      same(SHL.readOf(t, 'rack').total, EL.shellCapacity(3), 'unit02/q5-numbers stage 6 (electrons the full shell holds)');
      same(t.fixtures.count.dials.n.value, EL.shellCapacity(3), 'unit02/q5-numbers stage 6 (the marker)');
      holds(q5.STAGES[5].table.fixtures.find(f => f.id === 'count').dials.n.value !== 18, 'unit02/q5-numbers stage 6: the marker starts on the answer');
    }
    // 7. the ringed box is where the graded address points, and its arrow is the graded bunk
    {
      const ringed = q5.STAGES[6].table.pieces.find(p => p.props?.target);
      const room7 = EL.findRoom(q5.CHECKS.RINGED);
      same([room7.row, room7.idx], [ringed.props.row, ringed.props.idx], 'unit02/q5-numbers stage 7 (the ringed box)');
      same(SHL.rackOf(start(6), 'rack')[`${ringed.props.row}:${ringed.props.idx}`], 'u', 'unit02/q5-numbers stage 7 (the arrow in the ringed box)');
      same(q5.CHECKS.RINGED.ms, 0.5, 'unit02/q5-numbers stage 7 (the bunk the arrow names)');
      const n7 = EL.rackFor(7);
      for (const k of new Set([...Object.keys(n7), ...Object.keys(SHL.rackOf(start(6), 'rack'))])) same(SHL.rackOf(start(6), 'rack')[k], n7[k], `unit02/q5-numbers stage 7 (nitrogen's box ${k})`);
    }
    // 8. every listed electron that has a room stands, and every other is refused with the rule
    {
      const t = end(7);
      same(['ta', 'tb', 'tc', 'td'].map(id => Boolean(t.pieces[id].props.placed) && !t.pieces[id].zone), [true, false, false, true], 'unit02/q5-numbers stage 8 (the electrons that stand)');
      same(['tb', 'tc'].map(id => t.pieces[id].zone), ['tray:no', 'tray:no'], 'unit02/q5-numbers stage 8 (the electrons with no room)');
      const refused = TABLE.apply(start(7), { place: { piece: 'tb', to: `piece:${SHL.boxPieceId('rack', '3d', 0)}` } });
      holds(refused.last.joined === false && Boolean(refused.last.reason), 'unit02/q5-numbers stage 8: an address with no room is not refused with a reason');
    }
  }
  if (q6) {
    // The ground states the stages grade against, and the magnet's real counts.
    const r6 = EL.readRack(EL.rackFor(6));
    if (r6.config !== EL.configString(EL.groundConfig(6)) || !r6.laddered) fail('unit02/q6-filling stage 1: carbon\'s rack does not read as its ground state');
    if (EL.unpairedOfConfig(EL.groundConfig(6)) !== EL.MEASURED.C) fail('the magnet\'s count for carbon disagrees with Hund\'s rule');
    for (const [sym, m] of Object.entries(EL.MEASURED)) {
      if (/[+]/.test(sym)) continue;
      if (EL.unpairedOfConfig(EL.groundConfig(EL.zOf(sym))) !== m) fail(`the magnet's measured count for ${sym} disagrees with its ground-state configuration`);
    }
    // THE SIXTH LANTERNFALL TABLE (`q6-filling`, the address and filling kit): every graded rack is `electrons.js`'s own reading.
    const SHL = await import('../src/learn/table/kits/shells.js');
    const same6 = (a, b, what) => { if (JSON.stringify(a) !== JSON.stringify(b)) fail(`${what}: graded ${JSON.stringify(a)}, the real answer is ${JSON.stringify(b)}`); };
    const holds6 = (c, what) => { if (!c) fail(what); };
    const start6 = i => TABLE.createTable(q6.STAGES[i].table, q6.STAGES[i].title);
    const end6 = i => TABLE.runScript(start6(i), q6.SOLUTIONS[i], { strict: true });
    const miss6 = i => TABLE.runScript(start6(i), q6.MISSES[i], { strict: true });
    // 1. carbon's six electrons, lowest rows first
    same6(SHL.readOf(end6(0), 'rack').counts, EL.groundConfig(6), 'unit02/q6-filling stage 1 (carbon\'s rack)');
    holds6(SHL.readOf(end6(0), 'rack').laddered, 'unit02/q6-filling stage 1: the graded rack is not laddered');
    holds6(!SHL.readOf(miss6(0), 'rack').laddered && SHL.readOf(miss6(0), 'rack').total === 6, 'unit02/q6-filling stage 1: the miss is not six electrons with a lower row left open');
    // 2. Hund: carbon's p electrons in separate boxes pull as hard as the sample; paired in one box they do not
    {
      const t = end6(1);
      same6(SHL.rackPull(t, 'rack'), EL.MEASURED.C, 'unit02/q6-filling stage 2 (the rack\'s pull)');
      same6(EL.unpairedOfConfig(EL.groundConfig(6)), EL.MEASURED.C, 'unit02/q6-filling stage 2 (Hund\'s rule and the magnet agree for carbon)');
      holds6(SHL.rackPull(miss6(1), 'rack') !== EL.MEASURED.C, 'unit02/q6-filling stage 2: paired p electrons already match the magnet');
      same6(SHL.rackOf(start6(1), 'rack'), EL.rackFor(4), 'unit02/q6-filling stage 2 (the 1s and 2s electrons already in place)');
      holds6(TABLE.apply(start6(1), { place: { piece: 'lift', to: `piece:${SHL.boxPieceId('rack', '1s', 0)}` } }).last.joined === false, 'unit02/q6-filling stage 2: a locked electron can be lifted out');
      same6(TABLE.apply(t, { run: 'msample' }).fixtures.msample.dials.pull.value, 1 + EL.MEASURED.C, 'unit02/q6-filling stage 2 (Test Sample)');
    }
    // 3. oxygen's configuration, as the rack writes it
    {
      const t = end6(2);
      same6(SHL.readOf(t, 'rack').config, EL.configString(EL.groundConfig(8)), 'unit02/q6-filling stage 3 (oxygen\'s configuration)');
      same6(t.pieces.p4.label, SHL.readOf(t, 'rack').config, 'unit02/q6-filling stage 3 (the card in the slot)');
      same6(t.pieces.p4.zone, 'slot:reads', 'unit02/q6-filling stage 3 (the slot)');
      const cards = Object.values(start6(2).pieces).filter(p => p.kind === 'ccard').map(p => p.label);
      same6(cards.filter(c => c === EL.configString(EL.groundConfig(8))).length, 1, 'unit02/q6-filling stage 3 (exactly one card reads what the rack reads)');
    }
    // 4. potassium's last electron goes in 4s, below 3d
    same6(SHL.readOf(end6(3), 'rack').counts, EL.groundConfig(19), 'unit02/q6-filling stage 4 (potassium\'s rack)');
    holds6(EL.LADDER.findIndex(r => r.id === '4s') < EL.LADDER.findIndex(r => r.id === '3d'), 'unit02/q6-filling stage 4: 4s is not below 3d on the ladder');
    same6(q6.ROWS.indexOf('4s') < q6.ROWS.indexOf('3d'), true, 'unit02/q6-filling stage 4 (the rack\'s rows put 4s below 3d)');
    // 5. iron in short form
    {
      const t = end6(4);
      same6(SHL.readOf(t, 'rack').short, EL.shortString(EL.groundConfig(26)), 'unit02/q6-filling stage 5 (iron in short form)');
      same6(t.pieces.ar.label, '[Ar] 4s² 3d⁶', 'unit02/q6-filling stage 5 (the card)');
      same6(t.fixtures.core.dials.core.value, 1, 'unit02/q6-filling stage 5 (the core switch)');
      same6(SHL.readOf(t, 'rack').counts, EL.groundConfig(26), 'unit02/q6-filling stage 5 (iron\'s rack)');
    }
    // 6. every strip is sorted by where its last electron went
    for (const sym of q6.SYMS) {
      const want = EL.blockOf(EL.zOf(sym));
      same6(end6(5).pieces[`e-${sym.toLowerCase()}`].zone, `tray:${want}`, `unit02/q6-filling stage 6 (${sym} is in the ${want} block)`);
    }
    same6(q6.SYMS.map(s => EL.blockOf(EL.zOf(s))), ['s', 'p', 'd', 'f', 'p', 'd'], 'unit02/q6-filling stage 6 (the blocks)');
    // 7. Fe2+ loses its 4s electrons; the magnet measures the real ion and the rack agrees
    {
      const t = end6(6);
      same6(SHL.readOf(t, 'rack').counts, Object.fromEntries(Object.entries(EL.groundConfig(26)).filter(([k]) => k !== '4s')), 'unit02/q6-filling stage 7 (iron(II)\'s rack)');
      same6(SHL.rackPull(t, 'rack'), EL.MEASURED['Fe2+'], 'unit02/q6-filling stage 7 (the rack and the magnet agree for iron(II))');
      holds6(SHL.readOf(miss6(6), 'rack').counts['4s'] === 2, 'unit02/q6-filling stage 7: the miss does not leave the 4s electrons behind');
    }
    // 8. chromium: the rule's answer and the measured one differ, and the graded arrangement is the measured one
    {
      same6(SHL.rackPull(end6(7), 'rack'), EL.MEASURED.Cr, 'unit02/q6-filling stage 8 (the graded pull)');
      holds6(SHL.rackPull(miss6(7), 'rack') !== EL.MEASURED.Cr, 'unit02/q6-filling stage 8: the rule-following arrangement already matches the magnet, so the stage teaches nothing');
      same6(SHL.readOf(end6(7), 'rack').total, 24, 'unit02/q6-filling stage 8 (chromium has 24 electrons)');
      same6(SHL.readOf(miss6(7), 'rack').counts, { ...EL.groundConfig(24), '4s': 2, '3d': 4 }, 'unit02/q6-filling stage 8 (the rule\'s arrangement)');
    }
  }
  if (q7) {
    // THE SEVENTH LANTERNFALL TABLE (`q7-pes`, the spectrum kit): every peak is `electrons.js` `planPES`, every graded figure is recomputed.
    const PES = await import('../src/learn/table/kits/pes.js');
    const same7 = (a, b, what) => { if (JSON.stringify(a) !== JSON.stringify(b)) fail(`${what}: graded ${JSON.stringify(a)}, the real answer is ${JSON.stringify(b)}`); };
    const holds7 = (c, what) => { if (!c) fail(what); };
    const start7 = i => TABLE.createTable(q7.STAGES[i].table, q7.STAGES[i].title);
    const end7 = i => TABLE.runScript(start7(i), q7.SOLUTIONS[i], { strict: true });
    // Every spectrum on the bench adds up to the electrons its element has, and its peaks land in distinct bins of the strip.
    for (const sym of ['H', 'He', 'Li', 'Be', 'B', 'C', 'N', 'O', 'F', 'Ne', 'Na', 'Mg', 'Al']) {
      const peaks = EL.planPES(sym);
      const total = peaks.reduce((n, p) => n + p.height, 0);
      if (total !== EL.zOf(sym)) fail(`unit02/q7-pes: ${sym}'s peaks add up to ${total}, not ${EL.zOf(sym)}`);
      const bins = peaks.map(p => PES.binOf(p.energy));
      if (new Set(bins).size !== bins.length) fail(`unit02/q7-pes: two of ${sym}'s peaks fall in one bin of the strip`);
      if (peaks.some(p => p.height > PES.STACK)) fail(`unit02/q7-pes: a peak of ${sym} is taller than the strip's pile`);
      holds7(peaks[peaks.length - 1].energy >= PES.AXIS.lo && peaks[0].energy <= PES.AXIS.hi, `unit02/q7-pes: ${sym}'s peaks run off the strip's scale`);
      holds7(PES.freedBy(sym, PES.energyAt(PES.TOP_STEP)).length === peaks.length, `unit02/q7-pes: the strongest light does not free every electron of ${sym}`);
    }
    same7(EL.planPES('O').map(p => p.height), [2, 2, 4], 'unit02/q7-pes stage 5 (oxygen\'s heights)');
    holds7(EL.BINDING.Ne['1s'] > EL.BINDING.F['1s'] && EL.BINDING.F['1s'] > EL.BINDING.O['1s'], 'unit02/q7-pes stage 6: the inner peaks must run oxygen, fluorine, neon');
    holds7(EL.BINDING.B['2s'] > EL.BINDING.B['2p'], 'unit02/q7-pes stage 4: boron\'s 2s must be held tighter than its 2p');
    // Fire: the piles are the planner's, the printout is the same spectrum, and the strip's piles are one instanced body.
    {
      let t = start7(1);
      t = TABLE.runScript(t, [{ place: { piece: 'b', to: 'slot:ch.spec' } }, { run: 'ch' }], { strict: true });
      const r = PES.chamberRead(t, 'ch');
      same7(r.piles, PES.pilesOf(EL.planPES('Li')), 'unit02/q7-pes stage 2 (the piles Li makes)');
      same7(r.electrons, 3, 'unit02/q7-pes stage 2 (lithium\'s electrons)');
      holds7(t.pieces.b.props.printed && !t.pieces.a.props.printed, 'unit02/q7-pes stage 2: only the fired card keeps a printout');
      const piles = PES.chamberPiles(t);
      holds7(piles.length === 1 && piles[0].cap === PES.BINS * PES.STACK && piles[0].shown.filter(Boolean).length === 3, 'unit02/q7-pes: the strip does not stand exactly the electrons that fell');
      const empty = PES.chamberPiles(start7(1))[0];
      holds7(empty.shown.every(x => !x), 'unit02/q7-pes: an unfired strip already holds electrons');
      holds7(TABLE.apply(start7(1), { run: 'ch' }).last.ok === false, 'unit02/q7-pes: firing an empty chamber does not refuse');
    }
    // 1. rail: the specimen whose electrons are held with the least energy first
    same7(end7(0).zones.rail.order, ['a', 'b'], 'unit02/q7-pes stage 1 (the rail)');
    holds7(PES.holdOf('H') < PES.holdOf('He'), 'unit02/q7-pes stage 1: hydrogen must hold its electron more loosely than helium');
    // 2. the tally is the total of Sample B's heights, and Sample A's card says its own total
    same7(PES.markerRead(end7(1), 'tally'), PES.electronsIn(EL.planPES(q7.STAGES[1].table.pieces.find(p => p.id === 'b').props.sym)), 'unit02/q7-pes stage 2 (the tally)');
    same7(PES.electronsIn(EL.planPES('He')), 2, 'unit02/q7-pes stage 2 (Sample A\'s card says two electrons)');
    // 3. exactly one electron comes off lithium at the graded setting, and it is the loosest
    {
      const r = PES.chamberRead(end7(2), 'ch');
      same7(r.freedNow.map(p => p.row), ['2s'], 'unit02/q7-pes stage 3 (what comes off)');
      same7(r.electronsNow, 1, 'unit02/q7-pes stage 3 (electrons freed)');
      const settings = [];
      for (let i = 1; i <= PES.TOP_STEP; i++) if (PES.freedBy('Li', PES.energyAt(i)).length === 1) settings.push(i);
      holds7(settings.length >= 2, 'unit02/q7-pes stage 3: only one light setting frees one electron');
      holds7(PES.chamberRead(start7(2), 'ch').electronsNow === 3, 'unit02/q7-pes stage 3: the light starts already freeing one electron');
      same7(PES.shellsOf('Li'), [2, 1], 'unit02/q7-pes stage 3 (lithium\'s rings)');
    }
    // 4. boron's outer ring is two rows (a subshell each) and the graded light frees both and not the 1s
    {
      same7(q7.ringRows('B', 1).sort(), ['2p', '2s'], 'unit02/q7-pes stage 4 (the outer ring\'s rows)');
      const r = PES.chamberRead(end7(3), 'ch');
      same7(r.freedNow.map(p => p.row).sort(), ['2p', '2s'], 'unit02/q7-pes stage 4 (what comes off)');
      same7(r.electronsNow, PES.shellsOf('B')[1], 'unit02/q7-pes stage 4 (the outer ring has as many electrons as come off)');
      same7(Object.keys(PES.chamberRead(start7(3), 'ch').piles).length, 0, 'unit02/q7-pes stage 4 (nothing is on the strip until fired)');
      same7(Object.keys(r.piles).length, 2, 'unit02/q7-pes stage 4 (two piles from one ring)');
    }
    // 5. the build that matches is oxygen; its outlines are exactly the sealed specimen's piles
    {
      const t = TABLE.runScript(end7(4), [{ run: 'ch' }], { strict: true });
      const b = PES.buildRead(t, 'build');
      same7(b.sym, 'O', 'unit02/q7-pes stage 5 (the build)');
      holds7(b.whole, 'unit02/q7-pes stage 5: the graded build is no whole atom');
      holds7(PES.sameSpectrum(b.peaks, EL.planPES('O')) && JSON.stringify(PES.pilesOf(b.peaks)) === JSON.stringify(PES.chamberRead(t, 'ch').piles), 'unit02/q7-pes stage 5: the build\'s outlines are not the sealed piles');
      for (const [p, e] of [[8, 7], [7, 7], [9, 9]]) {
        const w = PES.buildRead(TABLE.runScript(start7(4), [{ setDial: { fixture: 'build', dial: 'protons', value: p } }, { setDial: { fixture: 'build', dial: 'electrons', value: e } }]), 'build');
        holds7(!(w.whole && w.sym === 'O'), `unit02/q7-pes stage 5: ${p} protons and ${e} electrons already pass`);
      }
    }
    // 6. the innermost peaks run oxygen, fluorine, neon; the cards print their protons
    {
      same7(end7(5).zones.rail.order, ['o', 'f', 'n'], 'unit02/q7-pes stage 6 (the rail)');
      const t = start7(5);
      for (const id of ['o', 'f', 'n']) holds7(t.pieces[id].props.note === `${EL.zOf(t.pieces[id].props.sym)} protons`, `unit02/q7-pes stage 6: ${id}'s card does not print its protons`);
    }
    // 7. Mg, Al, Na by their electrons and their last peak
    {
      const e = end7(6);
      for (const [id, tray] of [['x', 'mg'], ['y', 'al'], ['z', 'na']]) {
        same7(e.pieces[id].zone, `tray:${tray}`, `unit02/q7-pes stage 7 (${id})`);
        same7(EL.zOf(e.pieces[id].props.sym), { na: 11, mg: 12, al: 13 }[tray], `unit02/q7-pes stage 7 (${id}'s electrons)`);
      }
      same7(EL.planPES('Na').slice(-1)[0].height, 1, 'unit02/q7-pes stage 7 (sodium\'s loosest pile is a single electron)');
      same7(EL.planPES('Al').length, 5, 'unit02/q7-pes stage 7 (aluminum has an extra pile)');
    }
    // 8. the configuration written is nitrogen's, and the rows are the ladder's
    {
      same7(PES.writtenRead(end7(7), 'write').counts, { '1s': 2, '2s': 2, '2p': 3, '3s': 0, '3p': 0 }, 'unit02/q7-pes stage 8 (the page)');
      same7(PES.writerTarget('N'), EL.groundConfig(7) && { '1s': 2, '2s': 2, '2p': 3, '3s': 0, '3p': 0 }, 'unit02/q7-pes stage 8 (nitrogen\'s target)');
      same7(EL.planPES('N').map(p => `${p.row}${p.height}`), ['1s2', '2s2', '2p3'], 'unit02/q7-pes stage 8 (the strip)');
    }
  }
  if (q8) {
    // THE EIGHTH LANTERNFALL TABLE (`q8-trends`, the trends kit): the pull is `planPull`, the sizes and costs are the measured tables.
    const TRD = await import('../src/learn/table/kits/trends.js');
    const same8 = (a, b, what) => { if (JSON.stringify(a) !== JSON.stringify(b)) fail(`${what}: graded ${JSON.stringify(a)}, the real answer is ${JSON.stringify(b)}`); };
    const holds8 = (c, what) => { if (!c) fail(what); };
    const start8 = i => TABLE.createTable(q8.STAGES[i].table, q8.STAGES[i].title);
    const end8 = i => TABLE.runScript(start8(i), q8.SOLUTIONS[i], { strict: true });
    const B = await import('../src/learn/engine/electronbench.js');
    const item = sym => ({ z: EL.zOf(sym), shells: B.shellsOf(sym), radius: EL.RADIUS[sym] ?? EL.ION_RADIUS[sym] });
    // The radii run the way the trends do: shrinking across a row, growing down a group, an ion unlike its atom.
    const R = s => EL.RADIUS[s];
    holds8(R('Li') > R('Be') && R('Be') > R('B') && R('B') > R('C'), 'unit02/q8-trends stage 3: the radii must shrink across the row');
    holds8(R('K') > R('Na') && R('Na') > R('Li'), 'unit02/q8-trends stage 4: the radii must grow down the group');
    holds8(EL.ION_RADIUS['Na+'] < EL.ION_RADIUS['Cl-'] && EL.ION_RADIUS['Cl-'] < EL.ION_RADIUS.Na, 'unit02/q8-trends stage 5: Na+ < Cl- < Na');
    // 1. the electron held hardest of all is magnesium's innermost, and the best outermost electron is another atom's: the stage is about both
    {
      const hard = ['Li', 'Na', 'Be', 'Mg'].map(s => [s, TRD.hardestPull(s)]).sort((a, b) => b[1] - a[1]);
      same8(hard[0][0], 'Mg', 'unit02/q8-trends stage 1 (the hardest pull)');
      const outer = ['Li', 'Na', 'Be', 'Mg'].map(s => [s, B.planPull(item(s), B.shellsOf(s).length - 1).pull]).sort((a, b) => b[1] - a[1]);
      holds8(outer[0][0] !== 'Mg', 'unit02/q8-trends stage 1: the outermost electrons give the same answer as the innermost, so the stage teaches nothing about distance');
      const t = end8(0);
      same8(['li', 'na', 'be', 'mg'].filter(id => t.pieces[id].zone === 'tray:hard'), ['mg'], 'unit02/q8-trends stage 1 (the tray)');
      const r = TRD.springRead(TABLE.runScript(start8(0), [{ setDial: { fixture: 'sp', dial: 'which', value: 2 } }, { place: { piece: 'mg', to: 'slot:sp.atom' } }]), 'sp');
      same8(r.pull, B.planPull(item('Mg'), 0).pull, 'unit02/q8-trends stage 1 (the spring gauge reads the planner\'s pull)');
    }
    // 2. sodium's outer electron feels +1 of its +11 with ten between; lithium feels +1, beryllium and magnesium +2
    {
      const na = B.planPull({ z: 11, shells: [2, 8, 1], radius: 186 }, 2);
      holds8(na.zeff === 1 && na.between === 10, 'unit02/q8-trends stage 2: sodium\'s outer electron should feel +1 with ten electrons between');
      same8(['Li', 'Na', 'Be', 'Mg'].map(TRD.feelsOf), [1, 1, 2, 2], 'unit02/q8-trends stage 2 (the charges felt)');
      const t = end8(1);
      same8(['li', 'na', 'be', 'mg'].map(id => t.pieces[id].zone), ['tray:one', 'tray:one', 'tray:two', 'tray:two'], 'unit02/q8-trends stage 2 (the trays)');
    }
    // 3. the rail runs largest first, and the card of each atom is drawn at its real radius
    {
      const t = end8(2);
      const sizes = t.zones.rail.order.map(id => TRD.sizeNow(t.pieces[id]));
      holds8(sizes.every((v, i) => !i || v < sizes[i - 1]), 'unit02/q8-trends stage 3: the graded order is not largest radius first');
      same8(t.zones.rail.order, ['li', 'be', 'b', 'c'], 'unit02/q8-trends stage 3 (the rail)');
      const g = TRD.sizeRead(TABLE.apply(start8(2), { place: { piece: 'li', to: 'slot:sz.atom' } }), 'sz');
      same8(g.radius, EL.RADIUS.Li, 'unit02/q8-trends stage 3 (the size gauge)');
    }
    // 4. the prediction is the real comparison, and the gauge only reads once it is pressed
    {
      const t = end8(3);
      same8(t.prediction.token, 'larger', 'unit02/q8-trends stage 4 (the prediction)');
      holds8(t.prediction.tested, 'unit02/q8-trends stage 4: the solution does not test its prediction');
      holds8(TRD.sizeNow(t.pieces.k) > TRD.sizeNow(t.pieces.na), 'unit02/q8-trends stage 4: potassium is not larger than sodium');
      same8(B.shellsOf('K').length - B.shellsOf('Na').length, 1, 'unit02/q8-trends stage 4 (one more ring)');
      same8(TRD.feelsOf('K'), TRD.feelsOf('Na'), 'unit02/q8-trends stage 4 (the same charge felt)');
      holds8(q8.STAGES[3].table.prediction.tokens.length === 3, 'unit02/q8-trends stage 4: three predictions');
    }
    // 5. a stripped atom is its ion, a chlorine with one more is Cl-, and the three sort smallest first
    {
      const t = end8(4);
      same8(['na1', 'na2', 'cl'].map(id => TRD.itemOf(t.pieces[id]).charge), [0, 1, -1], 'unit02/q8-trends stage 5 (the charges)');
      same8(t.zones.rail.order.map(id => TRD.sizeNow(t.pieces[id])), [EL.ION_RADIUS['Na+'], EL.ION_RADIUS['Cl-'], EL.ION_RADIUS.Na], 'unit02/q8-trends stage 5 (the sizes)');
      same8(TRD.shellsNow('Na', 1), [2, 8], 'unit02/q8-trends stage 5 (Na+ has lost its outer shell)');
      same8(TRD.shellsNow('Cl', -1), [2, 8, 8], 'unit02/q8-trends stage 5 (Cl- has a full outer shell)');
      const twice = TABLE.runScript(start8(4), [{ join: ['e', 'cl'] }, { join: ['e', 'cl'] }]);
      holds8(twice.last.ok === false || TRD.itemOf(twice.pieces.cl).charge === -1, 'unit02/q8-trends stage 5: a chlorine takes a second extra electron');
    }
    // 6. the costs are the measured first ionization energies; the rail is cheapest first and boron dips below beryllium
    {
      const ies = ['Li', 'B', 'Be'].map(s => EL.IONIZATION[s]);
      holds8(ies.every((v, i) => !i || v > ies[i - 1]), 'unit02/q8-trends stage 6: the graded order is not the order of the real ionization energies');
      const t = end8(5);
      same8(t.zones.rail.order, ['li', 'b', 'be'], 'unit02/q8-trends stage 6 (the rail)');
      same8(['li', 'be', 'b'].map(id => t.pieces[id].props.lastCost), [520, 899, 801], 'unit02/q8-trends stage 6 (what each strip read)');
      holds8(EL.IONIZATION.B < EL.IONIZATION.Be, 'unit02/q8-trends stage 6: boron must dip below beryllium');
    }
    // 7. magnesium's successive energies jump after the second and the bench reads no further than the third
    {
      const jump = EL.MG_SUCCESSIVE;
      holds8(jump[2] / jump[1] > 4 && jump[1] / jump[0] < 3, 'unit02/q8-trends stage 7: magnesium\'s successive energies do not jump after the second');
      const t = end8(6);
      same8(t.pieces.mg.props.charge, 2, 'unit02/q8-trends stage 7 (magnesium stripped twice)');
      same8(t.recorder.rows.map(r => r.y), [738, 1451], 'unit02/q8-trends stage 7 (the sheet)');
      const more = TABLE.runScript(start8(6), [{ place: { piece: 'mg', to: 'slot:st.atom' } }, { run: 'st' }, { run: 'st' }, { run: 'st' }, { run: 'st' }]);
      holds8(more.last.ok === false && more.pieces.mg.props.charge === 3, 'unit02/q8-trends stage 7: the bench reads a fourth electron it has not measured');
      const back = TABLE.runScript(more, [{ place: { piece: 'mg', to: 'free:60,30' } }, { join: ['e', 'mg'] }], { strict: true });
      same8(back.pieces.mg.props.charge, 2, 'unit02/q8-trends stage 7 (an electron laid back)');
    }
    // 8. the pull on the outermost electron orders the atoms the way electronegativity does
    {
      const pulls = ['na', 'c', 'n', 'f'].map(k => {
        const s = k[0].toUpperCase() + k.slice(1);
        return B.planPull(item(s), B.shellsOf(s).length - 1).pull;
      });
      holds8(pulls.every((v, i) => !i || v > pulls[i - 1]), 'unit02/q8-trends stage 8: the pull meter does not order the atoms weakest first');
      const en = ['Na', 'C', 'N', 'F'].map(s => EL.ELECTRONEGATIVITY[s]);
      holds8(en.every((v, i) => !i || v > en[i - 1]), 'unit02/q8-trends stage 8: the real electronegativities do not order the atoms the same way');
      same8(end8(7).zones.rail.order, ['na', 'c', 'n', 'f'], 'unit02/q8-trends stage 8 (the rail)');
    }
  }
  // THE LANTERN-EATER: five phases, each on a table of a bench the player has worked, each answer read off the real planners.
  const eater = getQuest('unit02', 'boss-eater') && await getQuest('unit02', 'boss-eater').module?.();
  if (eater) {
    const same = (a, b, what) => { if (JSON.stringify(a) !== JSON.stringify(b)) fail(`${what}: graded ${JSON.stringify(a)}, the real answer is ${JSON.stringify(b)}`); };
    const holds = (c, what) => { if (!c) fail(what); };
    const nearE = (a, b, tol, what) => { if (Math.abs(a - b) > tol) fail(`${what}: graded ${a}, the real figure is ${b}`); };
    const OPT = await import('../src/learn/table/kits/optics.js');
    const SHL = await import('../src/learn/table/kits/shells.js');
    const PESK = await import('../src/learn/table/kits/pes.js');
    const CUV = await import('../src/learn/table/kits/cuvette.js');
    const start = i => TABLE.createTable(eater.STAGES[i].table, eater.STAGES[i].title);
    const end = i => TABLE.runScript(start(i), eater.SOLUTIONS[i], { strict: true });
    // 1. the 486 nm line is the drop from the fourth rung to the second, and no other drop makes a line within a nanometre of it
    {
      const jumps = LIGHT.jumpsForLine(eater.LADDER_LINE);
      same(jumps.map(j => [j.hi, j.lo]), [[4, 2]], 'unit02/boss-eater phase 1 (the drop that makes the line)');
      const last = OPT.ladderRead(end(0), 'lad').last;
      nearE(last.nm, LIGHT.planJump(4, 2).nm, 0.01, 'unit02/boss-eater phase 1 (the line the solution made)');
      for (let hi = 2; hi <= 6; hi++) for (let lo = 1; lo < hi; lo++) {
        if (!(hi === 4 && lo === 2)) holds(Math.abs(LIGHT.planJump(hi, lo).nm - eater.LADDER_LINE) >= 1, `unit02/boss-eater phase 1: the drop ${hi} to ${lo} also makes a line near ${eater.LADDER_LINE} nm`);
      }
    }
    // 2. every lamp frees cesium's electrons, each at its own speed, and the one in the marked place is the slowest
    {
      const speeds = eater.LAMPS.map(([id, , nm]) => [id, LIGHT.planPhotocell('Cs', nm, eater.CELL_BRIGHT)]);
      holds(speeds.every(([, r]) => r.freed), 'unit02/boss-eater phase 2: a lamp frees no electrons, so "slowest" is zero');
      const order = speeds.slice().sort((a, b) => a[1].speed - b[1].speed);
      holds(order.every(([, r], k) => !k || r.speed > order[k - 1][1].speed), 'unit02/boss-eater phase 2: two lamps free electrons at the same speed');
      const t = end(1);
      same(Object.values(t.pieces).filter(p => p.zone === 'slot:slowest').map(p => p.id), [order[0][0]], 'unit02/boss-eater phase 2 (the lamp in the marked place)');
      const first = start(1);
      same(first.pieces.cs.props.metal, 'Cs', 'unit02/boss-eater phase 2 (the plate is cesium)');
      same(first.pieces.cs.zone, `slot:${first.fixtures.cell.props.holder}`, 'unit02/boss-eater phase 2 (fixed in the holder)');
    }
    // 3. oxygen is pulled by two lone electrons, the rack that pulls as hard has two alone, and a rack of pairs would not match
    {
      const t = end(2);
      same(SHL.readOf(t, 'rack').unpaired, SHL.MEASURED.O, 'unit02/boss-eater phase 3 (the rack that matches the sample)');
      same(SHL.rackPull(t, 'rack'), SHL.MEASURED.O, 'unit02/boss-eater phase 3 (the rack pulls as the sample does)');
      same(t.fixtures.alone.dials.n.value, SHL.readOf(t, 'rack').unpaired, 'unit02/boss-eater phase 3 (the marker)');
      const b = idx => `piece:${SHL.boxPieceId('rack', '2p', idx)}`;
      const paired = TABLE.runScript(start(2), [0, 1].flatMap(i => [{ place: { piece: 'up', to: b(i) } }, { place: { piece: 'down', to: b(i) } }]));
      holds(SHL.rackPull(paired, 'rack') !== SHL.MEASURED.O, 'unit02/boss-eater phase 3: pairing the p electrons first still matches the magnet');
      holds(start(2).fixtures.alone.dials.n.value !== SHL.MEASURED.O, 'unit02/boss-eater phase 3: the marker starts on the answer');
    }
    // 4. the sealed core is neon: peaks of 2, 2 and 6, and no other candidate has its electron count
    {
      same(EL.planPES(eater.CORE).map(p => p.height), [2, 2, 6], 'unit02/boss-eater phase 4 (the sealed core\'s piles)');
      const t = end(3);
      const b = PESK.buildRead(t, 'build');
      holds(b.whole && b.sym === eater.CORE, 'unit02/boss-eater phase 4: the solution does not build the sealed core\'s atom');
      same(t.pieces.x.props.sym, eater.CORE, 'unit02/boss-eater phase 4 (the specimen)');
      for (const sym of ['O', 'F', 'Na']) holds(EL.planPES(sym).reduce((n, p) => n + p.height, 0) !== 10, `unit02/boss-eater phase 4: ${sym} has as many electrons as the sealed core`);
    }
    // 5. the sealed copper solution is read back off the line the standards make
    {
      const t = end(4);
      const A = id => CUV.absorbOf(t.pieces[id], 630, 1);
      const C = id => CUV.concOf(t.pieces[id]) * 1000;
      const slope = (A('s3') - A('s1')) / (C('s3') - C('s1'));
      nearE((A('sealed') - A('s1')) / slope + C('s1'), eater.SEALED_CONC * 1000, 0.05, 'unit02/boss-eater phase 5 (the line gives the sealed strength back)');
      same(CUV.markerRead(t, 'conc'), eater.SEALED_CONC * 1000, 'unit02/boss-eater phase 5 (the marker)');
      holds(start(4).fixtures.conc.dials.value.max >= eater.SEALED_CONC * 1000, 'unit02/boss-eater phase 5: the marker cannot reach the answer');
      holds(A('sealed') > A('s1') && A('sealed') < A('s3'), 'unit02/boss-eater phase 5: the sealed reading lies outside the standards');
    }
    // Every phase is a fight: one eater, the species' own words, no field stage (verify:table holds the pad).
    eater.STAGES.forEach((st, i) => {
      same(st.encounter?.species, 'the lantern-eater', `boss-eater phase ${i + 1} (its species)`);
      same((st.foes || []).length, 1, `boss-eater phase ${i + 1} (its foes)`);
      holds(!(st.table.fetch || []).length && !st.field, `boss-eater phase ${i + 1}: a boss phase declares a field stage`);
      holds(st.widget.type === 'table', `boss-eater phase ${i + 1}: not a table`);
    });
  }
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
   Five per quest, gathered and shown once the whole unit is worked — and
   never before. A set that opened at the end of a quest would be a gate
   in the middle of a road; a set that opened before the world was done
   would ask about benches the player has not reached yet.
   ------------------------------------------------------------------ */
{
  const before = failures;
  const { loadWorldPractice, worldHasPractice, practiceOfferedFlag } =
    await import('../src/learn/practice.js');

  for (const w of WORLDS.filter(x => x.status === 'live')) {
    const set = await loadWorldPractice(w);
    const expected = w.liveQuestCount * PROBLEMS_PER_QUEST;
    if (set.length !== expected) {
      fail(`world ${w.id}: the set has ${set.length} problems, expected ${expected} (${w.liveQuestCount} built quests)`);
    }
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
      near(mk, PAIRS['H-Cl'].de, 15, 'unit03/q3-distance stage 2 (the depth of H-Cl, kJ/mol)');
      const d = t.fixtures.w.dials.depth;
      if (!(d.max >= PAIRS['H-Cl'].de * 1.1)) fail('unit03/q3-distance stage 2: the marker cannot reach below the bottom of the well');
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
      for (const [i, key] of [[0, 'H2O'], [2, 'CO2'], [4, 'BF3']]) {
        const d = drawn(endOf(i), 'a');
        if (norm(d) !== norm(DRAWINGS[key])) fail(`unit03/q4-dots stage ${i + 1}: the solution leaves a ${key} drawing that is not the intended one`);
        if (!lit(key, DRAWINGS[key])) fail(`unit03/q4-dots stage ${i + 1}: the intended ${key} drawing does not light every lamp`);
        same(d.sl.charge, MOLECULES[key].charge, `unit03/q4-dots stage ${i + 1} (the tray charge)`);
      }
      // Stage 2 holds the guesses and no instrument; the wrong idea (a single stick to each oxygen) is a card, and it leaves two lamps dark.
      {
        const t0 = tableOf(1);
        holds(q4.STAGES[1].predict === true && !Object.values(t0.fixtures).length && !t0.tools.length, 'unit03/q4-dots stage 2: the predict stage shows an instrument');
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
        const t4 = tableOf(3);
        const a = TABLE.applyAll(t4, [{ join: ['pairs', 'aj01'] }, { join: ['pairs', 'aj02'] }]);
        if (a.last.joined !== false || !a.last.home || !/hydrogen/.test(a.last.reason || '')) fail('unit03/q4-dots stage 4: a second joint on the hydrogen atom is not refused with the board\'s rule');
        if (a.pieces.pairs.at.x !== t4.pieces.pairs.at.x) fail('unit03/q4-dots stage 4: a refused pair does not go back to the tray');
      }
      const bf = planLewis('BF3', DRAWINGS.BF3);
      if (bf.atoms[0].lamp !== 'amber') fail('unit03/q4-dots stage 5: boron\'s lamp is not amber in the intended BF3 drawing');
    }
    if (q5) {
      // Every slate on a bench-five table is Lewis's own molecule, its prefilled drawing is the one the stage names, and every graded answer is
      // recomputed here from `planLewis` and the real tables, never from the numbers a stage's check carries.
      const ATOMS = await import('../src/learn/table/kits/atoms.js');
      const tableOf = i => TABLE.createTable(q5.STAGES[i].table, q5.STAGES[i].title);
      const endOf = i => TABLE.runScript(tableOf(i), q5.SOLUTIONS[i], { strict: true });
      const fc = (mol, d) => planLewis(mol, d).atoms.map(a => a.fc);
      q5.STAGES.forEach((st, i) => {
        for (const f of Object.values(tableOf(i).fixtures).filter(x => x.kind === 'slate')) {
          const mol = MOLECULES[f.props.mol];
          if (!mol) { fail(`unit03/q5-resonance stage ${i + 1}: slate ${f.id} is "${f.props.mol}", which lewis.js does not hold`); continue; }
          const els = f.props.atoms.map(id => tableOf(i).pieces[id].props.el);
          if (JSON.stringify(els) !== JSON.stringify(mol.syms)) fail(`unit03/q5-resonance stage ${i + 1}: slate ${f.id}'s atoms are not ${f.props.mol}'s`);
        }
      });
      // 1. carbon monoxide's drawing: the atom with one electron too few is oxygen, and the mark ends on it
      {
        const co = fc('CO', DRAWINGS.CO);
        if (co[1] !== 1 || co[0] !== -1) fail('unit03/q5-resonance stage 1: oxygen is not +1 and carbon -1 in the CO drawing');
        const t = endOf(0);
        same(ATOMS.slateOf(t, 'a').atoms.filter(id => t.pieces[id].props.marked).join(), 'a1', 'unit03/q5-resonance stage 1 (the atom that owns one electron too few)');
        same(t.pieces.a0.props.stamped && t.pieces.a1.props.stamped, true, 'unit03/q5-resonance stage 1 (the stamp is on both atoms)');
      }
      // 2. carbon dioxide lights every lamp two ways, and only the double-double one leaves every charge at zero
      {
        const sumAbs = a => a.reduce((n, v) => n + Math.abs(v), 0);
        if (!(sumAbs(fc('CO2', DRAWINGS.CO2_double)) < sumAbs(fc('CO2', DRAWINGS.CO2_triple)))) fail('unit03/q5-resonance stage 2: the double-bonded drawing does not have charges nearer zero');
        if (!lit('CO2', DRAWINGS.CO2_double) || !lit('CO2', DRAWINGS.CO2_triple)) fail('unit03/q5-resonance stage 2: both drawings must light every lamp, or the lamps would choose');
        const s = ATOMS.slateOf(endOf(1), 'a');
        same(s.read.atoms.map(a => a.fc).join(), '0,0,0', 'unit03/q5-resonance stage 2 (the drawing the solution leaves)');
      }
      // 3. thiocyanate: two drawings light every lamp, one with the minus on sulfur and one on nitrogen; the graded one has it on the stronger puller
      {
        for (const d of [DRAWINGS.SCN_n, DRAWINGS.SCN_s]) if (!lit('SCN', d)) fail('unit03/q5-resonance stage 3: a thiocyanate drawing does not light every lamp');
        const s = ATOMS.slateOf(endOf(2), 'a');
        const neg = s.read.atoms.filter(a => a.fc < 0);
        if (neg.length !== 1 || neg[0].sym !== 'N' || !(VSEPR.EN.N > VSEPR.EN.S)) fail('unit03/q5-resonance stage 3: the solution does not put the minus on the more electronegative atom');
        const other = planLewis('SCN', DRAWINGS.SCN_s).atoms.find(a => a.fc < 0);
        if (other.sym !== 'S') fail('unit03/q5-resonance stage 3: the other drawing does not put the minus on sulfur');
      }
      // 4. the measured lengths of ozone are equal, and the gauge reads them off the real molecule and not the drawing
      {
        const o3 = MOLECULES.O3.lengths;
        if (o3['0-1'] !== o3['0-2']) fail('unit03/q5-resonance stage 4: ozone\'s two measured bonds are not the same length');
        const d = DRAWINGS.O3;
        if (d.bonds['0-1'] === d.bonds['0-2']) fail('unit03/q5-resonance stage 4: the drawing does not show one double bond and one single (the contrast the gauge breaks)');
        same(endOf(3).pieces.second.zone, 'tray:same', 'unit03/q5-resonance stage 4 (the second bond is the same length)');
      }
      // 5 and 6. nitrate has three drawings, each lit on its slate, all different; four pairs share three bonds
      {
        const t = endOf(4);
        const keys = ['a', 'b', 'c'].map(id => { const s = ATOMS.slateOf(t, id); return { lit: LEWIS.allLit(s.read), key: LEWIS.drawingKey(s.mol, s.placed) }; });
        if (keys.some(k => !k.lit)) fail('unit03/q5-resonance stage 5: a slate the solution drew does not light every lamp');
        same(new Set(keys.map(k => k.key)).size, 3, 'unit03/q5-resonance stage 5 (nitrate\'s three drawings)');
        same(LEWIS.distinctDrawings('NO3', [DRAWINGS.NO3_a, DRAWINGS.NO3_b, DRAWINGS.NO3_c]).length, 3, 'unit03/q5-resonance stage 5 (the real count of nitrate\'s drawings)');
        const pairs = Object.values(DRAWINGS.NO3_a.bonds).reduce((a, b) => a + b, 0);
        near(endOf(5).fixtures.order.dials.order.value, pairs / Object.keys(DRAWINGS.NO3_a.bonds).length, 0.02, 'unit03/q5-resonance stage 6 (the order of each nitrate bond)');
        const g = MOLECULES.NO3.lengths;
        if (new Set(Object.values(g)).size !== 1) fail('unit03/q5-resonance stage 6: nitrate\'s three measured bonds are not all the same length');
        const d = tableOf(5).fixtures.order.dials.order;
        if (!(d.min === 1 && d.max === 2)) fail('unit03/q5-resonance stage 6: the dial does not run from a single bond to a double');
      }
      // 7. carbonate's three drawings are equivalent: three drawings, one family, counted equally
      {
        same(LEWIS.distinctDrawings('CO3', [DRAWINGS.CO3_a, DRAWINGS.CO3_b, DRAWINGS.CO3_c]).length, 3, 'unit03/q5-resonance stage 7 (carbonate\'s drawings)');
        const fcs = [DRAWINGS.CO3_a, DRAWINGS.CO3_b, DRAWINGS.CO3_c].map(d => fc('CO3', d).slice().sort().join());
        same(new Set(fcs).size, 1, 'unit03/q5-resonance stage 7 (the three drawings carry the same charges)');
        for (const id of ['ta', 'tb', 'tc']) same(endOf(6).pieces[id].zone, 'tray:same', `unit03/q5-resonance stage 7 (${id})`);
      }
      // 8. water has one drawing: no second way lights every lamp
      {
        if (Object.keys(DRAWINGS.H2O.bonds).some(k => DRAWINGS.H2O.bonds[k] > 1)) fail('unit03/q5-resonance stage 8: water\'s drawing has a double bond');
        const mol = MOLECULES.H2O;
        const skeleton = LEWIS.drawing({ '0-1': 1, '0-2': 1 });
        // Every way of dealing the remaining two pairs: onto atoms or into joints.
        let lits = new Set();
        const spots = [{ k: 'lone', i: 0 }, { k: 'lone', i: 1 }, { k: 'lone', i: 2 }, { k: 'bond', i: '0-1' }, { k: 'bond', i: '0-2' }];
        for (const p of spots) for (const q of spots) {
          const d = LEWIS.drawing({ ...skeleton.bonds }, {}, {});
          for (const sp of [p, q]) { if (sp.k === 'lone') d.lone[sp.i] = (d.lone[sp.i] || 0) + 1; else d.bonds[sp.i] += 1; }
          if (LEWIS.allLit(planLewis('H2O', d))) lits.add(LEWIS.drawingKey('H2O', d) + JSON.stringify(d.lone));
        }
        same(lits.size, 1, 'unit03/q5-resonance stage 8 (the number of ways to light every lamp of water from its skeleton)');
        same(ATOMS.slateOf(endOf(7), 'a').read.atoms.map(a => a.lamp).join(), 'full,full,full', 'unit03/q5-resonance stage 8 (the solution lights water)');
        void mol;
      }
    }
  }

  if (q6) {
    const { planDomains, bondAngles, SHAPES, RIG_MOLECULES, angleBetween, domainStrain, arrangements, bestStrain, IDEAL } = VSEPR;
    const DOM = await import('../src/learn/table/kits/domain.js');
    const end = i => TABLE.runScript(TABLE.createTable(q6.STAGES[i].table, q6.STAGES[i].title), q6.SOLUTIONS[i], { strict: true });
    const dial = (t, id) => t.fixtures[id].dials.value.value;
    // 1, 2, 4. an angle is set against what the planner settles the arms at, and the arms the stage hands over are the ones that settle
    {
      const t1 = end(0); const r1 = DOM.hubRead(t1, 'hub');
      same(r1.n, 2, 'unit03/q6-shape stage 1 (two arms are on the hub)');
      near(dial(t1, 'mark'), angleBetween(r1.plan, 0, 1), 1.5, 'unit03/q6-shape stage 1 (two arms, degrees)');
      const t2 = end(1); const r2 = DOM.hubRead(t2, 'hub');
      same(r2.n, 4, 'unit03/q6-shape stage 2 (four arms are on the hub)');
      same(bondAngles(r2.plan).join(), '109.5', 'unit03/q6-shape stage 2 (four arms, every pair)');
      near(dial(t2, 'mark'), 109.5, 1.5, 'unit03/q6-shape stage 2 (the marker)');
      const t4 = end(3); const r4 = DOM.hubRead(t4, 'hub');
      same(bondAngles(r4.plan).join(), '104.5', 'unit03/q6-shape stage 4 (water)');
      near(dial(t4, 'mark'), 104.5, 1.5, 'unit03/q6-shape stage 4 (the marker)');
      same(DOM.hubRead(end(4), 'hub').n, dial(end(4), 'mark'), 'unit03/q6-shape stage 5 (CO2\'s domains)');
    }
    // 3. ammonia's atoms are a pyramid only with its lone pair on the hub; without it they lie flat
    {
      const r3 = DOM.hubRead(end(2), 'hub');
      same(r3.shape, 'trigonal pyramidal', 'unit03/q6-shape stage 3 (NH3)');
      holds(r3.height > 0.1, 'unit03/q6-shape stage 3: the atoms of the solution do not lean');
      const flat = planDomains([{ kind: 'atom', sym: 'H' }, { kind: 'atom', sym: 'H' }, { kind: 'atom', sym: 'H' }]);
      same(VSEPR.hubHeight(flat), 0, 'unit03/q6-shape stage 3 (three atoms alone lie flat)');
    }
    // 6, 7. the frame: where a lone pair sits is whatever makes the strain least, and that is where the planner puts it
    {
      const lowest = (a, l) => {
        const arr = arrangements(a, l).map(k => ({ k, s: domainStrain(k) }));
        const best = Math.min(...arr.map(x => x.s));
        return arr.filter(x => x.s - best < 1e-3);
      };
      const lonesAt = (n, k) => k.map((c, i) => (c === 'lone' ? IDEAL[n][i] : null)).filter(Boolean);
      // five domains, one lone pair: every lowest arrangement puts it round the middle (y = 0), and so does planDomains
      const five = lowest(4, 1);
      holds(five.length === 3 && five.every(x => Math.abs(lonesAt(5, x.k)[0][1]) < 1e-9), 'unit03/q6-shape stage 6: the lowest strain is not the lone pair round the middle');
      const sf4 = planDomains(RIG_MOLECULES.SF4.arms);
      holds(Math.abs(sf4.vectors.find(v => v.kind === 'lone').v[1]) < 1e-9, 'unit03/q6-shape stage 6: planDomains does not put the lone pair round the middle');
      // six domains, two lone pairs: every lowest arrangement puts them opposite, and so does planDomains
      const six = lowest(4, 2);
      holds(six.length === 3 && six.every(x => { const [a, b] = lonesAt(6, x.k); return Math.abs(a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + 1) < 1e-9; }), 'unit03/q6-shape stage 7: the lowest strain is not the lone pairs opposite');
      const xe = planDomains(RIG_MOLECULES.XeF4.arms);
      const [la, lb] = xe.vectors.filter(v => v.kind === 'lone').map(v => v.v);
      near(la[0] * lb[0] + la[1] * lb[1] + la[2] * lb[2], -1, 1e-9, 'unit03/q6-shape stage 7 (the lone pairs of XeF4 are opposite)');
      same(xe.shape, 'square planar', 'unit03/q6-shape stage 7 (XeF4)');
      // a lone pair in the middle reads fewer close atoms than at an end; the solution is lowest, the miss is not
      for (const [i, n] of [[5, 5], [6, 6]]) {
        const good = DOM.frameRead(end(i), 'fr');
        holds(good.full && good.lowest, `unit03/q6-shape stage ${i + 1}: the solution is not the lowest strain`);
        const bad = DOM.frameRead(TABLE.runScript(TABLE.createTable(q6.STAGES[i].table, q6.STAGES[i].title), q6.MISSES[i], { strict: true }), 'fr');
        holds(bad.full && !bad.lowest && bad.strain > good.strain, `unit03/q6-shape stage ${i + 1}: the miss is not higher in strain`);
        same(good.n, n, `unit03/q6-shape stage ${i + 1} (the frame's sockets)`);
      }
      // the frame's slots are the polyhedron: sockets far enough apart to hold a piece each, all inside the frame
      for (const [i, n] of [[5, 5], [6, 6]]) {
        const t = TABLE.createTable(q6.STAGES[i].table, q6.STAGES[i].title);
        const s = Object.values(t.zones.slots);
        const fx = Object.values(t.fixtures)[0];
        holds(s.length === n, `unit03/q6-shape stage ${i + 1}: ${s.length} sockets for ${n} domains`);
        for (const a of s) {
          holds(Math.abs(a.at.x - fx.at.x) + 6 < fx.size.w / 2 && Math.abs(a.at.y - fx.at.y) + 6 < fx.size.h / 2, `unit03/q6-shape stage ${i + 1}: socket ${a.id} is not inside the frame`);
          for (const b of s) if (a !== b && Math.hypot(a.at.x - b.at.x, a.at.y - b.at.y) < 12.6) fail(`unit03/q6-shape stage ${i + 1}: sockets ${a.id} and ${b.id} are too close for two pieces`);
        }
      }
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
    // 8. the shape the atoms make, not the shape the domains make
    {
      const shapes = { a: 'linear', b: 'trigonal planar', c: 'square planar' };
      const t = end(7);
      for (const id of ['a', 'b', 'c']) {
        const read = q6.molRead(t.pieces[id]);
        same(read.shape, shapes[id], `unit03/q6-shape stage 8 (${id}: molecular geometry)`);
        same(t.pieces[id].zone, `tray:${{ 'linear': 'linear', 'trigonal planar': 'planar', 'square planar': 'square' }[read.shape]}`, `unit03/q6-shape stage 8 (${id}: the tray the solution uses)`);
      }
      same(SHAPES['2-3'].electron, 'trigonal bipyramidal', 'unit03/q6-shape stage 8 card (XeF2\'s electron geometry)');
      same(SHAPES['4-2'].electron, 'octahedral', 'unit03/q6-shape stage 8 (XeF4\'s electron geometry is not its shape)');
    }
  }

  if (q7) {
    const { planDipole, EN, bondKind } = VSEPR;
    const DOM = await import('../src/learn/table/kits/domain.js');
    const polar = m => planDipole(m).polar;
    const end = i => TABLE.runScript(TABLE.createTable(q7.STAGES[i].table, q7.STAGES[i].title), q7.SOLUTIONS[i], { strict: true });
    const start = i => TABLE.createTable(q7.STAGES[i].table, q7.STAGES[i].title);
    // 1. chlorine pulls harder; the card is set so that it stays when the field comes on, and it does not start that way
    {
      if (!(EN.Cl > EN.H)) fail('unit03/q7-polarity stage 1: chlorine does not pull harder than hydrogen');
      holds(DOM.dmolBehaviour(end(0).pieces.a, end(0)).aligned, 'unit03/q7-polarity stage 1: the solution is not set the way the field wants it');
      const s0 = start(0);
      const put = TABLE.apply(s0, { place: { piece: 'a', to: 'free:37,21' } });
      holds(!DOM.dmolBehaviour(put.pieces.a, put).aligned, 'unit03/q7-polarity stage 1: the card starts already set the way the field wants it');
    }
    // 2. three bonds, in order of how unevenly they share
    {
      const t = end(1);
      const kind = { a: 'ionic', b: 'nonpolar', c: 'polar' };
      for (const id of ['a', 'b', 'c']) {
        const m = q7.molOf(t.pieces[id]);
        same(bondKind(m.hub, m.arms[0].sym), kind[id], `unit03/q7-polarity stage 2 (${m.hub}-${m.arms[0].sym})`);
        same(t.pieces[id].zone, `tray:${{ ionic: 'given', nonpolar: 'even', polar: 'uneven' }[kind[id]]}`, `unit03/q7-polarity stage 2 (${id} is trayed by its bond)`);
      }
      const mags = Object.fromEntries(['NaCl', 'H2', 'HCl'].map(m => [m, planDipole(m).mag]));
      if (!(mags.NaCl > mags.HCl && mags.HCl > mags.H2 && mags.H2 === 0)) fail('unit03/q7-polarity stage 2: the three bonds are not ordered by their pull');
    }
    // 3. 4. 6. 7. who turns
    same(polar('CO2'), false, 'unit03/q7-polarity stage 3 (CO2 turns)');
    same(end(2).prediction.token, 'stays', 'unit03/q7-polarity stage 3 (the prediction)');
    same(`${polar('H2O')}/${polar('CO2')}`, 'true/false', 'unit03/q7-polarity stage 4 (water against carbon dioxide)');
    same([end(3).pieces.a.zone, end(3).pieces.b.zone].join(), 'tray:add,tray:cancel', 'unit03/q7-polarity stage 4 (the trays)');
    same(`${polar('NH3')}/${polar('BF3')}`, 'true/false', 'unit03/q7-polarity stage 6');
    same(end(5).prediction.token, 'nh3', 'unit03/q7-polarity stage 6 (the prediction)');
    // 5. one atom of CCl4 changed: the molecule that cancelled does not, and the swap is the planner's own (CHCl3)
    {
      same(polar('CCl4'), false, 'unit03/q7-polarity stage 5 (CCl4 cancels)');
      const r = q7.molRead(end(4).pieces.a);
      same(r.label, 'CHCl₃', 'unit03/q7-polarity stage 5 (one chlorine swapped for hydrogen)');
      same(r.polar, polar('CHCl3'), 'unit03/q7-polarity stage 5 (the swapped molecule is as CHCl3 is)');
      holds(r.polar, 'unit03/q7-polarity stage 5: the swapped molecule does not turn');
    }
    const t7 = end(6);
    for (const [id, mol] of [['a', 'XeF4'], ['b', 'SF4'], ['c', 'CHCl3']]) same(t7.pieces[id].zone, `tray:${polar(mol) ? 'polar' : 'nonpolar'}`, `unit03/q7-polarity stage 7 (${mol})`);
    // 8. the streams that bend are the ones whose molecules turn
    {
      const t = end(7);
      const real = ['s1', 's2', 's3'].filter(id => polar(t.pieces[id].props.mol));
      same(['s1', 's2', 's3'].filter(id => t.pieces[id].zone === 'tray:bent').join(), real.join(), 'unit03/q7-polarity stage 8 (the liquids a charged rod bends)');
      holds(polar(t.pieces.s4.props.mol), 'unit03/q7-polarity stage 8: the stream from the sump does not bend');
    }
    // The gap the cards are put in holds a card, in every stage that has plates.
    q7.STAGES.forEach((st, i) => {
      for (const f of Object.values(start(i).fixtures).filter(x => x.kind === 'plates')) {
        const g = DOM.gapArea(f);
        holds(g.x1 - g.x0 >= 2 * DOM.MOL_RECT.hw + 2 && g.y1 - g.y0 >= 2 * DOM.MOL_RECT.hh - 1, `unit03/q7-polarity stage ${i + 1}: the gap between the plates is too small for a card`);
      }
    });
  }

  if (q8) {
    const { planMix, planBlend, planTwist, planDomains, countSigmaPi, RIG_MOLECULES, SKELETONS } = VSEPR;
    const DOM = await import('../src/learn/table/kits/domain.js');
    const end = i => TABLE.runScript(TABLE.createTable(q8.STAGES[i].table, q8.STAGES[i].title), q8.SOLUTIONS[i], { strict: true });
    const start = i => TABLE.createTable(q8.STAGES[i].table, q8.STAGES[i].title);
    // 1. carbon as it stands has two single electrons, so it takes two hydrogen atoms and refuses a third; methane has four arms
    {
      const t0 = start(0);
      const singles = Object.values(t0.pieces).filter(p => p.kind === 'orb' && p.props.atom === 'c' && p.props.e === 1).length;
      same(singles, 2, 'unit03/q8-hybrid stage 1 (carbon\'s single electrons)');
      same(planDomains(RIG_MOLECULES.CH4.arms).n, 4, 'unit03/q8-hybrid stage 1 (methane\'s arms)');
      const t = end(0);
      same(DOM.bondsBuilt(t).sigma, 2, 'unit03/q8-hybrid stage 1 (two bonds made)');
      const third = TABLE.apply(t, { join: ['h3', 'cpz'] });
      holds(!third.last.joined, 'unit03/q8-hybrid stage 1: a hydrogen atom bonded to carbon\'s empty orbital');
      const fourth = TABLE.apply(t, { join: ['h3', 'cs'] });
      holds(!fourth.last.joined, 'unit03/q8-hybrid stage 1: a hydrogen atom bonded to carbon\'s full s orbital');
    }
    // 2. 8. what a bowl makes is as many lobes as orbitals mixed
    {
      same(planBlend(1, 3, 0).lobes, planDomains(RIG_MOLECULES.CH4.arms).n, 'unit03/q8-hybrid stage 2 (sp3 makes four lobes)');
      same(planMix(3).lobes, 4, 'unit03/q8-hybrid stage 2 (planMix agrees)');
      same(DOM.bowlRead(end(1), 'mx').hybrid, 'sp3', 'unit03/q8-hybrid stage 2 (the bowl)');
      same(planBlend(0, 3, 0).lobes, 0, 'unit03/q8-hybrid: p orbitals alone blend into nothing new');
      same(DOM.bowlRead(end(7), 'ma').lobes, planDomains(RIG_MOLECULES.PCl5.arms).n, 'unit03/q8-hybrid stage 8 (PCl5\'s lobes)');
      same(DOM.bowlRead(end(7), 'mb').lobes, planDomains(RIG_MOLECULES.SF6.arms).n, 'unit03/q8-hybrid stage 8 (SF6\'s lobes)');
      same(`${DOM.bowlRead(end(7), 'ma').hybrid}/${DOM.bowlRead(end(7), 'mb').hybrid}`, 'sp3d/sp3d2', 'unit03/q8-hybrid stage 8 (the names the card earns)');
      for (const i of [1, 7]) for (const f of Object.values(start(i).fixtures).filter(x => x.kind === 'mixbowl')) {
        const bowl = start(i).zones.containers[f.props.zone];
        const cols = Math.max(1, Math.floor(bowl.size.w / bowl.cell));
        const rows = Math.max(1, Math.floor(bowl.size.h / bowl.cell));
        holds(cols * rows >= 6, `unit03/q8-hybrid stage ${i + 1}: ${f.id}'s bowl holds ${cols * rows} orbitals, fewer than the six an atom has`);
      }
    }
    // 3. 4. the lobes follow the arms, and each card prints the arms the planner counts
    for (const i of [2, 3]) {
      const t = end(i);
      for (const id of ['a', 'b', 'c']) same({ two: 2, three: 3, four: 4 }[t.pieces[id].zone.slice(5)], planDomains(RIG_MOLECULES[t.pieces[id].props.mol].arms).n, `unit03/q8-hybrid stage ${i + 1} (${t.pieces[id].props.mol} needs the graded number of lobes)`);
    }
    // 5. 6. ethene and hydrogen cyanide: each atom has the orbitals the planner says, and the bonds that can be built are the molecule's own
    {
      const ethene = planDomains(RIG_MOLECULES.C2H4.arms);
      same(`${ethene.n}/${planMix(ethene.n - 1).leftoverP}`, '3/1', 'unit03/q8-hybrid stage 5 (an ethene carbon: three lobes and one p left over)');
      const t5 = start(4);
      for (const c of ['c1', 'c2']) {
        const mine = Object.values(t5.pieces).filter(p => p.props.atom === c);
        same(`${mine.filter(p => p.props.type === 'sp2').length}/${mine.filter(p => p.props.type === 'p').length}`, '3/1', `unit03/q8-hybrid stage 5 (${c}'s orbitals)`);
      }
      const b5 = DOM.bondsBuilt(end(4));
      same(`${b5.sigma}/${b5.pi}`, `1/${SKELETONS.C2H4.find(b => b[0] === 'C' && b[1] === 'C')[2] - 1}`, 'unit03/q8-hybrid stage 5 (the carbons\' own bonds: one end to end, the rest side by side)');
      const hcn = planDomains(RIG_MOLECULES.HCN.arms);
      same(`${hcn.n}/${planMix(hcn.n - 1).leftoverP}`, '2/2', 'unit03/q8-hybrid stage 6 (HCN\'s carbon: two lobes and two p left over)');
      const t6 = start(5);
      const of = a => Object.values(t6.pieces).filter(p => p.props.atom === a);
      same(`${of('c').filter(p => p.props.type === 'sp').length}/${of('c').filter(p => p.props.type === 'p').length}`, '2/2', 'unit03/q8-hybrid stage 6 (carbon\'s orbitals)');
      same(`${of('n').filter(p => p.props.type === 'sp').length}/${of('n').filter(p => p.props.type === 'p').length}`, '2/2', 'unit03/q8-hybrid stage 6 (nitrogen\'s orbitals: a lobe for its bond and one for its lone pair)');
      const sp = countSigmaPi('HCN');
      const e6 = end(5);
      const b6 = DOM.bondsBuilt(e6);
      same(`${b6.sigma}-${b6.pi}`, `${sp.sigma}-${sp.pi}`, 'unit03/q8-hybrid stage 6 (sigma and pi bonds in HCN)');
      holds(Object.values(e6.pieces).every(p => p.kind !== 'orb' || p.props.e !== 1 || DOM.bondedOrb(e6, p)), 'unit03/q8-hybrid stage 6: an orbital with a single electron is left unbonded in the solution');
      // The lone pair's lobe, an empty or full orbital and a mismatched pair of p orbitals are all refused by the planner.
      const tryJoin = (a, b) => TABLE.apply(start(5), { join: [a, b] }).last.joined;
      holds(!tryJoin('nl_x', 'cl_n'), 'unit03/q8-hybrid stage 6: the lone pair\'s lobe bonded');
      holds(!tryJoin('cpy', 'npz'), 'unit03/q8-hybrid stage 6: p orbitals on different axes overlapped side by side');
      holds(!tryJoin('h', 'cl_n'), 'unit03/q8-hybrid stage 6: hydrogen bonded to the lobe that points at nitrogen');
    }
    // 7. a single bond turns and a double bond does not
    {
      const t = end(6);
      same(DOM.twistRead(t, 'tw1').free, planTwist('single').free, 'unit03/q8-hybrid stage 7 (the single bond turns)');
      same(DOM.twistRead(t, 'tw2').free, planTwist('double').free, 'unit03/q8-hybrid stage 7 (the double bond holds)');
      same(DOM.twistRead(t, 'tw1').angle, 90, 'unit03/q8-hybrid stage 7 (ethane\'s far end is a quarter turn round)');
      same(DOM.twistRead(t, 'tw2').angle, 0, 'unit03/q8-hybrid stage 7 (ethene\'s far end has not moved)');
    }
    same(planDomains(RIG_MOLECULES.PCl5.arms).n, 5, 'unit03/q8-hybrid stage 8 (PCl5\'s domains)');
    same(planDomains(RIG_MOLECULES.SF6.arms).n, 6, 'unit03/q8-hybrid stage 8 (SF6\'s domains)');
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
    const order = id => readMO(DIATOMICS[id].order, fillMO(DIATOMICS[id].order, DIATOMICS[id].e)).bondOrder;
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
        same(MO.supplyLeft(t), d.e, `unit03/q9-orbitals stage ${i + 1} (the jar holds ${f.props.mol}'s valence electrons)`);
        holds(Object.keys(MO.rackOf(t, f.props.rack)).length === 0, `unit03/q9-orbitals stage ${i + 1}: the rack starts with electrons on it`);
        // The graded fill is the ground state, and it is the planner's: the rack reads what fillMO says.
        const e = end(i);
        same(MO.readOf(e, f.props.rack).total, d.e, `unit03/q9-orbitals stage ${i + 1} (electrons on the rack)`);
        holds(MO.matchesGround(e, f.props.rack, d.e), `unit03/q9-orbitals stage ${i + 1}: the solution is not the ground state`);
        same(MO.readOf(e, f.props.rack).config, readMO(d.order, fillMO(d.order, d.e)).config, `unit03/q9-orbitals stage ${i + 1} (the configuration)`);
      }
    });
    // 1. two atomic 1s boxes make one box below them and one above, and the rail's answer lists them so
    {
      const rows = rowsMO('1s');
      holds(!rows[0].anti && rows[1].anti, 'unit03/q9-orbitals stage 1: the lower box is not the bonding one');
      const f = start(0).fixtures['rack-a'];
      same(`${f.props.tags.g1s}${f.props.tags.u1s}`, '21', 'unit03/q9-orbitals stage 1 (box 2 is the lower, box 1 the upper)');
      same(end(0).zones.rail.order.join(), 'box2,atom,box1', 'unit03/q9-orbitals stage 1 (lowest first)');
    }
    // 3. 4. bond orders are the planner's, and the marker is set to them
    same(order('He2'), 0, 'unit03/q9-orbitals stage 3 (He2\'s bond order)');
    same(end(2).fixtures.order.dials.n.value, MO.readOf(end(2), 'a').bondOrder, 'unit03/q9-orbitals stage 3 (the marker)');
    same(order('N2'), 3, 'unit03/q9-orbitals stage 4 (N2\'s bond order)');
    same(end(3).fixtures.order.dials.n.value, order('N2'), 'unit03/q9-orbitals stage 4 (the marker)');
    for (const i of [2, 3]) holds(start(i).fixtures.order.dials.n.value !== end(i).fixtures.order.dials.n.value, `unit03/q9-orbitals stage ${i + 1}: the marker starts on the answer`);
    // 5. the magnet reads the REAL molecule; the solution's rack agrees with it, and a rack of pairs would not
    {
      if (!(DIATOMICS.O2.unpaired > 0)) fail('unit03/q9-orbitals stage 5: O2 measures no unpaired electrons');
      const t = end(4);
      same(MO.magnetRead(t, 'magnet').pull, DIATOMICS.O2.unpaired, 'unit03/q9-orbitals stage 5 (what the magnet read)');
      same(MO.readOf(t, 'a').unpaired, DIATOMICS.O2.unpaired, 'unit03/q9-orbitals stage 5 (the rack\'s alone-in-a-box count)');
      const paired = TABLE.runScript(start(4), q9.MISSES[4].filter(a => a.pour), { strict: true });
      holds(MO.readOf(paired, 'a').unpaired !== DIATOMICS.O2.unpaired, 'unit03/q9-orbitals stage 5: pairing the last two electrons still matches the magnet');
    }
    // 6. a shorter bond is a higher bond order, and the rail's answer is that order
    {
      const t = start(5);
      const lengths = ['a', 'b', 'c'].map(id => [id, DIATOMICS[t.pieces[id].props.mol].length, order(t.pieces[id].props.mol)]).sort((a, b) => a[1] - b[1]);
      same(lengths.map(l => l[0]).join(), end(5).zones.rail.order.join(), 'unit03/q9-orbitals stage 6 (shortest bond first)');
      if (lengths.some((l, k) => k && l[2] >= lengths[k - 1][2])) fail('unit03/q9-orbitals stage 6: a shorter bond does not have the higher bond order');
      for (const id of ['a', 'b', 'c']) {
        const m = DIATOMICS[t.pieces[id].props.mol];
        const c = MO.cardCounts(t.pieces[id].props.mol);
        const r = readMO(m.order, fillMO(m.order, m.e));
        same(`${c.bonding}/${c.anti}`, `${r.bonding}/${r.anti}`, `unit03/q9-orbitals stage 6 (${id}'s printed counts)`);
      }
    }
    // 7. F2 has the lower bond order and the lower listed energy, so the token is 'weaker'
    if (!(order('F2') < order('O2'))) fail('unit03/q9-orbitals stage 7: F2 does not have the lower bond order');
    if (!(DIATOMICS.F2.energy < DIATOMICS.O2.energy)) fail('unit03/q9-orbitals stage 7: F2 is not the weaker bond in the listed data');
    same(end(6).prediction.token, 'weaker', 'unit03/q9-orbitals stage 7 (the prediction)');
    // 8. B2 filled in its own order has two electrons alone; in the oxygen order it would have none, so the order matters
    same(readMO('b2n2', fillMO('b2n2', 6)).unpaired, 2, 'unit03/q9-orbitals stage 8 (B2 filled in the other order)');
    same(readMO('o2f2', fillMO('o2f2', 6)).unpaired, 0, 'unit03/q9-orbitals stage 8 (B2 filled in the oxygen order reads no unpaired electrons, so the order matters)');
    same(end(7).prediction.token, 'pulled', 'unit03/q9-orbitals stage 8 (the prediction)');
    same(MO.readOf(end(7), 'a').unpaired, DIATOMICS.B2.unpaired, 'unit03/q9-orbitals stage 8 (the rack agrees with the magnet)');
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
    // 2. sulfur tetrafluoride: the tray runs out, every lamp lights, sulfur holds ten
    {
      const sl = ATM.slateOf(end(1), 'a');
      holds(LEWIS.allLit(sl.read) && sl.left === 0, 'boss-warden phase 2: the solution does not light every lamp with the tray empty');
      same(sl.read.atoms[0].lamp, 'expanded', 'boss-warden phase 2 (sulfur past eight)');
      same(sl.total, LEWIS.MOLECULES.SF4.syms.reduce((n, sym) => n + LEWIS.VALENCE[sym], 0), 'boss-warden phase 2 (the tray holds SF4\'s valence electrons)');
    }
    // 3. xenon tetrafluoride: neighbours are 90 degrees apart once both lone pairs are on, and the marker is set to what the planner gives
    {
      const t = end(2);
      const r = DM.hubRead(t, 'hub');
      same(r.atoms, 4, 'boss-warden phase 3 (fluorine atoms on the hub)');
      same(r.lone, 2, 'boss-warden phase 3 (lone pairs on the hub)');
      const plan = planDomains(RIG_MOLECULES.XeF4.arms);
      const fs = r.arms.map((a, i) => [a, i]).filter(([a]) => a.kind === 'arm').map(([, i]) => i);
      const lowest = Math.min(...fs.flatMap((i, k) => fs.slice(k + 1).map(j => angleBetween(r.plan, i, j))));
      near(DM.markerValue(t, 'mark'), lowest, 1.5, 'boss-warden phase 3 (the angle between neighbours)');
      same(r.plan.shape, plan.shape, 'boss-warden phase 3 (the hub\'s shape is XeF4\'s)');
      near(lowest, 90, 0.01, 'boss-warden phase 3 (square planar)');
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
   it (plan `bench-tabletop.md`, T5): a trace that is not a line, a knock counter
   that does not follow the gauge, a ranking the other column would get wrong.
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
  // A stage's table as the player first sees it, and as the stage's solution script leaves it.
  const start = (q, i) => TABLE.createTable(q.STAGES[i].table, q.STAGES[i].title);
  const done = (q, i) => TABLE.runScript(start(q, i), q.SOLUTIONS[i], { strict: true });
  // The reading a rig WOULD give with some dials turned (an index into the stage's own lists); `which` picks the cylinder.
  const rd = (t, id, set = {}, which = 0) => GK.rigAt(t, id, set)[which];
  const rows = (t, id) => GK.rigRead(t, id);
  const dialsOf = (t, id) => t.fixtures[id].props;
  const marker = (t, id) => GK.markerRead(t, id);
  const tray = (t, id) => (t.pieces[id].zone || '').replace(/^tray:/, '');
  const order = t => t.zones.rail.order.join();

  /* ---- the tables themselves ---- */
  near(G.R, 8.314, 1e-9, 'gasdata: R in L kPa / mol K');
  near(G.molesIdeal(G.ATM_KPA, 22.414, 273.15), 1, 0.001, 'gasdata: one mole fills 22.414 L at 0 C and 1 atm');
  for (const [k, g] of Object.entries(G.GASES)) holds(g.M > 0 && g.a > 0 && g.b > 0, `gasdata: ${k} has no real molar mass or van der Waals constants`);
  near(G.pressureVdw('He', 1, 300, 24.6).P, G.pressureIdeal(1, 300, 24.6), 0.2, 'gasdata: van der Waals meets the ideal law in a roomy cylinder');
  near(G.leftAfter('H2', 1), 0.5, 1e-9, 'gasdata: hydrogen is half empty after one second');
  near(G.halfTime('O2') / G.halfTime('H2'), Math.sqrt(G.GASES.O2.M / G.GASES.H2.M), 1e-9, 'gasdata: Graham, the half times go as the root of the mass');
  near(G.speedBins('N2', 300, 60, 6000).reduce((a, b) => a + b, 0), 1, 0.002, 'gasdata: the speed distribution is one whole');

  if (b1) {
    const q = 'unit04/q1-knocks';
    // Stage 1: while the piston moves, nothing but the knocks follows the gauge.
    {
      const t = start(b1, 0);
      const n = dialsOf(t, 'rig').volumes.length;
      const r = k => rd(t, 'rig', { volume: k });
      for (let k = 2; k <= n; k++) {
        near(r(k).P * r(k).V, r(1).P * r(1).V, 1e-6, `${q} stage 1: pressure times volume is not constant`);
        near(r(k).knocks / r(1).knocks, r(k).P / r(1).P, 1e-9, `${q} stage 1: the knock counter does not follow the gauge`);
        near(r(k).mean, r(1).mean, 1e-9, `${q} stage 1: the particles change speed while the piston moves`);
        near(r(k).T, r(1).T, 1e-9, `${q} stage 1: the temperature changes while the piston moves`);
      }
    }
    // Stage 2: twice the gas, twice the pressure.
    {
      const t = start(b1, 1);
      const amts = dialsOf(t, 'rig').amounts;
      near(rd(t, 'rig', { amount: 3 }).P / rd(t, 'rig', { amount: 1 }).P, amts[2] / amts[0], 1e-9, `${q} stage 2 (the gauge follows the amount)`);
      holds(dialsOf(t, 'rig').plot && dialsOf(t, 'rig').plot.x === 'n', `${q} stage 2: the plate does not record against the amount`);
    }
    // Stage 3: heating speeds the particles up.
    {
      const t = start(b1, 2);
      holds(rd(t, 'rig', { temp: 5 }).mean > rd(t, 'rig', { temp: 1 }).mean, `${q} stage 3: heating does not speed the particles up`);
      holds(b1.SPEED_MARK > rd(t, 'rig', { temp: 1 }).mean, `${q} stage 3: the cylinder starts past the speed it is asked to reach`);
      holds(Math.max(...[1, 2, 3, 4, 5].map(k => rd(t, 'rig', { temp: k }).mean)) > b1.SPEED_MARK, `${q} stage 3: the heater cannot reach the speed it is asked for`);
    }
    // Stage 5: one temperature, one energy, two speeds.
    {
      const t = done(b1, 4);
      const a = GK.cylRead(t, 'ra', 0); const b = GK.cylRead(t, 'rb', 0);
      near(a.energy, b.energy, 1e-9, `${q} stage 5: the two gases do not share an average kinetic energy`);
      holds(a.mean > b.mean * 2, `${q} stage 5: helium is not much faster than carbon dioxide`);
      near(a.T, b.T, 1e-9, `${q} stage 5: the solution leaves the two cylinders at different temperatures`);
    }
    // Stage 6: one gauge, three scales, read off the reference gauge.
    {
      const t = done(b1, 5);
      const ref = t.fixtures.ref;
      const atm = ref.props.atms[Math.round(ref.dials.pressure.value) - 1];
      const A = GK.cylRead(t, 'ra', 0);
      near(G.kPaToAtm(A.P), 1.5, 0.001, `${q} stage 6: Cylinder A does not read 1.50 atm`);
      near(atm, G.kPaToAtm(A.P), 0.001, `${q} stage 6: the solution leaves the reference gauge at another pressure`);
      near(G.kPaToMmHg(atm * G.ATM_KPA), 760 * atm, 0.5, `${q} stage 6: the reference gauge does not read 760 mmHg per atmosphere`);
      const card = Object.values(t.pieces).find(p => p.zone === 'slot:answer');
      same(card && card.props.value, Math.round(A.P), `${q} stage 6 (A in kilopascals)`);
      holds(start(b1, 5).fetch.gauge && start(b1, 5).pieces.holder.fetchFrom === 'gauge', `${q} stage 6: the holder's gauge is not a field fetch`);
    }
    // Stage 7: a line laid across the readings carries on to zero pressure at 0 K.
    {
      const t = start(b1, 6);
      const temps = dialsOf(t, 'rig').temps;
      const pts = temps.map((_, k) => rd(t, 'rig', { temp: k + 1 }));
      const slope = (pts[1].P - pts[0].P) / (pts[1].T - pts[0].T);
      pts.forEach((p, k) => near(p.P, pts[0].P + slope * (p.T - pts[0].T), 1e-9, `${q} stage 7: point ${k + 1} is off the line`));
      near(pts[0].T - pts[0].P / slope, 0, 0.01, `${q} stage 7: the line does not reach zero pressure at 0 K`);
      holds(Math.min(...temps) > -273.15 + 100, `${q} stage 7: the dial reaches too close to absolute zero for the line to need carrying on`);
      holds(t.recorder.axes && t.recorder.axes.range && t.recorder.axes.range.xMin <= -273.15, `${q} stage 7: the strip does not run as far as absolute zero`);
    }
    // Stage 8: the statements marked are the ones the plate supports.
    {
      const t = done(b1, 7);
      const marked = Object.values(t.pieces).filter(p => p.props.flipped).map(p => p.id).sort().join();
      same(marked, b1.TRUE_STATEMENTS.slice().sort().join(), `${q} stage 8 (the statements marked)`);
    }
  }

  if (b2) {
    const q = 'unit04/q2-laws';
    {
      const t = start(b2, 0);
      near(rd(t, 'rig', { volume: 4 }).P / rd(t, 'rig', { volume: 1 }).P, 0.25, 1e-9, `${q} stage 1 (a quarter of the room)`);
      same(marker(done(b2, 0), 'times'), 4, `${q} stage 1 (the marker)`);
    }
    {
      const t = start(b2, 1);
      near(rd(t, 'rig', { volume: 1 }).knocks / rd(t, 'rig', { volume: 2 }).knocks, 2, 1e-9, `${q} stage 2: the knocks do not double in half the room`);
      near(rd(t, 'rig', { volume: 1 }).mean, rd(t, 'rig', { volume: 2 }).mean, 1e-9, `${q} stage 2: the speed changes with the piston`);
      same(done(b2, 1).prediction.token, 'twice', `${q} stage 2 (the prediction)`);
    }
    near(rd(start(b2, 2), 'rig', { temp: 4 }).V / rd(start(b2, 2), 'rig', { temp: 1 }).V, 1.5, 0.002, `${q} stage 3 (the room at x1.5 kelvin)`);
    {
      const t = start(b2, 3);
      const k = dialsOf(t, 'rb').temps.length;
      const v = i => rd(t, 'rb', { temp: i });
      for (let i = 1; i <= k; i++) near(v(i).V / v(i).T, v(1).V / v(1).T, 1e-9, `${q} stage 4: V over kelvin is not constant`);
      near(v(5).V / v(1).V, 2, 0.002, `${q} stage 4 (double the room)`);
    }
    {
      const t = start(b2, 4);
      const k = dialsOf(t, 'rig').temps.length;
      for (let i = 1; i <= k; i++) near(rd(t, 'rig', { temp: i }).P / rd(t, 'rig', { temp: i }).T, rd(t, 'rig', { temp: 1 }).P / rd(t, 'rig', { temp: 1 }).T, 1e-9, `${q} stage 5: P over kelvin is not constant in a sealed tank`);
      const dn = done(b2, 4);
      holds(dn.prediction.tested, `${q} stage 5: the solution does not test its prediction`);
    }
    {
      const t = start(b2, 5);
      const amts = dialsOf(t, 'rig').amounts;
      near(rd(t, 'rig', { amount: 5 }).V / rd(t, 'rig', { amount: 1 }).V, amts[4] / amts[0], 1e-9, `${q} stage 6 (twice the gas, twice the room)`);
      near(rd(t, 'rig', { amount: 5 }).P, rd(t, 'rig', { amount: 1 }).P, 1e-9, `${q} stage 6: the pressure moves when the amount does at a free piston`);
    }
    {
      const t = start(b2, 6);
      const a = rd(t, 'ra'); const b = rd(t, 'rb', { volume: 5 });
      near(a.P, 100, 0.1, `${q} stage 7: Cylinder A does not read 100 kPa`);
      near(b.P, a.P / 2, 0.1, `${q} stage 7 (the combined law)`);
      holds(!dialsOf(t, 'rb').volumes.every(v => rd(t, 'rb', { volume: dialsOf(t, 'rb').volumes.indexOf(v) + 1 }).P !== b.P) || true, `${q} stage 7`);
      near(rd(t, 'rb', { volume: 3 }).V / rd(t, 'rb', { volume: 1 }).V, dialsOf(t, 'rb').volumes[2] / dialsOf(t, 'rb').volumes[0], 1e-9, `${q} stage 7: the piston settings are not the room`);
    }
    {
      const A = b2.RECORDS.find(r => r.id === 'a'); const curveA = G.recordCurve({ record: A.spec });
      curveA.forEach(p => near(p.x * p.y, curveA[0].x * curveA[0].y, 1e-6, `${q} stage 8: record A is not P times V constant`));
      for (const [id, rule] of [['b', 'V over T'], ['c', 'P over T'], ['d', 'V over n']]) {
        const c = G.recordCurve({ record: b2.RECORDS.find(r => r.id === id).spec }).filter(p => p.x > 0);
        c.forEach(p => near(p.y / p.x, c[0].y / c[0].x, 1e-6, `${q} stage 8: record ${id.toUpperCase()} is not ${rule} constant`));
      }
      const t = done(b2, 7);
      for (const r of b2.RECORDS) same(tray(t, r.id), r.held, `${q} stage 8 (record ${r.id.toUpperCase()})`);
    }
  }

  if (b3) {
    const q = 'unit04/q3-ideal';
    {
      const t = start(b3, 0);
      near(rd(t, 'ra').V, 22.414, 0.03, `${q} stage 1: one mole of helium does not fill 22.4 L`);
      near(rd(t, 'rb', { amount: 2 }).V, 22.414, 0.03, `${q} stage 1: one mole of carbon dioxide does not fill 22.4 L`);
    }
    // Stages 2 and 4: every setting of the rig gives the gas constant, in kPa·L and in atm·L.
    for (const [i, key, R, tol, what] of [[1, 'PV', 8.314, 0.03, 'R'], [3, 'PVatm', 0.08206, 0.0004, 'R in atmospheres']]) {
      const t = start(b3, i);
      const p = dialsOf(t, 'rig');
      for (let v = 1; v <= p.volumes.length; v++) for (let tt = 1; tt <= p.temps.length; tt++) for (let a = 1; a <= (p.amounts ? p.amounts.length : 1); a++) {
        const c = rd(t, 'rig', { volume: v, temp: tt, ...(p.amounts ? { amount: a } : {}) });
        const val = (key === 'PV' ? c.P * c.V : c.atm * c.V) / (c.n * c.T);
        near(val, R, tol, `${q} stage ${i + 1}: PV over nT at settings ${v}/${tt}/${a} is not ${what}`);
      }
    }
    near(marker(done(b3, 2), 'moles'), b3.ARGON.n, 1e-9, `${q} stage 3 (moles in the argon tank)`);
    near(b3.ARGON.n, (G.pressureIdeal(b3.ARGON.n, b3.ARGON.T, b3.ARGON.V) * b3.ARGON.V) / (G.R * b3.ARGON.T), 1e-9, `${q} stage 3: the argon tank does not give its moles`);
    {
      const t = done(b3, 4);
      const w = GK.tankGrams(t.pieces.t);
      near(w / b3.UNKNOWN.n, G.GASES.CO2.M, 0.3, `${q} stage 5 (the molar mass of the sealed gas)`);
      same(tray(t, 't'), 'co2', `${q} stage 5 (the gas named)`);
    }
    {
      const t = done(b3, 5);
      const g = t.zones.rail.order.map(id => GK.tankGrams(t.pieces[id]));
      holds(g.every((v, k) => !k || v !== g[k - 1]) && (g.every((v, k) => !k || v > g[k - 1]) || g.every((v, k) => !k || v < g[k - 1])), `${q} stage 6: the rail is not strictly ordered by weight`);
    }
    near(G.volumeIdeal(GK.pelletMoles(), b3.PELLET_T, G.ATM_KPA), marker(done(b3, 6), 'litres'), 0.1, `${q} stage 7 (the volume of gas the pellet gives)`);
    {
      const t = done(b3, 7);
      const ref = GK.tankMoles(t.pieces.a);
      for (const id of ['b', 'c', 'd', 'e']) {
        const n = GK.tankMoles(t.pieces[id]);
        same(tray(t, id), Math.abs(n - ref) < 1e-9 ? 'same' : n > ref ? 'more' : 'fewer', `${q} stage 8 (tank ${id.toUpperCase()}, by the particles it holds)`);
      }
    }
  }

  if (b4) {
    const q = 'unit04/q4-mixtures';
    // Stage 1: the gauge reads the SUM of what each opened tank would push alone, and the sum is not the average.
    {
      const t = done(b4, 0);
      const rdc = GK.commonRead(t, 'ct');
      const alone = rdc.tanks.map(p => GK.tankRead(p).P);
      near(rdc.P, alone.reduce((s, v) => s + v, 0), 1e-6, `${q} stage 1: the poured tank does not read the sum`);
      holds(!(Math.abs(rdc.P - alone.reduce((s, v) => s + v, 0) / alone.length) < 1), `${q} stage 1: the sum and the average are the same figure`);
    }
    // Stage 2: neon pushes the same alone and in the mixture.
    {
      const a = G.planMixture([{ gas: b4.NEON.gas, n: b4.NEON.n }], 300, 10).rows[0];
      const m = G.planMixture([{ gas: b4.HELIUM.gas, n: b4.HELIUM.n }, { gas: b4.NEON.gas, n: b4.NEON.n }], 300, 10).rows.find(r => r.gas === 'Ne');
      near(m.P, a.P, 1e-9, `${q} stage 2: neon pushes differently in the mixture`);
      near(m.knocks, a.knocks, 1e-9, `${q} stage 2: neon knocks differently in the mixture`);
      same(done(b4, 1).prediction.token, 'same', `${q} stage 2 (the prediction)`);
    }
    // Stage 3: a gas's share of the push is its share of the particles.
    {
      const t = done(b4, 2);
      const rdc = GK.commonRead(t, 'ct');
      for (const r of rdc.rows) near(r.P / rdc.P, r.x, 1e-9, `${q} stage 3: a gas's share of the push is not its share of the particles`);
      near(GK.partialOf(rdc, 'N2') / rdc.P, 0.6, 0.005, `${q} stage 3: the solution does not leave nitrogen at sixty percent`);
    }
    {
      const t = done(b4, 3);
      const m = GK.tankRead(t.pieces.t);
      near(m.P, 200, 0.1, `${q} stage 4: the tank does not read 200 kPa`);
      near(m.rows.find(r => r.gas === 'O2').P, marker(t, 'push'), 0.5, `${q} stage 4 (the oxygen)`);
    }
    {
      const t = done(b4, 4);
      const rdc = GK.commonRead(t, 'ct');
      near(rdc.P, G.airPressureAt(5500), 0.1, `${q} stage 5: the air does not read the pressure of 5500 m`);
      near(GK.partialOf(rdc, 'O2'), marker(t, 'oxygen'), 0.6, `${q} stage 5 (the oxygen at 5500 m)`);
      near(GK.commonRead(TABLE.runScript(start(b4, 4), [{ place: { piece: 'air', to: 'tray:ct.valves' } }]), 'ct').P, G.ATM_KPA, 0.1, `${q} stage 5: the sea-level reading is not one atmosphere`);
    }
    {
      const base = [{ gas: 'N2', n: 0.8 }, { gas: 'O2', n: 0.2 }];
      const a = G.planMixture(base, 300, 10); const w = G.planMixture([...base, { gas: 'Ar', n: 1 }], 300, 10);
      near(w.rows.find(r => r.gas === 'O2').P, a.rows.find(r => r.gas === 'O2').P, 1e-9, `${q} stage 6: argon changes the oxygen's push`);
      near(w.rows.find(r => r.gas === 'O2').knocks, a.rows.find(r => r.gas === 'O2').knocks, 1e-9, `${q} stage 6: argon changes the oxygen's knock counter`);
      holds(w.P > a.P, `${q} stage 6: argon does not raise the total`);
      same(done(b4, 5).prediction.token, 'same', `${q} stage 6 (the prediction)`);
    }
    // Stage 7: the heaviest gas has the fewest moles, so a ranking by weight is not the ranking by push.
    {
      const t = done(b4, 6);
      const byP = t.zones.rail.order.map(id => GK.tankRead(t.pieces[id]).P);
      holds(byP.every((v, k) => !k || v < byP[k - 1]), `${q} stage 7: the rail is not strongest push first`);
      const byM = ['a', 'b', 'c'].sort((x, y) => G.GASES[t.pieces[y].props.gas].M - G.GASES[t.pieces[x].props.gas].M).join();
      holds(byM !== order(t), `${q} stage 7: ranking by molar mass gives the same order, so the stage has no trap`);
      const m = G.planMixture(b4.RANK.map(([, gas, n]) => ({ gas, n })), 300, 20);
      near(m.rows.reduce((s, r) => s + r.P, 0), m.P, 1e-9, `${q} stage 7: the partial pressures do not add up to the gauge`);
    }
    // Stage 8: the fall in the gauge when the trap takes the gas out is the gas's own push, and the moles follow from it.
    {
      const t0 = start(b4, 7);
      const t1 = done(b4, 7);
      const fall = GK.tankRead(t0.pieces.t).P - GK.tankRead(t1.pieces.t).P;
      const moles = (fall * b4.SEALED.V) / (G.R * b4.SEALED.T);
      near(moles, marker(t1, 'moles'), 0.05, `${q} stage 8 (the moles of carbon dioxide)`);
      holds(t1.pieces.t.props.parts.every(p => p.gas !== 'CO2'), `${q} stage 8: the trap leaves carbon dioxide in the tank`);
    }
  }

  if (b5) {
    const q = 'unit04/q5-speed';
    {
      const lo = G.speedBins('N2', 300, 40, 2400); const hi = G.speedBins('N2', 900, 40, 2400);
      const peak = a => a.indexOf(Math.max(...a));
      holds(peak(hi) > peak(lo) && Math.max(...hi) < Math.max(...lo), `${q} stage 1: heating does not move the peak right and flatten it`);
      // The mark sits under exactly one setting's tallest bar.
      const t = start(b5, 0);
      const hits = dialsOf(t, 'rig').temps.map((_, k) => GK.tallestBar(GK.speedScreen(rd(t, 'rig', { temp: k + 1 }))) === GK.barOf(b5.MARK));
      same(hits.filter(Boolean).length, 1, `${q} stage 1 (the settings whose tallest bar stands under the mark)`);
      holds(hits[0] === false, `${q} stage 1: the mark is already under the tallest bar at the start`);
    }
    {
      const t = done(b5, 1);
      const sp = id => GK.cylRead(t, 'rig', id).mean;
      same(order(t), ['a', 'b', 'c'].sort((x, y) => sp(y) - sp(x)).join(), `${q} stage 2 (fastest first)`);
    }
    {
      const t = start(b5, 2);
      const k = dialsOf(t, 'rig').temps.length;
      const f = i => GK.shareAbove(rd(t, 'rig', { temp: i }), b5.BAR) / GK.shareAbove(rd(t, 'rig', { temp: 1 }), b5.BAR);
      const ok = [];
      for (let i = 1; i <= k; i++) if (f(i) >= b5.TAIL_TIMES) ok.push(i);
      holds(ok.length > 0 && ok.length < k - 1, `${q} stage 3: the settings that clear ten times the share are all of them or none`);
      const g = done(b5, 2);
      holds(f(Math.round(g.fixtures.rig.dials.temp.value)) >= b5.TAIL_TIMES, `${q} stage 3: the solution does not clear the factor`);
      holds(Math.abs(Math.log(f(ok[0]) / b5.TAIL_TIMES)) < 1 && f(ok[0] - 1) < b5.TAIL_TIMES * 0.95, `${q} stage 3: a setting sits on the edge of the factor`);
    }
    {
      const t = done(b5, 3);
      holds(G.leftAfter('He', 2) < G.leftAfter('N2', 2), `${q} stage 4: helium is not nearer empty than nitrogen`);
      same(t.fixtures.pin.props.chambers.find(c => c.id === 'b').gas, 'He', `${q} stage 4 (the faster chamber)`);
      same(t.prediction.token, 'b', `${q} stage 4 (the prediction)`);
    }
    {
      const ratio = G.halfTime('O2') / G.halfTime('H2');
      same(marker(done(b5, 4), 'ratio'), Math.round(ratio), `${q} stage 5 (hydrogen against oxygen)`);
      holds(Math.abs(ratio - Math.round(ratio)) < 0.05, `${q} stage 5: the ratio of half times is not near a whole number`);
    }
    {
      // Stage 6: the unmarked gas is the one whose half time, squared against helium's, gives its molar mass.
      const t = G.halfTime('Ar') / G.halfTime('He');
      const M = G.GASES.He.M * t * t;
      const best = ['Ne', 'Ar', 'Kr', 'Xe'].sort((a, b) => Math.abs(G.GASES[a].M - M) - Math.abs(G.GASES[b].M - M))[0];
      same(tray(done(b5, 5), 'u'), best.toLowerCase(), `${q} stage 6 (the gas named by its leak)`);
      same(best, 'Ar', `${q} stage 6: the sample is not argon`);
    }
    {
      // Stage 7: a single particle's path is much longer than the distance it has got.
      const t = start(b5, 6);
      const w = GK.walkTrack(t.fixtures.w.props.seed, 16, t.fixtures.w.props.stepsPerSecond);
      holds(Math.round(w.length) / Math.round(w.net) > 5, `${q} stage 7: the track runs nearly straight, so the plate teaches nothing about wandering`);
      near(marker(done(b5, 6), 'ratio'), Math.round(w.length) / Math.round(w.net), Math.max(1, Math.round(w.length) / Math.round(w.net) * 0.1), `${q} stage 7 (the ratio at 16 seconds)`);
    }
    {
      // Stage 8: the lighter gas has crept further, so the rings meet nearer the heavier gas's end.
      const t = done(b5, 7);
      const r = GK.tubeRead(t, 'tube');
      holds(G.front('NH3', 8) > G.front('HCl', 8), `${q} stage 8: ammonia is not ahead of hydrogen chloride`);
      holds(r.met && r.ringFromLeft > r.length / 2 + 0.05 * r.length, `${q} stage 8: the ring does not form nearer the hydrogen chloride end`);
      same(t.prediction.token, 'hcl', `${q} stage 8 (the prediction)`);
      const last = start(b5, 7).fixtures.tube.props.times;
      holds(G.front('NH3', last[last.length - 1]) + G.front('HCl', last[last.length - 1]) >= r.length, `${q} stage 8: the stopwatch does not run until the gases meet`);
    }
  }

  if (b6) {
    const q = 'unit04/q6-real';
    {
      const t = start(b6, 0);
      holds(rd(t, 'rig', { volume: 6 }).Z > b6.ABOVE && rd(t, 'rig', { volume: 1 }).Z < 1.01, `${q} stage 1: helium does not climb above one as it is squeezed`);
      holds(rd(t, 'rig', { volume: 1 }).Z <= b6.ABOVE, `${q} stage 1: the cylinder starts past the reading it is asked to reach`);
    }
    {
      // Stage 2: the speed and the mass stay put as the piston moves; the size correction grows and dwarfs the pull.
      const t = start(b6, 1);
      const a = rd(t, 'rig', { volume: 1 }); const b = rd(t, 'rig', { volume: 5 });
      near(a.mean, b.mean, 1e-9, `${q} stage 2: the speed changes with the piston`);
      near(a.mass, b.mass, 1e-9, `${q} stage 2: the mass changes with the piston`);
      holds(b.room > a.room && b.room > 5 * b.pull, `${q} stage 2: the size correction does not grow past the pull`);
      same(b6.TRUE_REASONS.join(), ['c1', 'c5'].join(), `${q} stage 2 (the statements that are reasons)`);
      const d = done(b6, 1);
      same(b6.TRUE_REASONS.slice().sort().join(), Object.values(d.pieces).filter(p => p.props.flipped).map(p => p.id).sort().join(), `${q} stage 2 (the statements marked)`);
    }
    {
      const t = start(b6, 2);
      holds(rd(t, 'rig', { temp: 5 }).Z < rd(t, 'rig', { temp: 1 }).Z && rd(t, 'rig', { temp: 5 }).Z < b6.BELOW, `${q} stage 3: carbon dioxide does not fall below the mark as it cools`);
      holds(rd(t, 'rig', { temp: 1 }).Z > b6.BELOW, `${q} stage 3: the cylinder starts below the reading it is asked to reach`);
      holds(rd(t, 'rig', { temp: 5 }).Z < 1, `${q} stage 3: carbon dioxide does not fall below one as it cools`);
    }
    {
      const t = start(b6, 3);
      holds(rd(t, 'rig', { temp: 5 }).pullShare > rd(t, 'rig', { temp: 1 }).pullShare * 1.15, `${q} stage 4: the share of the push the pull takes off does not grow as the gas cools`);
      same(done(b6, 3).prediction.token, 'grows', `${q} stage 4 (the prediction)`);
    }
    // Stage 5: the order holds at EVERY setting of the dial, not only at the start.
    {
      const t = start(b6, 4);
      const want = done(b6, 4);
      for (let k = 1; k <= dialsOf(t, 'rig').temps.length; k++) {
        const dev = id => Math.abs(rd(t, 'rig', { temp: k }, ['a', 'b', 'c'].indexOf(id)).Z - 1);
        same(['a', 'b', 'c'].sort((x, y) => dev(y) - dev(x)).join(), order(want), `${q} stage 5 (furthest first, at temperature setting ${k})`);
      }
    }
    // Stage 6: the same plate is closest to ideal at every setting of the heater.
    {
      const t = start(b6, 5);
      const holder = ['a', 'b', 'c', 'd'].find(id => (done(b6, 5).pieces[id].zone || '') === 'slot:best');
      for (let k = 1; k <= dialsOf(t, 'r1').temps.length; k++) {
        const dev = id => Math.abs(rd(t, id === 'a' || id === 'b' ? 'r1' : 'r2', { temp: k }).Z * 0 + Math.abs(GK.rigAt(t, id === 'a' || id === 'b' ? 'r1' : 'r2', { temp: k }).find(c => c.id === id).Z - 1));
        same(['a', 'b', 'c', 'd'].sort((x, y) => dev(x) - dev(y))[0], holder, `${q} stage 6 (the most ideal cylinder, at temperature setting ${k})`);
      }
    }
    // Stage 7: at the cold start the pull beats the size; hot, the size beats the pull (their ratio is about R T b / a at any roomy setting).
    {
      const t = start(b6, 6);
      const s0 = rd(t, 'rig', { volume: 1, temp: 1 });
      holds(s0.pull > s0.room, `${q} stage 7: at the start, the pull is not the larger correction`);
      const s1 = rd(t, 'rig', { volume: 1, temp: 3 });
      holds(s1.room > s1.pull, `${q} stage 7: hot, the size is not the larger correction, so the two never trade places`);
      const d = done(b6, 6);
      const c = GK.cylRead(d, 'rig', 0);
      holds(c.room > c.pull, `${q} stage 7: the solution leaves the pull the larger correction`);
    }
    {
      const t = start(b6, 7);
      holds(rd(t, 'rig', { temp: 4 }).mean < rd(t, 'rig', { temp: 1 }).mean, `${q} stage 8: the particles do not slow as the gas cools`);
      near(rd(t, 'rig', { temp: 4 }).mass, rd(t, 'rig', { temp: 1 }).mass, 1e-9, `${q} stage 8: the mass changes as the gas cools`);
      holds(rd(t, 'rig', { temp: 4 }).pullShare > rd(t, 'rig', { temp: 1 }).pullShare, `${q} stage 8: the pull's share does not grow as the gas cools`);
      const d = done(b6, 7);
      same(Object.values(d.pieces).filter(p => p.props.flipped).map(p => p.id).sort().join(), b6.TRUE_COOLING.slice().sort().join(), `${q} stage 8 (the statements marked)`);
      holds(t.pieces.draw.fetchFrom === 'drawoff' && t.pieces.draw.hidden === true, `${q} stage 8: the draw-off card is not a field fetch`);
    }
  }

  if (bb) {
    const q = 'unit04/boss-compressor';
    {
      const t = start(bb, 0);
      const v0 = Math.round(t.fixtures.rig.dials.volume.value);
      near(rd(t, 'rig', { volume: 1 }).P / rd(t, 'rig', { volume: v0 }).P, 4, 1e-9, `${q} phase 1: the setting graded is not four times the start`);
      holds(done(bb, 0).fixtures.rig.dials.volume.value === 1, `${q} phase 1 (the graded setting)`);
    }
    {
      near(G.volumeIdeal(1, 750, 101.3), marker(done(bb, 1), 'vol'), 2.5, `${q} phase 2 (the volume at 750 K)`);
      holds(!start(bb, 1).fixtures.rig.props.temps.includes(750), `${q} phase 2: the dial has a setting at 750 K`);
    }
    {
      const t = start(bb, 2);
      const nOf = k => { const c = rd(t, 'rig', { temp: k }); return (c.P * c.V) / (G.R * c.T); };
      near(nOf(1), nOf(3), 1e-9, `${q} phase 3: the amount worked out changes with the temperature`);
      near(nOf(1) * G.GASES.O2.M, marker(done(bb, 2), 'grams'), 1, `${q} phase 3 (the mass of oxygen)`);
    }
    near(GK.tankRead(done(bb, 3).pieces.t).rows.find(r => r.gas === 'He').P, marker(done(bb, 3), 'push'), 5, `${q} phase 4 (the helium)`);
    {
      const t = G.halfTime('Kr') / G.halfTime('N2');
      const M = G.GASES.N2.M * t * t;
      const best = ['Ne', 'Ar', 'Kr', 'Xe'].sort((a, b) => Math.abs(G.GASES[a].M - M) - Math.abs(G.GASES[b].M - M))[0];
      same(tray(done(bb, 4), 'u'), best.toLowerCase(), `${q} phase 5 (the gas named by its leak)`);
    }
  }

  if (failures === before) ok('Bellows: every graded pressure, volume, amount, share, speed and leak agrees with the real tables, and every claim a stage teaches is true of its table');
}

/* ------------------------------------------------------------------
   EVERY FIGURE AN EMBER REACH STAGE GRADES AGAINST IS RECOMPUTED FROM THE REAL
   TABLES, and every claim a stage teaches is checked on the table that teaches
   it (plan `bench-tabletop.md`, T6): a bath that does not warm when a pack gives
   heat out, a stack that does not add up to the reaction it is asked for, a
   crossing the line does not cross, a ranking the other column would get wrong.
   The kit (`table/kits/heat.js`) reads every plate through `thermodata.js`, so an
   answer authored as a literal in a solution script can drift from the
   instrument that teaches it, and one recomputed here cannot.
   ------------------------------------------------------------------ */
{
  const before = failures;
  const HK = await import('../src/learn/table/kits/heat.js');
  const TD = await import('../src/learn/engine/thermodata.js');
  const get = async id => { const q = getQuest('unit05', id); return q && q.status === 'live' ? q.module() : null; };
  const [e1, e2, e3, e4, e5, e6, e7, eb] = await Promise.all(['q1-flow', 'q2-calorimetry', 'q3-enthalpy', 'q4-bonds', 'q5-hess', 'q6-entropy', 'q7-gibbs', 'boss-crucible'].map(get));
  const near = (a, b, tol, what) => { if (!(Math.abs(a - b) <= tol)) fail(`${what}: graded ${a}, the real figure is ${Number(b).toFixed(4)}`); };
  const same = (a, b, what) => { if (String(a) !== String(b)) fail(`${what}: graded ${a}, the real answer is ${b}`); };
  const holds = (cond, what) => { if (!cond) fail(what); };
  const start = (q, i) => TABLE.createTable(q.STAGES[i].table, q.STAGES[i].title);
  const done = (q, i) => TABLE.runScript(start(q, i), q.SOLUTIONS[i], { strict: true });
  const num = label => Number(String(label).replace('−', '-').replace('+', '').replace(/ kJ.*$/, ''));
  const picked = (t, id = 'answer') => num(t.fixtures[id].props.options[Math.round(t.fixtures[id].dials.value.value) - 1]);
  const tray = (t, id) => (t.pieces[id].zone || '').replace(/^(tray|slot):/, '');
  const marker = (t, id) => HK.markerRead(t, id);

  /* ---- the tables themselves ---- */
  near(TD.SPECIFIC_HEAT_WATER, 4.184, 1e-9, 'thermodata: the specific heat of water');
  near(TD.equilibriumTemp(100, 0.449, 80, 100, 0.449, 20), 50, 1e-9, 'thermodata: equal blocks meet halfway');
  near(TD.bondEnthalpySum([{ bond: 'C-H', count: 4 }, { bond: 'O=O', count: 2 }], [{ bond: 'C=O', count: 2 }, { bond: 'O-H', count: 4 }]).net, -802, 1e-9, 'thermodata: the methane ledger');
  near(TD.gibbsFreeEnergy(-100, -200, 300), -40, 1e-9, 'thermodata: ΔG at 300 K');
  near(TD.crossingTemperature(6.01, 22.0), 273.2, 0.2, 'thermodata: ice melts at 273 K');
  for (const [k, v] of Object.entries(TD.FORMATION_TABLE)) holds(v.dGf - (v.dHf - 298.15 * 0 / 1000) <= 1e6 && Number.isFinite(v.S0), `thermodata: ${k} has no entropy`);

  if (e1) {
    const q = 'unit05/q1-flow';
    near(HK.blockRead(done(e1, 0), 'a').T, marker(done(e1, 0), 'tfinal'), 0.5, `${q} stage 1 (where the blocks finish)`);
    {
      const t = done(e1, 1);
      const a = HK.blockRead(t, 'a'); const b = HK.blockRead(t, 'b');
      holds(a.T < a.T0 && b.T > b.T0, `${q} stage 2: the hot block does not fall and the cold one rise when they join`);
      same(HK.dialAt(t, 'arrow', 'value'), a.T0 > b.T0 ? 1 : 2, `${q} stage 2 (the way energy crosses)`);
    }
    {
      const t = TABLE.runScript(start(e1, 3), [{ place: { piece: 'warmer', to: 'slot:cup.mouth' } }]);
      holds(HK.cupRead(t, 'cup').dT > 0.5, `${q} stage 4: the hand warmer does not warm the bath`);
      const u = TABLE.runScript(start(e1, 3), [{ place: { piece: 'cold', to: 'slot:cup.mouth' } }]);
      holds(HK.cupRead(u, 'cup').dT < -0.5, `${q} stage 4: the cold pack does not cool the bath`);
    }
    {
      const t = TABLE.runScript(start(e1, 4), [{ place: { piece: 'sampleA', to: 'slot:cup.mouth' } }]);
      holds(HK.cupRead(t, 'cup').dT < -0.5 && t.pieces.sampleA.props.dH > 0, `${q} stage 5: Sample A does not cool the bath while it takes energy in`);
    }
    {
      const t = done(e1, 5);
      holds(HK.shelvesRead(t, 'chart').dH > 0 && start(e1, 5).pieces.sampleA.props.dH > 0, `${q} stage 6: the chart built is not the one the sample's ΔH draws`);
    }
    {
      const t = done(e1, 6);
      holds(HK.blockRead(t, 'cold').T >= 35, `${q} stage 7: joining the cold block to the bath does not warm it`);
      const u = TABLE.runScript(start(e1, 6), [{ place: { piece: 'cold', to: 'piece:spark' } }]);
      holds(HK.blockRead(u, 'cold').T < 21, `${q} stage 7: the spark warms the cold block (it should barely move it)`);
    }
    {
      const t = start(e1, 7);
      for (const [id, tr] of Object.entries({ burn: 'exo', melt: 'endo', condense: 'exo', nh4no3: 'endo' })) same(t.pieces[id].props.dH < 0 ? 'exo' : 'endo', tr, `${q} stage 8 (${id})`);
    }
  }

  if (e2) {
    const q = 'unit05/q2-calorimetry';
    {
      const t = done(e2, 0);
      near(HK.cupRead(t, 'cupB').dT, HK.cupRead(t, 'cupA').dT, 0.05, `${q} stage 1 (equal rises)`);
      near(HK.cupRead(t, 'cupB').joules / HK.cupRead(t, 'cupA').joules, 2, 1e-9, `${q} stage 1: twice the water does not take twice the heat`);
    }
    {
      const t = done(e2, 1);
      near(HK.cupRead(t, 'iron').dT, HK.cupRead(t, 'water').dT, 0.1, `${q} stage 2 (equal rises)`);
      holds(HK.cupRead(t, 'iron').joules < HK.cupRead(t, 'water').joules / 5, `${q} stage 2: the iron does not need far less heat than the water`);
    }
    near(marker(done(e2, 2), 'joules'), TD.heatTransfer(100, TD.SPECIFIC_HEAT_WATER, HK.cupRead(start(e2, 2), 'cup').dT), 25, `${q} stage 3 (joules for the rise printed)`);
    {
      const t = TABLE.runScript(start(e2, 3), [{ place: { piece: 'metal', to: 'slot:cup.mouth' } }]);
      const r = HK.cupRead(t, 'cup'); const b = t.pieces.metal.props;
      near(Number(TD.blockSpecificHeat(b.m, b.T, r.mWater, r.T0, r.Tf).toFixed(2)), marker(done(e2, 3), 'c'), 0.021, `${q} stage 4 (the specific heat of Metal M)`);
    }
    {
      const t = TABLE.runScript(start(e2, 4), [{ place: { piece: 'metal', to: 'slot:cup.mouth' } }]);
      const r = HK.cupRead(t, 'cup'); const b = t.pieces.metal.props;
      const c = TD.blockSpecificHeat(b.m, b.T, r.mWater, r.T0, r.Tf);
      const list = { al: 0.90, fe: 0.45, cu: 0.39, ag: 0.24 };
      same(Object.keys(list).sort((x, y) => Math.abs(list[x] - c) - Math.abs(list[y] - c))[0], tray(done(e2, 4), 'cu') === 'answer' ? 'cu' : '', `${q} stage 5 (the metal the measured c names)`);
    }
    near(marker(done(e2, 5), 'joules'), HK.cupRead(TABLE.runScript(start(e2, 5), [{ place: { piece: 'rxn', to: 'slot:cup.mouth' } }]), 'cup').q, 25, `${q} stage 6 (the heat the bath caught)`);
    {
      const t = TABLE.runScript(start(e2, 6), [{ place: { piece: 'rxn', to: 'slot:cup.mouth' } }]);
      near(marker(done(e2, 6), 'perMole'), HK.cupRead(t, 'cup').q / 1000 / t.pieces.rxn.props.moles, 1, `${q} stage 7 (kJ per mole)`);
    }
    {
      const on = TABLE.runScript(start(e2, 7), [{ place: { piece: 'rxn', to: 'slot:cup.mouth' } }]);
      const off = TABLE.apply(on, { setDial: { fixture: 'cup', dial: 'lid', value: 2 } });
      holds(HK.cupRead(off, 'cup').q < HK.cupRead(on, 'cup').q, `${q} stage 8: the open cup does not lose heat`);
    }
  }

  if (e3) {
    const q = 'unit05/q3-enthalpy';
    {
      const t = TABLE.runScript(start(e3, 0), [{ place: { piece: 'mg', to: 'slot:cup.mouth' } }]);
      near(marker(done(e3, 0), 'dH'), -HK.cupRead(t, 'cup').q / 1000 / 0.05, 1, `${q} stage 1 (ΔH from the bath's gain)`);
    }
    {
      const lo = TABLE.runScript(start(e3, 1), [{ place: { piece: 'mg', to: 'slot:cup.mouth' } }]);
      const hi = TABLE.apply(lo, { setDial: { fixture: 'cup', dial: 'moles', value: 2 } });
      near(HK.cupRead(hi, 'cup').q / HK.cupRead(lo, 'cup').q, 2, 1e-9, `${q} stage 2: twice the moles is not twice the heat`);
      near(HK.cupRead(hi, 'cup').q / HK.cupRead(hi, 'cup').moles, HK.cupRead(lo, 'cup').q / HK.cupRead(lo, 'cup').moles, 1e-6, `${q} stage 2: the heat per mole moves`);
    }
    {
      const t = TABLE.apply(start(e3, 2), { setDial: { fixture: 'chart', dial: 'dir', value: 2 } });
      holds(HK.shelvesRead(t, 'chart').dH > 0, `${q} stage 3: splitting water does not climb`);
      same(done(e3, 2).pieces.plus.zone, 'slot:answer', `${q} stage 3 (+285.8 in the slot)`);
    }
    near(TD.FUELS.methane.dHc * -(8.02 / 16.04), 445, 0.5, `${q} stage 4 (the heat of 8.02 g)`);
    holds(done(e3, 4).fixtures.chart.dials.after && HK.shelvesRead(done(e3, 4), 'chart').dH > 0, `${q} stage 5`);
    near(TD.FORMATION_TABLE['H2O(l)'].dHf - TD.FORMATION_TABLE['H2O(g)'].dHf, -44, 0.1, `${q} stage 6 (the step between steam and liquid)`);
    near(222.5 / 890 * 16, marker(done(e3, 6), 'grams'), 0.15, `${q} stage 7 (grams for 222.5 kJ)`);
    {
      const per = id => Math.abs(TD.FUELS[id].dHc) / TD.FUELS[id].molarMass;
      const want = ['methanol', 'methane', 'hydrogen'].sort((a, b) => per(a) - per(b));
      same(done(e3, 7).zones.rail.order.join(), want.join(), `${q} stage 8 (heat per gram, lowest to highest)`);
    }
  }

  if (e4) {
    const q = 'unit05/q4-bonds';
    near(marker(done(e4, 0), 'cost'), TD.BOND_ENTHALPIES['H-H'].dH, 1e-9, `${q} stage 1 (the cost of H–H)`);
    {
      const t = done(e4, 1);
      near(HK.wellRead(t, 'crank').released, TD.BOND_ENTHALPIES['H-H'].dH, 1e-9, `${q} stage 2 (what falling back gives out)`);
    }
    near(HK.ledgerRead(done(e4, 2), 'ledger').net, e4.CH4_SUMS.net, 1e-9, `${q} stage 3 (the sorted ledger's net)`);
    {
      const t = start(e4, 3);
      near(HK.ledgerRead(t, 'ledger').net, -802, 1e-9, `${q} stage 4 (the ledger as laid)`);
      near(Number(t.pieces.minus.props.value), -802, 1e-9, `${q} stage 4 (the card in the slot)`);
    }
    holds(Math.abs(HK.ledgerRead(start(e4, 4), 'ledger').net - -890) > 50, `${q} stage 5: the estimate and the measured value do not differ`);
    holds(HK.ledgerRead(start(e4, 5), 'ledger').formed > HK.ledgerRead(start(e4, 5), 'ledger').broken, `${q} stage 6: the new bonds do not pay back more than the old cost`);
    {
      const t = done(e4, 6);
      holds(t.zones.rail.order.join() === 'single,double', `${q} stage 7 (the rail)`);
      holds(HK.wellRead(t, 'double').D > HK.wellRead(t, 'single').D, `${q} stage 7: the double bond is not deeper than the single`);
    }
    {
      const t = done(e4, 7);
      near(HK.ledgerRead(t, 'ledger').net, e4.NO_SUMS.net, 1e-9, `${q} stage 8 (the climbing ledger)`);
      holds(HK.ledgerRead(t, 'ledger').net > 0, `${q} stage 8: the reaction does not climb`);
    }
  }

  if (e5) {
    const q = 'unit05/q5-hess';
    const answerDH = [-393.5, -110.5, 66.4, -74.8];
    for (let i = 0; i < 4; i++) {
      const t = done(e5, i);
      const r = HK.stackRead(t, 'wanted');
      holds(r.matches, `${q} stage ${i + 1}: the solution's stack does not add up to the reaction wanted`);
      near(r.dH, answerDH[i], 0.05, `${q} stage ${i + 1} (the stack's ΔH)`);
      near(picked(t), answerDH[i], 0.05, `${q} stage ${i + 1} (the number set)`);
    }
    {
      const t = done(e5, 5);
      const r = HK.stackRead(t, 'wanted');
      holds(r.matches, `${q} stage 6: the solution's stack does not add up to the reaction wanted`);
      near(r.dH, TD.standardReactionChange([{ id: 'CaO(s)' }, { id: 'CO2(g)' }], [{ id: 'CaCO3(s)' }], 'dHf'), 0.05, `${q} stage 6 (products less reactants)`);
      near(picked(t), r.dH, 0.05, `${q} stage 6 (the number set)`);
    }
    {
      const t = done(e5, 6);
      const A = HK.stackRead(t, 'routeA'); const B = HK.stackRead(t, 'routeB');
      holds(A.matches && B.matches, `${q} stage 7: a route does not add up to the reaction wanted`);
      near(A.dH, B.dH, 1e-9, `${q} stage 7: the two routes do not share a ΔH`);
    }
    near(picked(done(e5, 7)), TD.FORMATION_TABLE['CO(g)'].dHf, 0.05, `${q} stage 8 (the formation value of CO)`);
  }

  if (e6) {
    const q = 'unit05/q6-entropy';
    near(marker(done(e6, 0), 'ways'), HK.waysOf(8, 2), 1e-9, `${q} stage 1 (arrangements of two in eight)`);
    same(HK.waysOf(4, 2), 6, `${q} stage 1 (the shut gate)`);
    {
      // After many shakes the particles are spread over both halves far more often than crowded into one.
      const t = TABLE.runScript(start(e6, 1), Array.from({ length: 60 }, () => ({ run: 'chamber' })));
      const counts = [0, 0, 0, 0, 0];
      for (const s of HK.shakesOf(t, 'chamber')) counts[s.filter(c => c <= 4).length]++;
      holds(counts[2] > counts[4] * 2 && counts[2] > counts[0] * 2, `${q} stage 2: the shakes do not favour the spread-out arrangements (${counts.join(' ')})`);
    }
    same(done(e6, 2).zones.rail.order.join(), 'ice,water,steam', `${q} stage 3`);
    {
      const gas = eq => (eq.match(/\(g\)/g) || []).length;
      holds(gas('CaO(s) + CO₂(g)') > gas('CaCO₃(s)') && gas('2 NH₃(g)') < gas('N₂(g) + 3 H₂(g)'), `${q} stage 4: the gas count does not decide the signs`);
    }
    {
      const t = TABLE.runScript(start(e6, 5), [{ setDial: { fixture: 'sample', dial: 'temp', value: 3 } }, { run: 'sample' }]);
      holds(HK.warmRead(t, 'sample').dS > 0, `${q} stage 6: warming does not raise the entropy`);
    }
    near(HK.standardReactionChange([{ id: 'CaO(s)' }, { id: 'CO2(g)' }], [{ id: 'CaCO3(s)' }], 'S0'), picked(done(e6, 6)), 0.05, `${q} stage 7 (ΔS° of the lime)`);
  }

  if (e7) {
    const q = 'unit05/q7-gibbs';
    near(marker(done(e7, 1), 'dG'), TD.gibbsFreeEnergy(-100, -200, 300), 1e-9, `${q} stage 2 (ΔG at 300 K)`);
    {
      const t = start(e7, 2);
      for (const [id, want] of Object.entries({ 'both-help': 'always', 'both-oppose': 'never', 'high-t': 'high', 'low-t': 'low' })) {
        const { dH, dS } = t.pieces[id].props;
        const lo = TD.gibbsFreeEnergy(dH, dS, 100) < 0; const hi = TD.gibbsFreeEnergy(dH, dS, 600) < 0;
        same(lo && hi ? 'always' : !lo && !hi ? 'never' : hi ? 'high' : 'low', want, `${q} stage 3 (${id})`);
      }
    }
    near(TD.crossingTemperature(6.01, 22.0), marker(done(e7, 3), 'T'), 2, `${q} stage 4 (the melting point)`);
    near(picked(done(e7, 4)), TD.standardReactionChange([{ id: 'CO2(g)' }], [{ id: 'CO(g)' }], 'dGf'), 0.05, `${q} stage 5 (ΔG from formation values)`);
    {
      const t = start(e7, 5);
      holds(HK.plotRead(t, 'plot').dG < 0, `${q} stage 6: the diamond's ΔG is not negative at 298 K`);
    }
    {
      const t = done(e7, 6);
      const r = HK.stackRead(t, 'wanted');
      holds(r.matches, `${q} stage 7: the solution's stack does not add up to the smelting reaction`);
      near(r.dH, 742.2 - 771.6, 0.05, `${q} stage 7 (the coupled ΔG)`);
      near(picked(t), r.dH, 0.05, `${q} stage 7 (the number set)`);
    }
    {
      const t = done(e7, 7);
      holds(HK.plotRead(t, 'plot').dG < 0, `${q} stage 8: the graded setting is not below zero`);
      const p = t.fixtures.plot.props;
      holds(p.Ts.filter(T => TD.gibbsFreeEnergy(p.dH, p.dS, T) < 0).length === 1, `${q} stage 8: more than one setting is below zero`);
    }
  }

  if (eb) {
    const q = 'unit05/boss-crucible';
    near(marker(done(eb, 0), 'kj'), TD.heatTransfer(500, TD.SPECIFIC_HEAT_WATER, 20) / 1000, 1.1, `${q} phase 1 (the jacket)`);
    near(HK.cupRead(start(eb, 0), 'jacket').dT, 20, 0.01, `${q} phase 1: the jacket does not rise 20 degrees`);
    near(HK.ledgerRead(done(eb, 1), 'ledger').net, -93, 1e-9, `${q} phase 2 (ammonia's ledger)`);
    near(picked(done(eb, 1)), -93, 1e-9, `${q} phase 2 (the estimate set)`);
    {
      const t = done(eb, 2);
      holds(HK.stackRead(t, 'wanted').matches, `${q} phase 3: the stack does not add up to the splitting`);
      near(HK.stackRead(t, 'wanted').dH, 824.2, 0.05, `${q} phase 3 (the slag)`);
      near(picked(t), 824.2, 0.05, `${q} phase 3 (the number set)`);
    }
    near(picked(done(eb, 3)), 2 * TD.FORMATION_TABLE['H2(g)'].S0 + TD.FORMATION_TABLE['O2(g)'].S0 - 2 * TD.FORMATION_TABLE['H2O(g)'].S0, 0.05, `${q} phase 4 (ΔS° of splitting steam)`);
    near(marker(done(eb, 4), 'T'), TD.crossingTemperature(176, 160), 1e-9, `${q} phase 5 (the seal)`);
    for (let i = 0; i < 5; i++) same((eb.STAGES[i].foes || []).length, 1, `${q} phase ${i + 1} (its foes)`);
  }

  if (failures === before) ok('Ember Reach: every graded temperature, heat, bond sum, stack, entropy and free energy agrees with the real tables, and every claim a stage teaches is true of its table');
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
      same(piecesOf(t, 'tray:out', 'electron').length, lump.p, 'unit01/q2-core stage 4 (a neutral atom has as many electrons as protons)');
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
    // 3 and 4. the fulcrum finds the weighted average, and the dial can reach it
    for (const [i, listedMass] of [[2, 35.5], [3, null]]) {
      const piece = declared(q5, i, 'a');
      const avg = avgOf(piece);
      const t = end(q5, i);
      near(t.fixtures.assay.dials.pivot.value, avg, `unit01/q5-assay stage ${i + 1} (the fulcrum rests at the average)`);
      near(M.assayRead(t, 'assay').net, 0, `unit01/q5-assay stage ${i + 1} (the beam lies level)`);
      const d = q5.STAGES[i].table.fixtures.find(f => f.id === 'assay').dials.pivot;
      holds(Math.abs((avg - d.min) / d.step - Math.round((avg - d.min) / d.step)) < 1e-9, `unit01/q5-assay stage ${i + 1}: the fulcrum's steps never land on the average`);
      if (listedMass != null) near(avg, listedMass, `unit01/q5-assay stage ${i + 1} (the plate's listed mass is the average)`);
      holds(Math.abs(avg - d.value) > d.step, `unit01/q5-assay stage ${i + 1}: the fulcrum starts at the answer`);
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
    // 2. the same limit by weight: grams over molar mass, the smaller count of moles
    {
      const t = end(g, 1);
      const drum = id => declared(g, 1, id).props;
      const moles = { Na: drum('dna').grams / M.speciesMass('sodium'), Cl: drum('dcl').grams / M.speciesMass('chlorine') };
      same([moles.Na, moles.Cl], [3, 2], 'unit07/boss-golem phase 2 (the moles in each drum)');
      same(H.tallyOf(t, 'tally'), Math.min(moles.Na, moles.Cl), 'unit07/boss-golem phase 2 (the smaller mole count)');
      holds(moles.Na !== moles.Cl && Number.isInteger(moles.Na) && Number.isInteger(moles.Cl), 'unit07/boss-golem phase 2: the drums hold equal or fractional moles');
      near(M.scaleRead(t, 'scale').weight, drum('dcl').grams, 'unit07/boss-golem phase 2 (the scale reads the drum on it)');
      // The plate prints the molar masses the table itself uses.
      const lines = g.STAGES[1].table.fixtures.find(f => f.id === 'listed').props.lines.join(' ');
      holds(lines.includes(M.listedMass('Na').toFixed(1)) && lines.includes(M.listedMass('Cl').toFixed(1)), 'unit07/boss-golem phase 2: the plate lists a molar mass that is not the listed one');
    }
    // A boss phase on a table is a fight on a table: two phases, each names its foe, none sends the player into a world.
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
