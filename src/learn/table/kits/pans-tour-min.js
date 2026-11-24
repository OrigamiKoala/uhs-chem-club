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

const hasSquared = t => Object.values(t?.pieces || {}).some(p => p.kind === 'rtile' && p.props?.p > 1);
const hasFixtureKind = (t, k) => Object.values(t?.fixtures || {}).some(f => f.kind === k);
const hasEmptyIceSlot = t => Object.values(t?.zones?.slots || {}).some(s => s.id.includes('.c') && !s.occupant);

addTourText({
  'pans:pan': T('Vessel', f => {
    if (f?.props?.tracer) return 'Press "Run". The eight white-ringed particles appear on the strip below, tracking each particle over time.';
    if (f?.props?.ghost) return 'Press "Run" and compare the solid lines with the dashed Stage 1 lines.';
    return 'Press "Run". Particles change colour and the graph tracks their counts over time.';
  }),
  'pans:choice': T('Choice', f => f?.props?.placeholder ? `Select your answer (${f.props.placeholder}).` : 'Tap the option you choose.'),
  'pans:vsl': T('Vessels', f => {
    if (f?.noRun && f?.props?.showK) return 'Compare the K value printed on each vessel, then tap the vessel you choose.';
    if (f?.noRun) return 'Read the settled amounts from the bars and the equation beside them.';
    return `Press "${f?.runLabel || 'Settle'}" to let the vessels reach equilibrium. Each bar shows the amount of one substance.`;
  }),
  'pans:rig': T('Ratio board', (f, t) =>
    hasSquared(t)
      ? 'Place tiles above or below the line; ² squares that amount.'
      : 'Place tiles above or below the line; leave bottom empty if unneeded.'
  ),
  'pans:qk': T('Test vessel', f =>
    f?.noRun
      ? 'Lay a mixture card in the slot to compare Q against K.'
      : 'Lay a mixture card in the slot, then press "Run".'
  ),
  'pans:vessel': T('Vessel', f => {
    const p = f?.props || {};
    const acts = [];
    if (f?.dials?.vol) acts.push('Drag the amber piston');
    if (p.heat) acts.push('Tap heat or cool');
    if (p.trap) acts.push('Tap "take out"');
    if (p.supply) acts.push('Tap the gas supply');
    if (p.answer) acts.push('tap the graph (higher / same / lower)');
    if (!acts.length) return f?.noRun ? 'Use the vessel readings and Q marker to decide how each change shifts the balance.' : 'Press "Run" to watch how fast and where the vessel settles.';
    return `${acts.join(', then ')}${f?.noRun ? '.' : ', then press "Run".'}`;
  }),
  'pans:selector': T('Answer dial', 'Drag the knob or tap a label below the track to choose your answer.'),
  'pans:icebars': T('Vessel', f =>
    f?.noRun
      ? 'Compare the settled bars with the dashed starting lines.'
      : 'Press "Settle". Each bar glides from its dashed starting line to equilibrium.'
  ),
  'pans:clip': T('Demonstration', 'Watch how the particles move as the clip plays.'),
  'pans:kcheck': T('K reader', 'Lay a reaction card on the tray, then press "Read K".'),
  'pans:kstack': T('Stack', 'Drag reaction cards onto the stack. Shared substances on opposite sides cancel out.'),
  'pans:stack': T('Stack', 'Drag reaction cards onto the stack. Shared substances on opposite sides cancel out.'),
  'pans:pgas': T('Gas box', 'More particles in the same box give higher pressure.'),
  'pans:beaker': T('Beaker', f => {
    if (f?.runLabel) return `Press "${f.runLabel}" to add scoops until extra solid stays on the floor.`;
    if (f?.dials?.c) return 'Drag or tap the "Sulfate added" dial at the bottom to add sulfate.';
    if (f?.props?.showDissolved) return 'Compare the dissolved salt amounts on each beaker, then tap your choice.';
    return 'Read the ion readings on each beaker and compare with the plate.';
  }),
  'pans:kspform': T('Expression', 'Set each ion\'s power (0 leaves a solid out).'),
  'pans:kbars': T('Vessel', f =>
    f?.noRun
      ? 'Read the settled bars and use the formula with the calculator.'
      : 'Press "Run" on each vessel to see how much product forms.'
  ),
  'pans:pulls': T('Energy Bars', f =>
    f?.props?.water
      ? 'Press "Run" to dissolve the salt and compare the ΔH and TΔS bars.'
      : 'Compare the ΔH and TΔS bars (ΔG = ΔH − TΔS), then tap your choice.'
  )
}, {
  'pans:note': ['Cards', 'Drag one card to the slot.'],
  'pans:tag': ['Cards', 'Read these cards; they give the starting amounts.'],
  'pans:dgm': ['Diagram', 'A frozen vessel. Drag it to the slot.'],
  'pans:arw': ['Reaction arrow', 'Drag the arrow card that matches each vessel into its slot.'],
  'pans:rtile': ['Particle tile', 'Drag or tap to place it above or below the line on the ratio board.'],
  'pans:mixc': ['Mixture card', (p, t) =>
    hasFixtureKind(t, 'qk')
      ? 'Lay a mixture card in the test vessel to check its Q against K.'
      : hasFixtureKind(t, 'clip')
        ? 'Read the mixture amounts and K to make your prediction.'
        : 'Calculate Q from the amounts on each card, then sort it into a bin.'
  ],
  'pans:rxn': ['Reaction card', (p, t) =>
    (t?.tools || []).includes('scale')
      ? 'Select a card and use Flip or Larger, then lay it on the K reader.'
      : 'Lay reaction cards on the K reader to test their combined K.'
  ],
  'pans:ktile': ['K card', 'Drag the matching K value into the answer slot.'],
  'pans:ichip': ['Change tile', (p, t) =>
    hasEmptyIceSlot(t)
      ? 'Drag a change tile into each column of the Change row.'
      : 'The Change row is already filled; read the Equilibrium row at the bottom.'
  ],
  'pans:chip': ['Change card', 'Drag each change card into the bin for the direction it shifts the vessel.'],
  'pans:eqn': ['Reaction card', 'Drag two reaction cards onto the stack so their sum matches the target reaction.']
});

