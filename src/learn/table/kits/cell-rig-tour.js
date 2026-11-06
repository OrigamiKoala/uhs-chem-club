/**
 * kits/cell-rig-tour.js — what the Tour says about the ready-built cell (Brinewire, `q4-potential`). Plain words, none a bench has not
 * earned. It says how a tool works, never which move solves the stage.
 */
import { addTourText } from '../tour.js';

addTourText({
  'cell:cellrig': {
    title: 'Cell', dials: true,
    text: 'The cell has two beakers, each with a bar of one metal in a solution of that metal\'s own ions. A glass tube joins the beakers, and a wire goes over the top through a voltmeter and a lamp. Press "Run" to connect the wire and read it. The voltmeter shows the right bar against the left bar, with a plus or minus sign, and the lamp lights when the reading is above zero. Where a dial for the equation is on the cell, turn it to write the equation once or twice over, then press "Run" again; a line is kept for every setting that has been run, with the voltage and the energy the reaction gives out.'
  }
}, {});
