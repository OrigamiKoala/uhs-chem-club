/**
 * cinderhalo.js — the engineers and rangers at the old crater reactor (Cinder Halo, unit14). Pure data, no THREE.
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
  'transmutation-core-1': { pos: [-13.75, -27.25], look: [0, -26] },
  'shortfall-1': { pos: [4.25, 92.25], look: [0, 60] },
  'half-gone-2': { pos: [80.25, -7.75], look: [0, 60] },
  'still-warm-3': { pos: [-74.75, 37.75], look: [0, 60] },
  'stability-4': { pos: [46.25, -79.75], look: [0, 60] },
  'what-comes-off-5': { pos: [-82.25, -40.25], look: [0, 60] },
  'equations-6': { pos: [-26.25, -92.25], look: [0, 60] },
  'shortfall-7': { pos: [29.75, 32.75], look: [0, 60] },
  'still-warm-8': { pos: [-24.75, 49.75], look: [0, 60] },
  'half-gone-9': { pos: [49.75, -37.25], look: [0, 60] },
  'still-warm-10': { pos: [-62.75, -2.75], look: [0, 60] },
  'what-comes-off-11': { pos: [-44.25, -55.25], look: [0, 60] },
  'shortfall-12': { pos: [21.75, -7.25], look: [0, -26] },
  'stability-13': { pos: [6.75, -68.75], look: [0, 60] },
  'shortfall-14': { pos: [8.25, 58.75], look: [0, 60] },
  'shortfall-15': { pos: [59.25, 17.75], look: [0, 60] },
  'still-warm-16': { pos: [-47.75, 23.75], look: [0, 60] },
  'shortfall-17': { pos: [-2.25, 10.25], look: [0, -26] }
});

export const CREW = Object.freeze([
  {
    id: 'cinderhalo-engineer', name: 'Agathe Rennick', role: 'Reactor engineer', model: 'lab-f153',
    schedule: [
      { post: 'shortfall-14', act: 'look', for: [20, 30] },
      { post: 'shortfall-1', act: 'idle', for: [15, 25] },
      { post: 'shortfall-7', act: 'idleShift', for: [20, 30] }
    ],
    talk: {
      default: [
        ['This reactor was shut down before I was born. Somebody woke it up and pulled every safety rod.'],
        ['A reactor is safe when you respect it. The people who started this one respected nothing.'],
        ['We take turns in the control gallery. Short shifts. Everybody wears a badge.']
      ],
      afterClue: {
        clue_cinderhalo_core: [
          ['Not magic. Not alchemy. Atoms splitting, the way they always could.', 'The Fifth just found the oldest reactor nobody was watching.']
        ]
      }
    }
  },
  {
    id: 'cinderhalo-monitor', name: 'Oskar Thale', role: 'Radiation monitor', model: 'lab-m154',
    schedule: [
      { post: 'equations-6', act: 'idle', for: [20, 30] },
      { post: 'stability-13', act: 'idleShift', for: [15, 25] },
      { post: 'what-comes-off-11', act: 'look', for: [20, 30] }
    ],
    talk: {
      default: [
        ['My counter clicks faster near the core. The clicks tell me where not to stand.'],
        ['Distance and shielding are my two best friends. Time is the third.'],
        ['Every badge is read at the end of a shift. Nobody argues with the badge.']
      ],
      afterBench: {
        'q2-what-comes-off': [
          ['You stopped the radiation with the right shields. That is what I do every day, by the book.']
        ]
      }
    }
  },
  {
    id: 'cinderhalo-veteran', name: 'Benedikt Aro', role: 'Retired operator', model: 'town-m009',
    schedule: [
      { post: 'still-warm-3', act: 'idleShift', for: [20, 30] },
      { post: 'still-warm-16', act: 'look', for: [15, 25] },
      { post: 'still-warm-10', act: 'idle', for: [20, 30] }
    ],
    talk: {
      default: [
        ['I ran this reactor when I was young. We shut it down properly, rods in, doors sealed.'],
        ['The control room still smells the same. Old paper, warm metal.'],
        ['I came back because nobody else alive knows where every valve is.']
      ]
    }
  },
  {
    id: 'cinderhalo-fire', name: 'Marek Calder', role: 'Fire crew', model: 'fire-m138',
    schedule: [
      { post: 'half-gone-2', act: 'look', for: [20, 30] },
      { post: 'shortfall-15', act: 'idle', for: [15, 25] },
      { post: 'half-gone-9', act: 'idleShift', for: [20, 30] }
    ],
    talk: {
      default: [
        ['We keep the coolant pumps running and the crater fires out. Both jobs got harder this month.'],
        ['The crater sea steams where the coolant outflow reaches it.'],
        ['My suit stops heat. The monitor tells me what it does not stop.']
      ]
    }
  },
  {
    id: 'cinderhalo-envoy', name: 'Nadia Ferro', role: 'Guild envoy', model: 'pilot-f168',
    schedule: [
      { post: 'transmutation-core-1', act: 'idle', for: [20, 30] },
      { post: 'shortfall-17', act: 'idleShift', for: [15, 25] },
      { post: 'shortfall-12', act: 'look', for: [20, 30] }
    ],
    talk: {
      default: [
        ['The Four Guilds sent me to see this end. Some of them will not like what I report.'],
        ['The Fifth were crews the Guilds left behind. I wonder how many of them worked here once.'],
        ['Every world we visited led here. Salt, light, rock, gas, all of it.']
      ]
    }
  },
  {
    id: 'cinderhalo-ranger', name: 'Aldo Penhale', role: 'Crater ranger', model: 'hand-m112',
    schedule: [
      { post: 'stability-4', act: 'idleShift', for: [40, 60] },
      { post: 'what-comes-off-5', act: 'look', for: [15, 25] },
      { post: 'still-warm-8', act: 'idle', for: [20, 30] }
    ],
    task: 'cinderhalo-badge',
    talk: {
      default: [
        ['I walk the crater rim and keep people away from the hot ground. Lately that is a full day\'s work.']
      ]
    }
  }
]);

/** The side task: no XP and nothing gated; the reward is the thanks and a note on the Case Board. */
export const TASKS = Object.freeze({
  'cinderhalo-badge': {
    id: 'cinderhalo-badge',
    worldId: 'unit14',
    giver: 'cinderhalo-ranger',
    item: { label: 'Lost Dosimeter Badge', kind: 'metal', pos: [16.75, -26.75] },
    ask: [
      'Someone dropped a dosimeter badge near the reactor building. The strap snapped, by the look of it.',
      'Bring it back. Every badge is read, and this one was never handed in.'
    ],
    remind: [
      'Near the reactor building, on the open ground. A small badge on a broken strap.'
    ],
    thanks: [
      'No name, and not one of ours. Someone walked the core gallery without signing in.',
      'The monitor will read it tonight.'
    ],
    note: {
      title: 'Cinder Halo · Ranger\'s Find',
      speaker: 'Aldo Penhale',
      text: 'A dosimeter badge with no name, found near the reactor building. Someone walked the core gallery without signing in.'
    }
  }
});
