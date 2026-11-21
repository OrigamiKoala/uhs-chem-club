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
        ['These terraced salt ponds were shut down years ago, yet someone secretly started pumping them again at night.'],
        ['Each stepped pool drains down into the next one, leaving layers of salt crystals behind as water evaporates.'],
        ['Even when a pond looks completely still on the surface, chemicals can still be reacting underneath.']
      ],
      afterClue: {
        clue_teeter_pan: [
          ['The Fifth Guild turned our abandoned salt ponds into a secret chemical factory right under our noses.']
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
        ['I rake dried salt crust into rows so the sun and wind can finish drying it out.'],
        ['Dry salt crunches cleanly under the rake, while damp salt sticks in heavy clumps.'],
        ['The supposedly dead ponds on the lower step keep growing fresh salt crust every single night.']
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
        ['I scoop water samples from each pond to measure what is dissolved inside. Every stepped pool reads differently.'],
        ['Salty pond water stings any small cut right away, so everyone out here wears thick gloves.'],
        ['Weirdly, the ponds marked abandoned on our maps hold the most active chemical mixtures of all.']
      ],
      afterBench: {
        'q7-dissolve': [
          ['Now we know how to make extra salt drop out of the water before it clogs up our pond pipes.']
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
        ['Someone has been running hidden drain pumps out here every night. The motors are still warm every morning.'],
        ['Old salt-flat pumps break down fast if you run them nonstop, yet whoever installed these brought brand-new gear.'],
        ['Those pumps keep draining product out of the ponds so the chemical reaction never stops.']
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
        ['I check the stone walls between ponds so a crumbling wall never dumps one chemical pool into the next.'],
        ['From the top overlook you can see every pond at once. Notice how the active ones stay the exact same color.'],
        ['The stone ramps connecting each stepped pond were built by hand, so watch your footing when they get slick.']
      ],
      afterBench: {
        'q6-lean': [
          ['Seeing how a pond reacts when you disturb it explains why the Fifth Guild\'s drain pump keeps making salt.']
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
        ['I worked these salt ponds for forty years. Now I just walk the ledges and spot things the younger crew misses.']
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
      'A metal pump filter washed down from the lower ponds last night, and I spotted it from the upper ledge.',
      'Could you fetch it for me? My knees cannot handle the steep stone ramps anymore.'
    ],
    remind: [
      'Look down in the middle of the salt ponds for a short mesh pipe crusted white with salt.'
    ],
    thanks: [
      'It is packed solid with fresh crystals. An abandoned pump would never clog up like this.',
      'Someone has been running these ponds hard every night.'
    ],
    note: {
      title: 'Teeter · Old Raker\'s Find',
      speaker: 'Ezra Pine',
      text: 'A pump filter packed with fresh salt crystals from the lower ponds, proving someone has been running hidden pumps every night.'
    }
  }
});
