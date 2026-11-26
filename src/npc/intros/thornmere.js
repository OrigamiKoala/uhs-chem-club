/** Thornmere: a swamp where the Fifth leave drag marks. A guide leads you along the trail through the reeds. */
import { walkUp, followTrail } from './scenes.js';

export const STYLE = 'Drag marks through the swamp: tar trails lead from the bench, and the outpost crew walk you along them.';

export const SYMPTOM = {
  lamps: null,
  props: [{ kind: 'crates', opts: { n: 4, wrapped: true } }, { kind: 'tar' }]
};

export const INTROS = {
  'q1-chains': {
    prop: { kind: 'tar' },
    trail: 'tar',
    steps: followTrail('voice:thornmere-guide', 'They drag it from the swamp to their plant every night. Black, and it stinks of lamp oil.')
  },
  'q4-groups': {
    prop: { kind: 'drums', opts: { n: 2, color: 0x4a5a4a, band: 0x8c2a1e }, effects: [{ kind: 'drip', at: 'top', color: 0xd8d8c8, floor: 0.05 }] },
    steps: walkUp('thornmere-chemist', 'Come take a look at this. One of these drums is eating through its own steel.')
  },
  'q6-polymers': {
    prop: { kind: 'crates', opts: { n: 3, wrapped: true } },
    trail: 'prints',
    steps: walkUp('thornmere-salvage', 'I have hit this armor with an axe and a torch. Not a mark on it.')
  }
};
