/**
 * Unit 6 · Bench 2 — The Grip Between (q2-grip)
 *
 * A tank-farm bay on the matter kit (`table/kits/matter.js`): the PROBE pulls a mole of a liquid's molecules away from their neighbours
 * and reads the heat that took. Eight stages and ONE click: the belief that a heavier molecule always holds on harder. Stage 1 rewards
 * it (xenon beats helium), the prediction offers it, and the water, ammonia and hydrogen sulfide readings of stage 4 contradict it.
 *
 *   1  four noble gases on the rail by what the probe reads                 -> London dispersion forces, polarizability
 *   2  argon, krypton and hydrogen chloride                                  -> dipole–dipole forces
 *   3  PREDICT: water (18 g) or hydrogen sulfide (34 g)?
 *   4  TEST: water, ammonia, hydrogen sulfide and phosphine on the rail      -> hydrogen bonding
 *   5  four ions dropped in water (a second head on the probe)               -> ion–dipole forces
 *   6  butane, n-pentane and neopentane                                       -> shape sets the contact between molecules
 *   7  the crank on an O–H bond against the probe on water, typed            -> a grip is not a bond
 *   8  five sealed samples filed under the strongest force
 *
 * THE WRONG MODEL IS ON THE TABLE. Every card prints its molar mass; the prediction offers "the heavier one"; the readings overturn it.
 * A card that has been in the probe keeps what it read, so four readings can be compared on the rail.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript, entryNumber } from '../../engine/stagerunner.js';
import { remember, recall } from '../../engine/predict.js';
import { applyNotes } from '../../table/notes.js';
import {
  matterTable, molCard, ionCard, probeFixture, wellFixture, probeRead, whereIs, note, fixed
} from '../../table/kits/matter.js';
import { SUBSTANCES, HYDRATION } from '../../engine/matterdata.js';
import { BOND_ENTHALPIES } from '../../engine/thermodata.js';

export const meta = { stageCount: 8 };

/** Mirrowen has no ground yet, so at T4 the table stands in a room of its own (`rooms.js`). */
export const ROOM = 'foundry';

export const VOCABULARY = [
  { term: /\blondon dispersion\b/i, introducedAt: 1 },
  { term: /\bpolarizab/i, introducedAt: 1 },
  { term: /\bdipole[–-]dipole\b/i, introducedAt: 2 },
  { term: /\bhydrogen bond/i, introducedAt: 4 },
  { term: /\bion[–-]dipole\b/i, introducedAt: 5 }
];

/** Moles and molar mass are Tallow's; polarity is Ligar's; the bond crank is Ember Reach's. */
export const BUILDS_ON = ['unit01/q6-weigh', 'unit03/q7-polarity', 'unit05/q4-bonds'];

const SPEAKER = 'Vess';

/** Every key on this bench says what it does on its cap, so none carries a legend. */
export function toolNoteFor() { return null; }

const widget = { type: 'table', label: 'The bench' };
const WELL = 'slot:probe.well';
const QUEST_KEY = 'unit06/q2-grip';
const GUESS_LABEL = { heavier: 'the heavier molecule', lighter: 'the lighter molecule', same: 'about the same' };

const mass = id => `${SUBSTANCES[id].M.toFixed(SUBSTANCES[id].M < 100 ? 1 : 0)} g/mol`;
const gripOrder = ids => [...ids].sort((a, b) => SUBSTANCES[a].grip - SUBSTANCES[b].grip);
const hydOrder = ids => [...ids].sort((a, b) => HYDRATION[a].out - HYDRATION[b].out);
const kj = v => (v < 1 ? v.toFixed(2) : v.toFixed(1));

