/**
 * kits/cell-board-tour.js — what the Tour says about the potential board and its electrodes (Brinewire, `q4-potential`). Three beats a
 * step: what it is, what to do with it, what it tells you. Plain words, none a bench has not earned: no cell, anode, cathode, E° or
 * free-energy word. It says how a tool works, never which move solves the stage.
 */
import { addTourText } from '../tour.js';

addTourText({
  'cell:cellboard': {
    title: 'Potential board', dials: false,
    text: 'The board has two cups joined to a voltmeter. The left cup is a fixed reference: hydrogen gas bubbling over a metal strip in acid. The right cup has a seat on top of it. Lay an electrode in the seat and the voltmeter shows its voltage against the reference, with a plus or minus sign. A strip beside it keeps one line for every electrode that has been read.'
  }
}, {
  cellelectrode: ['Electrode', 'A bar of one metal, named on its face. Drag it into the seat on the board, or tap it and then tap the seat. The voltmeter then reads that metal against the reference. Lift it out and the reading stays on the strip.']
});
