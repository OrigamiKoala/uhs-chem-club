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
    briefing: {
      speaker: 'Vess',
      body: 'This golem builds units from two ingredients, one of each per unit. Its hoppers hold a set count of each.'
    },
    prompt: 'The recipe golem charges its dual feed hoppers! How many units of iron sulfide can it assemble from 8 pieces of iron and 12 pieces of sulfur (at 1:1) before its supply runs dry?',
    samples: [{ id: 'golem', label: 'Recipe Golem' }],
    widget: { type: 'number', min: 1, max: 20, step: 1, unit: 'units' },
    encounter: {
      species: 'recipe golem',
      act: 'Meter Intake',
      intent: 'The golem opens its twin hopper gates to draw raw feed.'
    },
    check(state) {
      const n = state?.number;
      if (n === null || n === undefined) return { ok: false, notYet: true, msg: 'Set a count on the stepper.' };
      if (n === 12) return { ok: false, msg: 'Iron runs out first, leaving sulfur left over.' };
      if (n !== 8) return { ok: false, msg: 'The smaller ingredient stops the recipe; work out how many units it can build.' };
      return { ok: true };
    },
    hints: [
      'Count what each ingredient can build on its own at one of each per unit.',
      'Compare how many units the iron can build against how many the sulfur can build.',
      'Take the smaller of the two counts, since the first ingredient to run out stops the recipe.'
    ],
    reward: {
      title: 'First Ingredient Runs Out',
      body: 'The recipe stops when its first ingredient runs out, and that ingredient is the limiting reactant. Iron runs out after 8 units, so the golem stalls with sulfur left over.',
      log: 'Intake metered to eight units of iron sulfide.'
    }
  },
  {
    id: 'phase2',
    title: 'Phase 2 · Mass Conservation',
    prompt: 'The golem seals its combustion chamber to synthesize water! How many grams of water will 4 grams of hydrogen and 32 grams of oxygen yield when completely reacted?',
    samples: [{ id: 'golem', label: 'Recipe Golem' }],
    widget: { type: 'number', min: 10, max: 60, step: 1, unit: 'grams' },
    encounter: {
      species: 'recipe golem',
      act: 'Seal Valves',
      intent: 'Steam builds behind the combustion valves.'
    },
    check(state) {
      const n = state?.number;
      if (n === null || n === undefined) return { ok: false, notYet: true, msg: 'Set a mass on the stepper.' };
      if (n !== 36) return { ok: false, msg: 'Nothing is lost in the reaction; compare what goes in with what must come out.' };
      return { ok: true };
    },
    hints: [
      'Read the grams of each ingredient the prompt names before setting anything.',
      'Compare what goes in against what must come out if nothing is lost.',
      'Add the hydrogen grams to the oxygen grams to get the water grams.'
    ],
    reward: {
      title: 'Mass Is Conserved',
      body: 'Nothing is lost in a reaction, which is the conservation of mass. Four grams of hydrogen plus 32 grams of oxygen make 36 grams of water.',
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
  speaker: 'Vess',
  clueAwarded: 'clue_kettle_ledger',
  sections: [
    {
      heading: 'What You Found',
      body: 'The golem vents its boiler and freezes. In its log vault we found a ledger: fifty tons of metal logged out against forty tons of ore logged in. No chemistry can do that.'
    },
    {
      heading: 'Why It Is Worth It',
      body: 'Both phases were the one bench you had already worked: the limiting feed sets the yield, and the mass in always equals the mass out. That is all of Kettle so far, and it was enough to freeze the golem.'
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
  let cleared = ctx.isComplete ? STAGES.length : ctx.stagesCleared;
  let state = { number: null };
  let busy = false;

  const frame = new LearnFrame(container, {
    quest: ctx?.quest || { id: 'boss-golem' },
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
    const widget = frame.el.widget;
    if (!widget) return;
    const stage = STAGES[index];

    widget.querySelectorAll('#btn-num-dec').forEach(btn => {
      btn.addEventListener('click', () => {
        const cur = state.number ?? stage.widget.min;
        state.number = Math.max(stage.widget.min, cur - (stage.widget.step || 1));
        const disp = widget.querySelector('#num-display');
        if (disp) disp.textContent = String(state.number);
      });
    });

    widget.querySelectorAll('#btn-num-inc').forEach(btn => {
      btn.addEventListener('click', () => {
        const cur = state.number ?? stage.widget.min;
        state.number = Math.min(stage.widget.max, cur + (stage.widget.step || 1));
        const disp = widget.querySelector('#num-display');
        if (disp) disp.textContent = String(state.number);
      });
    });
  }

  function loadStage(i) {
    index = Math.max(0, Math.min(STAGES.length - 1, i));
    const stage = STAGES[index];
    state = { number: stage.widget?.min ?? null };

    frame.setCleared(cleared);
    frame.setStage({
      index,
      title: stage.title,
      prompt: stage.prompt,
      hints: stage.hints,
      commitLabel: stage.encounter?.act || 'Commit',
      encounter: resolveEncounter(stage)
    });

    frame.setWidget(renderWidget(stage));
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
