/**
 * tour-ligar.js — what the Tour says about the instruments and pieces of Ligar's benches (the bonds, domain and orbital kits, and the
 * atom kit's slate and gauge).
 *
 * Written like every Tour step (`tour.js`): three beats, in everyday words, no word the bench has not earned. WHAT IT IS (what you can see
 * on the table), WHAT TO DO WITH IT (the exact drag, tap or key) and WHAT IT TELLS YOU. It says how a tool works and never which move
 * solves the stage. Kept in its own file so the other worlds' steps are untouched; `tour.js` asks `ligarFixture` / `ligarPiece` first.
 *
 * Words are watched by `verify:table` against each quest's `VOCABULARY`: a step on a stage may not use a term that stage's own reward
 * card is the one to introduce.
 */

/** Kits whose benches have no paper strip and no weighing pans, whatever else they hold. */
export const LIGAR_KITS = new Set(['bonds', 'domain', 'mo']);

const hasKind = (t, kind) => Object.values(t.pieces || {}).some(p => p.kind === kind && !p.hidden);
const hasFixture = (t, kind) => Object.values(t.fixtures || {}).some(f => f.kind === kind);

/** An instrument, by `kit:kind`: `{ title?, dials?: false, text(f, table) }`. The text covers the fixture's own dials. */
const FIXTURE = {
  'bonds:hotplate': {
    title: 'Hotplate and Heat dial',
    text: (f, t) => `The hotplate is the square plate at the top, with a "Heat" dial on its edge. Drag a ${hasKind(t, 'salt') ? 'salt card' : 'block'} onto the plate, then drag the dial to raise the temperature. The piece on the plate shows MOLTEN once the plate is hot enough to melt it, and goes solid again when you lower the dial or lift it off.`,
    dials: false
  },
  // The needle of bench one reads the group joined to one atom, not a single atom's particles.
  'atoms:needle': {
    title: 'Charge needle',
    text: () => 'The needle shows the total charge of the group of atoms joined to the one it is attached to. It points to + if the group has given away more electrons than it took, to − if it took more, and rests on 0 when they balance.',
    dials: false
  },
  'bonds:lattice': {
    title: 'Grid',
    text: () => 'The grid is a board of empty cells. Drag an ion into a cell, then press "Slide a Layer" to shift the top row one place along. The board counts how many ions touch one of the same charge, and marks each ion that does with a stencilled !.'
  },
  'bonds:wells': {
    title: 'Pull the pair',
    text: (f) => `Each pair is two atoms on a track, and the dial under it is your hand. Drag the dial to pull the atoms apart or push them together. The graph draws the energy of the pair at every separation your hand has been through, so the curve builds up as you pull.${f.props?.marker ? ' The "Depth" dial lays a level line across the graph, to measure down to.' : ''}`,
    dials: false
  },
  'atoms:slate': {
    title: 'Slate',
    text: () => 'The slate shows one molecule: its atoms, and a joint in the gap between each two that could share electrons. Drag a Pair onto a joint to share it between the two atoms beside it, or onto an atom to leave it there. Each atom has a lamp that lights when it has all the electrons it can hold round it, and the slate counts how many electrons are left to place.',
    dials: false
  },
  'atoms:tally': {
    title: 'Length dial',
    text: () => 'This dial is where you write down a length. Drag it to the number you read, in pm; the number it shows when you press Submit is your answer.',
    dials: false
  },
  'domain:turner': {
    title: 'Turn dial',
    text: () => 'This dial turns your view round the hub, so you can look at the arms from the side. It changes how you look at the molecule, never the molecule.',
    dials: false
  },
  'domain:marker': {
    title: 'Marker',
    text: () => 'The marker is where you write down a number you have read. Drag its dial to the number you worked out; whatever it shows when you press Submit is your answer.',
    dials: false
  },
  'domain:plates': {
    title: 'Charged plates',
    text: () => 'Two charged bars stand either side of a gap, the left one plus and the right one minus. Put a molecule in the gap and press "Switch Field". A molecule that is pulled round turns to line up with the bars; one that is not pulled stays just as it was.',
    dials: false
  },
  'domain:twist': {
    title: 'Bond to twist',
    text: () => 'Each picture is one bond with an end that could turn. Drag the "Far End" dial to turn that end. If the bond lets it turn, the end stays where you put it; if not, it springs back.',
    dials: false
  },
  'domain:mixbowl': {
    title: 'Mixing bowl',
    text: () => 'Drag orbitals into the bowl to blend them. The lobes that come out of the blend are drawn beside the bowl, and any orbital you did not use stands over as it was.',
    dials: false
  },
  'mo:magnet': {
    title: 'Magnet',
    text: (f) => `${f.props?.slot ? 'Drag a gas card into the "Gas to test" slot, then ' : ''}press "Test Sample". The magnet pulls on the real gas and shows how hard, from 0 for no pull upward.`,
    dials: false
  },
  'mo:rack': {
    title: 'Ladder of boxes',
    text: () => 'The ladder runs from low energy at the bottom to high energy at the top. The two atoms\' own boxes stand at the sides, and the boxes they make together stand in the middle, in rows. Drag an electron from the jar into a box (or tap the jar, then the box); a box takes two, one pointing each way. The ladder counts what you have placed and how many electrons are unpaired.',
    dials: false
  }
};

