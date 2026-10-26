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
  scope: { title: 'Lens and Power dial', dials: false, text: 'The lens is the round tool on the shelf. Drag it on top of a dish to see a magnified picture of what that sample is made of. ' + DIAL.Power },
  reader: { title: 'Reader', text: 'Drag an atom into the reader slot. The reader then shows that atom\'s name and its mass.' },
  beam: { title: 'Beam and detectors', text: 'Press "{run}". A stream of tiny shots is sent at the thin foil. Each detector (Ahead, Side and Back) counts the shots that land on it, and adds to its count every time you fire again.' },
  field: { title: 'Charged plates', text: 'Drag specks into the bed between the two plates, then press "{run}". Charged plates pull sideways on anything that has an electric charge, and do nothing to anything that has none. Each speck is tagged "bent" or "straight" to show what happened to it.' },
  needle: { title: 'Charge needle', text: 'The needle shows the total electric charge of the atom it is attached to. A proton adds + charge and an electron adds − charge. The needle points to + when there are more protons, to − when there are more electrons, and rests on 0 when the two are equal.' },
  mass: { title: 'Mass counter', text: 'Shows the total mass of the atom. Protons and neutrons each add 1 to the mass, while electrons weigh almost nothing and do not change the reading.' },
  tester: { title: 'Tester', text: 'Drag a {item} into the slot, then press "{run}". The tester shows what the atom does with the electrons in its outer shell: it gives one away, takes one on, shares, or keeps all of them.' },
  'cards:tester': { title: 'Tester', text: 'Drag a card into the slot, then press "{run}". The tester shows what that atom does with the electrons in its outer shell: it gives one away, takes one on, shares, or keeps all of them.' },
  stamp: { title: 'Stamp', dials: false, text: 'Use the stamp to write down a number for the unmeasured card. ' + DIAL.Protons },
  plate: { title: null, text: 'A printed label with facts about a sample. You only read it; there is nothing to press.' },
  assay: { title: 'Chute, bins and beam', text: 'Drag a sample onto the chute, then press "{run}". The atoms fall into bins sorted by weight, each bin shows how many atoms it caught, and the beam underneath tips toward the heavier side.' },
  coder: { title: 'Code reader', dials: false, text: 'Use the "Bin" dial to pick a bin, then press "{run}". It shows the name of the element that bin\'s atoms belong to.' },
  balance: { title: 'Balance', text: 'Two pans hang from a beam. The beam tips down toward the heavier pan, and lies flat when both pans weigh the same.{counters}' },
  scale: { title: 'Scale', text: 'Drag something onto the pan to read how much it weighs. {runSentence}' },
  mixer: { title: 'Mix', text: 'This pan is filled with atoms of two kinds, a lighter kind and a heavier kind. The weight on the pan depends on how many of each there are.' },
  tally: { title: 'Tally', dials: false, text: 'Use the "Moles" dial to enter the number you worked out.' }
};

/** A kind of piece, by `kind`: [title, text, optional (table) => extra sentence]. Only kinds on the table get a step. */
const PIECE = {
  dish: ['Sample dishes', 'Each dish holds a sample of material, which you can look inside with the lens.', t => (hasTrays(t) ? ' Drag a dish into a tray to put it in that group.' : '')],
  lens: ['Lens', 'Drag the lens on top of a dish to see a magnified picture of what is inside it.'],
  cutter: ['Cutter', 'Drag the cutter across a dish. It cuts the sample into smaller pieces if it can be cut, and leaves it alone if it cannot.'],
  atom: ['Atoms', 'Drag one atom on top of another to join them into one group that moves together. Tap the line between two joined atoms to break them apart.', t => ligarAtomSentence(t)],
  proton: ['Particles', 'Drag a particle onto the atom to add it, or drag it off to take it away.', t => (hasNeedle(t) ? ' The charge needle changes as you add or remove them.' : '')],
  neutron: null,
  electron: null,
  nucleus: ['Middle of the atom', 'This is the middle of an atom, drawn big enough to see. Each disc is one particle; a disc with a + on it is a proton.'],
  specimen: ['Atom samples', 'Each sample is a picture of one atom. The dot is its middle, and each ring around it holds electrons, which are the small dots on the ring.', t => (hasCounts(t) ? ' Where a sample prints numbers, they count its protons and neutrons.' : '') + (hasTrays(t) ? ' Drag a sample into a tray to put it in that group.' : '')],
  speck: ['Specks', 'Each speck is a tiny particle from the middle of an atom, and they all look the same. Drag one into a tray to put it in that group.'],
  model: ['Model cards', 'Each card is a drawing of one idea of how an atom is built.', t => slotSentence(t)],
  detector: ['Detectors', 'A detector counts the shots that land on it. It stays where it is, and the count only goes up.'],
  ion: ['Charged tiles', 'Each tile shows its own charge, such as +2 or −1. Drag tiles onto the pad; the needle shows the total charge of the pad.'],
  element: ['Element cards', 'Each card is one element. It shows how many protons it has, one dot for each electron in its outer shell, and its weight.'],
  sample: ['Samples', 'Each sample is a pile of atoms. Drag one onto the chute to tip it out.'],
  crate: ['Crates', 'Each crate holds a stock of one kind of atom. Drag a crate onto a pan to weigh it against the other pan, or onto the scale to read what it weighs.'],
  token: null,
  /* ---- LIGAR (unit03) ---- */
  guess: ['Guess cards', 'Each card is one idea of what will happen.', t => ligarGuessSentence(t)]
};

