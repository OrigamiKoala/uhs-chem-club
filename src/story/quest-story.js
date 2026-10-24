/**
 * quest-story.js — the one story animation a quest plays after it, and only that one.
 *
 * PURE DATA. A quest's animation is a short scene (drawn by `ui/story-scenes.js`, from the same numbers the
 * bench measured) with two to four captions that tie what the player just did to the grand storyline: the
 * Fifth, the rumour of alchemy, the Case File. It plays once, after the debrief of a quest the player has just
 * finished, and never again; a replay costs and earns nothing (`session` flag `storyAnim:<key>`). It is never
 * played before or between stages, and a boss's animation is that boss's whole story budget beyond its nameplate.
 *
 * Rules, held by `verify:story`:
 *   - at most ONE animation per quest, keyed `<world>/<quest>`;
 *   - 2 to 4 captions, each at most 2 sentences and 24 words, no emoji, no "!"; and one `filed` line ("Filed: ...", one sentence, 24 words) that
 *     says what the quest has just added to the case against the Fifth, so every animation moves the investigation forward;
 *   - the scene names a painter that exists;
 *   - it uses only words the quest itself has earned by its last reward card: a caption is read at the end of the quest.
 */

export const QUEST_STORY = {
  /* ---- Tallow: is the Fifth's alchemy rumour true, and what are they putting in the salt? ---- */
  'unit01/q1-grain': {
    scene: 'grain-resolve',
    captions: [
      'Under the lens, the grey powder is only carbon and sodium, lying loose beside each other.',
      'Joined atoms split under the cutter, but a single atom never does.'
    ],
    filed: 'Filed: the powder is ordinary and nothing in it is new.'
  },
  'unit01/q2-core': {
    scene: 'beam-foil',
    captions: [
      'Turning salt into gold would mean changing the protons inside every atom of it.',
      'Nothing on these benches can reach the tiny middle of an atom, so none of that can be done here.'
    ],
    filed: 'Filed: if gold turns up in a salt pan, someone brought it.'
  },
  'unit01/q3-catalogue': {
    scene: 'chart-fill',
    captions: [
      'Sodium gives an electron away and chlorine takes one on, which is why salt is made of just those two.',
      'Vess checks the raiders\' manifest against the chart, one element at a time.'
    ],
    filed: 'Filed: a salt flat holds sodium, chlorine and little else, so anything more was brought in.'
  },
  'unit01/q4-ledger': {
    scene: 'three-numbers',
    captions: [
      'Protons, neutrons and charge pin down any atom exactly, so a label can be checked against its counts.',
      'Vess runs the raiders\' sealed canisters through the same ledger, one at a time.'
    ],
    filed: 'Filed: no raider label can disguise an atom from the ledger.'
  },
  'unit01/q5-assay': {
    scene: 'balance-bins',
    captions: [
      'Natural chlorine always balances at 35.5, however much of it is weighed.',
      'Of the three samples sold as natural, only one did.'
    ],
    filed: 'Filed: two of the raiders\' samples had been tampered with.'
  },
  'unit01/q6-weigh': {
    scene: 'scale-count',
    captions: [
      'Weighing counted the sealed crate without opening it, so nothing in the stores can hide inside one.',
      'Vess starts on the sealed drums on the dock.'
    ],
    filed: 'Filed: every sealed drum in the stores can now be counted without opening it.'
  },
  'unit01/boss-hopper': {
    scene: 'hopper-fall',
    captions: [
      'The Hopper settles into cold salt, and in its chute lies an ingot nobody mined.',
      'It is bismuth, and a salt flat does not make bismuth.'
    ],
    filed: 'Filed: someone is putting heavy metal into Tallow\'s salt, and no bench here can make it.'
  },

  /* ---- Lanternfall (unit02): who dimmed the beacons, and what is the Fifth lighting with a lens no guild lamp can make? ---- */
  'unit02/q1-wave': {
    scene: 'wave-beacon',
    captions: [
      'Red and violet light cross the same gap in the same time, so a lamp can be told apart only by its wavelength.',
      'Vess lays the camp\'s radio mast, oven and X-ray tube on the same scale as the beacon lamps.'
    ],
    filed: 'Filed: the beacons\' light can be told from any other wave by its wavelength alone.'
  },
  'unit02/q2-photon': {
    scene: 'photon-plate',
    captions: [
      'Each photon of red carries too little energy to free an electron, however many arrive.',
      'One photon of violet is enough, so a dim violet lamp wakes a plate that the brightest red leaves dark.'
    ],
    filed: 'Filed: the beacon plates still answer, but only to violet; red at any strength leaves them dark.'
  },
  'unit02/q3-lines': {
    scene: 'line-gas',
    captions: [
      'A glowing gas gives only a few exact lines, and no other gas gives the same few.',
      'The sealed tube found among the beacons gives helium\'s lines, and no other strip fits it.'
    ],
    filed: 'Filed: the sealed tube among the beacons holds helium, named by its lines alone.'
  },
  'unit02/q4-cloud': {
    scene: 'cloud-ball',
    captions: [
      'Five hundred shots find the electron in five hundred places, and together they make a ball, not a ring.',
      'No path can be drawn through the dots, only a cloud with a shape.'
    ],
    filed: 'Filed: the beacon gases are lit by electrons that have no path, only clouds with a shape.'
  },
  'unit02/q5-numbers': {
    scene: 'rack-address',
    captions: [
      'Every box on the records board has an address, and a box takes two electrons pointing opposite ways at most.',
      'No two electrons in an atom share all four numbers.'
    ],
    filed: 'Filed: the records board is sorted by address again, and no electron on it shares all four numbers with another.'
  },
  'unit02/q6-filling': {
    scene: 'rack-fill',
    captions: [
      'Carbon\'s rack pulls on the magnet as the real sample does once its last two electrons stand alone.',
      'Potassium\'s last electron settles in the fourth shell while the third is still not full.'
    ],
    filed: 'Filed: the board now matches the magnet for carbon, oxygen and potassium, so its rows can be trusted.'
  },
  'unit02/q7-pes': {
    scene: 'peak-rows',
    captions: [
      'Each peak on a spectrum is a row of electrons, and its height counts how many are in it.',
      'The specimen left at the tower shows peaks of two, two and four.'
    ],
    filed: 'Filed: the unlabelled specimen at the tower has peaks of two, two and four, so it is oxygen.'
  },
  'unit02/q8-trends': {
    scene: 'radii-row',
    captions: [
      'Across a row each atom has more protons and is smaller, because the extra charge pulls the same shell in.',
      'Vess sorts the camp\'s metal stock by size and by what it costs to strip an electron.'
    ],
    filed: 'Filed: the camp\'s metals can be sorted by size and by what it costs to strip an electron.'
  },
  'unit02/q9-absorb': {
    scene: 'beam-dim',
    captions: [
      'Copper takes orange out of white light and leaves blue, and the more copper there is, the more orange it takes out.',
      'Three standards draw the calibration line, and the sealed tank sample\'s reading is read back off it.'
    ],
    filed: 'Filed: the sealed tank water holds copper at 5 millimoles a litre, read from the calibration line.'
  },
  'unit02/boss-eater': {
    scene: 'eater-lens',
    captions: [
      'The Lantern-Eater settles into cold ice, and in its core lies a lens ground for light shorter than violet.',
      'No guild lamp gives light that short.'
    ],
    filed: 'Filed: a lens ground for ultraviolet was feeding the Eater, and no guild lamp can make light that short.'
  }
};

/** The story animation a quest plays, or null. */
export const storyFor = key => QUEST_STORY[key] || null;

/** The session flag that records an animation as played. */
export const storyFlag = key => `storyAnim:${key}`;
