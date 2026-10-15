/**
 * boss-eater.js — Learn world 2 Boss Encounter: The Lantern-Eater.
 *
 * An auroral entity feeding on the lamps of the Lanternfall ice field. Five phases,
 * each on the REAL instrument of a bench already worked and each a fresh specimen,
 * the way boss-warden is built:
 *   1  the prism and the energy ladder  (q3-lines)   which drop makes a given line
 *   2  the photocell                    (q2-photon)  which lamp frees electrons slowest
 *   3  the box rack and its magnet      (q6-filling) how many electrons stand alone
 *   4  the photoelectron bench          (q7-pes)     name a sealed atom from its peaks
 *   5  the calibration plot             (q9-absorb)  the strength of a sealed solution
 *
 * No prompt carries a figure the bench has to give: the answer in every phase is
 * read, compared or measured on the plate, and no readout here names it.
 * The eater only observes: its pose is read from the instrument's own planner
 * (`planPhotocell`, the absorbance on the plot) and never touches `check()`.
 *
 * Awards Case File clue: clue_lantern_lens.
 */

import { LightBench, BoxRack, ElectronBench } from '../../engine/instruments.js';
import { createRunner, blankAnswer } from '../../engine/stagerunner.js';
import { planPhotocell, planAbsorb, jumpForLine } from '../../engine/lightdata.js';
import { handKeys, paintHand, describeAct } from '../../engine/rackcontrols.js';
import { pullWords } from '../../engine/magnetnotes.js';
import { readRack } from '../../engine/electrons.js';
import { esc } from '../../../ui/layout.js';
import { session } from '../../../session.js';

export const meta = { stageCount: 5 };

export const BUILDS_ON = [
  'unit02/q1-wave', 'unit02/q2-photon', 'unit02/q3-lines',
  'unit02/q6-filling', 'unit02/q7-pes', 'unit02/q9-absorb'
];

export function toolNoteFor() { return null; }

const LABELS = { band: 'Band', spacing: 'Wavelength', rate: 'Frequency', count: 'Electrons freed per second', speed: 'Fastest electron', dial: 'Wavelength' };
const TUBE = (id, gas, label, note) => ({ id, label, head: 'prism', source: { type: 'tube', gas }, note });
const RACK_ROWS = ['1s', '2s', '2p'];

/** Three standards read through 1 cm at 630 nm, and the sealed sample's reading. */
const STANDARDS = [0.003, 0.006, 0.009].map(conc => ({ conc, abs: planAbsorb('cuso4', 630, 1, conc) }));
const SEALED_CONC = 0.0075;
const SEALED_ABS = planAbsorb('cuso4', 630, 1, SEALED_CONC);

/* ------------------------------------------------------------------
   THE FIVE PHASES
   ------------------------------------------------------------------ */

