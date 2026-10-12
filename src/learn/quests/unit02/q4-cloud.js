/**
 * q4-cloud.js — Lanternfall, bench four: ORBITALS.
 *
 * The cloud plate (`engine/cloudplate.js`). Bench three ended on a ladder that
 * breaks for helium, because an electron is not a bead on a rung, and this is
 * where it is. A probe finds the electron once per shot and leaves a dot; one
 * shot is a dot and five hundred are a shape, drawn from the real hydrogen-like
 * |psi|^2 and reproducible shot for shot.
 *
 * THE ORDER IS THE WHOLE DESIGN:
 *
 *   1  one shot, then fifty                        -> probability
 *   2  five hundred shots                          -> orbital
 *   3  a wave that has to fit a ring               -> standing wave, wave-particle duality
 *   4  a second cloud, bigger and hollower         -> node
 *   5  a cloud with two lobes                      -> p orbital, beside s orbital
 *   6  the ways a p cloud can point                -> three p orbitals
 *   7  five clouds sorted by shape                 -> d orbitals
 *   8  asking the bench to draw a path             -> the uncertainty principle
 *
 * THE BENCH NEVER DRAWS A PATH. `track()` exists only to refuse, with the
 * reason, because stage eight is the player finding out why.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { CloudPlate } from '../../engine/instruments.js';
import { createRunner, blankAnswer } from '../../engine/stagerunner.js';
import { ringFits, RING_CIRCUMFERENCE_PM } from '../../engine/orbitals.js';

export const meta = { stageCount: 8 };

/** Specific phrases first, so "p orbital" is read as the phrase and not as a stray "orbital". */
export const VOCABULARY = [
  { term: /\buncertainty principle\b/i, introducedAt: 8 },
  { term: /\bd orbitals?\b/i, introducedAt: 7 },
  { term: /\bp orbitals?\b/i, introducedAt: 5 },
  { term: /\bs orbitals?\b/i, introducedAt: 5 },
  { term: /\bwave.particle duality\b/i, introducedAt: 3 },
  { term: /\bstanding waves?\b/i, introducedAt: 3 },
  { term: /\bnodes?\b/i, introducedAt: 4 },
  { term: /\borbitals?\b/i, introducedAt: 2 },
  { term: /\bprobabilit(?:y|ies)\b/i, introducedAt: 1 }
];

export const BUILDS_ON = ['unit02/q2-photon', 'unit02/q3-lines'];

const SPEAKER = 'Vess';

/* ------------------------------------------------------------------
   THE KEY LEGEND. Only the keys whose labels leave something out.
   ------------------------------------------------------------------ */
const TOOL_TEXT = {
  slice: { key: 'Slice', what: 'Shows only the dots within a thin slab through the middle.' },
  track: { key: 'Track Electron', what: 'Asks the bench to follow the electron along a path.' }
};

export function toolNoteFor(controlId) { return TOOL_TEXT[controlId] || null; }

const RING_SETTINGS = [332, 250, 200, 166, 140, 111];
const RING_WIDGET = RING_SETTINGS.map(n => ({ id: String(n), label: `${n} pm` }));

