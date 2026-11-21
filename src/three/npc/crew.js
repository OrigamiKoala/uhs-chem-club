/**
 * crew.js — a world's crew, alive: the simulation (`src/npc/crew-sim.js`) moving the bodies
 * (`figures.js`), [E] TALK targets, the talk card (`ui/npc-card.js`) and the side task's item.
 *
 * A world builds one in its constructor (3D On with a renderer only, through `attach.js`) and calls
 * `update(delta, cameraPos)` every frame. The walk grid fills a few milliseconds a frame on the first
 * frames the world is shown; the crew appear at their first posts once it is done. The stage reads `aimTargets()` for [E], `discs` for the walk's colliders (the player cannot
 * walk through a person), and switches the crew on and off as the player arrives and leaves
 * (`setActive`), and hides it while a boss is fought on the world (`setHidden`).
 *
 * WARMING. A body is never shown on the frame its shaders would compile or its textures upload: a desktop body
 * carries fifteen textures (two at 2048²), and six of them arriving at once froze the first second on a world.
 * Each body is compiled with `compileAsync` as it loads, and its textures go up to the GPU a few a frame
 * (`warm`); it is shown once both are done. The stage calls `warm()` on the voyage's destination while the
 * ship is still flying down, so the walk grid and the bodies are ready before the ramp opens.
 *
 * COST. Bodies further than 70 m are not drawn; past 30 m their animation steps at 10 Hz. A body casts a
 * real shadow only within 25 m (and only where the renderer draws shadows at all); otherwise a soft blob
 * under the feet stands in. A handset draws at most the four nearest.
 */
import * as THREE from 'three';
import { session } from '../../session.js';
import { isTouchPrimary } from '../tier.js';
import { aimBox } from '../aim-target.js';
import { bayBoxes } from '../bench-bay.js';
import { WalkGrid, CrewSim, bayRects, CREW_RADIUS } from '../../npc/crew-sim.js';
import { talkFor, TASK_FLAG } from '../../npc/talk.js';
import { makeFigure, preloadCrew } from './figures.js';
import { openLineCard, closeLineCard, isLineCardOpen, setCrewCarry } from '../../ui/npc-card.js';

const DRAW_FAR = 70;
const ANIM_NEAR = 30;
const SHADOW_NEAR = 25;
const TALK_REACH = 2.6;
const TALK_LEAVE = 4;
const HANDSET_MAX = 4;
/** Texture pixels sent to the GPU a frame while bodies warm (at least one texture a frame). */
const UPLOAD_PX = 2.2e6;
/** Textures already on the GPU: a model's clones share them. */
const uploaded = new WeakSet();
let warmCamera = null;

let blobTexture = null;
function blob() {
  if (blobTexture) return blobTexture;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(0,0,0,0.5)');
  grad.addColorStop(0.6, 'rgba(0,0,0,0.22)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  blobTexture = new THREE.CanvasTexture(c);
  return blobTexture;
}

/** Tallow's item on the ground: a scrap of canvas tarp, one edge burnt black. */
function buildTarpScrap() {
  const geo = new THREE.PlaneGeometry(0.72, 0.5, 18, 12);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const canvas = new THREE.Color(0x8a7c5e), char = new THREE.Color(0x14110e), singe = new THREE.Color(0x4a3a26);
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    // Folds and wrinkles, lying on the crust.
    pos.setY(i, 0.012 + 0.018 * Math.sin(x * 11 + z * 4) * Math.cos(z * 13) + 0.02 * Math.max(0, Math.sin(x * 5 - 0.6)));
    // The burnt edge runs along +x, ragged.
    const burn = THREE.MathUtils.smoothstep(x + 0.04 * Math.sin(z * 40), 0.12, 0.34);
    c.copy(canvas).lerp(singe, Math.min(1, burn * 1.6)).lerp(char, Math.max(0, burn * 1.4 - 0.4));
    colors.set([c.r, c.g, c.b], i * 3);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.93, metalness: 0, side: THREE.DoubleSide });
  return new THREE.Mesh(geo, mat);
}

/** A soft thing lying crumpled: cloth, a glove, a page. Folds come from a few sines; `w`/`d` its size. */
function buildCrumple(w, d, color, { rough = 0.9, folds = 1 } = {}) {
  const geo = new THREE.PlaneGeometry(w, d, 14, 10);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    pos.setY(i, 0.008 + folds * (0.014 * Math.sin(x * 17 + z * 5) * Math.cos(z * 19) + 0.012 * Math.max(0, Math.sin(x * 9 - 0.4))));
  }
  geo.computeVertexNormals();
  return new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0, side: THREE.DoubleSide }));
}

