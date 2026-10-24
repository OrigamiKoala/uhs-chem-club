/**
 * q8-hybrid.js — Ligar, bench eight: HYBRID ORBITALS.
 *
 * The eighth bench on the world and its sixth TABLETOP (plan `bench-tabletop.md`, phase T3b). An atom's orbitals are pieces on the plate,
 * drawn with the electrons they hold. They are dropped in a MIXING BOWL, and what comes out is what went in: as many hybrid lobes as
 * orbitals mixed, pointing where that many arms settle, with the p orbitals left out standing over as they were. Or they are dropped
 * on each other, and overlap into a bond if the two point at each other and each holds a single electron. A last bench turns the far
 * end of a bond to find whether it will. (Lobes are spatial, so the reward cards stand them up as solids: `reward.model` `lobes`.)
 *
 * THE CLICK (2026-10-23 rollout). Students assume an atom bonds with its orbitals exactly as they were taught: carbon, with four
 * orbitals, takes four hydrogen atoms in one go. The quest asks for that prediction (the idea is a card), then bonds hydrogen atoms to
 * carbon's orbitals as they stand: only two take one, so the orbitals cannot stay as they are. The bowl then blends them into four
 * equal lobes, and two more benches use the blend: the second bond of ethene, and the turn of a single bond against a double one.
 *
 *   1  PREDICT: how many hydrogen atoms does carbon take as it stands?    (no instrument; the wrong idea is a card)
 *   2  bond hydrogen atoms to carbon's orbitals as they stand             -> orbitals as they stand fall short
 *   3  mix carbon's orbitals to one lobe for each bond in methane         -> hybrid orbital, sp3
 *   4  build the second bond between ethene's carbons                     -> sigma bond, pi bond
 *   5  turn the far end of ethane's bond and of ethene's                  -> restricted rotation
 *
 * Re-pitched and cut (2026-10-23): the sorts by the number of lobes (stage 3's card says "one lobe for every arm"), "counting bonds" in
 * hydrogen cyanide (stage 4 again, with more bonds), and "past four" (sp3d and sp3d2 on phosphorus and sulfur: beyond a first course).
 * Names such as sp2 and sp stay off the pieces until a card earns them; the lobes read "lobe".
 *
 * THE BOWL FOLLOWS ONE RULE, which the player finds: as many hybrid lobes as the hub has arms (`vsepr.planBlend`; `planMix` is the same
 * answer without d). Every overlap is the kit's planner (`kits/domain-orbitals.js`): two orbitals bond only if each holds one electron
 * and they point at each other, and a pair of p orbitals bonds only if they lie the same way. Every bond that stands is counted by
 * `bondsBuilt`.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import { applyNotes } from '../../table/notes.js';
import { planMix, planBlend, planTwist, planDomains, countSigmaPi, RIG_MOLECULES } from '../../engine/vsepr.js';
import {
  domainTable, orbital, mixbowl, twist, bowlRead, bondsBuilt, twistRead, molCard, molRead
} from '../../table/kits/domain.js';
import { predictStage, testPrompt, verdictLine } from './_ligar.js';

export const meta = { stageCount: 5 };

export const VOCABULARY = [
  { term: /\brestricted rotation\b/i, introducedAt: 5 },
  { term: /\bsigma\b|\bpi bonds?\b|\bpi\b/i, introducedAt: 4 },
  { term: /\bsp[3³](?!\w)/i, introducedAt: 3 },
  { term: /\bhybrid(?:s|i[sz]ation|i[sz]ed)?\b/i, introducedAt: 3 }
];

export const BUILDS_ON = ['unit03/q6-shape', 'unit03/q4-dots', 'unit02/q6-filling', 'unit02/q4-cloud'];

const SPEAKER = 'Vess';

/** The key the player's guess is kept under (`engine/predict.js`), and the cards it is chosen from. */
const QUEST_KEY = 'unit03/q8-hybrid';
const GUESSES = [
  ['four', 'carbon takes four hydrogen atoms', ['Four hydrogens', 'carbon has four', 'orbitals']],
  ['three', 'carbon takes three hydrogen atoms', ['Three hydrogens', 'the three p', 'orbitals bond']],
  ['two', 'carbon takes two hydrogen atoms', ['Two hydrogens', 'one for each', 'single electron']]
];

