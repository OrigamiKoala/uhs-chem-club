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
    text: (f) => {
      const p = f.props || {};
      const visibleDials = Object.keys(f.dials || {}).filter(d => !(p.hidden || []).includes(d));
      if (p.noRun || f.noRun) {
        if (p.halfLives) return 'Each dotted line marks one half-life on the curve. Read the time and remaining amount straight from the graph.';
        if (p.extendTo) return 'The solid curve shows measured data and the dashed line extends past it. Read the values from the graph and plate.';
        return 'Read the marked points straight off the curve.';
      }
      if (p.pick) return 'Press "Run" on each vessel to trace its product curve, then tap the vessel you want (or tap the choice plate).';
      if (p.tapZones) return 'Press "Run" to trace the reactant curve as it drops, then tap one of the three time ranges below the axis.';
      if (p.twoStepDial) return 'Switch the "Step speeds" dial between both presets and press "Run" on each to see how fast product P forms.';
      if (p.changeDial) return 'Try each setting on the "Change" dial and press "Run" to compare its curve with the dashed baseline.';
      if (p.logTo && visibleDials.length > 1) return 'Change one concentration dial at a time and press "Run" after each change to compare rows in the log.';
      if (p.logTo) return 'Set the concentration dial and press "Run", then change it and press "Run" again to compare rows in the log.';
      if (p.showCounts && p.catalystCount != null) return 'Press "Run" on both vessels and watch the particle counts and catalyst count underneath.';
      if (p.showCounts) return 'Press "Run" and compare the particle counts underneath the vessel.';
      if (p.halfLives) return 'Press "Run". Dotted lines mark when half, then a quarter of the reactant remains.';
      return 'Press "Run" to watch particles react and trace the curve.';
    }
  },
  'rate:choice': null,
  'rate:lead': {
    title: 'Preview',
    dials: false,
    text: (f) => {
      const s = f.props?.scene;
      if (s === 'rates') return 'The vertical axis shows how much product has formed and the horizontal axis shows time. Watch both curves, then place your prediction.';
      if (s === 'collide') return 'Watch the particles collide and check the Collisions and Reacted counters, then place your prediction.';
      if (s === 'catalyst') return 'Compare the vessel with no dust to the one with yellow dust rings, then place your prediction.';
      return 'Watch the preview, then place your prediction card.';
    }
  },
  'rate:rateslog': {
    title: 'Initial-rates log',
    dials: false,
    text: (f) => {
      const p = f.props || {};
      if (p.rateLawText) return 'Use the rate law at the top with the numbered rows of concentrations and initial rates.';
      if ((p.rows || []).length > 0) return 'Pick two numbered rows where only one concentration changes.';
      return 'Each time you press "Run", your starting concentrations and initial rate appear as a new row here.';
    }
  },
  'rate:rateboard': {
    title: 'Rate-law board',
    dials: false,
    text: 'Tap 0, 1, or 2 on each reactant\'s row to set its order in the rate law.'
  },
  'rate:plotter': {
    title: 'Data plotter',
    dials: false,
    text: (f) => {
      const multi = (f.props?.datasets || []).length > 1;
      return multi
        ? 'Pick a reaction (R1, R2, or R3), then switch the Plot dial through [A], ln[A], and 1/[A] to see which one lines up with the dashed straightedge.'
        : 'Switch the Plot dial through [A], ln[A], and 1/[A] to see which plot lines up with the dashed straightedge.';
    }
  },
  'rate:arrplot': {
    title: 'ln k vs 1/T',
    dials: false,
    text: 'Read the two marked points and the rise/run triangle to find the slope −Ea / R.'
  },
  'rate:collview': {
    title: 'Collision view',
    dials: false,
    text: (f) => {
      const mode = f.props?.mode;
      if (mode === 'surface') return 'Press "Play" to watch the gas molecule land on the solid, stretch, and react, then tap where it happens.';
      if (mode === 'energy') return 'Switch the "Pair" dial between Slow and Fast and press "Play" to compare each pair\'s energy with the Ea bar.';
      if (mode === 'orientation') return 'Switch the "Pair" dial between Sideways and Head-on and press "Play" to see whether the reactive ends meet.';
      return 'Press "Play" to watch the colliding particles meet and react.';
    }
  },
  'rate:mbhist': {
    title: 'Energy spread',
    dials: false,
    text: 'Tap or slide the Temperature dial to see how the share of particles past the Ea line changes.'
  },
  'rate:kprofile': {
    title: 'Energy profile',
    dials: false,
    text: (f) => {
      const p = f.props || {};
      if (p.tapZones) return 'Compare the solid curve and the dashed catalysed curve, then tap the part of the profile that changes.';
      if (p.noProgress) return 'Read the energy levels on the dashed lines straight off the profile.';
      return 'Drag the ball along the hill (or slide "Progress") to read the energy at the start and at the peak.';
    }
  },
  'rate:stack': {
    title: 'Step sum',
    dials: false,
    text: 'Drag both step cards into "The stack" tray. Anything made in one step and used in the next cancels out.'
  }
};

const PIECES = {};

addTourText(FIXTURES, PIECES);
aliasTourKit('heat', 'rate');
