/** Ember Reach: a cold colony on a volcano. You walk in on the shelter crew arguing about where the warmth went. */
import { overheard, walkUp } from './scenes.js';

export const STYLE = 'A colony going cold on top of a volcano: you walk in on the shelter crew arguing over the frost, and the pipe fitter fetches you to what he found.';

export const SYMPTOM = {
  lamps: null,
  props: [
    { kind: 'pipe', opts: { frost: true, len: 3.6 }, effects: [{ kind: 'plume', at: 'joint', color: 0xeef4f6, opacity: 0.18, rise: -0.15, spread: 0.5, down: true }] },
    { kind: 'pipe', opts: { frost: true, len: 2.8, valve: false }, effects: [{ kind: 'plume', at: 'ground', color: 0xeef4f6, opacity: 0.14, rise: 0.3, spread: 0.4 }] }
  ]
};

export const INTROS = {
  'q1-flow': {
    prop: { kind: 'pipe', opts: { frost: true }, effects: [{ kind: 'plume', at: 'joint', color: 0xeef4f6, opacity: 0.2, rise: 0.25, spread: 0.5 }] },
    steps: overheard('ember-cook', 'ember-warden',
      'My stove is lit and the soup still froze in the pot overnight.',
      'Then explain the frost on this pipe. We are standing on a volcano.')
  },
  'q2-calorimetry': {
    prop: { kind: 'pipe', opts: { len: 2.6 } },
    steps: walkUp('ember-fitter', 'There is a pipe in the rock that none of us laid. Come and see.',
      { show: 'No maker stamp, no colour band, nothing to say what it is made of.' })
  }
};
