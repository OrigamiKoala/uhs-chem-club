/**
 * quicklight.js — the crews of the storm-belt fuel refinery (Quicklight, unit11). Pure data, no THREE.
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
  'steps-1': { pos: [79.25, 88.75], look: [-63, -68.5] },
  'watch-2': { pos: [-90.75, -89.25], look: [-63, -68.5] },
  'shortcut-3': { pos: [-49.25, 42.75], look: [-63, -68.5] },
  'law-4': { pos: [16.75, -66.25], look: [-63, -68.5] },
  'steps-5': { pos: [32.25, 27.25], look: [-63, -68.5] },
  'time-6': { pos: [-55.25, -27.75], look: [-63, -68.5] },
  'steps-7': { pos: [17.75, 85.75], look: [-63, -68.5] },
  'law-8': { pos: [-7.75, -25.25], look: [0, 0] },
  'watch-9': { pos: [-39.25, -70.75], look: [-63, -68.5] },
  'collide-10': { pos: [-6.75, 43.25], look: [-63, -68.5] },
  'steps-11': { pos: [62.25, 53.25], look: [-63, -68.5] },
  'shortcut-12': { pos: [-22.25, 78.75], look: [-63, -68.5] },
  'watch-13': { pos: [-74.25, -57.75], look: [-63, -68.5] },
  'time-14': { pos: [-35.75, -0.25], look: [0, 0] },
  'steps-15': { pos: [48.75, 82.25], look: [-63, -68.5] },
  'collide-16': { pos: [-7.75, 12.75], look: [0, 0] },
  'watch-17': { pos: [-61.25, -90.25], look: [-63, -68.5] },
  'law-18': { pos: [-8.75, -53.75], look: [-63, -68.5] }
});

export const CREW = Object.freeze([
  {
    id: 'quicklight-chief', name: 'Ottavio Brask', role: 'Tower chief', model: 'fire-m138',
    schedule: [
      { post: 'watch-13', act: 'look', for: [20, 30] },
      { post: 'watch-17', act: 'idle', for: [15, 25] },
      { post: 'time-6', act: 'idleShift', for: [20, 30] }
    ],
    talk: {
      default: [
        ['The fuel towers burn steady for a reason. When they burned too fast, we had minutes to react.'],
        ['Every tower has a vent, a gauge and a man watching both. I am one of those men.'],
        ['Lightning hits the towers every storm. They are built for that. They are not built for sabotage.']
      ],
      afterClue: {
        clue_quicklight_flare: [
          ['The Catalyst. So the Fifth have a leader, and the leader has a name.', 'I would like to know what else that name has signed.']
        ]
      }
    }
  },
  {
    id: 'quicklight-sweeper', name: 'Lio Danek', role: 'Vent sweeper', model: 'crew-m108',
    schedule: [
      { post: 'steps-1', act: 'idle', for: [20, 30] },
      { post: 'steps-15', act: 'idleShift', for: [15, 25] },
      { post: 'steps-11', act: 'look', for: [20, 30] }
    ],
    talk: {
      default: [
        ['I clean the vents. Usually soot. This week it was a fine grey dust I had never seen.'],
        ['Wear a mask in the vents. The dust gets into everything, even your teeth.'],
        ['One vent was spotless inside, like someone had already been in there with a brush.']
      ]
    }
  },
  {
    id: 'quicklight-control', name: 'Mirela Pask', role: 'Control operator', model: 'lab-f153',
    schedule: [
      { post: 'law-4', act: 'idleShift', for: [20, 30] },
      { post: 'law-18', act: 'look', for: [15, 25] },
      { post: 'law-8', act: 'idle', for: [20, 30] }
    ],
    talk: {
      default: [
        ['From the control room I watch every tower at once. When the spikes came, every needle went red together.'],
        ['We log the burn every minute. The logs are how we know something changed.'],
        ['Ten times too fast, the readings said. I checked the instruments three times before I believed them.']
      ],
      afterBench: {
        'q1-watch': [
          ['You timed the burn yourself. The control room logs it the same way, minute by minute.']
        ]
      }
    }
  },
  {
    id: 'quicklight-weather', name: 'June Arkwright', role: 'Weather watch', model: 'pilot-f168',
    schedule: [
      { post: 'shortcut-12', act: 'look', for: [20, 30] },
      { post: 'collide-10', act: 'idle', for: [15, 25] },
      { post: 'steps-7', act: 'idleShift', for: [20, 30] }
    ],
    talk: {
      default: [
        ['The storm belt never really stops. I track which storms will reach the towers and when.'],
        ['The night the vents were spiked, there was a storm. The perfect cover for climbing a tower unseen.'],
        ['A good storm smells sharp before it arrives. You learn the smell out here.']
      ]
    }
  },
  {
    id: 'quicklight-tanker', name: 'Bastian Rowe', role: 'Tanker driver', model: 'hand-m112',
    schedule: [
      { post: 'shortcut-3', act: 'idle', for: [20, 30] },
      { post: 'time-14', act: 'idleShift', for: [15, 25] },
      { post: 'collide-16', act: 'look', for: [20, 30] }
    ],
    talk: {
      default: [
        ['I haul fuel from the towers to the depot. Since the spike, I have been hauling water to cool them instead.'],
        ['The roads out here flood every storm. The tanker sits high for a reason.'],
        ['Two trucks I did not recognise were parked by the depot the week before. Gone the next morning.']
      ]
    }
  },
  {
    id: 'quicklight-radio', name: 'Caspar Lind', role: 'Radio clerk', model: 'town-m009',
    schedule: [
      { post: 'steps-5', act: 'idleShift', for: [40, 60] },
      { post: 'watch-9', act: 'look', for: [15, 25] },
      { post: 'watch-2', act: 'idle', for: [20, 30] }
    ],
    task: 'quicklight-casing',
    talk: {
      default: [
        ['I sit in the radio shack and listen to the storms. Sometimes there are voices in them that should not be there.']
      ]
    }
  }
]);

/** The side task: no XP and nothing gated; the reward is the thanks and a note on the Case Board. */
export const TASKS = Object.freeze({
  'quicklight-casing': {
    id: 'quicklight-casing',
    worldId: 'unit11',
    giver: 'quicklight-radio',
    item: { label: 'Spent Flare Casing', kind: 'bolt', pos: [-4.25, 2.25] },
    ask: [
      'The night the vents were spiked, someone fired a flare near the middle of the refinery. A signal.',
      'The casing should still be lying where it landed. Bring it to me.'
    ],
    remind: [
      'Near the middle of the refinery yard. A blackened tube about the length of your hand.'
    ],
    thanks: [
      'A signal flare, and not one of ours. Somebody was telling somebody the job was done.',
      'I will listen harder tonight.'
    ],
    note: {
      title: 'Quicklight · Radio Clerk\'s Note',
      speaker: 'Caspar Lind',
      text: 'A spent signal flare casing from the night the vents were spiked. It is not refinery issue: someone signalled that the job was done.'
    }
  }
});
