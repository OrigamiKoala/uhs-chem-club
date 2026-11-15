/**
 * kits/nuke-tour.js — what the Tour says about Cinder Halo's instruments (unit14). Three beats per step: what it is, what to do with it,
 * what it tells you. Words only the benches have already earned; never which move solves a stage. Later families add their own words
 * with `addTourText` from their own file.
 */

import { addTourText, aliasTourKit } from '../tour.js';
import './heat-tour.js';

const FIXTURES = {
  'nuke:ncount': {
    title: 'Counter', dials: false,
    text: 'A sample sits on the left and a tube on the right; every track that reaches the tube is one count. Drag a card into the Sample slot and press the key to count for one minute; the card keeps its count. Where the rig has a shield slot, plates or keys, a card in the shield slot stands in the tracks\' way, the plates pull on charged tracks (drawn bending more than plates this size really would), and the keys set the temperature or close lead round the tube.'
  },
  'nuke:nnuc': {
    title: 'Nucleus view', dials: false,
    text: 'A nucleus drawn as its protons (rust) and neutrons (grey), every one counted underneath. Press "Watch the Nucleus" to see what leaves it or changes in it, drawn and counted. Not to scale.'
  },
  'nuke:nchart': {
    title: 'Chart of nuclides', dials: false,
    text: 'Every square is one kind of nucleus: protons count across, neutrons count up, and the square shows its element and mass number. Tap a square to read it or to choose it as your answer; filled squares, where shown, are stable nuclei, and bismuth-209, which decays too slowly to measure, is drawn stable.'
  },
  'nuke:nchoice': {
    title: 'Your answer', dials: false,
    text: 'Tap the statement you choose; it lights. The statement lit when you press Submit is your answer.'
  },
  'nuke:nlead': {
    title: 'Watch first', dials: false,
    text: 'A short case that loops. Watch it, then make your prediction.'
  },
  'nuke:ndrum': {
    title: 'Sealed drums', dials: false,
    text: 'Two sealed drums on the deck, each with its temperature and the oxygen left inside. Tap a drum to look inside its wall, enlarged: its atoms, and any tracks that stop there.'
  },
  'nuke:ndecay': {
    title: 'Decaying sample', dials: false,
    text: 'A grid of radioactive nuclei: a bright one has not decayed, a dark one has. Tap "Wait" to move the clock on and "Back" to move it back; the plot beside the grid marks what is left at every step so far.'
  },
  'nuke:nscale': {
    title: 'Balance', dials: false,
    text: 'Two pans on a beam that tips toward the heavier; each pan prints its mass in u (one u is about the mass of one proton). Where it has keys, tap "Add Proton" or "Add Neutron" to load the left pan.'
  },
  'nuke:ncurve': {
    title: 'Binding-energy curve', dials: false,
    text: 'Each point is one nucleus: its mass number across, and how tightly each of its protons and neutrons is held up the side. Tap a point to read it, or to choose it as your answer.'
  },
  'nuke:nchain': {
    title: 'Chain chamber', dials: false,
    text: 'A block of uranium-235. Press "Fire Neutron" to send one neutron in and watch what follows. Where it has rod keys, they set how many of the three neutrons each split frees the control rods soak up.'
  },
  'nuke:ntissue': {
    title: 'Tissue strip', dials: false,
    text: 'A strip of living cells with a source inside its left end. Tap Alpha, Beta or Gamma to see that radiation\'s trail; each amber mark is a molecule it broke.'
  }
};

const PIECES = {
  'nuke:nsrc': ['Sample cards', 'Each card is one sample. Drag it into the Sample slot to count it; it shows the last count it gave. Drag the card you choose into the answer slot.'],
  'nuke:nshield': ['Shield cards', 'Each card is a sheet of one material, drawn as thick as it is. Drag it into the Shield slot to stand it between the sample and the tube.']
};

addTourText(FIXTURES, PIECES);
aliasTourKit('heat', 'nuke');
