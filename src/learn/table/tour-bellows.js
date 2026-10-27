/**
 * tour-bellows.js — what the Tour says about the gas kit's tools (`table/kits/gas.js`).
 *
 * Every instrument and kind of piece on a Bellows table has a step here, in the Tour's three beats: WHAT IT IS (what you can see on the
 * table), WHAT TO DO WITH IT (the exact drag, tap or key) and WHAT IT TELLS YOU (what happens, and what it is for). Plain everyday
 * words, and no word a bench has not earned: "push" until the first card names pressure, "room" for volume, and a unit is never named
 * before a card has. It says how a tool works, never which move solves a stage. Registered into `tour.js` by the kit.
 *
 * `verify:table` fails an instrument with no step, and a step that uses a word the stage has not earned.
 */

import { registerTour } from './tour.js';

/** Statement cards, number cards and the like are dropped in a slot, a tray or on a strip: say the one that is on this table. */
const placeSentence = t => {
  const slot = Object.values(t.zones?.slots || {}).find(z => z.label);
  const guess = slot && /prediction/i.test(slot.label);
  if (slot) {
    return ` Drag the card you choose into the "${slot.label}" slot.${guess ? ' It is only your guess: nothing is marked right or wrong, and the next part tests it.' : ' The card in that slot is your answer when you press Submit.'}`;
  }
  if (Object.keys(t.zones?.trays || {}).length) return ' Drag each one into the tray it belongs in.';
  if (t.zones?.rail) return ' Drag each one into its place along the strip.';
  return ' Drag it where you want it.';
};

const hasFixture = (t, kind) => Object.values(t.fixtures || {}).some(f => f.kind === kind);

const FIXTURES = {
  rig: {
    title: 'Cylinder and piston',
    text: 'A glass cylinder holds a gas, shown as moving particles between its end wall and the piston. The readings printed under it say what the gas is doing right now. {runSentence}'
  },
  box: {
    title: 'Sealed box',
    text: 'A sealed glass box holds a gas, shown as moving particles. A gauge is fitted to its roof, to its side wall and to its floor, and each gauge shows how hard the gas pushes on its own wall. {runSentence}'
  },
  common: {
    title: 'Common tank',
    text: 'A big empty tank with a list under it. Drag a tank into the place below it to open that tank\'s valve into it, and drag the tank out again to shut it. The gauge shows how hard everything inside pushes, and the list shows how hard each gas pushes by itself, each marked by its own shape. {runSentence}'
  },
  pinhole: {
    title: 'Chambers with a pinhole',
    text: 'Each sealed chamber has one tiny hole in its wall, and gas leaks out through it. The "Stopwatch" dial sets how many seconds the hole has been open, and each chamber shows how much of its gas is left. {runSentence}'
  },
  tube: {
    title: 'Tube',
    text: 'A tube of still air with a different gas let in at each end. The "Stopwatch" dial sets how long they have been creeping along, and a white ring shows where the two meet once they touch. {runSentence}'
  },
  scale: {
    title: 'Scale',
    text: 'Drag a tank onto the pan to weigh it. The reading is the mass of the gas inside, in grams.'
  },
  marker: {
    title: 'Marker',
    dials: false,
    text: 'A marker you set to a number. Drag its knob to the figure you want; the number it shows when you press Submit is your answer.'
  }
};

const PIECES = {
  tank: ['Gas tanks', 'Each tank is a steel bottle of gas with its own gauge and its name on the lid.', t => {
    const bits = [];
    if (hasFixture(t, 'scale')) bits.push('Drag a tank onto the scale pan to weigh it.');
    if (hasFixture(t, 'common')) bits.push('Drag a tank into the place under the common tank to open it.');
    if (Object.keys(t.zones?.trays || {}).length) bits.push('Drag a tank into a tray to put it in that group.');
    if (t.zones?.rail) bits.push('Drag a tank into its place along the strip.');
    return bits.length ? ` ${bits.join(' ')}` : '';
  }],
  stmt: ['Cards', 'Each card has one claim printed on it.', placeSentence],
  num: ['Number cards', 'Each card has one number printed on it.', placeSentence],
  hist: ['Speed snapshots', 'Each card is a snapshot of a gas: its bars show how many of its particles are moving at each speed, from slow on the left to fast on the right.', placeSentence],
  curve: ['Record cards', 'Each card is a line plotted from an earlier set of readings.', placeSentence],
  chip: ['Chips', 'Each chip is a name tag.', placeSentence],
  pellet: ['Pellet', 'A pellet of chalk in a dish. Drag the dish into the acid dish to drop the pellet in; the gas it gives off pushes the piston up.'],
  trap: ['Trap', 'A trap takes one kind of gas out of a tank. Drag it onto a tank of mixed gas and watch the tank\'s gauge.']
};

const DIALS = {
  Piston: 'The "Piston" dial slides the piston in or out: a smaller room squeezes the particles together, and a bigger room lets them spread out.',
  Heater: 'The "Heater" dial warms or cools the gas: warmer particles move faster.',
  'Gas in': 'The "Gas in" dial adds gas to the cylinder or takes it out.',
  Stopwatch: 'The "Stopwatch" dial sets how many seconds have gone by.',
  Room: 'The "Room" dial sets how much room the common tank has.',
  Height: 'The "Height" dial sets how high above the ground the air is taken from.',
  Gas: 'The "Gas" dial picks which gas the chamber holds.',
  Set: 'The "Set" dial is the knob of the marker.'
};

/** Hand the gas kit's words to the Tour. Idempotent. */
export function registerGasTour() {
  registerTour('gas', { fixtures: FIXTURES, pieces: PIECES, dials: DIALS });
}
