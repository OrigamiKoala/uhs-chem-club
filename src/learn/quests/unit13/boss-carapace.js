/**
 * Unit 13 · Boss — The Carapace (boss-carapace)
 *
 * The crawler of linked polymer plates that holds the Fifth's gate on Thornmere's highest mound, on the thorn kit. Five phases, each a new
 * case of an idea a bench already taught, never a new one: a chain's hydrogens (bench 1), the bromine test on two molecules of one formula
 * (bench 2), the carbon that makes a molecule chiral (bench 3), the electron-poor atom of a group (bench 4), and the link hydroxide cuts
 * (benches 5 and 6). The Carapace watches from the top-right corner of the table (x ≥ 126.5, y ≤ 23.5), which nothing on the table uses.
 * Clearing the last phase files `clue_thornmere_carapace`. Pays no XP.
 */

import { createRunner, stateFromScript, entryNumber } from '../../engine/stagerunner.js';
import { applyNotes } from '../../table/notes.js';
import { thornTable, tbuildFixture, tmolFixture, molRead, ttestFixture, resultOf, tcard } from '../../table/kits/thorn.js';
import { alkaneH } from '../../engine/thorndata.js';
import '../../engine/thorn-scenes/q4-groups.js';
import '../../engine/thorn-scenes/q6-polymers.js';

export const meta = { stageCount: 5 };

export const BUILDS_ON = ['unit13/q1-chains', 'unit13/q2-unsat', 'unit13/q3-isomers', 'unit13/q4-groups', 'unit13/q5-reactions', 'unit13/q6-polymers'];

export const CLUE_ID = 'clue_thornmere_carapace';
const SPEAKER = 'Vess';
const FOE = [{ id: 'carapace', label: 'The Carapace' }];
const widget = { type: 'table', label: 'The bench' };

export function toolNoteFor() { return null; }

const inSlot = (state, slot) => Object.values(state.table.pieces).find(p => p.zone === `slot:${slot}`) || null;
const pickOf = (state, id) => molRead(state.table, id).picked;

export const WAX_SLIPS = [120, 60, 90, 61];