/* ------------------------------------------------------------------
   THE EIGHT STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    title: 'One Shot, Fifty Shots',
    briefing: {
      speaker: SPEAKER,
      body: 'Welcome to the electron cloud detector, where each sensor pulse detects an electron\'s location and leaves a glowing phosphor dot. Fire shots to see what overall pattern emerges.'
    },
    prompt: 'Take aim with the sensor beam! Where does Sample A\'s electron appear when we ping it repeatedly?',
    controls: ['fire'],
    extent: 5,
    clouds: [{ id: 'a', label: 'SAMPLE A', head: 'cloud', orbital: '1s', note: 'one electron in an atom' }],
    widget: {
      type: 'choice', label: 'Where it is',
      options: [
        { id: 'fixed', label: 'In one fixed place near the middle' },
        { id: 'cloud', label: 'Somewhere new each time it is looked for, most often near the middle' },
        { id: 'orbit', label: 'Circling the middle on a fixed path' },
        { id: 'even', label: 'Spread evenly over the whole plate' }
      ]
    },
    hints: [
      'Press "Fire One Shot" a few times, then "Fire 50 Shots", and watch where the dots land.',
      'Compare where each new shot lands with where the one before it landed, and where most of them gather.',
      'Note whether successive shots repeat a position, and which part of the plate collects the most dots after fifty.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Pick where the electron is.' };
      if (state.choice !== 'cloud') {
        return { ok: false, msg: 'Fire several single shots and compare where they land, then fire fifty and see where the dots gather.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'One shot: one place. The next: another.',
      title: 'Probability',
      body: 'One shot finds the electron in one place and the next shot finds it somewhere else. Only after many shots does a pattern appear, so all that can be said about where it is is the probability of finding it in each place.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    title: 'Five Hundred Shots',
    prompt: 'Fire 500 sensor bursts into the sample chamber! What overall shape emerges from the glowing swarm of dots?',
    controls: ['fire'],
    extent: 5,
    clouds: [{ id: 'a', label: 'SAMPLE A', head: 'cloud', orbital: '1s', note: 'one electron in an atom' }],
    widget: {
      type: 'choice', label: 'The shape',
      options: [
        { id: 'round', label: 'A round, fuzzy cloud, densest at the middle' },
        { id: 'ring', label: 'A thin ring at one distance from the middle' },
        { id: 'lobes', label: 'Two lobes with a gap between them' },
        { id: 'disc', label: 'A flat disc of even density' }
      ]
    },
    hints: [
      'Press "Fire 500 Shots" and look at the whole plate.',
      'Compare how thickly the dots lie at the middle with how thickly they lie farther out.',
      'Describe the outline the dots make and the part of it where they are densest.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Pick the shape.' };
      if (state.choice !== 'round') {
        return { ok: false, msg: 'Fire all 500 shots and look at the outline of the dots, and at how thickly they lie at different distances.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'A fuzzy ball, densest in the middle.',
      title: 'Orbital',
      body: 'The cloud of dots is a picture of where the electron is likely to be found, and a region like it is called an orbital. This one, round and densest at the middle, is the lowest orbital an electron can have.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    title: 'Waves That Fit',
    prompt: 'An electron wave circles the atomic track! Which wavelengths loop smoothly around the ring without canceling themselves out?',
    controls: ['tune'],
    settings: RING_SETTINGS,
    start: 2,
    clouds: [{ id: 'ring', label: 'THE RING', head: 'ring', tuned: true, note: 'a wave on a circular track' }],
    widget: { type: 'multi', label: 'Wavelengths that fit', options: RING_WIDGET },
    hints: [
      'Turn the wavelength dial through every setting and watch what the wave does on the track.',
      'Compare a setting where the wave draws one clean ring with a setting where the laps smear into a band.',
      'A wavelength fits only if a whole number of them go round the track, so divide the track length by each wavelength.'
    ],
    check(state) {
      if (!state.picks.length) return { ok: false, notYet: true, msg: 'Pick the wavelengths that fit.' };
      const want = RING_SETTINGS.filter(n => ringFits(n, RING_CIRCUMFERENCE_PM).fits).map(String).sort().join();
      if (state.picks.slice().sort().join() !== want) {
        return { ok: false, msg: 'Turn the dial to each setting in your list and check the ring closes cleanly, then check the settings you left out.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'Only whole numbers of waves survive the lap.',
      title: 'Standing Wave',
      body: 'A wave on a ring survives only if a whole number of wavelengths fits, because otherwise each lap cancels the one before. Electrons are held to the same rule, which is why they behave as waves as well as particles: wave-particle duality.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    title: 'Bigger and Emptier',
    briefing: {
      speaker: SPEAKER,
      body: 'You can now view interior cross-sections. Press "Slice" to inspect only the dots within a thin slice through the middle.'
    },
    prompt: 'Sample B holds an electron pumped with higher energy. Fire shots and use Slice to compare: how does Sample B\'s cloud differ from Sample A\'s?',
    controls: ['fire', 'slice'],
    extent: 14,
    clouds: [
      { id: 'a', label: 'SAMPLE A', head: 'cloud', orbital: '1s', note: 'one electron in an atom' },
      { id: 'b', label: 'SAMPLE B', head: 'cloud', orbital: '2s', note: 'one electron in an atom with more energy' }
    ],
    widget: {
      type: 'choice', label: 'How they compare',
      options: [
        { id: 'bigger', label: 'B is bigger, and has an empty shell where no dots fall' },
        { id: 'faint', label: 'B is the same size as A, only fainter' },
        { id: 'smaller', label: 'B is smaller and denser than A' },
        { id: 'even', label: 'B is bigger, and its dots fill every distance evenly' }
      ]
    },
    hints: [
      'Press "Fire 500 Shots" and then "Slice", and compare the two plates.',
      'Compare how far out each cloud reaches, and look in the larger one for a distance at which no dots fall.',
      'Count the dots in a thin ring around the middle at several distances in Sample B and look for the distance with none.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Pick how they compare.' };
      if (state.choice !== 'bigger') {
        return { ok: false, msg: 'Fire the full 500 at both, use the slice, and compare how far out each cloud reaches and whether any distance is left empty.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'The bigger cloud has a shell with nothing in it.',
      title: 'Node',
      body: 'The second cloud is larger than the first and has a shell where the electron is never found, which is called a node. Each step up in energy makes the cloud bigger and adds a node.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    title: 'Two Lobes',
    prompt: 'Sample C displays a fascinating new distribution! Fire 500 shots and rotate the view: what shape does this cloud form, and where are dots never found?',
    controls: ['fire', 'slice'],
    extent: 12,
    clouds: [{ id: 'c', label: 'SAMPLE C', head: 'cloud', orbital: '2pz', plane: 'all', note: 'one electron in an atom with more energy' }],
    widget: {
      type: 'choice', label: 'The shape',
      options: [
        { id: 'lobes', label: 'Two lobes either side of the middle, with no dots on the flat plane between them' },
        { id: 'ball', label: 'One round cloud, with no dots at the very centre' },
        { id: 'ring', label: 'A ring round the middle, with no dots inside it' },
        { id: 'four', label: 'Four lobes, with no dots along the axes' }
      ]
    },
    hints: [
      'Press "Fire 500 Shots" and look at all three views of the plate.',
      'Compare the views, noting the direction in which the dots gather and the flat plane they never cross.',
      'Press "Slice" and see which of the three views goes empty through its middle.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Pick the shape.' };
      if (state.choice !== 'lobes') {
        return { ok: false, msg: 'Fire all 500 shots and compare the three views: look at where the dots gather and at what is missing.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'Two lobes, and a flat plane with nothing in it.',
      title: 'p Orbital',
      body: 'A p orbital has two lobes with a node between them, a flat plane through the nucleus where the electron is never found. The round orbitals met so far are s orbitals, and the two-lobed ones are p orbitals.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    title: 'Ways to Point',
    prompt: 'Survey these energetic sub-chambers! How many distinct spatial directions can this two-lobed cloud point along?',
    controls: [],
    extent: 12,
    clouds: [
      { id: 'c', label: 'SAMPLE C', head: 'cloud', orbital: '2px', plane: 'all', fired: 500, note: 'one electron in an atom with more energy' },
      { id: 'd', label: 'SAMPLE D', head: 'cloud', orbital: '2pz', plane: 'all', fired: 500, note: 'one electron in an atom with more energy' },
      { id: 'e', label: 'SAMPLE E', head: 'cloud', orbital: '2py', plane: 'all', fired: 500, note: 'one electron in an atom with more energy' },
      { id: 'f', label: 'SAMPLE F', head: 'cloud', orbital: '2pz', plane: 'all', fired: 500, seed: 3, note: 'one electron in an atom with more energy' }
    ],
    widget: { type: 'number', label: 'Ways the two-lobed shape can point', min: 1, max: 6, step: 1 },
    hints: [
      'Look at each sample\'s three views and find the direction its two lobes lie along.',
      'Compare the four samples and note which of them point the same way as another.',
      'Count the different directions the lobes point along, not the number of samples on the bench.'
    ],
    check(state) {
      if (state.number === 1) return { ok: false, notYet: true, msg: 'Set the number of directions you found.' };
      if (state.number !== 3) {
        return { ok: false, msg: 'Count the directions the lobes point along, and do not count a direction twice because two samples share it.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'Along x, along y, along z. No more.',
      title: 'Three p Orbitals',
      body: 'The two-lobed shape can point along x, along y or along z, which makes three p orbitals of equal energy in every shell from the second up. With the single s orbital they make up the whole of the second shell.'
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    title: 'Five Clouds',
    prompt: 'At even higher energy, exotic shapes appear! Inspect all three view angles and classify each of these five clouds by its shape.',
    controls: [],
    extent: 24,
    clouds: [
      { id: 'a', label: 'SAMPLE A', head: 'cloud', orbital: '3pz', plane: 'all', fired: 500, note: 'one electron in an atom with more energy still' },
      { id: 'b', label: 'SAMPLE B', head: 'cloud', orbital: '3dxy', plane: 'all', fired: 500, note: 'one electron in an atom with more energy still' },
      { id: 'c', label: 'SAMPLE C', head: 'cloud', orbital: '3dz2', plane: 'all', fired: 500, note: 'one electron in an atom with more energy still' },
      { id: 'd', label: 'SAMPLE D', head: 'cloud', orbital: '3dx2y2', plane: 'all', fired: 500, note: 'one electron in an atom with more energy still' },
      { id: 'e', label: 'SAMPLE E', head: 'cloud', orbital: '3dyz', plane: 'all', fired: 500, note: 'one electron in an atom with more energy still' }
    ],
    widget: {
      type: 'bins', label: 'Shape of each cloud',
      rows: ['a', 'b', 'c', 'd', 'e'].map(id => ({ id, label: `Sample ${id.toUpperCase()}` })),
      bins: [
        { id: 'two', label: 'Two lobes', note: '' },
        { id: 'four', label: 'Four lobes', note: '' },
        { id: 'ring', label: 'Two lobes and a ring', note: '' }
      ]
    },
    hints: [
      'Look at all three views of each plate and find the view in which its shape shows most clearly.',
      'Compare each plate with the two-lobed shape you already know, and look for extra lobes or a ring.',
      'Count the lobes in the clearest view of each plate, and look for a ring round the middle of the two-lobed one.'
    ],
    check(state) {
      const rows = ['a', 'b', 'c', 'd', 'e'];
      if (rows.some(r => !state.bins[r])) return { ok: false, notYet: true, msg: 'Sort all five clouds.' };
      const want = { a: 'two', b: 'four', c: 'ring', d: 'four', e: 'four' };
      for (const r of rows) {
        if (state.bins[r] !== want[r]) {
          return { ok: false, msg: 'Look at all three views of the plate and count the lobes in the clearest one before you sort it.' };
        }
      }
      return { ok: true };
    },
    reward: {
      log: 'Four lobes, four lobes, four lobes, and one with a ring.',
      title: 'd Orbitals',
      body: 'From the third shell up there are five d orbitals: four have four lobes, and one is a two-lobed shape with a ring round its middle. They matter most in the transition metals, which this world will reach before it ends.'
    }
  },

  /* ---------------------------------------------------------------- 8 */
  {
    title: 'No Path',
    briefing: {
      speaker: SPEAKER,
      body: 'Try using the trajectory tracker. Press "Track Electron" to attempt tracing a continuous path.'
    },
    prompt: 'Try the \'Track Electron\' button on our surveyor scope. Why is it impossible for the bench to trace a neat, definite path?',
    controls: ['fire', 'track'],
    extent: 5,
    clouds: [{ id: 'a', label: 'SAMPLE A', head: 'cloud', orbital: '1s', note: 'one electron in an atom' }],
    widget: {
      type: 'choice', label: 'Why',
      options: [
        { id: 'both', label: 'Its position and its speed cannot both be known exactly, so there is no path to draw' },
        { id: 'fast', label: 'The electron moves too fast for the screen to draw its path' },
        { id: 'rest', label: 'The electron has no path because it is at rest' },
        { id: 'dots', label: 'A path would need more dots than the bench can show' }
      ]
    },
    hints: [
      'Fire a few shots, press "Track Electron", and read what the bench says.',
      'Compare what a path would need to know at one moment with what the bench is able to know.',
      'Ask whether position and speed can both be fixed exactly at once, and what the bench says happens to one when the other is fixed.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Pick the reason.' };
      if (state.choice !== 'both') {
        return { ok: false, msg: 'Ask the bench to track the electron and read its reason, then test your answer against it.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'Fix where it is and its speed blurs.',
      title: 'Uncertainty Principle',
      body: 'The more exactly the bench fixes where an electron is, the less exactly it can know how fast it is going, and the other way round. This is the uncertainty principle, and it is why an electron is pictured as a cloud of probability and never as a path.',
      last: true
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
      body: 'An electron has no path. What it has is an orbital, a cloud of probability whose shape is set by the energy it has: round for s, two-lobed for p, four-lobed or ringed for d. Each orbital holds a standing wave that fits its shell.'
    },
    {
      heading: 'Why It Is Worth It',
      body: 'Every bond in this universe is made of these clouds overlapping, and every shape a molecule takes follows from how they point. You will meet all of them again in the next world.'
    },
    {
      heading: 'Next',
      body: 'A cloud has a shape and a size. The next bench gives every electron an address, four numbers that say which cloud it is in and how it spins.'
    }
  ]
};

