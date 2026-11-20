/**
 * figures.js — the crew's bodies: loading, cloning and animating the Rocketbox models (`src/npc/models.js`).
 *
 * A body file is loaded once and cloned per member (`SkeletonUtils.clone`: each clone gets its own
 * skeleton and shares geometry, materials and textures). Clips are loaded once per skeleton and shared by
 * every body of it. Only ROTATION tracks drive bones (the files carry nothing else, `tools/npc/slim-clips.mjs`),
 * plus the root's position for the walk's bob, so a body keeps its own limb lengths.
 *
 * Handsets load the `.lite.glb` bodies (half the triangles, 512 textures).
 *
 * Materials come in as glTF PBR. Alpha-blended parts (hair cards, lashes, a visor's mesh) are switched to
 * alpha-tested so they sort with the opaque world and cast clean shadows.
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { NPC_MODEL_DIR, npcModel } from '../../npc/models.js';

const loader = new GLTFLoader();
const files = new Map();      // url -> Promise<gltf>
let manifest = null;

function load(url) {
  if (!files.has(url)) files.set(url, loader.loadAsync(url));
  return files.get(url);
}

export async function npcManifest() {
  if (!manifest) manifest = fetch(`${NPC_MODEL_DIR}/manifest.json`).then(r => r.json());
  return manifest;
}

function prepareMaterials(root) {
  root.traverse(o => {
    if (!o.isMesh) return;
    o.castShadow = true;
    o.receiveShadow = true;
    for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
      if (m.userData.npcReady) continue;
      m.userData.npcReady = true;
      if (m.transparent || m.alphaTest > 0) {
        m.transparent = false;
        m.alphaTest = 0.5;
        m.depthWrite = true;
        m.side = THREE.DoubleSide;
      }
      m.envMapIntensity = 0.8;
    }
    // A skinned body's bound is its bind pose; give the arms and the stride room.
    if (o.geometry) {
      if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere();
      if (!o.geometry.userData.npcGrown) {
        o.geometry.boundingSphere.radius += 0.6;
        o.geometry.userData.npcGrown = true;
      }
    }
  });
}

/** The clips of one skeleton, by name, with any track that would bind to nothing on `bones` dropped. */
async function clipsFor(skeleton) {
  const gltf = await load(`${NPC_MODEL_DIR}/clips-${skeleton}.glb`);
  return gltf.animations;
}

/**
 * A new body for a crew member. Resolves to `{ root, mixer, play(name, fade), clip(name), dispose() }`.
 * `root` is a Group at the feet; turn it about y and place it on the floor.
 */
export async function makeFigure(modelId, { lite = false } = {}) {
  const def = npcModel(modelId);
  if (!def) throw new Error(`unknown crew model ${modelId}`);
  const [body, clips, man] = await Promise.all([
    load(`${NPC_MODEL_DIR}/${def.id}${lite ? '.lite' : ''}.glb`),
    clipsFor(def.skeleton),
    npcManifest()
  ]);
  const model = SkeletonUtils.clone(body.scene);
  prepareMaterials(model);
  const root = new THREE.Group();
  root.name = `npc:${modelId}`;
  root.add(model);

  const names = new Set();
  model.traverse(o => names.add(o.name));
  const byName = new Map();
  for (const c of clips) {
    const tracks = c.tracks.filter(t => names.has(t.name.split('.')[0]));
    byName.set(c.name, new THREE.AnimationClip(c.name, c.duration, tracks));
  }
  const info = man?.clips?.[def.skeleton] || {};

  const mixer = new THREE.AnimationMixer(model);
  const actions = new Map();
  const action = name => {
    if (!actions.has(name)) {
      const clip = byName.get(name);
      if (!clip) return null;
      const a = mixer.clipAction(clip);
      a.setLoop(THREE.LoopRepeat, Infinity);
      actions.set(name, a);
    }
    return actions.get(name);
  };
  let current = null;

  return {
    root,
    model,
    mixer,
    /** The ground speed (m/s) a walk clip was captured at, or 0. */
    speedOf: name => info[name]?.speed || 0,
    get playing() { return current; },
    /** Cross-fade to clip `name`. Starts each standing clip at a random point so two people never move in step. */
    play(name, fade = 0.35) {
      if (current === name) return action(name);
      const next = action(name);
      if (!next) return null;
      const prev = current ? action(current) : null;
      next.reset();
      next.enabled = true;
      next.setEffectiveWeight(1);
      next.setEffectiveTimeScale(1);
      if (!name.startsWith('walk')) next.time = Math.random() * next.getClip().duration;
      next.play();
      if (prev) prev.crossFadeTo(next, fade, false);
      current = name;
      return next;
    },
    action,
    dispose() {
      mixer.stopAllAction();
      mixer.uncacheRoot(model);
      root.removeFromParent();
    }
  };
}

/** Start fetching what a crew will need, so the bodies arrive soon after the world opens. */
export function preloadCrew(modelIds, { lite = false } = {}) {
  const skeletons = new Set();
  for (const id of modelIds) {
    const def = npcModel(id);
    if (!def) continue;
    skeletons.add(def.skeleton);
    load(`${NPC_MODEL_DIR}/${def.id}${lite ? '.lite' : ''}.glb`).catch(() => {});
  }
  for (const s of skeletons) load(`${NPC_MODEL_DIR}/clips-${s}.glb`).catch(() => {});
  npcManifest().catch(() => {});
}