const unit = f => () => import(`../../quests/unit08/${f}.js`);
const demo = (key, file, index, o) => addTourDemo(`pans:${key}`, () => stageDemo(unit(file), index, o));

demo('fx_pan', 'q1-both', 0, { max: 3 });
demo('fx_choice', 'q2-k', 5, { max: 4 });
demo('fx_vsl', 'q2-k', 5, { max: 3 });
demo('fx_rig', 'q2-k', 1, { max: 4 });
demo('pc_pans_rtile', 'q2-k', 1, { max: 4 });
demo('fx_qk', 'q3-q', 2, { max: 3 });
demo('pc_pans_mixc', 'q3-q', 2, { max: 3 });
demo('fx_kcheck', 'q4-properties', 2, { max: 3 });
demo('pc_pans_rxn', 'q4-properties', 2, { max: 4 });
demo('pc_pans_ktile', 'q4-properties', 0, { max: 3 });
demo('fx_icebars', 'q5-ice', 0, { max: 4 });
demo('pc_pans_ichip', 'q5-ice', 0, { max: 4 });
demo('fx_vessel', 'q6-lean', 0, { max: 3 });
demo('fx_selector', 'q6-lean', 0, { max: 3 });
demo('pc_pans_chip', 'q6-lean', 7, { max: 3 });
demo('fx_beaker', 'q7-dissolve', 0, { max: 3 });
demo('fx_kspform', 'q7-dissolve', 1, { max: 3 });
demo('fx_kbars', 'q8-free', 1, { max: 3 });
demo('fx_pulls', 'q8-free', 3, { max: 3 });
demo('fx_stack', 'q8-free', 5, { max: 4 });
demo('pc_pans_eqn', 'q8-free', 5, { max: 4 });
demo('fx_clip', 'q1-both', 1, { max: 1 });
demo('pc_pans_note', 'q1-both', 1, { max: 2 });
demo('pc_pans_tag', 'q2-k', 0, { max: 2 });
demo('pc_pans_arw', 'q1-both', 5, { max: 2 });

// What is true of every table: one drag, shown once.
addTourDemo('*:table', () => stageDemo(unit('q1-both'), 1, { max: 2 }));
addTourDemo('*:trays', () => stageDemo(unit('q4-properties'), 2, { max: 3 }));
addTourDemo('*:prediction', () => stageDemo(unit('q1-both'), 1, { max: 2 }));
