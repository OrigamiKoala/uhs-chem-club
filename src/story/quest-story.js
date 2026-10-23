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

  /* ---- Bellows: the Fifth jammed the station's holders; the chemistry reads what a gauge counts and ends on a sealed tank that stayed warm ---- */
  'unit04/q1-knocks': {
    scene: 'gauge-walls',
    captions: [
      'A gauge on the floor, on the side wall and on the roof of a sealed box all read the same.',
      'The gas is not pressing down with its weight: its particles are knocking on every wall alike.'
    ],
    filed: 'Filed: the station\'s gauges read true, so the pressure in the jammed holders is genuine and not a faulty needle.'
  },
  'unit04/q2-laws': {
    scene: 'cold-tank',
    captions: [
      'A sealed tank left out in the cold must lose pressure in step with its kelvin temperature.',
      'Cool one by fifty degrees and its gauge falls by about a sixth.'
    ],
    filed: 'Filed: a sealed tank that keeps its pressure through the cold must have something inside it giving off heat.'
  },
  'unit04/q3-ideal': {
    scene: 'equal-rooms',
    captions: [
      'A mole of helium and a mole of carbon dioxide fill the same room, though one weighs eleven times the other.',
      'So a gauge, a room and a temperature are enough to count what is inside a sealed tank.'
    ],
    filed: 'Filed: every sealed tank on the station can now be counted from its plate without opening it.'
  },
  'unit04/q4-mixtures': {
    scene: 'mix-share',
    captions: [
      'In a mixture each gas pushes as if it were alone, and the gauge simply adds the pushes together.',
      'Whatever the Fifth added to the fuel line will show up as a push of its own.'
    ],
    filed: 'Filed: any gas the Fifth has added to a tank can be read off its own share of the push.'
  },
  'unit04/q5-speed': {
    scene: 'leak-race',
    captions: [
      'Lighter gases leak first, so how fast a gas escapes tells you how heavy its particles are.',
      'The leak at the vent stack emptied at the same pace as krypton.'
    ],
    filed: 'Filed: the leak at the vent stack is krypton.'
  },
  'unit04/q6-real': {
    scene: 'crowd-and-pull',
    captions: [
      'Squeezed hard, a gas pushes harder than the gas law says, because its particles take up room.',
      'Cooled, it pushes less, because its particles pull on each other, and that pull is what makes a liquid.'
    ],
    filed: 'Filed: the Fifth packed the tanks past where the gas law holds, and only the compressor at the heart of the deck could.'
  },
  'unit04/boss-compressor': {
    scene: 'warm-cylinder',
    captions: [
      'The Compressor settles, and in its vault stands a sealed cylinder logged at one pressure for twelve days.',
      'The deck froze fifty degrees around it, but a sealed gas cannot hold its pressure through that unless something inside is giving off heat.'
    ],
    filed: 'Filed: a heat source ran inside the Fifth\'s cylinder for twelve days, and no chemical reaction lasts that long.'
  }
};

/** The story animation a quest plays, or null. */
export const storyFor = key => QUEST_STORY[key] || null;

/** The session flag that records an animation as played. */
export const storyFlag = key => `storyAnim:${key}`;
