/**
 * kits/pans-tour.js — what the Tour says about the pans kit's instruments (Teeter). Three beats a step: what it is, what to do with it,
 * what it tells you. Plain words, none a bench has not earned. The heat kit's cards, number marker and answer dial keep their words
 * (`heat-tour.js`) and are re-registered under `pans:`.
 */

import { addTourText, aliasTourKit } from '../tour.js';
import './heat-tour.js';

const FIXTURES = {
  'pans:pan': {
    title: 'Pan', dials: false,
    text: 'A shallow dish seen from above, with a window of small orange and blue spheres and a graph beside it. The graph counts the orange spheres and the blue ones against time. Press "Run" to let ten more ticks of time go by. Under the graph, the two counts say how many spheres turned from orange to blue, and from blue to orange, in the last fifty ticks. Where some spheres wear a white ring, a strip under the graph keeps the colour of each ringed sphere, one cell for every tick.'
  },
  'pans:plaque': {
    title: 'Plate', dials: false,
    text: 'A plate prints facts for the stage. Read it; it does not change.'
  },
  'pans:marker': {
    title: 'Number marker', dials: false,
    text: 'The marker holds a number. Drag its knob along the groove, or tap the groove, to set the number you read off the pan. Whatever it reads when you press Submit is your answer.'
  },
  'pans:selector': {
    title: 'Answer dial', dials: false,
    text: 'The dial has named positions. Drag its knob along the groove, or tap the groove, to point it at the answer you worked out. The position it shows when you press Submit is your answer.'
  }
};

const PIECES = {
  dgm: ['Diagram cards', 'Each card draws a dish of orange and blue spheres, frozen. Drag the card you choose into the slot; it is your answer when you press Submit.']
};

addTourText(FIXTURES, PIECES);
aliasTourKit('heat', 'pans');
