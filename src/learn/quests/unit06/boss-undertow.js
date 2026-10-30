/**
 * boss-undertow.js — Learn world 6 elite: THE UNDERTOW.
 *
 * A brine crawler the size of a harbour tug, dragging the quay toward the freeze. It is made of everything Mirrowen measured, and each of
 * its five phases puts the TABLETOP of a bench the player has worked back in front of them, on the matter kit, with a NEW case on the table
 * and the Undertow standing in the table's corner, watching it. Each phase is a different tool and ONE decision:
 *
 *   1  the hold     three jars of other substances sorted by state                  (the press and tank, bench 1)
 *   2  the siphons  four liquids ranked by the heat to pull their molecules apart   (the probe, bench 2)
 *   3  the vent     the temperature ethanol boils at on a mountain, typed            (the vapour flask, bench 3)
 *   4  the melt     the heat to melt and warm 54.0 g of ice to boiling, typed        (the heating curve, bench 5)
 *   5  the dose     the stock needed to make a flask of weaker brine, typed          (the flask bench, bench 6)
 *
 * The fight keeps every rule a bench stage keeps. A phase prompt states the objective and never the route. A hint rung is one sentence
 * and never the answer; rung 1 names the control. A refusal names what the table shows, never the rule. Nothing blocks a correct commit.
 * A miss costs one point of Integrity and three knock the table back, with every reading and hint still kept. The foe is the Undertow
 * itself, in the corner pad of each table (`table/layout.js` `FOE_PAD`: x from 126.5, y to 23.5 on a 150 x 64 table): it only observes,
 * and a boss phase never declares a field stage. No prediction is asked here: a boss tests what the benches taught.
 *
 * Clearing it files the Case File clue. The boss pays no XP: the main story never does.
 */

import { createRunner, stateFromScript, entryNumber } from '../../engine/stagerunner.js';
import { applyNotes } from '../../table/notes.js';
import {
  matterTable, molCard, probeFixture, plaqueFixture, whereIs, fixed
} from '../../table/kits/matter.js';
import { jarCard, pressFixture } from '../../table/kits/matter-window.js';
import { flaskFixture as vapourFlask, liquidCard } from '../../table/kits/matter-vapour.js';
import { heatCurveFixture } from '../../table/kits/matter-curve.js';
import { flaskFixture as solutionFlask, sample } from '../../table/kits/matter-flask.js';
import { HEATER_STEPS, OUTSIDE_STEPS } from '../../engine/matterdata-vapour.js';
import { stateAt } from '../../engine/matterdata-window.js';
import { SUBSTANCES, boilingPoint, vaporPressure, PHASE_WATER, dilute, stockVolume } from '../../engine/matterdata.js';
import { session } from '../../../session.js';

export const meta = { stageCount: 5 };

export const BUILDS_ON = [
  'unit06/q1-states', 'unit06/q2-grip', 'unit06/q3-boil', 'unit06/q5-crossing', 'unit06/q6-solution'
];

/** Mirrowen has no ground yet, so at T4 the table stands in a room of its own (`rooms.js`) unless the world is built. */
export const ROOM = 'foundry';

const SPEAKER = 'Vess';

/** Every key on these tables says what it does on its cap, so none carries a legend. */
export function toolNoteFor() { return null; }

/** The Undertow, as every phase's foe: one body, watching the table. It reads no probe, it only observes. */
const UNDERTOW_FOE = [{ id: 'undertow', label: 'The Undertow' }];

const widget = { type: 'table', label: 'The bench' };
export const CLUE_ID = 'clue_mirrowen_freeze';

const put = (piece, to) => ({ place: { piece, to } });
const dial = (fixture, name, value) => ({ setDial: { fixture, dial: name, value } });
const typed = (entry, value) => ({ type: { entry, value: String(value) } });
const kj = v => (v < 1 ? (v + 1e-9).toFixed(2) : (v + 1e-9).toFixed(1));

/* ------------------------------------------------------------------
   THE FIGURES (every one asked of the planners, none typed twice)
   ------------------------------------------------------------------ */

// Phase 1: three jars of other substances, at temperatures that set their state.
const P1_JARS = [
  { id: 'a', label: 'A', sample: 'CO2', T: -90 },
  { id: 'b', label: 'B', sample: 'I2', T: 150 },
  { id: 'c', label: 'C', sample: 'Ar', T: -150 }
].map(j => ({ ...j, tray: stateAt(j.sample, j.T) }));
const STATE_LABEL = { solid: 'Solid', liquid: 'Liquid', gas: 'Gas' };

