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
  matterTable, molCard, ionCard, probeFixture, wellFixture, probeRead, whereIs, note, stmt, fixed, mleadFixture
} from '../../table/kits/matter.js';
import { SUBSTANCES, HYDRATION } from '../../engine/matterdata.js';
import { BOND_ENTHALPIES } from '../../engine/thermodata.js';

export const meta = { stageCount: 8 };


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
  return { ok: false, msg: `${name(a.id)} sits left of ${name(b.id)}, and the probe read ${kj(heldReading(a))} ${unitText} for the one and ${kj(heldReading(b))} ${unitText} for the other.` };
}

function railCheck(want, minCards = want.length, required = null) {
  return state => {
    const t = state.table;
    const order = t.zones.rail.order;
    if (order.length < minCards) return { ok: false, notYet: true, msg: `Put all ${minCards} cards on the rail.` };
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
    const probe = probeFixture('probe', PROBE_AT, { accepts: ['he', 'ne'] });
    const at = row(4);
    const cards = NOBLE.map((id, i) => molCard(id.toLowerCase(), id, id, at[i], { cloud: true }));
    return {
      id: 's1-noble',
      title: 'Four Atoms',
      briefing: {
        speaker: SPEAKER,
        body: 'The electrons in an atom\'s cloud are always moving, so for an instant one side is slightly negative and the other slightly positive. That brief uneven charge attracts the atom next to it: a London dispersion force.'
      },
      prompt: 'Which of the four atoms attracts its neighbours most weakly and which most strongly?',
      widget,
      table: rankTable(cards, probe, ['Ar', 'He', 'Xe', 'Ne'].map(s => s.toLowerCase())),
      hints: [
        'Test helium and neon in the probe, then order all four cards on the rail.',
        'Compare the electron cloud drawn on each card with how much heat helium and neon needed.',
        'A larger electron cloud is pulled out of shape more easily, making a stronger dispersion force.'
      ],
      check: railCheck(NOBLE_BY_GRIP.map(s => s.toLowerCase()), 4, ['he', 'ne']),
      reward: {
        log: 'Bigger clouds needed more heat to separate.',
        title: 'London Dispersion Forces',
        body: 'A bigger cloud is pulled out of shape more easily: it is more polarizable, so its dispersion forces are stronger.'
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
      stmt('polar', 'It has a permanent + end and − end', { x: 85, y: 11 }),
      stmt('cloud', 'It has the bigger electron cloud', { x: 85, y: 31 }),
      stmt('heavier', 'It is the heavier molecule', { x: 128, y: 21 })
    ];
    return {
      id: 's2-dipole',
      title: 'A Polar Molecule',
      briefing: {
        speaker: SPEAKER,
        body: 'A polar molecule has a permanent positive end and negative end, called a dipole. When two polar molecules meet, opposite ends attract: a dipole–dipole force.'
      },
      prompt: 'Why does hydrogen chloride attract its neighbours more strongly than krypton?',
      widget,
      table: matterTable({
        pieces: [...cards, ...reasons],
        fixtures: [probe.fixture],
        zones: { slots: [probe.slot, { id: 'why', label: 'Reason', at: { x: 128, y: 51 }, size: { w: 36, h: 14 } }] }
      }),
      hints: [
        'Separate hydrogen chloride and krypton in the probe, then lay one reason card in the slot.',
        'Compare the masses on the cards and what the probe window shows for hydrogen chloride.',
        'Krypton has more mass and a larger cloud, so look at what else hydrogen chloride has.'
      ],
      check(state) {
        const t = state.table;
        const card = reasons.find(c => t.pieces[c.id].zone === 'slot:why');
        if (!card) return { ok: false, notYet: true, msg: 'Lay a reason card in the slot.' };
        if (t.pieces.hcl.props.grip == null || t.pieces.kr.props.grip == null) {
          return { ok: false, msg: 'Separate both HCl and Kr in the probe first.' };
        }
        if (card.id === 'polar') return { ok: true };
        if (card.id === 'heavier') return { ok: false, msg: 'Krypton is 83.8 g/mol and hydrogen chloride is 36.5 g/mol, yet HCl needed more heat.' };
        return { ok: false, msg: 'Krypton is the larger atom, yet hydrogen chloride needed more heat.' };
      },
      reward: {
        log: 'Hydrogen chloride beat krypton, which is much heavier.',
        title: 'Dipole–Dipole Forces',
        body: 'A polar molecule attracts through its permanent + and − ends as well as dispersion. These dipole–dipole forces let light HCl beat heavier Kr.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 3 */
  {
    id: 's3-predict',
    title: 'Which Attracts More?',
    // A PREDICT STAGE: the probe is not on the table yet. The guess is made first, here, and comes back with the test.
    predict: true,
    prompt: 'Which needs more heat to separate a mole: water, at 18 g, or hydrogen sulfide, at 34 g?',
    widget,
    table: matterTable({
      pieces: [
        note('heavier', 'Hydrogen sulfide, because it is the heavier molecule', { x: 30, y: 14 }),
        note('lighter', 'Water, because it is the lighter molecule', { x: 78, y: 14 }),
        note('same', 'About the same heat', { x: 30, y: 34 })
      ],
      fixtures: [mleadFixture('lead', { x: 117, y: 52 }, { scene: 'pull', w: 44, h: 24 })],
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 124, y: 24 }, size: { w: 36, h: 14 } }] }
    }),
    hints: [
      'Lay one of the three cards in the slot.',
      'Think of what the last two stages showed about cloud size and permanent dipoles.',
      'Commit to which molecule you expect to need more heat to separate.'
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
      body: 'Next, separate water, hydrogen sulfide and two more molecules with the probe.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  (() => {
    const probe = probeFixture('probe', PROBE_AT);
    const at = row(4, 53, 16, 23);
    const cards = HYDRIDES.map((id, i) => molCard(id.toLowerCase(), id, SUBSTANCES[id].formula, at[i], { dipoles: true, shown: mass(id) }));
    const want = { h2o: 'hbond', nh3: 'hbond', h2s: 'none', ph3: 'none' };
    const tray = (id, label, x) => ({ id, label, at: { x, y: 24 }, size: { w: 36, h: 32 }, cell: 22, cellH: 15 });
    return {
      id: 's4-hydrogen',
      title: 'Four Hydrides',
      briefing: {
        speaker: SPEAKER,
        body: 'A hydrogen atom bonded to nitrogen, oxygen or fluorine is strongly attracted to a lone pair on a neighbouring molecule. This attraction is a hydrogen bond.'
      },
      get prompt() {
        const guess = recall(QUEST_KEY);
        return guess && GUESS_LABEL[guess]
          ? `You guessed ${GUESS_LABEL[guess]}: which of these molecules form hydrogen bonds with their own kind?`
          : 'Which of these molecules form hydrogen bonds with their own kind?';
      },
      widget,
      table: matterTable({
        pieces: cards,
        fixtures: [probe.fixture],
        zones: { slots: [probe.slot], trays: [tray('hbond', 'Forms hydrogen bonds', 88), tray('none', 'Does not', 128)] }
      }),
      hints: [
        'Separate each molecule in the probe, then drag each card into a tray.',
        'Compare the heat to separate each molecule with its molar mass, and watch for dashed lines in the probe.',
        'Check which molecules have hydrogen bonded to nitrogen, oxygen or fluorine.'
      ],
      check(state) {
        const t = state.table;
        const ids = Object.keys(want);
        if (ids.some(id => !t.zones.trays[whereIs(t, id)])) return { ok: false, notYet: true, msg: 'Put all four molecules in a tray.' };
        const bad = ids.find(id => whereIs(t, id) !== want[id]);
        if (!bad) return { ok: true };
        return { ok: false, msg: 'H₂O (40.7 kJ) and NH₃ (23.4 kJ) need far more heat to separate than H₂S (18.7 kJ) and PH₃ (14.6 kJ).' };
      },
      get reward() {
        const guess = recall(QUEST_KEY);
        const verdict = guess === 'lighter' ? 'You expected water to attract more strongly, and the probe agreed. '
          : guess && GUESS_LABEL[guess] ? 'The probe disagreed with your prediction. ' : '';
        return {
          log: 'Water and ammonia needed far more heat than their mass says.',
          title: 'Hydrogen Bonding',
          body: `${verdict}Water and ammonia do, and need far more heat to separate than heavier H₂S and PH₃. A hydrogen bond is the strongest attraction between neutral molecules.`
        };
      }
    };
  })(),

  /* ---------------------------------------------------------------- 5 */
  (() => {
    const probe = probeFixture('probe', PROBE_AT, { mode: 'ion', title: 'Probe: ion in water', accepts: ['nap'] });
    const at = row(4);
    const cards = IONS.map((id, i) => ionCard(id.toLowerCase().replace('+', 'p'), id, HYDRATION[id].symbol, HYDRATION[id].r, at[i]));
    return {
      id: 's5-ion',
      title: 'Ions in Water',
      briefing: {
        speaker: SPEAKER,
        body: 'Water molecules are polar, so an ion attracts the oppositely charged end of each: an ion–dipole force.'
      },
      prompt: 'Which ion gives out the least heat when it enters water and which the most?',
      widget,
      table: matterTable({
        pieces: cards,
        fixtures: [probe.fixture],
        zones: { slots: [probe.slot], rail: { ...RAIL, first: 'Gives out least heat', last: 'Gives out most heat', items: cards.map(c => c.id), start: ['lip', 'mg2p', 'kp', 'nap'] } }
      }),
      hints: [
        'Test Na⁺ in the probe, then order all four ions on the rail.',
        'Compare the width and charge of each ion with Na⁺.',
        'A smaller ion or one with a larger charge lets water get closer and attracts it more strongly.'
      ],
      check: railCheck(IONS_BY_OUT.map(id => id.toLowerCase().replace('+', 'p')), 4, ['nap']),
      reward: {
        log: 'Small, highly charged ions gave out the most heat.',
        title: 'Ion–Dipole Forces',
        body: 'The smaller the ion and the larger its charge, the closer the water can come and the more heat is given out.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 6 */
  (() => {
    const probe = probeFixture('probe', PROBE_AT, { accepts: ['c4h10', 'c5h12'] });
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
      prompt: 'Which needs more heat to separate a mole: n-pentane or neopentane, both C₅H₁₂?',
      widget,
      table: matterTable({
        pieces: [...cards, ...choices],
        fixtures: [probe.fixture],
        zones: { slots: [probe.slot, { id: 'ans', label: 'Needs more heat', at: { x: 128, y: 51 }, size: { w: 36, h: 14 } }] }
      }),
      hints: [
        'Separate butane and n-pentane in the probe, then lay one answer card in the slot.',
        'Compare the straight chain of n-pentane with the compact shape of neopentane.',
        'A longer chain touches its neighbours over more of its surface than a compact ball.'
      ],
      check(state) {
        const t = state.table;
        const card = choices.find(c => t.pieces[c.id].zone === 'slot:ans');
        if (!card) return { ok: false, notYet: true, msg: 'Lay an answer card in the slot.' };
        if (t.pieces.c4h10.props.grip == null || t.pieces.c5h12.props.grip == null) {
          return { ok: false, msg: 'Separate butane and n-pentane in the probe first.' };
        }
        if (card.id === 'pent') return { ok: true };
        return { ok: false, msg: 'Butane needed 22.4 kJ and n-pentane 25.8 kJ; neopentane cannot lie flat along its neighbour like n-pentane.' };
      },
      reward: {
        log: 'The straight chain needed more heat than its compact twin.',
        title: 'Shape and Contact',
        body: 'Two molecules with one formula can attract each other differently. A straight chain lies along its neighbours and touches them over its whole length, so it has more dispersion force than a compact molecule of the same formula.'
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
      prompt: 'How does the heat to break the O–H bonds in a mole of water compare with the heat to separate its molecules?',
      widget,
      table: matterTable({
        pieces: [molCard('h2o', 'H2O', 'H₂O', { x: 132, y: 12 }, { dipoles: true }), ...choices],
        fixtures: [crank, probe.fixture],
        zones: { slots: [probe.slot, { id: 'cmp', label: 'Comparison', at: { x: 132, y: 31 }, size: { w: 32, h: 13 } }] }
      }),
      hints: [
        'Turn the bond pull dial for one O–H bond, separate water in the probe, then lay a card in the slot.',
        'Compare the dial reading for a mole of O–H bonds with the probe reading for water, and count the O–H bonds in H₂O.',
        'Each water molecule has two O–H bonds, so double the dial reading before comparing it with the probe.'
      ],
      check(state) {
        const t = state.table;
        const card = choices.find(c => t.pieces[c.id].zone === 'slot:cmp');
        if (!card) return { ok: false, notYet: true, msg: 'Lay a comparison card in the slot.' };
        const r = probeRead(t, 'probe');
        if (!r.pulled) return { ok: false, msg: 'Separate water in the probe first.' };
        if (card.id === 'twenty') return { ok: true };
        return { ok: false, msg: `One mole of O–H bonds takes ${Math.round(OH)} kJ, and separating a mole of water takes ${kj(r.value)} kJ.` };
      },
      reward: {
        log: 'Breaking the bonds in water costs over twenty times more than separating the molecules.',
        title: 'An Attraction Is Not a Bond',
        body: 'Breaking the bonds inside water molecules costs over twenty times as much as separating them. When water boils, the molecules stay whole.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 8 */
  (() => {
    const probe = probeFixture('probe', PROBE_AT);
    const at = row(5, 62, 24, 22);
    const cards = SEALED.map((s, i) => molCard(s.id, s.sub, s.id.toUpperCase(), at[i], { dipoles: true, cloud: SUBSTANCES[s.sub].r != null }));
    const tray = (id, label, x) => ({ id, label, at: { x, y: 30 }, size: { w: 26, h: 40 }, cell: 22, cellH: 18.5 });
    return {
      id: 's8-sealed',
      title: 'Five Sealed Samples',
      prompt: 'What is the strongest force between the molecules of each sample?',
      widget,
      table: matterTable({
        bounds: { w: 150, h: 72 },
        pieces: cards,
        fixtures: [probe.fixture],
        zones: { slots: [probe.slot], trays: [tray('dispersion', 'Dispersion', 78), tray('dipole', 'Dipole–dipole', 106), tray('hydrogen', 'Hydrogen bond', 134)] }
      }),
      hints: [
        'Separate each sample in the probe, then drag it into a tray.',
        'Watch what appears between the molecules in the probe and compare the heat readings.',
        'Look for + and − marks, and for a hydrogen bonded to nitrogen, oxygen or fluorine.'
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
  1: ['Test He and Ne in the probe, then order all four cards on the rail.'],
  2: ['Test HCl and Kr, then lay a reason.'],
  3: ['Drag the card you choose into the slot.'],
  4: ['Separate each molecule, then file it.'],
  5: ['Test Na⁺ in the probe, then order all four ions on the rail.'],
  6: ['Test butane and n-pentane, then lay your answer.']
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
      body: 'Molecules attract their neighbours through dispersion forces, dipole–dipole forces and hydrogen bonds, and ions attract water through ion–dipole forces. Each is far weaker than a bond inside a molecule.'
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
  [...pullAll(['he', 'ne']), ...rail(low(NOBLE_BY_GRIP))],
  [...pullAll(['hcl', 'kr']), put('polar', 'slot:why')],
  [put('lighter', 'slot:guess')],
  [...pullAll(low(HYDRIDES)), put('h2o', 'tray:hbond'), put('nh3', 'tray:hbond'), put('h2s', 'tray:none'), put('ph3', 'tray:none')],
  [...pullAll(['nap']), ...rail(IONS_BY_OUT.map(ionId))],
  [...pullAll(['c4h10', 'c5h12']), put('pent', 'slot:ans')],
  [put('h2o', WELL), { run: 'probe' }, dial('crank', 'pull', 7), put('twenty', 'slot:cmp')],
  [...SEALED.flatMap(s => [put(s.id, WELL), { run: 'probe' }, put(s.id, `tray:${s.tray}`)])]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [...pullAll(['he', 'ne']), ...rail(low([...NOBLE_BY_GRIP].reverse()))],
  [...pullAll(['hcl', 'kr']), put('heavier', 'slot:why')],
  [],
  [...pullAll(low(HYDRIDES)), put('h2o', 'tray:hbond'), put('nh3', 'tray:none'), put('h2s', 'tray:none'), put('ph3', 'tray:none')],
  [...pullAll(['nap']), ...rail(['lip', 'nap', 'kp', 'mg2p'])],
  [...pullAll(['c4h10', 'c5h12']), put('neo', 'slot:ans')],
  [put('h2o', WELL), { run: 'probe' }, put('twice', 'slot:cmp')],
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
    onLoad() { /* the table is the stage */ }
  });
  runner.start();
  return { dispose: () => runner.dispose() };
}

/* Exported for `verify:learn`, which holds every graded figure to the real tables. */
export const CHECKS = { NOBLE_BY_GRIP, POLAR_BY_GRIP, HYDRIDES_BY_GRIP, IONS_BY_OUT, SHAPES_BY_GRIP, BOND_VS_GRIP, OH, SEALED };
export { probeRead };
