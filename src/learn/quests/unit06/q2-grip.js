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
import {
  matterTable, molCard, ionCard, probeFixture, wellFixture, probeRead, whereIs, note, stmt, fixed, mleadFixture
} from '../../table/kits/matter.js';
import { SUBSTANCES, HYDRATION } from '../../engine/matterdata.js';
import { BOND_ENTHALPIES } from '../../engine/thermodata.js';

export const meta = { stageCount: 9 };


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
const kj = v => (v < 1 ? (v + 1e-9).toFixed(2) : (v + 1e-9).toFixed(1));

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
const RAIL = { at: { x: 107, y: 34 }, size: { w: 84, h: 16 }, labelLift: 3.2, first: 'Least heat to pull apart', last: 'Most heat to pull apart' };
const PROBE_AT = { x: 34, y: 23 };

/** A rank of cards on the rail, with the probe: a stage's whole table. */
function rankTable(cards, probe, start = null) {
  return matterTable({
    pieces: cards,
    fixtures: [probe.fixture],
    zones: { slots: [probe.slot], rail: { ...RAIL, items: cards.map(c => c.id), ...(start ? { start } : {}) } }
  });
}

/** Where the cards stand on the rail, as the readings they kept. */
const heldReading = p => p.props.grip;

/**
 * The refusal for a rank: the first neighbours that read the wrong way round, with what each read. Said only when every card on the rail
 * has been through the probe; otherwise it says which has not.
 */
function rankMiss(t, order, name = id => t.pieces[id].label, unitText = 'kJ', required = null) {
  const cards = order.map(id => t.pieces[id]);
  const checkCards = required ? required.map(id => t.pieces[id]) : cards;
  if (checkCards.some(p => heldReading(p) == null)) {
    return { ok: false, msg: required ? `Test ${required.map(id => name(id)).join(' and ')} in the probe first.` : 'Not every card on the rail has been through the probe yet.' };
  }
  if (required) {
    const readings = required.map(id => `${name(id)} (${kj(heldReading(t.pieces[id]))} ${unitText})`).join(' and ');
    return { ok: false, msg: `The probe read ${readings}; the order on the rail does not match the trend.` };
  }
  const k = cards.findIndex((p, i) => i > 0 && heldReading(cards[i - 1]) > heldReading(p));
  const a = cards[k - 1]; const b = cards[k];
  return { ok: false, msg: `${name(a.id)} (${kj(heldReading(a))} ${unitText}) is left of ${name(b.id)} (${kj(heldReading(b))} ${unitText}), so they are out of order.` };
}