/**
 * A side task's item, by `item.kind`: tarp (Tallow's scrap), cloth, glove, paper, glass (a dark shard),
 * metal (a small stamped plate: a tag, a badge, a clamp jaw) or bolt (a short steel cylinder: a bolt, a seal,
 * a filter, a flare casing). Every item lies flat on the ground and casts its own small shadow.
 */
function buildItem(kind) {
  let mesh;
  if (kind === 'cloth') mesh = buildCrumple(0.34, 0.22, 0x2b2c30, { folds: 1.4 });
  else if (kind === 'glove') mesh = buildCrumple(0.26, 0.13, 0x6b5a2e, { rough: 0.7, folds: 0.8 });
  else if (kind === 'paper') mesh = buildCrumple(0.24, 0.3, 0xcfc6ad, { rough: 0.95, folds: 1.2 });
  else if (kind === 'glass') {
    const geo = new THREE.CylinderGeometry(0.11, 0.13, 0.02, 5, 1);
    geo.translate(0, 0.012, 0);
    mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0x1b1d28, roughness: 0.08, metalness: 0.1, transparent: true, opacity: 0.85 }));
  } else if (kind === 'metal') {
    const geo = new THREE.BoxGeometry(0.16, 0.012, 0.09);
    geo.translate(0, 0.008, 0);
    mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0x9a8a62, roughness: 0.38, metalness: 0.85 }));
  } else if (kind === 'bolt') {
    const geo = new THREE.CylinderGeometry(0.035, 0.035, 0.18, 10, 1);
    geo.rotateZ(Math.PI / 2);
    geo.translate(0, 0.035, 0);
    mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0x5a5b5e, roughness: 0.45, metalness: 0.9 }));
  } else mesh = buildTarpScrap();
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.name = `npc-item:${kind || 'tarp'}`;
  return mesh;
}

export class Crew {
  /**
   * @param {object} world   the world (colliders, getTerrainHeight, benchAnchor, data, scene, cover?)
   * @param {object} spec    { worldId, crew, posts (with `face`), tasks, walk (WalkGrid options), renderer }
   */
  constructor(world, { worldId, crew, posts, tasks, walk = {}, renderer = null }) {
    this.world = world;
    this.worldId = worldId;
    this.tasks = tasks || {};
    this.lite = isTouchPrimary();
    this.renderer = renderer;
    this.uploads = [];             // textures waiting to go to the GPU
    this.shadows = Boolean(renderer?.shadowMap?.enabled);
    this.group = new THREE.Group();
    this.group.name = 'crew';
    this.group.userData.noMerge = true;
    world.scene.add(this.group);
    // The walk grid fills a few milliseconds a frame (`update`); the crew step out once it is done.
    this.grid = new WalkGrid(world, bayRects(world, bayBoxes), { ...walk, defer: true });
    this.sim = null;
    this.simArgs = { crew, posts };
    this.bodies = new Map();       // member id -> { fig, meshes, blob, shadowOn, animAcc }
    this.discs = crew.map(() => ({ x: 1e6, z: 1e6, radius: CREW_RADIUS }));
    this.turns = new Map();
    this.talking = null;
    this.active = false;
    this.hidden = false;
    this._blobGeo = new THREE.PlaneGeometry(0.9, 0.9).rotateX(-Math.PI / 2);
    this._blobMat = new THREE.MeshBasicMaterial({ map: blob(), transparent: true, depthWrite: false, toneMapped: false });
    this.items = new Map();        // task id -> mesh
    for (const task of Object.values(this.tasks)) {
      if (task.worldId !== worldId) continue;
      const mesh = buildItem(task.item.kind);
      const [x, z] = task.item.pos;
      mesh.position.set(x, world.getTerrainHeight(x, z), z);
      mesh.rotation.y = 0.7;
      mesh.visible = false;
      this.group.add(mesh);
      this.items.set(task.id, mesh);
    }
    preloadCrew(crew.map(c => c.model), { lite: this.lite });
    this.load(crew);
  }

  async load(crew) {
    for (const def of crew) {
      try {
        const fig = await makeFigure(def.model, { lite: this.lite });
        if (this.disposed) { fig.dispose(); return; }
        const meshes = [];
        fig.root.traverse(o => { if (o.isMesh) meshes.push(o); });
        const shade = new THREE.Mesh(this._blobGeo, this._blobMat);
        shade.position.y = 0.02;
        shade.renderOrder = 1;
        fig.root.add(shade);
        fig.root.visible = false;
        this.group.add(fig.root);
        this.world.cover?.applyTo?.(fig.root);
        fig.play('idle', 0);
        const body = { fig, meshes, blob: shade, shadowOn: true, animAcc: 0, ready: false, textures: [], compiled: !this.renderer };
        this.queueTextures(body);
        if (this.renderer?.compileAsync) {
          warmCamera ||= new THREE.PerspectiveCamera();
          this.renderer.compileAsync(fig.root, warmCamera, this.world.scene)
            .catch(() => {})
            .then(() => { body.compiled = true; });
        } else {
          body.compiled = true;
        }
        this.bodies.set(def.id, body);
      } catch (err) {
        console.error(`Crew body ${def.model} failed to load:`, err);
      }
    }
  }

