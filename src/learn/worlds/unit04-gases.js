/**
 * unit04-gases.js — Learn world 4: Gases.
 *
 * Bellows. The road runs from what a gauge is measuring, through each of the
 * four things a gas can be made to change (its room, its heat, its amount, its
 * company), to how fast its particles go and how it leaks, and ends where the
 * ideal gas stops being true. Six benches on one instrument, the gas rig
 * (`engine/gasrig.js`), and the Compressor, a boss that fights on all of them.
 *
 * Plan: `docs/plans/bellows-world.md`, and the stage tables in
 * `docs/plans/learn-quests.md` ("World 4 — Bellows"), which this follows.
 *
 * See unit01-atoms.js for how a quest is built and flipped live.
 */

export const UNIT_04 = {
  id: 'unit04',
  order: 4,
  code: '04',
  unit: 'Unit 4',
  world: 'Bellows',
  place: 'Cloud deck',
  title: 'Gases',
  line: 'Squeeze it, warm it, watch it answer.',
  brief: 'There is no ground on Bellows, only deck after deck of pressurised cloud. Every gauge on the ship was calibrated somewhere in that column.',

  quests: [
    {
      id: 'q1-knocks',
      title: 'Pressure and Temperature',
      line: 'Learn what the pressure gauge is really counting.',
      arena: 'bench',
      stageCount: 6,
      status: 'live',
      module: () => import('../quests/unit04/q1-knocks.js')
    },
    {
      id: 'q2-laws',
      title: 'The Gas Laws',
      line: 'Squeeze, heat, and feed gas to find its laws.',
      arena: 'bench',
      stageCount: 6,
      status: 'live',
      module: () => import('../quests/unit04/q2-laws.js')
    },
    {
      id: 'q3-ideal',
      title: 'The Ideal Gas Law',
      line: 'Count sealed tanks with one equation.',
      arena: 'bench',
      stageCount: 7,
      status: 'live',
      module: () => import('../quests/unit04/q3-ideal.js')
    },
    {
      id: 'q4-mixtures',
      title: 'Partial Pressures',
      line: "Split a tank's push gas by gas.",
      arena: 'bench',
      stageCount: 6,
      status: 'live',
      module: () => import('../quests/unit04/q4-mixtures.js')
    },
    {
      id: 'q5-speed',
      title: 'Speed and Escape',
      line: 'Race gases through holes and tubes.',
      arena: 'bench',
      stageCount: 6,
      status: 'live',
      module: () => import('../quests/unit04/q5-speed.js')
    },
    {
      id: 'q6-real',
      title: 'Real Gases',
      line: 'Find where the gas law stops holding.',
      arena: 'bench',
      stageCount: 4,
      status: 'live',
      module: () => import('../quests/unit04/q6-real.js')
    },
    {
      id: 'boss-compressor',
      title: 'The Compressor',
      line: 'Read the rogue machine bench by bench.',
      arena: 'boss',
      stageCount: 5,
      status: 'live',
      module: () => import('../quests/unit04/boss-compressor.js')
    }
  ]
};