const NOBLE = ['He', 'Ne', 'Ar', 'Xe'];
const NOBLE_BY_GRIP = gripOrder(NOBLE);
const POLAR = ['Ar', 'Kr', 'HCl'];
const POLAR_BY_GRIP = gripOrder(POLAR);
const HYDRIDES = ['H2O', 'H2S', 'NH3', 'PH3'];
const HYDRIDES_BY_GRIP = gripOrder(HYDRIDES);
const IONS = ['Li+', 'Na+', 'K+', 'Mg2+'];
const IONS_BY_OUT = hydOrder(IONS);
const SHAPES = ['C4H10', 'C5H12', 'neoC5'];
const SHAPES_BY_GRIP = gripOrder(SHAPES);
const OH = BOND_ENTHALPIES['O-H'].dH;
/** Stage 7: breaking both O–H bonds of every molecule in a mole of water, against pulling the molecules apart. */
const BOND_VS_GRIP = (2 * OH) / SUBSTANCES.H2O.grip;
const SEALED = [
  { id: 'x1', sub: 'ethanol', tray: 'hydrogen' },
  { id: 'x2', sub: 'acetone', tray: 'dipole' },
  { id: 'x3', sub: 'Xe', tray: 'dispersion' },
  { id: 'x4', sub: 'NH3', tray: 'hydrogen' },
  { id: 'x5', sub: 'C4H10', tray: 'dispersion' }
];

/** Cards in a row under the probe and the rail. */
const row = (n, y = 54, x0 = 70, pitch = 22) => Array.from({ length: n }, (_, i) => ({ x: x0 + i * pitch, y }));
const RAIL = { at: { x: 107, y: 34 }, size: { w: 84, h: 16 }, first: 'Needs least heat', last: 'Needs most heat' };
const PROBE_AT = { x: 34, y: 23 };

/** A rank of cards on the rail, with the probe: a stage's whole table. */
function rankTable(cards, probe, start) {
  return matterTable({
    pieces: cards,
    fixtures: [probe.fixture],
    zones: { slots: [probe.slot], rail: { ...RAIL, items: cards.map(c => c.id), start } }
  });
}

/** Where the cards stand on the rail, as the readings they kept. */
const heldReading = p => p.props.grip;

/**
 * The refusal for a rank: the first neighbours that read the wrong way round, with what each read. Said only when every card on the rail
 * has been through the probe; otherwise it says which has not.
 */
function rankMiss(t, order, name = id => t.pieces[id].label, unitText = 'kJ') {
  const cards = order.map(id => t.pieces[id]);
  if (cards.some(p => heldReading(p) == null)) return { ok: false, msg: 'Not every card on the rail has been through the probe yet.' };
  const k = cards.findIndex((p, i) => i > 0 && heldReading(cards[i - 1]) > heldReading(p));
  const a = cards[k - 1]; const b = cards[k];
  return { ok: false, msg: `${name(a.id)} sits left of ${name(b.id)}, and the probe read ${kj(heldReading(a))} ${unitText} for the one and ${kj(heldReading(b))} ${unitText} for the other.` };
}

function railCheck(want, minCards = want.length) {
  return state => {
    const t = state.table;
    const order = t.zones.rail.order;
    if (order.length < minCards) return { ok: false, notYet: true, msg: `Put all ${minCards} cards on the rail.` };
    if (order.join() === want.join()) return { ok: true };
    return rankMiss(t, order);
  };
}

