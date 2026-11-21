/**
 * site.js — a world's problems, standing in the world: each walk-up quest's problem prop at its spot, and the
 * world's own trouble (its arrival story: Lanternfall's lamps dark, Brinewire's grid browning out).
 *
 * Built by `attachMystery` (three/npc/attach.js) in 3D On only, before the crew's walk grid, so the props'
 * colliders are walls to the crew and the player alike. Data: `src/npc/intros.js` (what each prop is) and
 * `src/npc/intros/spots.json` (where it stands, from `tools/npc/pick-spots.mjs`, held by `verify:intros`).
 *
 * A quest's symptom is on until that bench is cleared; the world's until its boss is beaten. An opening scene
 * (`director.js`) holds its quest's symptom while it plays (`hold`): off until the moment it goes wrong, then on,
 * so a replayed bench still shows what was wrong.
 */
import * as THREE from 'three';
import { session } from '../../session.js';
import { mergeStatic } from '../materials/pbr-kit.js';
import { introWorld, spotsFor, bossOf } from '../../npc/intros.js';
import { makeKit, buildProp, buildTrail } from './props.js';
import { makeEffect } from './effects.js';
import { buildCloak } from './cloak.js';

const POLL = 1.0;   // seconds between progress reads

function placed(kit, def, spot, world) {
  const prop = buildProp(kit, def.kind, def.opts || {});
  const g = prop.group;
  const [x, z] = spot.pos;
  g.position.set(x, world.getTerrainHeight(x, z), z);
  g.rotation.y = spot.face || 0;
  // What never moves is baked into one mesh a material; the parts an effect drives stay apart.
  mergeStatic(g);
  const effects = (def.effects || []).map(e => makeEffect(kit, prop, e));
  return { prop, effects };
}

export class MysterySite {
  constructor(world, key) {
    this.world = world;
    this.key = key;
    this.def = introWorld(key);
    this.spots = spotsFor(key);
    this.kit = makeKit(o => (typeof world.own === 'function' ? world.own(o) : o));
    this.group = new THREE.Group();
    this.group.name = 'mystery-site';
    this.quests = new Map();     // questId -> { prop, effects, on }
    this.worldProps = [];        // { prop, effects }
    this.held = null;
    this.colliders = [];
    this.timer = 0;
    this.t = 0;
    this.worldOn = true;
    if (!this.def) return;

    for (const [questId, w] of Object.entries(this.def.intros || {})) {
      const spot = this.spots?.quests?.[questId];
      if (!spot || !w.prop) continue;
      const p = placed(this.kit, w.prop, spot, world);
      this.group.add(p.prop.group);
      this.quests.set(questId, { ...p, on: true });
      this.colliders.push({ x: spot.pos[0], z: spot.pos[1], radius: p.prop.radius });
      // A trail from the bench to the problem: prints, spilt salt, dragged tar.
      if (w.trail && spot.trail?.length) {
        const t = buildTrail(this.kit, spot.trail, (x, z) => world.getTerrainHeight(x, z), { kind: w.trail });
        mergeStatic(t);
        this.group.add(t);
      }
    }
    (this.def.symptom?.props || []).forEach((d, i) => {
      const spot = this.spots?.world?.[i];
      if (!spot) return;
      const p = placed(this.kit, d, spot, world);
      this.group.add(p.prop.group);
      this.worldProps.push(p);
      this.colliders.push({ x: spot.pos[0], z: spot.pos[1], radius: p.prop.radius });
    });
    // The Fifth's figure, for a world whose scenes use one.
    if (Object.values(this.def.intros || {}).some(w => (w.steps || []).some(st => st.who === 'cloak'))) {
      this.cloak = buildCloak(this.kit);
      this.group.add(this.cloak.group);
    }
    world.scene.add(this.group);

    // The world's lamps, as the world built them, so they can be put back.
    const lamps = this.def.symptom?.lamps;
    if (lamps && world.lampPool) {
      this.lamps = {
        mode: lamps,
        sources: world.lampPool.sources.map(s => ({ s, base: s.intensity, phase: Math.random() * 10, level: 1, next: 0 })),
        glass: world.M?.lantern?.emissive ? { m: world.M.lantern, base: world.M.lantern.emissiveIntensity } : null
      };
    }
    this.poll();
  }

  /** The world's boss beaten, each bench cleared: read from the session now and then. */
  poll() {
    const id = this.def?.worldId;
    if (!id) return;
    const done = q => Boolean(session.getLearnQuest?.(id, q)?.completedAt);
    const boss = bossOf(id);
    this.worldOn = !(boss && done(boss));
    for (const [q, entry] of this.quests) entry.on = !done(q);
  }

  /** While a scene plays: a quest's problem shown ('on') or not yet ('off') whatever its progress; null lets go. */
  hold(questId, mode = 'on') { this.held = questId ? { questId, mode } : null; }

  /** The problem's standing point, for the walk-up. */
  spotFor(questId) { return this.spots?.quests?.[questId] || null; }

  focusOf(questId) {
    const e = this.quests.get(questId);
    if (!e) return null;
    const v = new THREE.Vector3(...e.prop.focus);
    e.prop.group.updateMatrixWorld(true);
    return e.prop.group.localToWorld(v);
  }

  update(dt) {
    if (!this.def) return;
    this.t += dt;
    this.timer -= dt;
    if (this.timer <= 0) { this.timer = POLL; this.poll(); }
    for (const [q, e] of this.quests) {
      const on = this.held?.questId === q ? this.held.mode === 'on' : e.on;
      for (const fx of e.effects) fx.update(dt, this.t, on);
    }
    for (const p of this.worldProps) for (const fx of p.effects) fx.update(dt, this.t, this.worldOn);
    this.updateLamps(dt);
  }

  updateLamps(dt) {
    const L = this.lamps;
    if (!L) return;
    if (!this.worldOn) {
      if (L.restored) return;
      for (const e of L.sources) e.s.intensity = e.base;
      if (L.glass) L.glass.m.emissiveIntensity = L.glass.base;
      L.restored = true;
      return;
    }
    L.restored = false;
    if (L.mode === 'dim') {
      // A grid browning out: every lamp at a third, sagging and recovering together.
      const k = 0.33 + 0.07 * Math.sin(this.t * 0.9) + 0.03 * Math.sin(this.t * 7.3);
      for (const e of L.sources) e.s.intensity = e.base * k;
      if (L.glass) L.glass.m.emissiveIntensity = L.glass.base * k;
      return;
    }
    // 'sputter': the lamps are out, each catching for a moment now and then, out of step with the rest.
    let lit = 0;
    for (const e of L.sources) {
      e.next -= dt;
      if (e.next <= 0) {
        const catches = Math.random() < 0.18;
        e.level = catches ? 0.35 + Math.random() * 0.5 : 0.002;
        e.next = catches ? 0.06 + Math.random() * 0.2 : 1.5 + Math.random() * 5;
      }
      e.s.intensity = e.base * e.level;
      lit += e.level;
    }
    // The glass is one material for every lantern, so it follows how many are catching at once.
    if (L.glass) L.glass.m.emissiveIntensity = L.glass.base * Math.min(1, 0.05 + lit / Math.max(1, L.sources.length) * 2);
  }

  dispose() {
    this.group.parent?.remove(this.group);
  }
}
