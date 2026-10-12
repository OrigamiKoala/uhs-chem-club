/**
 * boss-eater.js — Learn world 2 Boss Encounter: The Lantern-Eater.
 *
 * An auroral entity feeding on optical flux across the Lanternfall ice field.
 * Multi-phase synthesis boss testing every bench in Lanternfall:
 *   Phase 1: Line Spectra (excited hydrogen jump · q3)
 *   Phase 2: Threshold Frequency (photoelectric emission · q2)
 *   Phase 3: Hund's Rule & Paramagnetism (unpaired electrons · q6)
 *   Phase 4: PES Core Identification (nuclear charge · q7)
 *   Phase 5: Spectrophotometric Absorbance (Beer-Lambert law · q9)
 *
 * Awards Case File clue: clue_lantern_lens.
 */

import { LearnFrame } from '../../engine/frame.js';
import { resolveEncounter } from '../../engine/foes.js';
import { esc } from '../../../ui/layout.js';
import { soundscape } from '../../../audio/soundscape.js';
import { session } from '../../../session.js';

export const meta = { stageCount: 5 };

export const STAGES = [
  /* ---------------------------------------------------------------- Phase 1 */
  {
    id: 'phase1',
    title: 'Phase 1 · Spectral Transition',
    prompt: 'Name the electron drop behind the moth\'s red glow.',
    samples: [{ id: 'eater', label: 'The Lantern-Eater' }],
    widget: {
      type: 'choice',
      label: 'The transition',
      options: [
        { id: 'j32', label: 'Drop from the third rung to the second' },
        { id: 'j42', label: 'Drop from the fourth rung to the second' },
        { id: 'j21', label: 'Drop from the second rung to the first' },
        { id: 'j23', label: 'Jump from the second rung to the third' }
      ]
    },
    encounter: {
      species: 'the lantern-eater',
      act: 'Trace Line',
      intent: 'A coherent red spectral glow radiates through the auroral fog.',
      hit: 'The Balmer series transition resonates and punctures the optical veil.'
    },
    hints: [
      'Recall that light leaves only when an electron drops to a lower rung.',
      'Compare the red line with the other hydrogen lines to find the smallest drop.',
      'Match the smallest visible drop to the pair of rungs that makes it.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, msg: 'Select the electron transition.' };
      if (state.choice === 'j23') {
        return { ok: false, msg: 'Emission releases photons when falling, not climbing.' };
      }
      if (state.choice !== 'j32') {
        return { ok: false, msg: 'That drop does not match the red line. Look for the smallest visible drop.' };
      }
      return { ok: true };
    },
    reward: {
      title: 'Emission Disrupted',
      body: 'Pinpointing the drop behind the red glow tears a hole in the moth\'s light.',
      log: 'Red emission transition mapped to 656 nm.'
    }
  },

  /* ---------------------------------------------------------------- Phase 2 */
  {
    id: 'phase2',
    title: 'Phase 2 · Threshold Barrier',
    prompt: 'Pick the beam that frees electrons from the green-threshold plate.',
    samples: [{ id: 'eater', label: 'The Lantern-Eater' }],
    widget: {
      type: 'choice',
      label: 'Incident beam',
      options: [
        { id: 'violet', label: 'Violet light' },
        { id: 'red', label: 'Red light' },
        { id: 'infrared', label: 'Infrared light' }
      ]
    },
    encounter: {
      species: 'the lantern-eater',
      act: 'Exceed Work',
      intent: 'A glowing photocathode barrier repels incoming optical flux.',
      hit: 'High-frequency photons overcome the barrier and strip outer charge.'
    },
    hints: [
      'Recall that only light above the threshold frequency frees any electron.',
      'Compare each beam\'s frequency with the green threshold.',
      'Keep the beam whose photons each carry more than the threshold energy.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, msg: 'Select the incident light.' };
      if (state.choice !== 'violet') {
        return { ok: false, msg: 'Only light above the threshold frequency frees electrons. Compare each beam with it.' };
      }
      return { ok: true };
    },
    reward: {
      title: 'Barrier Stripped',
      body: 'High frequency photons exceed the threshold energy, stripping the surface electrons.',
      log: 'Photoelectric barrier pierced by high-frequency beam.'
    }
  },

  /* ---------------------------------------------------------------- Phase 3 */
  {
    id: 'phase3',
    title: 'Phase 3 · Unpaired Magnetism',
    prompt: 'Count the unpaired electrons in a neutral carbon atom.',
    samples: [{ id: 'eater', label: 'The Lantern-Eater' }],
    widget: { type: 'number', min: 0, max: 6, step: 1, unit: 'unpaired electrons' },
    encounter: {
      species: 'the lantern-eater',
      act: 'Align Spins',
      intent: 'Magnetic shielding fluctuates around the unpaired valence envelope.',
      hit: 'Hund rule orbital spins neutralize the paramagnetic field.'
    },
    hints: [
      'Write carbon\'s electrons into rows from the lowest up.',
      'Compare how the last row\'s electrons sit under Hund\'s rule.',
      'Count the electrons left standing alone in separate boxes.'
    ],
    check(state) {
      const n = state?.number;
      if (n === null || n === undefined) return { ok: false, msg: 'Set the number of unpaired electrons.' };
      if (n === 0) return { ok: false, msg: 'Hund\'s rule keeps electrons unpaired across separate p orbitals.' };
      if (n !== 2) return { ok: false, msg: 'Hund\'s rule requires separate p orbitals to be populated in parallel.' };
      return { ok: true };
    },
    reward: {
      title: 'Field Neutralized',
      body: 'The two unpaired 2p electrons explain the magnetic pull and collapse the field.',
      log: 'Paramagnetic shielding countered with parallel spin counts.'
    }
  },

  /* ---------------------------------------------------------------- Phase 4 */
  {
    id: 'phase4',
    title: 'Phase 4 · Deep Core Anchor',
    prompt: 'Name the element whose nucleus holds ten protons.',
    samples: [{ id: 'eater', label: 'The Lantern-Eater' }],
    widget: {
      type: 'choice',
      label: 'The element',
      options: [
        { id: 'Ne', label: 'Neon' },
        { id: 'F', label: 'Fluorine' },
        { id: 'O', label: 'Oxygen' },
        { id: 'Na', label: 'Sodium' }
      ]
    },
    encounter: {
      species: 'the lantern-eater',
      act: 'Strip Core',
      intent: 'A dense inner-shell ionization signal anchors the entity.',
      hit: 'Ten core protons are identified, dissolving the noble core anchor.'
    },
    hints: [
      'Recall that the proton count is the atomic number.',
      'Compare each option\'s atomic number with the measured count.',
      'Keep the element whose number matches the peak\'s count.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, msg: 'Select the element.' };
      if (state.choice !== 'Ne') {
        return { ok: false, msg: 'Match the proton count directly to the atomic number on the periodic table.' };
      }
      return { ok: true };
    },
    reward: {
      title: 'Core Dissolved',
      body: 'Ten nuclear protons identify neon, collapsing the dense central binding shell.',
      log: 'Core anchor identified as neon and cleared.'
    }
  },

  /* ---------------------------------------------------------------- Phase 5 */
  {
    id: 'phase5',
    title: 'Phase 5 · Optical Absorbance',
    prompt: 'Work out the absorbance of a 0.010 mol/L solution through 1.0 cm with a constant of 40.',
    samples: [{ id: 'eater', label: 'The Lantern-Eater' }],
    widget: { type: 'decimal', min: 0.1, max: 2.0, step: 0.1, label: 'Absorbance' },
    encounter: {
      species: 'the lantern-eater',
      act: 'Quench Flux',
      intent: 'The entity feeds on 630 nm flux within the cuvette chamber.',
      hit: 'The exact Beer-Lambert absorbance matches and extinguishes the entity.'
    },
    hints: [
      'Recall that absorbance is the constant times the path times the concentration.',
      'Compare the units so the path and the concentration multiply cleanly.',
      'Multiply the three figures in order and read the product.'
    ],
    check(state) {
      const d = state?.decimal;
      if (d === null || d === undefined || d === 0.1) return { ok: false, msg: 'Set the calculated absorbance.' };
      if (Math.abs(d - 0.4) > 0.05) {
        return { ok: false, msg: 'Apply A = ε b c: multiply forty by one by zero point zero one.' };
      }
      return { ok: true };
    },
    reward: {
      title: 'The Eater Falls',
      body: 'The Beer-Lambert calculation tunes the quenching laser to 0.40 absorbance, dispersing the entity into auroral trails.',
      log: 'The Lantern-Eater extinguished. Precision lens recovered.'
    }
  }
];

