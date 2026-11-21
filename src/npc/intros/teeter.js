/** Teeter: ponds marked dead at dusk, and a hooded figure still tending them. */
import { cloaked, overheard } from './scenes.js';

export const STYLE = 'Dead ponds at dusk that someone is still tending: a hooded figure at the pond or the pump, gone before you get there.';

export const SYMPTOM = {
  lamps: null,
  props: [
    { kind: 'pump', effects: [{ kind: 'rock' }] },
    { kind: 'pump', effects: [{ kind: 'rock', speed: 1.3 }] }
  ]
};

export const INTROS = {
  'q1-both': {
    prop: { kind: 'pond', opts: { r: 1.8, liquid: 0x8a8670 } },
    steps: cloaked('By the pond marked dead, someone is taking a water sample.', 'Nothing in there looks active, yet they still came out here to check it.')
  },
  'q6-lean': {
    prop: { kind: 'pump', effects: [{ kind: 'rock' }] },
    steps: cloaked('Look at that pump by the pond.', 'Every other pond on these flats has stopped making salt, yet this one keeps going.', { start: true })
  },
  'q7-dissolve': {
    prop: { kind: 'pipe', opts: { frost: true, len: 3.0, valve: false } },
    steps: overheard('teeter-oldhand', 'teeter-raker',
      'Forty years I raked these pans, and the pipes never crusted like this.',
      'I scrape them every week. The salt grows straight back.')
  }
};
