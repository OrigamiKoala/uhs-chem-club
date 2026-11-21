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
        ['We ran air pipes into the collapsed mine tunnel so the trapped miners can breathe while we clear the rubble.'],
        ['Nobody goes past the safety tape without a helmet lamp and a partner.'],
        ['The Fifth Guild set off the blast right at shift change, when the tunnel was fullest.']
      ],
      afterClue: {
        clue_ligar_scorch: [
          ['Solid volcanic rock sliced smooth like glass. No mining torch on Ligar gets anywhere near that hot.', 'Whatever heat source the Fifth Guild brought here is terrifying.']
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
        ['Half my mining crew is still trapped inside the tunnel. I tap on the air pipe every hour, and they tap back.']
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
        ['This quarry is cut into basalt, a hard volcanic rock that cooled into tall stone columns.'],
        ['I put wooden stakes beside every crack in the rock. If a stake shifts overnight, that rock wall is unstable.'],
        ['The rock wall at the tunnel mouth was sliced as smooth as window glass. Normal explosives leave jagged rock.']
      ],
      afterBench: {
        'q2-lattice': [
          ['Now we know which lining material can survive extreme heat without carrying electricity down to the miners.']
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
        ['When we pull the miners out, they will be cold and dehydrated. I have blankets and water ready.'],
        ['Fine rock dust in the tunnel air is dangerous to breathe, so our rescue crew wears masks constantly.'],
        ['We monitor the air pipes carefully to make sure enough oxygen is still reaching the miners below.']
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
        ['My ore carts haul broken rubble away from the tunnel mouth so the diggers can move forward.'],
        ['This quarry ships rich metal ore across the rim, or it did until the Fifth Guild collapsed our main pass.'],
        ['People on the night watch said the blast lit up the whole valley bright white for a second.']
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
        ['Nobody passed through the main gate that night. Whoever caused the collapse climbed over the back ridge.'],
        ['I inspect the wooden support beams around the tunnel every shift so nothing caves in on the rescuers.'],
        ['Strange gases have been leaking out of the cracked rock since the blast, so stay alert near the vents.']
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
      'Every miner hangs a brass name tag on our board before entering the tunnel, and takes it off coming out.',
      'One tag fell off near the big pile of quarry rubble. Could you find it so we know who is safe?'
    ],
    remind: [
      'Look by the big rubble pile near the tall stone columns. It is a small brass name tag.'
    ],
    thanks: [
      'That is old Dunmore\'s tag. He made it out before the blast, so he is safe.',
      'That is one less miner trapped down there. Thank you.'
    ],
    note: {
      title: 'Ligar · Miner Check-In Board',
      speaker: 'Petra Vos',
      text: 'A miner\'s brass name tag found near the rubble pile. Its owner walked out before the blast and is safe.'
    }
  }
});
