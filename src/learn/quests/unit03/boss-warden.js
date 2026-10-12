/**
 * boss-warden.js — Learn world 3 elite: THE BASALT WARDEN.
 *
 * The world's last guard, made of everything Ligar measured. Five phases, each on
 * the real instrument of a bench the player has worked, with a new molecule or a
 * new set of salts on the plate and the warden standing in the well, reading it:
 *
 *   1  the bond bench      three lattices, and which needs the most heat        (bench 3)
 *   2  the pair board      SF4, every lamp lit, sulfur past eight               (bench 4)
 *   3  the domain rig      XeF4's hub, and the angle between neighbours        (bench 6)
 *   4  the charged plates  which of three molecules turns                       (bench 7)
 *   5  the molecular rack  which of three gases the magnet pulls                (bench 9)
 *
 * The fight keeps every rule a bench stage keeps. A phase prompt states the
 * objective and never the route. A hint rung is one sentence and never the
 * answer. Nothing blocks a correct commit. A miss costs one point of Integrity
 * and three knock the rig back, with every reading and hint still kept.
 *
 * Clearing it files the Case File clue `clue_ligar_scorch`. The boss pays no XP:
 * the main story never does.
 */

import { BondBench, PairBoard, DomainRig, BoxRack } from '../../engine/instruments.js';
import { createRunner, blankAnswer } from '../../engine/stagerunner.js';
import { pairKeys, paintPairHand, describeBoard, boardState, litCount } from '../../engine/paircontrols.js';
import { hubKeys, fieldKeys, paintRigHand, paintToggle, describeRig } from '../../engine/rigcontrols.js';
import { handKeys, paintHand } from '../../engine/rackcontrols.js';
import { pullWords } from '../../engine/magnetnotes.js';
import { LATTICES, byLatticeEnergy } from '../../engine/bonddata.js';
import { MOLECULES, DRAWINGS, planLewis, allLit, blankDrawing } from '../../engine/lewis.js';
import { planDomains, planDipole, bondAngles } from '../../engine/vsepr.js';
import { DIATOMICS } from '../../engine/mo.js';
import { session } from '../../../session.js';

export const meta = { stageCount: 5 };

export const BUILDS_ON = [
  'unit03/q3-distance', 'unit03/q4-dots', 'unit03/q6-shape', 'unit03/q7-polarity', 'unit03/q9-orbitals'
];

const SPEAKER = 'Vess';

const TOOL_TEXT = {
  hand: { key: 'Where the next pair goes', what: 'Each tap puts two electrons from the tray into the slot between two atoms or onto one atom.' },
  arms: { key: 'Arms', what: 'Pick an arm, then tap the hub to clip it on.' },
  protractor: { key: 'Protractor', what: 'Tap two arms to read the angle between them.' },
  arrows: { key: 'Show Arrows', what: 'Draws an arrow across each bond toward the atom that pulls the pair harder.' },
  rackhand: { key: 'Up, Down, Remove', what: 'Pick what the next tap on a box does: place an up arrow, place a down arrow, or lift one out.' },
  magnet: { key: 'Test Sample', what: 'Holds the real molecules to the magnet and reports how hard each is pulled.' }
};
export function toolNoteFor(controlId) { return TOOL_TEXT[controlId] || null; }

const lattice = (id, label, key) => ({ id, label, head: 'lattice', lattice: key, note: 'a block of the warden\'s plating' });
const slate = (id, label, mol) => ({ id, label, head: 'slate', mol, note: 'the gas the warden vents' });
const hub = (id, label, sym, stock, note) => ({ id, label, head: 'hub', hub: sym, stock, note });
const field = (id, label, mol, note) => ({ id, label, head: 'field', mol, note });
const rack = (id, label, mol) => ({
  id, label, head: 'rack', layout: 'molecular', mol, order: DIATOMICS[mol].order,
  molLabel: DIATOMICS[mol].label, atomLabel: DIATOMICS[mol].label.replace(/[₂]/g, ''), note: 'a gas the warden\'s core is cooled with'
});
const atoms = (id, sym, n, label) => ({ id, kind: 'atom', sym, mult: 1, n, label });
const lone = n => ({ id: 'l', kind: 'lone', n, label: 'Lone Pair' });

