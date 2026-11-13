/**
 * kits/rate-tour.js — Tour text for the `rate` kit (Quicklight, unit11).
 * Three beats per step: what it is, what to do with it, what it tells you.
 */

import { addTourText, aliasTourKit } from '../tour.js';
import './heat-tour.js';

const FIXTURES = {
  'rate:kvessel': {
    title: 'Reaction vessel',
    dials: false,
    text: 'A chamber of reacting particles beside a concentration-time graph. Press "Run" (or turn a dial first) to watch particles react and trace the curve.'
  },
  'rate:choice': {
    title: 'Choice plate',
    dials: false,
    text: 'Tap the vessel or plate that matches your answer. The selected choice lights up in amber and is graded when you press Submit.'
  },
  'rate:lead': {
    title: 'Preview clip',
    dials: false,
    text: 'A short moving preview of the system. Watch what happens before locking in your prediction.'
  },
  'rate:rateslog': {
    title: 'Initial-rates log',
    dials: false,
    text: 'A table recording the starting concentrations and measured initial rate for each run. Compare two rows where only one concentration changes.'
  },
  'rate:rateboard': {
    title: 'Rate-law board',
    dials: false,
    text: 'An equation board with a power dial on each reactant concentration. Turn each dial to set that reactant\'s order in the rate law.'
  },
  'rate:plotter': {
    title: 'Data plotter',
    dials: false,
    text: 'A graph that redraws the same concentration readings as [A], ln[A], or 1/[A] against time. Tap each key and check which points lie on the straightedge.'
  },
  'rate:arrplot': {
    title: 'ln k against 1/T',
    dials: false,
    text: 'A graph of two measurements, ln k against 1/T, joined by a straight line. Read both points off the graph and work out the slope of the line.'
  },
  'rate:collview': {
    title: 'Collision view',
    dials: false,
    text: 'A slow-motion view of colliding particles with speed arrows and tinted reacting atoms. Press "Play" to watch whether they react or bounce apart.'
  },
  'rate:mbhist': {
    title: 'Energy distribution',
    dials: false,
    text: 'A bar chart showing how particle kinetic energies are spread out, with a vertical activation-energy bar. Turn the temperature dial to see the shaded share past the bar.'
  },
  'rate:kprofile': {
    title: 'Energy profile',
    dials: false,
    text: 'A plot of energy from reactants over the barrier to products. Drag the ball along the path or tap a highlighted region to mark your answer.'
  }
};

const PIECES = {};

addTourText(FIXTURES, PIECES);
aliasTourKit('heat', 'rate');
