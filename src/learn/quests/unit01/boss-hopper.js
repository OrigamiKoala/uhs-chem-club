/**
 * boss-hopper.js — Learn world 1 Boss Encounter: The Hopper.
 *
 * The refinery's ore hopper, risen in the salt. Multi-phase synthesis boss
 * that tests every bench on Tallow:
 *   Phase 1: Classify hull plates (elements, compounds, mixtures · q1)
 *   Phase 2: Read core protons (atomic number & identity · q2)
 *   Phase 3: Identify cooling gas (periodic table group 18 · q3)
 *   Phase 4: Neutralize core charge (ions & electrons · q4)
 *   Phase 5: Weigh carbon swarm (moles & molar mass · q5/q6)
 *
 * Awards Case File clue: clue_tallow_slag — a slag with bismuth that cannot
 * occur naturally in salt, proof the raiders brought foreign heavy metal.
 */

import { LearnFrame } from '../../engine/frame.js';
import { resolveEncounter } from '../../engine/foes.js';
import { esc } from '../../../ui/layout.js';
import { soundscape } from '../../../audio/soundscape.js';
import { session } from '../../../session.js';

export const meta = { stageCount: 5 };

export const STAGES = [
  {
    id: 'phase1',
    title: 'Phase 1 · Hull Plates',
    briefing: {
      speaker: 'Vess',
      body: 'The rogue Hopper has risen in the salt flat, testing every bench from Tallow across five synthesis phases. Strike with the correct chemistry when your telemetry is set; three misses knock the rig back.'
    },
    prompt: 'The rogue Hopper is shielding itself with three armor plates. Classify each plate as an element, compound, or mixture to crack its outer hull.',
    samples: [
      { id: 'plate1', label: 'Pure Iron' },
      { id: 'plate2', label: 'Rock Salt' },
      { id: 'plate3', label: 'Salt Aggregate' }
    ],
    widget: {
      type: 'bins',
      bins: [
        { id: 'element', label: 'Element', note: 'One type of atom' },
        { id: 'compound', label: 'Compound', note: 'Atoms chemically bonded' },
        { id: 'mixture', label: 'Mixture', note: 'Physically blended' }
      ],
      items: [
        { id: 'plate1', label: 'Pure Iron' },
        { id: 'plate2', label: 'Rock Salt' },
        { id: 'plate3', label: 'Salt Aggregate' }
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
        return { ok: false, msg: 'File all three plates before committing your strike.' };
      }
      if (b.plate1 !== 'element') {
        return { ok: false, msg: 'Pure iron holds a single element and cannot be broken down further.' };
      }
      if (b.plate2 !== 'compound') {
        return { ok: false, msg: 'Rock salt joins sodium and chlorine in a fixed recipe and splits under strike.' };
      }
      if (b.plate3 !== 'mixture') {
        return { ok: false, msg: 'The salt aggregate is a physical blend and separates when agitated.' };
      }
      return { ok: true };
    },
    hints: [
      'Read what each plate is made of, then match it to the bin that says the same thing.',
      'Pure iron holds one element, while rock salt joins elements in a fixed ratio.',
      'File each plate by what holds its atoms together: one element alone, a fixed joining recipe, or nothing joining them at all.'
    ],
    reward: {
      title: 'Hull Shattered',
      body: 'The outer plating breaks along its chemistry. Pure iron resists division while rock salt splits under a precise strike.',
      log: 'Outer armour plates dispersed by classification strike.'
    }
  },
  {
    id: 'phase2',
    title: 'Phase 2 · Core Readout',
    prompt: 'The Hopper\'s power core is cycling through elemental carbon frequencies. Enter the proton count of a carbon atom to lock the diagnostic probe.',
    samples: [{ id: 'hopper', label: 'The Hopper' }],
    widget: { type: 'number', min: 1, max: 20, step: 1, unit: 'protons' },
    encounter: {
      species: 'the hopper',
      act: 'Probe Core',
      intent: 'An electromagnetic pulse surges from the central core chamber.'
    },
    check(state) {
      const n = state?.number;
      if (n === null || n === undefined) return { ok: false, msg: 'Set the proton count on the dial.' };
      if (n === 12) return { ok: false, msg: 'Twelve is the mass number of carbon-12, not its proton count.' };
      if (n < 6) return { ok: false, msg: 'Too few protons for carbon. Check the atomic number.' };
      if (n > 6) return { ok: false, msg: 'Too many protons for carbon. Check the atomic number.' };
      return { ok: true };
    },
    hints: [
      'Find carbon on the reference plate and read the number beside it.',
      'The atomic number counts exactly the protons in the nucleus.',
      'Read the atomic number printed beside carbon and enter that count.'
    ],
    reward: {
      title: 'Core Locked',
      body: 'The atomic number sets the identity of every element. Six protons make an atom carbon.',
      log: 'Core tuned to six protons.'
    }
  },
  {
    id: 'phase3',
    title: 'Phase 3 · Cooling Manifold',
    prompt: 'The Hopper\'s drive coils are overheating. Enter the atomic number of the period-two noble gas that will safely quench the manifold heat.',
    samples: [{ id: 'hopper', label: 'The Hopper' }],
    widget: { type: 'number', min: 1, max: 36, step: 1, unit: 'atomic number' },
    encounter: {
      species: 'the hopper',
      act: 'Vent Coils',
      intent: 'Cooling coils hiss as pressurized gas fills the manifolds.'
    },
    check(state) {
      const n = state?.number;
      if (n === null || n === undefined) return { ok: false, msg: 'Set the atomic number on the dial.' };
      if (n === 2) return { ok: false, msg: 'Helium sits in the first row, not the second.' };
      if (n === 18) return { ok: false, msg: 'Argon sits in the third row, not the second.' };
      if (n !== 10) return { ok: false, msg: 'Read the second row of group 18 on the reference plate.' };
      return { ok: true };
    },
    hints: [
      'The reference plate lists group 18 from top to bottom: read which gas sits in the second row.',
      'Run down group 18 to the second row and read which gas sits there.',
      'Read the atomic number beside that gas and enter it.'
    ],
    reward: {
      title: 'Manifolds Quenched',
      body: 'Group 18 gases hold full outer shells and react with almost nothing. Neon floods the jacket and chills the chassis.',
      log: 'Cooling manifolds flooded with neon gas.'
    }
  },
  {
    id: 'phase4',
    title: 'Phase 4 · Neutralize Charge',
    prompt: 'Static electricity is surging across the chassis from a sodium ion with 11 protons and 10 electrons. How many electrons does it need to neutralize the charge?',
    samples: [{ id: 'hopper', label: 'The Hopper' }],
    widget: { type: 'number', min: 0, max: 10, step: 1, unit: 'electrons' },
    encounter: {
      species: 'the hopper',
      act: 'Ground Chassis',
      intent: 'Static voltage sparks across the charged chassis.'
    },
    check(state) {
      const n = state?.number;
      if (n === null || n === undefined) return { ok: false, msg: 'Set the electron transfer on the dial.' };
      if (n === 0) return { ok: false, msg: 'An ion with eleven protons and ten electrons carries a positive charge and needs an electron.' };
      if (n > 1) return { ok: false, msg: 'Adding too many electrons creates a negative charge. Supply only enough to reach neutral.' };
      return { ok: true };
    },
    hints: [
      'A neutral atom holds protons and electrons in equal numbers.',
      'Eleven protons against ten electrons leave a charge of plus one.',
      'Add electrons one at a time in your head until the two counts match, then enter how many that took.'
    ],
    reward: {
      title: 'Voltage Grounded',
      body: 'Equal numbers of protons and electrons cancel to zero charge. The residual voltage drops to zero.',
      log: 'Core ion neutralized with one electron.'
    }
  },
  {
    id: 'phase5',
    title: 'Phase 5 · Swarm Weight',
    prompt: 'The Hopper exhausts a massive cloud of two moles of carbon atoms. How many grams of carbon soot were ejected from the chute?',
    samples: [{ id: 'hopper', label: 'The Hopper' }],
    widget: { type: 'number', min: 1, max: 100, step: 1, unit: 'grams' },
    encounter: {
      species: 'the hopper',
      act: 'Weigh Slag',
      intent: 'The hopper ejects two moles of carbon soot.'
    },
    check(state) {
      const n = state?.number;
      if (n === null || n === undefined) return { ok: false, msg: 'Enter the predicted mass on the scale.' };
      if (n === 12) return { ok: false, msg: 'Twelve grams is the mass of one mole of carbon, but the hopper ejected two moles.' };
      if (n !== 24) return { ok: false, msg: 'Multiply the molar mass of carbon by two moles.' };
      return { ok: true };
    },
    hints: [
      'One mole of carbon weighs twelve grams.',
      'Multiply twelve grams per mole by two moles to find the total mass.',
      'Do that multiplication and enter the total on the scale.'
    ],
    reward: {
      title: 'The Hopper Falls',
      body: 'Two moles of carbon weigh 24 grams. The frame buckles and the hopper collapses into cold salt.',
      log: 'The Hopper dispersed. Foreign slag recovered from the chute.'
    }
  }
];

