/**
 * attach.js — give a Learn world its crew. Every world calls `attachCrew(this, '<key>')` at the end of its
 * constructor, `this.crew?.update(delta, cameraPos)` in `update`, and `this.crew?.dispose()` in `dispose`.
 *
 * The crew (`crew.js`) is built only in 3D On with a renderer: node checks and 3D Off have none. What a
 * world's crew are, where they stand and how they walk comes from `src/npc/crews.js`. The world's problem props
 * and opening-scene cast (`three/mystery/site.js`, as `world.mystery`) are built here too, first.
 */
import { Crew } from './crew.js';
import { MysterySite } from '../mystery/site.js';
import { crewWorld, simPostsOf, walkFor } from '../../npc/crews.js';

export function attachCrew(world, key) {
  if (!world?.renderer || !world.t4 || typeof window === 'undefined') return null;
  const w = crewWorld(key);
  if (!w) return null;
  // The world's problems stand before the crew lay their walk grid, so the props are walls to them.
  try {
    world.mystery = new MysterySite(world, key);
    for (const c of world.mystery.colliders) world.colliders.push(c);
    // A prop under a roof takes the world's cover mask like everything else built there.
    world.cover?.applyTo?.(world.mystery.group);
  } catch (err) {
    console.error('Problem props failed to build:', err);
    world.mystery = null;
  }
  return new Crew(world, {
    worldId: w.worldId, crew: w.crew, posts: simPostsOf(w.posts), tasks: w.tasks, walk: walkFor(w.key, world), renderer: world.renderer
  });
}