  /** Put a body's textures that are not on the GPU yet in the upload queue. */
  queueTextures(body) {
    if (!this.renderer?.initTexture) return;
    const seen = new Set();
    for (const mesh of body.meshes) {
      for (const m of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
        for (const key in m) {
          const t = m[key];
          if (!t || !t.isTexture || seen.has(t) || uploaded.has(t)) continue;
          seen.add(t);
          body.textures.push(t);
          if (!this.uploads.includes(t)) this.uploads.push(t);
        }
      }
    }
  }

  /**
   * Work that must be done before anyone is shown, a slice a frame: the walk grid, then texture uploads.
   * Safe to call every frame; `update` calls it, and the stage calls it on the voyage's destination.
   */
  warm() {
    if (this.disposed) return;
    if (!this.sim) {
      if (!this.grid.fill(3)) return;
      this.sim = new CrewSim(this.grid, this.simArgs.crew, this.simArgs.posts, { seed: Math.floor(Math.random() * 1e6) });
    }
    let px = 0;
    while (this.uploads.length && (px === 0 || px < UPLOAD_PX)) {
      const t = this.uploads.shift();
      if (uploaded.has(t)) continue;
      const img = t.image;
      if (!img || !(img.width > 0)) continue;   // not decoded: it uploads when first drawn
      this.renderer.initTexture(t);
      uploaded.add(t);
      px += img.width * img.height;
    }
    for (const body of this.bodies.values()) {
      if (body.ready || !body.compiled) continue;
      body.ready = body.textures.every(t => uploaded.has(t) || !(t.image?.width > 0));
    }
  }

  taskState(taskId) {
    return session.getFlag(TASK_FLAG(taskId)) || null;
  }

  /** The player arrived on this world (true) or left it (false). */
  setActive(on) {
    this.active = Boolean(on);
    if (!this.active) {
      if (this.talking) closeLineCard();
      setCrewCarry(null);
    } else {
      this.syncCarry();
    }
  }

  /** Off while a boss is fought here: nobody stands on the arena, nothing to talk to. */
  setHidden(hidden) {
    this.hidden = Boolean(hidden);
    this.group.visible = !this.hidden;
    if (this.hidden && this.talking) closeLineCard();
    if (this.hidden) for (const d of this.discs) { d.x = 1e6; d.z = 1e6; }
  }

  syncCarry() {
    let label = null;
    for (const t of Object.values(this.tasks)) {
      if (t.worldId === this.worldId && this.taskState(t.id) === 'carrying') label = t.item.label;
    }
    setCrewCarry(label);
  }

  update(delta, cameraPos) {
    if (this.hidden || !cameraPos) return;
    this.warm();
    if (!this.sim) return;
    const dt = Math.min(delta, 0.1);
    const player = { x: cameraPos.x, z: cameraPos.z };
    this.sim.update(dt, this.active ? player : null);

    // Who is drawn: within reach, and on a handset only the nearest few.
    const order = this.sim.members
      .map((m, i) => ({ m, i, d: Math.hypot(m.x - player.x, m.z - player.z) }))
      .sort((a, b) => a.d - b.d);
    order.forEach(({ m, i, d }, rank) => {
      const disc = this.discs[i];
      disc.x = m.x;
      disc.z = m.z;
      const body = this.bodies.get(m.id);
      if (!body) return;
      const { fig } = body;
      const show = body.ready && d < DRAW_FAR && (!this.lite || rank < HANDSET_MAX);
      fig.root.visible = show;
      if (!show) return;
      fig.root.position.set(m.x, this.world.getTerrainHeight(m.x, m.z), m.z);
      fig.root.rotation.y = m.yaw;
      this.pose(body, m);
      const cast = this.shadows && d < SHADOW_NEAR;
      if (cast !== body.shadowOn) {
        for (const mesh of body.meshes) mesh.castShadow = cast;
        body.shadowOn = cast;
      }
      body.blob.visible = !cast;
      body.animAcc += dt;
      const step = d < ANIM_NEAR ? 0 : 0.1;
      if (body.animAcc >= step) {
        fig.mixer.update(body.animAcc);
        body.animAcc = 0;
      }
    });

    // Items lie where they are while their task waits on them.
    for (const [id, mesh] of this.items) mesh.visible = this.taskState(id) === 'asked';

    // Walking off ends a talk.
    if (this.talking) {
      const m = this.sim.member(this.talking);
      if (!isLineCardOpen() || (m && Math.hypot(m.x - player.x, m.z - player.z) > TALK_LEAVE)) closeLineCard();
    }
  }

