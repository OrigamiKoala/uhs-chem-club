/**
 * boss-golem.js — Learn world 7 Elite Encounter: Recipe Golem.
 *
 * An automaton bound by strict stoichiometry. Two phases on real instruments, each a
 * fresh pair of ingredients, and neither prompt carries a figure the bench has to give:
 *   Phase 1: Limiting feed on the SampleScope (count the atoms in two heaps · q1)
 *   Phase 2: The same feed by weight on the AssayFloor (grams to moles on two drums · q6)
 *
 * Awards Case File clue: clue_kettle_ledger.
 */

import { SampleScope, AssayFloor } from '../../engine/instruments.js';
import { createRunner, blankAnswer } from '../../engine/stagerunner.js';
import { KINDS, POWER_SCALES } from '../unit01/q1-grain.js';
import { session } from '../../../session.js';
import { esc } from '../../../ui/layout.js';

export const meta = { stageCount: 2 };

export const BUILDS_ON = ['unit07/q1-recipe'];

/** Every key on these benches says what it does on its cap, so none carries a legend. */
export function toolNoteFor() { return null; }

export const STAGES = [
  /* ---------------------------------------------------------------- Phase 1 */
  {
    id: 'phase1',
    title: 'Phase 1 · Limiting Feed',
    briefing: {
      speaker: 'Vess',
      body: 'This golem builds each unit of sodium chloride from one sodium atom and one chlorine atom, using whatever its two hoppers hold.'
    },
    bench: 'scope',
    prompt: 'How many sodium chloride units can the golem build from these two heaps?',
    controls: ['power'],
    samples: [
      { id: 'na', label: 'SAMPLE A', note: 'a heap of loose atoms from the first hopper', floorPower: 4, particles: [{ kinds: ['k11'], n: 9 }] },
      { id: 'cl', label: 'SAMPLE B', note: 'a heap of loose atoms from the second hopper', floorPower: 4, particles: [{ kinds: ['k17'], n: 14 }] }
    ],
    widget: { type: 'number', min: 1, max: 20, step: 1, label: 'Units' },
    encounter: {
      species: 'recipe golem',
      act: 'Meter Intake',
      intent: 'The golem opens its twin hopper gates to draw in feed.'
    },
    check(state) {
      const n = state?.number;
      if (n === null || n === undefined) return { ok: false, notYet: true, msg: 'Set a count on the stepper.' };
      if (n !== 9) return { ok: false, msg: 'Count the atoms in each heap: the recipe stops as soon as one of them is used up.' };
      return { ok: true };
    },
    hints: [
      'Turn the Power dial up until single atoms come into focus.',
      'Count the atoms in each heap.',
      'Every unit takes one atom from each heap, so ask which heap runs out first.'
    ],
    reward: {
      title: 'First Ingredient Runs Out',
      body: 'The recipe stops when its first ingredient runs out, and that ingredient is the limiting reactant. Whatever is left of the other ingredient is the excess.',
      log: 'Intake metered by the smaller heap.'
    }
  },

  /* ---------------------------------------------------------------- Phase 2 */
  {
    id: 'phase2',
    title: 'Phase 2 · Feed by Weight',
    bench: 'assay',
    prompt: 'How many moles of sodium chloride can the golem make from the two drums?',
    controls: ['balance'],
    reference: ['sodium — molar mass 23.0 g/mol', 'chlorine — molar mass 35.5 g/mol'],
    hoppers: [
      { id: 'dna', label: 'SAMPLE A', code: 'sodium', note: 'one drum of sodium, gate shut', particle: 'atom', bulk: true, bins: [{ mass: 23, n: 3 }] },
      { id: 'dcl', label: 'SAMPLE B', code: 'chlorine', note: 'one drum of chlorine, gate shut', particle: 'atom', bulk: true, bins: [{ mass: 35.5, n: 2 }] }
    ],
    widget: { type: 'number', min: 1, max: 10, step: 1, label: 'Moles' },
    encounter: {
      species: 'recipe golem',
      act: 'Seal Valves',
      intent: 'Steam builds behind the valves while the golem waits for its feed.'
    },
    check(state) {
      const n = state?.number;
      if (n === null || n === undefined) return { ok: false, notYet: true, msg: 'Set a count of moles on the stepper.' };
      if (n !== 2) return { ok: false, msg: 'Turn each drum\'s weight into moles with the molar masses on the plate, then see which drum runs out first.' };
      return { ok: true };
    },
    hints: [
      'Weigh each drum and read what the pan says.',
      'Use the molar masses on the plate to turn each drum\'s weight into moles.',
      'Each mole of the compound takes one mole of each element, so compare the two mole counts.'
    ],
    reward: {
      title: 'The Same Limit, by Weight',
      body: 'Dividing a mass by a molar mass gives moles, and moles can be compared the way atoms were. The smaller number of moles still sets how much compound can form.',
      log: 'Yield set by the drum with fewer moles.'
    }
  }
];

export const SOLUTIONS = [
  { number: 9 },
  { number: 2 }
];

export const MISSES = [
  { number: 14 },
  { number: 3 }
];

function blankState() { return { power: 1, sample: null }; }

export function stateFor(i, overrides) {
  return { ...blankAnswer(STAGES[i]), ...blankState(), ...overrides };
}

export const DEBRIEF = {
  speaker: 'Vess',
  clueAwarded: 'clue_kettle_ledger',
  sections: [
    {
      heading: 'What You Found',
      body: 'The golem vents its boiler and freezes. In its log vault we found a ledger: fifty tons of metal logged out against forty tons of ore logged in. No chemistry can do that.'
    },
    {
      heading: 'Why It Is Worth It',
      body: 'Both phases asked the same question, once by counting atoms and once by weighing drums: which ingredient runs out first. That is all of Kettle so far, and it was enough to freeze the golem.'
    },
    {
      heading: 'Next',
      body: 'The ledger goes into the Case File. Something in the foundry is making mass from nothing, and no balance allows that.'
    }
  ]
};

