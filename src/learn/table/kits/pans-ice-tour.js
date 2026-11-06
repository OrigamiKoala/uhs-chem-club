/**
 * kits/pans-ice-tour.js — Tour words for the ICE board and settling bars of `q5-ice`. Three beats a step; earned words only.
 */

import { addTourText } from '../tour.js';

const FIXTURES = {
  'pans:iceboard': {
    title: 'Board', dials: false,
    text: 'A grid with a column for each substance and three rows. The top row is the amount each substance starts with. Drag a change card into the middle row of a column to say how that substance changes while the vessel settles. The bottom row then writes what is left as the start plus the card you laid, and leaves the unknown x in it.'
  },
  'pans:icebars': {
    title: 'Settling bars', dials: false,
    text: 'A sealed vessel drawn as bars, two for each substance. The dashed bar is what it starts with. Press "Settle" and a solid bar rises or falls to where the vessel ends up. The numbers on the left give the height of a bar, in moles per litre.'
  }
};

const PIECES = {
  ichip: ['Change card', 'A card with a change written on it, such as "−x" or "+2x", where x is an amount nobody knows yet. Drag it into the middle row of a substance\'s column. A minus sign says the substance is used up, a plus sign says it is made.']
};

addTourText(FIXTURES, PIECES);