/* ------------------------------------------------------------------
   THE FIVE PHASES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    title: 'Phase 1 · The Plating',
    briefing: {
      speaker: SPEAKER,
      body: 'This is the warden Ligar guards itself with, and each phase puts one of the benches in front of it again. A miss costs the rig a point of Integrity; three knock it back, and nothing you have read is lost.'
    },
    bench: 'bond',
    prompt: 'The colossal basalt warden blocks the quarry gate! Which plating block has the highest lattice energy and requires the most intense heat to melt?',
    controls: [],
    rigs: [lattice('a', 'PLATE A', 'NaCl'), lattice('b', 'PLATE B', 'MgO'), lattice('c', 'PLATE C', 'KCl')],
    widget: { type: 'choice', label: 'The plate', options: [{ id: 'a', label: 'Plate A' }, { id: 'b', label: 'Plate B' }, { id: 'c', label: 'Plate C' }] },
    encounter: {
      species: 'basalt warden',
      act: 'Name Plate',
      intent: 'A basalt warden stands over three blocks of its own plating.'
    },
    hints: [
      'Tap each plate to read its ions and watch how the warden answers.',
      'Compare the charges on the ions of the three plates, and then the distance between their centres.',
      'The lattice held hardest by charge and by closeness is the one that takes the most heat.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Choose a plate.' };
      const hot = byLatticeEnergy(['NaCl', 'MgO', 'KCl'])[0];
      const id = { NaCl: 'a', MgO: 'b', KCl: 'c' }[hot];
      if (state.choice === id) return { ok: true };
      return { ok: false, msg: 'A plate that is held less tightly gives its ions up at a lower temperature. Read the ions again.' };
    },
    reward: {
      title: 'Plating Cracked',
      body: 'The lattice with the larger charges on smaller ions is held hardest, and it takes the most heat to melt. The warden\'s plating gives where it is held least.',
      log: 'The most tightly held lattice found.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    title: 'Phase 2 · The Vent',
    bench: 'pair',
    prompt: 'The warden vents pressurized SF₄ gas from its armored mantle! Place all of sulfur tetrafluoride\'s valence electrons until every lamp glows to seal the vent.',
    controls: ['hand', 'clear'],
    rigs: [slate('a', 'PLATE A', 'SF4')],
    widget: { type: 'none' },
    encounter: {
      species: 'basalt warden',
      act: 'Seal Vent',
      intent: 'The warden vents a thin stream and its seams stand shut.'
    },
    hints: [
      'Pick where the next pair goes, then fill the slots between the atoms first.',
      'Compare the lamps on the fluorine atoms with the lamp on sulfur as the tray runs down.',
      'Put the pairs that are left after the bonds and the fluorine atoms are done onto sulfur.'
    ],
    check(state) {
      const mol = MOLECULES.SF4;
      const read = planLewis(mol, state.boards?.a || blankDrawing(), state.charges?.a ?? 0);
      if (read.total - read.left === 0) return { ok: false, notYet: true, msg: 'Place the tray\'s electrons on the slate.' };
      if (allLit(read)) return { ok: true };
      if (read.left > 0) return { ok: false, msg: 'Electrons are still in the tray, and a lamp is still dark.' };
      return { ok: false, msg: 'The tray is empty but a lamp is still dark, or an atom has more round it than it can hold.' };
    },
    reward: {
      title: 'Vent Sealed',
      body: 'Sulfur takes four bonds and keeps a lone pair, ten electrons in all. Atoms on the third ring and below can hold more than eight.',
      log: 'SF4 drawn with sulfur past eight.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    title: 'Phase 3 · The Joints',
    bench: 'rig',
    prompt: 'The warden\'s limb joints are geared with square planar XeF₄ crystals. What is the bond angle between adjacent fluorine atoms on this hub?',
    controls: ['arms', 'protractor'],
    rigs: [hub('a', 'HUB A', 'Xe', [atoms('f', 'F', 4, 'Fluorine'), lone(2)], 'xenon with four fluorine atoms and two lone pairs')],
    widget: {
      type: 'choice', label: 'Angle',
      options: [{ id: '90', label: '90°' }, { id: '109.5', label: '109.5°' }, { id: '120', label: '120°' }, { id: '180', label: '180°' }]
    },
    encounter: {
      species: 'basalt warden',
      act: 'Read Angle',
      intent: 'The warden stands with its columns held square.'
    },
    hints: [
      'Clip on the four fluorine atoms and both lone pairs, then use the protractor on two neighbours.',
      'Compare where the lone pairs settle with where the fluorine atoms settle.',
      'The fluorine atoms lie in a flat square once the lone pairs are opposite each other.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Choose an angle.' };
      if (state.choice === '90') return { ok: true };
      return { ok: false, msg: 'Build the hub and read the protractor between two fluorine atoms that sit next to each other.' };
    },
    reward: {
      title: 'Joints Locked',
      body: 'Six domains with two lone pairs opposite leave the four atoms in a flat square, 90 degrees apart. XeF₄ is square planar.',
      log: 'XeF4 built square.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    title: 'Phase 4 · The Coolant',
    bench: 'rig',
    prompt: 'The warden draws coolant from three gas feeds! Select every polar molecule that rotates in the electric field so we can short-circuit the coolant line.',
    controls: ['field', 'arrows'],
    rigs: [
      field('a', 'PLATE A', 'CO2', 'carbon dioxide'),
      field('b', 'PLATE B', 'SF4', 'sulfur tetrafluoride'),
      field('c', 'PLATE C', 'NH3', 'ammonia')
    ],
    widget: {
      type: 'multi', label: 'Turns in the field',
      options: [{ id: 'a', label: 'Plate A' }, { id: 'b', label: 'Plate B' }, { id: 'c', label: 'Plate C' }]
    },
    encounter: {
      species: 'basalt warden',
      act: 'Pick Turners',
      intent: 'The warden stands between the plates, with a coolant line to each molecule.'
    },
    hints: [
      'Switch the field on and show the arrows.',
      'Compare the net arrow on each plate once the bond arrows are added.',
      'A molecule turns when its bond arrows add to a net arrow and stays still when they cancel.'
    ],
    check(state) {
      if (!state.picks.length) return { ok: false, notYet: true, msg: 'Pick the molecules that turn.' };
      const want = ['b', 'c'];
      const got = state.picks.slice().sort();
      if (got.join() === want.join()) return { ok: true };
      return { ok: false, msg: 'Switch the field on and watch which plates do not move, then check your picks against them.' };
    },
    reward: {
      title: 'Coolant Grounded',
      body: 'Sulfur tetrafluoride and ammonia have a net pull because their shapes are lopsided, so they turn. Carbon dioxide\'s pulls cancel in a straight line, so it does not.',
      log: 'Two polar molecules and one nonpolar one found.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    title: 'Phase 5 · The Core',
    bench: 'rack',
    prompt: 'The warden\'s inner core is shielded behind mystery gas canisters! Which gas is paramagnetic and drawn toward the magnetic field?',
    controls: ['rackhand', 'magnet'],
    counts: true,
    rigs: [rack('a', 'PLATE A', 'N2'), rack('b', 'PLATE B', 'O2'), rack('c', 'PLATE C', 'F2')],
    widget: { type: 'pick', label: 'The gas', help: 'Tap a plate on the bench to pick it.' },
    encounter: {
      species: 'basalt warden',
      act: 'Pick Gas',
      intent: 'The warden stands over three gas lines, none of them marked.'
    },
    hints: [
      'Test the samples with the magnet and fill each rack from the bottom up.',
      'Compare the electrons standing alone in a box on each rack.',
      'Electrons that stand alone in a box are the ones a magnet pulls.'
    ],
    check(state) {
      if (!state.sample) return { ok: false, notYet: true, msg: 'Tap a plate to pick it.' };
      if (state.sample === 'b') return { ok: true };
      return { ok: false, msg: 'Test all three samples with the magnet and compare what each does.' };
    },
    reward: {
      title: 'Core Exposed',
      body: 'Only oxygen has electrons standing alone, in two separate antibonding boxes, so only oxygen is pulled by the magnet. Nitrogen and fluorine have every electron paired.',
      log: 'The paramagnetic gas found.'
    }
  }
];

/* ------------------------------------------------------------------
   THE DEBRIEF
   ------------------------------------------------------------------ */
