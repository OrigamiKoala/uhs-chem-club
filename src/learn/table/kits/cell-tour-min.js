/**
 * kits/cell-tour-min.js — the words of Brinewire's Tour, as short as they can be. The animation (`cell-tour-demos.js`) shows the tool being
 * used; the words only name it. Loaded after every `cell-<name>-tour.js`, so these replace theirs.
 */
import { addTourText } from '../tour.js';

const f = (title, text) => ({ title, text, dials: false });

addTourText({
  'cell:cellledger': f('Reaction half', 'Counts atoms and charge; tap the Model rings to balance.'),
  'cell:celltally': f('Electron tally', 'Shows total electrons given and taken.'),
  'cell:cellscene': f('Model', 'Live atoms and ions; tap highlighted targets when asked.'),
  'cell:cellredox': f('Beaker', 'Compare Before and After: discs are atoms, rings are ions.'),
  'cell:cellprobe': f('Number probe', 'Drag a card onto the seat to read oxidation numbers.'),
  'cell:celldip': f('Dip rack', 'Drag a strip onto a beaker seat to dip it.'),
  'cell:celldipnails': f('Nails in brine', 'Press Leave a Week, then tap clean nails on the Model.'),
  'cell:cellgalv': f('Cell', 'Place any loose parts, then press Run to test the cell.'),
  'cell:cellgalvplot': f('Current plot', 'Plots electric current in amperes over time.'),
  'cell:cellgalvbal': f('Balance', 'Drag a strip onto the pan to weigh it.'),
  'cell:cellboard': f('Potential board', 'Drag an electrode into the seat to read its voltage.'),
  'cell:cellrig': f('Cell', 'Press Run to wire the cell and check its lamp.'),
  'cell:cellloadrun': f('Cell under load', 'Press Run to watch the voltage fall and ions change.'),
  'cell:cellloadread': f('Voltmeter', 'Set the concentration dial, then press Run to read voltage.'),
  'cell:cellloadcc': f('Two beakers', 'Press Run to see which electrode electrons leave.'),
  'cell:cellsupply': f('Power supply', 'Set voltage and electron direction dials, then press Run.'),
  'cell:selector': f('Answer panel', 'Turn the dial or tap an option to answer.')
}, {
  celldipstrip: ['Metal strip', 'Drag onto a beaker seat to dip, or onto the rail.'],
  cellgalvtube: ['Salt tube', 'Drag into the seat between beakers, then press Run.'],
  cellgalvrod: ['Glass rod', 'Drag into the seat between beakers to test it.'],
  cellgalvwire: ['Second wire', 'Drag into the seat between beakers to test it.'],
  cellgalvstrip: ['Metal strip', 'Drag onto the balance pan or into a beaker seat.'],
  cellelectrode: ['Metal electrode', 'Drag into the board seat to read its voltage.'],
  cellsupplypack: ['Zn–Cu cell', 'Drag into the chain slots to stack voltage.'],
  cellsupplyplate: ['Plated strip', 'Drag onto the balance pan to weigh the plated mass.'],
  cellgas: ['Gas bubble', 'Drag under a matching gas tube.'],
  cellcan: ['Cell can', 'Drag onto the rail from lowest to highest voltage.'],
  'cell:tag': ['Name card', 'Drag into the matching seat or slot.'],
  'cell:note': ['Prediction card', 'Drag into My prediction, then press Submit.'],
  'cell:chip': ['Notation token', 'Drag onto the rail in cell-notation order.']
});
