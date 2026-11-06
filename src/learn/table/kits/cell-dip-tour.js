/**
 * kits/cell-dip-tour.js — what the Tour says about the dip rack, the nails and the strips (Brinewire, `q2-activity`). Three beats a step:
 * what it is, what to do with it, what it tells you. Plain words, none a bench has not earned. It says how a tool works, never which
 * move solves the stage.
 */
import { addTourText } from '../tour.js';

addTourText({
  'cell:celldip': {
    title: 'Dip rack', dials: false,
    text: 'The rack is a row of beakers, each holding a solution, a mixed solution or an acid, with its name under it. Dip a strip by laying it on the seat above a beaker. The beaker shows the strip standing in the liquid and what it looks like: a coating, bubbles or clean, with the colour in words underneath. Each beaker keeps a small mark for every strip that has been dipped in it, so a strip can be lifted out and another tried.'
  },
  'cell:celldipnails': {
    title: 'Nails in brine', dials: false,
    text: 'Each beaker holds salty water with an iron nail, and the nail is wired to the metal named under the beaker. Press "Leave a Week" to let them all stand. Blue spots appear on a nail wherever its iron is dissolving into the water.'
  }
}, {
  celldipstrip: ['Strip', 'A thin bar of one metal, named on its face; the strip marked X is sealed. Drag it to the seat above a beaker, or tap it and then tap the seat. Lift it out and lay it over another beaker to try that one. The beaker shows how the strip looks once it is dipped.']
});
