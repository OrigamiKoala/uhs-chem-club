/**
 * kits/cell-supply-tour.js — what the Tour says about the supply bench and its pieces (Brinewire, `q6-electrolysis`). Three beats a step:
 * what it is, what to do with it, what it tells you. Plain words, none the bench has not earned. It says how a tool works, never which
 * move solves the stage.
 */
import { addTourText } from '../tour.js';

addTourText({
  'cell:cellsupply': {
    title: 'Supply bench', dials: true,
    text: 'A power supply is wired to a cell, a pair of electrodes in a liquid. Set the dials where there are dials, then press "Run" to switch the supply on for the time printed on the bench. A readout shows what the run did: the current, the mass a strip or plate gained or lost on the balance, the charge that passed, or the gas that gathered in a collector tube. Where several runs can be made, each one stays listed so that you can compare them. Where cells are seated in a chain, the chain\'s voltage is read off live. Where a seat is drawn under a tube or on a balance, lay the card or plate there.'
  }
}, {
  cellsupplypack: ['Cell on a bar', 'A zinc and copper cell with its voltage printed on it. Drag it into a seat in the chain, or tap it and then tap the seat. Cells in the chain are joined one after another, so the chain\'s voltage is read off at the top.'],
  cellsupplyplate: ['Plate', 'A plate that was plated earlier, with its name on its face. Drag it onto the balance seat, or tap it and then tap the seat. The balance prints how much mass the plate gained while it was plated, and prints nothing while the pan is empty.']
});
