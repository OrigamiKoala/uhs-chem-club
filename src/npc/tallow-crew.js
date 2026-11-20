/**
 * tallow-crew.js — the people working Tallow's salt refinery (unit01). Pure data, no THREE.
 *
 * Read by the world (`three/tallow.js` builds a `three/npc/crew.js` from it), the talk card
 * (`src/npc/talk.js`) and the checks (`tools/verify-npc.mjs`). Positions are world [x, z] on the pan's
 * main level; every post is held by the check to clear ground, outside every bench's bay, off the
 * Hopper's arena, and reachable from the spawn.
 *
 * WHAT THEY SAY. Lines are about the plant and the night of the raid. They never answer a bench: nothing
 * here says what an element, a mixture or a compound is, what decides an atom's identity, an isotope's
 * mass, an average atomic mass or how many particles a weighed sample holds. A line that follows a bench
 * (`afterBench`) only speaks once that bench is cleared, and only about what it meant for the plant.
 * Every line is one sentence or two, at most 25 words.
 */

/** Where the crew stand. `look` is the point they face while there. */
export const POSTS = Object.freeze({
  'yard-cross': { pos: [-8, 24], look: [-8, 10] },
  'pad-road': { pos: [14, 34], look: [34, 42] },
  'heap-east': { pos: [27, 14], look: [35.4, 4.5] },
  'belt-side': { pos: [4, 8.5], look: [2.5, 4] },
  'evap-inside': { pos: [21, 9.5], look: [14, 4] },
  'evap-door': { pos: [28.5, 6.5], look: [24, 4] },
  'control-inside': { pos: [31, -12], look: [36, -18] },
  'control-yard': { pos: [24, -18], look: [36, -23] },
  'tower-yard': { pos: [22, -40], look: [31, -60.5] },
  'tower-inside': { pos: [35, -46.5], look: [31, -52] },
  'head-inside': { pos: [-4.5, 16.25], look: [-8.69, 5.4] },
  'head-door': { pos: [2, 15], look: [-1.4, 13.8] },
  'bag-inside': { pos: [-25.5, 13], look: [-20.09, 5.4] },
  'bag-dock': { pos: [-26, 22], look: [-23.7, 18.9] },
  'loadout': { pos: [-28, 20], look: [-33, 14] },
  'hauler-watch': { pos: [-38, 10], look: [-46, 4] },
  'yard-west': { pos: [-14, 28], look: [-14, 10] },
  'evap-walk': { pos: [-0.25, -27], look: [8, -36] },
  'tower-walk': { pos: [-20, -56], look: [-28, -66] }
});

/** Ground the crew keep off: the Hopper is fought here (`boss-arena.js` 'boss-hopper'). */
export const KEEP_OFF = Object.freeze([{ x: 0, z: 30, radius: 9 }, { x: 0, z: 42, radius: 3 }]);

/**
 * The crew. `model` is an id in `src/npc/models.js`. A schedule stop is { post, act, for: [min, max] s };
 * acts are clip names: idle, idleShift, look. `talk.default` is a list of line sets, said in turn.
 */
