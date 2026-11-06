/**
 * kits/cell-load-tour.js — what the Tour says about the cell under load and its read benches (Brinewire, `q5-load`). Three beats a
 * step: what it is, what to do with it, what it tells you. Plain words, none the bench has not earned. It says how a tool works, never
 * which move solves the stage.
 */
import { addTourText } from '../tour.js';

addTourText({
  'cell:cellloadrun': {
    title: 'Cell under load', dials: false,
    text: 'The cell has a tin beaker on the left and a lead beaker on the right, joined by a glass tube, with a wire over the top through a voltmeter and a load that the cell has to drive. Press "Run" and the cell drives the load for a few more ticks. The voltmeter reads the cell now, the plot draws its voltage up to the tick reached, and each window shows the ions in its beaker as dots, one dot for each 0.02 M.'
  },
  'cell:cellloadread': {
    title: 'Two beakers', dials: true,
    text: 'Two beakers each hold a bar of one metal in a solution of its own ions, joined by a glass tube and a wire through a voltmeter. The strength of each solution is printed under its beaker. Where a beaker has a dial, turn it to one of its two strengths. Press "Run" to connect the wire and read the voltmeter, right bar against left bar; a line is kept for every strength that has been read.'
  },
  'cell:cellloadcc': {
    title: 'Two beakers and two meters', dials: false,
    text: 'Two beakers each hold a bar of the same metal in a solution of its ions, joined by a glass tube and by a wire through a voltmeter and an ammeter. Press "Run" to connect the wire. The voltmeter reads the right bar against the left bar, and the ammeter needle swings toward the bar the electrons are moving to. A "?" under a beaker means its strength is sealed.'
  }
}, {});
