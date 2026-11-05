/**
 * kits/pans-ratio-tour.js — what the Tour says about the ratio benches' instruments and pieces (Teeter `q2-k`, `q3-q`). Three beats a
 * step: what it is, what to do with it, what it tells you. Earned words only: K and Q are named only where a bench has earned them.
 */

import { addTourText } from '../tour.js';

const hasSquared = t => Object.values(t.pieces || {}).some(p => p.kind === 'rtile' && p.props?.p > 1);

addTourText({
  'pans:vsl': {
    title: 'Pans', dials: false,
    text: f => `Each pan is a vessel with a bar for every substance in it, all drawn to one scale, with the amount printed over the bar. ${f.noRun ? 'The pans open already at equilibrium.' : `Press "${f.runLabel}" to let every pan reach equilibrium.`} A line across a bar then marks where that amount began, so you can see which way it moved.`
  },
  'pans:rig': {
    title: 'Ratio rig', dials: false,
    text: (f, t) => `The rig has places above a line and places below it. Lay tiles in the places. For each pan, the rig multiplies the amounts of the tiles above the line, divides by the amounts of the tiles below, and prints the answer under that pan once the pans have settled.${hasSquared(t) ? ' A tile with a small 2 on it counts its amount multiplied by itself.' : ''} It reads whatever is laid on it; it does not say which arrangement is the one to look for.`
  },
  'pans:qk': {
    title: 'Test vessel and gauge', dials: false,
    text: f => `Lay a mixture card in the slot and the vessel shows a bar for each substance in it. The scale on the right sets the reaction's ratio for this mixture, the marker, against the line for K. Each tick is a tenfold step. Press "${f.runLabel}" to leave the mixture alone until it settles; a line across each bar then marks where that amount began${f.props?.q ? '. The marker is Q, the ratio of a mixture that may not have settled' : ''}.`
  }
}, {
  rtile: ['Tiles', 'Each tile is one substance of the reaction. Drag a tile into a place on the rig, above or below the line, or tap the tile and then the place. The rig changes its answers at once, and a tile taken out leaves the place empty.'],
  mixc: ['Mixture cards', 'Each card is a mixture, with the amount of each substance in it. Drag a card into the slot of the test vessel, or tap the card and then the slot. A sealed card prints no amounts; the vessel shows them once the card is in.']
});
