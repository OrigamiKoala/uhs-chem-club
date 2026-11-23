/**
 * tour.js — what the Tour says about the table in front of the player.
 *
 * The Tour is a how-to: one step per instrument or kind of piece that is on THIS stage's table. Each step is written for a
 * student who has never seen the tool, in the same three beats: WHAT IT IS (what you can see on the table), WHAT TO DO WITH IT
 * (the exact drag, tap or key), and WHAT IT TELLS YOU (what you will see happen). Plain everyday words, short sentences, and no
 * word the quest has not earned. It explains how a tool works and how to answer with it, and never which move solves the stage
 * (principle 2).
 *
 * Pure: it reads a table state (`createTable`) and returns `[{flag, name, desc}]`. `flag` is the once-only key for a step
 * (`tour_<kit>_<what>`), so a bare Tour call shows only what this player has not met and `force` replays all of it. A kind with no
 * text of its own still gets a step built from its label, its key and its dials, so no tool is ever left unexplained; `verify:table`
 * fails on a tool the Tour does not mention.
 */

// LIGAR (unit03): the steps for Ligar's own instruments and pieces live in their own file, asked first.
import { ligarFixture, ligarPiece, ligarSkip, LIGAR_KITS } from './tour-ligar.js';
import { LANTERNFALL_TOUR } from './tour-lanternfall.js';
import { demoFor } from './tour-demo.js';

/** What a dial does, by its label. */
const DIAL = {
  Power: 'The "Power" dial sets how much the lens magnifies: a higher power shows a smaller part of the sample, but bigger.',
  Fulcrum: 'The "Fulcrum" dial slides the pivot the beam rests on along the ruler. The beam lies flat when the weight on both sides of the pivot is equal.',
  Bin: 'The "Bin" dial picks which bin to look at.',
  'Heavy atoms': 'The "Heavy atoms" dial sets how many of the atoms are the heavier kind; the rest are the lighter kind.',
  Protons: 'The "Protons" dial sets the number of protons you think the unmeasured card has.',
  Moles: 'The "Moles" dial is where you enter the number you worked out.'
};

/**
 * An instrument, by `kind` (a kit may override with `kit:kind`). `{run}` is the fixture's own key; `{item}` names what goes in it.
 * `dials: false` means the text already covers the fixture's dials.
 */
const FIXTURE = {
  scope: { title: 'Lens & Power', dials: false, text: 'Drag the lens onto a dish; turn Power to zoom.' },
  reader: { title: 'Scale', text: 'Drag an atom into the slot to read its mass.' },
  beam: { title: 'Beam & detectors', text: 'Press "{run}" to fire shots at the foil and count hits.' },
  field: { title: 'Charged plates', text: 'Drag particles between the plates, then press "{run}".' },
  needle: { title: 'Charge meter', text: 'Shows total charge: + from protons, − from electrons.' },
  mass: { title: 'Mass counter', text: 'Shows total mass (protons + neutrons).' },
  tester: { title: 'Partner test', text: 'Drag a {item} into the slot, then press "{run}".' },
  'cards:tester': { title: 'Partner test', text: 'Drag a card into the slot, then press "{run}".' },
  stamp: { title: 'Stamp', dials: false, text: 'Set the "Protons" dial for the unmeasured card.' },
  assay: { title: 'Mass spectrometer', text: 'Drag a sample onto the chute, then press "{run}".' },
  coder: { title: 'Code reader', dials: false, text: 'Pick a "Bin", then press "{run}" to read its element.' },
  balance: { title: 'Balance', text: 'Drag items onto the pans to compare their mass.' },
  scale: { title: 'Scale', text: 'Drag an item onto the pan to weigh it.' },
  mixer: { title: 'Mix', text: 'Pan filled with two atom kinds; mass depends on their ratio.' },
  spectrum: { title: 'Mass spectrum', dials: false, text: 'Each bar shows an isotope mass and its percentage.' },
  tally: { title: 'Tally', dials: false, text: 'Set the "Moles" dial to your answer.' }
};

/** A kind of piece, by `kind`: [title, text, optional (table) => extra sentence]. Only tool-like pieces get a step. */
const PIECE = {
  dish: ['Sample dishes', 'Drag the lens onto a dish to look inside.'],
  lens: ['Lens', 'Drag the lens onto a dish to magnify it.'],
  cutter: ['Break bonds', 'Drag across a dish to split the sample into smaller pieces.'],
  atom: ['Atoms', 'Drag one atom onto another to join them; tap the bond to split.'],
  proton: ['Particles', 'Drag a particle onto or off the atom.'],
  neutron: null,
  electron: null,
  nucleus: ['Nucleus', 'Each + disc in the centre is a proton.'],
  specimen: ['Atom samples', 'Drag each sample into the matching tray.'],
  speck: ['Particles', 'Drag a particle into a tray to sort it.'],
  model: null,
  detector: ['Detectors', 'Counts shots that land on it.'],
  ion: ['Charged tiles', 'Drag tiles onto the pad to add their charges.'],
  element: ['Element cards', 'Shows protons, outer electrons, and atomic weight.'],
  sample: ['Samples', 'Drag a sample onto the chute to test it.'],
  crate: ['Crates', 'Drag a crate onto a pan or scale to weigh it.'],
  token: null,
  /* ---- LIGAR (unit03) ---- */
  guess: null
};

