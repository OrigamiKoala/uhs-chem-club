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
    title: 'Charge meter',
    text: () => 'The charge meter shows the total charge of the atoms joined to the magnesium atom. Drag an atom onto another to join it. The meter points to + if the joined atoms have lost more electrons than they gained, to − if they gained more, and rests on 0 when the two balance.',
    dials: false
  },
  'bonds:lattice': {
    title: 'Salt crystal',
    text: () => 'The crystal is twelve ions, sodium (+) and chloride (−), each touching only ions of the opposite charge. Press "Slide a Layer" to move the top row one place along; press it again to move it back. The plate counts the pairs of like charges that sit side by side after the slide, and arrows show which way those ions are forced.'
  },
  'bonds:wells': {
    title: 'Energy curve',
    text: (f) => `Each pair is two atoms on a track. Drag the pair's dial to move the atoms apart or together. The graph draws the energy of the pair at every distance you have moved it through, so the curve builds up as you drag.${f.props?.components ? ' The two dotted traces are the attraction and the repulsion that add up to the curve.' : ''}${f.props?.marker ? ` The "${f.dials[f.props.marker].label}" dial lays a level line across the graph, that far below zero.` : ''}`,
    dials: false
  },
  'atoms:slate': {
    title: 'Structure board',
    text: () => 'The board shows one molecule: its atoms, and a gap between each two atoms that could bond. Drag a Pair onto a gap to share it between the two atoms beside it, or onto an atom to leave it on that atom alone. Each atom has a light that comes on when it has all the electrons it can hold round it, and the board counts the electrons still to place.',
    dials: false
  },
  'atoms:tally': {
    title: 'Answer dial',
    text: (f) => `This dial is where you give your answer, under "${Object.values(f.dials || {})[0]?.label || f.label}". Drag it to the setting you mean; whatever it shows when you press Submit is your answer.`,
    dials: false
  },
  'domain:turner': {
    title: 'Turn dial',
    text: () => 'This dial turns your view round the central atom, so you can look at the model from the side. It changes how you look at the molecule, never the molecule.',
    dials: false
  },
  'domain:marker': {
    title: 'Answer dial',
    text: () => 'This dial is where you give your answer. Drag it to the number you mean; whatever it shows when you press Submit is your answer.',
    dials: false
  },
  'domain:plates': {
    title: 'Charged plates',
    text: () => 'Two charged plates stand either side of a gap, the left one positive and the right one negative. Put a molecule in the gap and press "Switch Field". A molecule with a positive end and a negative end turns to line up with the plates; one without stays just as it was.',
    dials: false
  },
  'domain:twist': {
    title: 'Bond to turn',
    text: () => 'Each picture is one bond with an end that could turn. Drag the "Far End" dial to turn that end. If the bond lets it turn, the end stays where you put it; if not, it springs back.',
    dials: false
  },
  'domain:mixbowl': {
    title: 'Mixer',
    text: () => 'Drag orbitals of the atom into the mixer. The orbitals they mix into are drawn beside it, and any orbital you did not use stays as it was. Drag an orbital out again to take it back.',
    dials: false
  },
  'mo:magnet': {
    title: 'Magnet',
    text: (f) => `${f.props?.slot ? 'Drag a gas card into the "Gas to test" slot, then ' : ''}press "Test Sample". The magnet is held beside the real gas and shows whether the gas is attracted to it.`,
    dials: false
  },
  'mo:overlap': {
    title: 'Two atoms and their orbitals',
    text: (f) => `The picture shows two atoms, each with one orbital, and the combined orbital the two make: the brighter a place, the more likely the electron is there, and the colour shows the sign of the wave. Drag the "Distance" dial to move the atoms apart or together.${f.dials?.sign ? ' The "Signs" dial turns one atom\'s orbital over, from + to −.' : ''} The marks at the right show the energy of the combined orbital, BOTH, against the energy of each atom on its own.`,
    dials: false
  },
  'mo:marker': {
    title: 'Answer dial',
    text: () => 'This dial is where you give your answer. Drag it to the setting you mean; whatever it shows when you press Submit is your answer.',
    dials: false
  },
  'mo:rack': {
    title: 'Energy levels',
    text: () => 'The diagram runs from low energy at the bottom to high energy at the top. Each atom\'s own orbitals stand at the sides, and the molecular orbitals the two atoms make together stand in the middle. Drag an electron from the jar into an orbital (or tap the jar, then the orbital); an orbital takes two, one pointing each way. The diagram counts the unpaired electrons.',
    dials: false
  }
};

