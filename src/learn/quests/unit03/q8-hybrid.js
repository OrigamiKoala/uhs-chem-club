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
import { planMix, planBlend, planTwist, planDomains, countSigmaPi, RIG_MOLECULES } from '../../engine/vsepr.js';
import {
  domainTable, orbital, mixbowl, twist, bowlRead, bondsBuilt, twistRead, molCard, molRead, marker, markerValue
} from '../../table/kits/domain.js';
import { predictStage, testPrompt, verdictLine } from './_ligar.js';

export const meta = { stageCount: 9 };

export const VOCABULARY = [
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

/**
 * The two carbons of ethene, each ONE atom: a nucleus with its three sp2 lobes (one toward the other carbon, two toward hydrogens) and
 * the p orbital standing through it. Every orbital is seated on its atom (`seat`: its handle's offset from the nucleus), so they never
 * come apart; bonding two draws the atoms together until the nuclei are `apart` units apart (`domain-orbitals.js` `settleSeated`).
 */
const SEAT_R = 14;
const APART = 24;
function ethene() {
  const atoms = [
    { id: 'c1', name: 'Carbon 1', at: { x: 40, y: 32 }, to: 'c2', toward: 0, k: 'a' },
    { id: 'c2', name: 'Carbon 2', at: { x: 112, y: 32 }, to: 'c1', toward: Math.PI, k: 'b' }
  ];
  const out = [];
  for (const c of atoms) {
    const lobes = [[c.toward, c.to], [c.toward + (2 * Math.PI) / 3, 'h'], [c.toward - (2 * Math.PI) / 3, 'h']];
    lobes.forEach(([dir, to], i) => {
      const seat = { dx: Math.cos(dir) * SEAT_R, dy: Math.sin(dir) * SEAT_R };
      out.push(orb(`${c.k}${i + 1}`, 'sp2', c.id, { x: c.at.x + seat.dx, y: c.at.y + seat.dy }, { e: 1, to, dir, label: 'hybrid', seat, apart: APART }));
    });
    out.push(orb(`${c.k}p`, 'p', c.id, { ...c.at }, { e: 1, axis: 'z', to: c.to, label: 'p', seat: { dx: 0, dy: 0 }, apart: APART, nucleus: true, atomLabel: c.name }));
  }
  return out;
}

/* ------------------------------------------------------------------
   THE NINE STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  predictStage({
    key: QUEST_KEY,
    title: 'Carbon as It Stands',
    briefing: { speaker: SPEAKER, body: 'Carbon\'s four valence electrons sit as a pair in its 2s orbital and one each in two of its three 2p orbitals. A covalent bond forms when two orbitals, each holding one electron, overlap.' },
    prompt: 'How many hydrogen atoms can carbon bond with using its unmixed s and p orbitals?',
    cards: GUESSES,
    hints: [
      'Drag one of the three prediction cards into the slot.',
      'Count how many of carbon\'s orbitals hold exactly one electron.',
      'Predictions are never graded, so pick the card you think is most likely.'
    ],
    reward: {
      title: 'Prediction Recorded',
      body: 'The next stage bonds hydrogen atoms to carbon\'s orbitals, one at a time.'
    }
  }),

  /* ---------------------------------------------------------------- 2 */
  {
    title: 'The Puzzle',
    get prompt() {
      return testPrompt(QUEST_KEY, GUESSES, 'drag hydrogen atoms onto carbon\'s unmixed orbitals to see how many bonds form.');
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
      'Drag a hydrogen atom onto one of carbon\'s orbitals; each orbital shows how many electrons it holds.',
      'Compare the orbitals that accept a hydrogen with those that do not, then compare your result with the methane card.',
      'An orbital that already holds two electrons, or zero electrons, has no single electron to pair with hydrogen\'s.'
    ],
    check(state) {
      const t = state.table;
      const mine = bondsBuilt(t).pairs.filter(p => p.a === 'c' || p.b === 'c').length;
      const room = Object.values(t.pieces).filter(p => p.kind === 'orb' && p.props.atom === 'c' && p.props.e === 1).length;
      if (!mine) return { ok: false, notYet: true, msg: 'Bond a hydrogen atom to one of carbon\'s orbitals.' };
      if (mine >= room) return { ok: true };
      return { ok: false, msg: 'One of carbon\'s orbitals holding a single electron still has no hydrogen bonded to it.' };
    },
    get reward() {
      return {
        log: 'The orbitals as they stand fall short.',
        title: 'The Puzzle of Methane',
        body: `${verdictLine(QUEST_KEY, 'two')}Only two, 90° apart. Yet methane has four identical bonds 109.5° apart, so bonded carbon cannot be using its unmixed s and p orbitals.`
      };
    }
  },

  /* ---------------------------------------------------------------- 3 */
  (() => {
    const mx = mixbowl('mx', { x: 50, y: 22 }, { hub: 'C' });
    return {
      title: 'Four Hybrids',
      briefing: { speaker: SPEAKER, body: 'An atom\'s orbitals can mix into the same number of identical new orbitals, called hybrid orbitals. Drag orbitals into the mixer tray and press Mix to combine them.' },
      prompt: 'Drag carbon\'s orbitals into the mixer and press Mix to make four identical orbitals for CH₄.',
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
        'Drag orbitals into the mixer tray and press "Mix" to see the hybrid orbitals form; drag an orbital out to remove it.',
        'Compare the number of orbitals you put in with the number of hybrid orbitals that come out.',
        'Methane has four electron domains, and each needs one hybrid orbital, so decide how many orbitals must go in.'
      ],
      check(state) {
        const r = bowlRead(state.table, 'mx');
        if (!r.held.length) return { ok: false, notYet: true, msg: 'Put some orbitals in the mixer.' };
        if (!r.mixed) return { ok: false, notYet: true, msg: 'Press "Mix" to combine the orbitals in the tray.' };
        const want = molRead(state.table.pieces.ref).domains;
        if (r.lobes === want) return { ok: true };
        return { ok: false, msg: `The mixer gives ${r.lobes} orbitals, and the methane card has ${want} electron domains to fill.` };
      },
      reward: {
        log: 'An s orbital and three p orbitals make four.',
        title: 'Hybrid Orbitals: sp³',
        body: 'One s and three p orbitals mix into four identical sp³ hybrid orbitals, 109.5° apart. Carbon\'s four valence electrons go one into each, ready for four equal bonds.',
        model: { type: 'lobes', n: 4, caption: 'sp³ Hybrid Orbitals' }
      }
    };
  })(),

  /* ---------------------------------------------------------------- 4 */
  {
    title: 'The Second Bond',
    briefing: { speaker: SPEAKER, body: 'Two orbitals overlapping head-on along the line between the nuclei form a sigma bond. Two p orbitals overlapping side-by-side above and below that line form a pi bond.' },
    prompt: 'Ethene (C₂H₄) has a C=C double bond: drag orbitals from one carbon onto the other to form both bonds.',
    widget: { type: 'table', label: 'The bench' },
    table: domainTable({
      pieces: ethene(),
      fixtures: [plate('bench', 'C₂H₄', { x: 76, y: 32 }, { w: 146, h: 60 })]
    }),
    hints: [
      'Each carbon has three flat hybrid orbitals and one upright p orbital; drag an orbital from one carbon onto an orbital of the other.',
      'Compare which orbitals point directly at the other carbon with which stand upright above and below the bond line.',
      'A double bond has two shared pairs, and only one pair can sit directly between the two nuclei.'
    ],
    check(state) {
      const b = bondsBuilt(state.table);
      const between = b.pairs.filter(p => (p.a === 'c1' && p.b === 'c2') || (p.a === 'c2' && p.b === 'c1'));
      const end = between.some(p => p.type === 'sigma');
      const side = between.some(p => p.type === 'pi');
      if (!between.length) return { ok: false, notYet: true, msg: 'Overlap an orbital of one carbon with an orbital of the other.' };
      if (end && side) return { ok: true };
      if (side) return { ok: false, msg: 'The p orbitals overlap, but no orbitals meet along the line between the two nuclei yet.' };
      return { ok: false, msg: 'The atoms are bonded head-on, but each carbon still has a p orbital with an unpaired electron.' };
    },
    reward: {
      log: 'End to end, then side to side.',
      title: 'Sigma and Pi Bonds',
      body: 'Two hybrid orbitals overlap head-on to form a sigma bond, and two p orbitals overlap side-by-side to form a pi bond. A double bond is one sigma bond and one pi bond.',
      model: { type: 'sigma-pi', mode: 'both' }
    }
  },

  /* ---------------------------------------------------------------- 5 */
  predictStage({
    key: TWIST_KEY,
    title: 'Which Bond Turns',
    prompt: 'Which bond lets one end of the molecule rotate freely: ethane\'s single bond, ethene\'s double bond, both, or neither?',
    cards: TWIST_GUESSES,
    hints: [
      'Drag one of the three prediction cards into the slot.',
      'Picture what twisting does to a head-on overlap versus a side-by-side overlap of two p orbitals.',
      'Predictions are never graded, so pick the card you think is most likely.'
    ],
    reward: {
      title: 'Prediction',
      body: 'The next stage lets you twist one end of each molecule.'
    }
  }),

  /* ---------------------------------------------------------------- 6 */
  {
    title: 'Twisting',
    get prompt() {
      return testPrompt(TWIST_KEY, TWIST_GUESSES, 'Turn both bonds 90 degrees and see what happens.');
    },
    widget: { type: 'table', label: 'The bench' },
    table: domainTable({
      fixtures: [twist('tw1', { x: 37, y: 32 }, 'single', { label: 'C₂H₆', size: { w: 62, h: 50 } }), twist('tw2', { x: 105, y: 32 }, 'double', { label: 'C₂H₄', size: { w: 62, h: 50 } })]
    }),
    hints: [
      'Drag the "Far End" dial on each molecule to rotate the far carbon and its attached atoms.',
      'Compare what rotation does to the head-on overlap in ethane versus the side-by-side p orbitals in ethene.',
      'A bond holds only while its orbitals overlap, so check which overlap stays intact when rotated.'
    ],
    check(state) {
      const t = state.table;
      const single = twistRead(t, 'tw1');
      const double = twistRead(t, 'tw2');
      if (!single.angle && !double.tried) return { ok: false, notYet: true, msg: 'Turn the far end of a bond.' };
      if (single.angle !== 90) return { ok: false, msg: 'Rotate ethane\'s far end a full quarter turn (90°) first.' };
      if (!double.tried) return { ok: false, notYet: true, msg: 'Try rotating the other bond\'s far end as well.' };
      return { ok: true };
    },
    get reward() {
      return {
        log: 'A single bond turns; a double bond holds.',
        title: 'Turning About a Bond',
        body: verdictLine(TWIST_KEY, 'single') + 'Only the single bond: a sigma bond overlaps the same way at every angle. Twisting a double bond pulls the two p orbitals out of alignment and breaks the pi bond.'
      };
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    title: 'Counting Pi Bonds',
    briefing: {
      speaker: SPEAKER,
      body: 'Every covalent bond has one sigma bond; any second or third shared pair in a double or triple bond is a pi bond.'
    },
    prompt: 'How many pi bonds are in hydrogen cyanide, H–C≡N?',
    widget: { type: 'table', label: 'The bench' },
    table: domainTable({
      pieces: [molCard('hcn', 'HCN', { x: 34, y: 34 }, { extra: { orbitals: 'hcn-triple' } })],
      fixtures: [marker('pi', { x: 100, y: 32 }, { label: 'Pi bonds', max: 12 })]
    }),
    hints: [
      'The card shows the bonds as lines between the atoms; set your answer on the dial.',
      'Compare the single line between hydrogen and carbon with the three lines between carbon and nitrogen.',
      'Only one bond between two atoms can be a sigma bond along the axis, so every extra bond in a double or triple bond is a pi bond.'
    ],
    check(state) {
      const pi = markerValue(state.table, 'pi');
      if (!pi) return { ok: false, notYet: true, msg: 'Set the dial to a number of bonds.' };
      const want = countSigmaPi('HCN');
      if (pi === want.pi) return { ok: true };
      return pi === want.pi + want.sigma
        ? { ok: false, msg: 'That counts every bond in the molecule, including the sigma bonds along the axis.' }
        : { ok: false, msg: `${pi} is not the number of pi bonds in HCN.` };
    },
    reward: {
      log: 'Two sigma bonds and two pi bonds.',
      title: 'Counting Pi Bonds',
      body: 'Two. Every covalent link has one sigma bond, and each additional shared pair is a pi bond, so the triple bond has one sigma and two pi bonds.'
    }
  },

  /* ---------------------------------------------------------------- 8 */
  (() => {
    const mx = mixbowl('mx', { x: 50, y: 22 }, { hub: 'B' });
    return {
      title: 'Three Hybrids',
      prompt: 'Drag boron\'s orbitals into the mixer and press Mix to make one hybrid orbital for each bond in BF₃.',
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
        'Drag orbitals into the mixer tray and press "Mix" to form the hybrid orbitals; the card shows BF₃.',
        'Compare the number of hybrid orbitals the mixer draws with the number of electron domains on the card.',
        'The mixer outputs as many hybrid orbitals as you put in, while any unmixed orbital stays unchanged.'
      ],
      check(state) {
        const r = bowlRead(state.table, 'mx');
        if (!r.held.length) return { ok: false, notYet: true, msg: 'Put some orbitals in the mixer.' };
        if (!r.mixed) return { ok: false, notYet: true, msg: 'Press "Mix" to combine the orbitals in the tray.' };
        const want = molRead(state.table.pieces.ref).domains;
        if (r.lobes === want) return { ok: true };
        return { ok: false, msg: `The mixer gives ${r.lobes} orbitals, and the card shows ${want} electron domains on the central atom.` };
      },
      reward: {
        log: 'An s orbital and two p orbitals make three.',
        title: 'Hybrid Orbitals: sp²',
        body: 'One s and two p orbitals mix into three sp² hybrid orbitals, 120° apart in a flat plane. The leftover p orbital stands perpendicular to that plane.',
        model: { type: 'lobes', n: 3, kind: 'sp2', caption: 'sp² Hybrid Orbitals' }
      }
    };
  })(),

  /* ---------------------------------------------------------------- 9 */
  (() => {
    const mx = mixbowl('mx', { x: 50, y: 22 }, { hub: 'C' });
    return {
      title: 'Two Hybrids',
      prompt: 'Drag carbon\'s orbitals into the mixer and press Mix to make one hybrid orbital for each oxygen in CO₂.',
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
        'Drag orbitals into the mixer tray and press "Mix" to form the hybrid orbitals; the card shows O=C=O.',
        'Compare the number of electron domains on carbon with the number of bonds to each oxygen.',
        'A double bond counts as one electron domain and uses one hybrid orbital for its sigma bond, leaving unmixed p orbitals for its pi bonds.'
      ],
      check(state) {
        const r = bowlRead(state.table, 'mx');
        if (!r.held.length) return { ok: false, notYet: true, msg: 'Put some orbitals in the mixer.' };
        if (!r.mixed) return { ok: false, notYet: true, msg: 'Press "Mix" to combine the orbitals in the tray.' };
        const want = molRead(state.table.pieces.ref).domains;
        if (r.lobes === want) return { ok: true };
        return { ok: false, msg: `The mixer gives ${r.lobes} orbitals, and the card shows ${want} electron domains on the central atom.` };
      },
      reward: {
        log: 'An s orbital and one p orbital make two.',
        title: 'Hybrid Orbitals: sp',
        body: 'One s and one p orbital mix into two sp hybrid orbitals, 180° apart. The two leftover p orbitals each form a pi bond with one oxygen.',
        model: { type: 'lobes', n: 2, kind: 'co2', caption: 'CO₂ Orbitals' },
        last: true
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
      body: 'Carbon\'s unmixed s and p orbitals cannot form four equal bonds. An atom\'s orbitals mix into hybrid orbitals, one per electron domain: sp³ for four, sp² for three, and sp for two.'
    },
    {
      heading: 'Sigma and Pi',
      body: 'Orbitals overlapping head-on form a sigma bond, which can rotate freely. Unmixed p orbitals overlap side-by-side to form pi bonds, which break if one end twists.'
    },
    {
      heading: 'Next',
      body: 'The last bench looks at what happens to two atoms\' orbitals when the atoms meet.'
    }
  ]
};

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
  [...['os', 'opx', 'opy', 'opz'].map(id => mix(id, 'mx')), { run: 'mx' }],
  [bond('a1', 'b1'), bond('ap', 'bp')],
  [guess('single')],
  [turn('tw1', 90), turn('tw2', 90)],
  [{ setDial: { fixture: 'pi', dial: 'value', value: 2 } }],
  [...['os', 'opx', 'opy'].map(id => mix(id, 'mx')), { run: 'mx' }],
  [...['os', 'opx'].map(id => mix(id, 'mx')), { run: 'mx' }]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [],
  [bond('h1', 'cpx')],
  [mix('os', 'mx'), mix('opx', 'mx'), { run: 'mx' }],
  [bond('a1', 'b1')],
  [],
  [turn('tw1', 60), turn('tw2', 90)],
  [{ setDial: { fixture: 'pi', dial: 'value', value: 4 } }],
  [mix('os', 'mx'), mix('opx', 'mx'), { run: 'mx' }],
  [mix('os', 'mx'), mix('opx', 'mx'), mix('opy', 'mx'), { run: 'mx' }]
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
