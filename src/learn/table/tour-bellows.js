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
    return ` Drag the card you choose into the "${slot.label}" slot.${guess ? ' It is only your guess: nothing is marked right or wrong, and the next part tests it.' : ''}`;
  }
  if (Object.keys(t.zones?.trays || {}).length) return ' Drag each one into the tray it belongs in.';
  if (t.zones?.rail) return ' Drag each one into its place along the strip.';
  return ' Drag it where you want it.';
};

const hasFixture = (t, kind) => Object.values(t.fixtures || {}).some(f => f.kind === kind);

const dialNames = f => Object.values(f.dials || {}).map(d => d.label).filter(Boolean);

const FIXTURES = {
  rig: {
    title: 'Cylinder',
    text: (f, table) => {
      const ds = dialNames(f);
      const run = f.runLabel ? ` Press "${f.runLabel}" to record a point on the graph.` : '';
      if (!ds.length) {
        if (f.props?.speedScreen) return 'Each bar shows how many particles move near that speed. Compare each snapshot\'s shape with this reference.';
        return 'Read the cylinder\'s measurements, then enter your answer or place a card.';
      }
      const list = ds.map(n => `"${n}"`).join(' and ');
      if (table.zones?.rail) return `Turn ${list} to compare the readings, then drag the pieces along the strip to order them.${run}`;
      return `Slide ${list} to change the gas and watch how the readings respond.${run}`;
    }
  },
  box: {
    title: 'Sealed box',
    text: f => {
      const hasHeater = Boolean(f.dials?.temp);
      const run = f.runLabel ? ` Press "${f.runLabel}" at several temperatures to plot points on the graph.` : '';
      return hasHeater
        ? `Turn the "Heater" dial to change the temperature and watch how hard the gas presses on the roof, side wall, and floor.${run}`
        : `Pressure meters on the roof, side wall, and floor measure how hard the gas presses on each wall.${run}`;
    }
  },
  common: {
    title: 'Common tank',
    text: 'Drag tanks into the drop tray below the common tank to open them into it and watch the total and partial pressures. {runSentence}'
  },
  pinhole: {
    title: 'Pinhole chambers',
    text: f => {
      const hasGas = Boolean(f.dials?.ref);
      const run = f.runLabel ? ` Press "${f.runLabel}" to record.` : '';
      return hasGas
        ? `Turn "Stopwatch" to watch gas leak through the pinhole, and use "Gas" to switch the reference gas.${run}`
        : `Gas leaks through the pinhole; turn "Stopwatch" to advance time and compare how much is left in each chamber.${run}`;
    }
  },
  tube: {
    title: 'Tube',
    text: 'Turn "Stopwatch" to watch the two gases spread from opposite ends until a white ring forms where they meet.'
  },
  scale: {
    title: 'Scale',
    text: 'Drag the sealed tank onto the scale pan to weigh its gas.'
  },
  marker: {
    title: 'Marker',
    dials: false,
    text: 'Drag the knob to the temperature where the line meets zero.'
  }
};

const PIECES = {
  tank: [
    'Gas tanks',
    '',
    table => {
      if (hasFixture(table, 'scale')) return 'Drag the sealed tank onto the scale pan to weigh its gas.';
      if (table.zones?.rail) return 'Drag the tanks along the strip to put them in order.';
      if (hasFixture(table, 'common')) return 'Drag tanks into the drop tray below the common tank to open them.';
      return 'Drag a tank onto the target area.';
    }
  ],
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
  Volume: 'The "Volume" dial sets the volume of the common tank.',
  Height: 'The "Height" dial sets how high above the ground the air is taken from.',
  Gas: 'The "Gas" dial picks which gas the chamber holds.',
  Set: 'The "Set" dial sets the marker position.'
};

/** Hand the gas kit's words to the Tour. Idempotent. */
export function registerGasTour() {
  registerTour('gas', { fixtures: FIXTURES, pieces: PIECES, dials: DIALS });
}
