/**
 * kits/ph-strip-tour.js — the Tour words of the fraction strip (Verdigris, q8-capacity).
 */

import { addTourText } from '../tour.js';

addTourText({
  'ph:phstrip': {
    title: 'Fraction strip', dials: false,
    text: 'The strip is a graph of how much of an acid is in each of its two forms at each pH, in percent. Drag the "pH" dial, or tap its groove, to move the amber line; where the flask has an "Acid" dial it picks which acid is graphed. The two percentages at the line are read from the graph, and a curve is drawn only over the pH values the dial has been moved across, so move the dial to see more of it. Where the strip shows a colour, the swatch is the colour of the solution at that pH.'
  }
}, {});
