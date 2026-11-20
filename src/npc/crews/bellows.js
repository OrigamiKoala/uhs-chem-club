/**
 * bellows.js — the crews who run the fuel tanks on the cloud deck (Bellows, unit04). Pure data, no THREE.
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
  'real-1': { pos: [62.75, -67.75], look: [-2, 60] },
  'speed-2': { pos: [-72.75, 84.75], look: [-2, 60] },
  'mixtures-3': { pos: [51.75, 42.75], look: [-2, 60] },
  'ideal-4': { pos: [-38.75, -51.25], look: [-2, 60] },
  'speed-5': { pos: [-0.75, 92.75], look: [-2, 60] },
  'knocks-6': { pos: [-65.75, 14.25], look: [-2, 60] },
  'laws-7': { pos: [16.75, -14.25], look: [0, 0] },
  'laws-8': { pos: [-7.75, 36.75], look: [0, 0] },
  'mixtures-9': { pos: [19.75, 61.75], look: [-2, 60] },
  'mixtures-10': { pos: [50.75, 8.25], look: [-2, 60] },
  'real-11': { pos: [43.25, -42.25], look: [-2, 60] },
  'speed-12': { pos: [-18.75, 66.75], look: [-2, 60] },
  'ideal-13': { pos: [-10.75, -64.25], look: [-2, 60] },
  'speed-14': { pos: [-45.25, 79.25], look: [-2, 60] },
  'knocks-15': { pos: [-55.25, 38.75], look: [-2, 60] },
  'real-16': { pos: [70.25, -42.25], look: [-2, 60] },
  'mixtures-17': { pos: [22.75, 86.75], look: [-2, 60] },
  'laws-18': { pos: [15.25, -36.25], look: [0, 0] }
});

export const CREW = Object.freeze([
  {
    id: 'bellows-master', name: 'Odile Farrow', role: 'Deck master', model: 'town-f009',
    schedule: [
      { post: 'speed-12', act: 'look', for: [20, 30] },
      { post: 'speed-14', act: 'idle', for: [15, 25] },
      { post: 'speed-5', act: 'idleShift', for: [20, 30] }
    ],
    talk: {
      default: [
        ['Every tank on this deck was jammed in one night. Valves wedged, gauges smashed, and nobody saw a thing.'],
        ['We relieve the tanks one at a time, slowly. Rush it and the whole deck learns why.'],
        ['The fuel feeds every town below the clouds. When the deck stops, they freeze.']
      ],
      afterClue: {
        clue_bellows_warm: [
          ['Twelve days in freezing air and that tank never cooled. Nothing we burn up here does that.', 'Whatever is inside, it is not our fuel.']
        ]
      }
    }
  },
  {
    id: 'bellows-valves', name: 'Kasimir Lund', role: 'Valve hand', model: 'crew-m103',
    schedule: [
      { post: 'real-1', act: 'idle', for: [20, 30] },
      { post: 'real-16', act: 'idleShift', for: [15, 25] },
      { post: 'real-11', act: 'look', for: [20, 30] }
    ],
    talk: {
      default: [
        ['Open a valve too fast and the pipe frosts white in seconds. I have the scars to prove it.'],
        ['The jammed valves were wedged with the same steel shims. Someone came prepared.'],
        ['A hiss means a leak. A whistle means a bad leak. Silence means run.']
      ]
    }
  },
  {
    id: 'bellows-gauges', name: 'Yusra Malik', role: 'Gauge clerk', model: 'lab-f153',
    schedule: [
      { post: 'ideal-4', act: 'idleShift', for: [20, 30] },
      { post: 'ideal-13', act: 'look', for: [15, 25] },
      { post: 'laws-18', act: 'idle', for: [20, 30] }
    ],
    talk: {
      default: [
        ['I read every gauge on the deck twice a shift. The readings tell me what each tank is doing before it does it.'],
        ['Gauges lie when they are cold. You learn to tap the glass and wait.'],
        ['The smashed gauges were the important ones. Whoever did this knew which to break.']
      ],
      afterBench: {
        'q3-ideal': [
          ['You tied the whole tank together in one rule. I keep a copy of that on my clipboard now.']
        ]
      }
    }
  },
  {
    id: 'bellows-rigger', name: 'Corin Hale', role: 'Rigger', model: 'crew-m111',
    schedule: [
      { post: 'mixtures-3', act: 'look', for: [20, 30] },
      { post: 'mixtures-10', act: 'idle', for: [15, 25] },
      { post: 'mixtures-9', act: 'idleShift', for: [20, 30] }
    ],
    talk: {
      default: [
        ['The deck hangs on cables over nothing but cloud. You get used to the sway.'],
        ['I check every cable at dawn. Ice on a cable doubles its load.'],
        ['Look down through the grating if you like. I stopped looking years ago.']
      ]
    }
  },
  {
    id: 'bellows-firewatch', name: 'Dace Morrow', role: 'Fire watch', model: 'fire-m134',
    schedule: [
      { post: 'knocks-6', act: 'idle', for: [20, 30] },
      { post: 'knocks-15', act: 'idleShift', for: [15, 25] },
      { post: 'laws-8', act: 'look', for: [20, 30] }
    ],
    talk: {
      default: [
        ['One spark near a venting tank and we lose the deck. I watch for sparks.'],
        ['The sealed tank sits warm in the frost. Snow melts off it as fast as it lands.', 'I keep my distance.'],
        ['My suit is rated for heat. Up here it is mostly cold that tries to kill you.']
      ]
    }
  },
  {
    id: 'bellows-courier', name: 'Lennart Voss', role: 'Skiff pilot', model: 'pilot-m167',
    schedule: [
      { post: 'speed-2', act: 'idleShift', for: [40, 60] },
      { post: 'mixtures-17', act: 'look', for: [15, 25] },
      { post: 'laws-7', act: 'idle', for: [20, 30] }
    ],
    task: 'bellows-tag',
    talk: {
      default: [
        ['I fly the skiff between the deck and the towns below. Today I fly nothing until the tanks are safe.']
      ]
    }
  }
]);

/** The side task: no XP and nothing gated; the reward is the thanks and a note on the Case Board. */
export const TASKS = Object.freeze({
  'bellows-tag': {
    id: 'bellows-tag',
    worldId: 'unit04',
    giver: 'bellows-courier',
    item: { label: 'Stamped Cylinder Tag', kind: 'metal', pos: [13.75, 91.25] },
    ask: [
      'The night of the jamming I saw two hooded figures roll a sealed cylinder onto the deck.',
      'A tag fell off it near the north edge. Bring it to me before the wind takes it.'
    ],
    remind: [
      'The north edge, near where the skiffs land. A small steel tag.'
    ],
    thanks: [
      'A triangle stamped in the steel. The same mark they left on Erebus.',
      'So that cylinder came with them. It was never ours.'
    ],
    note: {
      title: 'Bellows · Skiff Pilot\'s Report',
      speaker: 'Lennart Voss',
      text: 'A steel tag from the sealed cylinder, stamped with the Fifth\'s triangle mark. The cylinder was brought onto the deck by the raiders.'
    }
  }
});