/** Every piece says what it is (an orbital with its electrons, a bowl, a dial named "Far End"), so no key needs a legend. */
export function toolNoteFor() { return null; }

/* ------------------------------------------------------------------
   THE TABLES
   ------------------------------------------------------------------ */

const plate = (id, label, at, size) => ({ id, kind: 'atomplate', label, at, size, noRun: true, dials: {}, props: { backdrop: true } });
const orb = (id, type, atom, at, o = {}) => orbital(id, type, atom, at, o);

/** The four orbitals of carbon's valence shell as the atom stands: a full s, two single p electrons and an empty p. */
const carbon = (atom, at, ids, o = {}) => [
  orb(ids[0], 's', atom, { x: at.x - 14, y: at.y - 10 }, { e: 2, label: 's' }),
  orb(ids[1], 'p', atom, { x: at.x + 14, y: at.y - 10 }, { e: 1, axis: 'x', label: 'px' }),
  orb(ids[2], 'p', atom, { x: at.x - 14, y: at.y + 12 }, { e: 1, axis: 'y', label: 'py' }),
  orb(ids[3], 'p', atom, { x: at.x + 14, y: at.y + 12 }, { e: o.pzE ?? 0, axis: 'z', label: 'pz' })
];

const RAIL_Y = 54;

/* ------------------------------------------------------------------
   THE FIVE STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  predictStage({
    key: QUEST_KEY,
    title: 'Carbon as It Stands',
    prompt: 'Carbon bonds to hydrogen through its four orbitals just as they stand: how many hydrogen atoms can it take?',
    cards: GUESSES,
    hints: [
      'Use the three cards and the slot.',
      'Recall which of carbon\'s orbitals hold a single electron, and which hold two or none.',
      'There is no wrong guess yet; commit to the card you would bet on.'
    ],
    reward: {
      title: 'A Guess Comes First',
      body: 'Your guess is locked in, and the next bench tests it. Drop hydrogen atoms on carbon\'s orbitals and see which take one.'
    }
  }),

  /* ---------------------------------------------------------------- 2 */
  {
    title: 'The Puzzle',
    get prompt() {
      return testPrompt(QUEST_KEY, GUESSES, 'bond hydrogen atoms to carbon through its orbitals as they stand, as many as they allow.');
    },
    widget: { type: 'table', label: 'The bench' },
    table: domainTable({
      pieces: [
        ...carbon('c', { x: 36, y: 32 }, ['cs', 'cpx', 'cpy', 'cpz']),
        ...[1, 2, 3, 4].map(i => orb(`h${i}`, 's', `h${i}`, { x: 98, y: 12 + (i - 1) * 14 }, { e: 1, label: 'H' })),
        molCard('ref', 'CH4', { x: 132, y: 30 }, { show: ['arms'] })
      ],
      fixtures: [plate('carbon', 'Carbon', { x: 36, y: 32 }, { w: 64, h: 56 })]
    }),
    hints: [
      'Use the hydrogen atoms and carbon\'s four orbitals.',
      'Compare the orbitals that take a hydrogen atom with the single electrons drawn in them, and with the four bonds the methane card shows.',
      'Drop a hydrogen atom on each of carbon\'s orbitals in turn and see which of them take it.'
    ],
    check(state) {
      const t = state.table;
      const mine = bondsBuilt(t).pairs.filter(p => p.a === 'c' || p.b === 'c').length;
      const room = Object.values(t.pieces).filter(p => p.kind === 'orb' && p.props.atom === 'c' && p.props.e === 1).length;
      if (!mine) return { ok: false, notYet: true, msg: 'Bond a hydrogen atom to one of the carbon\'s orbitals.' };
      if (mine >= room) return { ok: true };
      return { ok: false, msg: 'An orbital of the carbon that holds a single electron has no hydrogen atom on it.' };
    },
    get reward() {
      return {
        log: 'The orbitals as they stand fall short.',
        title: 'Orbitals as They Stand Fall Short',
        body: `${verdictLine(QUEST_KEY, 'two')}Carbon's two single electrons allow two bonds, but methane has four, all identical. So the orbitals cannot stay as they are when carbon bonds.`
      };
    }
  },

  /* ---------------------------------------------------------------- 3 */
  (() => {
    const mx = mixbowl('mx', { x: 50, y: 22 }, { hub: 'C' });
    return {
      title: 'Four Lobes',
      prompt: 'Mix carbon\'s orbitals to give it one lobe for each of the four bonds in methane.',
      widget: { type: 'table', label: 'The bench' },
      table: domainTable({
        pieces: [
          orb('os', 's', 'c', { x: 14, y: RAIL_Y }, { e: 2, label: 's' }), orb('opx', 'p', 'c', { x: 34, y: RAIL_Y }, { e: 1, axis: 'x', label: 'px' }),
          orb('opy', 'p', 'c', { x: 54, y: RAIL_Y }, { e: 1, axis: 'y', label: 'py' }), orb('opz', 'p', 'c', { x: 74, y: RAIL_Y }, { e: 0, axis: 'z', label: 'pz' }),
          molCard('ref', 'CH4', { x: 126, y: 24 }, { show: ['arms'] })
        ],
        zones: { containers: [mx.bowl] },
        fixtures: [mx.fixture]
      }),
      hints: [
        'Use the four orbitals and the mixing bowl.',
        'Compare the number of lobes that come out with the number of arms on the methane card.',
        'Drop the s orbital and some of the p orbitals in the bowl until there is one lobe for every arm.'
      ],
      check(state) {
        const r = bowlRead(state.table, 'mx');
        if (!r.held.length) return { ok: false, notYet: true, msg: 'Put some orbitals in the bowl.' };
        const want = molRead(state.table.pieces.ref).domains;
        if (r.lobes === want) return { ok: true };
        return { ok: false, msg: 'The lobes that come out are not as many as the arms on the methane card.' };
      },
      reward: {
        log: 'An s orbital and three p orbitals make four.',
        title: 'Hybrid Orbitals, sp³',
        body: 'Blending one s orbital with three p orbitals gives four identical hybrid orbitals, called sp³, pointing 109.5 degrees apart. A hybrid orbital is a lobe pointing where an arm of the molecule settles, and a lone pair sits in one just as a bond does.',
        model: { type: 'lobes', n: 4, caption: 'Four identical hybrid lobes, as far apart as they can get. Drag to turn it.' }
      }
    };
  })(),

  /* ---------------------------------------------------------------- 4 */
  {
    title: 'The Second Bond',
    prompt: 'Build the second bond between the two carbon atoms in ethene from their orbitals.',
    widget: { type: 'table', label: 'The bench' },
    table: domainTable({
      pieces: [
        orb('a1', 'sp2', 'c1', { x: 54, y: 32 }, { e: 1, to: 'c2', dir: 0.3, label: 'lobe' }), orb('a2', 'sp2', 'c1', { x: 22, y: 18 }, { e: 1, to: 'h', dir: -2.4, label: 'lobe' }),
        orb('a3', 'sp2', 'c1', { x: 22, y: 46 }, { e: 1, to: 'h', dir: 2.4, label: 'lobe' }), orb('ap', 'p', 'c1', { x: 38, y: 32 }, { e: 1, axis: 'z', to: 'c2', label: 'p' }),
        orb('b1', 'sp2', 'c2', { x: 96, y: 32 }, { e: 1, to: 'c1', dir: Math.PI - 0.3, label: 'lobe' }), orb('b2', 'sp2', 'c2', { x: 128, y: 18 }, { e: 1, to: 'h', dir: -0.7, label: 'lobe' }),
        orb('b3', 'sp2', 'c2', { x: 128, y: 46 }, { e: 1, to: 'h', dir: 0.7, label: 'lobe' }), orb('bp', 'p', 'c2', { x: 112, y: 32 }, { e: 1, axis: 'z', to: 'c1', label: 'p' })
      ],
      fixtures: [plate('c1', 'Carbon 1', { x: 38, y: 32 }, { w: 68, h: 56 }), plate('c2', 'Carbon 2', { x: 112, y: 32 }, { w: 68, h: 56 })]
    }),
    hints: [
      'Use the orbitals of both carbon atoms.',
      'Compare which orbitals point at each other with the orbital each carbon has left over.',
      'Drop an orbital of one carbon on an orbital of the other, first the pair that point at each other, then the pair that lie off the line.'
    ],
    check(state) {
      const b = bondsBuilt(state.table);
      const between = b.pairs.filter(p => (p.a === 'c1' && p.b === 'c2') || (p.a === 'c2' && p.b === 'c1'));
      const end = between.some(p => p.type === 'sigma');
      const side = between.some(p => p.type === 'pi');
      if (!between.length) return { ok: false, notYet: true, msg: 'Overlap an orbital of one carbon with an orbital of the other.' };
      if (end && side) return { ok: true };
      if (side) return { ok: false, msg: 'There is no bond along the line between the two atoms yet.' };
      return { ok: false, msg: 'The two atoms are joined end to end, and the orbital each carbon has left over has no partner.' };
    },
    reward: {
      log: 'End to end, then side to side.',
      title: 'Sigma and Pi Bonds',
      body: 'Overlap end to end along the line between the atoms makes a sigma bond. Overlap side to side of leftover p orbitals, above and below the line, makes a pi bond, so a double bond is one sigma and one pi.',
      model: { type: 'molecule', name: 'ethene', caption: 'Ethene: two carbons held by a double bond, each with two hydrogens in the same flat plane. Drag to turn it.' }
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    title: 'Twisting',
    prompt: 'Turn the far end of each bond a quarter turn, if it will.',
    widget: { type: 'table', label: 'The bench' },
    table: domainTable({
      fixtures: [twist('tw1', { x: 37, y: 32 }, 'single', { label: 'C₂H₆', size: { w: 62, h: 50 } }), twist('tw2', { x: 105, y: 32 }, 'double', { label: 'C₂H₄', size: { w: 62, h: 50 } })]
    }),
    hints: [
      'Use the "Far End" dial of each bond.',
      'Compare which dial stays where you put it and which springs back.',
      'Turn each dial a quarter turn and watch what the far end does.'
    ],
    check(state) {
      const t = state.table;
      const single = twistRead(t, 'tw1');
      const double = twistRead(t, 'tw2');
      if (!single.angle && !double.tried) return { ok: false, notYet: true, msg: 'Turn the far end of a bond.' };
      if (single.angle !== 90) return { ok: false, msg: 'One far end is not a quarter turn round, though its bond would let it go there.' };
      if (!double.tried) return { ok: false, notYet: true, msg: 'Try turning the other bond\'s far end as well.' };
      return { ok: true };
    },
    reward: {
      log: 'A single bond turns; a double bond holds.',
      title: 'Restricted Rotation',
      body: 'A single bond is one sigma bond, which looks the same from every angle, so the atoms at its ends turn freely. A double bond\'s pi overlap would be broken by any turn, so its rotation is restricted.',
      model: { type: 'molecule', name: 'ethane', caption: 'Ethane: a single bond, with a hydrogen end that can turn round it. Drag to turn it.' },
      last: true
    }
  }
];

