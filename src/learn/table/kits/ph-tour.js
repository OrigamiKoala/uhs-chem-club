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
    text: 'A flask holds one solution, named at the top with its strength in mol/L. The window is a magnified square holding 200 pieces of what was put in, one piece to a cell. A whole piece is one sphere, and a piece that has handed over a proton, or taken one, shows as the two spheres it made. The colours are named under the window, and the water is not drawn. Where the flask has a seat, the box under the window, lay the pH meter there to read the flask; the seat keeps the last reading it was given.'
  },
  'ph:phrig': {
    title: 'Ratio rig', dials: false,
    text: 'The rig has two rows of places with a line between them, and one column for each flask or pair. Drag tiles into the places. Each column then prints one number: the values of the tiles above the line multiplied together, divided by the values of the tiles below, taken at that column. A dash means nothing is laid yet. The rig does not say which arrangement to look for.'
  }
};

const PIECES = {
  phmeter: ['pH meter', 'A meter with a probe and a display. Drag it onto a flask\'s seat, or tap it and then tap the seat. The display then shows the pH of that flask, and it shows a dash when the meter is not on a flask.'],
  phtile: ['Tiles', 'Each tile names one number. Drag it into a place on the rig, or tap it and then tap the place. The rig uses each column\'s value of that number, and moving the tile to another place changes what the columns print.']
};

addTourText(FIXTURES, PIECES);
aliasTourKit('heat', 'ph');