export const DEBRIEF = {
  speaker: SPEAKER,
  clueAwarded: 'clue_ligar_scorch',
  sections: [
    {
      heading: 'What You Found',
      body: 'The warden settles back into quarry stone. Look at the cut behind it: that face was sliced clean through ionic and covalent rock alike, with heat no refinery torch the Guilds ever chartered could make.'
    },
    {
      heading: 'Why It Is Worth It',
      body: 'Every phase was a bench you had already worked: a lattice, a Lewis structure, a shape, a field and a magnet. That is all of Ligar, and it was enough to read the guard.'
    },
    {
      heading: 'Next',
      body: 'The slab behind the warden goes into the Case File. Whoever made that cut was not working with bonds at all.'
    }
  ]
};

/* ------------------------------------------------------------------
   PRACTICE PROBLEMS
   ------------------------------------------------------------------ */
export const PRACTICE = [
  {
    question: 'Which of these ionic solids would you expect to have the highest melting point?',
    options: [
      { id: 'a', label: 'MgO' },
      { id: 'b', label: 'NaCl' },
      { id: 'c', label: 'KCl' },
      { id: 'd', label: 'NaI' }
    ],
    answer: 'a',
    explanation: 'Lattice energy rises with ion charge and falls with ion size. MgO has 2+ and 2− ions that are small, so it is held hardest and melts highest.'
  },
  {
    question: 'In the Lewis structure of SF₄, how many lone pairs are on sulfur?',
    options: [
      { id: 'a', label: 'One' },
      { id: 'b', label: 'None' },
      { id: 'c', label: 'Two' },
      { id: 'd', label: 'Three' }
    ],
    answer: 'a',
    explanation: 'SF₄ has 34 valence electrons. Four bonds and twelve lone pairs on the fluorine atoms use 32, leaving one lone pair on sulfur.'
  },
  {
    question: 'What is the F–Xe–F angle between neighbouring fluorine atoms in XeF₄?',
    options: [
      { id: 'a', label: '90°' },
      { id: 'b', label: '109.5°' },
      { id: 'c', label: '120°' },
      { id: 'd', label: '180°' }
    ],
    answer: 'a',
    explanation: 'XeF₄ is square planar: six domains, with the two lone pairs opposite, so neighbouring atoms are 90 degrees apart.'
  },
  {
    question: 'Which of these molecules is polar?',
    options: [
      { id: 'a', label: 'NH₃' },
      { id: 'b', label: 'CO₂' },
      { id: 'c', label: 'XeF₄' },
      { id: 'd', label: 'BF₃' }
    ],
    answer: 'a',
    explanation: 'Ammonia is trigonal pyramidal, so its bond dipoles add. The other three are symmetrical and their dipoles cancel.'
  },
  {
    question: 'Which diatomic molecule is paramagnetic?',
    options: [
      { id: 'a', label: 'O₂' },
      { id: 'b', label: 'N₂' },
      { id: 'c', label: 'F₂' },
      { id: 'd', label: 'H₂' }
    ],
    answer: 'a',
    explanation: 'O₂ has two unpaired electrons in separate π* orbitals. N₂, F₂ and H₂ have every electron paired.'
  }
];

