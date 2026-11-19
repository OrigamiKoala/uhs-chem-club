/**
 * stage-story.js — one crisp Stage 1 hook per bench.
 *
 * A stage card opens with the prompt. The hook sits above it in italics and names
 * the concrete problem or mystery at the bench—zero unseen props, zero fancy jargon.
 *
 * Rules, held by `verify:learn`:
 *   - one sentence, at most 20 words, no emoji;
 *   - Stage 1 only on built benches; no boss has any (a boss's nameplate and intent
 *     line are its whole per-stage story budget);
 *   - never gives the route or the answer, and uses only words already earned.
 *
 * Indexed by quest id, then by STAGE NUMBER (1-based).
 */
export const STAGE_STORY = {
  /* ---- Unit 01 — Tallow (Atoms): heavy metal showed up inside pure salt ---- */
  'q1-grain': { 1: 'Test the mixed sample pulled from the raided salt bin.' },
  'q2-core': { 1: 'Look inside the atom to see if anyone can turn salt into gold.' },
  'q3-catalogue': { 1: 'Check the periodic table to see what actually belongs in salt.' },
  'q4-ledger': { 1: 'Read the proton and neutron counts on this unlabeled salt tank.' },
  'q5-assay': { 1: 'Weigh the salt sample\'s isotopes to check its atomic mass.' },
  'q6-weigh': { 1: 'Weigh the raided salt drums to see how much was taken.' },

  /* ---- Unit 02 — Lanternfall (Light and Electrons): lighthouses blacked out with invisible UV light ---- */
  'q1-wave': { 1: 'Measure the wavelengths of the surviving lighthouse lamps.' },
  'q2-photon': { 1: 'Find out why the lighthouse solar plates ignore red light.' },
  'q3-lines': { 1: 'Identify the gas inside the sealed tube left at the tower.' },
  'q4-cloud': { 1: 'Map where an atom\'s electrons actually live.' },
  'q5-numbers': { 1: 'Learn the four-number address for every electron slot.' },
  'q6-filling': { 1: 'Fill each atom\'s electron levels from lowest energy up.' },
  'q7-pes': { 1: 'Identify the unlabeled powder from the tower using its spectrum.' },
  'q8-trends': { 1: 'Pick the best metal to rebuild the damaged lighthouse plate.' },
  'q9-absorb': { 1: 'Use light absorption to measure what is in the fouled coolant tank.' },
  'q10-wavefunctions': { 1: 'Map the peaks and zero-nodes of an electron wave.' },

  /* ---- Unit 03 — Ligar (Bonding): blast trapped miners and sliced basalt glass-smooth ---- */
  'q1-joins': { 1: 'Test what kind of bonds hold the tunnel rubble together.' },
  'q2-lattice': { 1: 'Find a mineral liner that resists heat without conducting electricity.' },
  'q3-distance': { 1: 'Measure how much energy it takes to break strong bonds apart.' },
  'q4-dots': { 1: 'Map the bonds of the unknown gases leaking in the tunnel.' },
  'q5-resonance': { 1: 'Map the tunnel gases that share electrons across multiple bonds.' },
  'q6-shape': { 1: 'Predict the 3D shape of each tunnel gas molecule.' },
  'q7-polarity': { 1: 'Find out why some tunnel gases stick to the rescue gear.' },
  'q8-hybrid': { 1: 'See how atom orbitals mix to form 3D bond shapes.' },
  'q9-orbitals': { 1: 'Use a magnet to spot breathable oxygen in the tunnel air.' },

  /* ---- Unit 04 — Bellows (Gases): jammed fuel tanks and a cylinder hot for 12 days in freezing air ---- */
  'q1-knocks': { 1: 'Check why pressure is spiking in the jammed fuel tanks.' },
  'q2-laws': { 1: 'Test how freezing wind should change a sealed tank\'s pressure.' },
  'q3-ideal': { 1: 'Calculate how much gas is trapped inside each sealed tank.' },
  'q4-mixtures': { 1: 'Measure both gases after the Fifth pumped a second gas into the fuel line.' },
  'q5-speed': { 1: 'Identify the gas leaking from the Fifth\'s damaged vent.' },
  'q6-real': { 1: 'See what happens when the Fifth over-packs a tank past ideal limits.' },

  /* ---- Unit 05 — Ember Reach (Thermodynamics): volcano pipes drained straight underground ---- */
  'q1-flow': { 1: 'Thaw the frozen shelter valve and track which way heat flows.' },
  'q2-calorimetry': { 1: 'Pick the best cooling fluid, then identify the Fifth\'s unlabeled pipe metal.' },
  'q3-enthalpy': { 1: 'Measure how much heat each rescue-skiff fuel releases per gram.' },
  'q4-bonds': { 1: 'Calculate how much energy the Fifth\'s cracking coil spends breaking bonds.' },
  'q5-hess': { 1: 'Calculate the sealed main shaft\'s heat using the open side pipes.' },
  'q6-entropy': { 1: 'Watch how gas and heat naturally spread out when a valve opens.' },
  'q7-gibbs': { 1: 'Find the temperature where the Fifth\'s heat-hungry process turns on.' },

  /* ---- Unit 06 — Mirrowen (States of Matter): lab-made chemical froze the shipping canals ---- */
  'q1-states': { 1: 'Check if the canal ice is still water or something new.' },
  'q2-grip': { 1: 'Measure how strongly water molecules pull on each other.' },
  'q3-boil': { 1: 'See why canal water evaporates even below its boiling point.' },
  'q4-solids': { 1: 'Test if the canal ice is a crystal or a glass.' },
  'q5-crossing': { 1: 'Find out how much heat it takes to melt the canal barrier.' },
  'q6-solution': { 1: 'Measure how much of the Fifth\'s chemical is dissolved per liter.' },
  'q7-separate': { 1: 'Separate the Fifth\'s chemical out of the canal water.' },

  /* ---- Unit 07 — Kettle (Stoichiometry): foundry logs claim 50 tons of iron from 40 tons of ore ---- */
  'q2-names': { 1: 'Decode the chemical labels on the Fifth\'s ore crates.' },
  'q3-change': { 1: 'Test whether a chemical reaction can ever create extra mass.' },
  'q4-balance': { 1: 'Balance the foundry\'s furnace equation so every atom counts.' },
  'q5-ionic': { 1: 'Find which ions turned the foundry\'s waste pond cloudy.' },
  'q6-stoich': { 1: 'Check if 40 tons of ore can really yield 50 tons of iron.' },
  'q7-titrate': { 1: 'Measure the acid strength in the foundry\'s metal-cleaning tank.' },
  'q8-kinds': { 1: 'Sort the foundry\'s furnace logs by reaction type.' },
  'q9-hsab': { 1: 'Separate the mixed metals in the foundry\'s waste vat.' },

  /* ---- Unit 08 — Teeter (Equilibrium): "abandoned" salt ponds still pumping out chemicals ---- */
  'q1-both': { 1: 'Check if the Fifth\'s abandoned salt pond is actually still reacting.' },
  'q2-k': { 1: 'Test three ponds with different starts to see where they settle.' },
  'q3-q': { 1: 'Predict which way this fresh tank mixture will run.' },
  'q4-properties': { 1: 'See how K changes when you flip or combine equations.' },
  'q5-ice': { 1: 'Calculate how much product the Fifth\'s pond makes once settled.' },
  'q6-lean': { 1: 'See how the Fifth\'s drain pump forces the pond to make more product.' },
  'q7-dissolve': { 1: 'Find how much salt dissolves before it clogs the pond pipes.' },
  'q8-free': { 1: 'Link free energy to K to see how far a reaction goes.' },

  /* ---- Unit 09 — Verdigris (Acids and Bases): ore-washing acid runoff eating through the radio fort ---- */
  'q1-handover': { 1: 'Test what the marsh runoff is actually doing to the water.' },
  'q2-scale': { 1: 'Measure how acidic each marsh tank really is on the pH scale.' },
  'q3-weak': { 1: 'Find why one acid tank is far harsher than another with the same amount.' },
  'q4-structure': { 1: 'See how a molecule\'s structure makes an acid strong or weak.' },
  'q5-salts': { 1: 'Check if the neutralized waste tank water is actually safe.' },
  'q6-titrate': { 1: 'Track the pH curve as you neutralize the marsh\'s worst tank.' },
  'q7-buffer': { 1: 'Build a buffer mix that protects the fort\'s intake from acid spikes.' },
  'q8-capacity': { 1: 'Test how much runoff the fort\'s buffer tank can absorb before failing.' },

  /* ---- Unit 10 — Brinewire (Electrochemistry): illegal power taps stripping copper from the marsh ---- */
  'q1-halves': { 1: 'Find out what is moving inside the corroded power pylons.' },
  'q2-activity': { 1: 'Find which of the two metals bolted to the pylon gives up electrons.' },
  'q3-galvanic': { 1: 'Rebuild a working marsh battery after the Fifth cut the salt bridges.' },
  'q4-potential': { 1: 'Measure which metal pair gives the highest voltage for the grid.' },
  'q5-load': { 1: 'Track why the marsh\'s backup batteries lose voltage as they run.' },
  'q6-electrolysis': { 1: 'See what the Fifth is making by forcing electric current into the pool.' },

  /* ---- Unit 11 — Quicklight (Kinetics): fuel towers overheating ten times too fast from mystery dust ---- */
  'q1-watch': { 1: 'Time both fuel lines to see why one is overheating.' },
  'q2-law': { 1: 'Test which of the three fuel feeds actually speeds up the tank.' },
  'q3-time': { 1: 'Time how fast the spiked fuel breaks down by half.' },
  'q4-collide': { 1: 'See why cold fuel sits safely until collisions clear the energy hill.' },
  'q5-steps': { 1: 'Find which step of the fuel reaction controls the overheating spike.' },
  'q6-shortcut': { 1: 'Test the vent dust that speeds up the burn without running out.' },

  /* ---- Unit 12 — Lodestone (Transition Metals): giant magnet sorting metal drums for Cinder Halo ---- */
  'q1-dblock': { 1: 'Check iron\'s d-electrons before testing the Fifth\'s metal drums.' },
  'q2-charges': { 1: 'Measure how many different charges these canyon metals can hold.' },
  'q3-complex': { 1: 'Find out why spilled ammonia turned a metal drum deep blue.' },
  'q4-shapes': { 1: 'Check the shapes of two drums that share a formula but act differently.' },
  'q5-colour': { 1: 'Use each drum\'s color to identify what is inside with the labels gone.' },
  'q6-spin': { 1: 'Find out why the sorting magnet grabs some drums and ignores others.' },

  /* ---- Unit 13 — Thornmere (Organic Chemistry): swamp outpost wrapped in plastic armor over lead ---- */
  'q1-chains': { 1: 'Test the black swamp tar the Fifth pumps into their factory.' },
  'q2-unsat': { 1: 'See what the Fifth\'s heater turns the swamp tar into.' },
  'q3-isomers': { 1: 'Find the difference between two drums that share one formula.' },
  'q4-groups': { 1: 'Identify the clear liquid eating through its storage drum.' },
  'q5-reactions': { 1: 'See how the Fifth joins those two liquids into armor links.' },
  'q6-polymers': { 1: 'Find the weak link in the fortress\'s plastic armor plates.' },

  /* ---- Unit 14 — Cinder Halo (Nuclear Chemistry): ancient nuclear reactor running hot with no fuel line ---- */
  'q1-still-warm': { 1: 'Find out why the Fifth\'s ore drums stay warm in freezing air.' },
  'q2-what-comes-off': { 1: 'Find what blocks the rays leaking through the drum walls.' },
  'q3-equations': { 1: 'Trace where the unexpected elements in the reactor slag came from.' },
  'q4-stability': { 1: 'Check which of the Fifth\'s stored nuclei are stable and which decay.' },
  'q5-half-gone': { 1: 'Use half-life decay to measure how long the Fifth has worked here.' },
  'q6-shortfall': { 1: 'Find where the reactor\'s huge energy comes from with no fuel line.' }
};

/** The lead line for a stage (0-based index), or '' when the stage has none. */
export function storyFor(questId, stageIndex) {
  const id = String(questId || '').replace(/^.*\//, '');
  return STAGE_STORY[id]?.[stageIndex + 1] || '';
}
