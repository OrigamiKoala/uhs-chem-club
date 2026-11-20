/**
 * attach.js — give a Learn world its crew. Every world calls `attachCrew(this, '<key>')` at the end of its
 * constructor, `this.crew?.update(delta, cameraPos)` in `update`, and `this.crew?.dispose()` in `dispose`.
 *
 * The crew (`crew.js`) is built only in 3D On with a renderer: node checks and 3D Off have none. What a
 * world's crew are, where they stand and how they walk comes from `src/npc/crews.js`.
 */
import { Crew } from './crew.js';
import { crewWorld, simPostsOf, walkFor } from '../../npc/crews.js';

export function attachCrew(world, key) {
  if (!world?.renderer || !world.t4 || typeof window === 'undefined') return null;
  const w = crewWorld(key);
  if (!w) return null;
  return new Crew(world, {
    worldId: w.worldId, crew: w.crew, posts: simPostsOf(w.posts), tasks: w.tasks, walk: walkFor(w.key, world), renderer: world.renderer
  });
}
