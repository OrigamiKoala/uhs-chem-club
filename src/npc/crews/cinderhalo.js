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
        ['This old nuclear reactor was shut down before I was born, until the Fifth Guild restarted it and pulled out every safety rod.'],
        ['A nuclear reactor stays safe only when you follow strict controls, and whoever restarted this one ignored every rule.'],
        ['Our safety crew takes short turns inside the control room, and everyone wears a radiation badge to track exposure.']
      ],
      afterClue: {
        clue_cinderhalo_core: [
          ['It was uranium nuclei splitting inside this reactor all along. The Fifth Guild simply restarted the oldest reactor nobody was watching.']
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
        ['My radiation counter clicks faster near the reactor core, warning me where invisible radiation is strongest.'],
        ['Keeping your distance, using thick lead shields, and limiting your time near the core are what keep you safe.'],
        ['We scan every worker\'s radiation badge after each shift so nobody gets exposed to too much radiation.']
      ],
      afterBench: {
        'q2-what-comes-off': [
          ['Testing which shields stop each kind of radiation is the exact safety rule I use on every shift here.']
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
        ['I worked at this reactor when I was young. When we closed it, we lowered every safety rod and sealed the doors.'],
        ['Stepping back into this control room brings it all back: old logbooks and warm steel panels.'],
        ['I came out of retirement to help because nobody else alive remembers where every emergency valve sits.']
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
        ['My crew keeps the reactor\'s cooling water pumps running so the core does not overheat.'],
        ['Hot cooling water pouring out of the reactor makes the whole crater lake steam.'],
        ['My heavy fire suit blocks heat, though I still rely on my radiation counter to warn me about invisible rays.']
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
        ['The Four Guilds sent me here to witness how this ends, and some council leaders will hate my final report.'],
        ['The Fifth Guild turned out to be the old outpost crews our Guilds abandoned decades ago. Some probably worked right here.'],
        ['Every clue from every world led straight to this crater: the heavy metal, the heat, the copper, and the lead armor.']
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
        ['I patrol the crater rim to keep people away from radioactive ground, which has become a full-time job this month.']
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
      'Someone dropped a radiation-tracking badge near the reactor building after its strap snapped.',
      'Could you bring it back? Every worker\'s badge has to be scanned, and this one was never turned in.'
    ],
    remind: [
      'Check the open ground near the reactor building for a small badge on a broken strap.'
    ],
    thanks: [
      'There is no name on it, so it does not belong to our crew. A Fifth Guild worker walked right beside the core.',
      'Our radiation monitor will scan it tonight.'
    ],
    note: {
      title: 'Cinder Halo · Ranger\'s Find',
      speaker: 'Aldo Penhale',
      text: 'An unlabeled radiation badge found near the reactor building, showing an unauthorized Fifth Guild worker entered the core area.'
    }
  }
});
