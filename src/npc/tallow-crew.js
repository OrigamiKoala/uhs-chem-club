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
        ['Our night crew found the salt bins broken open and a heavy grey chunk sitting inside.', 'We only crush, wash, and dry salt here. Nothing in this plant makes metal.'],
        ['Every sack of salt we ship is tested for purity. Until the Fifth Guild raid, every batch was clean.'],
        ['The raiders snuck in from the west salt flat, right past the old cargo truck. Nobody heard the gate open.']
      ],
      afterBench: {
        'q6-weigh': [['Weighing the sealed drums proved it. Real salt went missing on the night shift, not a paperwork error.']]
      },
      afterClue: {
        clue_tallow_slag: [['So that grey chunk is bismuth. There was never a speck of bismuth in our salt before the raid.', 'Someone carried it in on purpose. Now we need to know why.']]
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
        ['This conveyor belt carries wet salt from the drying hall to the storage building.'],
        ['We pump salty water up from under the flat, boil the water off, and collect the white salt crystals left behind.'],
        ['Someone shut off the conveyor belt during the raid. The log shows someone pulled the emergency switch by hand.']
      ],
      afterClue: {
        clue_tallow_slag: [['A heavy lump of metal inside a salt bin would have wrecked my crusher if it had come down the belt.']]
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
        ['I test every batch of salt to verify what is really inside before it ships out to other worlds.'],
        ['We always scoop test samples from the moving belt so one dusty spot on top of a pile does not fool us.'],
        ['Our lab records go back forty years. No batch ever had heavy metal in it until the Fifth Guild broke in.']
      ],
      afterBench: {
        'q5-assay': [['Your test matches our records. The salt coming out of the ground is still completely normal.']]
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
        ['Half the crew thinks the Fifth Guild turned our salt into gold. I have shoveled salt for twenty years, and salt stays salt.'],
        ['Watch the wind out here. Every afternoon it blows salt dust off the piles right into your face.'],
        ['Witnesses saw the raiders hauling a crate that looked way too heavy for two people to carry.']
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
        ['Our drying tanks run on steam. If the steam cuts out, the salt water just sits there cooling down.'],
        ['I keep all the refinery pumps running. This plant is old, and every pipe needs constant repair.'],
        ['Whoever raided us sliced the padlock on the shipping gate cleanly in half. They brought serious tools.']
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
        ['Quiet tonight, so I am keeping my eyes on the west flat near the old cargo truck.']
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
