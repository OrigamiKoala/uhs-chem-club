/**
 * boss-hopper.js — Learn world 1 Boss Encounter: The Hopper.
 *
 * The refinery's ore hopper, risen in the salt. Multi-phase synthesis boss
 * that tests every bench on Tallow with fresh samples on real instruments:
 *   Phase 1: Classify hull plates on the SampleScope (element, compound, mixture · q1)
 *   Phase 2: Identify core atom on the CoreBench (atomic number & identity · q2)
 *   Phase 3: Identify cooling gas slot on the CatalogueBoard (periodic table group 18 · q3)
 *   Phase 4: Assay core slag on the AssayFloor (weighted average atomic mass · q5)
 *   Phase 5: Weigh carbon swarm on the WeighFloor (moles & molar mass · q6)
 *
 * Awards Case File clue: clue_tallow_slag.
 */

import { SampleScope, CoreBench, CatalogueBoard, AssayFloor } from '../../engine/instruments.js';
import { createRunner, blankAnswer } from '../../engine/stagerunner.js';
import { KINDS, POWER_SCALES } from './q1-grain.js';
import { PARTS } from './q2-core.js';
import { CARDS } from './q3-catalogue.js';
import { session } from '../../../session.js';

export const meta = { stageCount: 5 };

export const BUILDS_ON = [
  'unit01/q1-grain', 'unit01/q2-core', 'unit01/q3-catalogue',
  'unit01/q4-ledger', 'unit01/q5-assay', 'unit01/q6-weigh'
];

const COLUMN_HEADS = ['1', '2', '· · ·', '13', '14', '15', '16', '17', '18'];

const CHART_ROWS = [
  ['c01', null, null, null, null, null, null, null, 'c02'],
  ['c03', 'c04', null, 'c05', 'c06', 'c07', 'c08', 'c09', 'c10'],
  ['c11', 'c12', null, 'c13', 'c14', 'c15', 'c16', 'c17', 'c18']
];

function chartWithSlots(swaps) {
  return CHART_ROWS.map(row => row.map(id => (id && swaps[id]) ? `#${swaps[id]}` : id));
}

/** Every key on these benches says what it does on its cap, so none carries a legend. */
export function toolNoteFor() { return null; }