/* ------------------------------------------------------------------
   PRACTICE PROBLEMS
   ------------------------------------------------------------------ */
export const PRACTICE = [
  {
    question: 'What does an orbital show?',
    options: [
      { id: 'a', label: 'The region where an electron is likely to be found' },
      { id: 'b', label: 'The exact path an electron follows' },
      { id: 'c', label: 'The size of the nucleus' },
      { id: 'd', label: 'The speed of an electron at an exact moment' }
    ],
    answer: 'a',
    explanation: 'An orbital is a map of probability: where the electron is likely to be found. The uncertainty principle means no exact path exists to draw.'
  },
  {
    question: 'Which orbital shape has two lobes and a node, a plane with no electron density, through the nucleus?',
    options: [
      { id: 'a', label: 'A p orbital' },
      { id: 'b', label: 'An s orbital' },
      { id: 'c', label: 'A d orbital with four lobes' },
      { id: 'd', label: 'A 1s orbital' }
    ],
    answer: 'a',
    explanation: 'A p orbital has two lobes either side of the nucleus and a flat node between them. An s orbital is spherical with no such plane.'
  },
  {
    question: 'How many p orbitals are there in the second shell?',
    options: [
      { id: 'a', label: 'One' },
      { id: 'b', label: 'Two' },
      { id: 'c', label: 'Three' },
      { id: 'd', label: 'Five' }
    ],
    answer: 'c',
    explanation: 'A p orbital can point along x, y or z, giving three of equal energy: 2px, 2py and 2pz.'
  },
  {
    question: 'The uncertainty principle says that:',
    options: [
      { id: 'a', label: 'An electron\'s position and speed cannot both be known exactly at once' },
      { id: 'b', label: 'An electron has no mass' },
      { id: 'c', label: 'Atoms cannot be measured' },
      { id: 'd', label: 'Electrons always travel in circles' }
    ],
    answer: 'a',
    explanation: 'Fixing an electron\'s position more exactly blurs its speed, and the other way round. That is why electrons are described by orbitals rather than by paths.'
  },
  {
    question: 'An electron behaves as a wave on a circular track only if:',
    options: [
      { id: 'a', label: 'A whole number of wavelengths fits round the track' },
      { id: 'b', label: 'Its wavelength equals the radius' },
      { id: 'c', label: 'It moves fast enough to complete one lap in a second' },
      { id: 'd', label: 'The track is exactly one nanometre long' }
    ],
    answer: 'a',
    explanation: 'A wave that does not fit a whole number of times meets itself out of step on the next lap and cancels. Only a standing wave survives, which is why electrons have only certain energies.'
  }
];

