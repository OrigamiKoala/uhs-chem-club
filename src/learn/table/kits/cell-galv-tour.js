/**
 * kits/cell-galv-tour.js — what the Tour says about the open cell (Brinewire, `q3-galvanic`). Three beats a step: what it is, what to do
 * with it, what it tells you. Plain words, none the bench has not earned: no bridge, anode, cathode or half-cell word. It says how a tool
 * works and how to read it, never which move solves the stage. The rig's sentence follows what is on THIS stage's cell.
 */
import { addTourText } from '../tour.js';

const rigText = f => {
  const p = f.props || {};
  const bits = [];
  bits.push(`Two beakers each hold a strip of one metal in a solution of its own ions, and a wire joins the two strips.${p.sealed ? ' The metals are hidden behind letters.' : ''}`);
  if (p.ammeter) bits.push('The ammeter sits on the wire. Its needle swings to the side that the electrons move toward in the wire and rests in the middle when no current flows. The dial says which side is which.');
  if (p.linkSeat) bits.push('The seat between the beakers takes a piece from the table.');
  if (p.wireSeat) bits.push('The seat above takes a piece that joins the two strips another way.');
  if (p.strips) bits.push('Drag a strip into the seat above each beaker, or tap it and then tap the seat; it then stands in the solution.');
  if (p.windows) bits.push('Each beaker also has a window: round dots are positive ions and square dots are negative ions, counted for the beaker as it stands now.' + (p.windows === 'metal' ? ' The number of atoms in the strip is counted under it.' : ' The ions the bridge brings in are counted under each beaker too.'));
  if (p.bridgeWindow) bits.push('The glass tube between the beakers shows the ions inside it as two rows, with a short line behind each ion that has moved.');
  if (p.marks) bits.push('The two seats above the beakers take a card each.');
  bits.push(`Press "Run" to run the cell for ${p.runText || 'a fixed time'}.${p.plot ? ' The plot beside it draws the current second by second.' : ''}`);
  if (p.says) bits.push('Use the "Electrons move toward" dial to record which beaker you think the electrons move toward.');
  return bits.join(' ');
};

addTourText({
  'cell:cellgalv': { title: 'Cell', dials: false, text: (f) => rigText(f) },
  'cell:cellgalvplot': {
    title: 'Current plot', dials: false,
    text: 'The plot draws the current, in amperes, against the seconds of each run, up to the second the run has reached. Every run adds a line in a new colour, and the key under the plot says what was in the cell for that run.'
  },
  'cell:cellgalvbal': {
    title: 'Balance', dials: false,
    text: 'Lay a strip on the pan to read its mass in grams. The reading is shown only while the strip is on the pan. The list under it keeps each mass that has been read, in order.'
  }
}, {
  cellgalvtube: ['Salt tube', 'A bent glass tube filled with salt solution. Drag it into the seat between the beakers, or tap it and then tap the seat; each end then dips into a beaker. Run the cell to see what it does to the current.'],
  cellgalvrod: ['Glass rod', 'A solid glass rod. Drag it into the seat between the beakers, or tap it and then tap the seat; each end then dips into a beaker. Run the cell to see what it does to the current.'],
  cellgalvwire: ['Second wire', 'A second metal wire. Drag it into the wire seat, or tap it and then tap the seat; it then joins the two strips a second way. Run the cell to see what it does to the current.'],
  cellgalvstrip: ['Strip', 'A strip of one metal. Drag it into the seat above a beaker so it stands in the solution, or onto the pan of the balance to weigh it; or tap it and then tap the place. Lifting it out keeps whatever the cell did to it.']
});
