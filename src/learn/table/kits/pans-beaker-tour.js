/**
 * kits/pans-beaker-tour.js — what the Tour says about the solubility beaker and the expression form (Teeter, `q7-dissolve`).
 * Three beats a step: what it is, what to do with it, what it tells you. Only words the bench has earned by the stage the tool first
 * stands on the table: the beaker never says "saturated", "Ksp" (unless it carries the gauge), "molar solubility" or "precipitate".
 */

import { addTourText } from '../tour.js';

const FIXTURES = {
  'pans:beaker': {
    title: 'Beaker',
    dials: false,
    text: (f) => {
      const p = f.props || {};
      const bits = ['A beaker of water seen from the side. White squares on the floor are solid that has not dissolved, and the orange and blue dots in the water are ions that have.'];
      if (f.runLabel) bits.push(`Press "${f.runLabel}" to drop one more scoop of the solid in.`);
      const dial = Object.values(f.dials || {}).find(d => d.labels);
      if (dial) bits.push(`The "${dial.label}" dial sets how much of that ion is put in the water before you read the meters.`);
      bits.push('The meters on the right read how much of each ion is in the water, in moles per litre, and the bar under each fills as the figure grows.');
      if (p.showDissolved) bits.push('"Dissolved salt" is how many moles of the salt itself are dissolved in each litre.');
      if (p.showPure) bits.push('"In pure water" is the same figure with nothing else in the water.');
      if (p.gauge) bits.push('The bar marked Q is the ion product of the water, on a scale where each step is ten times the one before; the amber tick on it marks Ksp.');
      if (p.tallies !== false) bits.push('The line under the beaker counts how many units of the solid left its surface and how many came back in the last fifty ticks.');
      return bits.join(' ');
    }
  },
  'pans:kspform': {
    title: 'Expression',
    dials: false,
    text: 'The form lists every substance in the dissolving equation printed on the beaker, with a dial for each. A dial sets the power that substance is raised to, and a power of 0 leaves it out. The line at the bottom prints the expression your dials make, with each substance in square brackets for its concentration.'
  }
};

addTourText(FIXTURES, {});
