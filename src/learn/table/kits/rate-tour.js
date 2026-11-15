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
    text: 'Turn dials or press "Run" to watch particles react and trace the curve.'
  },
  'rate:choice': null,
  'rate:lead': {
    title: 'Preview clip',
    dials: false,
    text: 'Watch the preview, then make your prediction.'
  },
  'rate:rateslog': {
    title: 'Initial-rates log',
    dials: false,
    text: 'Records starting concentrations and initial rate for each run.'
  },
  'rate:rateboard': {
    title: 'Rate-law board',
    dials: false,
    text: 'Turn each dial to set that reactant\'s order.'
  },
  'rate:plotter': {
    title: 'Data plotter',
    dials: false,
    text: 'Tap [A], ln[A], or 1/[A] to see which plot is linear.'
  },
  'rate:arrplot': {
    title: 'ln k vs 1/T',
    dials: false,
    text: 'Read both points off the line to find its slope.'
  },
  'rate:collview': {
    title: 'Collision view',
    dials: false,
    text: 'Press "Play" to watch colliding particles react or bounce.'
  },
  'rate:mbhist': {
    title: 'Energy distribution',
    dials: false,
    text: 'Turn the temperature dial to see the share past the barrier.'
  },
  'rate:kprofile': {
    title: 'Energy profile',
    dials: false,
    text: 'Drag the ball along the path or tap a region to mark it.'
  }
};

const PIECES = {};

addTourText(FIXTURES, PIECES);
aliasTourKit('heat', 'rate');
