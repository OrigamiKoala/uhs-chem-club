/**
 * kits/cell-tour-min.js — the words of Brinewire's Tour, as short as they can be. The animation (`cell-tour-demos.js`) shows the tool being
 * used; the words only name it. Loaded after every `cell-<name>-tour.js`, so these replace theirs.
 */
import { addTourText } from '../tour.js';

const f = (title, text) => ({ title, text, dials: false });

addTourText({
  'cell:cellledger': f('Reaction half', 'Charge counts for one half of the reaction.'),
  'cell:celltally': f('Electron tally', 'Electrons given and taken.'),
  'cell:cellscene': f('Model', 'The bench, moving. Tap the rings and spheres.'),
  'cell:cellredox': f('Beaker', 'Before and after.'),
  'cell:cellprobe': f('Number probe', 'Reads oxidation numbers.'),
  'cell:celldip': f('Dip rack', 'Dip a strip in a beaker.'),
  'cell:celldipnails': f('Nails in brine', 'Blue spots mark dissolving iron.'),
  'cell:cellgalv': f('Cell', 'Two beakers joined by a wire.'),
  'cell:cellgalvplot': f('Current plot', 'Current against time.'),
  'cell:cellgalvbal': f('Balance', 'Weighs a strip.'),
  'cell:cellboard': f('Potential board', 'Reads a metal against hydrogen.'),
  'cell:cellrig': f('Cell', 'A ready-made cell and its voltage.'),
  'cell:cellloadrun': f('Cell under load', 'Runs a cell and plots its voltage.'),
  'cell:cellloadread': f('Voltmeter', 'Reads the cell as set.'),
  'cell:cellloadcc': f('Two beakers', 'One metal in two concentrations.'),
  'cell:cellsupply': f('Power supply', 'Wired to the cell.'),
  'cell:selector': f('Answer dial', 'Turn it to your answer.')
}, {
  celldipstrip: ['Strip', 'A metal strip.'],
  cellgalvtube: ['Salt tube', 'A tube of salt solution.'],
  cellgalvrod: ['Glass rod', 'A solid glass rod.'],
  cellgalvwire: ['Second wire', 'A second wire.'],
  cellgalvstrip: ['Strip', 'A metal strip.'],
  cellelectrode: ['Electrode', 'A metal electrode.'],
  cellsupplypack: ['Cell', 'A zinc–copper cell.'],
  cellsupplyplate: ['Plate', 'A metal plate.'],
  cellgas: ['Gas', 'A bubble of gas.'],
  cellcan: ['Cell', 'A prepared cell.'],
  'cell:tag': ['Name card', 'Place it where it goes.'],
  'cell:note': ['Card', 'Place it where it goes.'],
  'cell:chip': ['Symbol', 'Place it in order.']
});