export const STAGES = [
  /* ---------------------------------------------------------------- Phase 1 */
  {
    id: 'phase1',
    title: 'The Eater\'s Lamp',
    bench: 'light',
    prompt: 'Which drop between rungs makes the eater lamp\'s 486 nm line?',
    labels: LABELS,
    controls: [],
    ladder: 'ladder',
    rigs: [
      TUBE('tube', 'H', 'EATER LAMP', 'H, glowing'),
      { id: 'ladder', label: 'LADDER', head: 'ladder', note: 'the rungs of hydrogen' }
    ],
    widget: {
      type: 'choice', label: 'The drop',
      options: [
        { id: 'j42', label: 'From the fourth rung to the second' },
        { id: 'j52', label: 'From the fifth rung to the second' },
        { id: 'j32', label: 'From the third rung to the second' },
        { id: 'j24', label: 'From the second rung to the fourth' }
      ]
    },
    encounter: {
      species: 'the lantern-eater',
      act: 'Trace Line',
      intent: 'The eater drinks the lamp\'s glow, one coloured line at a time.',
      hit: 'The eater loses the line it was feeding on and scatters into cold aurora.'
    },
    hints: [
      'Tap a bright line on the band and watch which rungs light on the ladder.',
      'Find the line at 486 nm among the bright ones and read the pair of rungs it lights.',
      'Remember that light leaves as an electron falls, so the start sits above the landing.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Pick the drop.' };
      if (state.choice === 'j24') {
        return { ok: false, msg: 'Light is given out when an electron drops, so the move must run from a higher rung to a lower one.' };
      }
      if (state.choice !== 'j42') {
        return { ok: false, msg: 'Tap the 486 nm line itself and read which rungs the ladder lights; two lines can look alike.' };
      }
      return { ok: true };
    },
    reward: {
      title: 'One Line, One Drop',
      body: 'Every line in a spectrum is one drop between two energy levels, and the bigger the drop, the shorter the wavelength of the light. The same drop always makes the same line.',
      log: 'The 486 nm line is one particular drop between two levels.'
    }
  },

  /* ---------------------------------------------------------------- Phase 2 */
  {
    id: 'phase2',
    title: 'The Cesium Shell',
    bench: 'light',
    prompt: 'Which lamp frees electrons from the eater\'s cesium plate at the lowest speed?',
    labels: LABELS,
    controls: ['tune'],
    settings: [650, 540, 450, 350],
    start: 1,
    brightness: 5,
    reference: ['Sample A: 540 nm', 'Sample B: 450 nm', 'Sample C: 350 nm'],
    rigs: [{ id: 'cell', label: 'CESIUM PLATE', head: 'photocell', metal: 'Cs', tuned: true, note: 'Cs, at full brightness' }],
    widget: {
      type: 'choice', label: 'The lamp',
      options: [
        { id: 'a', label: 'Sample A' },
        { id: 'b', label: 'Sample B' },
        { id: 'c', label: 'Sample C' }
      ]
    },
    encounter: {
      species: 'the lantern-eater',
      act: 'Match Light',
      intent: 'The eater\'s shell clings to its electrons and gives them up only to the right light.',
      hit: 'The shell gives way and the eater\'s glow drains into the ice.'
    },
    hints: [
      'Set the dial to each lamp\'s wavelength in turn and read the speed meter.',
      'Compare the speed readings across the three lamps rather than the counter.',
      'Look for the lamp whose speed reading is the smallest one above zero.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Pick a lamp.' };
      if (state.choice !== 'a') {
        return { ok: false, msg: 'Set the dial to that lamp and compare its speed reading with the other two.' };
      }
      return { ok: true };
    },
    reward: {
      title: 'Spare Energy Becomes Speed',
      body: 'A photon pays the plate\'s work function to free an electron, and whatever energy is left over becomes the electron\'s speed. Light only just above the threshold frees electrons slowly.',
      log: 'Photons close to the threshold free the slowest electrons.'
    }
  },

  /* ---------------------------------------------------------------- Phase 3 */
  {
    id: 'phase3',
    title: 'The Magnet Shield',
    bench: 'rack',
    prompt: 'How many electrons in an oxygen atom stand alone in a box?',
    controls: ['hand', 'magnet'],
    rigs: [{ id: 'rack', label: 'SAMPLE O', head: 'rack', layout: 'atomic', rows: RACK_ROWS, sample: 'O', note: 'O, eight electrons' }],
    widget: { type: 'number', min: 0, max: 8, step: 1, label: 'Electrons standing alone' },
    encounter: {
      species: 'the lantern-eater',
      act: 'Test Pull',
      intent: 'The eater hides behind a field that tugs at lone electrons.',
      hit: 'The field fails and the eater is left bare in the dark.'
    },
    hints: [
      'Press "Test Sample" to see how hard oxygen is pulled, then fill a rack and press "Test Rack".',
      'Build oxygen\'s eight electrons from the lowest row up and compare the rack\'s pull with the sample\'s.',
      'Count the electrons standing alone in their boxes on the rack that pulls exactly as hard as the sample.'
    ],
    check(state) {
      const n = state?.number;
      if (n === null || n === undefined) return { ok: false, notYet: true, msg: 'Set how many electrons stand alone.' };
      if (n !== 2) {
        return { ok: false, msg: 'Match the rack\'s pull to the sample\'s pull, then count the electrons that stand alone on that rack.' };
      }
      return { ok: true };
    },
    reward: {
      title: 'Lone Electrons Feel the Magnet',
      body: 'Electrons that stand alone in a box are pulled by a magnet, and paired electrons cancel each other out. Electrons spread across a row before they pair up, which is Hund\'s rule.',
      log: 'The sample\'s pull matches a rack with the right number of lone electrons.'
    }
  },

  /* ---------------------------------------------------------------- Phase 4 */
  {
    id: 'phase4',
    title: 'The Sealed Core',
    bench: 'pes',
    prompt: 'Which element is the atom in the eater\'s sealed spectrum?',
    labels: { energy: 'BINDING ENERGY' },
    controls: ['fire'],
    reference: ['Oxygen: Z = 8', 'Fluorine: Z = 9', 'Neon: Z = 10', 'Sodium: Z = 11'],
    rigs: [{ id: 'core', label: 'SEALED CORE', head: 'spectrum', sym: 'Ne', note: 'an atom whose element is not named' }],
    widget: {
      type: 'choice', label: 'The element',
      options: [
        { id: 'O', label: 'Oxygen' },
        { id: 'F', label: 'Fluorine' },
        { id: 'Ne', label: 'Neon' },
        { id: 'Na', label: 'Sodium' }
      ]
    },
    encounter: {
      species: 'the lantern-eater',
      act: 'Read Peaks',
      intent: 'The eater keeps its core sealed so nobody can say what it is made of.',
      hit: 'The core is named, and the eater has nothing left to hide behind.'
    },
    hints: [
      'Press "Fire Light" and tap every peak on the sealed core\'s plate.',
      'Add up the heights of all the peaks to count the electrons in the atom.',
      'A neutral atom has as many electrons as its atomic number, so match your total to the catalogue.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Pick the element.' };
      if (state.choice !== 'Ne') {
        return { ok: false, msg: 'Add up every peak\'s height and compare the total with the atomic number of each candidate.' };
      }
      return { ok: true };
    },
    reward: {
      title: 'Peaks Add Up to the Atom',
      body: 'The heights of all the peaks add up to the number of electrons, and in a neutral atom that is the atomic number. A spectrum can therefore name an atom nobody has labelled.',
      log: 'The peak heights summed to one atomic number.'
    }
  },

  /* ---------------------------------------------------------------- Phase 5 */
  {
    id: 'phase5',
    title: 'The Dimmed Cell',
    bench: 'light',
    prompt: 'What concentration does the eater\'s sealed copper solution hold, in mmol/L?',
    labels: { absorb: 'Absorbance' },
    controls: [],
    rigs: [{
      id: 'cal', label: 'STANDARDS AND SEALED SAMPLE', head: 'plot', points: STANDARDS, unknownAbs: SEALED_ABS,
      maxConc: 0.012, maxAbs: 0.3, note: 'three standards at 1 cm, and one sealed reading'
    }],
    widget: { type: 'decimal', label: 'Concentration (mmol/L)', min: 0, max: 12, step: 0.5 },
    encounter: {
      species: 'the lantern-eater',
      act: 'Measure Dim',
      intent: 'The eater dims the light that passes through the cell.',
      hit: 'The dimming is measured, and the eater has no shadow left to hide in.'
    },
    hints: [
      'Read the points of the three standards and the sealed sample\'s absorbance off the plot.',
      'See where the sealed absorbance sits against the line the standards make.',
      'Carry the sealed absorbance across to the line and read the concentration beneath that point.'
    ],
    check(state) {
      if (state.decimal === 0) return { ok: false, notYet: true, msg: 'Set the concentration you read off the plot.' };
      if (state.decimal !== 7.5) {
        return { ok: false, msg: 'Follow the sealed level across to the line through the standards, then down to the concentration scale.' };
      }
      return { ok: true };
    },
    reward: {
      title: 'Dimming Measures Amount',
      body: 'Standards of known concentration make a line of absorbance against concentration, and an unknown solution is read back off that line. More dissolved copper dims the light more.',
      log: 'The sealed solution\'s absorbance sat on the standards\' line.'
    }
  }
];

