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
  domainTable, orbital, mixbowl, twist, bowlRead, bondsBuilt, twistRead, molCard, molRead, marker, markerValue
} from '../../table/kits/domain.js';
import { predictStage, testPrompt, verdictLine } from './_ligar.js';

export const meta = { stageCount: 9 };

export const VOCABULARY = [
  { term: /\brestricted rotation\b/i, introducedAt: 6 },
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

/** The second prediction, on a new case: which bond lets its far end turn. Kept under its own key. */
const TWIST_KEY = 'unit03/q8-hybrid:turn';
const TWIST_GUESSES = [
  ['both', 'both bonds let the far end turn', ['Both bonds', 'let the far end', 'turn']],
  ['single', 'only the single bond lets the far end turn', ['Only the single', 'bond lets the', 'far end turn']],
  ['neither', 'neither bond lets the far end turn', ['Neither bond', 'lets the far', 'end turn']]
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
   THE NINE STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  predictStage({
    key: QUEST_KEY,
    title: 'Carbon as It Stands',
    prompt: 'How many hydrogen atoms can carbon bond to using its ground-state valence orbitals without hybridization?',
    cards: GUESSES,
    hints: [
      'Use the three cards and the slot.',
      'Recall the electron configuration of ground-state carbon and how many unpaired electrons it has.',
      'Select the card matching your prediction.'
    ],
    reward: {
      title: 'Prediction Recorded',
      body: 'Your prediction is recorded. Attempt to form bonds between hydrogen atoms and ground-state carbon orbitals on the bench.'
    }
  }),

  /* ---------------------------------------------------------------- 2 */
  {
    title: 'The Puzzle',
    get prompt() {
      return testPrompt(QUEST_KEY, GUESSES, 'bond hydrogen atoms to carbon\'s ground-state orbitals, using as many as available unpaired electrons permit.');
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
      'Only orbitals with a single unpaired electron can overlap to form a covalent bond.',
      'Bond a hydrogen atom to each carbon orbital that contains an unpaired electron.'
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
        title: 'Ground-State Orbital Limitations',
        body: `${verdictLine(QUEST_KEY, 'two')}Ground-state carbon has only two unpaired electrons, permitting only two covalent bonds, whereas methane forms four identical bonds. Consequently, atomic orbitals must hybridize to form equivalent bonding orbitals.`
      };
    }
  },

  /* ---------------------------------------------------------------- 3 */
  (() => {
    const mx = mixbowl('mx', { x: 50, y: 22 }, { hub: 'C' });
    return {
      title: 'Four Lobes',
      prompt: 'Mix carbon\'s valence orbitals in the mixing bowl to produce four hybrid orbitals for methane.',
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
        'Methane has four electron domains and requires four equivalent hybrid orbitals.',
        'Place one s orbital and three p orbitals into the bowl to generate four sp3 hybrid orbitals.'
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
        body: 'Mixing one 2s orbital and three 2p orbitals generates four degenerate sp³ hybrid orbitals directed toward the corners of a tetrahedron at 109.5 degrees. Each hybrid orbital accommodates a bonding pair or lone pair.',
        model: { type: 'lobes', n: 4, caption: 'sp³ Hybrid Orbitals' }
      }
    };
  })(),

  /* ---------------------------------------------------------------- 4 */
  {
    title: 'The Second Bond',
    prompt: 'Form both covalent bonds between the two carbon atoms in ethene from their orbitals.',
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
      'Form an end-to-end sigma bond along the internuclear axis, followed by a side-by-side pi bond.',
      'Overlap the two sp2 hybrid lobes to form a sigma bond, then overlap the unhybridized p orbitals to form a pi bond.'
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
      body: 'Head-on overlap of hybrid orbitals along the internuclear axis forms a sigma bond. Lateral overlap of unhybridized parallel p orbitals above and below the axis forms a pi bond, making a double bond one sigma and one pi bond.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  predictStage({
    key: TWIST_KEY,
    title: 'Which Bond Turns',
    prompt: 'Which of ethane\'s C–C single bond and ethene\'s C=C double bond lets the far end of the molecule turn?',
    cards: TWIST_GUESSES,
    hints: [
      'Use the three cards and the slot.',
      'Think about whether the side-by-side overlap of a double bond survives a turn.',
      'Pick the card that matches your prediction.'
    ],
    reward: {
      title: 'Prediction',
      body: 'Your prediction is recorded. Turn the far end of each bond on the bench.'
    }
  }),

  /* ---------------------------------------------------------------- 6 */
  {
    title: 'Twisting',
    get prompt() {
      return testPrompt(TWIST_KEY, TWIST_GUESSES, 'find out which of these two bonds lets its far end turn a quarter turn.');
    },
    widget: { type: 'table', label: 'The bench' },
    table: domainTable({
      fixtures: [twist('tw1', { x: 37, y: 32 }, 'single', { label: 'C₂H₆', size: { w: 62, h: 50 } }), twist('tw2', { x: 105, y: 32 }, 'double', { label: 'C₂H₄', size: { w: 62, h: 50 } })]
    }),
    hints: [
      'Use the "Far End" dial of each bond.',
      'Observe how rotation affects orbital overlap in a single bond versus a double bond.',
      'Turn each dial by 90 degrees to test rotation around sigma and pi bonds.'
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
    get reward() {
      return {
      log: 'A single bond turns; a double bond holds.',
      title: 'Restricted Rotation',
      body: verdictLine(TWIST_KEY, 'single') + 'A single bond consists of a cylindrically symmetrical sigma bond that permits free rotation. In contrast, rotating a double bond breaks the parallel overlap of pi orbitals, resulting in restricted rotation.'
      };
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    title: 'Counting Sigma and Pi',
    prompt: 'Set the markers to the number of sigma bonds and the number of pi bonds in hydrogen cyanide, HCN.',
    widget: { type: 'table', label: 'The bench' },
    table: domainTable({
      pieces: [molCard('hcn', 'HCN', { x: 34, y: 34 })],
      fixtures: [marker('sig', { x: 100, y: 20 }, { label: 'Sigma', max: 12 }), marker('pi', { x: 100, y: 44 }, { label: 'Pi', max: 12 })]
    }),
    hints: [
      'Use the molecule card and the two markers.',
      'Count the lines between each pair of atoms in the formula on the card.',
      'Every bond holds exactly one sigma bond, and each line beyond the first in a bond is a pi bond.'
    ],
    check(state) {
      const t = state.table;
      const sig = markerValue(t, 'sig');
      const pi = markerValue(t, 'pi');
      if (!sig && !pi) return { ok: false, notYet: true, msg: 'Set the markers to numbers of bonds.' };
      const want = countSigmaPi('HCN');
      if (sig !== want.sigma) return { ok: false, msg: 'The first marker is not the number of that kind of bond the molecule holds.' };
      if (pi !== want.pi) return { ok: false, msg: 'The second marker is not the number of that kind of bond the molecule holds.' };
      return { ok: true };
    },
    reward: {
      log: 'Two sigma bonds and two pi bonds.',
      title: 'Counting Sigma and Pi',
      body: 'Every single, double or triple bond holds one sigma bond; each further shared pair is a pi bond. HCN has a single C–H bond and a C≡N triple bond: 1 + 1 = 2 sigma bonds, and 2 pi bonds in the triple bond.',
    }
  },

  /* ---------------------------------------------------------------- 8 */
  (() => {
    const mx = mixbowl('mx', { x: 50, y: 22 }, { hub: 'B' });
    return {
      title: 'Three Lobes',
      prompt: 'Mix boron\'s orbitals in the bowl to make one lobe for each fluorine atom on the card.',
      widget: { type: 'table', label: 'The bench' },
      table: domainTable({
        pieces: [
          orb('os', 's', 'b', { x: 14, y: RAIL_Y }, { e: 1, label: 's' }), orb('opx', 'p', 'b', { x: 34, y: RAIL_Y }, { e: 1, axis: 'x', label: 'px' }),
          orb('opy', 'p', 'b', { x: 54, y: RAIL_Y }, { e: 1, axis: 'y', label: 'py' }), orb('opz', 'p', 'b', { x: 74, y: RAIL_Y }, { e: 0, axis: 'z', label: 'pz' }),
          molCard('ref', 'BF3', { x: 126, y: 24 }, { show: ['arms'] })
        ],
        zones: { containers: [mx.bowl] },
        fixtures: [mx.fixture]
      }),
      hints: [
        'Use the four orbitals and the mixing bowl.',
        'Count the arms on the card, then count the lobes the bowl makes.',
        'The bowl makes as many lobes as the orbitals put into it; an orbital left out stays as it is.'
      ],
      check(state) {
        const r = bowlRead(state.table, 'mx');
        if (!r.held.length) return { ok: false, notYet: true, msg: 'Put some orbitals in the bowl.' };
        const want = molRead(state.table.pieces.ref).domains;
        if (r.lobes === want) return { ok: true };
        return { ok: false, msg: 'The lobes that come out are not as many as the arms on the card.' };
      },
      reward: {
        log: 'An s orbital and two p orbitals make three.',
        title: 'sp² Hybrid Orbitals',
        body: 'Mixing one s and two p orbitals gives three sp² lobes, 120° apart in one plane, which is the shape of BF₃. The p orbital left out stands upright over the plane and is empty here.',
        model: { type: 'lobes', n: 3, caption: 'sp² Hybrid Orbitals' }
      }
    };
  })(),

  /* ---------------------------------------------------------------- 9 */
  (() => {
    const mx = mixbowl('mx', { x: 50, y: 22 }, { hub: 'C' });
    return {
      title: 'Two Lobes',
      prompt: 'Mix carbon\'s orbitals in the bowl to make one lobe for each oxygen atom on the card.',
      widget: { type: 'table', label: 'The bench' },
      table: domainTable({
        pieces: [
          ...carbon('c', { x: 0, y: 0 }, ['os', 'opx', 'opy', 'opz']).map((p, i) => ({ ...p, at: { x: 14 + i * 20, y: RAIL_Y } })),
          molCard('ref', 'CO2', { x: 126, y: 24 }, { show: ['arms'] })
        ],
        zones: { containers: [mx.bowl] },
        fixtures: [mx.fixture]
      }),
      hints: [
        'Use the four orbitals and the mixing bowl.',
        'A double bond is one arm, so count the arms on the card, not the lines.',
        'Put in as many orbitals as there are arms, one of them the s orbital.'
      ],
      check(state) {
        const r = bowlRead(state.table, 'mx');
        if (!r.held.length) return { ok: false, notYet: true, msg: 'Put some orbitals in the bowl.' };
        const want = molRead(state.table.pieces.ref).domains;
        if (r.lobes === want) return { ok: true };
        return { ok: false, msg: 'The lobes that come out are not as many as the arms on the card.' };
      },
      reward: {
        log: 'An s orbital and one p orbital make two.',
        title: 'sp Hybrid Orbitals',
        body: 'Mixing one s and one p orbital gives two sp lobes pointing opposite ways, 180° apart, which is the shape of CO₂. Carbon keeps two p orbitals out of the bowl, and each forms one pi bond with an oxygen.',
        model: { type: 'lobes', n: 2, caption: 'sp Hybrid Orbitals' },
        last: true
      }
    };
  })()
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
      heading: 'Summary',
      body: 'Atomic orbitals hybridize to form equivalent directional bonding orbitals corresponding to electron domain geometries. Unhybridized p orbitals form pi bonds through lateral overlap.'
    },
    {
      heading: 'Sigma and Pi Bonding',
      body: 'Sigma bonds have electron density along the internuclear axis and permit free rotation. Pi bonds have electron density above and below the internuclear axis and restrict rotation.'
    },
    {
      heading: 'Next',
      body: 'The final bench introduces molecular orbital theory to describe electron delocalization and magnetic properties.'
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
  [guess('single')],
  [turn('tw1', 90), turn('tw2', 90)],
  [{ setDial: { fixture: 'sig', dial: 'value', value: 2 } }, { setDial: { fixture: 'pi', dial: 'value', value: 2 } }],
  ['os', 'opx', 'opy'].map(id => mix(id, 'mx')),
  ['os', 'opx'].map(id => mix(id, 'mx'))
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [],
  [bond('h1', 'cpx')],
  [mix('os', 'mx'), mix('opx', 'mx')],
  [bond('a1', 'b1')],
  [],
  [turn('tw1', 60), turn('tw2', 90)],
  [{ setDial: { fixture: 'sig', dial: 'value', value: 3 } }, { setDial: { fixture: 'pi', dial: 'value', value: 1 } }],
  [mix('os', 'mx'), mix('opx', 'mx')],
  [mix('os', 'mx'), mix('opx', 'mx'), mix('opy', 'mx')]
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
