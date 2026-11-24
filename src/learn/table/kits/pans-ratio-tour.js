/**
 * kits/pans-ratio-tour.js — what the Tour says about the ratio benches' instruments and pieces (Teeter `q2-k`, `q3-q`). Three beats a
 * step: what it is, what to do with it, what it tells you. Earned words only: K and Q are named only where a bench has earned them.
 */

import { addTourText } from '../tour.js';

const hasSquared = t => Object.values(t.pieces || {}).some(p => p.kind === 'rtile' && p.props?.p > 1);

addTourText({
  'pans:vsl': {
    title: 'Vessels', dials: false,
    text: f => `Each vessel shows a bar for every substance in it, drawn to one scale with the amount printed on top. ${f.noRun ? 'The vessels open already at equilibrium.' : `Press "${f.runLabel}" to let every vessel reach equilibrium.`} A line across each bar marks where it started.`
  },
  'pans:rig': {
    title: 'Ratio board', dials: false,
    text: (f, t) => `The ratio board has slots above and below a fraction line. Place particle cards in the slots. For each settled vessel, the board multiplies the top cards, divides by the bottom cards, and prints the result under that vessel.${hasSquared(t) ? ' A card with a small 2 squares that amount.' : ''}`
  },
  'pans:qk': {
    title: 'Test vessel and gauge', dials: false,
    text: f => `Lay a mixture card in the slot and the vessel shows a bar for each substance in it. The scale on the right sets the reaction's ratio for this mixture, the marker, against the line for K. Each tick is a tenfold step. Press "${f.runLabel}" to leave the mixture alone until it settles; a line across each bar then marks where that amount began${f.props?.q ? '. The marker is Q, the ratio of a mixture that may not have settled' : ''}.`
  }
}, {
  rtile: ['Tiles', 'Each card is one substance of the reaction. Drag a card into a place on the ratio board, above or below the line, or tap the card and then the place. The ratio board changes its answers at once, and a card taken out leaves the place empty.'],
  mixc: ['Mixture cards', 'Each card is a mixture, with the amount of each substance in it. Drag a card into the slot of the test vessel, or tap the card and then the slot. A sealed card prints no amounts; the vessel shows them once the card is in.']
});
