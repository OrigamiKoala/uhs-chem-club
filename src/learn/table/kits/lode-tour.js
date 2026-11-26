/**
 * kits/lode-tour.js — what the Tour says about Lodestone's instruments (unit12). Three beats per step: what it is, what to do with it, what it
 * tells you. Words only the benches have already earned; never which move solves a stage.
 */

import { addTourText, aliasTourKit } from '../tour.js';
import './heat-tour.js';

const FIXTURES = {
  'lode:dshell': {
    title: 'Energy ladder', dials: false,
    text: f => (f.props?.mode === 'remove'
      ? (f.noRun ? 'Tap an orbital box to remove electrons until the ion reaches the target charge.' : 'Tap an orbital box to remove electrons, then press "Test Energy" to check.')
      : f.props?.mode === 'show'
        ? 'Drop an element card on "Load an atom" to inspect its orbitals.'
        : (f.noRun ? 'Tap an orbital box to add or remove electrons.' : 'Tap an orbital box to add or remove electrons, then press "Test Energy" to check.'))
  },
  'lode:iestrip': {
    title: 'Ionization strip', dials: false,
    text: f => (f.dials?.mark
      ? 'Press "Remove an Electron" to plot each ionization energy, then tap the gap where it jumps.'
      : 'Press "Remove an Electron" to remove electrons and plot each ionization energy.')
  },
  'lode:lchoice': null,
  'lode:beaker': {
    title: 'Flask & window', dials: false,
    text: 'Press "Add Ammonia" to watch the solution and copper ion change, then pick what happened.'
  },
  'lode:cplx': {
    title: 'Complex viewer', dials: false,
    text: f => {
      const m = f.props?.mode;
      if (m === 'bond') return 'Press "Bond" and watch the coloured electrons, then pick which electrons formed the bond.';
      if (m === 'ring6') return 'Press "Release", then drag the "Turn" dial to inspect the settled shape.';
      if (m === 'supply') return 'Press the "Add" button until no more ligands can bond.';
      if (m === 'cycle') return 'Tap the dotted rings around the ion to switch ligands.';
      if (f.props?.mark) return 'Drag each "Turn" dial to "Above", then tap models to select them.';
      return 'Drag the "Turn" dial to rotate the complex.';
    }
  },
  'lode:match': {
    title: 'Turn to fit', dials: false,
    text: 'Tap the dotted rings on each model to build it, then press "Turn B to Fit A" to compare them.'
  },
  'lode:spec': {
    title: 'Prism & strip', dials: false,
    text: f => (f.props?.ammonia
      ? 'Drop the vial in Sample, press "Add Ammonia", then tap a colour on the strip.'
      : f.props?.tapBands
        ? 'Drop the vial in Sample, then tap the dark absorbed colour on the strip.'
        : 'Drop a vial in Sample to see which colours it absorbs.')
  },
  'lode:wheel': {
    title: 'Colour wheel', dials: false,
    text: f => (f.props?.tapColours
      ? 'Tap the colour directly opposite the absorbed colour on the wheel.'
      : 'Use the wheel to match each seen colour with the absorbed colour directly opposite it.')
  },
  'lode:cfield': {
    title: 'Five d orbitals', dials: false,
    text: 'Drag "Ligands" toward Bonded to see which orbitals rise in energy, then tap two orbitals to select them.'
  },
  'lode:dsplit': {
    title: 'Split d orbitals', dials: false,
    text: f => {
      const m = f.props?.mode;
      if (m === 'ruler') return 'Tap the colour bar whose photon energy matches the dashed gap line.';
      if (m === 'build') return 'Tap orbital boxes to place electrons, then press "Test Energy".';
      if (m === 'fill') return 'Set the dials and press "Fill Lowest" to see how the d electrons arrange themselves.';
      if (m === 'vial') return 'Drop a vial in Sample and press "Shine Light" to see if an electron can jump the gap.';
      return 'Inspect the split d orbitals.';
    }
  },
  'lode:lodelead': {
    title: 'Watch first', dials: false,
    text: 'Watch the clip, then drag a prediction card into the slot.'
  },
  'lode:magnet': {
    title: 'Magnet balance', dials: false,
    text: 'Drag a vial into Sample and press "Switch On" to measure its magnetic pull.'
  }
};

const PIECES = {
  'lode:vial': ['Sample vials', 'Drag a vial into a Sample slot to test it.'],
  'lode:elem': ['Element cards', 'Drag a card onto "Load an atom" to inspect it.']
};

addTourText(FIXTURES, PIECES);
aliasTourKit('heat', 'lode');
