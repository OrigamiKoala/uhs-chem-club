/** Lodestone: a canyon of mislabelled drums and a magnet with a mind of its own. The tally crew argue; the magnet acts. */
import { overheard, happens } from './scenes.js';

export const STYLE = 'A canyon of mislabelled drums: the tally crew argue over what is in them, and the great magnet chooses drums by itself.';

export const SYMPTOM = { lamps: null, props: [{ kind: 'magnet', effects: [{ kind: 'glow', part: 'disc', max: 0.6 }] }] };

export const INTROS = {
  'q2-charges': {
    prop: { kind: 'drums', opts: { n: 2, color: 0x6a4a3a, band: 0xc9a23a } },
    steps: overheard('lodestone-tally', 'lodestone-assay',
      'Same metal in both drums. One is marked plus two and one plus three.',
      'Then one of the marks is wrong. Or both are right.')
  },
  'q3-complex': {
    prop: { kind: 'tank', opts: { liquid: 0x1f3fa8, level: 0.75 } },
    steps: overheard('lodestone-hauler', 'lodestone-foreman',
      'Ammonia spilled into this drum on the way in. It was pale blue when it left the shaft.',
      'Look at it now. Deep blue, like ink.')
  },
  'q6-spin': {
    prop: { kind: 'magnet', effects: [{ kind: 'glow', part: 'disc', max: 0.9 }] },
    steps: happens('voice:lodestone-crane', 'It does it every time. It pulls that drum right off the line and leaves the one beside it.', { walk: true })
  }
};