function railCheck(want, minCards = want.length, required = null) {
  return state => {
    const t = state.table;
    const order = t.zones.rail.order;
    if (order.length < minCards) return { ok: false, notYet: true, msg: `Put all ${minCards} cards on the rail.` };
    const checkIds = required || want;
    if (checkIds.some(id => heldReading(t.pieces[id]) == null)) {
      return { ok: false, msg: 'Test every card in the probe first.' };
    }
    if (order.join() === want.join()) return { ok: true };
    return rankMiss(t, order, id => t.pieces[id].label, 'kJ', required);
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
      briefing: {
        speaker: SPEAKER,
        body: 'Start with single noble-gas atoms, the simplest case of particles attracting each other, before testing water.'
      },
      prompt: 'Order the four atoms from the least heat needed to pull them apart to the most.',
      widget,
      table: rankTable(cards, probe),
      hints: [
        'Test all four atoms in the probe, then order them on the rail.',
        'Compare the size of each atom\'s electron cloud with how much heat it needed in the probe.',
        'A larger electron cloud shifts out of shape more easily, creating a stronger attraction.'
      ],
      check: railCheck(NOBLE_BY_GRIP.map(s => s.toLowerCase()), 4),
      reward: {
        log: 'Larger electron clouds needed more heat to separate.',
        title: 'London Dispersion Forces',
        body: 'Moving electrons create brief, uneven charges (London dispersion forces). A larger electron cloud shifts out of shape more easily (more polarizable), creating a stronger attraction.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 2 */
  (() => {
    const probe = probeFixture('probe', PROBE_AT);
    const at = row(3, 53, 13, 22);
    const cards = [
      molCard('ar', 'Ar', 'Ar', at[0], { cloud: true, shown: mass('Ar') }),
      molCard('kr', 'Kr', 'Kr', at[1], { cloud: true, shown: mass('Kr') }),
      molCard('hcl', 'HCl', 'HCl', at[2], { dipoles: true, shown: mass('HCl') })
    ];
    const reasons = [
      stmt('polar', 'HCl has permanent + and − ends', { x: 85, y: 11 }),
      stmt('cloud', 'HCl has a larger electron cloud', { x: 85, y: 31 }),
      stmt('heavier', 'HCl has a greater molar mass', { x: 128, y: 21 })
    ];
    return {
      id: 's2-dipole',
      title: 'A Polar Molecule',
      briefing: {
        speaker: SPEAKER,
        body: 'Separate HCl and Kr in the probe and watch what appears between their molecules.'
      },
      prompt: 'Which attracts its neighbors more strongly, HCl or Kr, and why?',
      widget,
      table: matterTable({
        pieces: [...cards, ...reasons],
        fixtures: [probe.fixture],
        zones: { slots: [probe.slot, { id: 'why', label: 'Reason', at: { x: 125, y: 51 }, size: { w: 42, h: 16 } }] }
      }),
      hints: [
        'Separate HCl and Kr in the probe, then place one reason card in the slot.',
        'Compare the molar masses on the cards and notice what appears on HCl in the probe window.',
        'Krypton has more mass and a larger cloud, so look at what extra feature HCl has.'
      ],
      check(state) {
        const t = state.table;
        const card = reasons.find(c => t.pieces[c.id].zone === 'slot:why');
        if (!card) return { ok: false, notYet: true, msg: 'Place a reason card in the slot.' };
        if (t.pieces.hcl.props.grip == null || t.pieces.kr.props.grip == null) {
          return { ok: false, msg: 'Separate both HCl and Kr in the probe first.' };
        }
        if (card.id === 'polar') return { ok: true };
        if (card.id === 'heavier') return { ok: false, msg: 'Krypton (83.8 g/mol) is heavier than HCl (36.5 g/mol), yet HCl needed more heat to separate.' };
        return { ok: false, msg: 'Krypton has the larger electron cloud, yet HCl needed more heat to separate.' };
      },
      reward: {
        log: 'Light HCl beat much heavier Kr.',
        title: 'Dipole–Dipole Forces',
        body: 'A polar molecule has permanent + and − ends (a dipole) that attract opposite ends on neighboring molecules. These dipole–dipole forces add to dispersion, letting light HCl beat heavier Kr.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 3 */
  {
    id: 's3-predict',
    title: 'Which Attracts More?',
    // A PREDICT STAGE: the probe is not on the table yet. The guess is made first, here, and comes back with the test.
    predict: true,
    prompt: 'Which needs more heat to separate a mole: water (18 g/mol) or hydrogen sulfide (34 g/mol)?',
    widget,
    table: matterTable({
      pieces: [
        note('heavier', 'Hydrogen sulfide (34 g/mol)', { x: 30, y: 14 }),
        note('lighter', 'Water (18 g/mol)', { x: 74, y: 14 }),
        note('same', 'About the same heat', { x: 30, y: 34 })
      ],
      fixtures: [mleadFixture('lead', { x: 117, y: 52 }, { scene: 'pull', w: 44, h: 24 })],
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 124, y: 24 }, size: { w: 40, h: 15 } }] }
    }),
    hints: [
      'Drag one of the three prediction cards into the slot.',
      'Think about what the last two stages showed about cloud size and permanent dipoles.',
      'Pick which molecule you expect to need more heat to separate.'
    ],
    check(state) {
      const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:guess');
      if (!card) return { ok: false, notYet: true, msg: 'Place a prediction card in the slot.' };
      return { ok: true };
    },
    onClear(state) {
      const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:guess');
      if (card) remember(QUEST_KEY, card.id);
    },
    reward: {
      log: 'Prediction locked in.',
      title: 'Now Test It',
      body: 'Next, test water, hydrogen sulfide, and two related molecules in the probe.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  (() => {
    const probe = probeFixture('probe', PROBE_AT);
    const at = row(4, 62, 14, 22);
    const cards = HYDRIDES.map((id, i) => molCard(id.toLowerCase(), id, SUBSTANCES[id].formula, at[i], { dipoles: true, shown: mass(id) }));
    const want = { h2o: 'hbond', nh3: 'hbond', h2s: 'none', ph3: 'none' };
    const tray = (id, label, x) => ({ id, label, at: { x, y: 28 }, size: { w: 34, h: 38 }, cell: 24, cellH: 18 });
    return {
      id: 's4-hydrogen',
      title: 'Four Hydrides',
      briefing: {
        speaker: SPEAKER,
        body: 'Separate all four molecules in the probe and watch for dashed attraction lines between them.'
      },
      prompt: 'Which of these molecules form strong hydrogen bonds with their own kind?',
      widget,
      table: matterTable({
        bounds: { w: 150, h: 72 },
        pieces: cards,
        fixtures: [probe.fixture],
        zones: { slots: [probe.slot], trays: [tray('hbond', 'Forms hydrogen bonds', 90), tray('none', 'Does not', 128)] }
      }),
      hints: [
        'Separate each molecule in the probe, then sort each card into a tray.',
        'Compare each molecule\'s separation heat with its molar mass, and watch for dashed H-bond lines in the probe.',
        'Check which molecules have hydrogen bonded directly to nitrogen, oxygen, or fluorine.'
      ],
      check(state) {
        const t = state.table;
        const ids = Object.keys(want);
        if (ids.some(id => !t.zones.trays[whereIs(t, id)])) return { ok: false, notYet: true, msg: 'Sort all four molecules into trays.' };
        if (ids.some(id => t.pieces[id].props.grip == null)) return { ok: false, msg: 'Separate all four molecules in the probe first.' };
        const bad = ids.find(id => whereIs(t, id) !== want[id]);
        if (!bad) return { ok: true };
        return { ok: false, msg: `${t.pieces[bad].label} is in "${t.zones.trays[whereIs(t, bad)].label}". Compare the probe readings: H₂O (40.7 kJ) and NH₃ (23.4 kJ) need far more heat than heavier H₂S (18.7 kJ) and PH₃ (14.6 kJ).` };
      },
      get reward() {
        const guess = recall(QUEST_KEY);
        const verdict = guess === 'lighter' ? 'The probe matched your prediction. '
          : guess && GUESS_LABEL[guess] ? 'The probe overturned your prediction. ' : '';
        return {
          log: 'Water and ammonia needed far more heat than their mass alone predicts.',
          title: 'Hydrogen Bonding',
          body: `${verdict}Water and ammonia form hydrogen bonds (H bonded to N, O, or F attracted to a neighboring lone pair), so they need far more heat to separate than heavier H₂S and PH₃.`
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
      briefing: {
        speaker: SPEAKER,
        body: 'Salt dissolves in canal water. Drop each ion into water in the probe to measure how strongly water attracts it.'
      },
      prompt: 'Order the four ions from the least heat released in water to the most.',
      widget,
      table: matterTable({
        pieces: cards,
        fixtures: [probe.fixture],
        zones: { slots: [probe.slot], rail: { ...RAIL, first: 'Releases least heat', last: 'Releases most heat', items: cards.map(c => c.id) } }
      }),
      hints: [
        'Test all four ions in the probe, then order them along the rail.',
        'Compare the size and charge of each ion with the heat it released.',
        'A smaller ion or one with a higher charge pulls water closer and releases more heat.'
      ],
      check: railCheck(IONS_BY_OUT.map(id => id.toLowerCase().replace('+', 'p')), 4),
      reward: {
        log: 'Small, highly charged ions released the most heat.',
        title: 'Ion–Dipole Forces',
        body: 'Water is polar, so an ion attracts the oppositely charged end of each water molecule (an ion–dipole force). Smaller ions with higher charge pull water closer and release more heat.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 6 */
  (() => {
    const probe = probeFixture('probe', PROBE_AT);
    const at = row(3, 53, 13, 22);
    const names = { C4H10: 'butane', C5H12: 'n-pentane', neoC5: 'neopentane' };
    const cards = SHAPES.map((id, i) => molCard(id.toLowerCase(), id, names[id], at[i], { shown: `${SUBSTANCES[id].formula} · ${mass(id)}` }));
    const choices = [
      stmt('pent', 'n-pentane', { x: 85, y: 11 }),
      stmt('neo', 'neopentane', { x: 85, y: 31 }),
      stmt('same', 'The same', { x: 128, y: 21 })
    ];
    return {
      id: 's6-shape',
      title: 'Same Formula',
      briefing: {
        speaker: SPEAKER,
        body: 'Neopentane and n-pentane have the same C₅H₁₂ formula, but neopentane is a compact ball while n-pentane is a long chain.'
      },
      prompt: 'Both n-pentane and neopentane are C₅H₁₂. Which needs more heat to separate a mole?',
      widget,
      table: matterTable({
        pieces: [...cards, ...choices],
        fixtures: [probe.fixture],
        zones: { slots: [probe.slot, { id: 'ans', label: 'Needs more heat', at: { x: 125, y: 51 }, size: { w: 42, h: 16 } }] }
      }),
      hints: [
        'Separate n-pentane and neopentane in the probe, then place an answer card in the slot.',
        'Which shape can lie flat alongside its neighbors with more surface contact?',
        'A long chain touches its neighbors over more of its surface than a compact ball.'
      ],
      check(state) {
        const t = state.table;
        const card = choices.find(c => t.pieces[c.id].zone === 'slot:ans');
        if (!card) return { ok: false, notYet: true, msg: 'Place an answer card in the slot.' };
        if (t.pieces.c5h12.props.grip == null || t.pieces.neoc5.props.grip == null) {
          return { ok: false, msg: 'Separate both n-pentane and neopentane in the probe first.' };
        }
        if (card.id === 'pent') return { ok: true };
        return { ok: false, msg: `In the probe, n-pentane needed ${kj(SUBSTANCES.C5H12.grip)} kJ while neopentane needed ${kj(SUBSTANCES.neoC5.grip)} kJ.` };
      },
      reward: {
        log: 'The long chain needed more heat than its compact twin.',
        title: 'Shape and Contact',
        body: 'Molecules with the same formula can have different attractions. A long chain makes more surface contact with neighbors than a compact ball, giving it stronger dispersion forces.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 7 */
  (() => {
    const probe = probeFixture('probe', { x: 86, y: 22 });
    const crank = wellFixture('crank', { x: 28, y: 22 }, { bond: 'O-H', atoms: ['O', 'H'], bondLabel: 'O–H bond', title: 'Bond pull dial', pullLabel: 'Pull' });
    const choices = [
      note('same', 'About the same', { x: 24, y: 54 }),
      note('twice', 'About twice as much', { x: 68, y: 54 }),
      note('twenty', 'More than twenty times as much', { x: 112, y: 54 })
    ];
    return {
      id: 's7-bond',
      title: 'An Attraction and a Bond',
      prompt: 'How does the energy to break both O–H bonds in a mole of water compare with separating water molecules?',
      widget,
      table: matterTable({
        pieces: [molCard('h2o', 'H2O', 'H₂O', { x: 132, y: 12 }, { dipoles: true }), ...choices],
        fixtures: [crank, probe.fixture],
        zones: { slots: [probe.slot, { id: 'cmp', label: 'Comparison', at: { x: 126, y: 31 }, size: { w: 42, h: 15 } }] }
      }),
      hints: [
        'Pull the O–H bond dial to measure one bond, separate water in the probe, then place a comparison card in the slot.',
        'Compare the energy for a mole of O–H bonds with the probe reading for water, and count the O–H bonds in H₂O.',
        'Each water molecule has two O–H bonds, so account for both before comparing with the probe reading.'
      ],
      check(state) {
        const t = state.table;
        const card = choices.find(c => t.pieces[c.id].zone === 'slot:cmp');
        if (!card) return { ok: false, notYet: true, msg: 'Place a comparison card in the slot.' };
        const r = probeRead(t, 'probe');
        if (!r.pulled) return { ok: false, msg: 'Separate water in the probe first.' };
        if (card.id === 'twenty') return { ok: true };
        return { ok: false, msg: `Breaking one mole of O–H bonds takes ${Math.round(OH)} kJ (so two per molecule is ${Math.round(2 * OH)} kJ), while separating a mole of water takes only ${kj(r.value)} kJ.` };
      },
      reward: {
        log: 'Breaking the bonds in water takes over twenty times more energy than separating the molecules.',
        title: 'An Attraction Is Not a Bond',
        body: 'Breaking the O–H bonds inside water takes over twenty times more energy than separating the molecules. That is why boiling separates molecules without breaking them apart.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 8 */
  (() => {
    const probe = probeFixture('probe', PROBE_AT);
    const at = row(5, 62, 24, 22);
    const cards = SEALED.map((s, i) => molCard(s.id, s.sub, s.id.toUpperCase(), at[i], { dipoles: true, cloud: SUBSTANCES[s.sub].r != null }));
    const tray = (id, label, x) => ({ id, label, at: { x, y: 31 }, size: { w: 26, h: 42 }, cell: 24, cellH: 14 });
    return {
      id: 's8-sealed',
      title: 'Five Sealed Samples',
      prompt: 'What is the strongest intermolecular force in each sample?',
      widget,
      table: matterTable({
        bounds: { w: 150, h: 74 },
        pieces: cards,
        fixtures: [probe.fixture],
        zones: { slots: [probe.slot], trays: [tray('dispersion', 'Dispersion', 78), tray('dipole', 'Dipole–dipole', 106), tray('hydrogen', 'Hydrogen bond', 134)] }
      }),
      hints: [
        'Separate each sample in the probe, then sort it into a tray.',
        'Watch what appears between the molecules in the probe and compare the heat readings.',
        'Look for + and − charges, and check for hydrogen bonded to nitrogen, oxygen, or fluorine.'
      ],
      check(state) {
        const t = state.table;
        if (SEALED.some(s => !t.zones.trays[whereIs(t, s.id)])) return { ok: false, notYet: true, msg: 'Sort every sample into a tray.' };
        if (SEALED.some(s => t.pieces[s.id].props.grip == null)) return { ok: false, msg: 'Separate every sample in the probe first.' };
        const wrong = SEALED.filter(s => whereIs(t, s.id) !== s.tray);
        if (!wrong.length) return { ok: true };
        const s = wrong[0];
        const why = s.tray === 'hydrogen' ? 'forms hydrogen bonds in the probe' : s.tray === 'dipole' ? 'has permanent + and − ends' : 'is nonpolar and only has dispersion forces';
        return { ok: false, msg: `${s.id.toUpperCase()} is in "${t.zones.trays[whereIs(t, s.id)].label}", but it ${why}.` };
      },
      reward: {
        log: 'Every sample has dispersion; polar ones add dipole–dipole; H on N, O, or F adds hydrogen bonds.',
        title: 'Reading the Forces',
        body: 'Every molecule has dispersion forces. Polar molecules add dipole–dipole forces, and molecules with H on N, O, or F add hydrogen bonds, the strongest of the three.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 9 */
  (() => {
    const probe = probeFixture('probe', PROBE_AT);
    const DOMAINS = [
      { id: 'dna', label: 'DNA base pairs (N–H···O, N–H···N)', tray: 'hbond' },
      { id: 'shell', label: 'Polar protein surface (–OH, –NH₂)', tray: 'hbond' },
      { id: 'core', label: 'Nonpolar protein core (–CH₃, –CH₂–)', tray: 'hydrophobic' }
    ];
    const tray = (id, label, x) => ({ id, label, at: { x, y: 24 }, size: { w: 42, h: 34 }, cell: 40, cellH: 13 });
    return {
      id: 's9-biomolecules',
      title: 'Attractions in Biomolecules',
      briefing: {
        speaker: SPEAKER,
        body: 'Large biological molecules like DNA and proteins use these same attractions. Compare water and hexane in the probe, then sort the three regions.'
      },
      prompt: 'Which attraction holds each biological molecule region together?',
      widget,
      table: matterTable({
        bounds: { w: 170, h: 86 },
        pieces: [
          molCard('h2o', 'H2O', 'Known: Water', { x: 18, y: 56 }, { dipoles: true }),
          molCard('hex', 'hexane', 'Known: Hexane', { x: 42, y: 56 }, { dipoles: true }),
          note(DOMAINS[0].id, DOMAINS[0].label, { x: 86, y: 56 }, { w: 36 }),
          note(DOMAINS[1].id, DOMAINS[1].label, { x: 134, y: 56 }, { w: 36 }),
          note(DOMAINS[2].id, DOMAINS[2].label, { x: 110, y: 74 }, { w: 36 })
        ],
        fixtures: [probe.fixture],
        zones: {
          slots: [probe.slot],
          trays: [
            tray('hbond', 'Hydrogen bonding', 92),
            tray('hydrophobic', 'Dispersion (water-avoiding)', 142)
          ]
        }
      }),
      hints: [
        'Test water and hexane in the probe to compare polar and nonpolar attractions, then sort the three region cards.',
        'Check the atoms in each card: N–H and O–H groups form hydrogen bonds, while –CH₃ and –CH₂– chains are nonpolar.',
        'Nonpolar hydrocarbon chains avoid water and cluster inside a protein core by dispersion.'
      ],
      check(state) {
        const t = state.table;
        if (DOMAINS.some(d => !t.zones.trays[whereIs(t, d.id)])) {
          return { ok: false, notYet: true, msg: 'Sort all three region cards into trays.' };
        }
        const wrong = DOMAINS.find(d => whereIs(t, d.id) !== d.tray);
        if (!wrong) return { ok: true };
        return { ok: false, msg: `"${wrong.label}" is in "${t.zones.trays[whereIs(t, wrong.id)].label}", which does not match its atom groups.` };
      },
      reward: {
        log: 'Polar groups and DNA base pairs form hydrogen bonds; nonpolar chains cluster by dispersion.',
        title: 'Biomolecule Interactions',
        body: 'DNA base pairs and polar protein surfaces use hydrogen bonds (N–H···O, N–H···N, O–H), while nonpolar –CH₂– and –CH₃ groups fold inward by dispersion forces.'
      }
    };
  })()
];


/* ------------------------------------------------------------------
   THE DEBRIEF
   ------------------------------------------------------------------ */
export const DEBRIEF = {
  speaker: SPEAKER,
  sections: [
    {
      heading: 'What You Found',
      body: 'Molecules attract neighbors through dispersion forces, dipole–dipole forces, and hydrogen bonds, while ions attract water through ion–dipole forces. Every intermolecular attraction is far weaker than the covalent bonds inside a molecule.'
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
  [...pullAll(['hcl', 'kr']), put('polar', 'slot:why')],
  [put('lighter', 'slot:guess')],
  [...pullAll(low(HYDRIDES)), put('h2o', 'tray:hbond'), put('nh3', 'tray:hbond'), put('h2s', 'tray:none'), put('ph3', 'tray:none')],
  [...pullAll(IONS.map(ionId)), ...rail(IONS_BY_OUT.map(ionId))],
  [...pullAll(['c5h12', 'neoc5']), put('pent', 'slot:ans')],
  [put('h2o', WELL), { run: 'probe' }, dial('crank', 'pull', 7), put('twenty', 'slot:cmp')],
  [...SEALED.flatMap(s => [put(s.id, WELL), { run: 'probe' }, put(s.id, `tray:${s.tray}`)])],
  [put('h2o', WELL), { run: 'probe' }, put('dna', 'tray:hbond'), put('shell', 'tray:hbond'), put('core', 'tray:hydrophobic')]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [...pullAll(low(NOBLE)), ...rail(low([...NOBLE_BY_GRIP].reverse()))],
  [...pullAll(['hcl', 'kr']), put('heavier', 'slot:why')],
  [],
  [...pullAll(low(HYDRIDES)), put('h2o', 'tray:hbond'), put('nh3', 'tray:none'), put('h2s', 'tray:none'), put('ph3', 'tray:none')],
  [...pullAll(IONS.map(ionId)), ...rail(['lip', 'nap', 'kp', 'mg2p'])],
  [...pullAll(['c5h12', 'neoc5']), put('neo', 'slot:ans')],
  [put('h2o', WELL), { run: 'probe' }, put('twice', 'slot:cmp')],
  [...SEALED.flatMap(s => [put(s.id, WELL), { run: 'probe' }, put(s.id, s.id === 'x4' ? 'tray:dipole' : `tray:${s.tray}`)])],
  [put('dna', 'tray:hbond'), put('shell', 'tray:hydrophobic'), put('core', 'tray:hydrophobic')]
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
    onLoad() { /* the table is the stage */ }
  });
  runner.start();
  return { dispose: () => runner.dispose() };
}

/* Exported for `verify:learn`, which holds every graded figure to the real tables. */
export const CHECKS = { NOBLE_BY_GRIP, POLAR_BY_GRIP, HYDRIDES_BY_GRIP, IONS_BY_OUT, SHAPES_BY_GRIP, BOND_VS_GRIP, OH, SEALED };
export { probeRead };
