/** Brinewire: the grid browning out at night, and someone caught in the act at the pylons. */
import { cloaked, happens } from './scenes.js';

export const STYLE = 'A grid browning out at night: a hooded figure caught at the pylons, sparks after it runs, and a battery bank dying in front of you.';

export const SYMPTOM = {
  lamps: 'dim',
  props: [
    { kind: 'clamp', effects: [{ kind: 'sparks', at: 'jaw' }] },
    { kind: 'clamp', effects: [{ kind: 'sparks', at: 'jaw' }] }
  ]
};

export const INTROS = {
  'q1-halves': {
    prop: { kind: 'pylon' },
    steps: cloaked('Someone at the pylon, working on the plates.', 'Look where the two metals are bolted together. It is rotting there.')
  },
  'q3-galvanic': {
    prop: { kind: 'cells', opts: { n: 4 }, effects: [{ kind: 'dark', part: 'lamp' }] },
    steps: happens('voice:brinewire-cells', 'There goes the last bank. They cut its salt bridges, and the wires are untouched.', { snap: true })
  },
  'q6-electrolysis': {
    prop: { kind: 'clamp', effects: [{ kind: 'sparks', at: 'jaw' }] },
    steps: cloaked('There. Running a cable from the line down into the pool.', 'That cable is carrying current into the pool.', { start: true })
  }
};