export const STAGES = [
  /* ---------------------------------------------------------------- Phase 1 */
  {
    id: 'phase1',
    title: 'Phase 1 · Hull Plates',
    briefing: {
      speaker: 'Vess',
      body: 'The rogue Hopper has risen in the salt flat, testing every bench from Tallow across five synthesis phases. Strike with the correct chemistry when your telemetry is set; three misses knock the rig back.'
    },
    bench: 'scope',
    prompt: 'Classify each sample as an element, a compound, or a mixture.',
    controls: ['power'],
    samples: [
      { id: 'plate1', label: 'SAMPLE A', note: 'dark grey plating', floorPower: 4, particles: [{ kinds: ['k06'], n: 36 }] },
      { id: 'plate2', label: 'SAMPLE B', note: 'brittle white crystal crust', floorPower: 4, particles: [{ kinds: ['k11', 'k17'], pairs: [{ a: 0, b: 1 }, { a: 2, b: 3 }, { a: 4, b: 5 }, { a: 6, b: 7 }], n: 24 }] },
      { id: 'plate3', label: 'SAMPLE C', note: 'uneven brown and yellow grit', floorPower: 4, particles: [{ kinds: ['k06'], n: 16 }, { kinds: ['k16'], n: 16 }] }
    ],
    widget: {
      type: 'bins',
      bins: [
        { id: 'element', label: 'Element', note: 'One type of atom' },
        { id: 'compound', label: 'Compound', note: 'Atoms chemically bonded' },
        { id: 'mixture', label: 'Mixture', note: 'Physically blended' }
      ],
      rows: [
        { id: 'plate1', label: 'SAMPLE A' },
        { id: 'plate2', label: 'SAMPLE B' },
        { id: 'plate3', label: 'SAMPLE C' }
      ]
    },
    encounter: {
      species: 'the hopper',
      act: 'Strike Hull',
      intent: 'The hopper braces three composite plates against your survey beam.',
      moves: { element: 'Contain', compound: 'Split', mixture: 'Shake' }
    },
    check(state) {
      const b = state?.bins || {};
      if (!b.plate1 || !b.plate2 || !b.plate3) {
        return { ok: false, notYet: true, msg: 'File all three samples before committing your strike.' };
      }
      const wrong = [['plate1', 'element', 'A'], ['plate2', 'compound', 'B'], ['plate3', 'mixture', 'C']]
        .filter(([id, want]) => b[id] !== want).map(([, , name]) => name);
      if (wrong.length) {
        return { ok: false, msg: `Sample ${wrong[0]} is filed wrongly: look at which kinds of atoms it holds and whether any of them are joined.` };
      }
      return { ok: true };
    },
    hints: [
      'Turn the Power dial up until single atoms come into focus.',
      'Tap atoms in each sample and compare what they are and what each is joined to.',
      'File each sample by its atoms: one kind alone, different kinds bonded together, or different kinds sitting loose.'
    ],
    reward: {
      title: 'Hull Shattered',
      body: 'A single element stays whole, a compound is bonded atoms of different elements, and a mixture is only blended. Telling them apart is how you read what a surface is made of.',
      log: 'Three samples sorted by their atoms.'
    }
  },

  /* ---------------------------------------------------------------- Phase 2 */
  {
    id: 'phase2',
    title: 'Phase 2 · Core Readout',
    bench: 'core',
    prompt: 'Enter the atomic number of this neutral core atom.',
    controls: ['field'],
    specimens: [
      { id: 'a', label: 'SEALED ATOM', note: 'a neutral atom off the salvage', core: { marked: 6, blank: 6 }, rings: [2, 4] }
    ],
    widget: { type: 'number', min: 1, max: 20, step: 1, unit: 'atomic number' },
    encounter: {
      species: 'the hopper',
      act: 'Probe Core',
      intent: 'An electromagnetic pulse surges from the central core chamber.'
    },
    check(state) {
      const n = state?.number;
      if (n === null || n === undefined) return { ok: false, notYet: true, msg: 'Set the atomic number on the stepper.' };
      if (n === 12) return { ok: false, msg: 'Twelve is the mass number, not the proton count.' };
      if (n !== 6) return { ok: false, msg: 'Count the + particles in the middle and the electrons on the shells; in a neutral atom the two counts match, and that count is the atomic number.' };
      return { ok: true };
    },
    hints: [
      'Switch between the three views and look at what each one shows.',
      'Count the particles with a + in the middle and the electrons on the shells, then compare the two counts.',
      'A neutral atom balances its charge, and the atomic number is the count of protons.'
    ],
    reward: {
      title: 'Core Locked',
      body: 'The atomic number sets the identity of every element. Six protons make an atom carbon.',
      log: 'Core tuned to six protons.'
    }
  },

  /* ---------------------------------------------------------------- Phase 3 */
  {
    id: 'phase3',
    title: 'Phase 3 · Cooling Manifold',
    bench: 'catalogue',
    prompt: 'What atomic number belongs in the open slot on the chart?',
    controls: [],
    board: {
      label: 'Catalogue chart — one slot open',
      columns: COLUMN_HEADS,
      rows: chartWithSlots({ c10: 'gap' })
    },
    drawer: [],
    foes: [{ id: 'grid', label: 'Catalogue Grid' }],
    widget: { type: 'number', min: 1, max: 36, step: 1, unit: 'atomic number' },
    encounter: {
      species: 'the hopper',
      act: 'Vent Coils',
      intent: 'Cooling coils hiss as pressurized gas fills the manifolds.'
    },
    check(state) {
      const n = state?.number;
      if (n === null || n === undefined) return { ok: false, notYet: true, msg: 'Set the atomic number on the stepper.' };
      if (n === 2) return { ok: false, msg: 'That card belongs in the first row, but the open slot is in the second.' };
      if (n === 18) return { ok: false, msg: 'That card belongs in the third row, but the open slot is in the second.' };
      if (n !== 10) return { ok: false, msg: 'Read the numbers on the cards beside the open slot and count along the row from a card you can read.' };
      return { ok: true };
    },
    hints: [
      'Tap the cards along the second row and read their numbers.',
      'The atomic number steps up by one for each slot across the row.',
      'Count along the row from a card whose number you can read, stepping up by one for each slot.'
    ],
    reward: {
      title: 'Manifolds Quenched',
      body: 'Atoms along a row step up one proton at a time, so a missing card can be found by counting from its neighbours. The last card in each row belongs to group 18, whose atoms have full outer shells.',
      log: 'Cooling manifolds flooded with neon gas.'
    }
  },

  /* ---------------------------------------------------------------- Phase 4 */
  {
    id: 'phase4',
    title: 'Phase 4 · Slag Assay',
    bench: 'assay',
    prompt: 'Match this core slag sample to the element whose average atomic mass it shares.',
    controls: ['pour', 'balance'],
    hoppers: [
      { id: 'hopper', label: 'CORE SLAG', note: 'pulverized core slag, 40 atoms', bins: [{ mass: 10, n: 8 }, { mass: 11, n: 32 }] }
    ],
    reference: ['boron — listed mass 10.8', 'neon — listed mass 20.2', 'chlorine — listed mass 35.5'],
    widget: {
      type: 'choice',
      label: 'Matching element',
      options: [
        { id: 'boron', label: 'Boron (10.8 u)' },
        { id: 'neon', label: 'Neon (20.2 u)' },
        { id: 'chlorine', label: 'Chlorine (35.5 u)' }
      ]
    },
    encounter: {
      species: 'the hopper',
      act: 'Assay Slag',
      intent: 'Pulverized isotope slag rattles down the sorting chute.'
    },
    check(state) {
      if (!state?.choice) return { ok: false, notYet: true, msg: 'Select the matching element.' };
      if (state.choice !== 'boron') return { ok: false, msg: 'Compare the average mass of one atom in the sample with the listed mass of each element.' };
      return { ok: true };
    },
    hints: [
      'Tip the sample down the chute and weigh it on the balance.',
      'Weigh the sample, then divide the pan\'s total by the count it reports to find the average mass.',
      'Compare your average with the listed mass printed on each reference line.'
    ],
    reward: {
      title: 'Slag Identified',
      body: 'The average of an element\'s isotopes, weighted by how common each is, matches its listed atomic mass. That is how a sample can be named from its atoms alone.',
      log: 'Slag identified as boron by average atomic mass.'
    }
  },

  /* ---------------------------------------------------------------- Phase 5 */
  {
    id: 'phase5',
    title: 'Phase 5 · Swarm Weight',
    bench: 'weigh',
    prompt: 'How many moles of carbon are in the sealed drum?',
    controls: ['balance'],
    hoppers: [
      { id: 'drum', label: 'SEALED DRUM', note: 'a drum of carbon soot, gate shut', particle: 'atom', bulk: true, bins: [{ mass: 12, n: 2 }] }
    ],
    reference: ['carbon — molar mass 12.0 g/mol'],
    widget: { type: 'number', min: 1, max: 10, step: 1, unit: 'moles' },
    encounter: {
      species: 'the hopper',
      act: 'Weigh Drum',
      intent: 'The hopper ejects a sealed drum of carbon soot.'
    },
    check(state) {
      const n = state?.number;
      if (n === null || n === undefined) return { ok: false, notYet: true, msg: 'Set the mole count on the stepper.' };
      if (n === 24) return { ok: false, msg: 'That is the mass in grams, not a count of moles.' };
      if (n !== 2) return { ok: false, msg: 'Compare what the pan reads with the grams in one mole of carbon on the plate.' };
      return { ok: true };
    },
    hints: [
      'Weigh the drum and read what the pan says.',
      'Find the grams in one mole of carbon on the plate.',
      'Work out how many of those moles the pan\'s reading holds.'
    ],
    reward: {
      title: 'The Hopper Falls',
      body: 'Dividing a mass by the molar mass gives the moles, so 24 grams of carbon is two moles. The mole links a weighed amount to a count of atoms.',
      log: 'The Hopper dispersed. Foreign slag recovered from the chute.'
    }
  }
];