/** A kind of piece, by `kit:kind`: `[title, text, optional (table) => extra sentence]`. */
const PIECE = {
  'bonds:slab': ['Blocks', 'Each block is a lump of material, with a picture of its particles; a + or − marks a particle that carries a charge. Drag a block onto the hotplate to heat it.', t => (hasKind(t, 'leads') ? ' Drag the leads onto a block to test whether it conducts.' : '')],
  'bonds:hammer': ['Hammer', 'Drag the hammer onto a block to strike it once. The block prints what the blow did to it, and its picture shows how the rows of atoms moved.'],
  'bonds:guess': ['Cards', 'Each card carries a few words. Drag a card to the slot where it belongs.'],
  'bonds:leads': ['Leads', 'The leads connect the block they lie on to a lamp, which lights on that block while a current passes. Drag the leads onto a block and watch the lamp; a streak behind a particle in the picture shows that it is moving.'],
  'bonds:salt': ['Salt cards', 'Each card is one ionic solid, drawn as its two kinds of ion touching, with the charge on each and the distance between their centres. Drag a card onto the hotplate to melt it.'],
  'bonds:pairtag': ['Pair cards', 'Each card stands for one of the pairs of atoms on the graph. Drag the cards into order on the rail.'],
  'bonds:ion': ['Ions', 'Each ion shows its element and its charge, + or −. An ion ringed in amber sits beside an ion of the same charge.'],
  'atoms:pairs': ['Pair', 'Drag the Pair piece onto a gap to share a pair of electrons between the two atoms beside it, or onto an atom to leave the pair on that atom. Each atom\'s light shows what the placing did.'],
  'atoms:single': ['Single', 'Drag the Single piece onto an atom to leave one electron on it, with no partner.'],
  'atoms:lift': ['Lift Out', 'Drag "Lift Out" onto a gap or an atom to take a pair back off it, so you can try it somewhere else.'],
  'atoms:fcstamp': ['Charge reader', 'Drag the charge reader onto an atom of the structure. It prints that atom\'s formal charge, which changes when you change the structure.'],
  'atoms:mark': ['Mark', 'Drag the Mark onto an atom to leave a dashed ring on it. Your answer is the atom that carries the ring when you press Submit.'],
  'atoms:gauge': ['Length meter', 'Drag the length meter onto a bond. It prints how long that bond measures in the real molecule, in pm, which is not always what the drawing suggests.'],
  'domain:hub': ['Central atom', 'The atom in the middle of the model. Bonds and lone pairs dropped on it repel each other and settle as far apart as they can, in every direction, not only along the table.'],
  'domain:arm': ['Bonds', 'Each of these is a bond to another atom. Drag one from the tray onto the central atom; drag it off again to take it away. A double or triple bond still counts as one electron domain.'],
  'domain:balloon': ['Lone pair', 'A lone pair of electrons that belongs to the central atom alone. It is an electron domain like a bond, but it has no atom on it.'],
  'domain:protractor': ['Protractor', 'Drag the protractor onto one bond and then onto another. It reads the angle between the two, in degrees.'],
  'domain:dmol': ['Molecule cards', 'Each card is one molecule. Drag it into the gap between the plates, then press "Switch Field" and watch what it does.', t => (hasKind(t, 'arrows') ? ' Drag the dipole arrows onto a card to see each bond\'s dipole.' : '')],
  'domain:tmol': ['Molecule card', 'This card is one molecule. Drag it into the gap between the plates, then press "Switch Field" and watch whether it turns. Pick it up and press "Flip" to turn it end for end.', t => (hasKind(t, 'arrows') ? ' Drag the dipole arrows onto it to see the bond\'s dipole.' : '')],
  'domain:mol': ['Molecule cards', 'Each card is one molecule, drawn with its bonds, and prints what the stage needs to know about it.'],
  'domain:arrows': ['Dipole arrows', 'Drag the dipole arrows onto a molecule card. An arrow is drawn along each bond toward the atom that holds the shared pair closer, and one amber arrow shows which way they add up, if they do not balance.'],
  'domain:orb': ['Orbitals', 'Each piece is one orbital of an atom, drawn with the electrons in it. Drag one into the mixer, or onto an orbital of another atom to try to bond the two.'],
  'mo:mocard': ['Gas cards', 'Each card is one gas. Drag a card into the "Gas to test" slot and press "Test Sample"; the card keeps what the magnet did.'],
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
