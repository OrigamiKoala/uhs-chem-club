/**
 * q8-hybrid.js — Ligar, bench eight: HYBRIDIZATION.
 *
 * The domain rig's last two heads. A MIXER blends the hub's s orbital with
 * one, two or three of its p orbitals and shows the lobes that result and the p
 * orbitals left over. A TWIST key turns one end of a bond to find whether it will.
 *
 *   1  why carbon's orbitals cannot explain methane          -> (the puzzle)
 *   2  blend carbon's orbitals to match four arms              -> hybrid orbital, sp3
 *   3  sort NH3, H2O and C2H4 by the lobes they need      -> sp2 (a lone pair is an arm)
 *   4  sort CO2, BF3 and HCN the same way                -> sp (a multiple bond is one arm)
 *   5  how ethene's second bond is built                     -> sigma bond, pi bond
 *   6  count the sigma and pi bonds in HCN                   -> (each arm is one sigma)
 *   7  twist ethane, then ethene                             -> restricted rotation
 *   8  how many orbitals PCl5 and SF6 need                     -> sp3d, sp3d2 (beyond the exam)
 *
 * THE MIXER FOLLOWS ONE RULE, which the player finds: as many hybrid lobes as the
 * hub has arms (`vsepr.planMix`). Stage eight carries it past what the mixer can
 * blend, and says so on its card.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { DomainRig } from '../../engine/instruments.js';
import { createRunner, blankAnswer } from '../../engine/stagerunner.js';
import { hubKeys, mixKeys, twistKeys, paintRigHand, paintMix, describeRig } from '../../engine/rigcontrols.js';
import { planMix, planTwist, planDomains, countSigmaPi, RIG_MOLECULES } from '../../engine/vsepr.js';

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

const TOOL_TEXT = {
  mix: { key: 'Blend', what: 'Blends the s orbital with the number of p orbitals that the key names.' },
  twist: { key: 'Twist', what: 'Turns one end of the bond to see whether it turns.' },
  protractor: { key: 'Protractor', what: 'Tap two arms to read the angle between them.' }
};
export function toolNoteFor(controlId) { return TOOL_TEXT[controlId] || null; }

const mixer = (id, label, extra = {}) => ({ id, label, head: 'mixer', hub: 'C', ...extra });
const twist = (id, label, bond, note) => ({ id, label, head: 'twist', bond, note });
const show = (id, label, mol, note) => ({ id, label, head: 'show', mol, locked: true, note });

/* ------------------------------------------------------------------
   THE EIGHT STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    title: 'The Puzzle',
    briefing: {
      speaker: SPEAKER,
      body: 'Compare the electron orbitals carbon has available with the four identical bonds found in methane.'
    },
    prompt: 'How do carbon’s unhybridized valence electrons compare with the four equivalent bonds in methane?',
    controls: [],
    rigs: [mixer('a', 'CARBON', { unpaired: 2, bonds: 4, noMix: true, note: 'a carbon atom as it stands, beside the bonds in CH₄' })],
    widget: {
      type: 'choice', label: 'Carbon',
      options: [
        { id: 'puzzle', label: 'Its orbitals allow two bonds, but methane has four' },
        { id: 'four', label: 'Its orbitals allow four bonds, and methane has four' },
        { id: 'two', label: 'Its orbitals allow two bonds, and methane has two' },
        { id: 'rev', label: 'Its orbitals allow four bonds, but methane has two' }
      ]
    },
    hints: [
      'Read the plate: it shows what carbon has to bond with and how many bonds methane has.',
      'Compare the number of electrons standing alone in a box with the number of bonds methane needs.',
      'Each bond needs one electron from the carbon, so count how many bonds the single electrons allow.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Choose a statement.' };
      if (state.choice === 'puzzle') return { ok: true };
      return { ok: false, msg: 'Read both figures on the plate, and match each to the right side of the statement.' };
    },
    reward: {
      log: 'The orbitals as they stand fall short.',
      title: 'Orbitals as They Stand Fall Short',
      body: 'Carbon\'s two single electrons would allow two bonds, but methane has four, all identical. So the orbitals cannot stay as they are when carbon bonds.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    title: 'Four Lobes',
    briefing: {
      speaker: SPEAKER,
      body: 'The mixer blends carbon\'s s orbital with some of its p orbitals and shows the lobes that come out.'
    },
    prompt: 'Which blend gives carbon one lobe for each of methane\'s bonds?',
    controls: ['mix'],
    rigs: [
      mixer('a', 'CARBON', { want: 4, note: 'the carbon of CH₄, with four hydrogen atoms to bond' }),
      show('m1', 'CH₄', 'CH4', 'methane: four single bonds = four domains')
    ],
    widget: { type: 'none' },
    hints: [
      'Try each blend key and read how many lobes the plate shows.',
      'Compare the number of lobes with the number of arms the plate says it needs.',
      'Blend the s orbital with enough p orbitals to make one lobe for every arm.'
    ],
    check(state) {
      if (!state.mix) return { ok: false, notYet: true, msg: 'Blend some orbitals.' };
      if (state.mix === 3) return { ok: true };
      return { ok: false, msg: 'The lobes do not match the arms the plate needs.' };
    },
    reward: {
      log: 'An s orbital and three p orbitals make four.',
      title: 'Hybrid Orbital, sp³',
      body: 'Blending one s orbital with three p orbitals gives four identical sp3 hybrid orbitals pointing at 109.5 degrees. Lone pairs occupy hybrid orbitals just as bonding pairs do.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    title: 'Count the Lobes',
    prompt: 'Sort each molecule by how many hybrid lobes its central atom needs.',
    controls: [],
    rigs: [
      show('m1', 'NH₃', 'NH3', 'ammonia'),
      show('m2', 'H₂O', 'H2O', 'water'),
      show('m3', 'C₂H₄', 'C2H4', 'ethene: look at one carbon')
    ],
    widget: {
      type: 'bins',
      bins: [
        { id: 'two', label: 'Two lobes', note: '' },
        { id: 'three', label: 'Three lobes', note: '' },
        { id: 'four', label: 'Four lobes', note: '' }
      ],
      rows: [
        { id: 'm1', label: 'NH₃' },
        { id: 'm2', label: 'H₂O' },
        { id: 'm3', label: 'C₂H₄' }
      ]
    },
    hints: [
      'Look at the arms on each plate and recall how many lobes the mixer made for each number of arms.',
      'Compare the plates with lone pairs against the plates with only bonds.',
      'Count every arm on the central atom, whatever the arm is made of.'
    ],
    check(state) {
      const want = { m1: 'four', m2: 'four', m3: 'three' };
      const b = state.bins || {};
      if (Object.keys(want).some(k => !b[k])) return { ok: false, notYet: true, msg: 'File all three molecules.' };
      const wrong = Object.keys(want).find(k => b[k] !== want[k]);
      if (wrong) return { ok: false, msg: `${{ m1: 'NH₃', m2: 'H₂O', m3: 'C₂H₄' }[wrong]} is filed wrongly: count the arms on its central atom, including any that are not bonds.` };
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
    prompt: 'Sort each molecule by how many hybrid lobes its central atom needs.',
    controls: [],
    rigs: [
      show('m1', 'CO₂', 'CO2', 'carbon dioxide'),
      show('m2', 'BF₃', 'BF3', 'boron trifluoride'),
      show('m3', 'HCN', 'HCN', 'hydrogen cyanide')
    ],
    widget: {
      type: 'bins',
      bins: [
        { id: 'two', label: 'Two lobes', note: '' },
        { id: 'three', label: 'Three lobes', note: '' },
        { id: 'four', label: 'Four lobes', note: '' }
      ],
      rows: [
        { id: 'm1', label: 'CO₂' },
        { id: 'm2', label: 'BF₃' },
        { id: 'm3', label: 'HCN' }
      ]
    },
    hints: [
      'Look at the arms on each plate and recall how many lobes the mixer made for each number of arms.',
      'Compare how a double or triple bond is drawn with how single bonds are drawn.',
      'A double or triple bond is a single arm, however many pairs it holds.'
    ],
    check(state) {
      const want = { m1: 'two', m2: 'three', m3: 'two' };
      const b = state.bins || {};
      if (Object.keys(want).some(k => !b[k])) return { ok: false, notYet: true, msg: 'File all three molecules.' };
      const wrong = Object.keys(want).find(k => b[k] !== want[k]);
      if (wrong) return { ok: false, msg: `${{ m1: 'CO₂', m2: 'BF₃', m3: 'HCN' }[wrong]} is filed wrongly: count the arms on its central atom, and remember what a multiple bond counts as.` };
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
    prompt: 'How does the second bond form between the two carbon atoms in ethene?',
    controls: [],
    rigs: [twist('a', 'C₂H₄', 'double', 'two carbon atoms joined by a double bond')],
    widget: {
      type: 'choice', label: 'The second bond',
      options: [
        { id: 'side', label: 'The leftover p orbitals overlap side to side' },
        { id: 'end', label: 'A second pair of hybrid lobes overlaps end to end' },
        { id: 'give', label: 'An electron is handed from one carbon to the other' },
        { id: 'round', label: 'The s orbitals overlap again' }
      ]
    },
    hints: [
      'Look at where the overlap is drawn on the plate.',
      'Compare the line along the bond with the rings above and below it.',
      'The first bond lies along the line between the atoms, so look for what lies off it.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Choose how it is built.' };
      if (state.choice === 'side') return { ok: true };
      if (state.choice === 'end') return { ok: false, msg: 'Each hybrid lobe is already used in the bond along the line. Look at what the plate shows above and below it.' };
      return { ok: false, msg: 'Look at where the plate draws the overlap that is not on the line between the atoms.' };
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
    prompt: 'How many sigma bonds and pi bonds are present in hydrogen cyanide?',
    controls: ['protractor'],
    rigs: [show('a', 'HCN', 'HCN', 'carbon with a hydrogen atom and a nitrogen atom joined by a triple bond')],
    widget: {
      type: 'choice', label: 'In HCN',
      options: [
        { id: '2-2', label: '2 sigma and 2 pi' },
        { id: '3-1', label: '3 sigma and 1 pi' },
        { id: '2-1', label: '2 sigma and 1 pi' },
        { id: '1-3', label: '1 sigma and 3 pi' }
      ]
    },
    hints: [
      'Read the arms the plate shows, and the bond joining each to carbon.',
      'Compare the number of arms with the number of bonds each arm is made of.',
      'Every arm holds one sigma bond, and each pair past the first in it is a pi bond.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Choose a count.' };
      if (state.choice === '2-2') return { ok: true };
      return { ok: false, msg: 'Count the arms for the sigma bonds, then count the extra pairs in each arm for the pi bonds.' };
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
    briefing: {
      speaker: SPEAKER,
      body: 'A bond torsion tool is now online. Press "Twist" to test whether atoms can spin freely around each type of bond.'
    },
    prompt: 'Which molecule allows free rotation around the carbon-carbon bond, ethane or ethene?',
    controls: ['twist'],
    rigs: [
      twist('a', 'C₂H₆', 'single', 'two carbon atoms joined by a single bond'),
      twist('b', 'C₂H₄', 'double', 'two carbon atoms joined by a double bond')
    ],
    widget: { type: 'choice', label: 'Turns freely', options: [{ id: 'a', label: 'C₂H₆' }, { id: 'b', label: 'C₂H₄' }, { id: 'both', label: 'Both' }] },
    hints: [
      'Press Twist and watch what each plate does.',
      'Compare which end moves on each plate when it is twisted.',
      'Pick the one whose far end keeps turning when you twist it.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Choose a molecule.' };
      if (state.choice === 'a') return { ok: true };
      return { ok: false, msg: 'Press Twist and watch which plate lets its far end turn and which will not.' };
    },
    reward: {
      log: 'A single bond turns; a double bond holds.',
      title: 'Restricted Rotation',
      body: 'A single bond is one sigma bond, which looks the same from every angle, so the atoms at its ends turn freely. A double bond\'s pi overlap would be broken by any turn, so its rotation is restricted.'
    }
  },

  /* ---------------------------------------------------------------- 8 */
  {
    title: 'Past Four',
    prompt: 'How many atomic orbitals must each central atom blend to accommodate five and six domains?',
    controls: ['protractor'],
    rigs: [
      show('a', 'PCl₅', 'PCl5', 'phosphorus with five chlorine atoms'),
      show('b', 'SF₆', 'SF6', 'sulfur with six fluorine atoms')
    ],
    widget: {
      type: 'choice', label: 'Orbitals to blend',
      options: [
        { id: 'dd', label: 'Five for PCl₅ (s, three p and one d) and six for SF₆ (s, three p and two d)' },
        { id: 'four', label: 'Four for both, an s orbital and three p orbitals' },
        { id: 'swap', label: 'Six for PCl₅ and five for SF₆' },
        { id: 'three', label: 'Three for PCl₅ and four for SF₆' }
      ]
    },
    hints: [
      'Count the arms on each hub.',
      'Compare the lobes each hub needs with the most that an s orbital and three p orbitals can make.',
      'Each arm needs one lobe, so count the orbitals that must join the blend beyond the four already used.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Choose an answer.' };
      if (state.choice === 'dd') return { ok: true };
      if (state.choice === 'four') return { ok: false, msg: 'An s orbital and three p orbitals can make four lobes and no more, and these hubs hold more arms.' };
      return { ok: false, msg: 'Match the number of orbitals to the number of arms on each hub.' };
    },
    reward: {
      log: 'The d orbitals join the blend.',
      title: 'sp³d and sp³d²',
      body: 'Five domains need five hybrid orbitals and six need six, so d orbitals join the blend: sp³d for PCl₅ and sp³d² for SF₆. This goes beyond the exam.'
    }
  }
];

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
   BENCH STATE
   ------------------------------------------------------------------ */