export const SOLUTIONS = [
  { bins: { plate1: 'element', plate2: 'compound', plate3: 'mixture' } },
  { number: 6 },
  { number: 10 },
  { choice: 'boron' },
  { number: 2 }
];

export const MISSES = [
  { bins: { plate1: 'mixture', plate2: 'element', plate3: 'compound' } },
  { number: 12 },
  { number: 2 },
  { choice: 'neon' },
  { number: 1 }
];

export function stateFor(i, overrides) {
  return { ...blankAnswer(STAGES[i]), ...overrides };
}

export const DEBRIEF = {
  speaker: 'Vess',
  clueAwarded: 'clue_tallow_slag',
  sections: [
    {
      heading: 'What You Found',
      body: 'The Hopper has collapsed into cold slag. Its chute holds a lump of bismuth, and no salt flat makes bismuth on its own.'
    },
    {
      heading: 'Why It Is Worth It',
      body: 'Every phase was a bench you had already worked: matter, atoms, the table, charge and weight. That is all of Tallow, and it was enough to read the machine.'
    },
    {
      heading: 'Next',
      body: 'The ingot goes into the Case File. The next world asks why the electrons in every atom you have weighed sit only where they do.'
    }
  ]
};

export const PRACTICE = [
  {
    id: 'p1',
    question: 'Which of the following describes a pure chemical compound?',
    options: [
      { id: 'a', label: 'Two or more elements chemically bonded in a fixed ratio' },
      { id: 'b', label: 'A physical blend of substances that can be separated by filtration' },
      { id: 'c', label: 'A substance consisting of only one type of atom' }
    ],
    answer: 'a',
    explanation: 'A compound consists of two or more elements chemically bonded in fixed proportions, unlike a mixture or an element.'
  },
  {
    id: 'p2',
    question: 'An atom has 8 protons, 8 neutrons, and 10 electrons. What is its net charge?',
    options: [
      { id: 'a', label: '-2' },
      { id: 'b', label: '+2' },
      { id: 'c', label: '0' }
    ],
    answer: 'a',
    explanation: 'Eight protons (+8) plus ten electrons (-10) gives a net charge of -2.'
  },
  {
    id: 'p3',
    question: 'Which column of the periodic table contains the unreactive noble gases?',
    options: [
      { id: 'a', label: 'Group 18' },
      { id: 'b', label: 'Group 1' },
      { id: 'c', label: 'Group 17' }
    ],
    answer: 'a',
    explanation: 'Group 18 contains helium, neon, argon, and the other noble gases with complete valence shells.'
  },
  {
    id: 'p4',
    question: 'What does the atomic number of an element represent?',
    options: [
      { id: 'a', label: 'The number of protons in the nucleus' },
      { id: 'b', label: 'The total count of protons and neutrons' },
      { id: 'c', label: 'The mass of one mole in grams' }
    ],
    answer: 'a',
    explanation: 'The atomic number (Z) uniquely identifies an element and equals the number of protons in its nucleus.'
  },
  {
    id: 'p5',
    question: 'How many atoms are in one mole of any pure substance?',
    options: [
      { id: 'a', label: '6.02 × 10²³' },
      { id: 'b', label: '1.00 × 10¹²' },
      { id: 'c', label: '3.00 × 10⁸' }
    ],
    answer: 'a',
    explanation: 'Avogadro\'s number defines one mole as exactly 6.022 × 10²³ particles.'
  }
];

