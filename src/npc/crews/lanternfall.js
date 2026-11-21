/**
 * lanternfall.js — the keepers of the glacier lighthouses and their camp (Lanternfall, unit02). Pure data, no THREE.
 *
 * Read by the world (`three/npc/attach.js` builds a `three/npc/crew.js` from it), the talk card
 * (`src/npc/talk.js`) and the checks (`tools/verify-npc.mjs`). Shapes as in `src/npc/tallow-crew.js`.
 * Posts are world [x, z], proposed by `tools/npc/pick-posts.mjs` and held by `verify:npc`: clear ground,
 * reachable from the spawn, outside every bench's bay and off the boss arena.
 *
 * WHAT THEY SAY. The work here and the night the Fifth came. Lines never answer a bench; a line that
 * follows a bench (`afterBench`) speaks only once that bench is cleared, and only about what it meant here.
 */

export const POSTS = Object.freeze({
  'aurora-mast-1': { pos: [63.75, 9.75], look: [66.6, 7.6] },
  'pes-1': { pos: [-60.75, -72.25], look: [10, 40] },
  'wavefunctions-2': { pos: [-57.25, 57.25], look: [10, 40] },
  'cloud-3': { pos: [29.75, -72.75], look: [61.5, -50] },
  'wave-4': { pos: [18.25, 70.75], look: [14, 83] },
  'trends-5': { pos: [-53.25, -7.75], look: [10, 40] },
  'numbers-6': { pos: [-14.75, -44.25], look: [10, 40] },
  'absorb-7': { pos: [-13.75, 31.25], look: [10, 40] },
  'lines-8': { pos: [39.75, -28.75], look: [61, -22] },
  'wave-9': { pos: [28.75, 31.25], look: [10, 40] },
  'cloud-10': { pos: [-4.25, -92.25], look: [10, 40] },
  'wavefunctions-11': { pos: [-20.75, 70.75], look: [-24, 86] },
  'pes-12': { pos: [-75.75, -38.25], look: [10, 40] },
  'photon-13': { pos: [48.75, 58.25], look: [10, 40] },
  'trends-14': { pos: [-60.75, 24.25], look: [10, 40] },
  'cloud-15': { pos: [-29.25, -72.25], look: [10, 40] },
  'wave-16': { pos: [17.75, 5.25], look: [10, 40] },
  'cloud-17': { pos: [3.25, -65.25], look: [10, 40] }
});

