/**
 * stage-story.js — the quiet lead line on a stage card, and only where it earns its place.
 *
 * A stage card opens with the prompt. A line here sits above it, in italics, and says
 * what is at stake at the bench: who did what, who is waiting on the answer. It is
 * written only for a stage where that adds something the prompt does not. A line that
 * restates the task ("Three claims cannot all be true"), or names what the stage is
 * about to find, is not a story line and does not belong here: an earlier version wrote
 * one for every stage (270 of them) and most were exactly that.
 *
 * Rules, held by `verify:learn`:
 *   - one sentence, at most 20 words, no emoji;
 *   - every built bench has at least one line (its opening stake), and no boss has any:
 *     a boss's nameplate and intent line are the whole per-stage story budget;
 *   - it never gives the route or the answer, and it uses only words already earned.
 *
 * Every world has one job (Tallow: take apart the raiders' salt guards and save the
 * refinery; Lanternfall: relight the beacon towers; Ligar: clear the rescue pass; Bellows:
 * let the pressure out of the fuel station; Kettle: halt the robot foundry).
 *
 * Indexed by quest id, then by STAGE NUMBER (1-based, as the player counts them).
 * A stage with no entry has no lead.
 */
export const STAGE_STORY = {
  /* ---- Tallow: is the Fifth's alchemy rumour true, and what are they putting in the salt? ---- */
  'q1-grain': {
    1: 'Raiders scattered grey powder across the refinery yard, and Vess needs to know if it is something new.',
    4: 'The raiders\' salt husks shrug off the cutter, and Vess needs to know why.'
  },
  'q2-core': {
    1: 'The canteen says the Fifth can turn salt into gold, and Vess wants to know how an atom is built.'
  },
  'q3-catalogue': {
    1: 'Vess wants to know which elements belong on a salt flat, and which would be out of place.'
  },
  'q4-ledger': {
    2: 'A sealed canister from the raid must be read without opening it.'
  },
  'q5-assay': {
    1: 'A sample of the raiders\' salt has come off the pan, and Vess needs to know what is in it.',
    8: 'Three sellers claim natural chlorine, but only one tells the truth.'
  },
  'q6-weigh': {
    1: 'The stores are sealed crates and drums, and Vess means to count them without opening one.',
    6: 'A sealed drum waits on the dock with its papers lost.'
  },

  /* ---- Lanternfall: relight the beacon towers ---- */
  'q1-wave': {
    1: 'The Fifth dimmed the beacons, so every spare lamp must be measured.'
  },
  'q2-photon': {
    1: 'The beacon plates have stopped answering the lamps, and Vess needs to know why.'
  },
  'q3-lines': {
    3: 'The Fifth left sealed gas tubes among the beacons, and Vess must name what is in them.'
  },
  'q4-cloud': {
    1: 'The beacon lamps are tuned to electrons, and Vess wants to know where one actually is.'
  },
  'q5-numbers': {
    1: 'The Fifth scrambled the records tent\'s board, and every box on it must be found by its address.'
  },
  'q6-filling': {
    1: 'The records tent\'s board holds every row in energy order, and Vess wants each atom filled from lowest energy up.'
  },
  'q8-trends': {
    1: 'Vess has to sort the camp\'s metal stock by how big and how tightly held its atoms are.'
  },
  'q7-pes': {
    3: 'The Fifth left an unlabelled specimen at the tower, and its spectrum is the only clue to what it is.'
  },
  'q9-absorb': {
    5: 'The Fifth may have fouled the sealed tank, and its colour is the only gauge Vess has.'
  },

  /* ---- Ligar: clear the rescue pass ---- */
  'q1-joins': {
    1: 'The Fifth\'s blast scattered rubble across the rescue tunnel, and Vess needs to know what holds it together.',
    4: 'The breakers pack their charges by the recipe, so a wrong count wastes them.'
  },
  'q2-lattice': {
    1: 'Some of the rubble is rock salt, and Vess wants to know if it is safe near the wiring.',
    5: 'The trapped miners need a liner that holds at 900 degrees without shocking anyone.'
  },
  'q3-distance': {
    2: 'The breaker charge has to carry at least the energy that pulls a seam gas apart.',
    4: 'Three seam gases hold carbon atoms together, and Vess needs to know how close.'
  },
  'q4-dots': {
    1: 'The blast filled the tunnel with unknown gases, and Vess must draw each one to know which is safe.',
    3: 'A heavy gas pools at the tunnel floor where the miners kneel.'
  },
  'q5-resonance': {
    1: 'The cutters will trust only the drawing that matches the measured gas.'
  },
  'q6-shape': {
    1: 'The breakers cannot cut until they know what shape each tunnel gas takes.'
  },
  'q7-polarity': {
    1: 'The Fifth left tunnel gases that cling to the rescue gear, and Vess must learn why.',
    4: 'The wash water waits while the charged rod tests each stream.'
  },
  'q9-orbitals': {
    2: 'The air the miners breathe is the next thing the magnet must test.'
  },

  /* ---- Bellows: let the pressure out of the fuel station ---- */
  'q1-knocks': {
    1: 'The Fifth jammed gas into the station\'s holders, and the needles will not come down.'
  },
  'q2-laws': {
    1: 'Cold is settling on the deck, and Vess needs to know what it does to a gas.',
    5: 'A sealed tank from the raiders\' cargo pod has been left out on the deck.'
  },
  'q3-ideal': {
    3: 'Four of the holders are jammed, and Vess must know which hold more gas than the reference.'
  },
  'q4-mixtures': {
    1: 'The Fifth fed a second gas into the fuel line, and Vess must see what each gas does.'
  },
  'q5-speed': {
    1: 'A pinhole leak is bleeding gas out of the station, and Vess wants to know who loses it first.',
    3: 'Something is leaking from the vent stack, and Vess needs to name it.'
  },
  'q6-real': {
    1: 'The Fifth packed the station tanks tighter than any gas law was meant for.',
    4: 'The liquefier at the cold box turns gases to liquid, and some turn far more easily than others.'
  },

  /* ---- Ember Reach: trace the Fifth Guild's geothermal siphon ---- */
  'q1-flow': {
    2: 'A shelter\'s heating valve is frozen shut, and Vess has two ways to thaw it.',
    4: 'The shelters\' emergency kits hold warmers, packs and tablets, and Vess is checking each one.'
  },
  'q2-calorimetry': {
    1: 'The cooling jackets can hold water or iron, and Vess must choose before the main valves open.',
    3: 'A fitting from the siphon line carries no stamp, and Vess wants its metal named.'
  },
  'q3-enthalpy': {
    2: 'The ascent skiff can lift only so much fuel, so Vess must pick its tank with care.'
  },
  'q4-bonds': {
    1: 'The Fifth\'s cracking coil pulls gas molecules apart over the vent, and Vess wants to know what that costs.'
  },
  'q5-hess': {
    1: 'The direct vent shaft is sealed, so Vess must work out its heat from the routes that are open.'
  },
  'q6-entropy': {
    1: 'A burst bypass valve scatters vent gas into an empty chamber, and Vess wants to know where it ends up.'
  },
  'q7-gibbs': {
    1: 'The shelters\' cold packs chill the water they dissolve in, and Vess wants to know why they work at all.'
  },

  /* ---- Mirrowen: what is the canal ice, and why does it hold when the water beside it runs? ---- */
  'q2-grip': {
    1: 'Vess wants to know how hard molecules hold their neighbours, before she can say what holds the canal ice.'
  },
  'q1-states': {
    1: 'Vess wants to know whether the canal ice is a different substance from the water under it.'
  },
  'q3-boil': {
    1: 'Vess asks how the canal\'s water can leave when nothing on the shelf is hot enough to boil it.'
  },
  'q4-solids': { 1: 'The ice sheets shatter like glass, and Vess wants to know whether that is what they are.' },
  'q5-crossing': { 1: 'Vess saw ice take in heat without warming, and wants to know where the heat went.' },
  'q6-solution': { 1: 'Vess wants to know how much of the agent is in each litre of canal water.' },
  'q7-separate': {
    1: 'Vess wants whatever was added to the canal out of it again, without changing the water.'
  },

  /* ---- Kettle: halt the robot foundry ---- */
  'q1-recipe': {
    1: 'Vess holds three scoops from three foundry floors.'
  },
  'q5-ionic': {
    1: 'The waste pond turned cloudy overnight, and Vess wants to know what changed in it.'
  },
  'q4-balance': {
    1: 'The furnace recipe card on the control-room wall has no numbers, and Vess cannot tell whether it is right.'
  },
  'q2-names': {
    1: 'The foundry\'s crates carry labels nobody can read.'
  },
  'q3-change': {
    1: 'The forged ledger says metal came from nowhere, and Vess wants to know whether anything can.'
  },
  'q6-stoich': {
    1: 'Vess has a ledger that claims fifty tons of iron from forty tons of ore.'
  },
  'q7-titrate': {
    1: 'Nobody at the foundry knows how strong the acid in the pickling tank is.'
  },
  'q8-kinds': {
    1: 'Vess finds a furnace log that lists reactions nobody has named.'
  }
};

/** The lead line for a stage (0-based index), or '' when the stage has none. */
export function storyFor(questId, stageIndex) {
  const id = String(questId || '').replace(/^.*\//, '');
  return STAGE_STORY[id]?.[stageIndex + 1] || '';
}