export const STAGES = [
  /* ---------------------------------------------------------------- 1: The Wax Layer */
  (() => {
    const B = tbuildFixture('board', { x: 62, y: 33 }, { cols: 6, rows: 1, auto: true, formula: true, maxOrder: 1, title: 'Model board', w: 112, h: 44 });
    return {
      id: 'p1-wax',
      title: 'Phase 1 · The Wax Layer',
      briefing: { speaker: SPEAKER, body: 'The outer skin of each plate is a wax: an alkane chain thirty carbons long. Its hydrogens tell us how much of it there is to burn off.' },
      prompt: 'How many hydrogen atoms does an alkane chain of thirty carbons hold?',
      entry: { id: 'h', label: 'Hydrogen atoms', unit: '' },
      widget,
      table: thornTable({ pieces: [], fixtures: [B] }),
      foes: FOE,
      encounter: { species: 'the carapace', act: 'Strip Wax', intent: 'The Carapace wears a skin of wax, an alkane chain thirty carbons long.' },
      hints: [
        'Build short chains on the board and read the formula under it.',
        'Compare how many hydrogens each added carbon brings, and what the two end carbons hold.',
        'Give every carbon its two hydrogens, then add the end carbons\' extra ones.'
      ],
      check(state) {
        const v = entryNumber(state.table, 'h');
        if (!(v > 0)) return { ok: false, notYet: true, msg: 'Type the number of hydrogen atoms.' };
        if (v === alkaneH(30)) return { ok: true };
        if (v === 120) return { ok: false, msg: 'On the board a carbon inside a chain holds two hydrogens, not four.' };
        if (v === 60) return { ok: false, msg: 'On the board the two end carbons each hold one hydrogen more than the rest.' };
        if (v === 90) return { ok: false, msg: 'On the board a carbon inside a chain holds two hydrogens, not three.' };
        return { ok: false, msg: `Chains on the board go C₃H₈, C₄H₁₀, C₅H₁₂; ${v} is not that pattern for thirty carbons.` };
      },
      reward: { log: 'Phase 1: the wax is C₃₀H₆₂.', title: 'Wax Stripped', body: 'Sixty-two: two for each of the thirty carbons and one more at each end, C₃₀H₆₂.' }
    };
  })(),

  /* ---------------------------------------------------------------- 2: The Soft Seam */
  (() => {
    const T = ttestFixture('rig', { x: 88, y: 34 }, { test: 'bromine', w: 66, h: 44 });
    const JARS = { 'j-a': 'pentane', 'j-b': 'cyclopentane', 'j-c': 'pentene' };
    return {
      id: 'p2-seam',
      title: 'Phase 2 · The Soft Seam',
      prompt: 'Which scraping from the seams between the plates still holds a carbon–carbon double bond?',
      widget,
      table: thornTable({
        pieces: Object.entries(JARS).map(([id, sub], i) => tcard(id, sub, { x: 14, y: 10 + i * 14.5 }, { text: `${'ABC'[i]}: ${['C₅H₁₂', 'C₅H₁₀', 'C₅H₁₀'][i]}` })),
        fixtures: [T.fixture],
        zones: { slots: [T.slot, { id: 'ene', label: 'Double bond', at: { x: 22, y: 52 }, size: { w: 34, h: 12 } }] }
      }),
      foes: FOE,
      encounter: { species: 'the carapace', act: 'Open Seam', intent: 'The Carapace\'s plates are sealed at the seams with three hydrocarbons.' },
      hints: [
        'Lay a scraping\'s card in the Sample slot and press "Add Bromine Water".',
        'Two scrapings share one formula: compare what each does to the bromine water.',
        'Two hydrogens short of a full chain can mean a ring or a double bond, and only one gives bromine a pair to reach.'
      ],
      check(state) {
        const card = inSlot(state, 'ene');
        if (!card) return { ok: false, notYet: true, msg: 'Lay a scraping\'s card in the slot.' };
        if (card.props.sub === 'pentene') return { ok: true };
        if (card.props.sub === 'pentane') return { ok: false, msg: 'C₅H₁₂ is a chain of five carbons holding every hydrogen it can.' };
        const seen = resultOf(state.table, card.id, 'bromine');
        return { ok: false, msg: seen ? 'That scraping left the bromine water orange.' : 'That scraping has not been tested with bromine water.' };
      },
      reward: { log: 'Phase 2: scraping C is the alkene.', title: 'Seam Found', body: 'Scraping C took the colour out of bromine water: a double bond, where the seam can be opened. B is a ring and left it orange.' }
    };
  })(),

  /* ---------------------------------------------------------------- 3: The Twisted Filler */
  (() => {
    const V = tmolFixture('mol', { x: 62, y: 33 }, { scene: 'bromobutane', mode: 'pick', pick: { kind: 'atom', among: ['m1', 'c2', 'c3', 'm4'] }, title: 'The filler: 2-bromobutane', w: 108, h: 50 });
    return {
      id: 'p3-filler',
      title: 'Phase 3 · The Twisted Filler',
      prompt: 'Which carbon atom makes the filler molecule, 2-bromobutane, chiral?',
      widget,
      table: thornTable({ pieces: [], fixtures: [V] }),
      foes: FOE,
      encounter: { species: 'the carapace', act: 'Untwist', intent: 'The Carapace packs its joints with a filler of one mirror form only.' },
      hints: [
        'Tap a carbon or a carbon group to choose it.',
        'For each carbon, list the four things bonded to it.',
        'A molecule is chiral where one carbon holds four different groups.'
      ],
      check(state) {
        const p = pickOf(state, 'mol');
        if (!p) return { ok: false, notYet: true, msg: 'Tap a carbon.' };
        if (p === 'c2') return { ok: true };
        if (p === 'c3') return { ok: false, msg: 'That carbon holds two hydrogens.' };
        return { ok: false, msg: 'That carbon holds three hydrogens.' };
      },
      reward: { log: 'Phase 3: carbon 2 is the stereocentre.', title: 'Filler Untwisted', body: 'Carbon 2 holds H, Br, CH₃ and C₂H₅, four different groups: it is the stereocentre, and the filler is chiral.' }
    };
  })(),

  /* ---------------------------------------------------------------- 4: The Weak Point */
  (() => {
    const V = tmolFixture('mol', { x: 62, y: 33 }, { scene: 'amide', mode: 'pick', pick: { kind: 'atom', among: ['m1', 'c', 'o', 'n', 'm2'] }, pairs: true, title: 'One link of the armour', w: 108, h: 50 });
    return {
      id: 'p4-weak',
      title: 'Phase 4 · The Weak Point',
      prompt: 'Which atom of this link in the armour is the electron-poor site?',
      widget,
      table: thornTable({ pieces: [], fixtures: [V] }),
      foes: FOE,
      encounter: { species: 'the carapace', act: 'Find Weakness', intent: 'The Carapace\'s plates are joined by links of carbon, oxygen and nitrogen.' },
      hints: [
        'Tap an atom to choose it.',
        'Look at where each shared pair sits along its bond, and which atom the pairs have moved away from.',
        'The electron-poor atom is the one whose shared pairs sit farthest from it.'
      ],
      check(state) {
        const p = pickOf(state, 'mol');
        if (!p) return { ok: false, notYet: true, msg: 'Tap an atom.' };
        if (p === 'c') return { ok: true };
        if (p === 'o') return { ok: false, msg: 'Both pairs of the C=O bond sit nearer that oxygen.' };
        if (p === 'n') return { ok: false, msg: 'The pairs nitrogen shares sit nearer the nitrogen, and it holds a lone pair.' };
        return { ok: false, msg: 'The pair that CH₃ group shares sits close to midway.' };
      },
      reward: { log: 'Phase 4: the C=O carbon is electron-poor.', title: 'Weak Point Found', body: 'The carbon of C=O: its pairs with oxygen, and its pair with nitrogen, all sit away from it. That is where hydroxide\'s pair will go.' }
    };
  })(),

  /* ---------------------------------------------------------------- 5: Opening the Gate */
  (() => {
    const V = tmolFixture('mol', { x: 66, y: 33 }, { scene: 'polyamide', mode: 'pick', pick: { kind: 'bond', among: [['r1', 'c1'], ['c1', 'o1'], ['c1', 'n1'], ['n1', 'h1'], ['n1', 'p1']] }, pairs: true, title: 'A stretch of the armour', w: 120, h: 50 });
    return {
      id: 'p5-gate',
      title: 'Phase 5 · Opening the Gate',
      prompt: 'Which bond of the armour\'s chain does a hydroxide ion break?',
      widget,
      table: thornTable({ pieces: [], fixtures: [V] }),
      foes: FOE,
      encounter: { species: 'the carapace', act: 'Cut Links', intent: 'The Carapace\'s armour is one chain, joined link to link where water once left.' },
      hints: [
        'Tap a bond of the chain to choose it.',
        'Find the links where two monomers were joined as water left.',
        'Hydroxide\'s pair goes to the electron-poor carbon, and the link beside it gives way.'
      ],
      check(state) {
        const p = pickOf(state, 'mol');
        if (!p) return { ok: false, notYet: true, msg: 'Tap a bond.' };
        const [a, b] = p;
        if (a === 'c1' && b === 'n1') return { ok: true };
        if (b === 'o1') return { ok: false, msg: 'That pair would move out onto its oxygen, and the chain would still be joined.' };
        if (a === 'n1') return { ok: false, msg: 'No pair moves to that nitrogen: it is not electron-poor.' };
        return { ok: false, msg: 'That bond lies inside one monomer, not at a link between two.' };
      },
      reward: { log: 'Phase 5: the amide links are cut.', title: 'Gate Open', body: 'The C–N bond of each amide link, beside C=O. Hydrolysis cut the armour where condensation had joined it, and the plates fell apart.' }
    };
  })()
];

