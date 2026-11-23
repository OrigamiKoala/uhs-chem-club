/**
 * kits/matter-tour-min.js — Mirrowen's Tour: a moving demonstration for every tool and as few words as will do.
 *
 * Each step is a few words under a short film of the tool being used (`table/tour-demo.js`): a real stage's table, played with its own
 * scripted solution, so the film is drawn by the bench's own painters and the particles in it move. The words say only what the film
 * cannot: which key, which piece. They explain how a tool works, never which move solves a stage. This file loads after the bench files and
 * replaces their longer words.
 */

import { addTourText } from '../tour.js';
import { addTourDemo, stageDemo } from '../tour-demo.js';

const T = (title, text) => ({ title, text, dials: false });

addTourText({
  'matter:press': T('Piston and tank', 'Drag the piston down, or press "Pour" to tip the jar into the tank.'),
  'matter:window': T('Particle window', 'Turn the "Heater" dial. "Read Molecule" names the molecules in the window.'),
  'matter:jarscale': T('Balance', 'Put a jar on the pan and press "Weigh".'),
  'matter:probe': T('Probe', 'Put a card in the slot and press the button to measure the heat.'),
  'matter:well': T('Bond', 'Drag one atom away from the other. The meter shows the energy.'),
  'matter:vapour': T('Flask and pressure reading', 'Put a liquid in the flask and press "Settle". The reading shows where pressure levels off.'),
  'matter:surface': T('Surface plate', 'Put a liquid in the slot and press "Test".'),
  'matter:cell': T('Equal boxes', 'Put a sample in the box and press "Weigh".'),
  'matter:solidtest': T('Tester', 'Put a sample in, set the Mode dial, and press the button.'),
  'matter:heatcurve': T('Heater and recorder', 'Set any prediction dial first, then press "Heat". The pen draws temperature against heat added.'),
  'matter:cooler': T('Cooler', 'Put a sample in the slot and press "Cool".'),
  'matter:phasemap': T('Pressure and temperature', 'Pick a pressure with the dial and press "Heat".'),
  'matter:flask': T('Flask bench', 'Drag a sample onto the balance or into the flask. The window shows its particles.'),
  'matter:filter': T('Filter', 'Put a mixture in the slot and press "Pour Through".'),
  'matter:strip': T('Paper strip', 'Put an ink in the slot and press "Run Strip".'),
  'matter:still': T('Still', 'Press "Collect Cut" to heat the flask and fill the next vial.'),
  'matter:boiler': T('Boiling flask', 'Put a card in the slot, set the "Dissolved" dial and press "Boil".'),
  'matter:plan': T('Plan board', 'Order the step cards along the rail, then press Submit.'),
  'matter:plaque': T('Plate', 'Facts for the stage. It does not change.'),
  'matter:lead': T('Watch first', 'Watch what happens to the particles before you choose your prediction.'),
  'matter:mlead': T('Watch first', 'Watch what happens to the particles before you choose your prediction.'),
  'matter:marker': T('Number dial', 'Drag the knob or click along the track to set your number.'),
  'matter:selector': T('Answer dial', 'Drag the knob or click along the track to pick your answer.')
}, {
  'matter:jar': ['Jar', 'Drag a jar into the piston, then into one of the labelled boxes.'],
  'matter:pbox': ['Molecule picture', 'The molecules in a jar. Drag it into its matching jar tray.'],
  'matter:mol': ['Molecule card', 'Drag a card into the probe, then onto the rail or into a tray.'],
  'matter:liquid': ['Liquid card', 'Drag a liquid into the instrument, then onto the rail or into a slot.'],
  'matter:pack': ['Picture box', 'Compare the two arrangements and drag each box to its matching tray.'],
  'matter:solid': ['Solid sample', 'Drag a sample into the tester, then into a tray.'],
  'matter:hsamp': ['Sample card', 'Drag a sample card into the cooler to test it.'],
  'matter:sample': ['Sample card', 'Drag a sample card onto the balance or into the flask.'],
  'matter:smp': ['Sample card', 'Drag a sample card into the instrument to test it.'],
  'matter:note': ['Card', 'Drag your chosen card into the slot.'],
  'matter:tag': ['Name card', 'Drag each card into its matching tray.'],
  'matter:stmt': ['Statement', 'Drag each card into its matching slot.']
});

const unit = f => () => import(`../../quests/unit06/${f}.js`);
const demo = (key, file, index, o) => addTourDemo(`matter:${key}`, () => stageDemo(unit(file), index, o));
async function idleDemo(file, index) {
  const [MODEL, mod] = await Promise.all([import('../model.js'), unit(file)()]);
  const stage = mod.STAGES[index];
  return { table: MODEL.createTable(stage.table, stage.title), steps: [], loop: 8 };
}

demo('fx_press', 'q1-states', 0, { max: 1 });
demo('pc_matter_jar', 'q1-states', 0, { max: 1 });
demo('pc_matter_pbox', 'q1-states', 1, { max: 4 });
addTourDemo('matter:fx_lead', () => idleDemo('q1-states', 2));
addTourDemo('matter:fx_mlead', () => idleDemo('q2-grip', 2));
demo('pc_matter_note', 'q1-states', 2, { max: 1 });
demo('fx_window', 'q1-states', 3, { max: 4 });
demo('pc_matter_tag', 'q1-states', 3, { max: 3 });
demo('pc_matter_stmt', 'q1-states', 4, { max: 3 });
demo('fx_jarscale', 'q1-states', 5, { max: 3 });
demo('fx_probe', 'q2-grip', 0, { max: 3 });
demo('pc_matter_mol', 'q2-grip', 0, { max: 3 });
demo('fx_well', 'q2-grip', 6, { max: 3 });
demo('fx_vapour', 'q3-boil', 1, { max: 3 });
demo('pc_matter_liquid', 'q3-boil', 1, { max: 3 });
demo('fx_surface', 'q3-boil', 6, { max: 3 });
demo('fx_selector', 'q3-boil', 6, { max: 4 });
demo('fx_cell', 'q3-boil', 7, { max: 3 });
demo('pc_matter_pack', 'q3-boil', 7, { max: 3 });
demo('fx_solidtest', 'q4-solids', 0, { max: 3 });
demo('pc_matter_solid', 'q4-solids', 0, { max: 3 });
demo('fx_marker', 'q5-crossing', 0, { max: 4 });
demo('fx_heatcurve', 'q5-crossing', 0, { max: 4 });
demo('fx_cooler', 'q5-crossing', 5, { max: 3 });
demo('pc_matter_hsamp', 'q5-crossing', 5, { max: 3 });
demo('fx_phasemap', 'q5-crossing', 6, { max: 3 });
demo('fx_flask', 'q6-solution', 1, { max: 3 });
demo('pc_matter_sample', 'q6-solution', 0, { max: 3 });
demo('fx_filter', 'q7-separate', 1, { max: 3 });
demo('pc_matter_smp', 'q7-separate', 1, { max: 3 });
demo('fx_strip', 'q7-separate', 2, { max: 3 });
demo('fx_still', 'q7-separate', 4, { max: 3 });
demo('fx_boiler', 'q7-separate', 5, { max: 3 });
demo('fx_plan', 'q7-separate', 6, { max: 3 });