export const SOLUTIONS = [
  { bins: { plate1: 'element', plate2: 'compound', plate3: 'mixture' } },
  { number: 6 },
  { number: 10 },
  { number: 1 },
  { number: 24 }
];

export const MISSES = [
  { bins: { plate1: 'mixture', plate2: 'element', plate3: 'compound' } },
  { number: 12 },
  { number: 2 },
  { number: 0 },
  { number: 12 }
];

export function stateFor(i, overrides) {
  return { bins: {}, number: null, ...overrides };
}

/* ------------------------------------------------------------------
   REFERENCE PLATES
   The boss reuses past benches, so whatever a phase asks the player to
   look up is bolted to the bench in plain sight: plate compositions for
   phase 1, a strip of elements with atomic numbers for phase 2, and the
   group-18 column with its rows for phase 3. Nothing here is the answer
   by itself — the player still has to find the right entry and use it.
   ------------------------------------------------------------------ */
const REFERENCES = {
  phase1: `
    <div class="lq-readout-card">
      <div class="lq-readout-head">Hopper plates</div>
      <p class="lq-readout-line">Pure iron: one element and nothing else.</p>
      <p class="lq-readout-line">Rock salt: sodium and chlorine joined in a fixed recipe.</p>
      <p class="lq-readout-line">Salt aggregate: salt grains and rock grit stirred together, nothing joined.</p>
    </div>`,
  phase2: `
    <div class="lq-readout-card">
      <div class="lq-readout-head">Reference strip — atomic numbers</div>
      <p class="lq-readout-line">Hydrogen 1 · helium 2 · carbon 6 · nitrogen 7 · oxygen 8 · neon 10.</p>
    </div>`,
  phase3: `
    <div class="lq-readout-card">
      <div class="lq-readout-head">Reference strip — group 18</div>
      <p class="lq-readout-line">Top to bottom: helium 2 in the first row, neon 10 in the second row, argon 18 in the third row.</p>
    </div>`,
  phase4: `
    <div class="lq-readout-card">
      <div class="lq-readout-head">Core telemetry — charge balance</div>
      <p class="lq-readout-line">Sodium ion: 11 protons (+11), 10 electrons (-10), net charge +1.</p>
      <p class="lq-readout-line">Neutral atoms have equal proton and electron counts.</p>
    </div>`,
  phase5: `
    <div class="lq-readout-card">
      <div class="lq-readout-head">Exhaust telemetry — molar mass</div>
      <p class="lq-readout-line">Carbon molar mass: 12.0 g/mol.</p>
      <p class="lq-readout-line">Total mass = moles multiplied by molar mass.</p>
    </div>`
};

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
    explanation: 'Net charge equals protons minus electrons: 8 protons (+8) plus 10 electrons (-10) equals a net charge of -2.'
  },
  {
    id: 'p3',
    question: 'Which group on the periodic table contains unreactive noble gases with full valence shells?',
    options: [
      { id: 'a', label: 'Group 18' },
      { id: 'b', label: 'Group 1' },
      { id: 'c', label: 'Group 17' }
    ],
    answer: 'a',
    explanation: 'Group 18 elements are the noble gases, possessing stable, full valence electron shells that make them inert.'
  },
  {
    id: 'p4',
    question: 'How many atoms are present in exactly 1.0 mole of any pure element?',
    options: [
      { id: 'a', label: '6.022 × 10^23 atoms' },
      { id: 'b', label: '1.000 × 10^6 atoms' },
      { id: 'c', label: '12.011 × 10^23 atoms' }
    ],
    answer: 'a',
    explanation: 'Avogadro’s number defines exactly one mole as 6.022 × 10^23 representative particles or atoms.'
  },
  {
    id: 'p5',
    question: 'If the molar mass of oxygen atoms is 16.0 g/mol, what is the mass of 3.0 moles of oxygen atoms?',
    options: [
      { id: 'a', label: '48.0 grams' },
      { id: 'b', label: '16.0 grams' },
      { id: 'c', label: '32.0 grams' }
    ],
    answer: 'a',
    explanation: 'Mass equals moles multiplied by molar mass: 3.0 moles × 16.0 g/mol = 48.0 grams.'
  }
];

