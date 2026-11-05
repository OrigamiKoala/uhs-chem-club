/**
 * kits/ph-curve-tour.js — what the Tour says about the curve plotter (Verdigris, `q6-titrate`).
 */
import { addTourText } from '../tour.js';

addTourText({
  'ph:phcurve': {
    title: 'Curve', dials: false,
    text: 'The plot shows pH up the side and the mL poured across the bottom. Each time you pour, a dot is added for every flask, joined to the last by a straight line, so the plot shows only what you have poured. Where a dial named "Mark at" is on the plot, it moves a vertical line along the volume scale. A list beside the plot repeats the latest readings.'
  }
}, {});