// Phase 2: four liquids, whose order by grip is the reverse of their order by mass.
const P2 = ['ether', 'acetone', 'ethanol', 'H2O'];
const P2_BY_GRIP = [...P2].sort((a, b) => SUBSTANCES[a].grip - SUBSTANCES[b].grip);
const idOf = s => s.toLowerCase();

// Phase 3: ethanol on a mountain where the air pushes with the last step of the Outside dial.
const MOUNTAIN_KPA = OUTSIDE_STEPS[OUTSIDE_STEPS.length - 1];
const P3_BP = boilingPoint('ethanol', MOUNTAIN_KPA);
const P3_TOL = 3;

// Phase 4: 54.0 g of ice at 0 °C melted and warmed to 100 °C. 3.00 mol x 6.01 kJ and 54.0 g x 4.184 x 100 °C.
const P4_G = 54.0;
const P4_KJ = ((P4_G / PHASE_WATER.M) * PHASE_WATER.fus * 1000 + P4_G * PHASE_WATER.cLiquid * 100) / 1000;

// Phase 5: 250 mL of 0.300 M from 1.50 M stock.
const P5 = { stockM: 1.5, wantM: 0.3, flask: 250, stocks: [20, 40, 60, 80] };
const P5_ML = stockVolume(P5.stockM, P5.wantM, P5.flask);

/* ------------------------------------------------------------------
   THE FIVE PHASES
   Each keeps the top-right corner clear for the foe (x from 126.5, y to 23.5 on a 150 x 64 table).
   ------------------------------------------------------------------ */

const POUR = { lump: 'stayed a lump in the tank', pool: 'lay flat in the bottom of the tank', spread: 'spread through the whole tank' };
const said = jar => {
  const did = jar.props.did || {};
  const bits = [];
  if (did.pour) bits.push(POUR[did.pour]);
  if (did.sq != null) bits.push(did.sq < 1 ? `squeezed to ${Math.round(did.sq * 100)} % of its room` : 'did not squeeze smaller');
  return bits.join(' and ');
};