/* ------------------------------------------------------------------
   MOUNT
   ------------------------------------------------------------------ */

export function mount(container, ctx) {
  let bench = null;
  let benchKind = null;
  let runner = null;

  /** The three views of the core bench, named as the bench's own keys name them. */
  const FIELDS = { whole: 'Whole piece', core: 'The middle', rings: 'Outside' };
  const NAMED = { marked: 'PROTON', blank: 'NEUTRON', light: 'ELECTRON' };

  const blankState = () => ({ power: 1, field: 'whole', sample: null });

  function setPower(v) {
    const next = Math.max(1, Math.min(6, v));
    runner.state.power = next;
    bench.setPower?.(next);
    runner.paintDial('power', next, { min: 1, max: 6, text: POWER_SCALES[next] });
  }

  function setField(field) {
    runner.state.field = field;
    bench.setField?.(field);
    runner.frame.el.controls.querySelectorAll('[data-field]').forEach(b => b.classList.toggle('lit', b.dataset.field === field));
  }

  function ensureBench(kind, r) {
    if (benchKind === kind) return;
    bench?.dispose();
    const host = r.frame.instrumentHost;
    if (kind === 'scope') {
      bench = new SampleScope(host, {
        kinds: KINDS,
        onProbe: hit => onProbe(hit),
        onSelect: () => {},
        onPower: v => setPower(v),
        powerRange: { min: 1, max: 6 }
      });
    } else if (kind === 'core') {
      bench = new CoreBench(host, { onProbe: hit => onProbe(hit), onSelect: () => {} });
    } else if (kind === 'catalogue') {
      bench = new CatalogueBoard(host, { onProbe: hit => onProbe(hit) });
    } else {
      bench = new AssayFloor(host, {
        onProbe: hit => onProbe(hit),
        onSelect: id => { runner.state.sample = id; bench.setSelected?.(id); }
      });
    }
    benchKind = kind;
  }

  /** Every reading is the instrument's own report; none of them names a stage's answer. */
  function onProbe(hit) {
    if (!hit) return;
    if (benchKind === 'scope') {
      const k = KINDS[hit.kindId];
      if (!k) return;
      runner.readout(`Probe // ${hit.sampleLabel}`, `Mass ${k.mass.toFixed(1)}, size ${k.size.toFixed(2)}. ${hit.neighbours === 0
        ? 'Not joined to anything.'
        : `Joined to ${hit.neighbours} other ${hit.neighbours === 1 ? 'atom' : 'atoms'}.`}`, { code: k.code });
    } else if (benchKind === 'core') {
      const part = PARTS[hit.part];
      if (!part) return;
      runner.readout(`Probe // ${hit.specimenLabel}`, part.note, { code: NAMED[hit.part] || part.code });
    } else if (benchKind === 'catalogue') {
      const c = CARDS[hit.id || hit];
      if (c) runner.readout(`Card // ${c.name}`, `${c.code}, listed mass ${c.mass.toFixed(1)}.`);
    } else if (benchKind === 'assay') {
      if (hit.mass !== undefined) {
        runner.readout(`Bin // ${hit.hopperLabel}, bin ${hit.bin + 1}`, `${hit.poured
          ? `${hit.count} ${hit.count === 1 ? 'atom' : 'atoms'} landed in the bin that catches weight ${hit.mass}.`
          : `The bin that catches weight ${hit.mass}. Nothing has been tipped yet.`}`);
      }
    }
  }

  async function onTool(tool) {
    const stage = runner.stage;
    if (tool.startsWith('field:')) {
      setField(tool.slice(6));
      runner.readout(null, null, { idleHead: 'Probe // standby', idle: 'Tap any particle to read it.' });
      return;
    }
    const hopper = stage.hoppers?.[0];
    if (!hopper) return;
    const id = hopper.id;
    const count = hopper.bins.reduce((n, b) => n + b.n, 0);
    const mass = hopper.bins.reduce((m, b) => m + b.mass * b.n, 0);
    if (tool === 'pour') {
      if (bench.poured?.(id)) { runner.frame.note('That sample has already been tipped, and the tallies above its bins are still there.'); return; }
      const shot = await bench.pour(id);
      runner.readout(`Chute // ${hopper.label}`, `${shot.total} atoms landed: ${shot.totals.map((n, i) => `${n} at weight ${hopper.bins[i].mass}`).join(', ')}.`);
    } else if (tool === 'balance') {
      // A balance weighs. It reports a total, and a count only where the chute has counted.
      runner.readout(`Balance // ${hopper.label}`, hopper.bulk
        ? `The pan reads ${mass} in all. Nothing on this floor can tell you how many atoms that is.`
        : `${mass} in total, over ${count} atoms.`);
    }
  }

  function onLoad(stage, i, r) {
    ensureBench(stage.bench, r);
    const parts = [];
    const dials = {};
    if (stage.bench === 'scope') {
      bench.setSamples(stage.samples);
      bench.setPower(r.state.power);
      bench.setSelectable(false);
      parts.push(r.dialHtml('power', { label: 'Power', min: 1, max: 6, value: r.state.power, scaleLabels: POWER_SCALES }));
      dials.power = { min: 1, max: 6, onChange: v => setPower(v) };
      r.readout(null, null, { idleHead: 'Probe // standby', idle: 'Nothing is in focus yet. Turn the Power dial up.' });
    } else if (stage.bench === 'core') {
      bench.setSpecimens(stage.specimens);
      bench.setSelectable(false);
      bench.setField('whole');
      parts.push(`
        <div class="cb-field" role="group" aria-label="View">
          <span class="form-label">View</span>
          ${Object.entries(FIELDS).map(([id, label]) => `<button type="button" class="btn-secondary quest-btn-sm cb-field-key lq-tool" data-tool="field:${id}" data-field="${id}">${label}</button>`).join('')}
        </div>`);
      r.readout(null, null, { idleHead: 'Probe // standby', idle: 'The whole atom at its own size. Use the other two keys to look inside it.' });
    } else if (stage.bench === 'catalogue') {
      const ids = new Set(stage.drawer || []);
      for (const row of stage.board?.rows || []) {
        for (const entry of row) if (entry && !String(entry).startsWith('#')) ids.add(entry);
      }
      const cards = {};
      for (const id of ids) {
        const c = CARDS[id];
        if (c) cards[id] = { code: c.code, name: c.name, pips: c.outer };
      }
      bench.setStage({ cards, board: stage.board, drawer: [] });
      r.readout(null, null, { idleHead: 'Catalogue // standby', idle: 'Tap a card to read it.' });
    } else {
      bench.setHoppers(stage.hoppers);
      bench.setSelectable(false);
      const only = stage.hoppers[0];
      r.state.sample = only.id;
      bench.setSelected?.(only.id);
      if (stage.controls.includes('pour')) parts.push('<button type="button" class="btn-secondary quest-btn-sm lq-tool" data-tool="pour">Tip Sample</button>');
      if (stage.controls.includes('balance')) parts.push('<button type="button" class="btn-secondary quest-btn-sm lq-tool" data-tool="balance">Weigh Sample</button>');
      if (stage.reference?.length) {
        parts.push(`
          <div class="assay-extract">
            <span class="form-label">Listed masses</span>
            <ul>${stage.reference.map(t => `<li>${t.replace(/[<>&]/g, '')}</li>`).join('')}</ul>
          </div>`);
      }
      r.readout(null, null, { idleHead: 'Floor // standby', idle: 'Each bin catches one weight, marked under it.' });
    }
    r.setControls(parts, onTool, { dials });
    if (stage.bench === 'scope') runner.paintDial('power', r.state.power, { min: 1, max: 6, text: POWER_SCALES[r.state.power] });
    if (stage.bench === 'core') setField('whole');
  }

  const bossCtx = {
    ...ctx,
    reportComplete() {
      ctx.reportComplete();
      session.recordClue?.(DEBRIEF.clueAwarded);
    }
  };

  runner = createRunner(container, bossCtx, {
    STAGES, DEBRIEF, blankState, toolNoteFor,
    setup: () => {},
    onLoad,
    onDispose: () => bench?.dispose()
  });

  runner.start();
  return { dispose: () => runner.dispose() };
}
