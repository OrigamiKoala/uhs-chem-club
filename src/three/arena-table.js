/**
 * arena-table.js — The table a boss is fought over, stood in the boss's own arena.
 *
 * A boss quest has no site in its world: the five walkable Learn worlds lay out one host per bench, and the boss is
 * fought on open ground chosen for it (`learn/engine/boss-arena.js` `BOSS_ARENA_SPOTS`). The bench the fight plays on
 * used to be built in a little room of its own, so the boss stood in the world with nobody looking at it. This puts a
 * real table out on that ground, between the player and the boss, and registers it exactly as a host registers a
 * bench (`world.benchAnchors`), so the tabletop deploys onto it the way it deploys onto any other plate and the
 * world stays on screen behind it, with the boss standing in it.
 *
 * THE FRAME. The bench frame's +z is the front (where the player stands), so a table that faces the player has its +z
 * pointing back along the line from the boss. All six arenas run along -z (the boss is at smaller z than the player),
 * which makes the rotation 0, but the plan is written for any heading and `verify:arena` asks it in all five worlds.
 *
 * WHAT IS BUILT. The standard bay bench (`bench-bay.js`: plate 4.8 x 1.3 m, shelf skin), a steel standing deck under it
 * and under the player with a hazard stripe along its far edge (the firing line), and one box collider for the walk.
 * Nothing is lit and nothing is baked: it is added when the fight begins and taken away when it ends.
 */

import * as THREE from 'three';
import { buildBayBench, BENCH_BAY, PLATE_TOP } from './bench-bay.js';
import { hazardStripe } from './materials/pbr-kit.js';
import { tierAtLeast } from './tier.js';

/** Metres. The plate's middle stands this far in front of the boss's spot's `playerPos`, toward the boss. */
export const ARENA_TABLE = Object.freeze({
  /** From the player's standing spot to the middle of the plate. */
  standOff: 2.2,
  /** The standing deck: wider than the plate, running from behind it to past where the player stands. */
  deck: Object.freeze({ w: 6.4, z0: -1.3, z1: 2.7, h: 0.05 }),
  /** The collider the walk meets (half the plate's width, plus a margin; deeper than the plate). */
  half: Object.freeze({ x: BENCH_BAY.width / 2 + 0.1, z: BENCH_BAY.depth / 2 + 0.15 })
});

/**
 * Where the table stands, from the boss's spot. Pure, so a verifier asks it without a world.
 * @param {{playerPos: number[], bossPos: number[]}} spot
 * @param {(x: number, z: number) => number} groundAt the world's height field
 */
export function arenaTablePlan(spot, groundAt = () => 0) {
  const dx = spot.bossPos[0] - spot.playerPos[0];
  const dz = spot.bossPos[2] - spot.playerPos[2];
  const len = Math.hypot(dx, dz) || 1;
  const fx = dx / len;
  const fz = dz / len;
  const x = spot.playerPos[0] + fx * ARENA_TABLE.standOff;
  const z = spot.playerPos[2] + fz * ARENA_TABLE.standOff;
  // The bench frame's +z (its front) points at the player: back along the line from the boss.
  const rotationY = Math.atan2(-fx, -fz);
  const cos = Math.cos(rotationY);
  const sin = Math.sin(rotationY);
  // The standing deck and the plate are level, on the highest ground they cover, so no leg hangs in the air.
  let y = -Infinity;
  const { deck } = ARENA_TABLE;
  for (const lx of [-deck.w / 2, 0, deck.w / 2]) {
    for (const lz of [deck.z0, 0, deck.z1]) {
      const wx = x + lx * cos + lz * sin;
      const wz = z - lx * sin + lz * cos;
      const g = groundAt(wx, wz);
      if (Number.isFinite(g)) y = Math.max(y, g);
    }
  }
  if (!Number.isFinite(y)) y = 0;
  // The walk's box: the plate's footprint turned to the heading.
  const hx = ARENA_TABLE.half.x;
  const hz = ARENA_TABLE.half.z;
  const xs = [];
  const zs = [];
  for (const [lx, lz] of [[-hx, -hz], [hx, -hz], [-hx, hz], [hx, hz]]) {
    xs.push(x + lx * cos + lz * sin);
    zs.push(z - lx * sin + lz * cos);
  }
  return {
    x, y, z, rotationY, forward: [fx, fz],
    collider: { minX: Math.min(...xs), maxX: Math.max(...xs), minZ: Math.min(...zs), maxZ: Math.max(...zs) }
  };
}

/**
 * Stand the table in a world and register it as `questId`'s bench.
 * @param {object} world a Learn world (`scene`, `colliders`, `benchAnchors`, `getTerrainHeight`)
 * @param {{questId: string, spot: object}} o
 * @returns {{group: THREE.Group, plan: object, dispose: () => void}}
 */
export function buildArenaTable(world, { questId, spot }) {
  const owned = [];
  const own = (...objs) => { for (const o of objs) if (o && typeof o.dispose === 'function') owned.push(o); return objs[0]; };
  const t4 = tierAtLeast('T4');
  const plan = arenaTablePlan(spot, (x, z) => world.getTerrainHeight?.(x, z));

  const std = (color, roughness, metalness) => own(new THREE.MeshStandardMaterial({ color, roughness, metalness }));
  const mats = {
    top: std(0x5d5a54, 0.78, 0.55),
    dark: std(0x2b2926, 0.86, 0.5),
    tray: std(0x3b3935, 0.9, 0.35)
  };

  const group = new THREE.Group();
  group.name = `arena-table:${questId}`;
  group.position.set(plan.x, plan.y, plan.z);
  group.rotation.y = plan.rotationY;

  const bench = buildBayBench({ own, t4 }, {
    skin: 'shelf',
    plate: 'AR-01',
    mats,
    rail: null,
    noWeather: true
  });
  group.add(bench.group);

  // The standing deck: a slab under the table and the player, its far edge striped as the firing line.
  const { deck } = ARENA_TABLE;
  const slabGeo = own(new THREE.BoxGeometry(deck.w, deck.h, deck.z1 - deck.z0));
  const slab = new THREE.Mesh(slabGeo, mats.dark);
  slab.position.set(0, deck.h / 2 - 0.004, (deck.z0 + deck.z1) / 2);
  slab.receiveShadow = t4;
  group.add(slab);
  const stripe = hazardStripe(deck.w, 0.34);
  stripe.rotation.x = -Math.PI / 2;
  stripe.position.set(0, deck.h + 0.001, deck.z0 + 0.2);
  own(stripe.userData.ownGeometry, stripe.userData.ownMaterial, stripe.userData.ownTexture);
  group.add(stripe);

  // The cased-instrument slot a bench carries is empty here; it carries the materials the tabletop dresses itself in.
  const dormant = bench.dormant;
  dormant.visible = false;

  world.scene.add(group);
  world.colliders?.push(plan.collider);

  const anchor = {
    siteId: 'arena',
    position: [plan.x, plan.y, plan.z],
    rotationY: plan.rotationY,
    topY: plan.y + PLATE_TOP,
    dormant,
    arena: true
  };
  world.benchAnchors?.set(questId, anchor);

  let disposed = false;
  return {
    group, plan, anchor,
    dispose() {
      if (disposed) return;
      disposed = true;
      if (world.benchAnchors?.get(questId) === anchor) {
        world.setBenchDeployed?.(questId, false);
        world.benchAnchors.delete(questId);
      }
      const at = world.colliders ? world.colliders.indexOf(plan.collider) : -1;
      if (at >= 0) world.colliders.splice(at, 1);
      world.scene.remove(group);
      for (const o of owned) o.dispose();
    }
  };
}