/** Tool keys the table can carry on its foot dock. */
const TOOL = {
  straightedge: ['Straightedge', 'Press "Straightedge" to extend a straight line through your recorded points and see where it crosses zero.']
};

/**
 * A kit's own words (`registerTour`), kept apart from the shared tables above so a world's tour text lives with its kit and never
 * edits another world's. Keys are `<kit>:<kind>` for an instrument or a piece and `<kit>:<dial label>` for a dial.
 */
const EXTRA = { fixtures: {}, pieces: {}, dials: {} };
export function registerTour(kitId, { fixtures = {}, pieces = {}, dials = {} } = {}) {
  for (const [k, v] of Object.entries(fixtures)) EXTRA.fixtures[`${kitId}:${k}`] = v;
  for (const [k, v] of Object.entries(pieces)) EXTRA.pieces[`${kitId}:${k}`] = v;
  for (const [k, v] of Object.entries(dials)) EXTRA.dials[`${kitId}:${k}`] = v;
}
/* ---- LIGAR (unit03): what the Tour adds for the pieces of Ligar's benches ---- */

/** What the dots and rings on an atom's face mean, once a stage shows them (Ligar's atom benches). */
const ligarAtomSentence = t => (t.opts?.shells
  ? ' The dots round an atom\'s rim are the electrons on its outer shell, and a ring lights when that shell is full.'
    + (t.opts.charges === false ? '' : ' After a join, a + or − on an atom\'s face is the charge it carries.')
    + (t.opts.pull ? ' The number under the symbol is how hard the atom pulls on electrons it shares.' : '')
  : '');

/** The slot a guess goes in: only your guess, never marked right or wrong, and the next bench tests it. */
const ligarGuessSentence = t => {
  const slot = Object.values(t.zones?.slots || {}).find(z => z.label);
  return ` Drag the card you would bet on into the "${slot ? slot.label : 'prediction'}" slot. It is only your guess: nothing is marked right or wrong, and the next bench tests it.`;
};
// Lanternfall's instruments and pieces have their own words (`tour-lanternfall.js`), keyed `<kit>:<kind>`.
Object.assign(FIXTURE, LANTERNFALL_TOUR.fixtures);
Object.assign(PIECE, LANTERNFALL_TOUR.pieces);

const hasTrays = t => Object.keys(t.zones?.trays || {}).some(id => !id.startsWith('scr-'));
/** The slot a choice goes in, named as the table names it. */
const slotSentence = t => {
  const slot = Object.values(t.zones?.slots || {}).find(z => z.label);
  return slot ? ` Drag the card you choose into the "${slot.label}" slot.` : ' Drag the card you choose into the slot.';
};
const hasNeedle = t => Object.values(t.fixtures || {}).some(f => f.kind === 'needle');
const hasCounts = t => Object.values(t.pieces || {}).some(p => p.kind === 'specimen' && p.props?.counts);
const quote = s => `"${s}"`;

/** The generic text for a fixture whose kind has no entry: its label and its key or dial. */
function fallbackFixture(f) {
  if (f.runLabel) return `Press ${quote(f.runLabel)} to use ${f.label}.`;
  const d = Object.values(f.dials || {})[0];
  return d ? `Drag the ${quote(d.label || f.label)} dial.` : `${f.label}.`;
}

/** The title and text of a fixture: concise, one sentence, no dial boilerplate appended. */
function fixtureStep(f, kitId, table) {
  const own = ligarFixture(f, kitId, table);
  if (own) return { title: own.title, text: own.text, key: own.key };
  const entry = EXTRA.fixtures[`${kitId}:${f.kind}`] || FIXTURE[`${kitId}:${f.kind}`] || FIXTURE[f.kind];
  if (!entry) return { title: f.label, text: fallbackFixture(f) };
  const runSentence = f.runLabel ? `Press "${f.runLabel}" to record.` : '';
  const rawTitle = typeof entry.title === 'function' ? entry.title(f, table) : entry.title;
  const rawText = typeof entry.text === 'function' ? entry.text(f, table) : entry.text;
  const text = rawText
    .replace('{run}', f.runLabel || 'Run')
    .replace('{item}', 'sample')
    .replace('{runSentence}', runSentence)
    .replace('{counters}', '')
    .trim();
  return { title: rawTitle || f.label, text };
}

