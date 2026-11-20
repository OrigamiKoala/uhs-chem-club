/**
 * crews.js — which world has which crew. Pure data, no THREE: the runtime (`three/npc/attach.js`), the
 * checks (`tools/verify-npc.mjs`) and the scout (`tools/npc/scout.mjs`) all read it.
 *
 * Each entry carries its crew file's CREW, POSTS and TASKS (Tallow's is `tallow-crew.js`, the rest are
 * `crews/<key>.js`). `walkFor` gives the walk grid each world's crew plan on (`src/npc/crew-sim.js` WalkGrid
 * options); `keepOffFor` the ground they keep off.
 */
import * as tallow from './tallow-crew.js';
import * as lanternfall from './crews/lanternfall.js';
import * as ligar from './crews/ligar.js';
import * as bellows from './crews/bellows.js';
import * as ember from './crews/ember.js';
import * as mirrowen from './crews/mirrowen.js';
import * as kettle from './crews/kettle.js';
import * as teeter from './crews/teeter.js';
import * as verdigris from './crews/verdigris.js';
import * as brinewire from './crews/brinewire.js';
import * as quicklight from './crews/quicklight.js';
import * as lodestone from './crews/lodestone.js';
import * as thornmere from './crews/thornmere.js';
import * as cinderhalo from './crews/cinderhalo.js';

const DATA = { tallow, lanternfall, ligar, bellows, ember, mirrowen, kettle, teeter, verdigris, brinewire, quicklight, lodestone, thornmere, cinderhalo };

export const CREW_WORLDS = Object.freeze([
  { key: 'tallow', worldId: 'unit01', module: 'tallow', className: 'TallowWorld' },
  { key: 'lanternfall', worldId: 'unit02', module: 'lanternfall', className: 'LanternfallWorld' },
  { key: 'ligar', worldId: 'unit03', module: 'ligar', className: 'LigarWorld' },
  { key: 'bellows', worldId: 'unit04', module: 'bellows', className: 'BellowsWorld' },
  { key: 'ember', worldId: 'unit05', module: 'ember', className: 'EmberReachWorld' },
  { key: 'mirrowen', worldId: 'unit06', module: 'mirrowen', className: 'MirrowenWorld' },
  { key: 'kettle', worldId: 'unit07', module: 'kettle', className: 'KettleWorld' },
  { key: 'teeter', worldId: 'unit08', module: 'teeter', className: 'TeeterWorld' },
  { key: 'verdigris', worldId: 'unit09', module: 'verdigris', className: 'VerdigrisWorld' },
  { key: 'brinewire', worldId: 'unit10', module: 'brinewire', className: 'BrinewireWorld' },
  { key: 'quicklight', worldId: 'unit11', module: 'quicklight', className: 'QuicklightWorld' },
  { key: 'lodestone', worldId: 'unit12', module: 'lodestone', className: 'LodestoneWorld' },
  { key: 'thornmere', worldId: 'unit13', module: 'thornmere', className: 'ThornmereWorld' },
  { key: 'cinderhalo', worldId: 'unit14', module: 'cinderhalo', className: 'CinderHaloWorld' }
].map(w => ({ ...w, crew: DATA[w.key].CREW, posts: DATA[w.key].POSTS, tasks: DATA[w.key].TASKS })));

/** A world's crew entry by world id ('unit02') or key ('lanternfall'). */
export const crewWorld = id => CREW_WORLDS.find(w => w.worldId === id || w.key === id) || null;

/** The yaw a member faces at a post (bodies face +z at yaw 0). */
export function postFace(post) {
  return Math.atan2(post.look[0] - post.pos[0], post.look[1] - post.pos[1]);
}

/** A crew file's POSTS with `face` filled in, as `CrewSim` takes them. */
export function simPostsOf(posts) {
  const out = {};
  for (const [id, p] of Object.entries(posts)) out[id] = { ...p, face: postFace(p) };
  return out;
}

/**
 * The walk grid options for a world's crew: `bounds` the rectangle they keep inside, `floor` the ground
 * heights they walk on, `maxStep` how sharp a change of ground they will not climb, `keepOff` the boss
 * arena (`keepOffFor`), closed as if walled. Tallow keeps the
 * pilot's settings (one flat level, its pit closed); the other worlds have terraces, ramps and hills.
 */
export function walkFor(key, world = null) {
  // Tallow's arena is kept off by its posts alone (the pilot's check), so its grid stays as built.
  if (key === 'tallow') return { bounds: 72, floor: [-0.6, 1.2] };
  // The player's own walk is held to ±100 m on a Learn world (`stage.js`); the crew keep 4 m inside it.
  return { bounds: { minX: -96, maxX: 96, minZ: -96, maxZ: 96 }, floor: [-40, 60], maxStep: 0.3, keepOff: keepOffFor(world) };
}

/**
 * Ground the crew keep off: the world's boss arena (`data.arena`: where the boss stands and where the
 * player squares up to it, and the ground between). Nobody's post or walk crosses it.
 */
export function keepOffFor(world) {
  if (world?.data?.id === 'tallow') return [...tallow.KEEP_OFF];
  const a = world?.data?.arena;
  if (!a?.boss || !a?.player) return [];
  const [bx, , bz] = a.boss, [px, , pz] = a.player;
  return [
    { x: bx, z: bz, radius: 10 },
    { x: (bx + px) / 2, z: (bz + pz) / 2, radius: 6 },
    { x: px, z: pz, radius: 4 }
  ];
}
