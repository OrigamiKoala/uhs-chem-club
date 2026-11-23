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
    title: 'Hotplate',
    text: (f, t) => `Drag a ${hasKind(t, 'salt') ? 'salt card' : 'block'} onto the hotplate and raise the "Heat" dial.`,
    dials: false
  },
  'atoms:needle': {
    title: 'Charge meter',
    text: () => 'Shows total charge of the joined atoms.',
    dials: false
  },
  'bonds:lattice': {
    title: 'Salt crystal',
    text: () => 'Press "Slide a Layer" to shift the top row of ions.'
  },
  'bonds:wells': {
    title: 'Energy curve',
    text: () => 'Drag the dial to move the atoms and plot their energy.',
    dials: false
  },
  'atoms:slate': {
    title: 'Structure board',
    text: f => (f.props?.loose
      ? 'Drag one atom onto another: they share an electron pair, drawn as a line (a bond). The number on each atom counts the electrons in its outer shell, and its ring lights when that shell is full.'
      : 'Drag an Electron pair onto a gap to form a bond, or onto an atom as a lone pair.'),
    key: f => (f.props?.loose ? 'fx_slateloose' : null),
    dials: false
  },
  'atoms:tally': {
    title: 'Answer dial',
    text: () => 'Drag the dial to your answer.',
    dials: false
  },
  'domain:turner': {
    title: '3D Joystick',
    text: () => 'Drag the joystick smoothly in any direction to rotate the 3D molecule.',
    dials: false
  },
  'domain:marker': {
    title: 'Answer dial',
    text: () => 'Drag the dial to your answer.',
    dials: false
  },
  'domain:plates': {
    title: 'Charged plates',
    text: () => 'Put a molecule in the gap, then press "Switch Field".',
    dials: false
  },
  'domain:twist': {
    title: 'Bond to turn',
    text: () => 'Drag the "Far End" dial to test whether the bond rotates.',
    dials: false
  },
  'domain:mixbowl': {
    title: 'Mixer',
    text: () => 'Drag orbitals into the mixer to combine them.',
    dials: false
  },
  'mo:magnet': {
    title: 'Magnet',
    text: f => `${f.props?.slot ? 'Put a gas card in the slot, then press' : 'Press'} "Test Sample".`,
    dials: false
  },
  'mo:overlap': {
    title: 'Orbital overlap',
    text: f => `Drag "Distance" to move the atoms${f.dials?.sign ? ', or flip "Signs" to reverse one orbital\'s sign' : ''}.`,
    dials: false
  },
  'mo:marker': {
    title: 'Answer dial',
    text: () => 'Drag the dial to your answer.',
    dials: false
  },
  'mo:rack': {
    title: 'Energy levels',
    text: () => 'Drag electrons from the jar into the orbitals.',
    dials: false
  }
};

/** A kind of piece, by `kit:kind`: `[title, text, optional (table) => extra sentence]`. */
const PIECE = {
  'bonds:slab': null,
  'bonds:hammer': ['Hammer', 'Drag the hammer onto a block to strike it.'],
  'bonds:guess': null,
  'bonds:leads': ['Conductivity tester', 'Sends a small electric current through a sample and lights up if charge can flow. Drag it onto a block, cold or molten, to test whether electricity passes through.'],
  'bonds:salt': ['Salt cards', 'Drag a salt card onto the hotplate to melt it.'],
  'bonds:pairtag': null,
  'bonds:ion': ['Ions', 'Each ion shows its element and charge.'],
  'atoms:pairs': ['Electron pair', 'Drag onto a gap to share, or onto an atom as a lone pair.'],
  'atoms:single': ['Single electron', 'Drag onto an atom to place one electron on it.'],
  'atoms:lift': ['Remove', 'Drag onto a gap or atom to take back what you placed there.'],
  'atoms:fcstamp': ['Charge reader', 'Drag onto an atom to read its formal charge.'],
  'atoms:mark': ['Mark', 'Drag onto an atom to mark it as your answer.'],
  'atoms:gauge': ['Length meter', 'Drag onto a bond to measure its length.'],
  'domain:hub': ['Central atom', 'Drop bonds and lone pairs here; they repel and spread out. Click two attached atoms to measure the angle between them.'],
  'domain:arm': ['Bonds', 'Drag onto the central atom to add a bond; drag off to remove.'],
  'domain:balloon': ['Lone pair', 'Drag onto the central atom as a lone pair.'],
  'domain:protractor': ['Protractor', 'Drag onto two bonds to measure the angle between them.'],
  'domain:dmol': ['Molecule cards', 'Drag into the gap between plates, then press "Switch Field".'],
  'domain:tmol': ['Molecule card', 'Drag between plates, then use "Rotate Molecule" and "Switch Field".'],
  'domain:mol': null,
  'domain:arrows': ['Dipole arrows', 'Drag onto a molecule card to draw its bond dipoles.'],
  'domain:orb': ['Orbitals', 'Drag into the mixer, or onto another atom\'s orbital to bond.'],
  'mo:mocard': ['Gas cards', 'Drag into the slot and press "Test Sample".']
};

/** On a loose slate (atoms bonded by dragging them together) the electron pieces say what they do there. */
const LOOSE_PIECE = {
  'atoms:pairs': ['Electron pair', 'Drag onto an atom to give it a lone pair: two electrons that stay on that atom. Drag onto a bond to share one more pair.', 'pc_pairsloose'],
  'atoms:lift': ['Remove', 'Drag onto an atom or a bond to take back one electron pair.', 'pc_liftloose'],
  'atoms:single': ['Single electron', 'Drag onto an atom to place one electron on it, alone.', 'pc_singleloose']
};
const looseSlate = t => Object.values(t?.fixtures || {}).some(f => f.kind === 'slate' && f.props?.loose);

/** A piece the instrument's own step already explains (a slate's fixed atoms and joints), so the Tour leaves it out. */
export function ligarSkip(table, p) {
  return Boolean(p.props?.slate) && (p.kind === 'atom' || p.kind === 'joint');
}

export const ligarFixture = (f, kitId, table) => {
  const e = FIXTURE[`${kitId}:${f.kind}`];
  // Only the group-charge needle of Ligar's first bench is Ligar's; Tallow's needle reads one atom's particles.
  if (f.kind === 'needle' && !f.props?.cluster) return null;
  return e ? { title: e.title || f.label, text: e.text(f, table), ownDials: e.dials === false, key: e.key?.(f) || null } : null;
};

/** `[title, text, key?]`: `key` names the step when it differs from the plain `pc_<kind>` (its own demo). */
export const ligarPiece = (kind, kitId, table) => {
  const loose = looseSlate(table) && LOOSE_PIECE[`${kitId}:${kind}`];
  if (loose) return loose.slice();
  const e = PIECE[`${kitId}:${kind}`];
  return e ? [e[0], e[1] + (e[2] ? e[2](table) : '')] : null;
};

/** Fixture and piece keys this file speaks for, for `verify:table`. */
export const LIGAR_TOUR_KEYS = { fixtures: Object.keys(FIXTURE), pieces: Object.keys(PIECE) };
void hasFixture;
