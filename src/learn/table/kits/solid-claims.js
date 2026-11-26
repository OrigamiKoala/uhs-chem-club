/**
 * kits/solid-claims.js — which bench pictures are atoms and molecules, stood up as balls and sticks at `3D On` (`table/solids.js`).
 *
 * Every world from Ligar (unit03) to Cinder Halo (unit14). Tallow and Lanternfall are left as they are (`solids.js` `SKIP_WORLDS`).
 * Left flat on purpose: notation (Ligar's Lewis slate, skeletal formulas, formula and symbol cards), graph markers, lamps, gauges and
 * glass. `build: false` strips the flat atoms where the kit's own dress already stands them up (Teeter's crowds, the heat kit's well).
 * Sizes are table units; `bonds: 'none'` for crowds, so a track or a wire crossing two particles is never read as a bond.
 */

import { claimSolids } from '../solids.js';

const CROWD = { bonds: 'none' };
const MOVING = { bonds: 'none', live: true };

// Ligar: the atoms and ions as pieces, the two atoms in a bond's energy well, the hybrid model's molecule.
claimSolids('atoms', { pieces: { atom: {}, ion: {} } });
claimSolids('bonds', { fixtures: { wells: { minR: 1.5 } }, pieces: { atom: {}, ion: {} } });
claimSolids('domain', { fixtures: { twist: {} } });

// Ember Reach and Mirrowen: the energy well's two atoms already stand up in the kit's dress; the particle cards and samples.
claimSolids('heat', { fixtures: { well: { minR: 2, build: false } }, pieces: { shift: CROWD } });
claimSolids('matter', {
  fixtures: { well: { minR: 2, build: false } },
  pieces: { mol: {}, liquid: {}, pack: CROWD, pbox: {}, sample: CROWD, smp: CROWD }
});

// Kettle: equation windows (space-filling molecules), ion pots, reaction and titration windows, ion pieces and chips.
claimSolids('pot', {
  fixtures: {
    eqwindow: { minR: 0.2, bonds: 'touch', live: true },
    kwindow: { bonds: 'touch', live: true },
    hsabbond: { bonds: 'none' },
    ionpot: { bonds: 'none', live: true },
    changepot: MOVING,
    reactor: MOVING,
    titrator: MOVING
  },
  pieces: { ion: {}, ionchip: {} }
});
claimSolids('heap', { pieces: { atom: {} } });

// Teeter: every crowd already stands up as spheres (`pans-3d.js`); the flat dots under them go.
const PANS = { minR: 0.1, bonds: 'none', build: false };
claimSolids('pans', { fixtures: Object.fromEntries(['pan', 'clip', 'beaker', 'vessel', 'vsl', 'kbars', 'kcheck', 'qk'].map(k => [k, PANS])) });

// Brinewire: ions and atoms in the half-cells, the dip dishes, the galvanic cell and the load run.
claimSolids('cell', { fixtures: Object.fromEntries(['celldip', 'cellgalv', 'cellloadrun', 'cellredox', 'cellscene', 'cellboard'].map(k => [k, MOVING])) });

// Lodestone: the complex in its beaker, the complex builder, the ligands closing in on the field, the lead clips.
claimSolids('lode', {
  fixtures: { beaker: { live: true }, cplx: { live: true }, cfield: MOVING, lodelead: { live: true } }
});

// Thornmere: the builder's molecule, the molecule windows, the mirror pair, the lead clips.
// minR: 0.9 keeps electron-pair dots flat on the plate while atoms stand up as 3D spheres.
claimSolids('thorn', { fixtures: { tbuild: {}, tmol: { live: true, minR: 0.9 }, tmirror: { live: true }, tlead: { live: true, minR: 0.45 } } });

// Cinder Halo: the decaying sample's atoms, the chain's nuclei and neutrons, a nucleus's nucleons, the balance's loads, the broken molecules.
claimSolids('nuke', { fixtures: Object.fromEntries(['ndecay', 'nchain', 'nnuc', 'nscale', 'ntissue'].map(k => [k, { ...MOVING, minR: 0.3 }])) });
