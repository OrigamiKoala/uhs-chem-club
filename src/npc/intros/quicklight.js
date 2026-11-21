/** Quicklight: towers flaring hot without warning. The view whips round, and the tower crew come running. */
import { walkUp } from './scenes.js';

const flare = steps => [{ do: 'wait', s: 0.4 }, { do: 'start' }, { do: 'look', at: 'spot', dur: 1.0, rate: 8 }, ...steps];

export const STYLE = 'Towers flaring without warning: a vent flares at your back, the view whips round, and the tower crew come running.';

export const SYMPTOM = {
  lamps: null,
  props: [
    { kind: 'vent', opts: { hot: true }, effects: [{ kind: 'glow', part: 'skin', max: 1.4 }, { kind: 'plume', at: 'mouth', color: 0xffffff, opacity: 0.1, rise: 1.3, spread: 0.3 }] },
    { kind: 'vent', opts: { hot: true }, effects: [{ kind: 'glow', part: 'skin', max: 1.1 }, { kind: 'plume', at: 'mouth', color: 0xffffff, opacity: 0.1, rise: 1.3, spread: 0.3 }] }
  ]
};

export const INTROS = {
  'q1-watch': {
    prop: { kind: 'vent', opts: { hot: true }, effects: [{ kind: 'glow', part: 'skin', max: 1.6 }, { kind: 'plume', at: 'mouth', color: 0xffffff, opacity: 0.12, rise: 1.4, spread: 0.3 }] },
    steps: flare(walkUp('quicklight-sweeper', 'You saw that? Same fuel as the line next to it, and that one is barely warm.', { speed: 1.5 }))
  },
  'q6-shortcut': {
    prop: { kind: 'vent', effects: [{ kind: 'plume', at: 'mouth', color: 0xd8c050, opacity: 0.35, rise: 0.8, spread: 0.5 }] },
    steps: flare(walkUp('quicklight-control', 'Come and look at what the vent is breathing out. That yellow dust is everywhere.', { speed: 1.5 }))
  }
};