/* ------------------------------------------------------------------
   BENCH STATE
   ------------------------------------------------------------------ */
function blankState(stage) {
  return stage.bench === 'pair' ? boardState(stage.rigs) : {};
}

export const SOLUTIONS = [
  { choice: 'b' },
  { boards: { a: DRAWINGS.SF4 } },
  { choice: '90' },
  { picks: ['b', 'c'] },
  { sample: 'b' }
];

export const MISSES = [
  { choice: 'a' },
  { boards: { a: { bonds: { '0-1': 1, '0-2': 1, '0-3': 1, '0-4': 1 }, lone: {}, dots: {} } } },
  { choice: '120' },
  { picks: ['a', 'b'] },
  { sample: 'a' }
];

export function stateFor(i, overrides) {
  const base = { ...blankAnswer(STAGES[i]), ...blankState(STAGES[i]) };
  return { ...base, ...overrides, boards: { ...base.boards, ...(overrides?.boards || {}) } };
}

/* ==================================================================
   THE GAME
   ================================================================== */

export function mount(container, ctx) {
  let bench = null;
  let benchKind = null;
  let runner = null;
  let fieldOn = false;
  let arrowsOn = false;

  /** The warden of every plate, told what its plate reads. */
  function reactAll(quiet = false) {
    const stage = runner.stage;
    for (const rig of stage.rigs) {
      let probe = null;
      if (rig.head === 'lattice') probe = bench.itemFor(rig.id)?.tapped ? { rig: 'hold', lattice: rig.lattice } : null;
      else if (rig.head === 'slate') {
        const read = bench.readOf(rig.id);
        probe = { rig: 'lamps', lit: litCount(read), of: read.atoms.length };
      } else if (rig.head === 'hub') probe = { rig: 'arms', arms: bench.armsOf(rig.id) };
      else if (rig.head === 'field') probe = { rig: 'field', mol: rig.mol, on: fieldOn };
      else if (rig.head === 'rack') probe = bench.itemFor(rig.id)?.tested ? { rig: 'pull', unpaired: DIATOMICS[rig.mol].unpaired } : null;
      if (probe) runner.frame.foeReact(rig.id, probe, quiet);
    }
  }

  function paintAll() {
    const host = runner.frame.el.controls;
    if (benchKind === 'pair') paintPairHand(host, bench.cfg.hand);
    else if (benchKind === 'rig') { paintRigHand(host, bench.cfg.hand); paintToggle(host, 'field', fieldOn); paintToggle(host, 'arrows', arrowsOn); }
    else if (benchKind === 'rack') paintHand(host, bench.cfg.hand, false);
  }

  function onProbe(hit) {
    if (hit.kind === 'hand') { paintAll(); return; }
    if (hit.kind === 'lattice') {
      const item = bench.itemFor(hit.plateId ?? runner.stage.rigs.find(r => r.lattice === hit.lattice)?.id);
      if (item) item.tapped = true;
      const c = hit.cation; const a = hit.anion;
      const q = n => `${n > 0 ? '+' : '−'}${Math.abs(n)}`;
      runner.readout(`Plate // ${hit.lattice}`, `${c.sym} ${q(c.charge)}, ${c.radius} pm. ${a.sym} ${q(a.charge)}, ${a.radius} pm. Centres ${hit.centres} pm apart.`);
      reactAll();
    } else if (hit.kind === 'board') {
      runner.state.boards[hit.plateId] = hit.placed;
      const d = describeBoard(hit, bench.itemFor(hit.plateId));
      runner.readout(d.head, d.body);
      reactAll(); paintAll();
    } else if (hit.kind === 'rig' || hit.kind === 'protractor') {
      const d = describeRig(hit);
      if (d.body) runner.readout(d.head, d.body);
      if (hit.kind === 'rig') reactAll();
      paintAll();
    } else if (hit.kind === 'field' || hit.kind === 'arrows') {
      fieldOn = bench.cfg.field; arrowsOn = bench.cfg.arrows;
      paintAll(); reactAll();
    } else if (hit.kind === 'rack') {
      const d = hit.action === 'refused' ? { head: 'Rack // refused', body: hit.reason } : { head: 'Rack // placed', body: 'One electron placed.' };
      runner.readout(d.head, d.body);
    }
  }

  function onTool(tool) {
    if (tool.startsWith('hand:')) {
      bench.setHand?.(tool.slice(5));
      paintAll();
    } else if (tool === 'clear') {
      bench.clear?.();
      for (const rig of runner.stage.rigs) {
        if (benchKind === 'pair') runner.state.boards[rig.id] = bench.placedOf(rig.id);
      }
      reactAll(true);
    } else if (tool === 'turn') {
      bench.turn?.();
    } else if (tool === 'field') {
      fieldOn = !fieldOn; bench.setField?.(fieldOn); paintAll(); reactAll();
    } else if (tool === 'arrows') {
      arrowsOn = !arrowsOn; bench.setArrows?.(arrowsOn); paintAll();
    } else if (tool === 'magnet-sample') {
      const lines = [];
      for (const rig of runner.stage.rigs) {
        const m = bench.measured?.(rig.id) ?? 0;
        bench.pull?.(rig.id, m);
        const item = bench.itemFor(rig.id);
        if (item) item.tested = true;
        lines.push(`${rig.label}: ${pullWords(m)}`);
      }
      runner.readout('Magnet // samples', lines.join(' '));
      reactAll();
    }
  }

  /** Stand the instrument this phase needs, and take the last phase's down. */
  function ensureBench(kind, r) {
    if (benchKind === kind) return;
    bench?.dispose();
    const host = r.frame.instrumentHost;
    if (kind === 'bond') bench = BondBench(host, { onProbe, onSetting: () => {} });
    else if (kind === 'pair') bench = PairBoard(host, { onProbe });
    else if (kind === 'rig') bench = DomainRig(host, { onProbe });
    else bench = BoxRack(host, { onProbe, onSelect: id => runner.pick(id) });
    benchKind = kind;
  }

  function onLoad(stage, i, r) {
    ensureBench(stage.bench, r);
    fieldOn = false; arrowsOn = false;
    const parts = [];
    if (stage.bench === 'bond') {
      bench.setPlates(stage.rigs, { settings: [], setting: 1 });
      bench.setSelectable(false);
      r.readout(null, null, { idleHead: 'Plates // standby', idle: 'Tap a plate to read its ions.' });
    } else if (stage.bench === 'pair') {
      bench.setPlates(stage.rigs, { hands: ['bond', 'lone', 'x'] });
      bench.setSelectable(false);
      parts.push(...pairKeys({ earned: true }));
      r.readout(null, null, { idleHead: 'Slate // standby', idle: 'Pick where the next pair goes, then tap the slate.' });
    } else if (stage.bench === 'rig') {
      bench.setPlates(stage.rigs, { field: false, arrows: false });
      bench.setSelectable(false);
      parts.push(...(stage.controls.includes('field') ? fieldKeys() : hubKeys(stage)));
      r.readout(null, null, { idleHead: 'Plate // standby', idle: stage.controls.includes('field') ? 'The plates are off. Switch the field on.' : 'Pick an arm, then tap the hub.' });
    } else {
      bench.setPlates(stage.rigs, { show: { counts: true }, hand: null });
      bench.setSelectable(true);
      parts.push(handKeys({ clear: true, core: false }));
      parts.push(`
        <div class="cb-field" role="group" aria-label="Magnet">
          <button type="button" class="btn-secondary quest-btn-sm lq-tool" data-tool="magnet-sample">Test Sample</button>
        </div>`);
      r.readout(null, null, { idleHead: 'Rack // standby', idle: 'Pick a hand, then tap a box.' });
    }
    r.setControls(parts, onTool);
    paintAll();
    reactAll(true);
  }

  // Clearing the last phase files the clue. The boss pays no XP, so this is not a rail.
  const bossCtx = {
    ...ctx,
    reportComplete() {
      ctx.reportComplete();
      session.recordClue?.(DEBRIEF.clueAwarded);
    }
  };

  runner = createRunner(container, bossCtx, {
    STAGES, DEBRIEF, blankState, toolNoteFor,
    setup: () => {},
    onLoad,
    onDispose: () => bench?.dispose()
  });

  runner.start();
  return { dispose: () => runner.dispose() };
}

export { planDomains, planDipole, bondAngles, LATTICES };