export const CREW = Object.freeze([
  {
    id: 'lanternfall-keeper', name: 'Ines Halloran', role: 'Lighthouse keeper', model: 'pilot-f168',
    schedule: [
      { post: 'wave-9', act: 'look', for: [20, 30] },
      { post: 'wave-16', act: 'idle', for: [15, 25] },
      { post: 'photon-13', act: 'idleShift', for: [20, 30] }
    ],
    talk: {
      default: [
        ['Every lighthouse on this glacier was lit the night the Fifth Guild arrived. By morning, every single tower was dark.'],
        ['Our lighthouse lenses focus the lamp beams across the ice so cargo ships can find the landing channel.'],
        ['Pilots tell our towers apart by their color and flash pattern. When one goes dark, ships can get lost fast.']
      ],
      afterBench: {
        'q2-photon': [
          ['So light hits the solar plate one tiny packet at a time. That explains why our bright red lamps did nothing.']
        ]
      },
      afterClue: {
        clue_lantern_lens: [
          ['A lens made for invisible ultraviolet light. So Fifth Guild ships were flying right past us while our towers were dark.']
        ]
      }
    }
  },
  {
    id: 'lanternfall-fitter', name: 'Bram Okoro', role: 'Lamp fitter', model: 'crew-m103',
    schedule: [
      { post: 'pes-1', act: 'idle', for: [20, 30] },
      { post: 'cloud-15', act: 'idleShift', for: [15, 25] },
      { post: 'pes-12', act: 'look', for: [20, 30] }
    ],
    talk: {
      default: [
        ['These lighthouse lamps stay scorching hot. Put on thick gloves before you touch any lamp case.'],
        ['Someone swapped the lenses in three towers without breaking a single lock. Whoever did it knew our equipment well.'],
        ['Even when the aurora lights up the whole sky, our tower beacons still have to stand out clearly.']
      ]
    }
  },
  {
    id: 'lanternfall-lenses', name: 'Selwyn Dace', role: 'Lens grinder', model: 'lab-m154',
    schedule: [
      { post: 'wavefunctions-2', act: 'idleShift', for: [20, 30] },
      { post: 'trends-14', act: 'look', for: [15, 25] },
      { post: 'wavefunctions-11', act: 'idle', for: [20, 30] }
    ],
    talk: {
      default: [
        ['I shape every lighthouse lens on this glacier by hand. The dark glass the Fifth Guild left behind came from somewhere else.'],
        ['Making a clear lens takes weeks of careful polishing. Even one scratch scatters the beam.'],
        ['I found weird dark glass splinters near the towers. Ordinary lighthouse glass is always clear.']
      ],
      afterBench: {
        'q9-absorb': [
          ['Measuring which colors get absorbed tells you what is inside. I check my glass lenses the same way.']
        ]
      }
    }
  },
  {
    id: 'lanternfall-pilot', name: 'Tavi Rourke', role: 'Sled pilot', model: 'pilot-m167',
    schedule: [
      { post: 'cloud-3', act: 'look', for: [20, 30] },
      { post: 'cloud-17', act: 'idle', for: [15, 25] },
      { post: 'cloud-10', act: 'idleShift', for: [20, 30] }
    ],
    talk: {
      default: [
        ['I haul supplies between camp and the lighthouses. With the towers dark, I had to steer by the stars all week.'],
        ['During the blackout, a ship flew right overhead with zero lights on. Somehow its pilot saw the ice just fine.'],
        ['Blizzards can turn you around in minutes out here. Those lighthouse towers are how everyone gets home.']
      ]
    }
  },
  {
    id: 'lanternfall-watch', name: 'Mara Quill', role: 'Signal watcher', model: 'town-f017',
    schedule: [
      { post: 'aurora-mast-1', act: 'idle', for: [40, 60] },
      { post: 'lines-8', act: 'idleShift', for: [15, 25] },
      { post: 'wave-4', act: 'look', for: [20, 30] }
    ],
    task: 'lanternfall-shard',
    talk: {
      default: [
        ['I log every ship and tower light from the signal hut. Someone erased the log from the night the Fifth Guild came.']
      ]
    }
  },
  {
    id: 'lanternfall-hand', name: 'Edvin Sorell', role: 'Camp hand', model: 'hand-m110',
    schedule: [
      { post: 'absorb-7', act: 'idleShift', for: [20, 30] },
      { post: 'trends-5', act: 'look', for: [15, 25] },
      { post: 'numbers-6', act: 'idle', for: [20, 30] }
    ],
    talk: {
      default: [
        ['It gets so cold on this glacier that hot coffee freezes in your mug if you set it down.'],
        ['Half the camp thinks the Fifth Guild can see in pitch darkness. Maybe they have special gear for it.'],
        ['I keep the ice sleds running and the camp heaters lit so the lighthouse crew stays warm.']
      ]
    }
  }
]);

/** The side task: no XP and nothing gated; the reward is the thanks and a note on the Case Board. */
export const TASKS = Object.freeze({
  'lanternfall-shard': {
    id: 'lanternfall-shard',
    worldId: 'unit02',
    giver: 'lanternfall-watch',
    item: { label: 'Tinted Glass Shard', kind: 'glass', pos: [63.75, 3.75] },
    ask: [
      'The night they came, I saw a flash out by the aurora mast. No colour I could name.',
      'Something broke out there. Bring me whatever glass you find by the mast.'
    ],
    remind: [
      'The mast stands out on the ice to the east. Look at its foot.'
    ],
    thanks: [
      'Dark glass, almost black. None of our lamps use glass like this.',
      'I will log it with the night of the blackout.'
    ],
    note: {
      title: 'Lanternfall · Signal Log',
      speaker: 'Mara Quill',
      text: 'A dark glass shard found at the foot of the aurora mast. None of the glacier lamps use glass like it.'
    }
  }
});
