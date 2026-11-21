/** Mirrowen: a harbour frozen shut, and a hooded figure on the ice who should not be there. */
import { cloaked, overheard } from './scenes.js';

export const STYLE = 'A frozen harbour with someone on the ice: a hooded figure is seen at the trouble, and slips away as you come close.';

export const SYMPTOM = {
  lamps: null,
  props: [{ kind: 'iceboat' }, { kind: 'iceboat' }]
};

export const INTROS = {
  'q1-states': {
    prop: { kind: 'iceboat' },
    steps: cloaked('Someone is out by the frozen boat, pouring something onto the ice.', 'Gone. The canal froze solid around that boat overnight.')
  },
  'q4-solids': {
    prop: { kind: 'icewall' },
    steps: overheard('mirrowen-cutter', 'mirrowen-chemist',
      'My saw goes through harbour ice like bread. It skids off this.',
      'Ice and glass look the same until you melt them.')
  },
  'q6-solution': {
    prop: { kind: 'drums', opts: { n: 2, color: 0x4a5560, band: 0x8c2a1e, tipped: true } },
    steps: cloaked('Down on the dock by those drums, that same hooded raider again.', 'They emptied the drums straight into the canal.')
  }
};