// Fixtures that are pure answer-picking UI, answer-entry dials, or static displays, not tools to explain.
const SKIP_FIXTURES = new Set(['plaque', 'plate', 'tchoice', 'lchoice', 'choice', 'marker', 'selector', 'tally', 'stamp']);

// Pieces that are self-explanatory cards, statements, or inputs already covered by an instrument step.
const SKIP_PIECES = new Set([
  'token', 'model', 'guess', 'stmt', 'note', 'tag', 'chip', 'num', 'card',
  'matter:stmt', 'cell:tag', 'cell:note', 'cell:chip',
  'heat:stmt', 'heat:tag', 'heat:note', 'heat:chip', 'heat:num', 'heat:gcard', 'heat:shift', 'heat:phase', 'heat:shelf',
  'thorn:tcard'
]);

/**
 * The steps for a table. `intro` is the stage's briefing (what Vess says), kept as the first step when there is one; `worked` are the
 * lines of a worked case shown under it.
 *
 * @param {object} table  a `createTable` state
 * @param {{intro?: string, speaker?: string, worked?: string[]|null}} [opts]
 * @returns {Array<{flag: string, name: string, desc: string}>}
 */
export function tourSteps(table, { intro = '', speaker = 'Vess', worked = null } = {}) {
  if (!table) return [];
  const kit = table.kit;
  const steps = [];
  const demoOf = key => demoFor(kit, key) || demoFor(kit, key.replace(/^(fx_[^_]+)_.+$/, '$1'));
  const add = (key, name, desc, extra = {}) => steps.push({ flag: `tour_${kit}_${key}`, name, desc, ...extra, ...(demoOf(key) ? { demo: demoOf(key) } : {}) });

  // `worked` is a worked case shown under the briefing: the steps of one calculation on a neighbouring case, one line each.
  if (Array.isArray(intro)) {
    intro.forEach((part, idx) => {
      const text = typeof part === 'string' ? part : part.body;
      const title = typeof part === 'string' ? speaker : (part.title || speaker);
      if (text) steps.push({ flag: `tour_bench_${kit}_${hash(text)}_${idx}`, name: title, desc: text, isBriefing: true, ...(idx === intro.length - 1 && worked?.length ? { lines: worked.slice() } : {}) });
    });
  } else if (intro) {
    steps.push({ flag: `tour_bench_${kit}_${hash(intro)}`, name: speaker, desc: intro, isBriefing: true, ...(worked?.length ? { lines: worked.slice() } : {}) });
  }

  // The instruments, in the order they stand on the plate (top to bottom, left to right). One step per fixture kind,
  // preferring a fixture that carries dials so multi-cylinder benches highlight the controllable cylinder.
  const fixtures = Object.values(table.fixtures || {}).sort((a, b) => {
    const da = Object.keys(a.dials || {}).length ? 0 : 1;
    const db = Object.keys(b.dials || {}).length ? 0 : 1;
    return da - db || a.at.y - b.at.y || a.at.x - b.at.x;
  });
  for (const f of fixtures) {
    if (f.props?.backdrop && f.noRun && !Object.keys(f.dials || {}).length) continue;
    if (SKIP_FIXTURES.has(f.kind)) continue;
    const twin = steps.some(st => st.flag === `tour_${kit}_fx_${f.kind}`);
    if (twin) continue;
    const { title, text, key } = fixtureStep(f, kit, table);
    add(key || `fx_${f.kind}`, title, text, { fx: f.id });
  }

  const hasFixture = kind => Object.values(table.fixtures || {}).some(f => f.kind === kind);
  const hasPiece = kind => Object.values(table.pieces || {}).some(p => !p.hidden && p.kind === kind);
  const allPieces = Object.values(table.pieces || {}).filter(p => !p.props?.scratch && !p.hidden);
  const seen = new Set();
  for (const p of allPieces) {
    let kind = p.kind;
    const own = PIECE[`${kit}:${kind}`];
    if (own) kind = `${kit}:${kind}`;
    else if (kind === 'neutron') kind = 'proton';
    else if (kind === 'electron') {
      const hasElectronTray = Object.values(table.zones?.trays || {}).some(z => z.accepts?.includes('electron'));
      kind = hasElectronTray ? 'electron' : 'proton';
    }
    if (seen.has(kind)) continue;
    seen.add(kind);
    if (SKIP_PIECES.has(kind)) continue;
    // Parts the instrument's own step already explains, or pieces that cannot be moved on this stage.
    if (kind === 'lens' && hasFixture('scope')) continue;
    if (kind === 'detector' && hasFixture('beam')) continue;
    if (kind === 'dish' && (hasFixture('scope') || hasFixture('cutter') || hasPiece('cutter') || !hasPiece('lens'))) continue;
    if (kind === 'speck' && hasFixture('field')) continue;
    if (kind === 'sample' && (hasFixture('assay') || hasFixture('tester') || hasFixture('flask'))) continue;
    if (kind === 'cuvette:cuvette' && hasFixture('spectro')) continue;
    if (kind === 'crate') continue;
    if (kind === 'charge' && hasFixture('cup')) continue;
    if (kind === 'ptc' && hasFixture('cells')) continue;
    if (kind === 'specimen' && allPieces.filter(q => q.kind === 'specimen').every(q => q.fixed)) continue;
    if (ligarSkip(table, p)) continue;
    // A marked particle is tapped, not carried.
    if (kind === 'proton' && p.props?.markable) {
      add('pc_marks', 'Marking particles', 'Tap a particle to mark or unmark it.', { pc: p.id });
      continue;
    }
    if (kind === 'electron') {
      add('pc_electron', 'Electrons', 'Drag an electron onto a shell ring.', { pc: p.id });
      continue;
    }
    const lig = ligarPiece(kind, kit, table);
    if (lig) { add(lig[2] || `pc_${kind}`, lig[0], lig[1], { pc: p.id }); continue; }
    const entry = EXTRA.pieces[`${kit}:${kind}`] || PIECE[kind];
    if (!entry) continue;
    add(`pc_${kind.replace(':', '_')}`, entry[0], entry[1] + (entry[2] ? entry[2](table) : ''), { pc: p.id });
  }

  // On the photocell bench, introduce dragging a metal plate onto the holder before adjusting the photocell dials.
  if (kit === 'optics') {
    const cellIdx = steps.findIndex(s => s.flag === 'tour_optics_fx_cell');
    const plateIdx = steps.findIndex(s => s.flag === 'tour_optics_pc_optics_plate');
    if (cellIdx !== -1 && plateIdx > cellIdx) {
      const [plateStep] = steps.splice(plateIdx, 1);
      steps.splice(cellIdx, 0, plateStep);
    }
  }

  const drum = Object.values(table.zones?.containers || {}).find(z => z.id === 'drum');
  if (drum) add('drum', drum.label || 'Drum', 'Click the drum, then click the empty pan to transfer.', { drum: drum.id });

  for (const t of table.tools || []) {
    const entry = TOOL[t];
    // Tools like Straightedge are introduced once globally on their very first use, not repeated per world.
    steps.push({
      flag: `tour_global_tool_${t}`,
      name: entry ? entry[0] : t,
      desc: entry ? entry[1] : `Press ${quote(t)} to use it.`,
      tool: t,
      ...(demoOf(`tool_${t}`) ? { demo: demoOf(`tool_${t}`) } : {})
    });
  }
  if (!steps.length) {
    const slot = Object.values(table.zones?.slots || {}).find(z => z.label && /predict/i.test(z.label));
    if (slot) {
      steps.push({
        flag: `tour_${kit}_predict_slot`,
        name: 'Make a prediction',
        desc: `Drag the card you think is right into the "${slot.label}" slot. Your prediction is not graded — the next bench tests it.`
      });
    }
  }
  return steps;
}

function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

/** The fixture kinds and piece kinds the Tour has words for (a kind outside these still gets a generic step). */
export const TOUR_KINDS = { fixtures: Object.keys(FIXTURE).filter(k => !k.includes(':')), pieces: Object.keys(PIECE), tools: Object.keys(TOOL) };

/**
 * A kit may bring its own words (`addTourText(fixtures, pieces)`): a fixture kind's `{title, text, dials?}` and a piece kind's
 * `[title, text, extra?]`, added to the tables above. The Ember Reach heat kit registers its instruments and pieces this way
 * (`table/kits/heat-tour.js`), so a kit's words live beside the kit.
 */
export function addTourText(fixtures = {}, pieces = {}) {
  Object.assign(FIXTURE, fixtures);
  Object.assign(PIECE, pieces);
}

/** A kit that extends another stands up its instruments under its own name: copy the words of `from:<kind>` to `to:<kind>` where `to` has none. */
export function aliasTourKit(from, to) {
  for (const k of Object.keys(FIXTURE)) {
    if (k.startsWith(`${from}:`)) { const alias = `${to}:${k.slice(from.length + 1)}`; if (!FIXTURE[alias]) FIXTURE[alias] = FIXTURE[k]; }
  }
}