export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  (() => {
    const press = pressFixture('press', { x: 47, y: 22 });
    const spots = [{ x: 106, y: 12 }, { x: 106, y: 34 }, { x: 128, y: 34 }];
    const jars = P1_JARS.map((j, i) => jarCard(j.id, j.label, spots[i], { sample: j.sample, T: j.T }));
    const trays = ['solid', 'liquid', 'gas'].map((id, i) => ({ id, label: STATE_LABEL[id], at: { x: 27 + i * 48, y: 60 }, size: { w: 46, h: 24 }, cell: 23, cellH: 22 }));
    return {
      id: 'p1-hold',
      title: 'Phase 1 · The Hold',
      prompt: 'Sort the three jars from the crawler\'s hold into solid, liquid and gas.',
      widget,
      table: matterTable({ bounds: { w: 150, h: 72 }, recorder: { at: { x: 147.4, y: 45 }, size: { w: 5, h: 3.4 } }, pieces: jars, fixtures: [press.fixture], zones: { slots: [press.slot], trays } }),
      foes: UNDERTOW_FOE,
      encounter: {
        species: 'the undertow',
        act: 'Commit Sort',
        intent: 'The Undertow drags the quay in three jars, each in a state of its own.'
      },
      hints: [
        'Use the press and the "Pour" key on each jar, then drag it into a tray.',
        'Compare what each jar did with what the jars of water did on the first bench.',
        'A jar sorts by how its contents behave, whatever they are made of.'
      ],
      check(state) {
        const t = state.table;
        const jars = P1_JARS.map(j => t.pieces[j.id]);
        if (jars.some(j => !t.zones.trays[whereIs(t, j.id)])) return { ok: false, notYet: true, msg: 'Put every jar in a tray.' };
        const bad = P1_JARS.find(j => whereIs(t, j.id) !== j.tray);
        if (!bad) return { ok: true };
        const s = said(t.pieces[bad.id]);
        return { ok: false, msg: `Jar ${bad.label} sits in the "${STATE_LABEL[whereIs(t, bad.id)]}" tray, and ${s ? `its contents ${s}` : 'it has not been poured or squeezed yet'}.` };
      },
      reward: {
        log: 'Dry ice stayed a lump, iodine pooled and argon spread.',
        title: 'The Hold Breaks',
        body: 'Whatever the substance, a solid keeps its shape, a liquid keeps its volume and a gas fills its container. Iodine is a liquid at 150 °C and argon a gas at −150 °C.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 2 */
  (() => {
    const probe = probeFixture('probe', { x: 34, y: 23 });
    const names = { ether: 'diethyl ether', acetone: 'acetone', ethanol: 'ethanol', H2O: 'water' };
    const mass = id => `${SUBSTANCES[id].M.toFixed(1)} g/mol`;
    const at = P2.map((_, i) => ({ x: 70 + i * 22, y: 54 }));
    const cards = P2.map((s, i) => molCard(idOf(s), s, names[s], at[i], { dipoles: SUBSTANCES[s].polar, shown: mass(s) }));
    return {
      id: 'p2-siphons',
      title: 'Phase 2 · The Siphons',
      prompt: 'Order ether, acetone, ethanol and water by the heat needed to pull one mole of each apart.',
      widget,
      table: matterTable({
        pieces: cards,
        fixtures: [probe.fixture],
        zones: { slots: [probe.slot], rail: { at: { x: 107, y: 34 }, size: { w: 84, h: 16 }, first: 'Needs least heat', last: 'Needs most heat', items: cards.map(c => c.id), start: ['h2o', 'ether', 'ethanol', 'acetone'] } }
      }),
      foes: UNDERTOW_FOE,
      encounter: {
        species: 'the undertow',
        act: 'Commit Order',
        intent: 'The Undertow draws on four siphons, each holding its liquid with a grip of its own.'
      },
      hints: [
        'Use the probe, its key and the rail.',
        'Compare each reading with the mass on its card.',
        'Rank the cards by what the probe read for each, from the smallest heat to the largest.'
      ],
      check(state) {
        const t = state.table;
        const order = t.zones.rail.order;
        if (order.length < 4) return { ok: false, notYet: true, msg: 'Put all 4 cards on the rail.' };
        if (order.join() === P2_BY_GRIP.map(idOf).join()) return { ok: true };
        const cards4 = order.map(id => t.pieces[id]);
        if (cards4.some(p => p.props.grip == null)) return { ok: false, msg: 'Not every card on the rail has been through the probe yet.' };
        const k = cards4.findIndex((p, i) => i > 0 && cards4[i - 1].props.grip > p.props.grip);
        const a = cards4[k - 1]; const b = cards4[k];
        return { ok: false, msg: `${a.label} sits left of ${b.label}, and the probe read ${kj(a.props.grip)} kJ for the one and ${kj(b.props.grip)} kJ for the other.` };
      },
      reward: {
        log: 'The lightest liquid held on hardest.',
        title: 'The Siphons Slacken',
        body: 'The order by heat is the reverse of the order by mass: water holds on hardest because of its hydrogen bonds, ethanol next, then acetone, and ether has only weak dipole–dipole forces and dispersion.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 3 */
  (() => {
    const flask = vapourFlask('flask', { x: 51, y: 27 }, { temps: HEATER_STEPS, outsides: OUTSIDE_STEPS, plot: true, w: 98 });
    const card = liquidCard('eth', 'ethanol', 'ethanol', { x: 112, y: 46 });
    return {
      id: 'p3-vent',
      title: 'Phase 3 · The Vent',
      prompt: `Type the temperature at which ethanol boils when the outside pressure is ${MOUNTAIN_KPA} kPa.`,
      entry: { id: 'bp', label: 'Ethanol boils at', unit: '°C' },
      widget,
      table: matterTable({ pieces: [card], fixtures: [flask.fixture], zones: { slots: [flask.slot] } }),
      foes: UNDERTOW_FOE,
      encounter: {
        species: 'the undertow',
        act: 'Commit Reading',
        intent: 'The Undertow\'s vent opens onto a ridge where the air presses only lightly.'
      },
      hints: [
        'Use the ethanol card, the Heater and Outside dials, the "Settle" key and the number field.',
        'Compare the line of readings on the plot with the amber line for the outside pressure.',
        'Read the temperature where the plotted line meets the amber line, between two heater steps, and type it.'
      ],
      check(state) {
        const t = state.table;
        const v = entryNumber(t, 'bp');
        if (!(v > 0)) return { ok: false, notYet: true, msg: 'Type your answer in the field at the bottom.' };
        if (Math.abs(v - P3_BP) <= P3_TOL) return { ok: true };
        return { ok: false, msg: `At ${fixed(v, 0)} °C the flask's pressure is ${fixed(vaporPressure('ethanol', v), 1)} kPa, and the outside pressure is ${MOUNTAIN_KPA} kPa.` };
      },
      reward: {
        log: 'Ethanol reached the outside pressure well below its usual boiling point.',
        title: 'The Vent Closes',
        body: 'A liquid boils when its vapor pressure reaches the pressure outside it, so on a ridge ethanol boils far below the 78 °C it needs at sea level.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 4 */
  (() => {
    const rec = heatCurveFixture('rec', { x: 51, y: 29 }, {
      grams: P4_G, T0: 0, phase0: 'solid', title: 'Ice at 0 °C · 54.0 g', pulses: [4, 12, 40], pulseStart: 2, window: true, showHeat: false,
      plot: { xMin: 0, xMax: 45, yMin: -20, yMax: 120, xStep: 5, yStep: 20 }
    });
    return {
      id: 'p4-melt',
      title: 'Phase 4 · The Melt',
      prompt: 'Type the heat needed to melt 54.0 g of ice at 0 °C and warm the water to 100 °C, in kilojoules.',
      entry: { id: 'kj', label: 'Heat needed', unit: 'kJ' },
      widget,
      table: matterTable({
        fixtures: [rec, plaqueFixture('ref', 'What you may use', { x: 126, y: 40 }, [
          'Water: 4.184 J/(g·°C)', 'Melting: 6.01 kJ/mol', '1 mol of water is 18.0 g'
        ], { w: 44 })]
      }),
      foes: UNDERTOW_FOE,
      encounter: {
        species: 'the undertow',
        act: 'Commit Heat',
        intent: 'The Undertow\'s ice armour must be melted and warmed before it lets go.'
      },
      hints: [
        'Use the recorder to see the path, the plate for the figures, and the field for your answer.',
        'Follow the sample from ice at 0 °C to water at 100 °C and count every stretch the line has, level or sloping.',
        'Find the heat for each stretch on its own, moles × ΔH for a level stretch and mass × c × ΔT for a slope, then add them.'
      ],
      check(state) {
        const v = entryNumber(state.table, 'kj');
        if (!(v > 0)) return { ok: false, notYet: true, msg: 'Type the heat in kilojoules.' };
        if (Math.abs(v - P4_KJ) <= 0.5) return { ok: true };
        return { ok: false, msg: `${fixed(v, 1)} kJ does not match the line the recorder drew for 54.0 g, which it took to ${fixed(P4_G * PHASE_WATER.cLiquid * 100 / 1000, 1)} kJ for the slope alone.` };
      },
      reward: {
        log: 'The ice armour took about 40.6 kJ to melt and warm.',
        title: 'The Armour Melts',
        body: 'Melting 3.00 mol of ice takes 18.0 kJ and warming 54.0 g of water by 100 °C takes 22.6 kJ more: a level stretch of n × ΔH and a slope of m × c × ΔT, 40.6 kJ together.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 5 */
  (() => {
    const fl = solutionFlask('flask', 2, 2, { stocks: P5.stocks, volume: P5.flask, showM: true });
    const plate = plaqueFixture('want', 'Wanted', { x: 118, y: 44 }, [`${P5.flask} mL of ${P5.wantM.toFixed(3)} M`], { w: 44 });
    return {
      id: 'p5-dose',
      title: 'Phase 5 · The Dose',
      prompt: `Type how many mL of the ${P5.stockM.toFixed(2)} M stock make ${P5.flask} mL of ${P5.wantM.toFixed(3)} M when topped up with water.`,
      entry: { id: 'ml', label: 'Stock needed', unit: 'mL' },
      widget,
      table: matterTable({
        bounds: { w: 150, h: 72 },
        pieces: [sample('stock', 'NaCl', 'Stock', { x: 108, y: 18 }, { made: true, stock: true, M: P5.stockM, shown: `${P5.stockM.toFixed(2)} M` })],
        fixtures: [fl.fixture, plate],
        zones: { slots: [fl.mouth] }
      }),
      foes: UNDERTOW_FOE,
      encounter: {
        species: 'the undertow',
        act: 'Commit Dose',
        intent: 'The Undertow\'s brine is too strong to pour; it must be thinned with water first.'
      },
      hints: [
        'Drag the stock into the flask and turn the "Stock poured in" dial, reading the molarity under the window.',
        'Compare the molarity at the two steps of the dial either side of the molarity you want.',
        'The moles poured in from the stock are the moles that end up in the flask, so the molarity grows in step with the volume poured.'
      ],
      check(state) {
        const t = state.table;
        const v = entryNumber(t, 'ml');
        if (!(v > 0)) return { ok: false, notYet: true, msg: 'Type your answer in the field at the bottom.' };
        if (Math.abs(v - P5_ML) <= 0.5) return { ok: true };
        if (v > P5.flask) return { ok: false, msg: `${v} mL is more than the ${P5.flask} mL flask holds.` };
        return { ok: false, msg: `${v} mL of ${P5.stockM.toFixed(2)} M stock in ${P5.flask} mL makes ${fixed(dilute(P5.stockM, v, P5.flask), 3)} M, and the plate wants ${P5.wantM.toFixed(3)} M.` };
      },
      reward: {
        log: '50.0 mL of 1.50 M stock, topped up to 250 mL, is 0.300 M.',
        title: 'The Undertow Thins',
        body: 'Water changes the litres the moles share, not the moles: 50.0 mL of 1.50 M stock topped up to 250 mL is 0.300 M, and the crawler\'s brine is too weak to hold the ice.',
        last: true
      }
    };
  })()
];

/** How-to lines printed on the plate (`table/notes.js` places each block clear of everything else on the table). */
const NOTES = {
  2: ['Drag a card into the probe, press its key, then put the card on the rail.'],
  3: ['Set the dials, press "Settle", then type your answer.'],
  4: ['Heat the sample, then type your answer.'],
  5: ['Drag the stock into the flask, turn the dial, then type your answer.']
};
applyNotes(STAGES, NOTES);

/* ------------------------------------------------------------------
   THE DEBRIEF
   ------------------------------------------------------------------ */
export const DEBRIEF = {
  speaker: SPEAKER,
  clueAwarded: CLUE_ID,
  sections: [
    {
      heading: 'The Freeze',
      body: 'The Undertow held the harbour with the grips between molecules: states told by how a jar behaves, grips ranked by heat, boiling set by the pressure outside, heat counted stretch by stretch, and brine thinned by the litre.'
    }
  ]
};

/* ------------------------------------------------------------------
   SOLUTIONS AND MISSES — SCRIPTS OF THE PLAYER'S OWN ACTIONS
   ------------------------------------------------------------------ */

const tryJar = id => [put(id, 'slot:press.well'), dial('press', 'squeeze', 4), { run: 'press' }];
const heatSteps = (list, wanted) => wanted.flatMap(T => [dial('flask', 'heat', list.indexOf(T) + 1), { run: 'flask' }]);
const pull = ids => ids.flatMap(id => [put(id, 'slot:probe.well'), { run: 'probe' }]);
const rail = order => order.map((id, i) => put(id, `rail:${i}`));

export const SOLUTIONS = [
  [...P1_JARS.flatMap(j => [...tryJar(j.id), put(j.id, `tray:${j.tray}`)])],
  [...pull(P2.map(idOf)), ...rail(P2_BY_GRIP.map(idOf))],
  [put('eth', 'slot:flask.well'), dial('flask', 'outside', OUTSIDE_STEPS.length), ...heatSteps(HEATER_STEPS, [30, 40, 50, 60, 70]), typed('bp', Math.round(P3_BP))],
  [typed('kj', Math.round(P4_KJ * 10) / 10)],
  [put('stock', 'slot:flask.mouth'), dial('flask', 'stock', 2), typed('ml', Math.round(P5_ML))]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [...P1_JARS.flatMap(j => [...tryJar(j.id), put(j.id, `tray:${j.tray === 'gas' ? 'liquid' : j.tray}`)])],
  [...pull(P2.map(idOf)), ...rail(['h2o', 'ethanol', 'acetone', 'ether'])],
  [typed('bp', 78)],
  [typed('kj', 22.6)],
  [typed('ml', 30)]
];

function blankState() { return {}; }

/** Build a full bench state for stage `i` from one of the sets above. */
export function stateFor(i, overrides) {
  return stateFromScript(STAGES[i], overrides);
}

/* ==================================================================
   THE GAME
   ================================================================== */

export function mount(container, ctx) {
  // Clearing the last phase files the clue. The boss pays no XP, so this is not a rail.
  const bossCtx = {
    ...ctx,
    reportComplete() {
      ctx.reportComplete();
      session.recordClue?.(DEBRIEF.clueAwarded);
    }
  };
  const runner = createRunner(container, bossCtx, {
    STAGES, DEBRIEF, blankState, toolNoteFor,
    room: ROOM,
    onLoad() { /* the table is the stage; there are no keys or readouts to lay out */ }
  });
  runner.start();
  return { dispose: () => runner.dispose() };
}

/* Exported for `verify:learn`, which holds every graded figure to the real tables. */
export const CHECKS = { P1_JARS, P2_BY_GRIP, P3_BP, P4_KJ, P5_ML, MOUNTAIN_KPA };
