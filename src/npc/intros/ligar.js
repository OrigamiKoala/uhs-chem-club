/** Ligar: a rescue in progress. The crew come for you and lead you through it at a run. */
import { walkUp } from './scenes.js';

export const STYLE = 'A rescue under way: one of the rescue crew finds you and leads you to the trouble at a fast walk.';

export const SYMPTOM = {
  lamps: null,
  props: [
    { kind: 'rubble', opts: { cut: true } },
    { kind: 'rubble', opts: { cut: false } }
  ]
};

export const INTROS = {
  'q1-joins': {
    prop: { kind: 'rubble' },
    steps: walkUp('ligar-chief', 'You are the chemist off the ship? Half the tunnel is blocked, so come with me.', { speed: 1.6 })
  },
  'q3-distance': {
    prop: { kind: 'rubble', opts: { cut: true } },
    steps: walkUp('ligar-surveyor', 'I need you to see the face of the cut before anyone touches it.', { speed: 1.5, show: 'No torch marks, no chisel marks. Look at it.' })
  },
  'q4-dots': {
    prop: { kind: 'rubble', effects: [{ kind: 'plume', at: 'crack', color: 0xc8c4b8, rise: 0.5, opacity: 0.22, spread: 0.3 }] },
    steps: walkUp('ligar-miner', 'Something is seeping out of the rock where the blast hit. Quick, before it spreads.', { speed: 1.6 })
  },
  'q9-orbitals': {
    prop: { kind: 'pipe', opts: { len: 2.0 } },
    steps: walkUp('ligar-medic', 'This pipe carries air to the miners. I have to know it still carries oxygen.', { speed: 1.5 })
  }
};
