/**
 * boss-warden.js — Learn world 3 Elite Encounter: Basalt Warden.
 *
 * An elite sentinel forged from basalt lattice. Tests bonding principles:
 *   Phase 1: Cleavage under strike (ionic vs covalent bonding · q1)
 *   Phase 2: Conductivity in liquid phase (mobile ions in melt · q2)
 *
 * Awards Case File clue: clue_ligar_scorch.
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
    title: 'Phase 1 · Lattice Cleavage',
    prompt: 'Identify which mineral plate will shatter cleanly along flat planes under a mechanical strike.',
    samples: [{ id: 'warden', label: 'Basalt Warden' }],
    widget: {
      type: 'choice',
      options: [
        { id: 'plate1', label: 'Plate A · Shared Electron Joint (Covalent)' },
        { id: 'plate2', label: 'Plate B · Oppositely Charged Ions (Ionic)' }
      ]
    },
    encounter: {
      species: 'basalt warden',
      act: 'Strike Joint',
      intent: 'The warden raises an angular arm of crystalline rock.'
    },
    check(state) {
      if (!state?.choice) return { ok: false, msg: 'Select a mineral plate to target.' };
      if (state.choice === 'plate1') {
        return { ok: false, msg: 'Covalent network joints share electrons strongly and resist cleavage along flat planes.' };
      }
      return { ok: true };
    },
    hints: [
      'Recall how ionic and covalent bonding differ in structure and brittleness.',
      'When layers of an ionic lattice shift under impact, ions of like charge align and repel each other.',
      'Select Plate B with oppositely charged ions to cleave the crystal.'
    ],
    reward: {
      title: 'Lattice Cleaved',
      body: 'Shifting the planes of an ionic lattice forces like charges into direct alignment. Sudden electrostatic repulsion shatters the crystal along a flat face.',
      log: 'Ionic plate cleaved under mechanical impact.'
    }
  },
  {
    id: 'phase2',
    title: 'Phase 2 · Core Conductivity',
    prompt: 'Select the state in which the warden ionic core conducts electric current to ground the charge.',
    samples: [{ id: 'warden', label: 'Basalt Warden' }],
    widget: {
      type: 'choice',
      options: [
        { id: 'solid', label: 'Solid crystalline lattice' },
        { id: 'molten', label: 'Molten liquid phase' }
      ]
    },
    encounter: {
      species: 'basalt warden',
      act: 'Channel Current',
      intent: 'Geothermal heat warms the warden stone to a cherry-red glow.'
    },
    check(state) {
      if (!state?.choice) return { ok: false, msg: 'Select the state of matter to test.' };
      if (state.choice === 'solid') {
        return { ok: false, msg: 'In the solid state, ions are locked into fixed lattice positions and cannot move to carry current.' };
      }
      return { ok: true };
    },
    hints: [
      'Electrical conductivity requires charged particles that are free to move through the material.',
      'In a solid ionic lattice, the ions are locked tightly in place by electrostatic attraction.',
      'Select the molten liquid phase where mobile ions flow freely.'
    ],
    reward: {
      title: 'Core Grounded',
      body: 'Melting the ionic lattice breaks the rigid crystal structure. Mobile ions migrate freely through the molten phase, conducting current and discharging the core.',
      log: 'Warden core discharged through molten conduction.'
    }
  }
];

export const SOLUTIONS = [
  { choice: 'plate2' },
  { choice: 'molten' }
];

export const MISSES = [
  { choice: 'plate1' },
  { choice: 'solid' }
];

export function stateFor(i, overrides) {
  return { choice: null, ...overrides };
}

export const DEBRIEF = {
  speaker: 'VESS // QUARTERMASTER',
  badge: 'ELITE DISPERSED · LIGAR',
  subtitle: 'BASALT WARDEN // DISPERSAL CONFIRMED',
  message: 'The warden settles back into dormant stone. Look at the wall behind it: that quarry face was cut with heat hotter than any forge the Smelters ever chartered.',
  clueAwarded: 'clue_ligar_scorch'
};

export const PRACTICE = [
  {
    id: 'p1',
    question: 'Why are ionic compounds brittle when struck with a hammer?',
    options: [
      { id: 'a', label: 'Shifting lattice layers bring like-charged ions into contact, causing repulsion' },
      { id: 'b', label: 'Electrons are transferred to the hammer during the collision' },
      { id: 'c', label: 'Covalent bonds between ions immediately break under pressure' }
    ],
    answer: 'a',
    explanation: 'Mechanical impact shifts crystal layers, placing ions with identical charges next to each other, creating massive repulsive force that fractures the crystal.'
  },
  {
    id: 'p2',
    question: 'Under what conditions can an ionic substance conduct electricity?',
    options: [
      { id: 'a', label: 'When molten or dissolved in water, freeing ions to move' },
      { id: 'b', label: 'In the solid state at room temperature' },
      { id: 'c', label: 'Only when frozen into an absolute zero lattice' }
    ],
    answer: 'a',
    explanation: 'Conduction requires mobile charge carriers; solid ionic compounds hold ions rigidly in place, whereas liquid or aqueous states allow them to migrate.'
  },
  {
    id: 'p3',
    question: 'What type of bonding involves the sharing of valence electron pairs between atoms?',
    options: [
      { id: 'a', label: 'Covalent bonding' },
      { id: 'b', label: 'Ionic bonding' },
      { id: 'c', label: 'Metallic lattice bonding' }
    ],
    answer: 'a',
    explanation: 'Covalent bonds form when nonmetal atoms share pairs of valence electrons to achieve stable noble-gas electron configurations.'
  },
  {
    id: 'p4',
    question: 'Which of the following substances has the highest melting point due to a continuous 3D network of covalent bonds?',
    options: [
      { id: 'a', label: 'Diamond (carbon network)' },
      { id: 'b', label: 'Water ice' },
      { id: 'c', label: 'Molecular sucrose' }
    ],
    answer: 'a',
    explanation: 'Covalent network solids like diamond feature extensive continuous 3D bonding, requiring immense thermal energy to break.'
  },
  {
    id: 'p5',
    question: 'What holds ions together in a crystal lattice?',
    options: [
      { id: 'a', label: 'Electrostatic attractions between positive cations and negative anions' },
      { id: 'b', label: 'Gravitational attraction between atomic nuclei' },
      { id: 'c', label: 'Shared pairs of core electrons' }
    ],
    answer: 'a',
    explanation: 'Ionic bonding is governed by Coulombic electrostatic attractions between oppositely charged cations and anions.'
  }
];

export function mount(container, ctx) {
  let index = ctx.isComplete ? 0 : Math.min(ctx.stagesCleared, STAGES.length - 1);
  let state = { choice: null };
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
    return `
      <div class="lq-widget-choice" style="display: flex; flex-direction: column; gap: 0.6rem; padding: 1rem 0;">
        ${w.options.map(opt => `
          <button type="button" class="btn-secondary quest-btn-sm choice-opt${state.choice === opt.id ? ' btn-primary' : ''}" data-choice="${esc(opt.id)}" style="text-align: left; padding: 0.65rem 1rem;">
            ${esc(opt.label)}
          </button>
        `).join('')}
      </div>
    `;
  }

  function bindControls() {
    const controls = frame.el.controls;
    if (!controls) return;
    controls.querySelectorAll('.choice-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        state.choice = btn.dataset.choice;
        controls.querySelectorAll('.choice-opt').forEach(b => {
          b.classList.toggle('btn-primary', b.dataset.choice === state.choice);
          b.classList.toggle('btn-secondary', b.dataset.choice !== state.choice);
        });
      });
    });
  }

  function loadStage(i) {
    index = Math.max(0, Math.min(STAGES.length - 1, i));
    const stage = STAGES[index];
    state = { choice: null };

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