/* ------------------------------------------------------------------
   THE STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  (() => {
    const probe = probeFixture('probe', PROBE_AT);
    const at = row(4);
    const cards = NOBLE.map((id, i) => molCard(id.toLowerCase(), id, id, at[i], { cloud: true }));
    return {
      id: 's1-noble',
      title: 'Four Atoms',
      prompt: 'Order the four atoms by the heat needed to pull one mole of them away from their neighbours.',
      widget,
      table: rankTable(cards, probe, ['Ar', 'He', 'Xe', 'Ne'].map(s => s.toLowerCase())),
      hints: [
        'Use the probe, its "Pull Apart" key and the rail.',
        'Compare each reading with the size of the cloud drawn on its card.',
        'Rank the cards by what the probe read for each, from the smallest heat to the largest.'
      ],
      check: railCheck(NOBLE_BY_GRIP.map(s => s.toLowerCase())),
      reward: {
        log: 'Bigger clouds needed more heat to pull apart.',
        title: 'London Dispersion Forces',
        body: 'Atoms attract their neighbours through brief, shifting uneven charges in their electron clouds: London dispersion forces. A bigger cloud is easier to distort, so it is more polarizable, and its grip is stronger.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 2 */
  (() => {
    const probe = probeFixture('probe', PROBE_AT);
    const at = row(3);
    const cards = [
      molCard('ar', 'Ar', 'Ar', at[0], { cloud: true, shown: mass('Ar') }),
      molCard('kr', 'Kr', 'Kr', at[1], { cloud: true, shown: mass('Kr') }),
      molCard('hcl', 'HCl', 'HCl', at[2], { dipoles: true, shown: mass('HCl') })
    ];
    return {
      id: 's2-dipole',
      title: 'A Polar Molecule',
      prompt: 'Order argon, krypton and hydrogen chloride by the heat needed to pull one mole of each apart.',
      widget,
      table: rankTable(cards, probe, ['hcl', 'ar', 'kr']),
      hints: [
        'Use the probe, its key and the rail.',
        'Compare each reading with the mass on its card, and look at which card is drawn with + and − marks.',
        'Rank the cards by what the probe read for each, from the smallest heat to the largest.'
      ],
      check: railCheck(POLAR_BY_GRIP.map(s => s.toLowerCase())),
      reward: {
        log: 'Hydrogen chloride beat krypton, which is much heavier.',
        title: 'Dipole–Dipole Forces',
        body: 'A polar molecule also attracts through its partial charges: the positive end of one pulls the negative end of the next. These dipole–dipole forces add to dispersion, so light hydrogen chloride holds on harder than much heavier krypton.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 3 */
  {
    id: 's3-predict',
    title: 'Which Holds On?',
    // A PREDICT STAGE: the probe is not on the table yet. The guess is made first, here, and comes back with the test.
    predict: true,
    prompt: 'Which needs more heat to be pulled apart, water at 18 g per mole or hydrogen sulfide at 34 g per mole?',
    widget,
    table: matterTable({
      pieces: [
        note('heavier', 'Hydrogen sulfide, because it is the heavier molecule', { x: 30, y: 14 }),
        note('lighter', 'Water, because it is the lighter molecule', { x: 78, y: 14 }),
        note('same', 'About the same heat', { x: 30, y: 34 })
      ],
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 124, y: 24 }, size: { w: 36, h: 14 } }] }
    }),
    hints: [
      'Use the three cards and the slot.',
      'Think of what the last two benches showed about size and about a charge that is uneven.',
      'Commit to the molecule you expect to hold its neighbours harder.'
    ],
    check(state) {
      const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:guess');
      if (!card) return { ok: false, notYet: true, msg: 'Lay a card in the slot.' };
      return { ok: true };
    },
    onClear(state) {
      const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:guess');
      if (card) remember(QUEST_KEY, card.id);
    },
    reward: {
      log: 'Prediction locked in.',
      title: 'Now Test It',
      body: 'Next, pull water, hydrogen sulfide and two more molecules apart with the probe.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  (() => {
    const probe = probeFixture('probe', PROBE_AT);
    const at = row(4);
    const cards = HYDRIDES.map((id, i) => molCard(id.toLowerCase(), id, SUBSTANCES[id].formula, at[i], { dipoles: true, shown: mass(id) }));
    return {
      id: 's4-hydrogen',
      title: 'Four Hydrides',
      get prompt() {
        const guess = recall(QUEST_KEY);
        return guess && GUESS_LABEL[guess]
          ? `You guessed ${GUESS_LABEL[guess]}: order the four molecules by the heat needed to pull one mole of each apart.`
          : 'Order the four molecules by the heat needed to pull one mole of each apart.';
      },
      widget,
      table: rankTable(cards, probe, ['nh3', 'h2s', 'h2o', 'ph3']),
      hints: [
        'Use the probe, its key and the rail.',
        'Compare each reading with the mass on its card, two of the cards weigh nearly the same.',
        'Rank the cards by what the probe read for each, from the smallest heat to the largest.'
      ],
      check: railCheck(HYDRIDES_BY_GRIP.map(s => s.toLowerCase())),
      get reward() {
        const guess = recall(QUEST_KEY);
        const verdict = guess === 'lighter' ? 'You expected water to hold on harder, and the probe agreed. '
          : guess && GUESS_LABEL[guess] ? 'The probe did not agree with your prediction, which is how a guess gets better. ' : '';
        return {
          log: 'Water and ammonia held on far harder than their mass says.',
          title: 'Hydrogen Bonding',
          body: `${verdict}A hydrogen bonded to nitrogen, oxygen or fluorine is strongly positive, and it is drawn to a lone pair on the next molecule: a hydrogen bond. It is the strongest force between neutral molecules, so light water and ammonia beat the heavier sulfide and phosphine.`
        };
      }
    };
  })(),

  /* ---------------------------------------------------------------- 5 */
  (() => {
    const probe = probeFixture('probe', PROBE_AT, { mode: 'ion', title: 'Probe: ion in water' });
    const at = row(4);
    const cards = IONS.map((id, i) => ionCard(id.toLowerCase().replace('+', 'p'), id, HYDRATION[id].symbol, HYDRATION[id].r, at[i]));
    return {
      id: 's5-ion',
      title: 'Ions in Water',
      prompt: 'Order the four ions by the heat given out when one mole of each is dropped in water.',
      widget,
      table: matterTable({
        pieces: cards,
        fixtures: [probe.fixture],
        zones: { slots: [probe.slot], rail: { ...RAIL, first: 'Gives out least heat', last: 'Gives out most heat', items: cards.map(c => c.id), start: ['lip', 'mg2p', 'kp', 'nap'] } }
      }),
      hints: [
        'Use the probe, its key and the rail.',
        'Compare each reading with the width of the disc drawn on its card, and with its charge.',
        'Rank the cards by what the probe read for each, from the smallest heat to the largest.'
      ],
      check: railCheck(IONS_BY_OUT.map(id => id.toLowerCase().replace('+', 'p'))),
      reward: {
        log: 'Small, highly charged ions gave out the most heat.',
        title: 'Ion–Dipole Forces',
        body: 'Water molecules are polar, so an ion pulls on their partial charges: an ion–dipole force. The smaller the ion and the larger its charge, the closer the water can come and the more heat is given out.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 6 */
  (() => {
    const probe = probeFixture('probe', PROBE_AT);
    const at = row(3);
    const names = { C4H10: 'butane', C5H12: 'n-pentane', neoC5: 'neopentane' };
    const cards = SHAPES.map((id, i) => molCard(id.toLowerCase(), id, names[id], at[i], { shown: `${SUBSTANCES[id].formula} · ${mass(id)}` }));
    return {
      id: 's6-shape',
      title: 'Same Formula',
      prompt: 'Order butane, n-pentane and neopentane by the heat needed to pull one mole of each apart.',
      widget,
      table: rankTable(cards, probe, ['c5h12', 'neoc5', 'c4h10']),
      hints: [
        'Use the probe, its key and the rail.',
        'Compare the two cards with the same formula, and the way each is drawn.',
        'Rank the cards by what the probe read for each, from the smallest heat to the largest.'
      ],
      check: railCheck(SHAPES_BY_GRIP.map(s => s.toLowerCase())),
      reward: {
        log: 'The straight chain gripped harder than its compact twin.',
        title: 'Shape and Contact',
        body: 'Two molecules with one formula can grip differently. A straight chain lies along its neighbours and touches them over its whole length, so it has more dispersion force than a compact, ball-shaped molecule of the same weight.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 7 */
  (() => {
    const probe = probeFixture('probe', { x: 86, y: 24 });
    const crank = wellFixture('crank', { x: 28, y: 24 }, { bond: 'O-H', atoms: ['O', 'H'], bondLabel: 'O–H bond', title: 'Bond crank' });
    return {
      id: 's7-bond',
      title: 'A Grip and a Bond',
      prompt: 'Type how many times more heat it takes to break every O–H bond in a mole of water than to pull the molecules apart.',
      entry: { id: 'times', label: 'Times more heat', unit: '×' },
      widget,
      table: matterTable({
        pieces: [molCard('h2o', 'H2O', 'H₂O', { x: 136, y: 14 }, { dipoles: true })],
        fixtures: [crank, probe.fixture],
        zones: { slots: [probe.slot] }
      }),
      hints: [
        'Use the crank for one O–H bond, and the probe with the water card.',
        'Compare what the crank reads for a mole of O–H bonds with what the probe reads, and count the bonds in the molecule drawn on the card.',
        'Divide the heat for all the O–H bonds in a mole of molecules by the heat to pull a mole of molecules apart.'
      ],
      check(state) {
        const t = state.table;
        const v = entryNumber(t, 'times');
        if (!(v > 0)) return { ok: false, notYet: true, msg: 'Type your answer in the field at the bottom.' };
        if (Math.abs(v - BOND_VS_GRIP) <= 1.5) return { ok: true };
        const r = probeRead(t, 'probe');
        if (!r.pulled) return { ok: false, msg: 'The probe has not pulled the water yet.' };
        if (Math.abs(v - OH / SUBSTANCES.H2O.grip) <= 1) return { ok: false, msg: `${fixed(v, 0)} counts one O–H bond for each molecule, and the water drawn on the card has two.` };
        return { ok: false, msg: `The crank reads ${Math.round(OH)} kJ for a mole of O–H bonds and the probe ${kj(r.value)} kJ for a mole of molecules; ${fixed(v, 0)} times does not fit the two.` };
      },
      reward: {
        log: 'Breaking the bonds in water costs about twenty times more than pulling the molecules apart.',
        title: 'A Grip Is Not a Bond',
        body: 'Pulling molecules apart costs tens of kilojoules a mole; breaking the bonds inside them costs hundreds. When water boils, the molecules separate and stay whole.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 8 */
  (() => {
    const probe = probeFixture('probe', PROBE_AT);
    const at = row(5, 54, 28, 22);
    const cards = SEALED.map((s, i) => molCard(s.id, s.sub, s.id.toUpperCase(), at[i], { dipoles: true, cloud: SUBSTANCES[s.sub].r != null }));
    const tray = (id, label, x) => ({ id, label, at: { x, y: 28 }, size: { w: 26, h: 34 }, cell: 22, cellH: 16 });
    return {
      id: 's8-sealed',
      title: 'Five Sealed Samples',
      prompt: 'File each sealed sample under the strongest force between its molecules.',
      widget,
      table: matterTable({
        pieces: cards,
        fixtures: [probe.fixture],
        zones: { slots: [probe.slot], trays: [tray('dispersion', 'Dispersion', 78), tray('dipole', 'Dipole–dipole', 106), tray('hydrogen', 'Hydrogen bond', 134)] }
      }),
      hints: [
        'Use the probe and its key, and drag each sample into a tray.',
        'Compare each sample\'s picture and its reading with the others in the tray you are choosing.',
        'Look for which atoms carry a + or − mark, and for a hydrogen sitting on nitrogen, oxygen or fluorine.'
      ],
      check(state) {
        const t = state.table;
        const wrong = SEALED.filter(s => whereIs(t, s.id) !== s.tray);
        if (SEALED.some(s => !t.zones.trays[whereIs(t, s.id)])) return { ok: false, notYet: true, msg: 'Every sample needs a tray.' };
        if (!wrong.length) return { ok: true };
        const s = wrong[0];
        return { ok: false, msg: `${s.id.toUpperCase()} sits in the "${t.zones.trays[whereIs(t, s.id)].label}" tray, and its picture does not match the others there.` };
      },
      reward: {
        log: 'Dispersion in every sample, dipole–dipole in the polar ones, hydrogen bonds where H sits on N, O or F.',
        title: 'Reading the Forces',
        body: 'Every molecule has dispersion forces. A polar one adds dipole–dipole forces, and one with hydrogen on nitrogen, oxygen or fluorine adds hydrogen bonds, the strongest of the three.'
      }
    };
  })()
];

/** How-to lines printed on the plate (`table/notes.js` places each block clear of everything else on the table). */
const NOTES = {
  1: ['Drag a card into the probe, press its key, then put the card on the rail.'],
  2: ['Drag a card into the probe, press its key, then put the card on the rail.'],
  3: ['Drag the card you choose into the slot.'],
  4: ['Drag a card into the probe, press its key, then put the card on the rail.'],
  5: ['Drag a card into the probe, press its key, then put the card on the rail.'],
  6: ['Drag a card into the probe, press its key, then put the card on the rail.'],
  7: ['Turn the crank, drag the water into the probe, press its key, then type your answer.'],
  8: ['Pull each sample in the probe, then drag it to a tray.']
};
applyNotes(STAGES, NOTES);

/* ------------------------------------------------------------------
   THE DEBRIEF
   ------------------------------------------------------------------ */
export const DEBRIEF = {
  speaker: SPEAKER,
  sections: [
    {
      heading: 'What You Found',
      body: 'Molecules hold their neighbours through dispersion forces, dipole–dipole forces and hydrogen bonds, and ions hold water through ion–dipole forces. Each is far weaker than a bond inside a molecule.'
    }
  ]
};

/* ------------------------------------------------------------------
   SOLUTIONS AND MISSES — SCRIPTS OF THE PLAYER'S OWN ACTIONS
   ------------------------------------------------------------------ */

const put = (piece, to) => ({ place: { piece, to } });
const dial = (fixture, name, value) => ({ setDial: { fixture, dial: name, value } });
const pullAll = ids => ids.flatMap(id => [put(id, WELL), { run: 'probe' }]);
const rail = order => order.map((id, i) => put(id, `rail:${i}`));
const low = ids => ids.map(s => s.toLowerCase());
const ionId = id => id.toLowerCase().replace('+', 'p');

export const SOLUTIONS = [
  [...pullAll(low(NOBLE)), ...rail(low(NOBLE_BY_GRIP))],
  [...pullAll(low(POLAR)), ...rail(low(POLAR_BY_GRIP))],
  [put('lighter', 'slot:guess')],
  [...pullAll(low(HYDRIDES)), ...rail(low(HYDRIDES_BY_GRIP))],
  [...pullAll(IONS.map(ionId)), ...rail(IONS_BY_OUT.map(ionId))],
  [...pullAll(low(SHAPES)), ...rail(low(SHAPES_BY_GRIP))],
  [put('h2o', WELL), { run: 'probe' }, dial('crank', 'pull', 7), { type: { entry: 'times', value: String(Math.round(BOND_VS_GRIP)) } }],
  [...SEALED.flatMap(s => [put(s.id, WELL), { run: 'probe' }, put(s.id, `tray:${s.tray}`)])]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [...pullAll(low(NOBLE)), ...rail(low([...NOBLE_BY_GRIP].reverse()))],
  [...pullAll(low(POLAR)), ...rail(['hcl', 'ar', 'kr'])],
  [],
  [...pullAll(low(HYDRIDES)), ...rail(['nh3', 'h2o', 'ph3', 'h2s'])],
  [...pullAll(IONS.map(ionId)), ...rail(['lip', 'nap', 'kp', 'mg2p'])],
  [...pullAll(low(SHAPES)), ...rail(['c4h10', 'c5h12', 'neoc5'])],
  [put('h2o', WELL), { run: 'probe' }, { type: { entry: 'times', value: String(Math.round(OH / SUBSTANCES.H2O.grip)) } }],
  [...SEALED.flatMap(s => [put(s.id, WELL), { run: 'probe' }, put(s.id, s.id === 'x4' ? 'tray:dipole' : `tray:${s.tray}`)])]
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
  const runner = createRunner(container, ctx, {
    STAGES, DEBRIEF, blankState, toolNoteFor,
    room: ROOM,
    onLoad() { /* the table is the stage */ }
  });
  runner.start();
  return { dispose: () => runner.dispose() };
}

/* Exported for `verify:learn`, which holds every graded figure to the real tables. */
export const CHECKS = { NOBLE_BY_GRIP, POLAR_BY_GRIP, HYDRIDES_BY_GRIP, IONS_BY_OUT, SHAPES_BY_GRIP, BOND_VS_GRIP, OH, SEALED };
export { probeRead };
