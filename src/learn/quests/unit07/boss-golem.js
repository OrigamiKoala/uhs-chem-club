/**
 * boss-golem.js — Learn world 7 Elite Encounter: Recipe Golem.
 *
 * An automaton bound by strict stoichiometry. Tests recipe and mass balance:
 *   Phase 1: Limiting reagent by atom count (q1-recipe)
 *   Phase 2: Conservation of mass in water synthesis (q1-recipe)
 *
 * Awards Case File clue: clue_kettle_ledger.
 */

import { LearnFrame } from '../../engine/frame.js';
import { resolveEncounter } from '../../engine/foes.js';
import { esc } from '../../../ui/layout.js';
import { soundscape } from '../../../audio/soundscape.js';
import { session } from '../../../session.js';

export const meta = { stageCount: 2 };

export const STAGES = [
  {
    id: 'phase1',
    title: 'Phase 1 · Limiting Feed',
    prompt: 'Enter the maximum number of iron sulfide units the golem can synthesize before starving its limiting reagent.',
    samples: [{ id: 'golem', label: 'Recipe Golem' }],
    widget: { type: 'number', min: 1, max: 20, step: 1, unit: 'units' },
    encounter: {
      species: 'recipe golem',
      act: 'Meter Intake',
      intent: 'The golem opens its twin hopper gates to draw raw feed.'
    },
    check(state) {
      const n = state?.number;
      if (n === null || n === undefined) return { ok: false, msg: 'Set the product count on the dial.' };
      if (n === 12) return { ok: false, msg: 'Iron runs out first, leaving unreacted sulfur atoms in excess.' };
      if (n !== 8) return { ok: false, msg: 'Calculate how many units can form before the limiting reagent runs dry.' };
      return { ok: true };
    },
    hints: [
      'The reaction requires equal numbers of iron and sulfur atoms.',
      'The reactant present in the smaller stoichiometric amount limits the total yield.',
      'Enter eight units since iron is the limiting reagent.'
    ],
    reward: {
      title: 'Intake Starved',
      body: 'The limiting reagent dictates the maximum possible yield. Iron is exhausted after eight units, stalling the golem synthesis feed.',
      log: 'Intake metered to eight units of iron sulfide.'
    }
  },
  {
    id: 'phase2',
    title: 'Phase 2 · Mass Conservation',
    prompt: 'Calculate the total mass of water vapor produced in grams when four grams of hydrogen reacts with thirty-two grams of oxygen.',
    samples: [{ id: 'golem', label: 'Recipe Golem' }],
    widget: { type: 'number', min: 10, max: 60, step: 1, unit: 'grams' },
    encounter: {
      species: 'recipe golem',
      act: 'Seal Valves',
      intent: 'Steam builds behind the combustion valves.'
    },
    check(state) {
      const n = state?.number;
      if (n === null || n === undefined) return { ok: false, msg: 'Enter the predicted mass on the scale.' };
      if (n !== 36) return { ok: false, msg: 'The law of conservation of mass states that total product mass must equal total reactant mass.' };
      return { ok: true };
    },
    hints: [
      'In any chemical reaction, matter cannot be created or destroyed.',
      'Add the mass of hydrogen to the mass of oxygen.',
      'Enter thirty-six grams for the combined mass of water vapor.'
    ],
    reward: {
      title: 'Golem Dispersed',
      body: 'Mass is strictly conserved: four grams of hydrogen plus thirty-two grams of oxygen yields exactly thirty-six grams of water. The pressure valve pops and the golem shuts down.',
      log: 'Stoichiometric balance confirmed. Recipe golem dispersed.'
    }
  }
];

export const SOLUTIONS = [
  { number: 8 },
  { number: 36 }
];

export const MISSES = [
  { number: 12 },
  { number: 40 }
];

export function stateFor(i, overrides) {
  return { number: null, ...overrides };
}

export const DEBRIEF = {
  speaker: 'VESS // QUARTERMASTER',
  badge: 'ELITE DISPERSED · KETTLE',
  subtitle: 'RECIPE GOLEM // DISPERSAL CONFIRMED',
  message: 'The golem vents its boiler and freezes. In its log vault we found a ledger: pages of refinery runs where the product mass is thirty percent greater than the input ore. No chemistry can do that.',
  clueAwarded: 'clue_kettle_ledger'
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
    question: 'If 10.0 g of calcium reacts completely with 16.0 g of oxygen to yield 26.0 g of product, what mass was conserved?',
    options: [
      { id: 'a', label: 'Exactly 26.0 g' },
      { id: 'b', label: 'Less than 26.0 g due to heat release' },
      { id: 'c', label: '10.0 g' }
    ],
    answer: 'a',
    explanation: 'Total reactant mass (10.0 g + 16.0 g = 26.0 g) equals total product mass (26.0 g) with zero net loss.'
  }
];

export function mount(container, ctx) {
  let index = ctx.isComplete ? 0 : Math.min(ctx.stagesCleared, STAGES.length - 1);
  let state = { number: null };
  let busy = false;

  const frame = new LearnFrame(container, {
    stageCount: STAGES.length,
    rewards: STAGES.map(s => s.reward),
    onSubmit: () => submit(),
    onNext: () => next(),
    onJump: i => loadStage(i),
    onExit: () => ctx.exit()
  });

  function renderWidget(stage) {
    const w = stage.widget;
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
  }

  function loadStage(i) {
    index = Math.max(0, Math.min(STAGES.length - 1, i));
    const stage = STAGES[index];
    state = { number: stage.widget?.min ?? null };

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
        title: DEBRIEF.title || 'Elite Dispersed',
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
