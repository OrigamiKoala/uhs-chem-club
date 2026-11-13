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
