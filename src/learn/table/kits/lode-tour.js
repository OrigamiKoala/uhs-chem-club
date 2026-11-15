/**
 * kits/lode-tour.js — what the Tour says about Lodestone's instruments (unit12). Three beats per step: what it is, what to do with it, what it
 * tells you. Words only the benches have already earned; never which move solves a stage.
 */

import { addTourText, aliasTourKit } from '../tour.js';
import './heat-tour.js';

const FIXTURES = {
  'lode:dshell': {
    title: 'Energy ladder', dials: false,
    text: 'Tap an orbital box to add or remove electrons; press "Test Energy" to check.'
  },
  'lode:iestrip': {
    title: 'Ionization strip', dials: false,
    text: 'Press "Remove an Electron" to strip electrons and plot each removal cost.'
  },
  'lode:lchoice': null,
  'lode:beaker': {
    title: 'Flask & window', dials: false,
    text: 'Press "Add Ammonia" to watch the solution colour and ion change.'
  },
  'lode:cplx': {
    title: 'Complex viewer', dials: false,
    text: 'Turn the dial to rotate, tap rings to place ligands, or press the action key.'
  },
  'lode:match': {
    title: 'Turn to fit', dials: false,
    text: 'Press the key to rotate and flip model B onto model A.'
  },
  'lode:spec': {
    title: 'Prism & strip', dials: false,
    text: 'Drag a vial into the holder to see which colours are absorbed.'
  },
  'lode:wheel': {
    title: 'Colour wheel', dials: false,
    text: 'Opposite colours are complementary; tap a colour to select it.'
  },
  'lode:cfield': {
    title: 'Five d orbitals', dials: false,
    text: 'Turn "Ligands" to move them closer; tap an orbital to mark it.'
  },
  'lode:dsplit': {
    title: 'Split d orbitals', dials: false,
    text: 'Tap orbitals to place electrons, adjust dials, or load a vial.'
  },
  'lode:lodelead': {
    title: 'Watch first', dials: false,
    text: 'Watch the case play out, then make your prediction.'
  },
  'lode:magnet': {
    title: 'Magnet balance', dials: false,
    text: 'Drag a vial into the holder and press "Switch On" to measure pull.'
  }
};

const PIECES = {
  'lode:vial': ['Sample vials', 'Drag a vial into a holder to test it.'],
  'lode:elem': ['Element cards', 'Drag a card onto the ladder square to load that atom.']
};

addTourText(FIXTURES, PIECES);
aliasTourKit('heat', 'lode');
