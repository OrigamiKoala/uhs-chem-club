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
    title: 'Cylinder & piston',
    text: 'Drag the dials to move the piston, heat the gas, or add gas. {runSentence}'
  },
  box: {
    title: 'Sealed box',
    text: 'Sensors on the walls read how hard the gas pushes. {runSentence}'
  },
  common: {
    title: 'Common tank',
    text: 'Drag tanks into or out of the slots below to mix them. {runSentence}'
  },
  pinhole: {
    title: 'Pinhole chambers',
    text: 'Gas leaks through the pinhole; turn "Stopwatch" to advance time. {runSentence}'
  },
  tube: {
    title: 'Tube',
    text: 'Turn "Stopwatch" to watch the two gases creep along the tube. {runSentence}'
  },
  scale: {
    title: 'Scale',
    text: 'Drag a tank onto the pan to weigh the gas inside.'
  },
  marker: {
    title: 'Marker',
    dials: false,
    text: 'Drag the knob to your number.'
  }
};

const PIECES = {
  tank: ['Gas tanks', 'Drag a tank onto a pan, slot, or tray.'],
  stmt: null,
  num: null,
  hist: null,
  curve: null,
  chip: null,
  pellet: ['Pellet', 'Drag the pellet dish into the acid dish to react them.'],
  trap: ['Trap', 'Drag the trap onto a tank to remove one gas.']
};

const DIALS = {
  Piston: 'The "Piston" dial slides the piston in or out: a smaller volume compresses the particles together, and a larger volume lets them spread out.',
  Heater: 'The "Heater" dial warms or cools the gas: warmer particles move faster.',
  'Gas in': 'The "Gas in" dial adds gas to the cylinder or takes it out.',
  Stopwatch: 'The "Stopwatch" dial sets how many seconds have gone by.',
  Room: 'The "Room" dial sets the volume of the common tank.',
  Volume: 'The "Volume" dial sets the volume of the common tank.',
  Height: 'The "Height" dial sets how high above the ground the air is taken from.',
  Gas: 'The "Gas" dial picks which gas the chamber holds.',
  Set: 'The "Set" dial is the knob of the marker.'
};

/** Hand the gas kit's words to the Tour. Idempotent. */
export function registerGasTour() {
  registerTour('gas', { fixtures: FIXTURES, pieces: PIECES, dials: DIALS });
}
