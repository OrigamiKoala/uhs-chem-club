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

  /* ---- Ember Reach: the Fifth's manifold is frosted over, so what runs inside it takes heat in ---- */
  'unit05/q1-flow': {
    scene: 'frost-manifold',
    captions: [
      'On the overlook, the Fifth\'s manifold is furred with frost in the middle of a hot caldera.',
      'A bath that cools means heat is going into the chemicals, so frost on the pipes means heat is going into the manifold.'
    ],
    filed: 'Filed: the manifold is taking heat in, so something inside it is running an endothermic change.'
  },
  'unit05/q5-hess': {
    scene: 'two-routes',
    captions: [
      'The straight shaft at the separator is sealed, but the stepped pipe beside it starts and ends in the same two places.',
      'Heat counts only those two places, so the open pipe gives the same total as the shaft nobody can open.'
    ],
    filed: 'Filed: the sealed shaft carries the same heat as the open pipe, so no route can hide it.'
  },
  'unit05/q7-gibbs': {
    scene: 'seal-crossing',
    captions: [
      'Ice melts at 273 K because that is where the heat it costs and the spreading it gains are equal.',
      'The limestone seal on the Fifth\'s siphon core is a change of the same kind, and it gives way only above its own crossing.'
    ],
    filed: 'Filed: the siphon core is sealed until it is hot enough, and Vess can now find that temperature.'
  },
  'unit05/boss-crucible': {
    scene: 'crucible-open',
    captions: [
      'The Crucible splits along its firebrick seams, and inside is a heat exchanger that carried megawatts away without a wisp of steam.',
      'Below the exchanger, a pipe runs down into the crust.'
    ],
    filed: 'Filed: the raiders were feeding an endothermic process far below the crust, and no thermometer at the surface could have seen it.'
  }
};

/** The story animation a quest plays, or null. */
export const storyFor = key => QUEST_STORY[key] || null;

/** The session flag that records an animation as played. */
export const storyFlag = key => `storyAnim:${key}`;
