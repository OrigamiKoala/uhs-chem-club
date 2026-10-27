/**
 * kits/heat-tour.js — what the Tour says about the heat kit's instruments and pieces (Ember Reach).
 *
 * The Tour (`table/tour.js`) gives one step per instrument and per kind of piece on a stage's table, each in three beats: what it is
 * (what you can see), what to do with it (the exact drag, tap or key) and what it tells you (what you will see happen). Plain words, short
 * sentences, and no word a bench has not earned: the same text serves every bench that stands the instrument up, so it uses none of
 * the terms Ember Reach teaches on the cards (heat, exothermic, system, enthalpy, entropy, free energy, Hess). It says how a tool works, never
 * which move solves the stage.
 *
 * Fixtures are keyed `heat:<kind>` (a kit's own entry wins over a shared one) and pieces by `kind`.
 */

import { addTourText } from '../tour.js';

const FIXTURES = {
  'heat:cup': {
    title: 'Cup and thermometer', dials: false,
    text: 'A lagged cup holds a bath of water with a thermometer in it. Drag a tin or a hot block onto the cup\'s mouth, the square above the bath, and the thermometer shows what the water does: its temperature and how far it has moved. A dial on the cup, named on the dial, changes one thing about it, such as how much energy an electric heater feeds the water. Where a cup prints a line of joules, that is the energy the water gained, and where a dashed line is drawn round the mouth it marks off the chemicals being studied from everything outside the line.'
  },
  'heat:shelves': {
    title: 'Energy chart', dials: false,
    text: 'Two shelves stand side by side. The left shelf is the stored energy of the chemicals before a change, and the right shelf is their stored energy after it, so a right shelf that is higher means they ended with more. Turn the dial under the chart to move the right-hand shelf, and the chart redraws to match.'
  },
  'heat:well': {
    title: 'Bond crank', dials: false,
    text: 'Two atoms are joined by a rod, which is the bond between them. Turn the dial one setting at a time to pull the atoms apart, or to let free atoms fall back together, and watch the rod thin as they separate. The meter under the atoms prints the energy that has gone in or come out so far.'
  },
  'heat:ledger': {
    title: 'Bond ledger', dials: false,
    text: 'The ledger adds up the bond chips that lie in its two trays. The Broken column totals the energy of the bonds taken apart, and the Formed column totals the energy of the bonds built. Drag a chip from one tray to the other and the totals change at once.'
  },
  'heat:stack': {
    title: 'Stack of steps', dials: false,
    text: 'The stack adds up the equation cards that lie in its tray. Under the reaction you want, in dust-grey, it prints the reaction the cards add up to, with the substances that appear on both sides cancelled out. Where it shows an energy change, that is the total for the cards in the tray.'
  },
  'heat:cells': {
    title: 'Cells and gate', dials: false,
    text: 'A row of cells with a gate across it. Drag a particle into a cell, then press "Log" to write that arrangement down; the count in the corner is how many different arrangements you have logged. Turn the "Gate" dial to open the wall and let the particles use the cells behind it.'
  },
  'heat:chamber': {
    title: 'Shaking chamber', dials: false,
    text: 'A chamber of cells holds a few particles, and the bars under it count how many of them stood in the left half after each shake. Press "Shake" to jostle them into a new set of cells; shake again as often as you like. Each shake adds to the bars, so the bars show what turns up most.'
  },
  'heat:plot': {
    title: 'Balance plot', dials: false,
    text: 'The line shows the net balance of a change as the temperature rises, and the shaded strip marks where the balance is below zero. Turn the "Temperature" dial to slide the amber marker along the line. The readout under the plot shows the two pulls and the net at the temperature the marker stands at.'
  },
  'heat:warm': {
    title: 'Warmed sample', dials: false,
    text: 'A sample sits in a box with a heater dial beside it. Turn the "Heater" dial to warm the sample, and its particles move faster, which the streaks behind them show. Press "Record" to write down what warming did.'
  },
  'heat:marker': {
    title: 'Number marker', dials: false,
    text: 'The marker holds a number. Drag its knob along the groove, or tap the groove, to set the number you worked out. Whatever it reads when you press Submit is your answer.'
  },
  'heat:selector': {
    title: 'Answer dial', dials: false,
    text: 'The dial has named positions. Drag its knob along the groove, or tap the groove, to point it at the answer you worked out. The position it shows when you press Submit is your answer.'
  }
};

const PIECES = {
  block: ['Metal blocks', 'Each block is a lump of metal with its weight and a thermometer reading printed on it. Drag one block onto another to join them, and both readings change. Tap the gap between two joined blocks to pull them apart again, and each goes back to its own reading.'],
  charge: ['Tins of chemicals', 'Each tin holds chemicals that change when they react. Drag a tin onto the mouth of a cup and let it react in the water. A tin that has been in a cup keeps a line that says how far the bath moved, so you can compare tins after they are out again.'],
  eqn: ['Equation cards', 'Each card is a reaction someone has already measured, with its energy change printed under it. Drag cards into the stack. Pick a card up and press "Flip" to run it the other way, which swaps its two sides and its sign, or "Larger" to double everything on it.'],
  bond: ['Bond chips', 'Each chip is one kind of bond, drawn as two atoms joined by a rod, with how many there are and the energy of each. Drag a chip into a tray. The ledger adds up whatever lies in each tray.'],
  shelf: ['Energy charts', 'Each small chart has a left shelf for the energy before a change and a right shelf for the energy after it. Drag a chart to where it belongs.'],
  phase: ['Particle boxes', 'Each box holds the same twelve particles, and a short streak on a particle shows how fast it is moving. Drag a box to where it belongs, or onto the strip in the order you choose.'],
  stmt: ['Statement cards', 'Each card holds a short statement. Drag a card to where it belongs. Where a stage asks you to mark cards, tap one to ring it and tap it again to take the ring off.'],
  tag: ['Name cards', 'Each card names one thing. Drag a card to where it belongs, or tap it once and then tap the place you want it to go.'],
  note: ['Cards', 'Each card holds a few words. Drag the card you choose to where it belongs, or tap it once and then tap the place; the card in a slot is your answer when you press Submit.'],
  gcard: ['Line cards', 'Each card draws a line: the net balance of one kind of change as the temperature rises, with the stretch below zero shaded. Drag a card into a tray.'],
  num: ['Number cards', 'Each card holds a number. Drag the one you worked out into the slot; it is your answer when you press Submit.'],
  chip: ['Chips', 'Each chip holds a word or two. Drag a chip to where it belongs.'],
  ptc: ['Particles', 'Each particle is a small bead. Drag one into a cell, and press "Log" once your arrangement is laid out.']
};

addTourText(
  FIXTURES,
  PIECES
);
