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
    text: f => {
      const p = f.props || {};
      if (p.lock && p.lockBonds && !p.auto) return 'Tap a carbon to add hydrogens until its open bonds are full.';
      if (p.lock && !p.lockBonds) return 'Tap the dashed gap between the two end carbons to connect them.';
      if (p.record) return 'Tap a dashed ring to place a carbon, tap a carbon to remove it, and press "Record" to save each molecule.';
      if (!p.auto && p.lockBonds) return 'Tap a dashed ring to add a carbon, then tap a carbon to add hydrogens.';
      if (p.maxOrder > 1) return 'Tap a dashed ring to place a carbon, tap between two carbons to change their bond, or tap a carbon to remove it.';
      return 'Tap a dashed ring to place a carbon, or tap a carbon to remove it.';
    }
  },
  'thorn:tmol': {
    title: f => {
      const p = f.props || {};
      if (p.mode === 'show' && !p.meter) return f.label || 'Reference drawing';
      if (p.mode === 'steps') return f.label || 'Chain maker';
      if (p.mode === 'pick') return f.label || 'Molecule view';
      return 'Electron view';
    },
    dials: false,
    text: f => {
      const p = f.props || {};
      if (p.mode === 'show' && !p.meter) return p.skeletal ? 'Reference skeletal drawing: every corner and end represents one carbon.' : 'Inspect this reference molecule.';
      if (p.mode === 'steps' && p.meter) return 'Tap any carbon–carbon bond to measure its length, or press "{run}" to shift the extra electron pairs.';
      if (p.mode === 'steps') return 'Press "{run}" to step through the reaction.';
      if (p.mode === 'pick' && p.pick?.kind === 'bond') return 'Tap a bond in the molecule to select it.';
      if (p.mode === 'pick') return 'Tap an atom in the molecule to select it.';
      if (p.mode === 'arrow' && p.arrow?.srcFixed) return 'Tap the atom the highlighted electron pair moves to, then press "{run}".';
      if (p.mode === 'arrow' && p.arrow?.dstFixed) return 'Tap an electron pair, then press "{run}".';
      return 'Tap an electron pair, tap the atom it moves to, then press "{run}".';
    }
  },
  'thorn:tlead': {
    title: 'Reference clip', dials: false,
    text: 'Check the example, then drag a prediction card into the slot.'
  },
  'thorn:ttest': {
    title: f => f.label || 'Test rig', dials: false,
    text: 'Drag a sample card into the Sample slot and press "{run}".'
  },
  'thorn:tchoice': null
};

const PIECES = {};

addTourText(FIXTURES, PIECES);
aliasTourKit('heat', 'thorn');