/* ------------------------------------------------------------------
   BENCH STATE
   ------------------------------------------------------------------ */
function blankState(stage) {
  return { setting: stage.start ?? null, slice: false };
}

export const SOLUTIONS = [
  { choice: 'cloud' },
  { choice: 'round' },
  { picks: ['332', '166', '111'] },
  { choice: 'bigger' },
  { choice: 'lobes' },
  { number: 3 },
  { bins: { a: 'two', b: 'four', c: 'ring', d: 'four', e: 'four' } },
  { choice: 'both' }
];

export const MISSES = [
  { choice: 'orbit' },
  { choice: 'ring' },
  { picks: ['332', '250', '166'] },
  { choice: 'faint' },
  { choice: 'ball' },
  { number: 4 },
  { bins: { a: 'two', b: 'four', c: 'four', d: 'four', e: 'two' } },
  { choice: 'fast' }
];

export function stateFor(i, overrides) {
  return { ...blankAnswer(STAGES[i]), ...blankState(STAGES[i]), ...overrides };
}

/* ==================================================================
   THE GAME
   ================================================================== */

export function mount(container, ctx) {
  let plate = null;
  let runner = null;

  function paintSetting() {
    const st = runner.stage.settings;
    if (!st) return;
    runner.paintDial('setting', runner.state.setting, { min: 1, max: st.length, text: `${st[runner.state.setting - 1]} pm` });
  }

  function paintKeys() {
    runner.frame.el.controls.querySelectorAll('[data-tool="slice"]').forEach(b => {
      b.classList.toggle('selected', runner.state.slice);
      b.setAttribute('aria-pressed', String(runner.state.slice));
    });
  }

  function setSetting(v) {
    runner.state.setting = v;
    plate.setRing(v);
    paintSetting();
  }

  function shotsNow() {
    const first = runner.stage.clouds.find(c => c.head !== 'ring');
    return first ? plate.shots(first.id) : 0;
  }

  function onTool(tool) {
    if (tool.startsWith('fire:')) {
      plate.fire(Number(tool.split(':')[1]));
      runner.readout('Plate // shots', `Every plate has taken ${shotsNow()} shots.`);
    } else if (tool === 'clear') {
      plate.clear();
      runner.readout('Plate // shots', 'Every plate is clear.');
    } else if (tool === 'slice') {
      runner.state.slice = !runner.state.slice;
      plate.setSlice(runner.state.slice);
      runner.readout('Plate // slice', runner.state.slice
        ? 'Showing only the dots within a thin slab through the middle.'
        : 'Showing every dot, from front to back.');
      paintKeys();
    } else if (tool === 'track') {
      const r = plate.track();
      runner.readout('Track // refused', r.reason);
    }
  }

  function onLoad(stage, i, r) {
    plate.setPlates(stage.clouds, {
      extent: stage.extent ?? 12,
      settings: stage.settings || [],
      setting: r.state.setting || 1
    });
    plate.setSelectable(false);

    const parts = [];
    const dials = {};
    if (stage.settings) {
      parts.push(r.dialHtml('setting', { label: 'Wavelength', min: 1, max: stage.settings.length, value: r.state.setting }));
      dials.setting = { min: 1, max: stage.settings.length, onChange: v => setSetting(v) };
    }
    const keys = [];
    if (stage.controls.includes('fire')) {
      keys.push(
        '<button type="button" class="btn-secondary quest-btn-sm lq-tool" data-tool="fire:1">Fire One Shot</button>',
        '<button type="button" class="btn-secondary quest-btn-sm lq-tool" data-tool="fire:50">Fire 50 Shots</button>',
        '<button type="button" class="btn-secondary quest-btn-sm lq-tool" data-tool="fire:500">Fire 500 Shots</button>',
        '<button type="button" class="btn-secondary quest-btn-sm lq-tool" data-tool="clear">Clear Plate</button>'
      );
    }
    if (stage.controls.includes('slice')) {
      keys.push('<button type="button" class="btn-secondary quest-btn-sm lq-tool" data-tool="slice" aria-pressed="false">Slice</button>');
    }
    if (stage.controls.includes('track')) {
      keys.push('<button type="button" class="btn-secondary quest-btn-sm lq-tool" data-tool="track">Track Electron</button>');
    }
    if (keys.length) parts.push(`<div class="cb-field" role="group" aria-label="Plate">${keys.join('')}</div>`);

    r.setControls(parts, onTool, { dials });
    paintSetting();
    paintKeys();
    r.readout(null, null, { idleHead: 'Plate // standby', idle: stage.controls.includes('fire') ? 'Fire some shots.' : 'Look at the plate.' });
  }

  runner = createRunner(container, ctx, {
    STAGES, DEBRIEF, blankState, toolNoteFor,
    setup: r => { plate = CloudPlate(r.frame.instrumentHost, { onProbe: () => {}, onSetting: v => setSetting(v) }); },
    onLoad,
    onDispose: () => plate?.dispose()
  });

  runner.start();
  return { dispose: () => runner.dispose() };
}
