/** Tallow: the morning after the raid. The crew argue over what was taken, and the raiders' boot prints are still in the salt. */
import { overheard, followTrail } from './scenes.js';

export const STYLE = 'Morning after the raid: the crew argue at what was broken into, and boot prints in the salt lead to what was left.';

export const SYMPTOM = {
  lamps: null,
  props: [
    { kind: 'bin', opts: { specks: 0x3a3a40 }, near: 'salt-heap' },
    { kind: 'heap', opts: { color: 0xe9e4da, specks: 0x3a3a40, r: 1.1, h: 0.8 }, near: 'salt-heap' }
  ]
};

export const INTROS = {
  'q1-grain': {
    prop: { kind: 'bin', opts: { specks: 0x3a3a40 } },
    steps: overheard('tallow-watch', 'tallow-foreman',
      'I locked this bin at dusk. By morning both doors were hanging off.',
      'And look at what they left. Dark grit all through the salt.')
  },
  'q4-ledger': {
    prop: { kind: 'tank', opts: { liquid: 0xd8d6cf, level: 0.6 } },
    trail: 'prints',
    steps: followTrail('vess', 'The prints stop at this tank. Its label has been scraped clean off.')
  },
  'q6-weigh': {
    prop: { kind: 'drums', opts: { n: 4, color: 0x6b6f63, band: 0xc9a23a } },
    steps: overheard('tallow-belt', 'tallow-fitter',
      'These drums were full on Tuesday. Lift one now and it is half the weight.',
      'Nobody opens a sealed drum on this flat. So how do we tell what is gone?')
  }
};
