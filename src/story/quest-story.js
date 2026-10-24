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
  /* ---- Ligar (2026-10-23 rollout): the blast at the rescue pass, and what held the rock together ---- */
  'unit03/q1-joins': {
    scene: 'bond-pairs',
    captions: [
      'Every pair that held filled both outer shells, and a pair with a full shell already came apart.',
      'The rubble round the tunnel mouth is only atoms held together this way.'
    ],
    filed: 'Filed: the blast broke the rock apart, but every bond in the rubble is an ordinary one.'
  },
  'unit03/q2-lattice': {
    scene: 'liner-heat',
    captions: [
      'Salt gave way at 801 degrees and passed a current only once it was molten.',
      'Only the covalent network stayed solid at 900 degrees and passed none, so it makes the liner.'
    ],
    filed: 'Filed: a liner of covalent network will hold the trapped miners\' vessel at 900 degrees without passing a current.'
  },
  'unit03/q3-distance': {
    scene: 'well-depth',
    captions: [
      'A bond is a well, and the deeper it is, the more energy it takes to pull the atoms apart.',
      'A breaker charge has to carry more than the bond it must break.'
    ],
    filed: 'Filed: the breaker charges are sized to the strongest bond in the pass.'
  },
  'unit03/q7-polarity': {
    scene: 'field-swing',
    captions: [
      'Water swung round in the field and carbon dioxide stayed put, however polar its bonds.',
      'A charged rod bent the stream of water too, so a whole liquid shows what its molecules do.'
    ],
    filed: 'Filed: the gases that cling to the rescue gear are the polar ones, and a charged rod can pick them out.'
  },
  'unit03/q9-orbitals': {
    scene: 'magnet-pull',
    captions: [
      'A magnet pulled on oxygen because two of its electrons stand alone, and no drawing of pairs shows that.',
      'Nitrogen, with every electron paired, was left where it was.'
    ],
    filed: 'Filed: a magnet can find the oxygen in the pass, however it is hidden among the other gases.'
  },
  'unit03/boss-warden': {
    scene: 'warden-cut',
    captions: [
      'The warden settles back into quarry stone, and the slab behind it has been cut clean through.',
      'The cut runs through ionic and covalent rock alike, and no bond in Ligar gives way so evenly.'
    ],
    filed: 'Filed: the slab was cut with heat no ordinary bond survives, and no bench in Ligar can make it.'
  },

  'unit01/boss-hopper': {
    scene: 'hopper-fall',
    captions: [
      'The Hopper settles into cold salt, and in its chute lies an ingot nobody mined.',
      'It is bismuth, and a salt flat does not make bismuth.'
    ],
    filed: 'Filed: someone is putting heavy metal into Tallow\'s salt, and no bench here can make it.'
  }
};

/** The story animation a quest plays, or null. */
export const storyFor = key => QUEST_STORY[key] || null;

/** The session flag that records an animation as played. */
export const storyFlag = key => `storyAnim:${key}`;
