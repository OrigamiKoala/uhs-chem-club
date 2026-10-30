/**
 * kits/matter-tour.js — what the Tour says about the matter kit's instruments and pieces (Mirrowen).
 *
 * Three beats per step (what it is, what to do with it, what it tells you), plain words, none a bench has not earned. Fixtures are keyed
 * `matter:<kind>`; pieces by `kind`. The heat kit's pieces keep the heat kit's words (`heat-tour.js`, keyed by kind) and its
 * instruments are re-registered here under `matter:` so a bench that stands them up on this kit finds them.
 */

import { addTourText, aliasTourKit } from '../tour.js';
import './heat-tour.js';

const FIXTURES = {
  'matter:probe': {
    title: 'Probe', dials: false,
    text: 'The probe has a slot on the left and a window on the right. Drag a card into the slot, then press the key under the window. The window shows four of that card\'s molecules held to one another, and the key pulls them apart. The number under the window is the heat that took, for one mole. The card keeps the number it read.'
  },
  'matter:plaque': {
    title: 'Plate', dials: false,
    text: 'A plate prints facts for the stage. Read it; it does not change.'
  },
  'matter:marker': {
    title: 'Number marker', dials: false,
    text: 'The marker holds a number. Drag its knob along the groove, or tap the groove, to set the number you worked out. Whatever it reads when you press Submit is your answer.'
  },
  'matter:selector': {
    title: 'Answer dial', dials: false,
    text: 'The dial has named positions. Drag its knob along the groove, or tap the groove, to point it at the answer you worked out. The position it shows when you press Submit is your answer.'
  }
};

const PIECES = {
  mol: ['Molecule cards', 'Each card shows one kind of molecule, or one ion, and its name. Drag a card into the probe, onto the rail, or into a tray. A card that has been in the probe keeps the number the probe read, so you can compare cards after they are out again.']
};

addTourText(FIXTURES, PIECES);
aliasTourKit('heat', 'matter');