function blankState() { return { mix: null }; }

export const SOLUTIONS = [
  { choice: 'puzzle' },
  { mix: 3 },
  { bins: { m1: 'four', m2: 'four', m3: 'three' } },
  { bins: { m1: 'two', m2: 'three', m3: 'two' } },
  { choice: 'side' },
  { choice: '2-2' },
  { choice: 'a' },
  { choice: 'dd' }
];

export const MISSES = [
  { choice: 'two' },
  { mix: 2 },
  { bins: { m1: 'four', m2: 'three', m3: 'three' } },
  { bins: { m1: 'two', m2: 'two', m3: 'two' } },
  { choice: 'end' },
  { choice: '3-1' },
  { choice: 'b' },
  { choice: 'four' }
];

export function stateFor(i, overrides) {
  return { ...blankAnswer(STAGES[i]), ...blankState(STAGES[i]), ...overrides };
}

/* ==================================================================
   THE GAME
   ================================================================== */

export function mount(container, ctx) {
  let rig = null;
  let runner = null;

  function paintAll() {
    paintRigHand(runner.frame.el.controls, rig.cfg.hand);
    paintMix(runner.frame.el.controls, runner.state.mix);
  }

  /** Every warden answers the plate it was made from: the lobes blended, the arms held, the bond twisted. */
  function reactAll(quiet = false, twisted = null) {
    for (const r of runner.stage.rigs) {
      let probe = null;
      if (r.head === 'mixer' && runner.state.mix) probe = { rig: 'mix', p: runner.state.mix };
      else if (r.head === 'show') probe = { rig: 'arms', arms: rig.armsOf(r.id) };
      else if (r.head === 'twist' && twisted === r.id) probe = { rig: 'twist', bond: r.bond };
      if (probe) runner.frame.foeReact(r.id, probe, quiet);
    }
  }

  function onProbe(hit) {
    if (hit.kind === 'hand') { paintAll(); return; }
    if (hit.kind === 'mix') {
      runner.state.mix = hit.p;
      const m = planMix(hit.p);
      runner.readout('Mixer // blended', `${m.lobes} lobes, ${m.leftoverP} ${m.leftoverP === 1 ? 'orbital' : 'orbitals'} left over.`);
      reactAll(); paintAll();
    } else if (hit.kind === 'twist') {
      runner.readout('Bond // twisted', hit.free ? 'The far end turns.' : 'The far end will not turn.');
      reactAll(false, hit.plateId);
    } else {
      const d = describeRig(hit);
      if (d.body) runner.readout(d.head, d.body);
      paintAll();
    }
  }

  function onTool(tool) {
    if (tool.startsWith('hand:')) {
      rig.setHand(tool.slice(5));
      paintAll();
    } else if (tool.startsWith('mix:')) {
      const p = Number(tool.slice(4));
      rig.setMix(p);
      onProbe({ kind: 'mix', p });
    } else if (tool === 'twist') {
      for (const r of runner.stage.rigs) {
        const res = rig.twist(r.id);
        if (res) onProbe({ kind: 'twist', plateId: r.id, ...res });
      }
    } else if (tool === 'turn') {
      rig.turn();
    }
  }

  function onLoad(stage, i, r) {
    rig.setPlates(stage.rigs, { mix: null });
    rig.setSelectable(false);
    const parts = [];
    if (stage.controls.includes('mix')) parts.push(...mixKeys());
    if (stage.controls.includes('twist')) parts.push(...twistKeys());
    if (stage.controls.includes('protractor')) parts.push(...hubKeys({ rigs: [] }, { clear: false }).filter(p => p.includes('Protractor')));
    r.setControls(parts, onTool);
    paintAll();
    r.readout(null, null, {
      idleHead: 'Plate // standby',
      idle: stage.controls.includes('mix') ? 'Pick a blend.' : stage.controls.includes('twist') ? 'Press Twist.' : 'Read the plate.'
    });
    reactAll(true);
  }

  runner = createRunner(container, ctx, {
    STAGES, DEBRIEF, blankState, toolNoteFor,
    setup: r => { rig = DomainRig(r.frame.instrumentHost, { onProbe }); },
    onLoad,
    onDispose: () => rig?.dispose()
  });

  runner.start();
  return { dispose: () => runner.dispose() };
}

export { planDomains, countSigmaPi, RIG_MOLECULES, planTwist };
