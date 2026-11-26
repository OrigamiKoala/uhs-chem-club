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
import { thornTable, tbuildFixture, tmolFixture, molRead, ttestFixture, resultOf, tcard } from '../../table/kits/thorn.js';
import { alkaneH } from '../../engine/thorndata.js';
import '../../engine/thorn-scenes/q4-groups.js';
import '../../engine/thorn-scenes/q6-polymers.js';
import { markFights } from '../../table/near.js';

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
      briefing: { speaker: SPEAKER, body: 'Each plate is coated in wax, an alkane chain thirty carbons long. Count its hydrogens to identify the coating.' },
      prompt: 'How many hydrogen atoms does an alkane chain of thirty carbons hold?',
      entry: { id: 'h', label: 'Hydrogen atoms', unit: '' },
      widget,
      table: thornTable({ pieces: [], fixtures: [B] }),
      foes: FOE,
      encounter: { species: 'the carapace', act: 'Strip Wax', intent: 'The Carapace is coated in a thirty-carbon alkane wax.' },
      hints: [
        'Watch the formula under the board as you build short chains of two, three, and four carbons.',
        'Compare how many hydrogens each middle carbon holds with how many the two end carbons hold.',
        'Give every carbon two hydrogens, then add the two extra hydrogens on the ends.'
      ],
      check(state) {
        const v = entryNumber(state.table, 'h');
        if (!(v > 0)) return { ok: false, notYet: true, msg: 'Type the number of hydrogen atoms.' };
        if (v === alkaneH(30)) return { ok: true };
        if (v === 120) return { ok: false, msg: 'Look at the board: each carbon inside a chain holds two hydrogens, not four.' };
        if (v === 60) return { ok: false, msg: 'Look at the board: each end carbon holds one extra hydrogen compared with the middle carbons.' };
        if (v === 90) return { ok: false, msg: 'Look at the board: each carbon inside a chain holds two hydrogens, not three.' };
        return { ok: false, msg: `On the board, chains follow C₃H₈, C₄H₁₀, C₅H₁₂, so ${v} does not fit thirty carbons.` };
      },
      reward: { log: 'Phase 1: the wax is C₃₀H₆₂.', title: 'Wax Stripped', body: '62 hydrogens: two for each of the thirty carbons plus one extra at each end, C₃₀H₆₂.' }
    };
  })(),

  /* ---------------------------------------------------------------- 2: The Soft Seam */
  (() => {
    const T = ttestFixture('rig', { x: 88, y: 34 }, { test: 'bromine', w: 66, h: 44 });
    const JARS = { 'j-a': 'pentane', 'j-b': 'cyclopentane', 'j-c': 'pentene' };
    return {
      id: 'p2-seam',
      title: 'Phase 2 · The Soft Seam',
      prompt: 'Which seam sample still has a carbon–carbon double bond?',
      widget,
      table: thornTable({
        pieces: Object.entries(JARS).map(([id, sub], i) => tcard(id, sub, { x: 14, y: 10 + i * 14.5 }, { text: `${'ABC'[i]}: ${['C₅H₁₂', 'C₅H₁₀', 'C₅H₁₀'][i]}` })),
        fixtures: [T.fixture],
        zones: { slots: [T.slot, { id: 'ene', label: 'Double bond', at: { x: 22, y: 52 }, size: { w: 42, h: 14 } }] }
      }),
      foes: FOE,
      encounter: { species: 'the carapace', act: 'Open Seam', intent: 'The Carapace\'s seams are sealed with three hydrocarbon samples.' },
      hints: [
        'Test the samples in the bromine water rig and watch the jar and enlarged window.',
        'Two samples share the formula C₅H₁₀, so compare what each does to the orange bromine water.',
        'Having two fewer hydrogens than a full chain means either a ring or a double bond, and only a double bond reacts with bromine.'
      ],
      check(state) {
        const card = inSlot(state, 'ene');
        if (!card) return { ok: false, notYet: true, msg: 'Place a sample card in the slot.' };
        if (card.props.sub === 'pentene') return { ok: true };
        if (card.props.sub === 'pentane') return { ok: false, msg: 'C₅H₁₂ is a full five-carbon alkane chain with no room for a double bond.' };
        const seen = resultOf(state.table, card.id, 'bromine');
        return { ok: false, msg: seen ? 'That sample left the bromine water orange.' : 'Test that sample with bromine water first.' };
      },
      reward: { log: 'Phase 2: sample C is the alkene.', title: 'Seam Found', body: 'Sample C turned bromine water clear because it has a double bond. Sample B is a ring, so it left the bromine water orange.' }
    };
  })(),

  /* ---------------------------------------------------------------- 3: The Chiral Sample */
  (() => {
    const V = tmolFixture('mol', { x: 62, y: 33 }, { scene: 'bromobutane', mode: 'pick', pick: { kind: 'atom', among: ['m1', 'c2', 'c3', 'm4'] }, title: 'Sample: 2-bromobutane', w: 108, h: 50 });
    return {
      id: 'p3-filler',
      title: 'Phase 3 · The Chiral Sample',
      prompt: 'Which carbon atom makes 2-bromobutane chiral?',
      widget,
      table: thornTable({ pieces: [], fixtures: [V] }),
      foes: FOE,
      encounter: { species: 'the carapace', act: 'Identify Center', intent: 'The Carapace packs its joints with one mirror form of 2-bromobutane.' },
      hints: [
        'Check each carbon along the chain and see what groups are attached to it.',
        'List the four things bonded to each carbon and look for any repeats.',
        'A molecule is chiral when one carbon holds four different groups.'
      ],
      check(state) {
        const p = pickOf(state, 'mol');
        if (!p) return { ok: false, notYet: true, msg: 'Tap a carbon.' };
        if (p === 'c2') return { ok: true };
        if (p === 'c3') return { ok: false, msg: 'That carbon is bonded to two identical hydrogens.' };
        return { ok: false, msg: 'That carbon is bonded to three identical hydrogens.' };
      },
      reward: { log: 'Phase 3: carbon 2 is the stereocentre.', title: 'Stereocentre Found', body: 'Carbon 2 holds four different groups (H, Br, CH₃, and C₂H₅), making it the stereocentre that makes this molecule chiral.' }
    };
  })(),

  /* ---------------------------------------------------------------- 4: The Weak Point */
  (() => {
    const V = tmolFixture('mol', { x: 62, y: 33 }, { scene: 'amide', mode: 'pick', pick: { kind: 'atom', among: ['m1', 'c', 'o', 'n', 'm2'] }, pairs: true, title: 'One link of the armor', w: 108, h: 50 });
    return {
      id: 'p4-weak',
      title: 'Phase 4 · The Weak Point',
      prompt: 'Which atom in this amide link is the electron-poor site?',
      widget,
      table: thornTable({ pieces: [], fixtures: [V] }),
      foes: FOE,
      encounter: { species: 'the carapace', act: 'Find Weakness', intent: 'The Carapace\'s plates are held together by amide links.' },
      hints: [
        'Look at where the shared electron pairs sit along the C=O and C–N bonds.',
        'Check which atom has its shared electron pairs pulled away from it.',
        'The electron-poor atom is the one whose shared pairs sit farthest away.'
      ],
      check(state) {
        const p = pickOf(state, 'mol');
        if (!p) return { ok: false, notYet: true, msg: 'Tap an atom.' };
        if (p === 'c') return { ok: true };
        if (p === 'o') return { ok: false, msg: 'Both C=O pairs sit close to oxygen, making it electron-rich.' };
        if (p === 'n') return { ok: false, msg: 'Nitrogen pulls shared electrons toward itself and carries a lone pair.' };
        return { ok: false, msg: 'Carbon and carbon share electrons evenly between them.' };
      },
      reward: { log: 'Phase 4: the C=O carbon is electron-poor.', title: 'Weak Point Found', body: 'The C=O carbon: both oxygen and nitrogen pull shared electrons away from it, making it the target for hydroxide.' }
    };
  })(),

  /* ---------------------------------------------------------------- 5: Opening the Gate */
  (() => {
    const V = tmolFixture('mol', { x: 66, y: 33 }, { scene: 'polyamide', mode: 'pick', pick: { kind: 'bond', among: [['r1', 'c1'], ['c1', 'o1'], ['c1', 'n1'], ['n1', 'h1'], ['n1', 'p1']] }, pairs: true, title: 'A stretch of the armor', w: 120, h: 50 });
    return {
      id: 'p5-gate',
      title: 'Phase 5 · Opening the Gate',
      prompt: 'Which bond in the armor\'s chain does a hydroxide ion break?',
      widget,
      table: thornTable({ pieces: [], fixtures: [V] }),
      foes: FOE,
      encounter: { species: 'the carapace', act: 'Cut Links', intent: 'The Carapace\'s armor is one long chain joined where water once left.' },
      hints: [
        'Look along the chain for the C=O groups and the C–N bonds right beside them.',
        'Find the amide links where monomers joined by releasing water.',
        'Hydroxide moves to the electron-poor C=O carbon and breaks the C–N link right beside it.'
      ],
      check(state) {
        const p = pickOf(state, 'mol');
        if (!p) return { ok: false, notYet: true, msg: 'Tap a bond.' };
        const [a, b] = p;
        if (a === 'c1' && b === 'n1') return { ok: true };
        if (b === 'o1') return { ok: false, msg: 'That double-bond pair only shifts onto oxygen, leaving the chain intact.' };
        if (a === 'n1') return { ok: false, msg: 'Nitrogen is not electron-poor, so hydroxide does not move there.' };
        return { ok: false, msg: 'That bond sits inside a monomer, not at the link between two monomers.' };
      },
      reward: { log: 'Phase 5: the amide links are cut.', title: 'Armor Unlinked', body: 'The C–N bond of each amide link, next to C=O. Hydrolysis broke the armor where condensation built it, revealing heavy lead plates underneath.' }
    };
  })()
];


export const DEBRIEF = {
  speaker: SPEAKER,
  sections: [{ heading: 'The Carapace Is Down', body: 'You used every Thornmere concept on the wax, seams, chiral filler, and weak links, then broke the armor apart at its amide links with hydroxide.' }]
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

markFights(STAGES);
