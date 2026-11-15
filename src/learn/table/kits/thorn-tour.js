/**
 * kits/thorn-tour.js — what the Tour says about Thornmere's instruments (unit13). Three beats per step: what it is, what to do with it,
 * what it tells you. Words only the benches have already earned; never which move solves a stage. Later families add their own words
 * with `addTourText` from their own file.
 */

import { addTourText, aliasTourKit } from '../tour.js';
import './heat-tour.js';

const FIXTURES = {
  'thorn:tbuild': {
    title: 'Model board', dials: false,
    text: 'Tap a dashed ring to place C, tap between Cs to bond, or tap C to adjust H.'
  },
  'thorn:tmol': {
    title: 'Electron view', dials: false,
    text: 'Tap an atom, bond, or electron pair to select or push electrons.'
  },
  'thorn:tlead': {
    title: 'Watch first', dials: false,
    text: 'Watch the case play out, then make your prediction.'
  },
  'thorn:ttest': {
    title: 'Test rig', dials: false,
    text: 'Drag a sample card into the slot and press the test key.'
  },
  'thorn:tchoice': null
};

const PIECES = {};

addTourText(FIXTURES, PIECES);
aliasTourKit('heat', 'thorn');
