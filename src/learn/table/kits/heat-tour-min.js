/**
 * kits/heat-tour-min.js — Ember Reach's Tour: a moving demonstration for every tool and as few words as will do.
 *
 * Each step is a few words under a short film of the tool being used (`table/tour-demo.js`): a real stage's table, played with its own
 * scripted solution (or, for a dial-and-drag tool, a hand moving its dial), so the film is drawn by the bench's own painters and the
 * particles in it move. The words say only what the film cannot: which key, which piece. They explain how a tool works, never which move
 * solves a stage. This file loads after `heat-tour.js` and replaces its longer words.
 */

import { addTourText } from '../tour.js';
import { addTourDemo, stageDemo } from '../tour-demo.js';

const T = (title, text) => ({ title, text, dials: false });

addTourText({
  'heat:cup': T('Cup and thermometer', 'Dots are water molecules; rings are the sample. Hotter particles are drawn moving more.'),
  'heat:lattice': T('Particles in the blocks', 'Each box holds the particles of the block above it. Hotter particles shake harder.'),
  'heat:rxn': T('Reaction, atom by atom', 'Bonds break, atoms move, new bonds form.'),
  'heat:curve': T('Heating the sample', 'Drag along the graph to add heat. The particles change phase.'),
  'heat:lead': T('Watch first', 'A similar case plays by itself.'),
  'heat:shelves': T('Energy diagram', 'Drag the products level up or down to set the energy change.'),
  'heat:well': T('Bond', 'Drag one atom away from the other. The meter shows the energy.'),
  'heat:ledger': T('Bond table', 'Totals the bonds in each tray. Move a card to change the totals.'),
  'heat:stack': T('Stack of steps', 'Adds the cards in its tray. Matching substances cancel. The ladder steps by each ΔH.'),
  'heat:cells': T('Cells and gate', 'Drag a particle into a cell, then press "Log".'),
  'heat:chamber': T('Shaking chamber', 'Press "Shake". The bars count particles in the left half.'),
  'heat:plot': T('Line plot', 'Drag along the line to change the temperature. The ball follows.'),
  'heat:warm': T('Warmed sample', 'Turn the "Heater" dial. Particles move faster.'),
  'heat:marker': T('Number dial', 'Drag the knob to your number.'),
  'heat:selector': T('Answer dial', 'Drag the knob to your answer.')
}, {
  block: ['Metal block', 'Drag it onto another block to join them. Tap the gap to part them.'],
  charge: ['Sample', 'Chemicals that react. Drag one onto the cup.'],
  eqn: ['Reaction card', 'Drag into the stack. "Flip" reverses it; "Larger" doubles it.'],
  bond: ['Bond card', 'Drag into a tray. "Larger" multiplies it.'],
  shelf: ['Energy diagram', 'Drag it to where it belongs.'],
  phase: ['Particle box', 'Drag it to where it belongs.'],
  stmt: ['Statement', 'Drag it to where it belongs.'],
  shift: ['Change card', 'Dots are particles before and after. Drag it to where it belongs.'],
  tag: ['Name card', 'Drag it to where it belongs.'],
  note: ['Card', 'Drag it to the slot.'],
  gcard: ['Line card', 'A line of ΔG against temperature. Drag it to a tray.'],
  num: ['Number card', 'Drag it to the slot.'],
  chip: ['Card', 'Drag it to where it belongs.'],
  ptc: ['Particle', 'Drag it into a cell, then press "Log".']
});

const unit = f => () => import(`../../quests/unit05/${f}.js`);
const demo = (key, file, index, o) => addTourDemo(`heat:${key}`, () => stageDemo(unit(file), index, o));

/** A hand moving one dial in steps: for a tool whose film is the dial. `at` places the hand on the picture's drag zone. */
async function dialDemo(file, index, fid, dial, fractions, { gap = 1.3 } = {}) {
  const [MODEL, LAYOUT, mod] = await Promise.all([import('../model.js'), import('../layout.js'), unit(file)()]);
  const stage = mod.STAGES[index];
  const table = MODEL.createTable(stage.table, stage.title);
  const f = table.fixtures[fid];
  const box = LAYOUT.fixtureLayout(f).box;
  const d = f.dials[dial];
  const steps = fractions.map((fr, k) => {
    const value = Math.round(d.min + fr * (d.max - d.min));
    const along = f.kind === 'shelves' ? { x: box.x0 + f.size.w * 0.75, y: box.y0 + f.size.h - 11 - fr * (f.size.h - 24) }
      : { x: box.x0 + 6 + fr * (f.size.w - 10), y: box.y0 + f.size.h * 0.35 };
    return { at: 1 + k * gap, action: { setDial: { fixture: fid, dial, value } }, tap: along };
  });
  return { table, steps, loop: 1 + fractions.length * gap + 1.6 };
}
/** A table that only moves: a mechanism view with nothing to press. */
async function idleDemo(file, index) {
  const [MODEL, mod] = await Promise.all([import('../model.js'), unit(file)()]);
  const stage = mod.STAGES[index];
  return { table: MODEL.createTable(stage.table, stage.title), steps: [], loop: 8 };
}

demo('fx_lattice', 'q1-flow', 0, { max: 1 });
demo('pc_block', 'q1-flow', 0, { max: 1 });
addTourDemo('heat:fx_lead', () => idleDemo('q1-flow', 1));
demo('pc_note', 'q1-flow', 1, { max: 1 });
demo('pc_charge', 'q1-flow', 3, { max: 2 });
demo('fx_cup', 'q1-flow', 3, { max: 2 });
demo('pc_tag', 'q2-calorimetry', 4, { max: 2 });
addTourDemo('heat:fx_curve', () => dialDemo('q2-calorimetry', 6, 'heating', 'heat', [0, 0.35, 0.55, 0.8, 1]));
addTourDemo('heat:fx_shelves', () => dialDemo('q3-enthalpy', 0, 'chart', 'after', [0.5, 1, 0, 0.25]));
addTourDemo('heat:fx_rxn', () => idleDemo('q3-enthalpy', 3));
addTourDemo('heat:fx_well', () => dialDemo('q4-bonds', 1, 'crank', 'pull', [0.35, 0.7, 1]));
addTourDemo('heat:fx_marker', () => dialDemo('q4-bonds', 5, 'dH', 'value', [0.5, 0.9]));
demo('fx_ledger', 'q4-bonds', 2, { max: 4 });
demo('pc_bond', 'q4-bonds', 2, { max: 4 });
demo('fx_stack', 'q5-hess', 2, { max: 4 });
demo('pc_eqn', 'q5-hess', 2, { max: 4 });
addTourDemo('heat:fx_selector', () => dialDemo('q4-bonds', 1, 'after', 'value', [0.4, 1]));
demo('fx_chamber', 'q6-entropy', 1, { max: 3 });
demo('pc_shift', 'q6-entropy', 2, { max: 3 });
demo('pc_phase', 'q6-entropy', 3, { max: 3 });
addTourDemo('heat:fx_plot', () => dialDemo('q7-gibbs', 1, 'plot', 'temp', [0, 0.5, 1]));
demo('pc_gcard', 'q7-gibbs', 2, { max: 3 });
addTourDemo('*:rail', () => stageDemo(unit('q3-enthalpy'), 5, { max: 3 }));
