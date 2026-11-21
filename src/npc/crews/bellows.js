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
        ['The Fifth Guild jammed every fuel tank on this cloud platform in one night, wedging valves shut and smashing gauges.'],
        ['We have to vent these pressurized tanks slowly, one at a time, so none of them burst.'],
        ['This fuel station heats every town below the clouds. If our tanks stay jammed, those towns freeze.']
      ],
      afterClue: {
        clue_bellows_warm: [
          ['Twelve days in freezing air and that sealed cylinder never cooled down. Nothing we store up here behaves like that.', 'Whatever is inside it, it is definitely not our fuel.']
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
        ['If you open a high-pressure gas valve too fast, the pipe freezes solid in seconds.'],
        ['Whoever jammed our valves wedged them shut with matching steel wedges. They came here ready for sabotage.'],
        ['Listen closely around the pipes. A loud hiss means a gas leak, so clear the area right away.']
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
        ['I check every pressure gauge twice a shift so we spot dangerous buildup before a tank bursts.'],
        ['Cold air makes the old dials stick, so we tap the glass before writing down a reading.'],
        ['The Fifth Guild smashed our most important pressure gauges on purpose so we could not see what they did.']
      ],
      afterBench: {
        'q3-ideal': [
          ['Now we can calculate how much gas sits inside a sealed tank without risking opening a jammed valve.']
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
        ['This whole fuel station hangs from heavy steel cables high above the clouds. You get used to the swaying.'],
        ['I inspect the suspension cables every morning because ice buildup adds dangerous extra weight.'],
        ['Something hissed out of a damaged vent near the north tanks earlier, though nobody could see the gas.']
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
        ['One stray spark near a leaking fuel tank could ignite the whole platform, so I watch for sparks all shift.'],
        ['The strange sealed cylinder the raiders left stays warm even in freezing wind. Snow melts right off it.', 'I keep my distance from that thing.'],
        ['My fire suit protects me from flames, though up in these clouds the freezing wind is usually the bigger problem.']
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
        ['I fly fuel shuttles down to the towns below the clouds. Everything is grounded until the tanks are safe.']
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
      'The night the tanks were jammed, I saw two hooded raiders roll a strange sealed cylinder onto the platform.',
      'A metal tag fell off it near the north landing pad. Could you grab it before the wind blows it away?'
    ],
    remind: [
      'Check the north edge near where the shuttles land. It is a small steel tag.'
    ],
    thanks: [
      'There is a triangle stamped right into the steel, just like the mark left on Erebus.',
      'That proves the Fifth Guild brought that warm cylinder here themselves.'
    ],
    note: {
      title: 'Bellows · Shuttle Pilot\'s Report',
      speaker: 'Lennart Voss',
      text: 'A steel tag from the sealed cylinder, stamped with the Fifth Guild\'s triangle mark. The raiders brought the warm cylinder here themselves.'
    }
  }
});
