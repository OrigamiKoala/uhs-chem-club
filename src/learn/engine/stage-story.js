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
  'q7-pes': {
    5: 'The Fifth left an unlabelled specimen at the tower, and its spectrum is the only clue to what it is.'
  },
  'q9-absorb': {
    8: 'The Fifth may have fouled the sealed tank, and its colour is the only gauge Vess has.'
  },

  /* ---- Ligar: clear the rescue pass ---- */
  'q1-joins': {
    1: 'The Fifth blast scattered rubble across the rescue tunnel mouth.',
    8: 'The trapped miners ration air while the tunnel gas keeps its recipe.'
  },
  'q2-lattice': {
    1: 'The rescue tunnel needs the toughest boulder marked before the breakers start.',
    8: 'The trapped miners need a liner that holds at 900 degrees without shocking anyone.'
  },
  'q3-distance': {
    6: 'The miners need to know which seam will fight the drill the hardest.'
  },
  'q4-dots': {
    1: 'The blast filled the tunnel with unknown gases, and Vess must draw each one to know which is safe.',
    8: 'A heavy gas pools at the tunnel floor where the miners kneel.'
  },
  'q5-resonance': {
    1: 'The cutters will trust only the drawing that matches the measured rock.',
    8: 'The map closes on water, the last molecule on the slate.'
  },
  'q6-shape': {
    1: 'The breakers cannot cut until they know what shape each tunnel gas takes.'
  },
  'q7-polarity': {
    1: 'The Fifth left tunnel gases that cling to the rescue gear, and Vess must learn why.',
    8: 'The wash water waits while the charged rod tests each stream.'
  },
  'q9-orbitals': {
    5: 'The air the miners breathe is the next thing the magnet must test.'
  },

  /* ---- Bellows: let the pressure out of the fuel station ---- */
  'q1-knocks': {
    2: 'The Fifth jammed extra gas into the station tanks, and the needles will not come down.'
  },
  'q2-laws': {
    1: 'The station valves will open only for a crew that understands how gas behaves.'
  },
  'q3-ideal': {
    5: 'A hiss sounds behind an unmarked hatch.'
  },
  'q4-mixtures': {
    6: 'The Fifth slips quiet argon into the blend.'
  },
  'q5-speed': {
    4: 'A pinhole leak is bleeding gas out of the station.'
  },
  'q6-real': {
    1: 'The Fifth packed the station tanks tighter than any gas law was meant for.'
  },

  /* ---- Ember Reach: trace the Fifth Guild's geothermal siphon ---- */
  'q1-flow': {
    1: 'Two basalt manifold blocks glow beside the caldera rim, waiting for Vess to bridge them.',
    8: 'Four unmarked vent lines hiss into the station.'
  },
  'q2-calorimetry': {
    1: 'The geothermal cooling jackets need a calibrated water bath before the main valves open.',
    8: 'A technician left the cover off the reserve bath.'
  },
  'q3-enthalpy': {
    1: 'The Fifth left fuel canisters along the ridge, and Vess needs to know what each charge delivers.',
    8: 'Three fuel tanks stand ready for the ascent skiff.'
  },
  'q4-bonds': {
    1: 'The siphon’s cracking coil pulls gas molecules apart over the vent.',
    6: 'A scorched ledger beside the burner asks where the flame’s energy truly originates.'
  },
  'q5-hess': {
    1: 'The direct vent shaft is sealed, so Vess must chart a multi-step route to the same depth.',
    8: 'One last sealed flue pipe hides its formation mark.'
  },
  'q6-entropy': {
    2: 'A burst bypass valve scatters vent gas into an evacuated chamber.',
    7: 'The caldera’s limestone rim cracks into escaping gas.'
  },
  'q7-gibbs': {
    1: 'Some vent pipes run without pumps while others stall the moment the current drops.',
    8: 'The Crucible’s outer lock waits for the right furnace setting.'
  },

  /* ---- Kettle: halt the robot foundry ---- */
  'q1-recipe': {
    1: 'Vess holds three scoops from three foundry floors.'
  }
};

/** The lead line for a stage (0-based index), or '' when the stage has none. */
export function storyFor(questId, stageIndex) {
  const id = String(questId || '').replace(/^.*\//, '');
  return STAGE_STORY[id]?.[stageIndex + 1] || '';
}
