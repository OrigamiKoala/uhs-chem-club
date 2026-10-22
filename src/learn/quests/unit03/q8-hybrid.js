/**
 * q8-hybrid.js — Ligar, bench eight: HYBRIDIZATION.
 *
 * The eighth bench on the world and its sixth TABLETOP (plan `bench-tabletop.md`, phase T3b). An atom's orbitals are pieces
 * on the plate, drawn with the electrons they hold. They are dropped in a MIXING BOWL, and what comes out is what went in:
 * as many hybrid lobes as orbitals mixed, pointing where that many arms settle, with the p orbitals left out standing over
 * as they were. Or they are dropped on each other, and overlap into a bond if the two point at each other and each holds a
 * single electron. A last bench turns the far end of a bond to find whether it will.
 *
 *   1  bond hydrogen atoms to carbon's orbitals as they stand      -> (the puzzle: two bonds, not four)
 *   2  mix carbon's orbitals to one lobe for each bond in methane  -> hybrid orbital, sp3
 *   3  tray NH3, H2O and C2H4 by the lobes their centre needs       -> sp2 (a lone pair is an arm)
 *   4  tray CO2, BF3 and HCN the same way                           -> sp (a multiple bond is one arm)
 *   5  build the second bond between ethene's carbons               -> sigma bond, pi bond
 *   6  build every bond of hydrogen cyanide from its orbitals       -> (each arm is one sigma bond)
 *   7  turn the far end of ethane's bond and of ethene's            -> restricted rotation
 *   8  mix orbitals for PCl5's phosphorus and SF6's sulfur          -> sp3d, sp3d2 (beyond the exam)
 *
 * THE BOWL FOLLOWS ONE RULE, which the player finds: as many hybrid lobes as the hub has arms (`vsepr.planBlend`; `planMix` is
 * the same answer without d). Stage eight carries it past what s and p can blend, and says so on its card. Every overlap is the
 * kit's planner (`kits/domain-orbitals.js`): two orbitals bond only if each holds one electron and they point at each other,
 * and a pair of p orbitals bonds only if they lie the same way. Every bond that stands is counted by `bondsBuilt`.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import { applyNotes } from '../../table/notes.js';
import { planMix, planBlend, planTwist, planDomains, countSigmaPi, RIG_MOLECULES } from '../../engine/vsepr.js';
import {
  domainTable, orbital, mixbowl, twist, bowlRead, bondsBuilt, twistRead, molCard, molRead
} from '../../table/kits/domain.js';

export const meta = { stageCount: 8 };

export const VOCABULARY = [
  { term: /\bsp[3³]d[2²]?(?!\w)/i, introducedAt: 8 },
  { term: /\brestricted rotation\b/i, introducedAt: 7 },
  { term: /\bsigma\b|\bpi bonds?\b|\bpi\b/i, introducedAt: 5 },
  { term: /\bsp(?![\w²³])/i, introducedAt: 4 },
  { term: /\bsp[2²](?!\w)/i, introducedAt: 3 },
  { term: /\bsp[3³](?!\w)/i, introducedAt: 2 },
  { term: /\bhybrid(?:s|i[sz]ation|i[sz]ed)?\b/i, introducedAt: 2 }
];

export const BUILDS_ON = ['unit03/q6-shape', 'unit03/q4-dots', 'unit02/q6-filling', 'unit02/q4-cloud'];

const SPEAKER = 'Vess';

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
const TWOLOBE = [['two', 'Two lobes'], ['three', 'Three lobes'], ['four', 'Four lobes']];

/** Three molecule cards in a row and the trays under them, one for each number of lobes. */
function sortTable(mols) {
  return domainTable({
    pieces: mols.map(([id, mol], i) => molCard(id, mol, { x: 30 + i * 45, y: 53 }, { show: ['arms'] })),
    zones: { trays: TWOLOBE.map(([id, label], i) => ({ id, label, at: { x: 26 + i * 50, y: 20 }, size: { w: 48, h: 26 }, cell: 24 })) }
  });
}

const LOBES = { two: 2, three: 3, four: 4 };
const sortedTo = (t, ids) => Object.fromEntries(ids.map(id => [id, Object.keys(LOBES).find(z => t.pieces[id].zone === `tray:${z}`) || null]));