/** A kind of piece, by `kit:kind`: `[title, text, optional (table) => extra sentence]`. */
const PIECE = {
  'bonds:slab': ['Blocks', 'Each block is a lump of material, with a picture of its atoms under the glass. Drag a block onto the hotplate to heat it.', t => (hasKind(t, 'leads') ? ' Lay the leads on a block to test it.' : '')],
  'bonds:hammer': ['Hammer', 'Drag the hammer onto a block to strike it once. The block shows what the blow did to it, and the picture of its atoms shows how the rows moved.'],
  'bonds:guess': ['Atom cards', 'Each card carries a few words. Drag a card to the slot or tray where it belongs.'],
  'bonds:leads': ['Leads', 'The leads clip across the block they lie on, and they light a lamp on that block while a current passes through it. Drag the leads onto a block and watch the lamp; lift them off to test another block.'],
  'bonds:salt': ['Salt cards', 'Each card is one salt, drawn as its two kinds of ion touching, with the charge on each and the distance between their centres. Drag a card onto the hotplate to melt it.'],
  'bonds:pairtag': ['Pair cards', 'Each card names one pair of atoms and shows the rods held between them. Put the cards in order on the strip.'],
  'bonds:ion': ['Ions', 'Each ion shows its element and its charge, + or −. Drag an ion into a cell of the grid; ions in cells that touch sit side by side.'],
  'atoms:pairs': ['Pair', 'Drag the Pair tile onto a joint to share a pair of electrons between the two atoms beside it, or onto an atom to leave the pair on that atom. The lamps show what each placing did.'],
  'atoms:single': ['Single', 'Drag the Single tile onto an atom to leave a single electron on it. The slate counts it as one electron, and the atom\'s lamp counts it round that atom.'],
  'atoms:lift': ['Lift Out', 'Drag "Lift Out" onto a joint or an atom to take a pair back off it, so you can try it somewhere else.'],
  'atoms:fcstamp': ['Stamp', 'Drag the Stamp onto an atom of the drawing. It prints the charge that atom carries, which changes when you change the drawing.'],
  'atoms:mark': ['Mark', 'Drag the Mark onto an atom to leave a dashed ring on it. Your answer is the atom that wears the ring when you press Submit.'],
  'atoms:gauge': ['Gauge', 'Drag the Gauge onto a joint. It clamps across that bond and prints how long the bond measures in the real molecule, in pm, which is not always what the drawing says.'],
  'domain:hub': ['Hub', 'The hub is the atom in the middle. Drop arms and balloons on it and they push each other as far apart as they can get, in every direction, not only along the table.'],
  'domain:arm': ['Arms', 'Each arm is an atom that clips onto the hub. Drag an arm from the tray onto the hub; drag it off again to take it away. A double or triple bond is still one arm.'],
  'domain:balloon': ['Lone-pair balloon', 'A balloon stands for a lone pair of electrons that belongs to the hub alone. It takes room on the hub like an arm, but it has no atom on it.'],
  'domain:protractor': ['Protractor', 'Lay the protractor on one arm and then on another. It reads the angle between the two arms, in degrees.'],
  'domain:dmol': ['Molecule cards', 'Each card is one molecule. Drag it into the gap between the bars, then press "Switch Field" and watch what it does.', t => (hasKind(t, 'arrows') ? ' Lay the Arrows on a card to see the pull of each bond.' : '')],
  'domain:tmol': ['Molecule card', 'This card is one molecule. Drag it into the gap between the bars, then press "Switch Field" and watch whether it swings round. Pick it up and press "Flip" to turn it half a turn.', t => (hasKind(t, 'arrows') ? ' Lay the Arrows on it to see the pull of each bond.' : '')],
  'domain:mol': ['Molecule cards', 'Each card is one molecule, with the number of arms its centre holds.'],
  'domain:arrows': ['Arrows', 'Lay the Arrows on a molecule card. It draws an arrow across each bond toward the atom that pulls the shared pair harder, and one amber arrow for the total pull. The size of the total is printed on the card.'],
  'domain:rod': ['Charged rod', 'Lay the rod on a stream. A charged rod pulls on a stream whose molecules turn in a field and bends it toward the rod; any other stream runs straight on.'],
  'domain:stream': ['Streams', 'Each stream is a thin flow of one liquid. The dashed line shows where it would fall if nothing pulled it.'],
  'domain:orb': ['Orbitals', 'Each piece is one orbital of an atom, drawn with the electrons in it. Drop one in the bowl to blend it, or drop one on another orbital to try to bond the two. A bonded pair of atoms is drawn together.'],
  'mo:mocard': ['Gas cards', 'Each card is one gas. Drag a card into the "Gas to test" slot and press "Test Sample"; the card keeps the reading the magnet gave.']
};

/** A piece the instrument's own step already explains (a slate's fixed atoms and joints), so the Tour leaves it out. */
export function ligarSkip(table, p) {
  return Boolean(p.props?.slate) && (p.kind === 'atom' || p.kind === 'joint');
}

export const ligarFixture = (f, kitId, table) => {
  const e = FIXTURE[`${kitId}:${f.kind}`];
  // Only the group-charge needle of Ligar's first bench is Ligar's; Tallow's needle reads one atom's particles.
  if (f.kind === 'needle' && !f.props?.cluster) return null;
  return e ? { title: e.title || f.label, text: e.text(f, table), ownDials: e.dials === false } : null;
};

export const ligarPiece = (kind, kitId, table) => {
  const e = PIECE[`${kitId}:${kind}`];
  return e ? [e[0], e[1] + (e[2] ? e[2](table) : '')] : null;
};

/** Fixture and piece keys this file speaks for, for `verify:table`. */
export const LIGAR_TOUR_KEYS = { fixtures: Object.keys(FIXTURE), pieces: Object.keys(PIECE) };
void hasFixture;
