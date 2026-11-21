/** Bellows: alarms on the deck. Something goes off, the crew run to it, and you go after them. */
import { alarm } from './scenes.js';

export const STYLE = 'Alarms on the deck: a gauge or a vent goes off, the view snaps to it, and one of the deck crew runs over with you behind.';

export const SYMPTOM = {
  lamps: null,
  props: [
    { kind: 'cylinder', opts: { hot: true }, effects: [{ kind: 'glow', part: 'skin', max: 0.5 }, { kind: 'plume', at: 'top', color: 0xffffff, opacity: 0.08, rise: 0.6, spread: 0.5 }] },
    { kind: 'gauge', effects: [{ kind: 'needle' }] }
  ]
};

export const INTROS = {
  'q1-knocks': {
    prop: { kind: 'gauge', effects: [{ kind: 'needle' }] },
    steps: alarm('bellows-gauges', 'Nobody has touched these valves since the Fifth jammed them, and the needle is still climbing.')
  },
  'q2-laws': {
    prop: { kind: 'cylinder', opts: { hot: true }, effects: [{ kind: 'glow', part: 'skin', max: 0.5 }, { kind: 'plume', at: 'top', color: 0xffffff, opacity: 0.08, rise: 0.6, spread: 0.5 }] },
    steps: alarm('bellows-firewatch', 'This tank sat in the wind all night at fifty below. Its gauge has not dropped a mark.')
  },
  'q5-speed': {
    prop: { kind: 'vent', effects: [{ kind: 'plume', at: 'mouth', color: 0xe8e8f0, opacity: 0.12, rise: 1.0, spread: 0.2 }] },
    steps: alarm('bellows-valves', 'Hear that hiss? The vent is leaking, and whatever it is, you cannot see it.')
  }
};