/** How-to lines printed on the plate (`table/notes.js` places each block clear of everything else on the table). */
const NOTES = {};
applyNotes(STAGES, NOTES);

/* ------------------------------------------------------------------
   THE DEBRIEF
   ------------------------------------------------------------------ */
export const DEBRIEF = {
  speaker: SPEAKER,
  sections: [
    {
      heading: 'What You Found',
      body: 'An atom blends its orbitals into as many hybrid orbitals as it has arms, so carbon\'s four bonds in methane are alike. The p orbitals left over make pi bonds, which is why double and triple bonds hold their ends still.'
    },
    {
      heading: 'Why It Is Worth It',
      body: 'From a Lewis structure you can now say the shape, how many hybrid lobes the centre needs, and why a double bond will not turn.'
    },
    {
      heading: 'Next',
      body: 'The last bench lets the orbitals of two whole atoms combine, and asks what fills the boxes that result.'
    }
  ]
};

/* ------------------------------------------------------------------
   PRACTICE PROBLEMS
   ------------------------------------------------------------------ */
export const PRACTICE = [
  {
    question: 'What is the hybridization of carbon in CH₄?',
    options: [
      { id: 'a', label: 'sp³' },
      { id: 'b', label: 'sp²' },
      { id: 'c', label: 'sp' },
      { id: 'd', label: 'sp³d' }
    ],
    answer: 'a',
    explanation: 'Carbon has four domains, so it blends one s and three p orbitals into four sp³ orbitals.'
  },
  {
    question: 'What is the hybridization of the carbon atoms in ethene, C₂H₄?',
    options: [
      { id: 'a', label: 'sp²' },
      { id: 'b', label: 'sp³' },
      { id: 'c', label: 'sp' },
      { id: 'd', label: 'None' }
    ],
    answer: 'a',
    explanation: 'Each carbon has three domains (two C–H and one C=C), so it is sp², with one unhybridized p orbital left for the pi bond.'
  },
  {
    question: 'How many sigma bonds and pi bonds are in a molecule of HCN?',
    options: [
      { id: 'a', label: '2 sigma and 2 pi' },
      { id: 'b', label: '3 sigma and 1 pi' },
      { id: 'c', label: '1 sigma and 3 pi' },
      { id: 'd', label: '2 sigma and 1 pi' }
    ],
    answer: 'a',
    explanation: 'The H–C single bond is one sigma. The C≡N triple bond is one sigma and two pi.'
  },
  {
    question: 'Why do the ends turn about a C–C single bond but not about a C=C double bond?',
    options: [
      { id: 'a', label: 'Rotating about the double bond would break its pi overlap' },
      { id: 'b', label: 'A single bond has no electrons' },
      { id: 'c', label: 'The double bond is longer' },
      { id: 'd', label: 'Double bonds are ionic' }
    ],
    answer: 'a',
    explanation: 'The pi bond comes from side-to-side overlap of p orbitals, which is lost as one end turns.'
  },
  {
    question: 'A carbon atom has three arms: two bonds to hydrogen and one double bond to another carbon. How many hybrid orbitals does it blend?',
    options: [
      { id: 'a', label: 'Three, one for each arm' },
      { id: 'b', label: 'Four, one for each pair of electrons' },
      { id: 'c', label: 'Two, one for each atom it bonds to' },
      { id: 'd', label: 'Five' }
    ],
    answer: 'a',
    explanation: 'A double bond is one arm, so carbon has three arms and blends one s and two p orbitals into three hybrid orbitals, leaving one p orbital for the second bond.'
  }
];

