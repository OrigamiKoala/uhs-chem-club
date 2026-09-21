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
const ok = (msg) => console.log(`  ok   ${msg}`);

const quests = allQuests();
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

  checkStageTable(q, mod);
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
    'unit02/q1-joins': /\b(bonds?|bonded|bonding|ionic|covalent|shares? a pair|lone pairs?|double bonds?|triple bonds?|formula unit)\b/i,
    'unit02/q2-lattice': /\b(lattices?|crystals?|crystalline|conduct\w*|electrolytes?|dissociat\w*|brittle|melting points?)\b/i,
    'unit02/q3-recipe': /\b(fixed composition|constant composition|definite proportions|multiple proportions|empirical formulas?|percent composition)\b/i,
    'unit02/q4-weigh': /\b(moles?|molar|avogadro\w*|formula mass|gram formula mass)\b/i
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

  /** Every withheld word in a string that this stage has not earned yet. */
  const tooEarly = (text, stage, forReward) => {
    if (!withheldRx) return null;
    const all = new RegExp(withheldRx.source, 'gi');
    let m;
    while ((m = all.exec(String(text))) !== null) {
      if (!sayableAt(m[0], stage, forReward)) return m[0];
    }
    return null;
  };

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
    if (!Array.isArray(st.hints) || st.hints.length !== 3) {
      fail(`${label}: needs exactly three hint rungs (got ${st.hints?.length})`); bad++;
    } else if (new Set(st.hints).size !== 3) {
      fail(`${label}: two hint rungs say the same thing`); bad++;
    }
    if (!st.reward?.title || !st.reward?.body) { fail(`${label}: no reward card`); bad++; }
    if (typeof st.check !== 'function') { fail(`${label}: no check()`); bad++; return; }

    // Player-facing copy obeys the same house rules as the rest of the ship.
    const copy = [st.title, st.prompt, st.reward?.title, st.reward?.body, st.reward?.log,
      st.briefing?.body, ...(st.hints || [])].filter(Boolean);
    for (const str of copy) {
      if (emoji.test(str)) { fail(`${label}: emoji in player-facing copy`); bad++; }
    }

    // Stage briefings must not exceed 2 sentences (CLAUDE.md §7).
    if (st.briefing?.body) {
      const n = sentenceCount(st.briefing.body);
      if (n > 2) {
        fail(`${label}: briefing exceeds 2 sentences (${n})`);
        bad++;
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

    /* ------------------------------------------------------------------
       NOTHING IS NAMED WITHOUT BEING EXPLAINED.

       A stage that puts a key on the plate owes the player one plain sentence
       saying what that key does, on the stage the key first appears and on
       every stage after it. A quest exports `toolNoteFor(controlId, stageNo)`
       and the frame draws what it returns. Without this rule a bench grows a
       vocabulary of its own — needle, field, ring, stripper — that a player
       only ever meets as a button legend, and the prompts then talk to
       somebody who already knows what the buttons are.

       The notes are player-facing copy, so they are held to the same withheld
       vocabulary as a prompt or a hint.
       ------------------------------------------------------------------ */
    if (Array.isArray(st.controls) && st.controls.length) {
      if (typeof mod.toolNoteFor !== 'function') {
        fail(`${label}: the quest offers controls but exports no toolNoteFor()`);
        bad++;
      } else {
        for (const control of st.controls) {
          const note = mod.toolNoteFor(control, i + 1);
          if (!note || !note.key || !note.what) {
            fail(`${label}: control "${control}" has no key legend — say what it does`);
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
        if (!['grid', 'clusters', 'web'].includes(sample.build)) {
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
        if (!Number.isInteger(entry.n) || entry.n < 1) {
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

console.log(`\n${failures === 0 ? 'LEARN TRACK OK' : failures + ' PROBLEM(S) FOUND'}`);
process.exit(failures === 0 ? 0 : 1);
