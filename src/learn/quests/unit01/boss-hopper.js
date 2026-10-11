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
 * Awards Case File clue: clue_tallow_slag.
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
    prompt: 'File each armour plate into its correct classification to shatter the outer plating.',
    samples: [
      { id: 'plate1', label: 'Pure Iron' },
      { id: 'plate2', label: 'Rock Salt' },
      { id: 'plate3', label: 'Salt Aggregate' }
    ],
    widget: {
      type: 'bins',
      bins: [
        { id: 'element', label: 'Element' },
        { id: 'compound', label: 'Compound' },
        { id: 'mixture', label: 'Mixture' }
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
        return { ok: false, msg: 'Pure iron contains only one kind of atom and cannot be broken down.' };
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
      'Recall how each class of matter responds to mechanical and chemical separation.',
      'Pure iron contains one kind of atom, while rock salt joins elements in a fixed ratio.',
      'File iron as an element, rock salt as a compound, and the aggregate as a mixture.'
    ],
    reward: {
      title: 'Hull Shattered',
      body: 'The composite hull shatters along chemical classifications. Pure elements resist division while compounds split under precision strike.',
      log: 'Outer armour plates dispersed by classification strike.'
    }
  },
  {
    id: 'phase2',
    title: 'Phase 2 · Core Readout',
    prompt: 'Enter the proton count for a carbon atom to lock the diagnostic probe.',
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
      'Carbon sits in period two with atomic number six on the periodic table.',
      'The atomic number is exactly equal to the number of protons in the nucleus.',
      'Enter six protons to lock the diagnostic probe on carbon.'
    ],
    reward: {
      title: 'Core Locked',
      body: 'The atomic number dictates the elemental identity of the core. Six protons identify the central emitter as carbon.',
      log: 'Core tuned to six protons.'
    }
  },
  {
    id: 'phase3',
    title: 'Phase 3 · Cooling Manifold',
    prompt: 'Enter the atomic number of the inert noble gas in period two needed to quench the hopper heat.',
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
      if (n === 2) return { ok: false, msg: 'Helium sits in period one, not period two.' };
      if (n === 18) return { ok: false, msg: 'Argon sits in period three, not period two.' };
      if (n !== 10) return { ok: false, msg: 'Check the periodic table for the period two noble gas following fluorine.' };
      return { ok: true };
    },
    hints: [
      'Noble gases occupy group eighteen on the far right of the periodic table.',
      'The period two noble gas follows fluorine and carries ten protons.',
      'Enter atomic number ten for neon to flood the cooling lines.'
    ],
    reward: {
      title: 'Manifolds Quenched',
      body: 'Group eighteen noble gases possess full valence shells and remain completely unreactive. Neon floods the jacket and chills the chassis.',
      log: 'Cooling manifolds flooded with neon gas.'
    }
  },
  {
    id: 'phase4',
    title: 'Phase 4 · Neutralize Charge',
    prompt: 'Enter the number of electrons required to neutralize a sodium cation with eleven protons and ten electrons.',
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
      'A neutral atom requires an equal count of positive protons and negative electrons.',
      'With eleven protons and ten electrons, the ion carries a plus one charge.',
      'Supply exactly one electron to restore electrical neutrality.'
    ],
    reward: {
      title: 'Voltage Grounded',
      body: 'Equal numbers of protons and electrons cancel out to zero net charge. The residual voltage drops to zero.',
      log: 'Core cation neutralized with one electron.'
    }
  },
  {
    id: 'phase5',
    title: 'Phase 5 · Swarm Weight',
    prompt: 'Calculate the total mass in grams of two moles of carbon atoms released from the chute.',
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
      'One mole of carbon has a molar mass of twelve grams per mole.',
      'Multiply twelve grams per mole by two moles to find the total mass.',
      'Enter twenty-four grams to calibrate the intake scale.'
    ],
    reward: {
      title: 'The Hopper Falls',
      body: 'Two moles of carbon mass exactly twenty-four grams. The structural frame buckles and the hopper collapses into cold salt.',
      log: 'The Hopper dispersed. Transmuted slag recovered from the chute.'
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

export const DEBRIEF = {
  speaker: 'Vess',
  badge: 'BOSS DISPERSED · TALLOW',
  subtitle: 'The Hopper',
  message: 'The Hopper has collapsed into cold slag. Inside its discharge chute we found an impossible ingot: pure bismuth, though this salt pan never held heavy metals.',
  clueAwarded: 'clue_tallow_slag'
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
        <div class="lq-widget-number" style="display: flex; flex-direction: column; align-items: center; gap: 0.75rem; padding: 1rem 0;">
          <div style="display: flex; align-items: center; gap: 1rem;">
            <button type="button" class="btn-secondary quest-btn-sm" id="btn-num-dec" style="width: 44px; height: 44px; font-size: 1.25rem;">-</button>
            <span id="num-display" style="font-family: var(--font-mono); font-size: 1.6rem; min-width: 60px; text-align: center; color: var(--accent-amber);">${val}</span>
            <button type="button" class="btn-secondary quest-btn-sm" id="btn-num-inc" style="width: 44px; height: 44px; font-size: 1.25rem;">+</button>
          </div>
          <span style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.1em;">${esc(w.unit || '')}</span>
        </div>
      `;
    }
    if (w.type === 'bins') {
      return `
        <div class="lq-widget-bins" style="display: flex; flex-direction: column; gap: 1rem; padding: 0.5rem 0;">
          <div class="bins-items" style="display: flex; flex-direction: column; gap: 0.5rem;">
            ${w.items.map(it => `
              <div class="bin-item-row" style="display: flex; justify-content: space-between; align-items: center; background: var(--plate-200); padding: 0.5rem 0.75rem; border-radius: 4px; border: 1px solid var(--border-durasteel);">
                <span style="font-size: 0.85rem; color: var(--text-bright);">${esc(it.label)}</span>
                <div class="bin-keys" style="display: flex; gap: 0.4rem;">
                  ${w.bins.map(b => `
                    <button type="button" class="quest-btn-sm btn-secondary bin-choice${state.bins[it.id] === b.id ? ' btn-primary' : ''}" data-item="${esc(it.id)}" data-bin="${esc(b.id)}">
                      ${esc(b.label)}
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
    const controls = frame.el.controls;
    if (!controls) return;
    const stage = STAGES[index];

    controls.querySelectorAll('#btn-num-dec').forEach(btn => {
      btn.addEventListener('click', () => {
        const cur = state.number ?? stage.widget.min;
        state.number = Math.max(stage.widget.min, cur - (stage.widget.step || 1));
        const disp = controls.querySelector('#num-display');
        if (disp) disp.textContent = String(state.number);
      });
    });

    controls.querySelectorAll('#btn-num-inc').forEach(btn => {
      btn.addEventListener('click', () => {
        const cur = state.number ?? stage.widget.min;
        state.number = Math.min(stage.widget.max, cur + (stage.widget.step || 1));
        const disp = controls.querySelector('#num-display');
        if (disp) disp.textContent = String(state.number);
      });
    });

    controls.querySelectorAll('.bin-choice').forEach(btn => {
      btn.addEventListener('click', () => {
        const itemId = btn.dataset.item;
        const binId = btn.dataset.bin;
        state.bins[itemId] = binId;
        const row = btn.closest('.bin-item-row');
        row?.querySelectorAll('.bin-choice').forEach(b => {
          b.classList.toggle('btn-primary', b.dataset.bin === binId);
          b.classList.toggle('btn-secondary', b.dataset.bin !== binId);
        });
      });
    });
  }

  function loadStage(i) {
    index = Math.max(0, Math.min(STAGES.length - 1, i));
    const stage = STAGES[index];
    state = { bins: {}, number: stage.widget?.min ?? null };

    frame.setStage(index, {
      title: stage.title,
      prompt: stage.prompt,
      hints: stage.hints,
      encounter: resolveEncounter(stage)
    });

    frame.setControls(renderWidget(stage));
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
    ctx.reportStage(index);

    const isLast = index >= STAGES.length - 1;
    frame.clear({
      title: stage.reward.title,
      body: stage.reward.body,
      isLast
    });
    busy = false;
  }

  function next() {
    if (index < STAGES.length - 1) {
      loadStage(index + 1);
    } else {
      ctx.reportComplete();
      session.recordClue?.(DEBRIEF.clueAwarded);
      frame.showDebrief({
        title: DEBRIEF.title || 'Boss Dispersed',
        body: DEBRIEF.message,
        onDone: () => ctx.exit()
      });
    }
  }

  loadStage(index);

  return {
    dispose() {
      frame.dispose?.();
    }
  };
}