export const SOLUTIONS = [
  { choice: 'j32' },
  { choice: 'violet' },
  { number: 2 },
  { choice: 'Ne' },
  { decimal: 0.4 }
];

export const MISSES = [
  { choice: 'j21' },
  { choice: 'red' },
  { number: 0 },
  { choice: 'F' },
  { decimal: 0.8 }
];

export function stateFor(i, overrides) {
  return { choice: null, number: null, decimal: 0.1, ...overrides };
}

export const DEBRIEF = {
  speaker: 'Vess',
  clueAwarded: 'clue_lantern_lens',
  sections: [
    {
      heading: 'What You Found',
      body: 'The Lantern-Eater collapsed into harmless auroral ionization. In its optical focal chamber we recovered a precision prism ground for deep ultraviolet frequencies far past guild ratings.'
    },
    {
      heading: 'Why It Is Worth It',
      body: 'Every phase was a bench you had already worked: lines, light, boxes, peaks and solutions. That is all of Lanternfall, and it was enough to starve the eater.'
    },
    {
      heading: 'Next',
      body: 'The prism goes into the Case File. The next world asks what happens when two of these atoms come close enough to share the electrons you have just learned to place.'
    }
  ]
};

export const PRACTICE = [
  {
    id: 'p1',
    question: 'In the Bohr model of hydrogen, which jump produces a photon of visible light?',
    options: [
      { id: 'a', label: 'From n = 3 down to n = 2' },
      { id: 'b', label: 'From n = 2 down to n = 1' },
      { id: 'c', label: 'From n = 4 down to n = 1' }
    ],
    answer: 'a',
    explanation: 'Transitions falling to n = 2 form the Balmer series, which fall in the visible region of the spectrum.'
  },
  {
    id: 'p2',
    question: 'What happens in the photoelectric effect when light frequency is below the threshold frequency?',
    options: [
      { id: 'a', label: 'No electrons are emitted, regardless of light intensity' },
      { id: 'b', label: 'Electrons are emitted with very low kinetic energy' },
      { id: 'c', label: 'Electrons are emitted only after a long delay' }
    ],
    answer: 'a',
    explanation: 'Below the threshold frequency, individual photons lack sufficient energy to overcome the metal\'s work function, so zero electrons are ejected.'
  },
  {
    id: 'p3',
    question: 'How many unpaired electrons are found in a neutral nitrogen atom in its ground state?',
    options: [
      { id: 'a', label: '3' },
      { id: 'b', label: '1' },
      { id: 'c', label: '0' }
    ],
    answer: 'a',
    explanation: 'Nitrogen has configuration 1s² 2s² 2p³. By Hund\'s rule, the three 2p electrons occupy separate orbitals with parallel spins, giving 3 unpaired electrons.'
  },
  {
    id: 'p4',
    question: 'Why does neon have a higher first ionization energy than fluorine?',
    options: [
      { id: 'a', label: 'Neon has a greater effective nuclear charge pulling on the same shell' },
      { id: 'b', label: 'Neon has more electron shells than fluorine' },
      { id: 'c', label: 'Fluorine has more shielding electrons than neon' }
    ],
    answer: 'a',
    explanation: 'Across period 2, neon has 10 protons compared to fluorine\'s 9, giving a larger effective nuclear charge that holds the valence shell tighter.'
  },
  {
    id: 'p5',
    question: 'According to Beer-Lambert law, if concentration doubles while path length stays constant, absorbance:',
    options: [
      { id: 'a', label: 'Doubles' },
      { id: 'b', label: 'Halves' },
      { id: 'c', label: 'Stays the same' }
    ],
    answer: 'a',
    explanation: 'Absorbance is directly proportional to concentration: A = ε b c. Doubling c doubles A.'
  }
];