export function mount(container, ctx) {
  let index = ctx.isComplete ? 0 : Math.min(ctx.stagesCleared, STAGES.length - 1);
  let cleared = ctx.isComplete ? STAGES.length : ctx.stagesCleared;
  let state = { bins: {}, number: null };
  let busy = false;

  const frame = new LearnFrame(container, {
    quest: ctx?.quest || { id: 'boss-hopper' },
    world: ctx?.world,
    stageCount: STAGES.length,
    rewards: STAGES.map(s => s.reward),
    onSubmit: () => submit(),
    onNext: () => next(),
    onJump: i => loadStage(i),
    onExit: () => ctx.exit()
  });

  function renderWidget(stage) {
    const w = stage.widget;
    if (w.type === 'number') {
      const val = state.number ?? w.min;
      state.number = val;
      return `
        <div class="lq-answer">
          <span class="form-label">${esc(w.label || w.unit || 'Dial')}</span>
          <div class="lq-number">
            <button type="button" class="btn-secondary quest-btn-sm" data-num="-1" aria-label="Lower">&minus;</button>
            <span class="lq-number-value" id="num-display" aria-live="polite">${val}</span>
            <button type="button" class="btn-secondary quest-btn-sm" data-num="1" aria-label="Raise">+</button>
          </div>
          ${w.unit ? `<span class="lq-unit eyebrow" style="display: block; margin-top: 0.35rem; color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.08em;">${esc(w.unit)}</span>` : ''}
        </div>
      `;
    }
    if (w.type === 'bins') {
      return `
        <div class="lq-answer">
          <span class="form-label">Classification Strike</span>
          <div class="lq-bins">
            ${stage.samples.map(s => `
              <div class="lq-bin-row" data-sample="${esc(s.id)}">
                <span class="lq-bin-sample">${esc(s.label)}</span>
                <div class="lq-bin-keys">
                  ${w.bins.map(b => `
                    <button type="button" class="choice-option lq-bin-key${state.bins[s.id] === b.id ? ' selected' : ''}" data-item="${esc(s.id)}" data-bin="${esc(b.id)}">
                      <span class="lq-bin-label">${esc(b.label)}</span>
                      ${b.note ? `<span class="lq-bin-note">${esc(b.note)}</span>` : ''}
                    </button>
                  `).join('')}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }
    return '';
  }

  function bindControls() {
    const widget = frame.el.widget;
    if (!widget) return;
    const stage = STAGES[index];

    widget.querySelectorAll('button[data-num]').forEach(btn => {
      btn.addEventListener('click', () => {
        const cur = state.number ?? stage.widget.min;
        const delta = Number(btn.dataset.num) * (stage.widget.step || 1);
        state.number = Math.max(stage.widget.min, Math.min(stage.widget.max, cur + delta));
        const disp = widget.querySelector('.lq-number-value');
        if (disp) disp.textContent = String(state.number);
        soundscape.playToggleClack?.();
      });
    });

    widget.querySelectorAll('.lq-bin-key').forEach(btn => {
      btn.addEventListener('click', () => {
        const itemId = btn.dataset.item;
        const binId = btn.dataset.bin;
        state.bins[itemId] = binId;
        const row = btn.closest('.lq-bin-row');
        row?.querySelectorAll('.lq-bin-key').forEach(b => {
          b.classList.toggle('selected', b.dataset.bin === binId);
        });
        soundscape.playToggleClack?.();
      });
    });
  }

  function loadStage(i) {
    index = Math.max(0, Math.min(STAGES.length - 1, i));
    const stage = STAGES[index];
    state = { bins: {}, number: stage.widget?.min ?? null };

    frame.setCleared(cleared);
    frame.setStage({
      index,
      title: stage.title,
      prompt: stage.prompt,
      briefing: stage.briefing,
      hints: stage.hints,
      commitLabel: stage.encounter?.act || 'Commit',
      encounter: resolveEncounter(stage)
    });

    frame.setWidget(renderWidget(stage));
    frame.setReadout(REFERENCES[stage.id] || '');
    bindControls();
  }

  function submit() {
    if (busy) return;
    const stage = STAGES[index];
    const res = stage.check(state);
    if (!res.ok) {
      frame.miss(res.msg);
      soundscape.playMiss?.();
      return;
    }

    busy = true;
    soundscape.playSuccess?.();
    if (index + 1 > cleared) {
      cleared = index + 1;
      ctx.reportStage(index);
    }
    frame.setCleared(cleared);

    const isLast = index >= STAGES.length - 1;
    frame.clear({
      title: stage.reward.title,
      body: stage.reward.body,
      log: stage.reward.log,
      last: isLast
    });
    busy = false;
  }

  function next() {
    if (index < STAGES.length - 1) {
      loadStage(index + 1);
    } else {
      ctx.reportComplete();
      session.recordClue?.(DEBRIEF.clueAwarded);
      frame.showDebrief(DEBRIEF, () => ctx.exit());
    }
  }

  loadStage(index);

  return {
    dispose() {
      frame.dispose?.();
    }
  };
}