/* ------------------------------------------------------------------
   SOLUTIONS AND MISSES — SCRIPTS OF THE PLAYER'S OWN ACTIONS
   A solution is what a player does, not what the table ends as: `verify:table` replays each one through the reducer by
   direct actions, by drag and by two taps. An orbital is dropped on another (`bond`), in a bowl (`mix`), a knob is turned
   (`turn`): nothing here says what a bowl makes or whether a bond turns.
   ------------------------------------------------------------------ */

const bond = (a, b) => ({ join: [a, b] });
const mix = (id, bowl) => ({ place: { piece: id, to: `container:${bowl}-bowl` } });
const turn = (fixture, value) => ({ setDial: { fixture, dial: 'turn', value } });
const guess = id => ({ place: { piece: id, to: 'slot:guess' } });

/** The bench state that solves each stage, in order. Checked by verify:learn and verify:table. */
export const SOLUTIONS = [
  [guess('two')],
  [bond('h1', 'cpx'), bond('h2', 'cpy')],
  ['os', 'opx', 'opy', 'opz'].map(id => mix(id, 'mx')),
  [bond('a1', 'b1'), bond('ap', 'bp')],
  [turn('tw1', 90), turn('tw2', 90)]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [],
  [bond('h1', 'cpx')],
  [mix('os', 'mx'), mix('opx', 'mx')],
  [bond('a1', 'b1')],
  [turn('tw1', 60), turn('tw2', 90)]
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
    onLoad() { /* the table is the stage; there are no keys or readouts to lay out */ }
  });
  runner.start();
  return { dispose: () => runner.dispose() };
}

/* Exported for `verify:learn`, which holds every graded figure to the planners. */
export { planMix, planBlend, planTwist, planDomains, countSigmaPi, RIG_MOLECULES, bondsBuilt, bowlRead, molRead };
