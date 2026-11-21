/** Kettle: a foundry that keeps arguing with its own books. You walk in on the crew quarrelling over the numbers. */
import { overheard, calledOver } from './scenes.js';

export const STYLE = 'A foundry quarrelling over its own books: you walk in on arguments over crates and a cloudy pond, and the weighmaster calls you over to a stack that should not exist.';

export const SYMPTOM = { lamps: null, props: [{ kind: 'ingots', opts: { rows: 6 } }] };

export const INTROS = {
  'q2-names': {
    prop: { kind: 'crates', opts: { n: 3, tag: 0x8c2a1e } },
    steps: overheard('kettle-loader', 'kettle-clerk',
      'There is no ore name on these crates. Just Fe₂O₃, stencilled on the side.',
      'That is the name. It just is not written in words.')
  },
  'q3-change': {
    prop: { kind: 'ingots', opts: { rows: 5 } },
    steps: calledOver('kettle-weigh', 'You, from the ship. Come and look at this stack before the boss sees it.',
      'The log says this iron weighs more than all the ore we fed the furnace.')
  },
  'q5-ionic': {
    prop: { kind: 'pond', opts: { r: 1.5, liquid: 0xd9d2a0 }, effects: [{ kind: 'bubbles', at: 'centre', color: 0xf0e8a8 }] },
    steps: overheard('kettle-assayer', 'kettle-furnace',
      'Both waste streams run in clear. Look where they meet.',
      'Yellow cloud, every time. What is forming in there?')
  }
};
