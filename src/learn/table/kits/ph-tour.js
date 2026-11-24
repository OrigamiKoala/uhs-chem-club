/**
 * kits/ph-tour.js — what the Tour says about the ph kit's instruments and pieces (Verdigris). Three beats a step: what it is, what to do
 * with it, what it tells you. Plain words, none a bench has not earned: the same text serves every bench that stands the instrument up,
 * so it uses none of the terms Verdigris teaches on its cards (weak, ionized, percent, Ka, buffer). It says how a tool works, never which
 * move solves the stage. The heat kit's cards, number marker, plate and answer dial keep their words (`heat-tour.js`) and are
 * re-registered under `ph:`.
 *
 * Fixtures are keyed `ph:<kind>`, pieces by kind. Each later instrument adds its own `ph-<name>-tour.js` beside this one.
 */

import { addTourText, aliasTourKit } from '../tour.js';
import './heat-tour.js';

const FIXTURES = {
  'ph:phflask': {
    title: 'Flask', dials: false,
    text: 'Each flask shows 200 particles. Drag the meter onto a flask to read its pH.'
  },
  'ph:phrig': {
    title: 'Expression board', dials: false,
    text: 'Cards on the same side of the line multiply; top is divided by bottom.'
  }
};

const PIECES = {
  phmeter: ['pH meter', 'Drag onto a flask to read its pH.'],
  phtile: ['Cards', 'Drag a card into a slot on the board.'],
  'ph:tag': ['Name cards', 'Drag a card to its place.'],
  'ph:note': ['Cards', 'Drag a card to its place.']
};

addTourText(FIXTURES, PIECES);
aliasTourKit('heat', 'ph');
