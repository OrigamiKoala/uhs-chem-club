/**
 * scenes.js — the shapes an opening scene can take (`three/mystery/director.js` steps), so a world file says what
 * happens in a line. A world mixes the shapes that suit it; the lines are its own.
 */
const npc = id => `npc:${id}`;

/** Two of the crew are found arguing by the problem; the second puts the question to the player. */
export const overheard = (a, b, lineA, lineB) => [
  { do: 'place', who: npc(a), at: 'stand', face: 'stand2' },
  { do: 'place', who: npc(b), at: 'stand2', face: 'stand' },
  { do: 'look', at: npc(a), dur: 1.0 },
  { do: 'go', who: 'cam', to: 'view', lookAt: npc(a) },
  { do: 'say', who: npc(a), lines: [lineA] },
  { do: 'say', who: npc(b), lines: [lineB], ask: true }
];

/** One of the crew comes over, says what is wrong and leads the player to it. */
export const walkUp = (id, call, { speed = 1.25, show = null } = {}) => [
  { do: 'place', who: npc(id), at: 'meet', face: 'player' },
  { do: 'look', at: npc(id), dur: 1.0 },
  { do: 'go', who: npc(id), to: 'near', face: 'player', speed: speed + 0.2 },
  { do: 'say', who: npc(id), lines: [call] },
  { do: 'follow', who: npc(id), to: 'stand', speed },
  { do: 'look', at: 'spot', dur: 1.2 },
  { do: 'say', who: npc(id), lines: show ? [show] : [], ask: true }
];

/** A Fifth Guild figure is seen at the problem; the player goes towards it and it slips away. */
export const cloaked = (seen, after, { start = false } = {}) => [
  { do: 'place', who: 'cloak', at: 'stand', face: 'spot' },
  { do: 'look', at: 'cloak', dur: 2.2 },
  { do: 'say', who: 'vess', lines: [seen] },
  { do: 'go', who: 'cam', to: 'view', lookAt: 'cloak', wait: false },
  { do: 'wait', s: 1.4 },
  { do: 'vanish', who: 'cloak' },
  ...(start ? [{ do: 'start' }, { do: 'wait', s: 0.8 }] : []),
  { do: 'look', at: 'spot', dur: 1.2 },
  { do: 'say', who: 'vess', lines: [after], ask: true }
];

/** Something goes wrong in view; a voice from out of sight calls it. */
export const happens = (voice, line, { walk = false, snap = false } = {}) => [
  { do: 'look', at: 'spot', dur: snap ? 0.3 : 1.4 },
  { do: 'wait', s: snap ? 0.2 : 0.6 },
  { do: 'start' },
  ...(snap ? [{ do: 'look', at: 'spot', dur: 0.8, rate: 7 }] : [{ do: 'wait', s: 1.6 }]),
  ...(walk ? [{ do: 'go', who: 'cam', to: 'view', lookAt: 'spot' }] : []),
  { do: 'say', who: voice, lines: [line], ask: true }
];

/** An alarm: it starts, the view snaps round, one of the crew runs to it and the player follows. */
export const alarm = (id, line) => [
  { do: 'start' },
  { do: 'look', at: 'spot', dur: 0.9, rate: 6 },
  { do: 'place', who: npc(id), at: 'meet', face: 'spot' },
  { do: 'go', who: npc(id), to: 'stand', face: 'player', speed: 2.6, wait: false },
  { do: 'go', who: 'cam', to: 'view', lookAt: 'spot', speed: 1.6 },
  { do: 'say', who: npc(id), lines: [line], ask: true }
];

/** Guided over the wrist link by someone who can see the problem from where they are. */
export const radio = (voice, first, then) => [
  { do: 'say', who: voice, lines: [first], look: false },
  { do: 'look', at: 'spot', dur: 1.2 },
  { do: 'go', who: 'cam', to: 'view', lookAt: 'spot', speed: 1.4 },
  { do: 'say', who: voice, lines: [then], ask: true }
];

/** A trail on the ground, followed from the bench to where it ends. */
export const followTrail = (speaker, line) => [
  { do: 'look', at: 'trail', dur: 1.6 },
  { do: 'go', who: 'cam', to: 'view' },
  { do: 'look', at: 'spot', dur: 1.2 },
  { do: 'say', who: speaker, lines: [line], ask: true }
];

/** One of the crew, already at the problem, calls the player over to it. */
export const calledOver = (id, call, show) => [
  { do: 'place', who: npc(id), at: 'stand', face: 'player' },
  { do: 'look', at: npc(id), dur: 1.2 },
  { do: 'say', who: npc(id), lines: [call] },
  { do: 'go', who: 'cam', to: 'view', lookAt: 'spot' },
  { do: 'say', who: npc(id), lines: [show], ask: true }
];