export const SOLUTIONS = [
  { choice: 'j42' },
  { choice: 'a' },
  { number: 2 },
  { choice: 'Ne' },
  { decimal: 7.5 }
];

export const MISSES = [
  { choice: 'j32' },
  { choice: 'c' },
  { number: 4 },
  { choice: 'F' },
  { decimal: 6 }
];

function blankState(stage) {
  return {
    setting: stage.start ?? null,
    brightness: stage.brightness ?? 3,
    rack: null
  };
}

export function stateFor(i, overrides) {
  return { ...blankAnswer(STAGES[i]), ...blankState(STAGES[i]), ...overrides };
}

export const DEBRIEF = {
  speaker: 'Vess',
  clueAwarded: 'clue_lantern_lens',
  sections: [
    {
      heading: 'What You Found',
      body: 'The Lantern-Eater has collapsed into shimmering ice. Among its remnants lies a precision lens ground from fluorite, proof that high-energy optics were deliberately deployed here.'
    },
    {
      heading: 'Why It Is Worth It',
      body: 'Every phase tested a core quantum phenomenon: quantized spectral lines, photoelectric work functions, Hund\'s rule paramagnetism, core PES energies, and Beer-Lambert absorbance.'
    },
    {
      heading: 'Next',
      body: 'The lens is catalogued in your Case File. Across the fog, the crystal lattices of Ligar rise, held together by the very electron pairs you have mapped.'
    }
  ]
};

