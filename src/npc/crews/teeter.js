/**
 * teeter.js — the crews of the terraced salt ponds (Teeter, unit08). Pure data, no THREE.
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
  'free-1': { pos: [-63.75, -15.25], look: [70, 30] },
  'both-2': { pos: [92.25, 38.75], look: [70, 30] },
  'properties-3': { pos: [23.75, -16.25], look: [0, 0] },
  'ice-4': { pos: [-18.75, 38.75], look: [70, 30] },
  'both-5': { pos: [36.75, 38.25], look: [70, 30] },
  'k-6': { pos: [78.25, -13.75], look: [70, 30] },
  'dissolve-7': { pos: [-63.75, 30.75], look: [70, 30] },
  'lean-8': { pos: [-19.75, -6.75], look: [0, 0] },
  'q-9': { pos: [8.75, 16.25], look: [0, 0] },
  'both-10': { pos: [64.75, 18.25], look: [70, 30] },
  'dissolve-11': { pos: [-45.25, 7.75], look: [70, 30] },
  'k-12': { pos: [37.25, 9.25], look: [0, 0] },
  'k-13': { pos: [93.75, 10.25], look: [70, 30] },
  'both-14': { pos: [67.25, 42.75], look: [70, 30] },
  'dissolve-15': { pos: [-41.75, 36.75], look: [70, 30] },
  'ice-16': { pos: [-17.25, 16.25], look: [0, 0] },
  'q-17': { pos: [10.25, 38.75], look: [70, 30] },
  'properties-18': { pos: [7.25, -4.75], look: [0, 0] }
});

export const CREW = Object.freeze([
  {
    id: 'teeter-warden', name: 'Abram Fisk', role: 'Pond warden', model: 'yard-m106',
    schedule: [
      { post: 'both-10', act: 'look', for: [20, 30] },
      { post: 'both-14', act: 'idle', for: [15, 25] },
      { post: 'k-12', act: 'idleShift', for: [20, 30] }
    ],
    talk: {
      default: [
        ['These ponds were left to dry years ago. Then someone started pumping them again, very quietly.'],
        ['Each terrace drains into the one below. Water goes down, salt stays behind.'],
        ['A pond can look still on top and still be busy underneath. These ones are.']
      ],
      afterClue: {
        clue_teeter_pan: [
          ['A whole chemical plant, hidden in ponds everyone thought were dead.', 'Right under our noses. Clever, I will give them that.']
        ]
      }
    }
  },
  {
    id: 'teeter-raker', name: 'Jonah Wick', role: 'Salt raker', model: 'hand-m110',
    schedule: [
      { post: 'free-1', act: 'idle', for: [20, 30] },
      { post: 'dissolve-11', act: 'idleShift', for: [15, 25] },
      { post: 'lean-8', act: 'look', for: [20, 30] }
    ],
    talk: {
      default: [
        ['I rake the salt crust into rows to dry. The wind does half my work, the sun the other half.'],
        ['Good salt crunches under the rake. Wet salt drags.'],
        ['The old ponds on the low terrace grow fresh crust every night now. That is not natural.']
      ]
    }
  },
  {
    id: 'teeter-sampler', name: 'Ottilie Brand', role: 'Brine sampler', model: 'lab-f152',
    schedule: [
      { post: 'ice-4', act: 'idleShift', for: [20, 30] },
      { post: 'ice-16', act: 'look', for: [15, 25] },
      { post: 'dissolve-15', act: 'idle', for: [20, 30] }
    ],
    talk: {
      default: [
        ['I dip a jar in each pond and check what is dissolved in it. The numbers change from terrace to terrace.'],
        ['Brine stings any cut you have. Samplers learn to wear gloves the hard way.'],
        ['Strangely, the ponds that look dead give the busiest samples of all.']
      ],
      afterBench: {
        'q7-dissolve': [
          ['You found how much a pond can hold before it settles out. That is the line I read every morning.']
        ]
      }
    }
  },
  {
    id: 'teeter-pumps', name: 'Cass Okafor', role: 'Pump mechanic', model: 'town-f017',
    schedule: [
      { post: 'k-6', act: 'look', for: [20, 30] },
      { post: 'k-13', act: 'idle', for: [15, 25] },
      { post: 'both-2', act: 'idleShift', for: [20, 30] }
    ],
    talk: {
      default: [
        ['Somebody has been running pumps out here at night. The bearings are warm by morning.'],
        ['A pump that runs nonstop wears out in a season. These ones were new.'],
        ['Follow the pipe and you find the pump. Follow the pump and you find who paid for it.']
      ]
    }
  },
  {
    id: 'teeter-surveyor', name: 'Hugo Lantz', role: 'Terrace surveyor', model: 'crew-m101',
    schedule: [
      { post: 'both-5', act: 'idle', for: [20, 30] },
      { post: 'q-17', act: 'idleShift', for: [15, 25] },
      { post: 'q-9', act: 'look', for: [20, 30] }
    ],
    talk: {
      default: [
        ['I keep the terrace walls straight. A slumped wall dumps one pond into the next.'],
        ['From the top terrace you can see every pond at once. Watch for the ones that never change colour.'],
        ['The ramps between terraces were laid by hand, stone by stone. Watch your footing.']
      ],
      afterBench: {
        'q6-lean': [
          ['You pushed the ponds and watched them push back. My terraces do that whenever the weather changes.']
        ]
      }
    }
  },
  {
    id: 'teeter-oldhand', name: 'Ezra Pine', role: 'Retired raker', model: 'town-m007',
    schedule: [
      { post: 'properties-3', act: 'idleShift', for: [40, 60] },
      { post: 'properties-18', act: 'look', for: [15, 25] },
      { post: 'dissolve-7', act: 'idle', for: [20, 30] }
    ],
    task: 'teeter-filter',
    talk: {
      default: [
        ['I raked these ponds for forty years. Now I just walk the terraces and complain about the young ones.']
      ]
    }
  }
]);

/** The side task: no XP and nothing gated; the reward is the thanks and a note on the Case Board. */
export const TASKS = Object.freeze({
  'teeter-filter': {
    id: 'teeter-filter',
    worldId: 'unit08',
    giver: 'teeter-oldhand',
    item: { label: 'Clogged Pump Filter', kind: 'bolt', pos: [-3.75, -3.25] },
    ask: [
      'A pump filter washed down from the low ponds last night. I saw it from the terrace.',
      'Fetch it for me. My knees do not do ramps any more.'
    ],
    remind: [
      'Down in the middle of the pans. A short pipe of mesh, crusted white.'
    ],
    thanks: [
      'Caked solid with fresh crystal. A pump nobody runs does not clog like this.',
      'Someone has been running it hard, every night.'
    ],
    note: {
      title: 'Teeter · Old Raker\'s Find',
      speaker: 'Ezra Pine',
      text: 'A pump filter caked with fresh crystal, washed down from the low ponds. Someone has been running the pumps hard every night.'
    }
  }
});