export function mount(container, ctx) {
  let index = ctx.isComplete ? 0 : Math.min(ctx.stagesCleared, STAGES.length - 1);
  let cleared = ctx.isComplete ? STAGES.length : ctx.stagesCleared;
  let state = { choice: null, number: null, decimal: 0.1 };
  let busy = false;

  const frame = new LearnFrame(container, {
    quest: ctx?.quest || { id: 'boss-eater' },
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
    if (w.type === 'choice') {
      return `
        <div class="lq-widget-choice" style="display: flex; flex-direction: column; gap: 0.5rem; padding: 0.5rem 0;">
          ${w.options.map(opt => `
            <button type="button" class="btn-secondary quest-btn-sm choice-btn${state.choice === opt.id ? ' btn-primary' : ''}" data-choice="${esc(opt.id)}" style="text-align: left; padding: 0.6rem 0.8rem;">
              ${esc(opt.label)}
            </button>
          `).join('')}
        </div>
      `;
    }
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
    if (w.type === 'decimal') {
      const val = state.decimal ?? w.min;
      state.decimal = val;
      return `
        <div class="lq-widget-decimal" style="display: flex; flex-direction: column; align-items: center; gap: 0.75rem; padding: 1rem 0;">
          <div style="display: flex; align-items: center; gap: 1rem;">
            <button type="button" class="btn-secondary quest-btn-sm" id="btn-dec-down" style="width: 44px; height: 44px; font-size: 1.25rem;">-</button>
            <span id="dec-display" style="font-family: var(--font-mono); font-size: 1.6rem; min-width: 60px; text-align: center; color: var(--accent-amber);">${val.toFixed(1)}</span>
            <button type="button" class="btn-secondary quest-btn-sm" id="btn-dec-up" style="width: 44px; height: 44px; font-size: 1.25rem;">+</button>
          </div>
          <span style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.1em;">${esc(w.label || '')}</span>
        </div>
      `;
    }
    return '';
  }

  function bindControls() {
    const widget = frame.el.widget;
    if (!widget) return;
    const stage = STAGES[index];

    widget.querySelectorAll('.choice-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        state.choice = btn.dataset.choice;
        widget.querySelectorAll('.choice-btn').forEach(b => b.classList.toggle('btn-primary', b === btn));
        soundscape.playToggleClack?.();
      });
    });

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

    widget.querySelectorAll('#btn-dec-down').forEach(btn => {
      btn.addEventListener('click', () => {
        const cur = state.decimal ?? stage.widget.min;
        state.decimal = Math.max(stage.widget.min, Math.round((cur - stage.widget.step) * 10) / 10);
        const disp = widget.querySelector('#dec-display');
        if (disp) disp.textContent = state.decimal.toFixed(1);
      });
    });

    widget.querySelectorAll('#btn-dec-up').forEach(btn => {
      btn.addEventListener('click', () => {
        const cur = state.decimal ?? stage.widget.min;
        state.decimal = Math.min(stage.widget.max, Math.round((cur + stage.widget.step) * 10) / 10);
        const disp = widget.querySelector('#dec-display');
        if (disp) disp.textContent = state.decimal.toFixed(1);
      });
    });
  }

  function loadStage(i) {
    index = i;
    const stage = STAGES[i];
    state = stateFor(i);
    frame.setCleared(cleared);
    frame.setStage({
      index: i,
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
      soundscape.playMissileWhistle?.();
      frame.miss(res.msg || 'The attempt faltered.');
      return;
    }
    busy = true;
    soundscape.playReactionComplete?.();
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
    if (isLast) ctx.reportComplete();
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
      frame.dispose();
    }
  };
}
