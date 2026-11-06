/**
 * kits/cell-redox-tour.js — what the Tour says about the redox beaker and the number probe (Brinewire, `q1-halves`). Three beats a step:
 * what it is, what to do with it, what it tells you. Plain words, none the bench has not earned: no oxidation, reduction or agent word. It
 * says how a tool works, never which move solves the stage.
 */
import { addTourText } from '../tour.js';

addTourText({
  'cell:cellredox': {
    title: 'Beaker', dials: false,
    text: 'The beaker is drawn twice: the window marked "Before" is the moment a metal strip goes into its solution, and the window marked "After" is later. Solid discs are atoms and rings are ions. Compare the two windows to see what moved. Nothing on it can be moved by hand.'
  },
  'cell:cellprobe': {
    title: 'Number probe', dials: false,
    text: 'The probe has a seat. Lay a card on the seat and the probe prints a number for that atom in the "Before" window and a number in the "After" window; a sealed reaction prints one line for every element in it. The number is a bookkeeping count: plus when the atom is counted as having lost electrons, minus when it is counted as having gained them, and 0 for a bare atom. Where the stage keeps a strip, it lists every card that has been read.'
  }
}, {});
