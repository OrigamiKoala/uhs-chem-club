/** Lanternfall: the lamps are out across the ice, and the trouble happens in front of you while the crew call it from the dark. */
import { happens } from './scenes.js';

export const STYLE = 'Things fail in front of you in the dark: a lamp lights and does nothing, a tube starts to glow, coolant runs blue, while the crew call out from out of sight.';

export const SYMPTOM = { lamps: 'sputter', props: [] };

export const INTROS = {
  'q1-wave': {
    prop: { kind: 'beacons', effects: [{ kind: 'blink', part: 'heads' }] },
    steps: happens('voice:lanternfall-watch', 'Watch the mast on the point. Red and violet, flashing at the same moment.')
  },
  'q2-photon': {
    prop: { kind: 'plate', opts: { lamp: 0xd8352a }, effects: [{ kind: 'glow', part: 'lamp', max: 2.2 }, { kind: 'dark', part: 'cells' }] },
    steps: happens('voice:lanternfall-fitter', 'That is the brightest red lamp I own, right on the plate. The meter has not moved.', { walk: true })
  },
  'q3-lines': {
    prop: { kind: 'tube', opts: { color: 0xf0e08a }, effects: [{ kind: 'flicker', part: 'gas' }] },
    steps: happens('voice:lanternfall-keeper', 'Nobody switched that on. The Fifth left it by the tower door.', { walk: true })
  },
  'q7-pes': {
    prop: { kind: 'heap', opts: { color: 0x7a7a78, r: 0.6, h: 0.45 }, effects: [{ kind: 'plume', color: 0x8a8a88, rise: 0.4, spread: 0.6, opacity: 0.3, drift: 1.2 }] },
    steps: happens('voice:lanternfall-hand', 'Blew in under the tower door after they left. None of ours.', { walk: true })
  },
  'q8-trends': {
    prop: { kind: 'plate', effects: [{ kind: 'sparks', at: 'edge' }, { kind: 'dark', part: 'cells' }] },
    steps: happens('voice:lanternfall-fitter', 'There goes the last plate on the tower. Cracked right across.', { snap: true })
  },
  'q9-absorb': {
    prop: { kind: 'tank', opts: { liquid: 0x2f6fae, level: 0.5 }, effects: [{ kind: 'drip', at: 'spout', color: 0x3a7cc0 }] },
    steps: happens('voice:lanternfall-keeper', 'Open the drain cock on the coolant tank. It should run clear.', { walk: true })
  }
};
