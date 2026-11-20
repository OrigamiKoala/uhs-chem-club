/**
 * ligar.js — the miners of the basalt pass and the crew digging out the buried tunnel (Ligar, unit03). Pure data, no THREE.
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
  'arch-1': { pos: [-67.25, -19.25], look: [-63.96, -34.71] },
  'colonnade-1': { pos: [-49.25, 45.75], look: [-45.49, 36.7] },
  'spoil-heap-1': { pos: [-42.75, 19.75], look: [-37.84, 18.79] },
  'broken-column-1': { pos: [-10.75, 25.25], look: [-14, 24] },
  'conveyor-1': { pos: [-28.25, -29.25], look: [-24.5, -31] },
  'ore-cart-1': { pos: [-19.25, -39.25], look: [-20, -37] },
  'guard-hut-1': { pos: [12.25, -17.75], look: [15, -16] },
  'hauler-1': { pos: [12.25, 8.75], look: [15.1, 4.62] },
  'drum-stack-1': { pos: [14.25, -7.25], look: [13.17, -4.87] },
  'shed-1': { pos: [-20.25, 28.25], look: [-26.03, 28.82] },
  'stack-1': { pos: [-39.75, -26.25], look: [-44.94, -22.5] },
  'water-tower-1': { pos: [-14.25, 4.75], look: [-18, 4] },
  'cable-mast-1': { pos: [-4.25, 18.25], look: [-4, 16] },
  'stake-marker-1': { pos: [-0.25, 33.75], look: [0, 32] },
  'slab-yard-1': { pos: [-39.75, -8.75], look: [-36, -2] },
  'crusher-house-1': { pos: [39.25, 0.75], look: [31.6, -4] },
  'scale-house-1': { pos: [31.75, 4.75], look: [27.5, 9.8] },
  'substation-1': { pos: [55.25, 12.25], look: [47.5, 11.3] }
});

export const CREW = Object.freeze([
  {
    id: 'ligar-chief', name: 'Hollis Brandt', role: 'Rescue chief', model: 'fire-m138',
    schedule: [
      { post: 'stake-marker-1', act: 'look', for: [20, 30] },
      { post: 'broken-column-1', act: 'idle', for: [15, 25] },
      { post: 'cable-mast-1', act: 'idleShift', for: [20, 30] }
    ],
    talk: {
      default: [
        ['We have air pipes into the buried tunnel. The miners inside can breathe while we dig.'],
        ['Nobody goes past the tape without a lamp, a partner and a reason.'],
        ['The blast came at shift change. Whoever set it knew when the tunnel would be fullest.']
      ],
      afterClue: {
        clue_ligar_scorch: [
          ['Rock cut that smooth, that fast. No torch on this world gets that hot.', 'Whatever they carry, I would not stand in front of it for anything.']
        ]
      }
    }
  },
  {
    id: 'ligar-miner', name: 'Petra Vos', role: 'Shift miner', model: 'crew-f101',
    schedule: [
      { post: 'arch-1', act: 'idle', for: [40, 60] },
      { post: 'stack-1', act: 'idleShift', for: [15, 25] },
      { post: 'slab-yard-1', act: 'look', for: [20, 30] }
    ],
    task: 'ligar-tag',
    talk: {
      default: [
        ['Half my crew is still down there. I tap on the air pipe every hour, and they tap back.']
      ]
    }
  },
  {
    id: 'ligar-surveyor', name: 'Anselm Ruiz', role: 'Surveyor', model: 'crew-m101',
    schedule: [
      { post: 'substation-1', act: 'idleShift', for: [20, 30] },
      { post: 'crusher-house-1', act: 'look', for: [15, 25] },
      { post: 'scale-house-1', act: 'idle', for: [20, 30] }
    ],
    talk: {
      default: [
        ['Basalt is cooled lava. It cracks into columns as it shrinks, which is why the arches stand so straight.'],
        ['I mark every crack with a stake. If a stake moves overnight, the rock above it is moving too.'],
        ['The cut face at the tunnel mouth is smooth as a window. I have never measured anything like it.']
      ],
      afterBench: {
        'q2-lattice': [
          ['You saw how the stone holds together differently from the wire. That is why we blast one and draw the other.']
        ]
      }
    }
  },
  {
    id: 'ligar-medic', name: 'Nkem Ade', role: 'Field medic', model: 'medic-f154',
    schedule: [
      { post: 'colonnade-1', act: 'look', for: [20, 30] },
      { post: 'spoil-heap-1', act: 'idle', for: [15, 25] },
      { post: 'shed-1', act: 'idleShift', for: [20, 30] }
    ],
    talk: {
      default: [
        ['When the miners come up, they will be cold, thirsty and half blind from the dark. I am ready for all of it.'],
        ['Rock dust is the real danger down there. Masks on, always, even when it looks clear.'],
        ['Breathe slowly in a tight space. Panic burns through the air faster than work does.']
      ]
    }
  },
  {
    id: 'ligar-carter', name: 'Gus Tamm', role: 'Ore carter', model: 'hand-m112',
    schedule: [
      { post: 'guard-hut-1', act: 'idle', for: [20, 30] },
      { post: 'drum-stack-1', act: 'idleShift', for: [15, 25] },
      { post: 'hauler-1', act: 'look', for: [20, 30] }
    ],
    talk: {
      default: [
        ['My carts carry rubble out as fast as the crew can load it. Every load is a little closer to them.'],
        ['Ligar ore goes out by the cartload. Good ore, too, until the Fifth shut the pass.'],
        ['They say the blast lit the whole valley white for a moment. I was asleep. Sorry I missed it.']
      ]
    }
  },
  {
    id: 'ligar-guard', name: 'Ivo Strand', role: 'Gate guard', model: 'watch-m171',
    schedule: [
      { post: 'ore-cart-1', act: 'idleShift', for: [20, 30] },
      { post: 'conveyor-1', act: 'look', for: [15, 25] },
      { post: 'water-tower-1', act: 'idle', for: [20, 30] }
    ],
    talk: {
      default: [
        ['Nobody signed in at the gate that night. Whoever set the blast came over the hills, not down the road.'],
        ['I check the tunnel props every round. Wood creaks before it gives. Steel does not warn you.'],
        ['The hill wind howls through the arches after dark. You stop hearing it after a while.']
      ]
    }
  }
]);

/** The side task: no XP and nothing gated; the reward is the thanks and a note on the Case Board. */
export const TASKS = Object.freeze({
  'ligar-tag': {
    id: 'ligar-tag',
    worldId: 'unit03',
    giver: 'ligar-miner',
    item: { label: 'Brass Tally Tag', kind: 'metal', pos: [-0.25, 22.75] },
    ask: [
      'Every miner hangs a brass tag on the board going in, and takes it back coming out.',
      'One tag is missing from the board. Someone dropped it by the spoil heap. Find it for me?'
    ],
    remind: [
      'The spoil heap by the old columns. A small brass tag, stamped with a name.'
    ],
    thanks: [
      'That is old Dunmore\'s tag. He walked out before the blast, so he is safe.',
      'One less name to worry about. Thank you.'
    ],
    note: {
      title: 'Ligar · Tally Board',
      speaker: 'Petra Vos',
      text: 'A miner\'s brass tally tag, found by the spoil heap. Its owner walked out before the blast and is safe.'
    }
  }
});