/** Tool keys the table can carry on its foot dock. */
const TOOL = {
  straightedge: ['Straightedge', 'Press "Straightedge" to lay a line across the points on the strip, so you can see whether they fall in a straight line.']
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
/** The slot a choice goes in, named as the table names it: whatever is in it when Submit is pressed is the answer. */
const slotSentence = t => {
  const slot = Object.values(t.zones?.slots || {}).find(z => z.label);
  return slot ? ` Drag the card you choose into the \"${slot.label}\" slot. The card in that slot is your answer when you press Submit.` : ' Drag the card you choose into the slot.';
};
const hasNeedle = t => Object.values(t.fixtures || {}).some(f => f.kind === 'needle');
const hasCounts = t => Object.values(t.pieces || {}).some(p => p.kind === 'specimen' && p.props?.counts);
const quote = s => `"${s}"`;

/** The generic text for a fixture whose kind has no entry: its label, its key and its dials. */
function fallbackFixture(f, kitId) {
  const bits = [`${f.label}.`];
  if (f.runLabel) bits.push(`Press ${quote(f.runLabel)} to use it.`);
  for (const d of Object.values(f.dials || {})) bits.push(dialText(d, kitId));
  return bits.join(' ');
}

/** What one dial does: the kit's own words for it (`registerTour`), else the shared ones, else the plain how-to. */
function dialText(d, kitId) {
  return EXTRA.dials[`${kitId}:${d.label}`] || DIAL[d.label] || `Move the ${quote(d.label || 'its')} dial by dragging its knob or tapping its groove.`;
}

/** The title and text of a fixture: what it is and does, then each dial it carries that the text has not covered. */
function fixtureStep(f, kitId, table) {
  const own = ligarFixture(f, kitId, table);
  if (own) {
    const dials = own.ownDials ? [] : Object.values(f.dials || {}).map(d => DIAL[d.label] || `Move the ${quote(d.label || 'its')} dial by dragging its knob or tapping its groove.`);
    return { title: own.title, text: [own.text, ...dials].join(' ') };
  }
  const entry = EXTRA.fixtures[`${kitId}:${f.kind}`] || FIXTURE[`${kitId}:${f.kind}`] || FIXTURE[f.kind];
  if (!entry) return { title: f.label, text: fallbackFixture(f, kitId) };
  const runSentence = f.runLabel ? `Press "${f.runLabel}" to record the reading as a point on the strip.` : '';
  const text = entry.text
    .replace('{run}', f.runLabel || 'Run')
    .replace('{item}', 'sample')
    .replace('{runSentence}', runSentence)
    .replace('{counters}', f.props?.counters ? ' The counter above a pan shows how many atoms are on it.' : '')
    .trim();
  const dials = entry.dials === false ? [] : Object.values(f.dials || {}).map(d => dialText(d, kitId));
  return { title: entry.title || f.label, text: [text, ...dials].join(' ') };
}

/**
 * The steps for a table. `intro` is the stage's briefing (what Vess says), kept as the first step when there is one.
 *
 * @param {object} table  a `createTable` state
 * @param {{intro?: string, speaker?: string}} [opts]
 * @returns {Array<{flag: string, name: string, desc: string}>}
 */
export function tourSteps(table, { intro = '', speaker = 'Vess' } = {}) {
  if (!table) return [];
  const kit = table.kit;
  const steps = [];
  const add = (key, name, desc) => steps.push({ flag: `tour_${kit}_${key}`, name, desc });
  // What is true on every table is said once in the whole game, never per kit and never again when the Tour is replayed.
  const addGeneral = (key, name, desc, once = false) => steps.push({ flag: `tour_${key}`, name, desc, ...(once ? { once: true } : {}) });

  if (intro) steps.push({ flag: `tour_bench_${kit}_${hash(intro)}`, name: speaker, desc: intro });
  addGeneral('table', 'Moving pieces', 'Drag a piece to pick it up and put it down somewhere else, or tap it once and then tap the place you want it to go. The Undo key takes back your last move, and Start Over puts everything back where it began. When your answer is on the table, press Submit.', true);

  // The instruments, in the order they stand on the plate (top to bottom, left to right).
  const fixtures = Object.values(table.fixtures || {}).sort((a, b) => a.at.y - b.at.y || a.at.x - b.at.x);
  for (const f of fixtures) {
    // A plain surface things stand on has nothing to explain; one with a key or a dial is an instrument.
    if (f.props?.backdrop && f.noRun && !Object.keys(f.dials || {}).length) continue;
    const { title, text } = fixtureStep(f, kit, table);
    const twin = steps.some(st => st.flag === `tour_${kit}_fx_${f.kind}`);
    add(twin ? `fx_${f.kind}_${f.id}` : `fx_${f.kind}`, title, text);
  }

  const hasFixture = kind => Object.values(table.fixtures || {}).some(f => f.kind === kind);
  // The kinds of piece on the table, once each, fixed furniture included (a fixed detector is still a thing to read).
  const seen = new Set();
  for (const p of Object.values(table.pieces || {})) {
    if (p.props?.scratch || p.hidden) continue;
    let kind = p.kind;
    // A kit may have its own words for a kind (`<kit>:<kind>`, Lanternfall's lamps, plates and cards); they come before the shared ones.
    const own = PIECE[`${kit}:${kind}`];
    if (own) kind = `${kit}:${kind}`;
    else if (kind === 'neutron' || kind === 'electron') kind = 'proton';
    if (seen.has(kind)) continue;
    seen.add(kind);
    // Parts the instrument's own step already explains.
    if (kind === 'lens' && hasFixture('scope')) continue;
    if (kind === 'detector' && hasFixture('beam')) continue;
    if (kind === 'token') continue;
    if (ligarSkip(table, p)) continue;
    // A marked particle is tapped, not carried.
    if (kind === 'proton' && p.props?.markable) {
      add('pc_marks', 'Marking particles', 'Tap a particle to mark it as part of your answer. A ring appears round it so you can see which ones you have picked. Tap it again to unmark it. When you press Submit, your answer is the particles that have a ring.');
      continue;
    }
    const lig = ligarPiece(kind, kit, table);
    if (lig) { add(`pc_${kind}`, lig[0], lig[1]); continue; }
    const entry = EXTRA.pieces[`${kit}:${kind}`] || PIECE[kind];
    if (entry) add(`pc_${kind.replace(':', '_')}`, entry[0], entry[1] + (entry[2] ? entry[2](table) : ''));
    else add(`pc_${kind}`, p.label || kind, `${p.label || 'This piece'}: drag it to move it, or tap it once and then tap the place you want it to go.`);
  }

  // Where answers go.
  const trays = Object.keys(table.zones?.trays || {}).filter(id => !id.startsWith('scr-'));
  if (trays.length) addGeneral('trays', 'Trays', 'Drag pieces into the trays. When you press Submit, your answer is whatever is in the trays.');
  if (table.zones?.rail) addGeneral('rail', 'The strip', 'Drag cards onto the strip. They stay in the order you put them, and dropping a card between two others makes them slide apart to make room.');
  const drum = Object.values(table.zones?.containers || {}).find(z => z.id === 'drum');
  if (drum) add('drum', drum.label || 'Drum', 'The drum holds the material to pour. Drag from the drum onto the Pour pan, or tap the drum and then the pan. Each pour moves one fixed amount.');
  if (!LIGAR_KITS.has(kit) && Object.keys(table.zones?.containers || {}).filter(id => id !== 'drum').length && !hasFixture('balance') && !hasFixture('scale')) add('containers', 'Pans', 'Drag a piece onto a pan to put it there. Whatever is on a pan is what gets weighed.');
  if (table.prediction) addGeneral('prediction', 'Prediction', 'Drag the token that says what you expect into the slot. It is only your guess: nothing is marked right or wrong, and the next part tests it.');
  if (!LIGAR_KITS.has(kit) && table.recorder && table.recorder.box && table.recorder.box.size.w > 2 && Object.values(table.fixtures || {}).some(f => !f.noRun)) addGeneral('strip', 'Paper strip', 'Each time you take a reading, it is added to the strip as a point, so you can compare your readings.');

  for (const t of table.tools || []) {
    const entry = TOOL[t];
    add(`tool_${t}`, entry ? entry[0] : t, entry ? entry[1] : `Press ${quote(t)} to use it.`);
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