export const PRACTICE = [
  {
    id: 'p1',
    question: 'Which electronic transition in a hydrogen atom emits a photon in the visible Balmer series?',
    options: [
      { id: 'a', label: 'n = 3 to n = 2' },
      { id: 'b', label: 'n = 1 to n = 2' },
      { id: 'c', label: 'n = 4 to n = 1' }
    ],
    answer: 'a',
    explanation: 'The Balmer series consists of transitions ending at n = 2, producing visible light such as the red 656 nm line from n = 3 to n = 2.'
  },
  {
    id: 'p2',
    question: 'In a photoelectric effect experiment, what determines whether electrons are ejected from a metal surface?',
    options: [
      { id: 'a', label: 'The frequency of the incident light must exceed the threshold frequency' },
      { id: 'b', label: 'The intensity of the light must exceed a threshold brightness' },
      { id: 'c', label: 'The light beam must be polarized parallel to the surface' }
    ],
    answer: 'a',
    explanation: 'Each photon must carry energy E = hf greater than the metal\'s work function; intensity only increases the number of ejected electrons, not their individual energy.'
  },
  {
    id: 'p3',
    question: 'How many unpaired electrons are present in an isolated neutral nitrogen atom (Z = 7)?',
    options: [
      { id: 'a', label: '3' },
      { id: 'b', label: '1' },
      { id: 'c', label: '0' }
    ],
    answer: 'a',
    explanation: 'Nitrogen has the configuration 1s² 2s² 2p³. By Hund\'s rule, the three 2p electrons each occupy separate degenerate orbitals with parallel spins.'
  },
  {
    id: 'p4',
    question: 'In photoelectron spectroscopy (PES), why does the 1s peak of neon appear at a much higher binding energy than that of oxygen?',
    options: [
      { id: 'a', label: 'Neon has a higher nuclear charge (10 protons vs. 8 protons)' },
      { id: 'b', label: 'Neon has more valence electrons shielding the core' },
      { id: 'c', label: 'Neon atoms are smaller and lighter than oxygen atoms' }
    ],
    answer: 'a',
    explanation: 'A greater nuclear charge exerts a stronger Coulombic attraction on core electrons, requiring more energy to eject them.'
  },
  {
    id: 'p5',
    question: 'A solution in a 1.0 cm cuvette has an absorbance of 0.60. If the path length is doubled to 2.0 cm with concentration unchanged, what is the new absorbance?',
    options: [
      { id: 'a', label: '1.20' },
      { id: 'b', label: '0.30' },
      { id: 'c', label: '0.60' }
    ],
    answer: 'a',
    explanation: 'By the Beer-Lambert law (A = εbc), absorbance is directly proportional to path length b; doubling b doubles A from 0.60 to 1.20.'
  }
];