export const PRACTICE = [
  {
    id: 'p1',
    question: 'What is a limiting reagent in a chemical reaction?',
    options: [
      { id: 'a', label: 'The reactant that is completely consumed first, limiting the amount of product formed' },
      { id: 'b', label: 'The reactant present with the largest initial mass' },
      { id: 'c', label: 'A substance that slows down the rate of the reaction' }
    ],
    answer: 'a',
    explanation: 'The limiting reagent runs out first based on stoichiometric ratios, stopping further product formation.'
  },
  {
    id: 'p2',
    question: 'According to the law of conservation of mass, what must be true of any chemical reaction?',
    options: [
      { id: 'a', label: 'The total mass of the products must equal the total mass of the reactants' },
      { id: 'b', label: 'The number of molecules on both sides must always be identical' },
      { id: 'c', label: 'Mass increases slightly when exothermic bonds form' }
    ],
    answer: 'a',
    explanation: 'Matter cannot be created or destroyed in chemical reactions; atoms are simply rearranged into new combinations.'
  },
  {
    id: 'p3',
    question: 'If 2 moles of A react with 1 mole of B to form 1 mole of C, how many moles of C form from 6 moles of A and 2 moles of B?',
    options: [
      { id: 'a', label: '2 moles of C (B is limiting)' },
      { id: 'b', label: '3 moles of C (A is limiting)' },
      { id: 'c', label: '4 moles of C' }
    ],
    answer: 'a',
    explanation: 'Two moles of B require 4 moles of A, leaving 2 moles of A in excess; B is limiting and yields exactly 2 moles of C.'
  },
  {
    id: 'p4',
    question: 'What is meant by the law of definite proportions?',
    options: [
      { id: 'a', label: 'A given chemical compound always contains its constituent elements in fixed ratio by mass' },
      { id: 'b', label: 'Gases always combine in random proportions depending on atmospheric pressure' },
      { id: 'c', label: 'Catalysts alter the final mass ratio of products' }
    ],
    answer: 'a',
    explanation: 'Proust’s law of definite proportions states that a pure compound always has the exact same elemental composition by mass.'
  },
  {
    id: 'p5',
    question: 'In the combustion 2 H₂ + O₂ → 2 H₂O, how many grams of water form from 4.0 g H₂ and 32.0 g O₂?',
    options: [
      { id: 'a', label: '36.0 g' },
      { id: 'b', label: '18.0 g' },
      { id: 'c', label: '28.0 g' }
    ],
    answer: 'a',
    explanation: 'By conservation of mass, 4.0 g of hydrogen combines completely with 32.0 g of oxygen to yield 36.0 g of water.'
  }
];

/* ------------------------------------------------------------------
   MOUNT
   ------------------------------------------------------------------ */

export function mount(container, ctx) {
  let bench = null;
  let benchKind = null;
  let runner = null;

  function setPower(v) {
    const next = Math.max(1, Math.min(6, v));
    runner.state.power = next;
    bench.setPower?.(next);
    runner.paintDial('power', next, { min: 1, max: 6, text: POWER_SCALES[next] });
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
    } else {
      bench = new AssayFloor(host, {
        onProbe: hit => onProbe(hit),
        onSelect: id => { runner.state.sample = id; bench.setSelected?.(id); }
      });
    }
    benchKind = kind;
  }

  /** Each reading is the instrument's own report, never the stage's answer. */
  function onProbe(hit) {
    if (!hit) return;
    if (benchKind === 'scope') {
      const k = KINDS[hit.kindId];
      if (!k) return;
      runner.readout(`Probe // ${hit.sampleLabel}`, `Mass ${k.mass.toFixed(1)}, size ${k.size.toFixed(2)}. ${hit.neighbours === 0
        ? 'Not joined to anything.'
        : `Joined to ${hit.neighbours} other ${hit.neighbours === 1 ? 'atom' : 'atoms'}.`}`, { code: k.code });
    } else if (hit.hopperId) {
      runner.state.sample = hit.hopperId;
      bench.setSelected?.(hit.hopperId);
    }
  }

  function onTool(tool) {
    if (tool !== 'balance') return;
    const id = runner.state.sample;
    const hopper = runner.stage.hoppers.find(h => h.id === id);
    if (!hopper) { runner.frame.note('No sample selected. Tap one of the drums first.'); return; }
    const mass = hopper.bins.reduce((m, b) => m + b.mass * b.n, 0);
    // A balance weighs. It does not count, and it does not divide.
    runner.readout(`Balance // ${hopper.label}`, `The pan reads ${mass} in all. Nothing on this floor can tell you how many atoms that is.`);
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
    } else {
      bench.setHoppers(stage.hoppers);
      bench.setSelectable(true);
      r.state.sample = stage.hoppers[0].id;
      bench.setSelected?.(stage.hoppers[0].id);
      parts.push('<button type="button" class="btn-secondary quest-btn-sm lq-tool" data-tool="balance">Weigh Sample</button>');
      if (stage.reference?.length) {
        parts.push(`
          <div class="assay-extract">
            <span class="form-label">Listed masses</span>
            <ul>${stage.reference.map(t => `<li>${esc(t)}</li>`).join('')}</ul>
          </div>`);
      }
      r.readout(null, null, { idleHead: 'Floor // standby', idle: 'Tap a drum, then weigh it.' });
    }
    r.setControls(parts, onTool, { dials });
    if (stage.bench === 'scope') runner.paintDial('power', r.state.power, { min: 1, max: 6, text: POWER_SCALES[r.state.power] });
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
