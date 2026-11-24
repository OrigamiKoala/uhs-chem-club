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
    steps: [
      { do: 'place', who: 'cloak', at: 'stand', face: 'spot' },
      { do: 'look', at: 'spot', dur: 1.4 },
      { do: 'say', who: 'vess', lines: ['Someone was at that pylon, working on the plates.'] },
      { do: 'go', who: 'cam', to: 'view', lookAt: 'spot', wait: false },
      { do: 'wait', s: 1.2 },
      { do: 'vanish', who: 'cloak' },
      { do: 'look', at: 'spot', dur: 1.0 },
      { do: 'say', who: 'vess', lines: [], ask: true }
    ]
  },
  'q3-galvanic': {
    prop: { kind: 'cells', opts: { n: 4 }, effects: [{ kind: 'dark', part: 'lamp' }] },
    steps: happens('voice:brinewire-cells', 'There goes our last backup battery. They cut the tube joining the two beakers while leaving the wires untouched.', { snap: true })
  },
  'q6-electrolysis': {
    prop: { kind: 'clamp', effects: [{ kind: 'sparks', at: 'jaw' }] },
    steps: cloaked('There. Running a cable from the line down into the pool.', 'That cable is carrying current into the pool.', { start: true })
  }
};
