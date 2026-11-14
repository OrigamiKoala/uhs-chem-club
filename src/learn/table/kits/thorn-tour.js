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
    text: 'A board of places where atoms can stand. Each C is a carbon atom, each H a hydrogen atom, and a line between two atoms is a bond. Tap a dashed ring to set a carbon there; tap between two carbons that stand side by side to change their bond from none to single to double; where carbons show a broken ring, tap a carbon to give it a hydrogen. A carbon holds four bonds and takes no more, so a new bond to a full carbon makes one of its hydrogens leave. The board has square corners only, so rings of three or five carbons cannot be drawn on it. Where there is a "Record" key, it keeps the molecule on the board in the strip at the side.'
  },
  'thorn:tmol': {
    title: 'Electron view', dials: false,
    text: 'A drawing of a molecule, atom by atom. Where pairs of electrons are shown, each pair is two pale dots: a pair on a line is shared by the two atoms it joins, and is drawn nearer the atom that attracts it more strongly (the shift is drawn larger than it is). A rust-coloured pair beside a line is the second pair of a double bond. Depending on the bench, tap an atom or a bond to choose it, or tap a pair and then an atom to draw a curved arrow and press the key to see whether the pair moves there. A pair that cannot stay comes back.'
  },
  'thorn:tlead': {
    title: 'Watch first', dials: false,
    text: 'A short clip of a neighbouring case that plays by itself. Watch it, then make your prediction.'
  },
  'thorn:ttest': {
    title: 'Test rig', dials: false,
    text: 'A holder for one sample, a key, and a window that shows a few of the sample\'s particles much enlarged. Lay a sample card in the holder and press the key: the window shows what happens to the particles, and the line under it says what was seen. The card keeps its result.'
  },
  'thorn:tchoice': {
    title: 'Your answer', dials: false,
    text: 'A short list of statements. Tap the one you choose; its frame turns amber, and that is your answer when you press Submit.'
  }
};

const PIECES = {
  'thorn:tcard': ['Sample cards', 'Each card stands for one sample. Drag a card into a holder or a slot, or tap the card and then the place; a card that has been tested prints what the test showed.']
};

addTourText(FIXTURES, PIECES);
aliasTourKit('heat', 'thorn');
