/** Verdigris: a radio fort under acid. The radio room sees everything and talks you to it over the wrist link. */
import { radio } from './scenes.js';

export const STYLE = 'Talked in over the radio: the fort crew can see the damage from their posts and guide you to it over the wrist link.';

export const SYMPTOM = {
  lamps: null,
  props: [
    { kind: 'pond', opts: { r: 1.4, liquid: 0x7d9a3a }, effects: [{ kind: 'bubbles', at: 'centre', color: 0xc8d890 }, { kind: 'plume', at: 'centre', color: 0xb8c890, opacity: 0.12, rise: 0.3, spread: 0.8 }] },
    { kind: 'pond', opts: { r: 1.1, liquid: 0x7d9a3a }, effects: [{ kind: 'bubbles', at: 'centre', color: 0xc8d890 }] }
  ]
};

export const INTROS = {
  'q1-handover': {
    prop: { kind: 'pond', opts: { r: 1.5, liquid: 0x7d9a3a }, effects: [{ kind: 'bubbles', at: 'centre', color: 0xc8d890 }, { kind: 'plume', at: 'centre', color: 0xb8c890, opacity: 0.14, rise: 0.3, spread: 0.8 }] },
    steps: radio('voice:verdigris-radio', 'Fort to the bench. The runoff from the Fifth\'s plant has reached the pipes again.', 'There, where it pools. It is eating the steel.')
  },
  'q3-weak': {
    prop: { kind: 'tank', opts: { liquid: 0x9ab04a, level: 0.8 }, effects: [{ kind: 'drip', at: 'spout', color: 0xb0c860 }] },
    steps: radio('voice:verdigris-intake', 'Intake here. Two waste tanks, same amount of acid in each by the papers.', 'This one ate through its drain cock in a day. The other barely stains.')
  },
  'q7-buffer': {
    prop: { kind: 'tank', opts: { liquid: 0x8fb4c8, level: 0.45 }, effects: [{ kind: 'drip', at: 'spout', color: 0x9ab04a }] },
    steps: radio('voice:verdigris-intake', 'Intake again. Acid from the marsh is splashing into the water line.', 'This is the tank the fort drinks from. Every splash changes it.')
  }
};