  pose(body, m) {
    const { fig } = body;
    if (m.talking) { fig.play('talk'); return; }
    if (m.state === 'walk' && m.speed > 0.6) {
      const a = fig.play('walk');
      if (a) a.setEffectiveTimeScale(THREE.MathUtils.clamp(m.speed / (fig.speedOf('walk') || 1), 0.6, 1.4));
      return;
    }
    if (m.state === 'walk' && m.speed > 0.1) {
      const a = fig.play('walkSlow');
      if (a) a.setEffectiveTimeScale(THREE.MathUtils.clamp(m.speed / (fig.speedOf('walkSlow') || 1), 0.5, 1.3));
      return;
    }
    fig.play(m.state === 'act' ? m.act : 'idle');
  }

  /** [E] targets: each person within talking reach, and a task item lying in the world. */
  aimTargets(eye) {
    if (!this.active || this.hidden || !this.sim) return [];
    const out = [];
    for (const m of this.sim.members) {
      const body = this.bodies.get(m.id);
      if (!body?.fig.root.visible) continue;
      if (Math.hypot(m.x - eye.x, m.z - eye.z) > TALK_REACH + 1) continue;
      const y = body.fig.root.position.y;
      out.push({
        kind: 'npc', member: m, reach: TALK_REACH,
        boxes: [aimBox([m.x, y + 0.92, m.z], [0.32, 0.92, 0.28], m.yaw)]
      });
    }
    for (const [id, mesh] of this.items) {
      if (!mesh.visible) continue;
      out.push({
        kind: 'npc-item', taskId: id, reach: 2.6,
        boxes: [aimBox([mesh.position.x, mesh.position.y + 0.15, mesh.position.z], [0.45, 0.25, 0.45])]
      });
    }
    return out;
  }

  /** What [E] says and does for a hit from `aimTargets`. */
  interaction(hit) {
    if (hit.kind === 'npc') {
      const def = hit.member.def;
      return { prompt: `[E] TALK TO ${def.name.toUpperCase()}`, act: () => this.talk(hit.member.id) };
    }
    if (hit.kind === 'npc-item') {
      const task = this.tasks[hit.taskId];
      return {
        prompt: `[E] TAKE ${task.item.label.toUpperCase()}`,
        act: () => {
          session.setFlag(TASK_FLAG(task.id), 'carrying');
          this.syncCarry();
        }
      };
    }
    return null;
  }

  talk(memberId) {
    const m = this.sim?.member(memberId);
    if (!m) return;
    const def = m.def;
    const saga = session.getSaga ? session.getSaga() : { clues: [] };
    const cleared = new Set();
    for (const c of this.sim.members) for (const [id, sets] of Object.entries(c.def.talk?.afterBench || {})) {
      if (sets && session.getLearnQuest?.(this.worldId, id)?.completedAt) cleared.add(id);
    }
    const turn = this.turns.get(memberId) || 0;
    const res = talkFor(def, {
      cleared, clues: new Set(saga.clues || []), turn,
      tasks: this.tasks, taskState: def.task ? this.taskState(def.task) : null
    });
    if (!res.lines?.length) return;
    if (res.task) {
      session.setFlag(TASK_FLAG(res.task.id), res.task.next);
      if (res.task.next === 'done') session.recordNotebook?.(`crew:${res.task.id}`);
      this.syncCarry();
    } else {
      this.turns.set(memberId, turn + 1);
    }
    this.sim.startTalk(memberId);
    this.talking = memberId;
    openLineCard({
      name: def.name, role: def.role, lines: res.lines,
      onClose: () => {
        this.sim.endTalk(memberId);
        if (this.talking === memberId) this.talking = null;
      }
    });
  }

  dispose() {
    this.disposed = true;
    if (this.talking) closeLineCard();
    setCrewCarry(null);
    for (const b of this.bodies.values()) b.fig.dispose();
    this.bodies.clear();
    for (const mesh of this.items.values()) { mesh.geometry.dispose(); mesh.material.dispose(); }
    this._blobGeo.dispose();
    this._blobMat.dispose();
    this.group.removeFromParent();
  }
}