/* ------------------------------------------------------------------
   THE EIGHT STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    title: 'The Puzzle',
    briefing: {
      speaker: SPEAKER,
      body: 'Each orbital is drawn with the electrons it holds: drop a hydrogen atom on an orbital to try to bond with it. Press Submit when the table shows your answer.'
    },
    prompt: 'Bond hydrogen atoms to carbon through its orbitals as they stand, as many as they allow.',
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
      'Drop a hydrogen atom on each of carbon\'s orbitals in turn and see which of them take it.',
      'Compare the orbitals that take a hydrogen atom with the single electrons drawn in them, and with the four bonds the methane card shows.',
      'Each bond needs one electron from the carbon, so count how many bonds the single electrons allow.'
    ],
    check(state) {
      const t = state.table;
      const mine = bondsBuilt(t).pairs.filter(p => p.a === 'c' || p.b === 'c').length;
      const room = Object.values(t.pieces).filter(p => p.kind === 'orb' && p.props.atom === 'c' && p.props.e === 1).length;
      if (!mine) return { ok: false, notYet: true, msg: 'Bond a hydrogen atom to one of the carbon\'s orbitals.' };
      if (mine >= room) return { ok: true };
      return { ok: false, msg: 'Another orbital of the carbon still holds a single electron, so it can take a hydrogen atom.' };
    },
    reward: {
      log: 'The orbitals as they stand fall short.',
      title: 'Orbitals as They Stand Fall Short',
      body: 'Carbon\'s two single electrons would allow two bonds, but methane has four, all identical. So the orbitals cannot stay as they are when carbon bonds.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  (() => {
    const mx = mixbowl('mx', { x: 50, y: 22 }, { hub: 'C' });
    return {
      title: 'Four Lobes',
      briefing: {
        speaker: SPEAKER,
        body: 'The bowl blends the orbitals dropped in it, and the lobes that come out are drawn beside it.'
      },
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
        'Drop the s orbital and some of the p orbitals in the bowl and count the lobes that come out.',
        'Compare the number of lobes with the number of arms on the methane card.',
        'Blend the s orbital with enough p orbitals to make one lobe for every arm.'
      ],
      check(state) {
        const r = bowlRead(state.table, 'mx');
        if (!r.held.length) return { ok: false, notYet: true, msg: 'Put some orbitals in the bowl.' };
        const want = molRead(state.table.pieces.ref).domains;
        if (r.lobes === want) return { ok: true };
        return { ok: false, msg: 'The lobes that come out do not match the arms on the methane card.' };
      },
      reward: {
        log: 'An s orbital and three p orbitals make four.',
        title: 'Hybrid Orbital, sp³',
        body: 'Blending one s orbital with three p orbitals gives four identical sp3 hybrid orbitals pointing at 109.5 degrees. Lone pairs occupy hybrid orbitals just as bonding pairs do.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 3 */
  {
    title: 'Count the Lobes',
    prompt: 'Sort each molecule into a tray by how many hybrid lobes its central atom needs.',
    widget: { type: 'table', label: 'The bench' },
    table: sortTable([['a', 'NH3'], ['b', 'H2O'], ['c', 'C2H4']]),
    hints: [
      'Read the arms each card counts and recall how many lobes the bowl made for each number of arms.',
      'Compare the cards with lone pairs on them with the cards that have only bonds.',
      'Count every arm on the central atom, whatever the arm is made of.'
    ],
    check(state) {
      const t = state.table;
      const where = sortedTo(t, ['a', 'b', 'c']);
      if (Object.values(where).some(z => !z)) return { ok: false, notYet: true, msg: 'Sort all three molecules into trays.' };
      const wrong = ['a', 'b', 'c'].find(id => LOBES[where[id]] !== molRead(t.pieces[id]).domains);
      if (wrong) return { ok: false, msg: `${t.pieces[wrong].label} is under the wrong heading: count the arms on its central atom, including any that are not bonds.` };
      return { ok: true };
    },
    reward: {
      log: 'The lobes follow the arms.',
      title: 'sp²',
      body: 'A central atom with three arms blends one s and two p orbitals into three sp2 lobes, 120 degrees apart. A lone pair is an arm too, so ammonia and water need four lobes, like methane.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    title: 'Fewer Lobes',
    prompt: 'Sort each molecule into a tray by how many hybrid lobes its central atom needs.',
    widget: { type: 'table', label: 'The bench' },
    table: sortTable([['a', 'CO2'], ['b', 'BF3'], ['c', 'HCN']]),
    hints: [
      'Read the arms each card counts and recall how many lobes the bowl made for each number of arms.',
      'Compare how a double or triple bond is drawn with how single bonds are drawn.',
      'A double or triple bond is a single arm, however many pairs it holds.'
    ],
    check(state) {
      const t = state.table;
      const where = sortedTo(t, ['a', 'b', 'c']);
      if (Object.values(where).some(z => !z)) return { ok: false, notYet: true, msg: 'Sort all three molecules into trays.' };
      const wrong = ['a', 'b', 'c'].find(id => LOBES[where[id]] !== molRead(t.pieces[id]).domains);
      if (wrong) return { ok: false, msg: `${t.pieces[wrong].label} is under the wrong heading: count the arms on its central atom, and remember what a multiple bond counts as.` };
      return { ok: true };
    },
    reward: {
      log: 'Two arms, two lobes.',
      title: 'sp',
      body: 'A central atom with two arms blends one s and one p orbital into two sp lobes, 180 degrees apart. Two p orbitals are left over, and they make the extra bonds of a double or triple bond.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    title: 'The Second Bond',
    prompt: 'Build the second bond between the two carbon atoms in ethene from their orbitals.',
    widget: { type: 'table', label: 'The bench' },
    table: domainTable({
      pieces: [
        orb('a1', 'sp2', 'c1', { x: 54, y: 32 }, { e: 1, to: 'c2', dir: 0.3 }), orb('a2', 'sp2', 'c1', { x: 22, y: 18 }, { e: 1, to: 'h', dir: -2.4 }),
        orb('a3', 'sp2', 'c1', { x: 22, y: 46 }, { e: 1, to: 'h', dir: 2.4 }), orb('ap', 'p', 'c1', { x: 38, y: 32 }, { e: 1, axis: 'z', to: 'c2', label: 'p' }),
        orb('b1', 'sp2', 'c2', { x: 96, y: 32 }, { e: 1, to: 'c1', dir: Math.PI - 0.3 }), orb('b2', 'sp2', 'c2', { x: 128, y: 18 }, { e: 1, to: 'h', dir: -0.7 }),
        orb('b3', 'sp2', 'c2', { x: 128, y: 46 }, { e: 1, to: 'h', dir: 0.7 }), orb('bp', 'p', 'c2', { x: 112, y: 32 }, { e: 1, axis: 'z', to: 'c1', label: 'p' })
      ],
      fixtures: [plate('c1', 'Carbon 1', { x: 38, y: 32 }, { w: 68, h: 56 }), plate('c2', 'Carbon 2', { x: 112, y: 32 }, { w: 68, h: 56 })]
    }),
    hints: [
      'Drop an orbital of one carbon on an orbital of the other to see whether the two overlap.',
      'Compare which orbitals point at each other with the orbital each carbon has left over.',
      'The first bond lies along the line between the atoms, so look for the orbitals that lie off it.'
    ],
    check(state) {
      const b = bondsBuilt(state.table);
      const between = b.pairs.filter(p => (p.a === 'c1' && p.b === 'c2') || (p.a === 'c2' && p.b === 'c1'));
      const end = between.some(p => p.type === 'sigma');
      const side = between.some(p => p.type === 'pi');
      if (!between.length) return { ok: false, notYet: true, msg: 'Overlap an orbital of one carbon with an orbital of the other.' };
      if (end && side) return { ok: true };
      if (side) return { ok: false, msg: 'The first bond along the line between the two atoms is not made yet.' };
      return { ok: false, msg: 'The two atoms are joined end to end already. Look at the orbital each carbon has left over.' };
    },
    reward: {
      log: 'End to end, then side to side.',
      title: 'Sigma and Pi Bonds',
      body: 'Overlap end to end along the line between the atoms makes a sigma bond. Overlap side to side of leftover p orbitals, above and below the line, makes a pi bond, so a double bond is one sigma and one pi.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    title: 'Counting Bonds',
    prompt: 'Build every bond in hydrogen cyanide from the orbitals of its three atoms.',
    widget: { type: 'table', label: 'The bench' },
    table: domainTable({
      pieces: [
        orb('h', 's', 'h', { x: 18, y: 34 }, { e: 1, label: 'H' }),
        orb('cl_h', 'sp', 'c', { x: 46, y: 32 }, { e: 1, to: 'h', dir: Math.PI }), orb('cl_n', 'sp', 'c', { x: 76, y: 32 }, { e: 1, to: 'n', dir: 0 }),
        orb('cpy', 'p', 'c', { x: 61, y: 15 }, { e: 1, axis: 'y', to: 'n', label: 'py' }), orb('cpz', 'p', 'c', { x: 61, y: 49 }, { e: 1, axis: 'z', to: 'n', label: 'pz' }),
        orb('nl_c', 'sp', 'n', { x: 104, y: 32 }, { e: 1, to: 'c', dir: Math.PI }), orb('nl_x', 'sp', 'n', { x: 132, y: 32 }, { e: 2, dir: 0 }),
        orb('npy', 'p', 'n', { x: 118, y: 15 }, { e: 1, axis: 'y', to: 'c', label: 'py' }), orb('npz', 'p', 'n', { x: 118, y: 49 }, { e: 1, axis: 'z', to: 'c', label: 'pz' })
      ],
      fixtures: [
        plate('ph', 'Hydrogen', { x: 18, y: 32 }, { w: 30, h: 56 }), plate('pc', 'Carbon', { x: 61, y: 32 }, { w: 52, h: 56 }), plate('pn', 'Nitrogen', { x: 118, y: 32 }, { w: 52, h: 56 })
      ]
    }),
    hints: [
      'Drop each orbital that holds a single electron on the orbital of another atom that points back at it.',
      'Compare the orbitals that join end to end with the ones that join side by side, and count what is left over.',
      'Every arm holds one end-to-end bond, and each pair past the first in it is a side-by-side bond.'
    ],
    check(state) {
      const b = bondsBuilt(state.table);
      const real = countSigmaPi('HCN');
      if (!b.pairs.length) return { ok: false, notYet: true, msg: 'Overlap some of the orbitals.' };
      if (b.sigma === real.sigma && b.pi === real.pi) return { ok: true };
      return { ok: false, msg: 'An orbital that holds a single electron has not been overlapped yet, so a bond is still missing.' };
    },
    reward: {
      log: 'Each arm is one sigma bond.',
      title: 'Counting Sigma and Pi',
      body: 'Every bond has exactly one sigma bond, and each extra pair in a double or triple bond is a pi bond. HCN has two sigma bonds and two pi bonds, both in its triple bond.'
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    title: 'Twisting',
    prompt: 'Turn the far end of each bond a quarter turn, if it will.',
    widget: { type: 'table', label: 'The bench' },
    table: domainTable({
      fixtures: [twist('tw1', { x: 37, y: 32 }, 'single', { label: 'C₂H₆', size: { w: 62, h: 50 } }), twist('tw2', { x: 105, y: 32 }, 'double', { label: 'C₂H₄', size: { w: 62, h: 50 } })]
    }),
    hints: [
      'Turn the far end of each bond with its dial and watch what each does.',
      'Compare which dial stays where you put it and which springs back.',
      'The bond whose far end keeps turning when you twist it is the one that lets it.'
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
      body: 'A single bond is one sigma bond, which looks the same from every angle, so the atoms at its ends turn freely. A double bond\'s pi overlap would be broken by any turn, so its rotation is restricted.'
    }
  },

  /* ---------------------------------------------------------------- 8 */
  (() => {
    const held = (prefix, atom, bowl) => ['s', 'px', 'py', 'pz'].map(k => ({
      ...orb(`${prefix}${k}`, k[0], atom, { x: 0, y: 0 }, { e: k === 's' ? 2 : k === 'pz' ? 0 : 1, ...(k[0] === 'p' ? { axis: k[1] } : {}), label: k }), zone: `container:${bowl}-bowl`
    }));
    const a = mixbowl('ma', { x: 50, y: 16 }, { size: { w: 98, h: 32 }, hub: 'P', label: 'Mixer for PCl₅', dy: 3, out: { x: 76, y: 17, L: 10 } });
    const b = mixbowl('mb', { x: 50, y: 48 }, { size: { w: 98, h: 32 }, hub: 'S', label: 'Mixer for SF₆', dy: 3, out: { x: 76, y: 49, L: 10 } });
    return {
      title: 'Past Four',
      prompt: 'Mix the orbitals of each central atom to give it one lobe for every arm on its card.',
      widget: { type: 'table', label: 'The bench' },
      table: domainTable({
        pieces: [
          ...held('a', 'P', 'ma'), ...held('b', 'S', 'mb'),
          ...[1, 2, 3, 4].map(i => ({ ...orb(`d${i}`, 'd', i < 3 ? 'P' : 'S', { x: 0, y: 0 }, { e: 0, label: 'd' }), zone: 'tray:td' })),
          molCard('ca', 'PCl5', { x: 111, y: 16 }, { show: ['arms'] }), molCard('cb', 'SF6', { x: 111, y: 48 }, { show: ['arms'] })
        ],
        zones: {
          containers: [a.bowl, b.bowl],
          trays: [{ id: 'td', label: 'd orbitals', at: { x: 137, y: 32 }, size: { w: 26, h: 26 }, cell: 13 }]
        },
        fixtures: [a.fixture, b.fixture]
      }),
      hints: [
        'Read the lobes each bowl makes with the orbitals it holds, then add more orbitals from the tray one at a time.',
        'Compare the lobes each bowl makes with the arms on its card, and with the most an s orbital and three p orbitals can make.',
        'Each arm needs one lobe, so count the orbitals that must join the blend beyond the four already used.'
      ],
      check(state) {
        const t = state.table;
        const ra = bowlRead(t, 'ma');
        const rb = bowlRead(t, 'mb');
        if (ra.d + rb.d === 0) return { ok: false, notYet: true, msg: 'Add orbitals from the tray to a bowl.' };
        const wantA = molRead(t.pieces.ca).domains;
        const wantB = molRead(t.pieces.cb).domains;
        if (ra.lobes === wantA && rb.lobes === wantB) return { ok: true };
        return { ok: false, msg: 'A bowl\'s lobes do not match the arms on its card. An s orbital and three p orbitals can make four lobes and no more.' };
      },
      reward: {
        log: 'The d orbitals join the blend.',
        title: 'sp³d and sp³d²',
        body: 'Five domains need five hybrid orbitals and six need six, so d orbitals join the blend: sp³d for PCl₅ and sp³d² for SF₆. This goes beyond the exam.'
      }
    };
  })()
];

/** How-to lines printed on the plate (`table/notes.js` places each block clear of everything else on the table). */
const NOTES = {
  2: ['Drop orbitals in the bowl to mix them.']
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
      body: 'A hub blends its orbitals into as many hybrid orbitals as it has domains: four for sp³, three for sp² and two for sp. The p orbitals left over make pi bonds, which is why double and triple bonds hold their ends still.'
    },
    {
      heading: 'Why It Is Worth It',
      body: 'From a Lewis structure you can now say the shape, the hybridization of the centre, and how many sigma and pi bonds it holds.'
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
    question: '(Beyond the exam.) What is the hybridization of sulfur in SF₆?',
    options: [
      { id: 'a', label: 'sp³d²' },
      { id: 'b', label: 'sp³d' },
      { id: 'c', label: 'sp³' },
      { id: 'd', label: 'sp²' }
    ],
    answer: 'a',
    explanation: 'Sulfur has six domains, so it blends one s, three p and two d orbitals into six sp³d² orbitals.'
  }
];

/* ------------------------------------------------------------------
   SOLUTIONS AND MISSES — SCRIPTS OF THE PLAYER'S OWN ACTIONS
   A solution is what a player does, not what the table ends as: `verify:table` replays each one through the reducer by
   direct actions, by drag and by two taps. An orbital is dropped on another (`bond`), in a bowl (`mix`) or a card in a tray
   (`into`), a knob is turned (`turn`): nothing here says what a bowl makes or whether a bond turns.
   ------------------------------------------------------------------ */

const bond = (a, b) => ({ join: [a, b] });
const mix = (id, bowl) => ({ place: { piece: id, to: `container:${bowl}-bowl` } });
const into = (id, zone) => ({ place: { piece: id, to: `tray:${zone}` } });
const turn = (fixture, value) => ({ setDial: { fixture, dial: 'turn', value } });

/** The bench state that solves each stage, in order. Checked by verify:learn and verify:table. */
export const SOLUTIONS = [
  [bond('h1', 'cpx'), bond('h2', 'cpy')],
  ['os', 'opx', 'opy', 'opz'].map(id => mix(id, 'mx')),
  [into('a', 'four'), into('b', 'four'), into('c', 'three')],
  [into('a', 'two'), into('b', 'three'), into('c', 'two')],
  [bond('a1', 'b1'), bond('ap', 'bp')],
  [bond('h', 'cl_h'), bond('cl_n', 'nl_c'), bond('cpy', 'npy'), bond('cpz', 'npz')],
  [turn('tw1', 90), turn('tw2', 90)],
  [mix('d1', 'ma'), mix('d3', 'mb'), mix('d4', 'mb')]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [bond('h1', 'cpx')],
  [mix('os', 'mx'), mix('opx', 'mx')],
  [into('a', 'three'), into('b', 'four'), into('c', 'three')],
  [into('a', 'two'), into('b', 'two'), into('c', 'two')],
  [bond('a1', 'b1')],
  [bond('h', 'cl_h'), bond('cl_n', 'nl_c')],
  [turn('tw1', 60), turn('tw2', 90)],
  [mix('d3', 'mb'), mix('d4', 'mb')]
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
