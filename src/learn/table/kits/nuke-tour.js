/**
 * kits/nuke-tour.js — what the Tour says about Cinder Halo's instruments (unit14). Three beats per step: what it is, what to do with it,
 * what it tells you. Words only the benches have already earned; never which move solves a stage. Later families add their own words
 * with `addTourText` from their own file.
 */

import { addTourText, aliasTourKit } from '../tour.js';
import './heat-tour.js';

const FIXTURES = {
  'nuke:ncount': {
    title: f => (f.props?.housing ? 'Lead housing' : f.props?.temps ? 'Temperature keys' : f.props?.plates ? 'Charged plates' : f.props?.shields ? 'Shield slot' : 'Counter'),
    key: f => (f.props?.housing ? 'fx_ncount_housing' : f.props?.temps ? 'fx_ncount_temps' : f.props?.plates ? 'fx_ncount_plates' : f.props?.shields ? 'fx_ncount_shields' : 'fx_ncount'),
    dials: false,
    text: f => {
      if (f.props?.housing) return 'Press "Count" with the housing open, then press "Lead Housing" to cover the tube with lead and count again.';
      if (f.props?.temps) return 'Drag the ore into the Sample slot, pick each temperature (−40, 20, 300 °C), and press "Count" at each setting.';
      if (f.props?.plates) return 'Two charged plates sit above and below the beam. Drag a source into the Sample slot and press "Run" to watch which way its tracks bend.';
      if (f.props?.shields) return 'Drag a source into the Sample slot and a shield into the Shield slot, then press "Count" to see what gets through.';
      return 'Place a sample on the left and count every track reaching the tube on the right. Drag a card into the Sample slot and press "Count" for a one-minute reading.';
    }
  },
  'nuke:nnuc': {
    title: f => (f.props?.follow ? 'Repulsion and hold' : 'Nucleus view'),
    key: f => (f.props?.follow ? 'fx_nnuc_follow' : 'fx_nnuc'),
    dials: false,
    text: f => (f.props?.follow
      ? 'Tap a column on the chart to compare proton repulsion against the strong nuclear force holding the nucleus together.'
      : 'Shows a nucleus as rust protons (positive, setting the element) and grey neutrons. Press "Watch the Nucleus" to see what leaves or changes. Not to scale.')
  },
  'nuke:nchart': {
    title: f => (f.props?.mode === 'walk' ? 'Stepping down the chart' : f.props?.legend ? 'Decay moves' : 'Chart of nuclides'),
    key: f => (f.props?.mode === 'walk' ? 'fx_nchart_walk' : f.props?.legend ? 'fx_nchart_move' : f.props?.band ? 'fx_nchart_band' : 'fx_nchart'),
    dials: false,
    text: f => {
      if (f.props?.mode === 'walk') return 'Tap "Alpha" or "Beta" to move the marker one decay at a time from the starting nucleus. Tap Undo to step back.';
      if (f.props?.legend) return 'Tap Alpha, Beta, or Positron beside the chart to preview where that decay lands and select your answer.';
      if (f.props?.band && f.props?.mode === 'columns') return 'Filled amber squares are stable nuclei (bismuth-209 decays too slowly to measure, so it is drawn stable). Tap a column to inspect an element\'s stable isotopes.';
      if (f.props?.eq) return 'Each square is one nucleus: protons increase to the right, neutrons upward. Tap a square to select it (including the starting square) and check the equation underneath.';
      return 'Each square is one nucleus: protons increase to the right, neutrons upward. Tap any square to inspect it.';
    }
  },
  'nuke:nlead': {
    title: 'Watch first', dials: false,
    text: 'Watch the short looping comparison, then drag a card into "My prediction". Predictions are never graded.'
  },
  'nuke:ndrum': {
    title: 'Sealed drums', dials: false,
    text: 'Two sealed drums showing their temperature and oxygen level. Tap a drum to zoom into its steel wall and see its atoms and any radiation tracks.'
  },
  'nuke:ndecay': {
    title: f => (f.props?.rate != null ? 'Count-rate clock' : 'Decaying sample'),
    key: f => (f.props?.rate != null ? 'fx_ndecay_rate' : 'fx_ndecay'),
    dials: false,
    text: f => (f.props?.rate != null
      ? 'Tap "Wait" to advance the clock and watch the count rate fall on the graph, or tap "Back" to step back.'
      : 'A grid of radioactive nuclei: bright dots have not decayed yet, dark dots have. Tap "Wait" to advance the clock and "Back" to step back.')
  },
  'nuke:nscale': {
    title: 'Balance', dials: false,
    text: f => (f.props?.build
      ? 'Two pans on a balance that tips toward the heavier side (tilt not to scale), with mass in atomic mass units (u). Tap "Add Proton" or "Add Neutron" to load the left pan.'
      : 'Two pans on a balance that tips toward the heavier side (tilt not to scale), with mass shown in atomic mass units (u).')
  },
  'nuke:ncurve': {
    title: 'Binding-energy curve', dials: false,
    text: 'Each point is one nucleus: mass number runs across the bottom, and binding energy per nucleon runs up the side. Tap any point to inspect or select it.'
  },
  'nuke:nchain': {
    title: f => (f.props?.mode === 'chain' ? 'Control rods' : 'Chain chamber'),
    key: f => (f.props?.mode === 'chain' ? 'fx_nchain_chain' : 'fx_nchain_split'),
    dials: false,
    text: f => (f.props?.mode === 'chain'
      ? 'Choose how many of each fission\'s three neutrons the control rods absorb, then press "Fire Neutron" to watch four generations.'
      : 'A uranium-235 nucleus. Press "Fire Neutron" to send in a slow neutron and watch it split.')
  },
  'nuke:ntissue': {
    title: 'Tissue strip', dials: false,
    text: 'A strip of living cells with a source at the left end. Tap Alpha, Beta, or Gamma to compare each trail and count how many molecules it breaks.'
  }
};

const PIECES = {
  'nuke:nsrc': ['Sample cards', 'Each card is one sample. Drag it into the Sample slot to test it, then drag your chosen card into the answer slot.'],
  'nuke:nshield': ['Shield cards', 'Each card is a sheet of shielding material. Drag it into the Shield slot between the sample and the counter tube.']
};

addTourText(FIXTURES, PIECES);
aliasTourKit('heat', 'nuke');
