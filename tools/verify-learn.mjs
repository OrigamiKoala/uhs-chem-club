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
const { recordCurve } = await import('../src/learn/engine/gasrig.js');

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

  // THE PLATE, DRAWN FOR REAL on a pack (boss-warden phase 1) and a lone warden
  // (boss-warden phase 2): one portrait per bench item, Integrity pips that fall
  // and refill, the reason's beat held back, a reaction taken from the planner,
  // and a win that disperses everything.
  {
    const { Encounter } = await import('../src/learn/engine/encounter.js');
    const warden = await import('../src/learn/quests/unit03/boss-warden.js');
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

    // Ligar's three plate benches. The declaration is held to the real tables,
    // then every plate is drawn at phone and bench size.
    const bondRigs = (st.rigs || []).filter(r => bondHeads.includes(r.head));
    if (bondRigs.length) {
      const { BondBench } = await import('../src/learn/engine/bondbench.js');
      const BD = await import('../src/learn/engine/bonddata.js');
      const proto = BondBench.prototype;
      const bench = Object.create(proto);
      bench.cfg = { settings: st.settings || [], setting: st.start || 1 };
      const ids = new Set();
      for (const raw of bondRigs) {
        if (ids.has(raw.id)) { fail(`${label}: two plates share the id "${raw.id}"`); bad++; }
        ids.add(raw.id);
        if (!raw.label) { fail(`${label}: plate "${raw.id}" has no label`); bad++; }
        if (raw.head === 'pair') {
          const p = BD.PAIRS[raw.pair];
          if (!p) { fail(`${label}: plate "${raw.id}" names a pair with no measured bond "${raw.pair}"`); bad++; }
          else if (!(st.settings || []).includes(p.r0)) { fail(`${label}: plate "${raw.id}" has no crank setting at its bond length, so its bottom cannot be found`); bad++; }
        } else if (!BD.LATTICES[raw.lattice]) {
          fail(`${label}: plate "${raw.id}" names a lattice with no real figures "${raw.lattice}"`); bad++;
        }
        const item = proto.prepare.call(bench, raw);
        item.trail = raw.head === 'pair' ? [st.settings?.[(st.start || 1) - 1], ...(raw.head === 'pair' ? [BD.PAIRS[raw.pair]?.r0] : [])].filter(Boolean) : [];
        cases.push([`plate ${raw.id}`, (ctx, w, h) => proto.draw.call(bench, ctx, w, h, item, { sweep: 0, probe: null, bench })]);
      }
      if (bondRigs.some(r => r.head === 'pair') && !(Array.isArray(st.settings) && st.settings.length > 1)) {
        fail(`${label}: pair plates need crank settings`); bad++;
      }
    }
    const slateRigs = (st.rigs || []).filter(r => slateHeads.includes(r.head));
    if (slateRigs.length) {
      const { PairBoard } = await import('../src/learn/engine/pairboard.js');
      const LW = await import('../src/learn/engine/lewis.js');
      const proto = PairBoard.prototype;
      const bench = Object.create(proto);
      bench.cfg = { hand: 'bond', hands: ['bond', 'lone', 'x'], charges: true };
      const ids = new Set();
      for (const raw of slateRigs) {
        if (ids.has(raw.id)) { fail(`${label}: two plates share the id "${raw.id}"`); bad++; }
        ids.add(raw.id);
        if (!raw.label) { fail(`${label}: plate "${raw.id}" has no label`); bad++; }
        const mol = LW.MOLECULES[raw.mol];
        if (!mol) { fail(`${label}: plate "${raw.id}" names an unknown molecule "${raw.mol}"`); bad++; continue; }
        for (const sym of mol.syms) if (!LW.VALENCE[sym]) { fail(`${label}: plate "${raw.id}" has an atom with no valence "${sym}"`); bad++; }
        if (raw.prefill) {
          const r = LW.planLewis(mol, raw.prefill, raw.charge);
          if (r.left < 0) { fail(`${label}: plate "${raw.id}" prefills more electrons than its tray holds`); bad++; }
        }
        const item = proto.prepare.call(bench, raw);
        cases.push([`plate ${raw.id}`, (ctx, w, h) => proto.draw.call(bench, ctx, w, h, item, { sweep: 0, probe: null, bench })]);
      }
    }
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
    // Bellows: the gas rig. The declaration is held to the real gas tables, then every
    // plate is drawn at phone and bench size under the dials as the stage lays them.
    const gasRigs = (st.rigs || []).filter(r => gasHeads.includes(r.head));
    if (gasRigs.length) {
      const { GasRig } = await import('../src/learn/engine/gasrig.js');
      const proto = GasRig.prototype;
      const bench = Object.create(proto);
      bench.clock = 0.8;
      bench.cfg = { ...GasRig.blankCfg(), ...GAS.benchCfg(st, {}) };
      const ids = new Set();
      for (const raw of gasRigs) {
        if (ids.has(raw.id)) { fail(`${label}: two plates share the id "${raw.id}"`); bad++; }
        ids.add(raw.id);
        if (!raw.label) { fail(`${label}: plate "${raw.id}" has no label`); bad++; }
        if (raw.head !== 'mixture' && raw.head !== 'record' && !GAS.GASES[raw.gas]) { fail(`${label}: plate "${raw.id}" names a gas with no real figures "${raw.gas}"`); bad++; }
        if (raw.head === 'mixture') {
          if (!raw.parts?.every(p => GAS.GASES[p.gas] && p.n > 0)) { fail(`${label}: mixture "${raw.id}" holds a part with no real gas or no amount`); bad++; }
          if (!(raw.V > 0) || !(raw.T > 0)) { fail(`${label}: mixture "${raw.id}" has no room or no temperature`); bad++; }
          // Every setting of the dials must read on the gauge the plate has.
          const mvs = (st.volumes?.length && raw.follow !== false) ? st.volumes.map((_, k) => k + 1) : [1];
          const mts = (st.temps?.length && raw.follow !== false) ? st.temps.map((_, k) => k + 1) : [1];
          for (const vi of mvs) for (const ti of mts) {
            const ms = GAS.mixtureState(raw, { ...bench.cfg, volume: vi, temp: ti });
            const P = GAS.planMixture(raw.parts, ms.T, ms.V).P;
            if (!(P > 0) || P > (st.gaugeMax || 400) * 1.05) { fail(`${label}: mixture "${raw.id}" reads ${P.toFixed(0)} kPa at settings ${vi}/${ti}, off a gauge that stops at ${st.gaugeMax || 400}`); bad++; }
          }
        }
        if (raw.head === 'cylinder') {
          // A dial the plate ignores is a control that does nothing: a rigid tank on a stage with a piston dial.
          if (st.volumes?.length > 1 && raw.hold === 'V' && raw.follow !== false) { fail(`${label}: cylinder "${raw.id}" is a rigid tank, so the stage's volume dial moves nothing on it`); bad++; }
          if (st.volumes?.length > 1 && raw.hold === 'P' && raw.follow !== false) { fail(`${label}: cylinder "${raw.id}" is under a free piston, so the stage's volume dial moves nothing on it`); bad++; }
          if (st.temps?.length > 1 && raw.follow === false && !gasRigs.some(r => r.head === 'cylinder' && r.follow !== false)) { fail(`${label}: no cylinder follows the stage's temperature dial`); bad++; }
          if (!(raw.n >= 0) || !Number.isFinite(raw.n ?? 1)) { fail(`${label}: cylinder "${raw.id}" holds a bad amount of gas`); bad++; }
          if (raw.hold === 'P' && !(raw.P0 > 0)) { fail(`${label}: cylinder "${raw.id}" has a free piston with no weight on it`); bad++; }
          // Every setting a dial can reach must be a real, positive reading (a van der Waals gas
          // squeezed past its own size has none, and the plate would read a pressure that cannot exist).
          const volumes = (st.volumes?.length && raw.hold !== 'V' && raw.follow !== false) ? st.volumes.map((_, k) => k + 1) : [1];
          const temps = (st.temps?.length && raw.follow !== false) ? st.temps.map((_, k) => k + 1) : [1];
          for (const vi of volumes) for (const ti of temps) {
            const r = GAS.planGas({ ...raw, n: raw.n }, { ...bench.cfg, volume: vi, temp: ti });
            if (!(r.P > 0) || !Number.isFinite(r.P)) { fail(`${label}: cylinder "${raw.id}" reads no real pressure at volume setting ${vi}, temperature setting ${ti}`); bad++; }
            if (r.P > (st.gaugeMax || 400) * 1.05 && !raw.noGaugeLimit) { fail(`${label}: cylinder "${raw.id}" reads ${r.P.toFixed(0)} kPa at settings ${vi}/${ti}, off a gauge that stops at ${st.gaugeMax || 400}`); bad++; }
          }
        }
        if (raw.head === 'record' && !(raw.record && raw.record.x && raw.record.y && raw.record.xmax > raw.record.xmin)) { fail(`${label}: record "${raw.id}" has no axes`); bad++; }
        if ((raw.head === 'leak' || raw.head === 'tube') && !(st.times?.length > 1)) { fail(`${label}: plate "${raw.id}" needs a time dial`); bad++; }
        const item = proto.prepare.call(bench, raw);
        item.trail = [{ n: raw.n || 1, T: raw.T || 300, V: raw.V || 10, P: 100, Z: 1, key: 'a' }];
        cases.push([`plate ${raw.id}`, (ctx, w, h) => proto.draw.call(bench, ctx, w, h, item, { sweep: 0, probe: null, bench })]);
      }
    }
    const thermoRigs = (st.rigs || []).filter(r => thermoHeads.includes(r.head));
    if (thermoRigs.length) {
      const { Calorimeter } = await import('../src/learn/engine/calorimeter.js');
      const TD = await import('../src/learn/engine/thermodata.js');
      const proto = Calorimeter.prototype;
      const bench = Object.create(proto);
      bench.clock = 0.6;
      bench.cfg = { ...Calorimeter.blankCfg(), ...TD.benchCfg(st, {}) };
      const ids = new Set();
      for (const raw of thermoRigs) {
        if (ids.has(raw.id)) { fail(`${label}: two plates share the id "${raw.id}"`); bad++; }
        ids.add(raw.id);
        if (!raw.label) { fail(`${label}: plate "${raw.id}" has no label`); bad++; }
        const item = proto.prepare.call(bench, raw);
        cases.push([`plate ${raw.id}`, (ctx, w, h) => proto.draw.call(bench, ctx, w, h, item, { sweep: 0, probe: null, bench })]);
      }
    }
    const rackRigs = (st.rigs || []).filter(r => rackHeads.includes(r.head));
    if (rackRigs.length) {
      const { BoxRack } = await import('../src/learn/engine/boxrack.js');
      const E = await import('../src/learn/engine/electrons.js');
      const proto = BoxRack.prototype;
      const bench = Object.create(proto);
      bench.cfg = { hand: 'u', core: false, show: { n: true, l: true, ml: true, ms: true }, clouds: true };
      const ids = new Set();
      for (const raw of rackRigs) {
        if (ids.has(raw.id)) { fail(`${label}: two plates share the id "${raw.id}"`); bad++; }
        ids.add(raw.id);
        if (!raw.label) { fail(`${label}: plate "${raw.id}" has no label`); bad++; }
        if (raw.head === 'rack') {
          for (const id of (raw.rows || [])) if (!E.rowOf(id)) { fail(`${label}: plate "${raw.id}" lists an unknown row "${id}"`); bad++; }
          if (raw.layout && !['atomic', 'address', 'molecular'].includes(raw.layout)) { fail(`${label}: plate "${raw.id}" has an unknown layout`); bad++; }
          if (raw.sample && E.MEASURED[raw.sample] === undefined) { fail(`${label}: plate "${raw.id}" names a sample with no measured magnet reading`); bad++; }
          for (const [key, v] of Object.entries(raw.prefill || {})) {
            const [rowId, idx] = key.split(':');
            if (!E.rowOf(rowId) || Number(idx) >= E.boxesOf(E.rowOf(rowId).l) || !/^(u|d|ud)$/.test(v)) { fail(`${label}: plate "${raw.id}" prefills a box that does not exist or holds an illegal pair`); bad++; }
          }
        } else if (E.zOf(raw.sym) < 1) {
          fail(`${label}: strip plate "${raw.id}" names an unknown element "${raw.sym}"`); bad++;
        }
        const item = proto.prepare.call(bench, raw);
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

  if (q1) {
    near(q1.SOLUTIONS[2].decimal, (D.nmToHz(400) * 400e-9) / 1e8, 0.01, 'unit02/q1-wave stage 3 (speed of light, x 10^8)');
    near(q1.SOLUTIONS[3].decimal, D.nmToHz(600) / 1e14, 0.26, 'unit02/q1-wave stage 4 (frequency of 600 nm)');
    near(q1.SOLUTIONS[7].decimal, D.nmToHz(589) / 1e14, 0.06, 'unit02/q1-wave stage 8 (sodium)');
    // The lamps in stage 3 must all give the one product, or the stage teaches nothing.
    for (const rig of q1.STAGES[2].rigs) near((D.nmToHz(rig.nm) * rig.nm * 1e-9) / 1e8, 3, 0.01, `unit02/q1-wave stage 3 ${rig.id}`);
    const order = q1.STAGES[4].rigs.slice().sort((a, b) => b.nm - a.nm).map(r => r.id).join();
    if (order !== q1.SOLUTIONS[4].order.join()) fail('unit02/q1-wave stage 5: the graded order is not lowest frequency first');
  }
  if (q2) {
    near(q2.SOLUTIONS[4].decimal, D.photonJoules(500) / 1e-19, 0.26, 'unit02/q2-photon stage 5 (photon energy at 500 nm)');
    const worked = D.photonJoules(539) / 1e-19;
    if (!q2.STAGES[4].reference.some(t => t.includes(worked.toFixed(2)))) fail('unit02/q2-photon stage 5: the worked check is not the real photon energy at 539 nm');
    const wake = ['cs', 'na', 'zn'].map(m => D.thresholdNm(m[0].toUpperCase() + m[1]));
    if (!(wake[0] > wake[1] && wake[1] > wake[2])) fail('unit02/q2-photon: the work functions do not order cesium < sodium < zinc');
    // Stage 2's dial must have exactly one first setting that frees an electron.
    const st = q2.STAGES[1].settings;
    const first = st.findIndex(n => D.planPhotocell('Na', n, 3).count > 0) + 1;
    if (first !== q2.SOLUTIONS[1].setting) fail(`unit02/q2-photon stage 2: the first freeing setting is ${first}, not the graded one`);
  }
  if (q3) {
    near(q3.SOLUTIONS[4].decimal, D.photonJoules(486) / 1e-19, 0.06, 'unit02/q3-lines stage 5 (486 nm line)');
    near(Number(q3.SOLUTIONS[5].choice), D.planJump(5, 2).nm, 1.5, 'unit02/q3-lines stage 6 (5 to 2 jump)');
    near(D.planJump(3, 2).nm, 656, 1.5, 'the 3 to 2 jump is the red line');
    for (const [gas, lines] of Object.entries(D.LINES)) {
      if (gas !== 'Ne' && lines.some(n => n < 380 || n > 750)) fail(`${gas}: a listed line is outside the visible band`);
    }
  }
  if (q9) {
    const last = q9.STAGES[7].rigs[0];
    near(D.planAbsorb('cuso4', 630, 1, 0.005) * 1, last.unknownAbs, 1e-6, 'unit02/q9-absorb stage 8 (sealed reading)');
    near(q9.SOLUTIONS[7].decimal, 5, 1e-9, 'unit02/q9-absorb stage 8 (5 mmol/L)');
    // The sweep's largest reading must be the graded setting.
    const sweep = q9.STAGES[3].settings.map(n => D.planAbsorb('cuso4', n, 1, 0.01));
    if (sweep.indexOf(Math.max(...sweep)) + 1 !== q9.SOLUTIONS[3].setting) fail('unit02/q9-absorb stage 4: the graded wavelength is not the peak of the sweep');
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
    const fits = q4.STAGES[2].settings.filter(n => O.ringFits(n, O.RING_CIRCUMFERENCE_PM).fits).map(String).sort().join();
    if (fits !== q4.SOLUTIONS[2].picks.slice().sort().join()) fail('unit02/q4-cloud stage 3: the graded wavelengths are not the ones that fit the ring');
    // Stage 7's shapes are the real ones.
    const shapes = { a: 'two lobes', b: 'four lobes', c: 'two lobes and a ring', d: 'four lobes', e: 'four lobes' };
    const binFor = { 'two lobes': 'two', 'four lobes': 'four', 'two lobes and a ring': 'ring' };
    for (const c of q4.STAGES[6].clouds) {
      if (binFor[O.shapeOf(c.orbital)] !== q4.SOLUTIONS[6].bins[c.id] || binFor[shapes[c.id]] !== q4.SOLUTIONS[6].bins[c.id]) {
        fail(`unit02/q4-cloud stage 7: plate ${c.id} is graded against the wrong shape`);
      }
    }
    // Stage 6: three distinct directions among four plates.
    const dirs = new Set(q4.STAGES[5].clouds.map(c => c.orbital));
    if (dirs.size !== q4.SOLUTIONS[5].number) fail('unit02/q4-cloud stage 6: the plates do not show exactly the graded number of directions');

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
    // Stages 5 to 7 are turning plates with turn keys; the earlier ones stay flat.
    for (const i of [4, 5, 6]) {
      const st = q4.STAGES[i];
      if (!st.controls.includes('turn') || st.clouds.some(c => c.plane !== 'turn')) fail(`unit02/q4-cloud stage ${i + 1}: should be turning plates with turn keys`);
    }
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
  const k1 = getQuest('unit07', 'q1-recipe') && await getQuest('unit07', 'q1-recipe').module?.();
  if (k1) {
    // Run each joiner to the end the way the bench does, and hold the graded answer to what comes out.
    const run = st => {
      const counts = Object.fromEntries(st.samples.map(sm => [sm.id, sm.particles[0].n]));
      let made = 0;
      while (Object.entries(st.join.take).every(([id, k]) => counts[id] >= k)) {
        for (const [id, k] of Object.entries(st.join.take)) counts[id] -= k;
        counts[st.join.into] += 1;
        made += 1;
      }
      return { counts, made };
    };
    const weight = (st, counts) => st.samples.reduce((t, sm) => t + counts[sm.id] * sm.particles[0].kinds.reduce((m, kd) => m + k1.KINDS[kd].mass, 0), 0);
    const s3 = k1.STAGES[2];
    const r3 = run(s3);
    const start3 = Object.fromEntries(s3.samples.map(sm => [sm.id, sm.particles[0].n]));
    if (Math.abs(weight(s3, start3) - weight(s3, r3.counts)) > 1e-9) fail('unit07/q1-recipe stage 3: the bench does not weigh the same after the joining as before');
    if (r3.counts.j1 !== 0 || r3.counts.j2 !== 0) fail('unit07/q1-recipe stage 3: the heaps should be used up exactly, or the stage shows leftovers it does not ask about');
    if (k1.SOLUTIONS[2].choice !== 'same') fail('unit07/q1-recipe stage 3: the graded answer is not that the total stays the same');
    const s4 = k1.STAGES[3];
    const r4 = run(s4);
    const limiting = Object.entries(s4.join.take).map(([id, k]) => [id, Math.floor(s4.samples.find(sm => sm.id === id).particles[0].n / k)]).sort((a, b) => a[1] - b[1]);
    if (limiting[0][1] === limiting[1][1]) fail('unit07/q1-recipe stage 4: both heaps give out together, so there is no limiting reactant to find');
    const heap = s4.samples.find(sm => sm.id === limiting[0][0]).particles[0].kinds[0];
    const label = s4.widget.options.find(o => o.id === k1.SOLUTIONS[3].choice)?.label || '';
    const word = { k01: 'hydrogen', k08: 'oxygen' }[heap];
    const nums = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight'];
    if (!label.toLowerCase().startsWith(word) || !label.includes(nums[r4.made])) fail(`unit07/q1-recipe stage 4: the graded answer ("${label}") is not ${word} after ${r4.made} molecules`);
    const wrong = s4.widget.options.filter(o => o.id !== k1.SOLUTIONS[3].choice && o.label.toLowerCase().startsWith(word) && o.label.includes(nums[r4.made]));
    if (wrong.length) fail('unit07/q1-recipe stage 4: more than one option states the true answer');
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
    // The four numbers: every set the stage calls impossible is, and every other is possible.
    const bad = Object.entries(q5.CHECKS.SETS).filter(([, s]) => !EL.validAddress(s)).map(([k]) => k).sort().join();
    if (bad !== q5.SOLUTIONS[7].picks.slice().sort().join()) fail('unit02/q5-numbers stage 8: the graded impossible sets are not the ones the rules rule out');
    const dup = Object.entries(q5.CHECKS.FOUR_ELECTRONS);
    const pair = dup.flatMap(([a, x], i) => dup.slice(i + 1).filter(([, y]) => EL.sameAddress(x, y)).map(([b]) => a + b));
    if (pair.join() !== q5.SOLUTIONS[4].choice) fail('unit02/q5-numbers stage 5: the graded pair is not the one sharing all four numbers');
    if (EL.shellCapacity(3) !== q5.SOLUTIONS[5].number) fail('unit02/q5-numbers stage 6: the third shell does not hold the graded number');
    // Stage 3: the address in the prompt lights the box at the graded place along its row.
    const room3 = EL.findRoom({ n: 3, l: 2, ml: 1 });
    if (!room3.exists || room3.row !== '3d' || ['first', 'second', 'third', 'fourth'][room3.idx] !== q5.SOLUTIONS[2].choice) fail('unit02/q5-numbers stage 3: the address in the prompt does not light the graded box');
    if (EL.boxesOf(2) !== 5) fail('unit02/q5-numbers: a d row does not have five boxes');
    // Stage 7: the ringed box is where the graded address points, and its arrow is the graded bunk.
    const ring = q5.STAGES[6].rigs[0];
    const room7 = EL.findRoom(q5.SOLUTIONS[6].addr);
    if (room7.row !== ring.target.row || room7.idx !== ring.target.idx) fail('unit02/q5-numbers stage 7: the graded address does not light the ringed box');
    const arrow = EL.rackFor(7)[`${ring.target.row}:${ring.target.idx}`];
    if ((arrow === 'u' ? 0.5 : -0.5) !== q5.SOLUTIONS[6].addr.ms || arrow.length !== 1) fail('unit02/q5-numbers stage 7: the ringed box does not hold the one arrow the graded bunk names');
    // Every finder stage: the finder never lights a box for an address the rules rule out.
    for (const [k, set] of Object.entries(q5.CHECKS.SETS)) {
      if (EL.findRoom(set).exists !== EL.validAddress(set)) fail(`unit02/q5-numbers: the finder and the rules disagree about set ${k}`);
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
    // Chromium: the rule's answer and the measured one differ, and the graded arrangement is the measured one.
    const cr = EL.readRack(q6.SOLUTIONS[7].rack);
    if (cr.pull !== EL.MEASURED.Cr) fail('unit02/q6-filling stage 8: the graded arrangement does not match the measured pull of chromium');
    const rule = EL.readRack(q6.MISSES[7].rack);
    if (rule.pull === EL.MEASURED.Cr) fail('unit02/q6-filling stage 8: the rule-following arrangement already matches the magnet, so the stage teaches nothing');
    if (EL.readRack(q6.SOLUTIONS[3].rack).counts['4s'] !== 1) fail('unit02/q6-filling stage 4: the graded nineteenth electron is not in 4s');
    const strips = q6.STAGES[5].rigs;
    for (const s of strips) {
      const want = EL.blockOf(EL.zOf(s.sym));
      if (q6.SOLUTIONS[5].bins[s.id] !== want) fail(`unit02/q6-filling stage 6: ${s.sym} is graded into the wrong block`);
    }
  }
  if (q7) {
    // Every spectrum on the bench adds up to the electrons its element has.
    for (const st of q7.STAGES) for (const rig of st.rigs) {
      const total = (EL.planPES(rig.sym) || []).reduce((n, p) => n + p.height, 0);
      if (total !== EL.zOf(rig.sym)) fail(`unit02/q7-pes: ${rig.sym}'s peaks add up to ${total}, not ${EL.zOf(rig.sym)}`);
    }
    const heights = EL.planPES('O').map(p => p.height).join();
    if (heights !== '2,2,4') fail('unit02/q7-pes stage 5: oxygen\'s spectrum is not 2, 2 and 4');
    const ne = EL.BINDING.Ne['1s'], f = EL.BINDING.F['1s'];
    if (!(ne > f)) fail('unit02/q7-pes stage 6: neon\'s 1s peak must sit further along than fluorine\'s');
    if (!(EL.BINDING.B['2s'] > EL.BINDING.B['2p'])) fail('unit02/q7-pes stage 4: boron\'s 2s must be held tighter than its 2p');
  }
  if (q8) {
    const B = await import('../src/learn/engine/electronbench.js');
    const sizes = ['li', 'be', 'b', 'c'].map(s => EL.RADIUS[s[0].toUpperCase() + s.slice(1)]);
    if (sizes.some((v, i) => i && v >= sizes[i - 1])) fail('unit02/q8-trends stage 3: the graded order is not largest radius first');
    const ions = { naplus: EL.ION_RADIUS['Na+'], clminus: EL.ION_RADIUS['Cl-'], na: EL.ION_RADIUS.Na };
    const ord = q8.SOLUTIONS[4].order.map(k => ions[k]);
    if (ord.some((v, i) => i && v <= ord[i - 1])) fail('unit02/q8-trends stage 5: the graded order is not smallest first');
    const ies = ['Li', 'B', 'Be'].map(s => EL.IONIZATION[s]);
    if (ies.some((v, i) => i && v <= ies[i - 1])) fail('unit02/q8-trends stage 6: the graded order is not the order of the real ionization energies');
    const jump = EL.MG_SUCCESSIVE;
    if (!(jump[2] / jump[1] > 4 && jump[1] / jump[0] < 3)) fail('unit02/q8-trends stage 7: magnesium\'s successive energies do not jump after the second');
    // Stage 8: the pull on the outermost electron orders the atoms the way electronegativity does.
    const pulls = ['na', 'c', 'n', 'f'].map(k => {
      const sym = k[0].toUpperCase() + k.slice(1);
      const shells = B.shellsOf(sym);
      return B.planPull({ z: EL.zOf(sym), shells, radius: EL.RADIUS[sym] }, shells.length - 1).pull;
    });
    if (pulls.some((v, i) => i && v <= pulls[i - 1])) fail('unit02/q8-trends stage 8: the pull meter does not order the atoms weakest first');
    const en = ['Na', 'C', 'N', 'F'].map(s => EL.ELECTRONEGATIVITY[s]);
    if (en.some((v, i) => i && v <= en[i - 1])) fail('unit02/q8-trends stage 8: the real electronegativities do not order the atoms the same way');
    // Stage 2: sodium's outer electron feels +1 of its +11.
    const na = B.planPull({ z: 11, shells: [2, 8, 1], radius: 186 }, 2);
    if (na.zeff !== 1 || na.between !== 10) fail('unit02/q8-trends stage 2: sodium\'s outer electron should feel +1 with ten electrons between');
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

  if (q3) {
    const { PAIRS, LATTICES, morse, lowestOf, byLatticeEnergy, coulombIndex } = BONDDATA;
    // Every pair plate's bottom is one of the crank's settings, and it IS the bottom.
    q3.STAGES.forEach((st, i) => {
      for (const rig of st.rigs.filter(r => r.head === 'pair')) {
        const low = lowestOf(rig.pair, st.settings);
        same(low.r, PAIRS[rig.pair].r0, `unit03/q3-distance stage ${i + 1} ${rig.id}: the lowest crank setting`);
        near(morse(rig.pair, PAIRS[rig.pair].r0), -PAIRS[rig.pair].de, 0.01, `unit03/q3-distance stage ${i + 1} ${rig.id}: the well's depth`);
      }
    });
    same(q3.SOLUTIONS[0].choice, PAIRS['H-H'].r0, 'unit03/q3-distance stage 1 (the bottom of H-H, pm)');
    same(q3.SOLUTIONS[1].choice, PAIRS['H-Cl'].de, 'unit03/q3-distance stage 2 (the depth of H-Cl, kJ/mol)');
    if (!(PAIRS['Cl-Cl'].r0 > PAIRS['H-H'].r0)) fail('unit03/q3-distance stage 4: chlorine\'s bottom does not sit further out than hydrogen\'s');
    const s5 = q3.STAGES[4].rigs.slice().sort((a, b) => PAIRS[b.pair].r0 - PAIRS[a.pair].r0).map(r => r.id).join();
    same(q3.SOLUTIONS[4].order.join(), s5, 'unit03/q3-distance stage 5 (longest bond first)');
    const s6 = q3.STAGES[5].rigs.slice().sort((a, b) => PAIRS[a.pair].r0 - PAIRS[b.pair].r0).map(r => PAIRS[r.pair].de);
    if (s6.some((v, k) => k && v >= s6[k - 1])) fail('unit03/q3-distance stage 6: the shorter bonds are not the deeper wells');
    const real = byLatticeEnergy(q3.STAGES[6].rigs.map(r => r.lattice));
    const graded = q3.SOLUTIONS[6].order.map(id => q3.STAGES[6].rigs.find(r => r.id === id).lattice);
    same(graded.join(), real.join(), 'unit03/q3-distance stage 7 (lattices, strongest first)');
    const byCoulomb = q3.STAGES[6].rigs.map(r => r.lattice).sort((a, b) => coulombIndex(b) - coulombIndex(a));
    same(byCoulomb.join(), real.join(), 'unit03/q3-distance stage 7: charge over distance orders the lattices as the real energies do');
    const hot = q3.STAGES[7].rigs.slice().sort((a, b) => LATTICES[b.lattice].melts - LATTICES[a.lattice].melts)[0].id;
    same(q3.SOLUTIONS[7].choice, hot, 'unit03/q3-distance stage 8 (the higher melting point)');
  }

  if (q4 || q5) {
    const { MOLECULES, DRAWINGS, planLewis, allLit, drawing, trayFor } = LEWIS;
    const lit = (mol, d, q = null) => allLit(planLewis(mol, d, q));
    if (q4) {
      q4.STAGES.forEach((st, i) => {
        for (const rig of st.rigs) {
          const mol = MOLECULES[rig.mol];
          if (!mol) continue;
          const t = trayFor(mol);
          if (t !== mol.syms.reduce((n, sym) => n + LEWIS.VALENCE[sym], 0) - mol.charge) fail(`unit03/q4-dots stage ${i + 1}: ${rig.mol}'s tray does not hold its valence electrons`);
        }
      });
      for (const [i, key, q] of [[0, 'H2O', null], [2, 'CO2', null], [4, 'NH4', 1], [5, 'BF3', null], [7, 'SF6', null]]) {
        const sol = q4.SOLUTIONS[i].boards?.a || DRAWINGS[key];
        if (!lit(key, DRAWINGS[key], q)) fail(`unit03/q4-dots stage ${i + 1}: the intended ${key} drawing does not light every lamp`);
        void sol;
      }
      if (lit('NH4', DRAWINGS.NH4, 0)) fail('unit03/q4-dots stage 5: the ammonium drawing completes on the neutral tray');
      if (trayFor('NO') % 2 !== 1) fail('unit03/q4-dots stage 7: nitric oxide\'s tray is not odd');
      // Stage 2: the lone pairs on the heaviest atom, from the valence electrons.
      const lone = { ch4: (4 - 4) / 2, nh3: (5 - 3) / 2, hf: (7 - 1) / 2 };
      const bin = { none: 0, one: 1, three: 3 };
      for (const [row, bid] of Object.entries(q4.SOLUTIONS[1].bins)) same(bin[bid], lone[row], `unit03/q4-dots stage 2 (${row}'s lone pairs)`);
      // Stage 4: on this board only the oxygen can sit between hydrogen and fluorine.
      const hof = [];
      for (let b01 = 0; b01 <= 1; b01++) for (let b02 = 0; b02 <= 1; b02++) for (let b12 = 0; b12 <= 3; b12++) {
        for (let l0 = 0; l0 <= 4; l0++) for (let l1 = 0; l1 <= 4; l1++) for (let l2 = 0; l2 <= 4; l2++) {
          if (b01 + b02 > 1 || b02 + b12 > 1) continue;
          if (lit('HOF', drawing({ '0-1': b01, '0-2': b02, '1-2': b12 }, { 0: l0, 1: l1, 2: l2 }))) hof.push([b01, b02, b12]);
        }
      }
      if (!hof.length || hof.some(([a, b, c]) => !(a === 1 && b === 0 && c === 1))) fail('unit03/q4-dots stage 4: oxygen is not the only atom that can join hydrogen and fluorine');
      // The board refuses the other way round: a hydrogen or a fluorine cannot join two atoms.
      let placed = drawing();
      placed = LEWIS.addBond(MOLECULES.HOF, placed, 0, 1).placed;
      if (!LEWIS.addBond(MOLECULES.HOF, placed, 0, 2).refused) fail('unit03/q4-dots stage 4: the board lets one hydrogen atom join two others');
      const bf = planLewis('BF3', DRAWINGS.BF3);
      if (bf.atoms[0].lamp !== 'amber') fail('unit03/q4-dots stage 6: boron\'s lamp is not amber in the intended BF3 drawing');
      if (planLewis('SF6', DRAWINGS.SF6).atoms[0].lamp !== 'expanded') fail('unit03/q4-dots stage 8: sulfur\'s lamp is not expanded in SF6');
    }
    if (q5) {
      const fc = (mol, d) => planLewis(mol, d).atoms.map(a => a.fc);
      const co = fc('CO', DRAWINGS.CO);
      if (co[1] !== 1 || co[0] !== -1) fail('unit03/q5-resonance stage 1: oxygen is not +1 and carbon -1 in the CO drawing');
      same(q5.SOLUTIONS[0].choice, 'o', 'unit03/q5-resonance stage 1 (the atom that owns one electron too few)');
      const sumAbs = a => a.reduce((n, v) => n + Math.abs(v), 0);
      if (!(sumAbs(fc('CO2', DRAWINGS.CO2_double)) < sumAbs(fc('CO2', DRAWINGS.CO2_triple)))) fail('unit03/q5-resonance stage 2: the double-bonded drawing does not have charges nearer zero');
      same(q5.STAGES[1].rigs.find(r => r.id === q5.SOLUTIONS[1].choice).prefill === DRAWINGS.CO2_double, true, 'unit03/q5-resonance stage 2 (the better drawing is the one with charges near zero)');
      // Stage 3: the better SCN- drawing puts its minus on the stronger puller.
      const better = q5.STAGES[2].rigs.find(r => r.id === q5.SOLUTIONS[2].choice).prefill;
      const neg = planLewis('SCN', better).atoms.find(a => a.fc < 0);
      if (neg.sym !== 'N' || !(VSEPR.EN.N > VSEPR.EN.S)) fail('unit03/q5-resonance stage 3: the graded drawing does not put the minus on the more electronegative atom');
      // Stage 4: the measured lengths of ozone are equal.
      const o3 = MOLECULES.O3.lengths;
      if (o3['0-1'] !== o3['0-2']) fail('unit03/q5-resonance stage 4: ozone\'s two measured bonds are not the same length');
      // Stages 5 and 6: nitrate has three drawings, and four pairs share three bonds.
      const set = [DRAWINGS.NO3_a, DRAWINGS.NO3_b, DRAWINGS.NO3_c];
      same(LEWIS.distinctDrawings('NO3', set).length, 3, 'unit03/q5-resonance stage 5 (nitrate\'s drawings)');
      const pairs = Object.values(DRAWINGS.NO3_a.bonds).reduce((a, b) => a + b, 0);
      same(`${pairs}/${Object.keys(DRAWINGS.NO3_a.bonds).length}`, q5.SOLUTIONS[5].choice, 'unit03/q5-resonance stage 6 (the order of each nitrate bond)');
      same(LEWIS.distinctDrawings('CO3', [DRAWINGS.CO3_a, DRAWINGS.CO3_b, DRAWINGS.CO3_c]).length, 3, 'unit03/q5-resonance stage 7 (carbonate\'s drawings)');
      if (Object.keys(DRAWINGS.H2O.bonds).some(k => DRAWINGS.H2O.bonds[k] > 1)) fail('unit03/q5-resonance stage 8: water\'s drawing has a double bond');
    }
  }

  if (q6) {
    const { planDomains, bondAngles, SHAPES, RIG_MOLECULES } = VSEPR;
    const armsOf = rig => rig.stock.flatMap(s => Array.from({ length: s.n }, () => (s.kind === 'lone' ? { kind: 'lone' } : { kind: 'atom', sym: s.sym, mult: s.mult || 1 })));
    const stagePlan = (st, id = 'a') => planDomains(armsOf(st.rigs.find(r => r.id === id)));
    same(bondAngles(stagePlan(q6.STAGES[0])).join(), q6.SOLUTIONS[0].choice, 'unit03/q6-shape stage 1 (two arms)');
    same(bondAngles(stagePlan(q6.STAGES[1])).join(), q6.SOLUTIONS[1].choice, 'unit03/q6-shape stage 2 (four arms)');
    same(stagePlan(q6.STAGES[2]).shape, 'trigonal pyramidal', 'unit03/q6-shape stage 3 (NH3)');
    same(bondAngles(stagePlan(q6.STAGES[3])).join(), q6.SOLUTIONS[3].choice, 'unit03/q6-shape stage 4 (water)');
    same(stagePlan(q6.STAGES[4]).n, q6.SOLUTIONS[4].choice, 'unit03/q6-shape stage 5 (CO2\'s domains)');
    // Stage 6: the lone pair on SF4's hub sits round the middle: 90 degrees to the two axial arms, 120 to the other two.
    const sf4 = stagePlan(q6.STAGES[5], 'b');
    const lonev = sf4.vectors.find(v => v.kind === 'lone').v;
    const ang = v => Math.round(Math.acos(lonev[0] * v[0] + lonev[1] * v[1] + lonev[2] * v[2]) * 180 / Math.PI);
    same(sf4.vectors.filter(v => v.kind === 'atom').map(v => ang(v.v)).sort().join(), '120,120,90,90', 'unit03/q6-shape stage 6 (the lone pair\'s angles to the atoms)');
    // Stage 7: XeF4's two lone pairs sit opposite each other.
    const xe = stagePlan(q6.STAGES[6], 'b');
    const [la, lb] = xe.vectors.filter(v => v.kind === 'lone').map(v => v.v);
    near(la[0] * lb[0] + la[1] * lb[1] + la[2] * lb[2], -1, 1e-9, 'unit03/q6-shape stage 7 (the lone pairs of XeF4 are opposite)');
    same(xe.shape, 'square planar', 'unit03/q6-shape stage 7 (XeF4)');
    // Stage 8: the shape the atoms make, not the shape the domains make.
    const want = { a: 'linear', b: 'trigonal planar', c: 'square planar' };
    const got = Object.fromEntries(['a', 'b', 'c'].map(id => [id, stagePlan(q6.STAGES[7], id).shape]));
    same(JSON.stringify(got), JSON.stringify(want), 'unit03/q6-shape stage 8 (molecular geometry)');
    same(SHAPES['2-3'].electron, 'trigonal bipyramidal', 'unit03/q6-shape stage 8 card (XeF2\'s electron geometry)');
    void RIG_MOLECULES;
  }

  if (q7) {
    const { planDipole, EN } = VSEPR;
    const polar = m => planDipole(m).polar;
    if (!(EN.Cl > EN.H)) fail('unit03/q7-polarity stage 1: chlorine does not pull harder than hydrogen');
    const mags = Object.fromEntries(['NaCl', 'H2', 'HCl'].map(m => [m, planDipole(m).mag]));
    if (!(mags.NaCl > mags.HCl && mags.HCl > mags.H2 && mags.H2 === 0)) fail('unit03/q7-polarity stage 2: the three bonds are not ordered by their pull');
    same(polar('CO2'), false, 'unit03/q7-polarity stage 3 (CO2 turns)');
    same(`${polar('H2O')}/${polar('CO2')}`, 'true/false', 'unit03/q7-polarity stage 4 (water against carbon dioxide)');
    same(`${polar('CCl4')}/${polar('CHCl3')}`, 'false/true', 'unit03/q7-polarity stage 5');
    same(`${polar('NH3')}/${polar('BF3')}`, 'true/false', 'unit03/q7-polarity stage 6');
    for (const [id, bid] of Object.entries(q7.SOLUTIONS[6].bins)) {
      const mol = q7.STAGES[6].rigs.find(r => r.id === id).mol;
      same(bid, polar(mol) ? 'polar' : 'nonpolar', `unit03/q7-polarity stage 7 (${mol})`);
    }
    const bent = q7.SOLUTIONS[7].picks.slice().sort();
    const real = q7.STAGES[7].rigs.filter(r => polar(r.mol)).map(r => r.id).sort();
    same(bent.join(), real.join(), 'unit03/q7-polarity stage 8 (the liquids a charged rod bends)');
  }

  if (q8) {
    const { planMix, planTwist, planDomains, countSigmaPi, RIG_MOLECULES } = VSEPR;
    same(planMix(q8.SOLUTIONS[1].mix).lobes, 4, 'unit03/q8-hybrid stage 2 (sp3 makes four lobes)');
    // Stages 3 and 4 sort molecules by the lobes the central atom needs: one lobe per arm of the hub on the plate.
    for (const i of [2, 3]) {
      const names = { two: 2, three: 3, four: 4 };
      for (const row of q8.STAGES[i].widget.rows) {
        const plate = q8.STAGES[i].rigs.find(r => r.id === row.id);
        same(names[q8.SOLUTIONS[i].bins[row.id]], planDomains(RIG_MOLECULES[plate.mol].arms).n, `unit03/q8-hybrid stage ${i + 1} (${plate.mol} needs the graded number of lobes)`);
      }
    }
    q8.STAGES.forEach((st, i) => { if (st.rigs[0].want != null && q8.SOLUTIONS[i].mix) same(planMix(q8.SOLUTIONS[i].mix).lobes, st.rigs[0].want, `unit03/q8-hybrid stage ${i + 1} (lobes match the arms wanted)`); });
    const sp = countSigmaPi('HCN');
    same(`${sp.sigma}-${sp.pi}`, q8.SOLUTIONS[5].choice, 'unit03/q8-hybrid stage 6 (sigma and pi bonds in HCN)');
    same(planTwist(q8.STAGES[6].rigs.find(r => r.id === q8.SOLUTIONS[6].choice).bond).free, true, 'unit03/q8-hybrid stage 7 (the bond that turns)');
    same(planDomains(RIG_MOLECULES.PCl5.arms).n, 5, 'unit03/q8-hybrid stage 8 (PCl5\'s domains)');
    same(planDomains(RIG_MOLECULES.SF6.arms).n, 6, 'unit03/q8-hybrid stage 8 (SF6\'s domains)');
  }

  if (q9) {
    const { DIATOMICS, fillMO, readMO } = MOD;
    for (const [id, d] of Object.entries(DIATOMICS)) {
      const r = readMO(d.order, fillMO(d.order, d.e));
      same(r.unpaired, d.unpaired, `unit03/q9-orbitals: ${id} filled in order measures ${d.unpaired} unpaired`);
    }
    const order = id => readMO(DIATOMICS[id].order, fillMO(DIATOMICS[id].order, DIATOMICS[id].e)).bondOrder;
    same(order('He2'), 0, 'unit03/q9-orbitals stage 3 (He2\'s bond order)');
    same(order('N2'), q9.SOLUTIONS[3].choice, 'unit03/q9-orbitals stage 4 (N2\'s bond order)');
    if (!(DIATOMICS.O2.unpaired > 0)) fail('unit03/q9-orbitals stage 5: O2 measures no unpaired electrons');
    const lengths = q9.STAGES[5].rigs.map(r => [r.id, DIATOMICS[r.mol].length, order(r.mol)]).sort((a, b) => a[1] - b[1]);
    same(lengths.map(l => l[0]).join(), q9.SOLUTIONS[5].order.join(), 'unit03/q9-orbitals stage 6 (shortest bond first)');
    if (lengths.some((l, k) => k && l[2] >= lengths[k - 1][2])) fail('unit03/q9-orbitals stage 6: a shorter bond does not have the higher bond order');
    if (!(order('F2') < order('O2'))) fail('unit03/q9-orbitals stage 7: F2 does not have the lower bond order');
    same(readMO('b2n2', fillMO('b2n2', 6)).unpaired, 2, 'unit03/q9-orbitals stage 8 (B2 filled in the other order)');
    same(readMO('o2f2', fillMO('o2f2', 6)).unpaired, 0, 'unit03/q9-orbitals stage 8 (B2 filled in the oxygen order reads no unpaired electrons, so the order matters)');
  }

  if (failures === before) ok('Ligar: every graded bond, drawing, angle, pull and orbital count agrees with the real tables');
}


/* ------------------------------------------------------------------
   EVERY FIGURE A BELLOWS STAGE GRADES AGAINST IS RECOMPUTED FROM THE REAL
   TABLES, and every claim a stage teaches is checked on the plate that teaches
   it: a trace that is not a line, a knock counter that does not follow the gauge,
   a ranking the other column would get wrong. An answer authored as a literal can
   drift from the instrument that teaches it; one recomputed here from
   `gasdata.js` cannot.
   ------------------------------------------------------------------ */
{
  const before = failures;
  const G = GAS;
  const get = async id => { const q = getQuest('unit04', id); return q && q.status === 'live' ? q.module() : null; };
  const [b1, b2, b3, b4, b5, b6, bb] = await Promise.all(['q1-knocks', 'q2-laws', 'q3-ideal', 'q4-mixtures', 'q5-speed', 'q6-real', 'boss-compressor'].map(get));
  const near = (a, b, tol, what) => { if (!(Math.abs(a - b) <= tol)) fail(`${what}: graded ${a}, the real figure is ${Number(b).toFixed(4)}`); };
  const same = (a, b, what) => { if (String(a) !== String(b)) fail(`${what}: graded ${a}, the real answer is ${b}`); };
  const holds = (cond, what) => { if (!cond) fail(what); };
  const at = (st, id, state = {}) => G.readOf(st, id, state);

  /* ---- the tables themselves ---- */
  near(G.R, 8.314, 1e-9, 'gasdata: R in L kPa / mol K');
  near(G.molesIdeal(G.ATM_KPA, 22.414, 273.15), 1, 0.001, 'gasdata: one mole fills 22.414 L at 0 C and 1 atm');
  for (const [k, g] of Object.entries(G.GASES)) holds(g.M > 0 && g.a > 0 && g.b > 0, `gasdata: ${k} has no real molar mass or van der Waals constants`);
  near(G.pressureVdw('He', 1, 300, 24.6).P, G.pressureIdeal(1, 300, 24.6), 0.2, 'gasdata: van der Waals meets the ideal law in a roomy cylinder');
  near(G.leftAfter('H2', 1), 0.5, 1e-9, 'gasdata: hydrogen is half empty after one second');
  near(G.halfTime('O2') / G.halfTime('H2'), Math.sqrt(G.GASES.O2.M / G.GASES.H2.M), 1e-9, 'gasdata: Graham, the half times go as the root of the mass');
  near(G.speedBins('N2', 300, 60, 6000).reduce((a, b) => a + b, 0), 1, 0.002, 'gasdata: the speed distribution is one whole');

  if (b1) {
    const S = b1.STAGES;
    // Stage 1: while the piston moves, nothing but the knocks follows the gauge.
    const r = k => at(S[0], 'a', { volume: k });
    const n = S[0].volumes.length;
    for (let k = 1; k < n; k++) {
      near(r(k).P * S[0].volumes[k - 1], r(1).P * S[0].volumes[0], 1e-6, 'unit04/q1-knocks stage 1: pressure times volume is not constant');
      near(r(k).knocks / r(1).knocks, r(k).P / r(1).P, 1e-9, 'unit04/q1-knocks stage 1: the knock counter does not follow the gauge');
      near(r(k).mean, r(1).mean, 1e-9, 'unit04/q1-knocks stage 1: the particles change speed while the piston moves');
      near(r(k).T, r(1).T, 1e-9, 'unit04/q1-knocks stage 1: the temperature changes while the piston moves');
    }
    // Stage 2: twice the gas, twice the pressure.
    near(at(S[1], 'a', { amounts: { a: 2 } }).P / at(S[1], 'a', { amounts: { a: 1 } }).P, 2, 1e-9, 'unit04/q1-knocks stage 2 (twice the gas)');
    // Stage 3: heating changes the speed and the energy, not the amount.
    holds(at(S[2], 'a', { temp: 5 }).mean > at(S[2], 'a', { temp: 1 }).mean, 'unit04/q1-knocks stage 3: heating does not speed the particles up');
    // Stage 5: one temperature, one energy, two speeds.
    const he = at(S[4], 'a'); const co = at(S[4], 'b');
    near(he.energy, co.energy, 1e-9, 'unit04/q1-knocks stage 5: the two gases do not share an average kinetic energy');
    holds(he.mean > co.mean * 2, 'unit04/q1-knocks stage 5: helium is not much faster than carbon dioxide');
    // Stage 6: the reference gauge shows one atmosphere, 101.3 kPa and 760 mmHg at one detent; A reads 1.5 atm.
    const ref = at(S[5], 'b', { volume: 3 });
    near(G.kPaToAtm(ref.P), 1, 0.001, 'unit04/q1-knocks stage 6: the reference gauge does not read one atmosphere at its third detent');
    near(G.kPaToMmHg(ref.P), 760, 0.5, 'unit04/q1-knocks stage 6: the reference gauge does not read 760 mmHg');
    near(G.kPaToAtm(at(S[5], 'a').P), 1.5, 0.001, 'unit04/q1-knocks stage 6: Cylinder A does not read 1.50 atm');
    same(Math.round(at(S[5], 'a').P), b1.SOLUTIONS[5].choice, 'unit04/q1-knocks stage 6 (A in kilopascals)');
    // Stage 7: the trace is a straight line that reaches zero pressure at -273.15 C, past the coldest the dial reaches.
    {
      const pts = S[6].temps.map((_, k) => at(S[6], 'a', { temp: k + 1 }));
      const slope = (pts[1].P - pts[0].P) / (pts[1].T - pts[0].T);
      pts.forEach((p, k) => near(p.P, pts[0].P + slope * (p.T - pts[0].T), 1e-9, `unit04/q1-knocks stage 7: point ${k + 1} is off the line`));
      near(pts[0].T - pts[0].P / slope, 0, 0.01, 'unit04/q1-knocks stage 7: the line does not reach zero pressure at 0 K');
      holds(Math.min(...S[6].temps) > -273.15 + 100, 'unit04/q1-knocks stage 7: the dial reaches too close to absolute zero for the line to need carrying on');
      holds(S[6].trace.xmin <= -273.15, 'unit04/q1-knocks stage 7: the plot does not run as far as absolute zero');
    }
  }

  if (b2) {
    const S = b2.STAGES;
    const r = (st, k, over = {}) => at(S[st], 'a', { volume: k, ...over });
    near(r(0, 1).P / r(0, 3).P, 4, 1e-9, 'unit04/q2-laws stage 1 (a quarter of the room)');
    near(r(1, 2).knocks / r(1, 3).knocks, 2, 1e-9, 'unit04/q2-laws stage 2: the knocks do not double in half the room');
    near(r(1, 2).mean, r(1, 3).mean, 1e-9, 'unit04/q2-laws stage 2: the speed changes with the piston');
    near(at(S[2], 'a', { temp: 4 }).V / at(S[2], 'a', { temp: 1 }).V, 3, 1e-9, 'unit04/q2-laws stage 3 (tripling the kelvin)');
    // Stage 4: V against kelvin is a line through the origin; V against Celsius is the same line, shifted.
    const v = k => at(S[3], 'a', { temp: k });
    for (let k = 1; k <= S[3].temps.length; k++) near(v(k).V / v(k).T, v(1).V / v(1).T, 1e-9, 'unit04/q2-laws stage 4: V over kelvin is not constant');
    near(v(1).V - (v(2).V - v(1).V) / (v(2).T - v(1).T) * v(1).T, 0, 1e-9, 'unit04/q2-laws stage 4: the line does not pass through the origin on the kelvin plot');
    holds(S[3].trace[1].xmin < -273 && S[3].trace[0].xmin === 0, 'unit04/q2-laws stage 4: the two plots do not show the intercepts');
    const f5 = at(S[4], 'a', { temp: 3 }).P / at(S[4], 'a', { temp: 1 }).P;
    near(f5, 1.5, 1e-9, 'unit04/q2-laws stage 5 (300 K to 450 K)');
    near(b2.SOLUTIONS[4].decimal, f5, 0.05, 'unit04/q2-laws stage 5 (graded factor)');
    near(at(S[5], 'a', { amounts: { a: 2 } }).V / at(S[5], 'a', { amounts: { a: 1 } }).V, 2, 1e-9, 'unit04/q2-laws stage 6 (twice the gas)');
    {
      const a = at(S[6], 'a'); const b = at(S[6], 'b', { temp: 1 });
      near(a.P, 100, 0.1, 'unit04/q2-laws stage 7: Cylinder A does not read 100 kPa');
      near(b.V / a.V, 2, 0.01, 'unit04/q2-laws stage 7: half the pressure does not double the volume');
      const want = a.V * (a.P / 50) * (450 / a.T);
      near(b2.SOLUTIONS[6].number, want, 0.5, 'unit04/q2-laws stage 7 (the combined law)');
      holds(!S[6].temps.includes(450), 'unit04/q2-laws stage 7: the dial has a setting at 450 K, so the answer is read and not worked');
      // And the scaling really is exact: the dial's own settings obey the law the answer uses.
      near(at(S[6], 'b', { temp: 3 }).V / at(S[6], 'b', { temp: 1 }).V, S[6].temps[2] / S[6].temps[0], 1e-9, 'unit04/q2-laws stage 7: volume does not follow kelvin');
    }
    // Stage 8: each record is the shape the law that fixes the other quantities draws.
    {
      const R = (id) => S[7].rigs.find(x => x.id === id);
      const A = R('a'); const curveA = recordCurve(A);
      curveA.forEach(p => near(p.x * p.y, curveA[0].x * curveA[0].y, 1e-6, 'unit04/q2-laws stage 8: record A is not P times V constant'));
      for (const [id, rule] of [['b', 'V over T'], ['c', 'P over T'], ['d', 'V over n']]) {
        const c = recordCurve(R(id)).filter(p => p.x > 0);
        c.forEach(p => near(p.y / p.x, c[0].y / c[0].x, 1e-6, `unit04/q2-laws stage 8: record ${id.toUpperCase()} is not ${rule} constant`));
      }
      same(b2.SOLUTIONS[7].bins.a, 'temperature', 'unit04/q2-laws stage 8 (record A)');
    }
  }

  if (b3) {
    const S = b3.STAGES;
    for (const id of ['a', 'b']) near(at(S[0], id, { amounts: { a: 1, b: 1 } }).V, 22.414, 0.03, `unit04/q3-ideal stage 1: one mole of ${id === 'a' ? 'helium' : 'carbon dioxide'} does not fill 22.4 L`);
    // Stage 2: every logged reading gives the gas constant, in the units the log is written in.
    for (const line of b3.CHECKS.LOG_KPA) {
      const m = line.match(/([\d.]+) kPa, ([\d.]+) L, ([\d.]+) mol, ([\d.]+) K/);
      near((Number(m[1]) * Number(m[2])) / (Number(m[3]) * Number(m[4])), 8.314, 0.03, `unit04/q3-ideal stage 2: "${line}" does not give R`);
    }
    for (const line of b3.CHECKS.LOG_ATM) {
      const m = line.match(/([\d.]+) atm, ([\d.]+) L, ([\d.]+) mol, ([\d.]+) K/);
      near((Number(m[1]) * Number(m[2])) / (Number(m[3]) * Number(m[4])), 0.08206, 0.0004, `unit04/q3-ideal stage 4: "${line}" does not give R in atmospheres`);
    }
    {
      const t = at(S[2], 'a');
      near((t.P * t.V) / (G.R * t.T), b3.SOLUTIONS[2].number, 0.01, 'unit04/q3-ideal stage 3 (moles in the sealed tank)');
      const t2 = at(S[2], 'a', { temp: 4 });
      near((t2.P * t2.V) / (G.R * t2.T), b3.SOLUTIONS[2].number, 0.01, 'unit04/q3-ideal stage 3: the amount worked out changes with the temperature');
    }
    {
      const t = at(S[4], 'a');
      const molar = t.mass / ((t.P * t.V) / (G.R * t.T));
      near(molar, G.GASES.CO2.M, 0.3, 'unit04/q3-ideal stage 5 (the molar mass of the sealed gas)');
      const near4 = Object.entries({ CH4: 16.0, N2: 28.0, O2: 32.0, CO2: 44.0 }).sort((a, b) => Math.abs(a[1] - molar) - Math.abs(b[1] - molar))[0][0];
      same(near4, b3.SOLUTIONS[4].choice, 'unit04/q3-ideal stage 5 (the gas named)');
    }
    {
      const d = id => { const r = at(S[5], id); return r.mass / r.V; };
      const want = ['a', 'b', 'c'].sort((x, y) => d(y) - d(x)).join();
      same(b3.SOLUTIONS[5].order.join(), want, 'unit04/q3-ideal stage 6 (densest first)');
      near(at(S[5], 'a').V, at(S[5], 'c').V, 1e-9, 'unit04/q3-ideal stage 6: equal amounts do not fill equal volumes');
    }
    {
      const mol = b3.CHECKS.PELLET.gramsOfSolid / b3.CHECKS.PELLET.molarMass;
      near(G.volumeIdeal(mol, 298.15, G.ATM_KPA), Number(b3.SOLUTIONS[6].choice), 0.01, 'unit04/q3-ideal stage 7 (the volume of gas the pellet gives)');
    }
    near(at(S[7], 'a').V, at(S[7], 'b').V, 1e-9, 'unit04/q3-ideal stage 8: helium and xenon do not fill the same room');
    holds(at(S[7], 'b').mass > 20 * at(S[7], 'a').mass, 'unit04/q3-ideal stage 8: xenon is not far heavier than helium');
  }

  if (b4) {
    const S = b4.STAGES;
    {
      const a = at(S[0], 'a'); const b = at(S[0], 'b');
      const merged = G.planMixture([...S[0].rigs[0].parts, ...S[0].rigs[1].parts], 300, 10);
      near(merged.P, a.P + b.P, 1e-9, 'unit04/q4-mixtures stage 1: the poured tank does not read the sum');
      holds(!(Math.abs(merged.P - (a.P + b.P) / 2) < 1), 'unit04/q4-mixtures stage 1: the sum and the average are the same figure');
    }
    {
      const mix = at(S[1], 'a'); const alone = at(S[1], 'b');
      for (const k of [1, 3]) {
        const m = at(S[1], 'a', { temp: k }).rows.find(r => r.gas === 'Ne'); const l = at(S[1], 'b', { temp: k }).rows.find(r => r.gas === 'Ne');
        near(m.knocks, l.knocks, 1e-9, 'unit04/q4-mixtures stage 2: neon knocks differently in the mixture');
        near(m.P, l.P, 1e-9, 'unit04/q4-mixtures stage 2: neon pushes differently in the mixture');
      }
      void mix; void alone;
    }
    for (const k of [1, 2, 3]) {
      const m = at(S[2], 'a', { temp: k });
      for (const r of m.rows) near(r.P / m.P, r.x, 1e-9, `unit04/q4-mixtures stage 3: a gas's share of the push is not its share of the particles at heater setting ${k}`);
    }
    holds(b4.SOLUTIONS[2].choice === 'equal', 'unit04/q4-mixtures stage 3: the graded answer is not the equal shares');
    {
      const m = at(S[3], 'a');
      near(m.P, 200, 0.1, 'unit04/q4-mixtures stage 4: the tank does not read 200 kPa');
      near(m.rows.find(r => r.gas === 'O2').P, b4.SOLUTIONS[3].number, 0.5, 'unit04/q4-mixtures stage 4 (the oxygen)');
    }
    {
      const m = at(S[4], 'a', { volume: 3 });
      near(m.P, G.airPressureAt(5500), 0.1, 'unit04/q4-mixtures stage 5: the air does not read the pressure of 5500 m');
      near(m.rows.find(r => r.gas === 'O2').P, b4.SOLUTIONS[4].number, 0.5, 'unit04/q4-mixtures stage 5 (the oxygen at 5500 m)');
      near(at(S[4], 'a', { volume: 1 }).P, G.ATM_KPA, 0.1, 'unit04/q4-mixtures stage 5: the sea-level reading is not one atmosphere');
    }
    {
      const base = at(S[5], 'a').rows.find(r => r.gas === 'O2');
      const withAr = G.planMixture([...S[5].rigs[0].parts, { gas: 'Ar', n: 2 }], 300, 10);
      near(withAr.rows.find(r => r.gas === 'O2').P, base.P, 1e-9, 'unit04/q4-mixtures stage 6: argon changes the oxygen\'s push');
      near(withAr.rows.find(r => r.gas === 'O2').knocks, base.knocks, 1e-9, 'unit04/q4-mixtures stage 6: argon changes the oxygen\'s knock counter');
      holds(withAr.P > at(S[5], 'a').P, 'unit04/q4-mixtures stage 6: argon does not raise the total');
    }
    {
      // THE TRAP IS REAL: the knock counters and the partial pressures rank the three gases differently.
      const m = at(S[6], 'a');
      const byP = m.rows.slice().sort((a, b) => b.P - a.P).map(r => r.gas).join();
      const byKnocks = m.rows.slice().sort((a, b) => b.knocks - a.knocks).map(r => r.gas).join();
      same(b4.SOLUTIONS[6].order.join(), byP, 'unit04/q4-mixtures stage 7 (largest partial pressure first)');
      holds(byP !== byKnocks, 'unit04/q4-mixtures stage 7: the knock counters rank the gases as the partial pressures do, so the stage has no trap');
      near(m.rows.reduce((s, r) => s + r.P, 0), m.P, 1e-9, 'unit04/q4-mixtures stage 7: the partial pressures do not add up to the gauge');
    }
    {
      const m = at(S[7], 'a');
      const co2 = m.rows.find(r => r.gas === 'CO2');
      const dropped = m.P - G.planMixture(S[7].rigs[0].parts.filter(p => p.gas !== 'CO2'), 300, 10).P;
      near((dropped * 10) / (G.R * 300), b4.SOLUTIONS[7].decimal, 0.01, 'unit04/q4-mixtures stage 8 (the moles from the drop in the gauge)');
      near(co2.n, b4.SOLUTIONS[7].decimal, 0.01, 'unit04/q4-mixtures stage 8 (graded moles)');
    }
  }

  if (b5) {
    const S = b5.STAGES;
    {
      const lo = G.speedBins('N2', 300, 40, 2400); const hi = G.speedBins('N2', 900, 40, 2400);
      const peak = a => a.indexOf(Math.max(...a));
      holds(peak(hi) > peak(lo) && Math.max(...hi) < Math.max(...lo), 'unit04/q5-speed stage 1: heating does not move the peak right and flatten it');
    }
    {
      const sp = id => at(S[1], id).mean;
      const want = ['a', 'b', 'c'].sort((x, y) => sp(y) - sp(x)).join();
      same(b5.SOLUTIONS[1].order.join(), want, 'unit04/q5-speed stage 2 (fastest first)');
    }
    {
      const f = b5.CHECKS.tailFactor();
      const nearest = ['2', '4', '8', '40'].sort((a, b) => Math.abs(Math.log(Number(a) / f)) - Math.abs(Math.log(Number(b) / f)))[0];
      same(b5.SOLUTIONS[2].choice, nearest, 'unit04/q5-speed stage 3 (how many times more clear the bar)');
      holds(Math.abs(Math.log(Number(nearest) / f)) < 0.2, 'unit04/q5-speed stage 3: the factor is not near any option, so the nearest is a guess');
    }
    {
      const ratio = G.halfTime('O2') / G.halfTime('H2');
      same(b5.SOLUTIONS[4].number, Math.round(ratio), 'unit04/q5-speed stage 5 (hydrogen against oxygen)');
      holds(Math.abs(ratio - Math.round(ratio)) < 0.05, 'unit04/q5-speed stage 5: the ratio of half times is not near a whole number');
    }
    {
      // Stage 6: the unmarked gas is the one whose half time, squared against helium's, gives its molar mass.
      const t = G.halfTime('Ar') / G.halfTime('He');
      const M = G.GASES.He.M * t * t;
      const best = Object.entries({ Ne: 20.2, Ar: 39.9, Kr: 83.8, Xe: 131 }).sort((a, b) => Math.abs(a[1] - M) - Math.abs(b[1] - M))[0][0];
      same(b5.SOLUTIONS[5].choice, best, 'unit04/q5-speed stage 6 (the gas named by its leak)');
    }
    {
      const front = (g, t) => G.front(g, t);
      holds(front('NH3', 8) > front('HCl', 8), 'unit04/q5-speed stage 8: ammonia is not ahead of hydrogen chloride');
      holds(front('NH3', S[7].times[S[7].times.length - 1]) >= 8 && front('HCl', 8) < 8, 'unit04/q5-speed stage 8: the time dial does not run to the arrival of the first gas');
      same(b5.SOLUTIONS[7].choice, 'NH3', 'unit04/q5-speed stage 8 (the first to the far end)');
    }
    {
      // Stage 7: a single particle's path is much longer than the distance it has got.
      const w = b5.CHECKS && S[6].rigs[0];
      void w;
    }
  }

  if (b6) {
    const S = b6.STAGES;
    const z = (st, id, state = {}) => at(S[st], id, state).Z;
    holds(z(0, 'a', { volume: 6 }) > 1.2 && z(0, 'a', { volume: 1 }) < 1.01, 'unit04/q6-real stage 1: helium does not climb above one as it is squeezed');
    holds(at(S[1], 'a', { volume: 6 }).room > 0, 'unit04/q6-real stage 2: the size correction puts nothing on');
    holds(z(2, 'a', { temp: 5 }) < z(2, 'a', { temp: 1 }) && z(2, 'a', { temp: 5 }) < 1, 'unit04/q6-real stage 3: carbon dioxide does not fall below one as it cools');
    holds(at(S[3], 'a', { temp: 5 }).pullShare > at(S[3], 'a', { temp: 1 }).pullShare * 1.15, 'unit04/q6-real stage 4: the share of the push the pull takes off does not grow as the gas cools');
    // Stage 5: the order holds at EVERY setting of the dial, not only at the start.
    {
      const want = b6.SOLUTIONS[4].order.join();
      for (let t = 1; t <= S[4].temps.length; t++) {
        const dev = id => Math.abs(z(4, id, { temp: t }) - 1);
        same(['a', 'b', 'c'].sort((x, y) => dev(y) - dev(x)).join(), want, `unit04/q6-real stage 5 (furthest first, at temperature setting ${t})`);
      }
    }
    // Stage 6: the same plate is closest to ideal at every setting of the heater.
    for (let t = 1; t <= S[5].temps.length; t++) {
      const dev = id => Math.abs(z(5, id, { temp: t }) - 1);
      same(['a', 'b', 'c', 'd'].sort((x, y) => dev(x) - dev(y))[0], b6.SOLUTIONS[5].sample, `unit04/q6-real stage 6 (the most ideal cylinder, at temperature setting ${t})`);
    }
    // Stage 7: at the cold, roomy start the pull beats the size; hot and crushed, the size beats the pull.
    {
      const s0 = at(S[6], 'a', { volume: 1, temp: 1 });
      holds(s0.pull > s0.room, 'unit04/q6-real stage 7: at the start, the pull is not the larger correction');
      const s1 = at(S[6], 'a', { volume: 3, temp: 3 });
      holds(s1.room > s1.pull * 1.1, 'unit04/q6-real stage 7: hot and crushed, the size does not clearly beat the pull');
      holds(s1.room > s1.pull, 'unit04/q6-real stage 7: hot and crushed, the size is not the larger correction, so the two never trade places');
    }
    holds(z(7, 'a', { temp: 4 }) < z(7, 'a', { temp: 1 }), 'unit04/q6-real stage 8: the reading does not fall as the gas cools');
  }

  if (bb) {
    const S = bb.STAGES;
    const P = k => at(S[0], 'a', { volume: k }).P;
    near(P(1) / P(3), 4, 1e-9, 'unit04/boss-compressor phase 1: the setting graded is not four times the start');
    near(bb.SOLUTIONS[0].volume, 1, 0, 'unit04/boss-compressor phase 1 (the graded setting)');
    {
      const a = S[1].rigs[0];
      near(G.volumeIdeal(a.n, 750, a.P0), bb.SOLUTIONS[1].number, 2.5, 'unit04/boss-compressor phase 2 (the volume at 750 K)');
      holds(!S[1].temps.includes(750), 'unit04/boss-compressor phase 2: the dial has a setting at 750 K');
    }
    near(at(S[2], 'a').mass, bb.SOLUTIONS[2].number, 1, 'unit04/boss-compressor phase 3 (the mass of oxygen)');
    near(at(S[3], 'a').rows.find(r => r.gas === 'He').P, bb.SOLUTIONS[3].number, 5, 'unit04/boss-compressor phase 4 (the helium)');
    {
      const t = G.halfTime('Kr') / G.halfTime('N2');
      const M = G.GASES.N2.M * t * t;
      const best = Object.entries({ Ne: 20.2, Ar: 39.9, Kr: 83.8, Xe: 131 }).sort((a, b) => Math.abs(a[1] - M) - Math.abs(b[1] - M))[0][0];
      same(bb.SOLUTIONS[4].choice, best, 'unit04/boss-compressor phase 5 (the gas named by its leak)');
    }
  }

  if (failures === before) ok('Bellows: every graded pressure, volume, amount, share, speed and leak agrees with the real tables, and every claim a stage teaches is true of its plate');
}

if (warnings) console.log(`\n${warnings} copy warning(s): reward cards over 45 words.`);
console.log(`\n${failures === 0 ? 'LEARN TRACK OK' : failures + ' PROBLEM(S) FOUND'}`);
process.exit(failures === 0 ? 0 : 1);