/* ------------------------------------------------------------------
   MOUNT
   ------------------------------------------------------------------ */

export function mount(container, ctx) {
  let bench = null;
  let benchKind = null;
  let runner = null;

  const nmNow = () => {
    const st = runner.stage.settings;
    return st ? st[runner.state.setting - 1] : null;
  };

  /** The eater reads its pose off the instrument's own figures and nothing else. */
  function react(rigId, pose, quiet = false) {
    runner.frame.foeReact(rigId, { pose }, quiet);
  }

  function paintSetting() {
    const st = runner.stage.settings;
    if (!st) return;
    runner.paintDial('setting', runner.state.setting, { min: 1, max: st.length, text: `${st[runner.state.setting - 1]} nm` });
  }

  function readPhotocell(quiet = false) {
    const stage = runner.stage;
    const nm = nmNow();
    const rows = stage.rigs.map(r => {
      const plan = planPhotocell(r.metal, nm, runner.state.brightness);
      react(r.id, plan.freed ? 'ionized' : 'unmoved', quiet);
      return `${r.label}: ${plan.count} electrons a second, fastest ${plan.speed.toFixed(1)} x 10^5 m/s`;
    });
    runner.readout('Counter // plate', rows.join('. ') + '.');
  }

  function setSetting(v) {
    runner.state.setting = v;
    bench.setSetting?.(v);
    paintSetting();
    readPhotocell();
  }

  function paintAll() {
    if (benchKind === 'rack') paintHand(runner.frame.el.controls, bench.cfg?.hand, false);
  }

  function onProbe(hit) {
    if (!hit) return;
    const stage = runner.stage;
    if (benchKind === 'light' && hit.kind === 'prism') {
      const where = `Under the cursor: ${hit.nm} nm${hit.onLine ? ', on a line' : ''}.`;
      if (stage.ladder && hit.onLine) {
        const jump = jumpForLine(hit.nm);
        if (jump) {
          bench.showJump(stage.ladder, jump.hi, jump.lo);
          runner.readout(`Band // ${hit.plateLabel}`, `${where} The ladder lights the jump from rung ${jump.hi} to rung ${jump.lo}.`);
          react('tube', 'absorbed');
        } else {
          bench.clearJump();
          runner.readout(`Band // ${hit.plateLabel}`, `${where} No pair of rungs on this ladder gives that line.`);
        }
      } else {
        runner.readout(`Band // ${hit.plateLabel}`, where);
      }
    } else if (benchKind === 'rack') {
      if (hit.kind === 'hand') { paintAll(); return; }
      if (hit.kind === 'rack') {
        runner.state.rack = hit.rack;
        const d = describeAct(hit, bench.itemFor(hit.plateId));
        runner.readout(d.head, d.body);
        paintAll();
      }
    } else if (benchKind === 'pes' && hit.kind === 'peak') {
      runner.readout(`Peak // ${hit.rig.label}`, `${hit.energy} MJ/mol, ${hit.height} ${hit.height === 1 ? 'electron' : 'electrons'}.`);
      react('core', 'ionized');
    } else if (benchKind === 'light' && stage.id === 'phase5') {
      react('cal', 'absorbed');
    }
  }

  function onTool(tool) {
    if (benchKind !== 'rack' && (tool.startsWith('hand:') || tool.startsWith('magnet') || tool === 'clear')) return;
    if (benchKind !== 'pes' && tool === 'fire') return;
    if (tool.startsWith('hand:')) {
      bench.setHand(tool.split(':')[1]);
      paintAll();
    } else if (tool === 'clear') {
      bench.clear();
      runner.state.rack = bench.rackOf('rack');
      runner.readout('Rack // cleared', 'The rack is back to how the stage handed it over.');
    } else if (tool === 'magnet-sample') {
      const m = bench.measured('rack');
      if (m == null) return;
      bench.pull?.('rack', m);
      runner.readout('Magnet // sample', `${runner.stage.rigs[0].label}: ${pullWords(m)}`);
    } else if (tool === 'magnet-rack') {
      const reading = readRack(runner.state.rack || {});
      bench.pull?.('rack', reading.pull);
      runner.readout('Magnet // rack', `The arrangement on the rack: ${pullWords(reading.pull)}`);
    } else if (tool === 'fire') {
      bench.fire();
      runner.readout('Light // fired', 'The plate is filling in. Tap a peak to read it.');
    }
  }

  function ensureBench(kind, r) {
    if (benchKind === kind) return;
    bench?.dispose();
    const host = r.frame.instrumentHost;
    if (kind === 'light') bench = LightBench(host, { onProbe, onSetting: v => setSetting(v), onBrightness: () => {} });
    else if (kind === 'rack') bench = BoxRack(host, { onProbe, onSelect: () => {} });
    else bench = ElectronBench(host, { onProbe });
    benchKind = kind;
  }

  function onLoad(stage, i, r) {
    ensureBench(stage.bench, r);
    const parts = [];
    const dials = {};
    if (stage.bench === 'light') {
      bench.setRigs(stage.rigs, {
        settings: stage.settings || [],
        setting: r.state.setting || 1,
        brightness: r.state.brightness,
        brightnessDial: false,
        labels: stage.labels,
        ladderTop: ''
      });
      bench.setSelectable(false);
      if (stage.settings) {
        parts.push(r.dialHtml('setting', { label: 'Wavelength', min: 1, max: stage.settings.length, value: r.state.setting }));
        dials.setting = { min: 1, max: stage.settings.length, onChange: v => setSetting(v) };
      }
      if (stage.reference?.length) {
        parts.push(`
          <div class="assay-extract">
            <span class="form-label">On the plate</span>
            <ul>${stage.reference.map(t => `<li>${esc(t)}</li>`).join('')}</ul>
          </div>`);
      }
    } else if (stage.bench === 'rack') {
      bench.setPlates(stage.rigs, { show: { n: true, l: true, ml: true, ms: true }, hand: null, core: false });
      bench.setSelectable(false);
      r.state.rack = bench.rackOf('rack');
      parts.push(handKeys({ clear: true, core: false }));
      parts.push(`
        <div class="cb-field" role="group" aria-label="Magnet">
          <span class="form-label">Magnet</span>
          <button type="button" class="btn-secondary quest-btn-sm lq-tool" data-tool="magnet-sample">Test Sample</button>
          <button type="button" class="btn-secondary quest-btn-sm lq-tool" data-tool="magnet-rack">Test Rack</button>
        </div>`);
    } else {
      bench.setPlates(stage.rigs, { labels: stage.labels });
      bench.setSelectable(false);
      parts.push('<button type="button" class="btn-secondary quest-btn-sm lq-tool" data-tool="fire">Fire Light</button>');
      if (stage.reference?.length) {
        parts.push(`
          <div class="assay-extract">
            <span class="form-label">Catalogue</span>
            <ul>${stage.reference.map(t => `<li>${esc(t)}</li>`).join('')}</ul>
          </div>`);
      }
    }
    r.setControls(parts, onTool, { dials });

    if (stage.bench === 'light' && stage.settings) { paintSetting(); readPhotocell(true); }
    else {
      const idle = {
        phase1: ['Band // standby', 'Tap a position on a band to read it.'],
        phase3: ['Rack // standby', 'Pick a hand, then tap a box.'],
        phase4: ['Bench // standby', 'Fire the light, then tap a peak.'],
        phase5: ['Plot // standby', 'Tap a point to read it.']
      }[stage.id];
      r.readout(null, null, { idleHead: idle[0], idle: idle[1] });
      paintAll();
    }
  }

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
