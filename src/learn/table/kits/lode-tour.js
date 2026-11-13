/**
 * kits/lode-tour.js — what the Tour says about Lodestone's instruments (unit12). Three beats per step: what it is, what to do with it, what it
 * tells you. Words only the benches have already earned; never which move solves a stage.
 */

import { addTourText, aliasTourKit } from '../tour.js';
import './heat-tour.js';

const FIXTURES = {
  'lode:dshell': {
    title: 'Energy ladder', dials: false,
    text: 'Each box is one orbital, drawn at its energy: higher on the ladder means more energy. Tap a box to add an electron (a third tap empties it) or, where the ladder starts full, to take one away. Where there is a "Test Energy" key, press it to see whether any electron could sit lower; the ones that could are drawn moving to where they would go.'
  },
  'lode:iestrip': {
    title: 'Ionization strip', dials: false,
    text: 'The small ladder on the left holds the atom\'s electrons. Press "Remove an Electron" to take away the electron that is easiest to remove: it leaves the ladder and its cost appears as a bar, coloured like the level it left. Tap the gap between two bars to mark where the cost jumps.'
  },
  'lode:lchoice': {
    title: 'Your choice', dials: false,
    text: 'Tap the instrument you choose. Its frame turns amber and its name appears here; that is your answer when you press Submit.'
  },
  'lode:beaker': {
    title: 'Flask and window', dials: false,
    text: 'A flask of copper(II) solution, and beside it a window that magnifies one copper ion and the molecules bonded round it. Press "Add Ammonia" to add ammonia: the flask shows the colour, and the window shows what happens round the ion.'
  },
  'lode:cplx': {
    title: 'Metal ion and its neighbours', dials: false,
    text: 'One metal ion in the middle, and the molecules or ions bonded round it, drawn in three dimensions; where there is a "Turn" dial it tilts the model so you can see it from above or edge-on. Where there is an "Add" key, press it to add one more molecule; where there are empty rings, tap a ring to choose what bonds there, tapping again to change it. A key such as "Release" or "Bond" plays what happens next.'
  },
  'lode:match': {
    title: 'Turn to fit', dials: false,
    text: 'Press the key to try every way of turning and flipping model B. If one lays every ligand of B on the same kind of ligand in A, it plays that turn and says they are the same; if none does, it says they are different.'
  },
  'lode:lodelead': {
    title: 'Watch first', dials: false,
    text: 'A short clip of a neighbouring case that plays by itself. Watch it, then make your prediction.'
  }
};

const PIECES = {
  'lode:elem': ['Element cards', 'Each card names one element. Drag a card onto the ladder\'s square, or tap the card and then the square, to load that element\'s atom.']
};

addTourText(FIXTURES, PIECES);
aliasTourKit('heat', 'lode');
