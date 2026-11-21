/** Cinder Halo: the Fifth's own base. Hooded figures move between the drums, and the counters never stop clicking. */
import { cloaked, walkUp } from './scenes.js';

export const STYLE = 'Inside the Fifth\'s base: hooded figures moving between drums and slag, and the radiation monitor leading you by his counter.';

export const SYMPTOM = {
  lamps: null,
  props: [
    { kind: 'drums', opts: { n: 5, color: 0x4d5b4a, band: 0xc9a23a, warm: true }, effects: [{ kind: 'glow', part: 'skins', max: 0.35 }, { kind: 'plume', at: 'top', color: 0xffffff, opacity: 0.06, rise: 0.5, spread: 0.6 }] },
    { kind: 'monitor', effects: [{ kind: 'needle', from: 0.8, to: -0.6 }, { kind: 'flicker', part: 'lamp' }] }
  ]
};

export const INTROS = {
  'q1-still-warm': {
    prop: { kind: 'drums', opts: { n: 4, color: 0x4d5b4a, band: 0xc9a23a, warm: true }, effects: [{ kind: 'glow', part: 'skins', max: 0.35 }, { kind: 'plume', at: 'top', color: 0xffffff, opacity: 0.07, rise: 0.5, spread: 0.6 }] },
    steps: cloaked('One of the raiders is right over by those ore drums.', 'The air is freezing, yet those drums feel warm to the touch.')
  },
  'q2-what-comes-off': {
    prop: { kind: 'monitor', effects: [{ kind: 'needle', from: 0.8, to: -0.6 }, { kind: 'flicker', part: 'lamp' }] },
    steps: walkUp('cinderhalo-monitor', 'Stand beside my radiation counter. Listen to it click even though the drums are sealed.')
  },
  'q3-equations': {
    prop: { kind: 'heap', opts: { color: 0x3a3634, specks: 0x9a9aa0, r: 1.0, h: 0.7 } },
    steps: cloaked('Someone is digging through the reactor waste pile.', 'Look at that waste: metals nobody ever fed into the reactor.')
  }
};
