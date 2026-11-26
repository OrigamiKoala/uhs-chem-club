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
    title: 'Calorimeter cup', dials: false,
    text: 'There are several kinds of calorimeters — this one is a coffee-cup calorimeter, an insulated cup holding a water bath and a thermometer. Drag a sample or hot block onto the cup mouth to see how the water temperature changes.'
  },
  'heat:shelves': {
    title: 'Energy diagram', dials: false,
    text: 'Two energy levels sit side by side: the left shows stored energy before a change, and the right shows stored energy after. Turn the dial below the diagram to raise or lower the right level.'
  },
  'heat:well': {
    title: 'Bond puller', dials: false,
    text: 'Two atoms are joined by a bond. Slide the dial to pull the atoms apart or let them come back together, and watch the meter below show the energy absorbed or released.'
  },
  'heat:ledger': {
    title: 'Bond table', dials: false,
    text: 'The bond table totals the cards in its two trays: Broken on the left and Formed on the right. Move a card between trays to update both totals right away.'
  },
  'heat:stack': {
    title: 'Reaction stack', dials: false,
    text: 'The stack adds up the reaction cards in its tray and cancels any substance that appears on both sides. Below the target reaction, it shows what your cards currently add up to.'
  },
  'heat:cells': {
    title: 'Cells and gate', dials: false,
    text: 'Drag a particle into a cell and press "Log" to record the arrangement. Turn the "Gate" dial to open the wall and unlock the remaining cells.'
  },
  'heat:chamber': {
    title: 'Shaking chamber', dials: false,
    text: 'Press "Shake" to randomly place each particle into either the left box or the right box. Every time you shake, the bar chart adds 1 to the matching column, building up the overall distribution of how many particles land in the left box across all shakes.'
  },
  'heat:plot': {
    title: 'Temperature plot', dials: false,
    text: 'The line shows how the net balance changes with temperature, with values below zero meaning the process runs on its own. Slide the Temperature dial to compare heat (ΔH) and the entropy drive (TΔS) at each temperature.'
  },
  'heat:warm': {
    title: 'Warmed sample', dials: false,
    text: 'Turn the "Heater" dial to warm the sample and watch its particles move faster. Press "Record" to log what you observed.'
  },
  'heat:marker': {
    title: 'Number dial', dials: false,
    text: 'Drag the knob along the track, or tap the track, to set your answer before pressing Submit.'
  },
  'heat:selector': {
    title: 'Answer list', dials: false,
    text: 'Tap your answer directly or drag the dial knob.'
  }
};

const PIECES = {
  block: ['Metal blocks', 'Each block shows its mass and temperature. Drag one block onto another to join them, or tap the gap between joined blocks to separate them.'],
  charge: ['Samples', 'Drag a sample onto the cup mouth to test it in the water bath. Once tested, the sample remembers how much the bath warmed or cooled.'],
  eqn: ['Reaction cards', 'Each card shows a measured reaction and its energy change. Drag cards into the stack, or tap a card to Flip it (reversing its arrow and sign), Duplicate it to add another copy, or Remove an extra copy.'],
  bond: ['Bond cards', 'Each card shows one type of bond and its energy. Drag cards into the Broken or Formed trays. Tap a card and press Duplicate to add another copy of that bond, or Remove to delete an extra copy.'],
  shelf: ['Energy diagrams', 'Each small diagram shows energy before on the left and energy after on the right. Drag it into the matching tray.'],
  phase: ['Particle boxes', 'Each box holds moving particles showing their state and speed. Drag the boxes onto the rail in order.'],
  stmt: ['Statement cards', 'Drag a card to the matching slot or tray, or tap to mark it when asked.'],
  shift: ['Change cards', 'Each card shows the particles before a change on the left and after on the right. Drag it into the matching tray.'],
  tag: ['Name cards', 'Drag a card to the answer slot, or tap it once and then tap the slot.'],
  note: ['Prediction cards', 'Drag your chosen card into the slot, or tap it and then tap the slot.'],
  gcard: ['Line cards', 'Each card plots ΔG against temperature, with the region below zero shaded. Drag each card into the matching tray.'],
  num: ['Number cards', 'Drag your calculated number into the answer slot.'],
  chip: ['Cards', 'Drag a card into the matching slot or tray.'],
  ptc: ['Particles', 'Drag a particle into a cell, then press "Log" once your arrangement is ready.']
};

addTourText(
  FIXTURES,
  PIECES
);
