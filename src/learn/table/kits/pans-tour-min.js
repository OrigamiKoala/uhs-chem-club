/**
 * kits/pans-tour-min.js — Teeter's Tour: a moving demonstration for every tool and as few words as will do.
 *
 * Each step is a few words under a short film of the tool being used (`table/tour-demo.js`): a real stage's table, played with its own
 * scripted solution, so the film is drawn by the bench's own painters. The words say only what the film cannot: which key, which piece.
 * They explain how a tool works, never which move solves a stage. This file loads after the other Tour files of the kit and replaces
 * their longer words.
 */

import { addTourText } from '../tour.js';
import { addTourDemo, stageDemo } from '../tour-demo.js';

const T = (title, text) => ({ title, text, dials: false });

addTourText({
  'pans:pan': T('Vessel', 'Press "Run". Particles change; the graph follows.'),
  'pans:choice': T('Choice', 'Tap the one you choose.'),
  'pans:vsl': T('Vessels', 'Press "Settle". Each bar is a crowd of particles.'),
  'pans:rig': T('Ratio board', 'Place particles above and below the line.'),
  'pans:qk': T('Test vessel', 'Lay a mixture, press "Run". The marker moves.'),
  'pans:vessel': T('Vessel', 'Touch the supply, burner or piston, then press "Run".'),
  'pans:selector': T('Answer dial', 'Turn to your answer.'),
  'pans:icebars': T('Vessel', 'Press "Settle". The bars glide to their new height.'),
  'pans:clip': T('Demonstration', 'It plays by itself.'),
  'pans:kcheck': T('Vessel check', 'Lay reactions on it, then press "Read K".'),
  'pans:kstack': T('Stack', 'Stack reactions. Shared particles cancel.'),
  'pans:stack': T('Stack', 'Stack reactions. Shared particles cancel.'),
  'pans:pgas': T('Gas box', 'More particles, more pressure.'),
  'pans:beaker': T('Beaker', 'Add solid. Ions leave it.'),
  'pans:kspform': T('Expression', 'Write the constant from the ions.'),
  'pans:kbars': T('Vessel', 'Press "Run". The bars glide to their new height.'),
  'pans:pulls': T('Pulls', 'Compare the two bars.')
}, {
  'pans:note': ['Cards', 'Drag one to the slot.'],
  'pans:tag': ['Cards', 'Read them; they set the case.'],
  'pans:dgm': ['Diagram', 'A frozen vessel. Drag it to the slot.'],
  'pans:arw': ['Reaction', 'Drag it to the slot.'],
  'pans:rtile': ['Particle', 'Place it on the ratio board.'],
  'pans:mixc': ['Mixture', 'Lay it in the test vessel.'],
  'pans:rxn': ['Reaction', 'Flip it, or make it larger.'],
  'pans:ktile': ['Number', 'Drag it to the slot.'],
  'pans:ichip': ['Change', 'Lay it in a column.'],
  'pans:chip': ['Change', 'Lay it in a bin.'],
  'pans:eqn': ['Reaction', 'Drag it onto the stack.']
});

const unit = f => () => import(`../../quests/unit08/${f}.js`);
const demo = (key, file, index, o) => addTourDemo(`pans:${key}`, () => stageDemo(unit(file), index, o));

demo('fx_pan', 'q1-both', 0, { max: 3 });
demo('fx_choice', 'q1-both', 7, { max: 4 });
demo('fx_vsl', 'q2-k', 5, { max: 3 });
demo('fx_rig', 'q2-k', 1, { max: 4 });
demo('pc_pans_rtile', 'q2-k', 1, { max: 4 });
demo('fx_qk', 'q3-q', 2, { max: 3 });
demo('pc_pans_mixc', 'q3-q', 2, { max: 3 });
demo('fx_kcheck', 'q4-properties', 0, { max: 3 });
demo('pc_pans_rxn', 'q4-properties', 5, { max: 4 });
demo('pc_pans_ktile', 'q4-properties', 0, { max: 3 });
demo('fx_kstack', 'q4-properties', 5, { max: 4 });
demo('fx_pgas', 'q4-properties', 6, { max: 1 });
demo('fx_icebars', 'q5-ice', 0, { max: 4 });
demo('pc_pans_ichip', 'q5-ice', 0, { max: 4 });
demo('fx_vessel', 'q6-lean', 0, { max: 3 });
demo('fx_selector', 'q6-lean', 0, { max: 3 });
demo('pc_pans_chip', 'q6-lean', 6, { max: 3 });
demo('fx_beaker', 'q7-dissolve', 0, { max: 3 });
demo('fx_kspform', 'q7-dissolve', 1, { max: 3 });
demo('fx_kbars', 'q8-free', 1, { max: 3 });
demo('fx_pulls', 'q8-free', 4, { max: 3 });
demo('fx_stack', 'q8-free', 6, { max: 4 });
demo('pc_pans_eqn', 'q8-free', 6, { max: 4 });
demo('fx_clip', 'q1-both', 1, { max: 1 });
demo('pc_pans_note', 'q1-both', 1, { max: 2 });
demo('pc_pans_tag', 'q2-k', 0, { max: 2 });
demo('pc_pans_dgm', 'q1-both', 4, { max: 2 });
demo('pc_pans_arw', 'q1-both', 6, { max: 2 });

// What is true of every table: one drag, shown once.
addTourDemo('*:table', () => stageDemo(unit('q1-both'), 1, { max: 2 }));
addTourDemo('*:trays', () => stageDemo(unit('q4-properties'), 0, { max: 3 }));
addTourDemo('*:prediction', () => stageDemo(unit('q1-both'), 1, { max: 2 }));