const NOTES = {
  1: ['Tap a dashed ring to add a carbon; type your answer.'],
  2: ['Drag a card into the Sample slot to test it, then drag your answer into the slot.'],
  3: ['Tap a carbon to answer.'],
  4: ['Tap an atom to answer.'],
  5: ['Tap a bond to answer.']
};
applyNotes(STAGES, NOTES);

export const DEBRIEF = {
  speaker: SPEAKER,
  sections: [{ heading: 'The Carapace Is Down', body: 'Its wax, its seams, its filler and its links each answered to an idea you worked out on the benches; hydroxide cut the armour at its amide links.' }]
};

/* ---- scripts of the player's own actions ---- */
const put = (piece, to) => ({ place: { piece, to } });
const typed = (entry, value) => ({ type: { entry, value: String(value) } });
const pick = n => ({ setDial: { fixture: 'mol', dial: 'pick', value: n } });
const board = sites => sites.map(i => ({ setDial: { fixture: 'board', dial: `c${i}`, value: 1 } }));

export const SOLUTIONS = [
  [...board([0, 1, 2]), typed('h', 62)],
  [put('j-b', 'slot:rig.holder'), { run: 'rig' }, put('j-c', 'slot:rig.holder'), { run: 'rig' }, put('j-c', 'slot:ene')],
  [pick(2)],
  [pick(2)],
  [pick(3)]
];

export const MISSES = [
  [typed('h', 120)],
  [put('j-b', 'slot:rig.holder'), { run: 'rig' }, put('j-b', 'slot:ene')],
  [pick(3)],
  [pick(3)],
  [pick(2)]
];

function blankState() { return {}; }

export function stateFor(i, overrides) { return stateFromScript(STAGES[i], overrides); }

export function mount(container, ctx) {
  const runner = createRunner(container, ctx, { STAGES, DEBRIEF, blankState, toolNoteFor, onLoad() {} });
  runner.start();
  return { dispose: () => runner.dispose() };
}