export const CREW = Object.freeze([
  {
    id: 'tallow-foreman', name: 'Dario Venn', role: 'Shift foreman', model: 'crew-m107',
    schedule: [
      { post: 'yard-cross', act: 'look', for: [15, 25] },
      { post: 'control-yard', act: 'idle', for: [20, 30] },
      { post: 'control-inside', act: 'idleShift', for: [20, 30] },
      { post: 'tower-yard', act: 'look', for: [15, 25] },
      { post: 'evap-door', act: 'idle', for: [15, 20] }
    ],
    talk: {
      default: [
        ['Night shift found the bins open and a heavy grey lump sitting in the salt.', 'Our salt is crushed, washed and dried. Nothing on that line makes metal.'],
        ['Every sack leaves here at the same purity. The buyers test it, and so do we.'],
        ['The raiders came in from the west pan, past the old hauler. Nobody heard the gate.']
      ],
      afterBench: {
        'q6-weigh': [['You weighed the drums. So the tonnage that left on the night shift was real, not a clerk\'s mistake.']]
      },
      afterClue: {
        clue_tallow_slag: [['Bismuth, they told me. Not a speck of it in our salt before that night.', 'So someone carried it in. Now we find out who, and why.']]
      }
    }
  },
  {
    id: 'tallow-belt', name: 'Rena Kask', role: 'Belt hand', model: 'crew-f101',
    schedule: [
      { post: 'belt-side', act: 'idle', for: [25, 40] },
      { post: 'evap-inside', act: 'idleShift', for: [20, 30] },
      { post: 'head-door', act: 'look', for: [15, 25] },
      { post: 'head-inside', act: 'idle', for: [20, 30] }
    ],
    talk: {
      default: [
        ['The belt runs from the evaporator hall to the head house. The salt rides it wet and comes off dry.'],
        ['Brine is salt water pumped up from under the pan. Boil the water off and small square crystals are left in the pans.'],
        ['Someone stopped the belt that night. The fault log shows a hand on the cut-out, not a jam.']
      ],
      afterClue: {
        clue_tallow_slag: [['A lump of metal in a bin of salt. It would have wrecked my crusher if it had come down the belt.']]
      }
    }
  },
  {
    id: 'tallow-clerk', name: 'Tomas Ilve', role: 'Assay clerk', model: 'crew-m104',
    schedule: [
      { post: 'bag-inside', act: 'idle', for: [25, 35] },
      { post: 'loadout', act: 'look', for: [15, 20] },
      { post: 'yard-west', act: 'idleShift', for: [15, 25] }
    ],
    talk: {
      default: [
        ['I run the assay: the test of what a sample really contains. Every batch gets one before it ships.'],
        ['We cut the sample from the moving stream, never off the top of a heap. The top of a heap is never typical.'],
        ['Our records go back forty years. Not one batch held metal until the night of the raid.']
      ],
      afterBench: {
        'q5-assay': [['Your numbers match ours. Whatever was dropped in that bin, the salt itself came out of the ground as it always has.']]
      }
    }
  },
  {
    id: 'tallow-yard-a', name: 'Jory Pell', role: 'Yard hand', model: 'crew-m111',
    schedule: [
      { post: 'heap-east', act: 'idleShift', for: [20, 30] },
      { post: 'pad-road', act: 'look', for: [15, 25] }
    ],
    talk: {
      default: [
        ['Half the pan says the Fifth turned our salt into gold. I have shovelled salt for twenty years. It stays salt.'],
        ['The wind takes the dust off the heaps every afternoon. You get used to the taste.'],
        ['They say the crate the raiders carried was too heavy for two people. Heavy as lead, one said.']
      ]
    }
  },
  {
    id: 'tallow-fitter', name: 'Abel Mott', role: 'Fitter', model: 'crew-m102',
    schedule: [
      { post: 'tower-walk', act: 'look', for: [20, 30] },
      { post: 'evap-walk', act: 'idle', for: [20, 30] },
      { post: 'tower-inside', act: 'idleShift', for: [20, 30] }
    ],
    talk: {
      default: [
        ['The evaporators run on steam. Lose the steam and the brine just sits there, cooling.'],
        ['I keep the pumps going. The plant is old, but every part of it can be mended.'],
        ['Someone cut the padlock on the loadout gate. A clean cut. Good tools, whoever they were.']
      ]
    }
  },
  {
    id: 'tallow-watch', name: 'Orrin Sabe', role: 'Night watch', model: 'watch-m171',
    schedule: [
      { post: 'hauler-watch', act: 'look', for: [40, 60] },
      { post: 'bag-dock', act: 'idle', for: [15, 25] }
    ],
    task: 'tallow-tarp',
    talk: {
      default: [
        ['Quiet tonight. I keep looking west, toward the hauler.']
      ]
    }
  }
]);

/**
 * Side tasks. No XP and nothing gated (the Learn track pays none): the reward is the thank-you and a note
 * filed on the Case Board (`story/lore.js`, id `crew:<task id>`).
 */
export const TASKS = Object.freeze({
  'tallow-tarp': {
    id: 'tallow-tarp',
    worldId: 'unit01',
    giver: 'tallow-watch',
    item: { label: 'Scorched Tarp Scrap', pos: [-40, 0] },
    ask: [
      'The night of the raid I saw two hooded figures cross the pan by the hauler, carrying a dark crate.',
      'One snagged a tarp on the hauler\'s track. Bring me what is left of it.'
    ],
    remind: ['The scrap should still be by the hauler\'s tracks, at the west edge of the yard.'],
    thanks: [
      'That is it. Scorched along one edge, as if it touched something very hot.',
      'I will log it. Whatever they carried, it was not salt.'
    ],
    note: {
      title: 'Tallow · Night Watch Report',
      speaker: 'Orrin Sabe',
      text: 'A tarp scrap from the raiders\' crate, found by the hauler. One edge is scorched, as if it touched something very hot.'
    }
  }
});

/** The yaw a member faces at a post (bodies face +z at yaw 0). */
export function postFace(post) {
  return Math.atan2(post.look[0] - post.pos[0], post.look[1] - post.pos[1]);
}

/** POSTS with `face` filled in, as `CrewSim` takes them. */
export function simPosts() {
  const out = {};
  for (const [id, p] of Object.entries(POSTS)) out[id] = { ...p, face: postFace(p) };
  return out;
}
