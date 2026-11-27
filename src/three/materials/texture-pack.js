/**
 * texture-pack.js — photo-scanned (CC0) PBR maps for a world's near surfaces. Opt-in: a world that never calls
 * this module is unchanged.
 *
 * A PACK is three files in `public/textures/<world>/`: `<name>_diff.jpg` (albedo, sRGB), `<name>_nor.jpg`
 * (OpenGL-convention normal) and `<name>_arm.jpg` (R ambient occlusion, G roughness, B metalness, which is the
 * channel order three.js reads `aoMap`, `roughnessMap` and `metalnessMap` from, so one file serves all three).
 * A pack may leave out `arm` (a detail layer only needs colour and normal).
 *
 * HOW IT JOINS A WORLD. The world is built first with its procedural maps, exactly as before. The packs are then
 * fetched, and each arriving map is put into the slot the procedural map held (`map`, `normalMap`,
 * `roughnessMap`, `aoMap`, `metalnessMap` where the material has one). The set of slots does not change, so the
 * compiled program does not change, and each texture is sent to the GPU (`renderer.initTexture`) the moment it is
 * decoded, while the ship is still in flight. If a file is slow or missing the procedural map simply stays: the
 * procedural set is the fallback and the lower-tier look.
 *
 * Nothing is fetched without a renderer (the Node checks build every world with none), without a DOM, or below
 * the tier the caller asks for.
 */

import * as THREE from 'three';

const PACKS = new Map();   // url prefix -> Promise<{ diff, nor, arm }>

/** True when this page can and should fetch packs for a world built with `renderer`. */
export function packsAvailable(renderer) {
  return Boolean(renderer) && typeof window !== 'undefined' && typeof document !== 'undefined' &&
    typeof Image !== 'undefined';
}

function loadOne(url, srgb) {
  return new Promise(resolve => {
    new THREE.TextureLoader().load(url, tex => {
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
      tex.anisotropy = 8;
      resolve(tex);
    }, undefined, () => resolve(null));
  });
}

/**
 * Fetch a pack once per page. Resolves to `{ diff, nor, arm }`; any map that failed is null.
 * @param {string} base folder under the site root, e.g. '/textures/tallow'
 * @param {string} name the pack's file prefix
 * @param {{ arm?: boolean }} opts
 */
export function loadTexturePack(base, name, { arm = true } = {}) {
  const key = `${base}/${name}`;
  if (!PACKS.has(key)) {
    PACKS.set(key, Promise.all([
      loadOne(`${key}_diff.jpg`, true),
      loadOne(`${key}_nor.jpg`, false),
      arm ? loadOne(`${key}_arm.jpg`, false) : Promise.resolve(null)
    ]).then(([diff, nor, armTex]) => ({ diff, nor, arm: armTex })));
  }
  return PACKS.get(key);
}

/** A copy of `tex` that lies on `old`'s uv channel at `old`'s repeat times `scale`. Shares the image. */
function inSlot(tex, old, scale) {
  const t = tex.clone();
  t.channel = old.channel;
  t.repeat.set(old.repeat.x * scale[0], old.repeat.y * scale[1]);
  t.offset.copy(old.offset);
  t.anisotropy = Math.max(old.anisotropy || 1, 8);
  t.needsUpdate = true;
  return t;
}

/**
 * Put a loaded pack's maps into the slots a material already has.
 *
 * `scale` converts the material's tile to the photo's: new repeat = old repeat × scale, so pass
 * (metres the procedural tile covered) / (metres the photo covers). Returns the textures it made, for the
 * caller to own and dispose.
 *
 * @param {THREE.MeshStandardMaterial} mat
 * @param {{diff, nor, arm}} pack
 * @param {{ scale?: number|[number, number], normalScale?: number, renderer?: THREE.WebGLRenderer,
 *           albedo?: boolean, aoIntensity?: number }} opts
 *   albedo false keeps the material's own colour map (a pack used for its relief only).
 */
export function dressFromPack(mat, pack, { scale = 1, normalScale = null, renderer = null, albedo = true, aoIntensity = null } = {}) {
  if (!mat || !pack) return [];
  const s = Array.isArray(scale) ? scale : [scale, scale];
  const made = [];
  const put = (slot, tex) => {
    const old = mat[slot];
    if (!tex || !old) return;
    const t = inSlot(tex, old, s);
    mat[slot] = t;
    made.push(t);
  };
  if (albedo) put('map', pack.diff);
  put('normalMap', pack.nor);
  put('roughnessMap', pack.arm);
  put('aoMap', pack.arm);
  put('metalnessMap', pack.arm);
  if (normalScale !== null && mat.normalScale) mat.normalScale.set(normalScale, normalScale);
  if (aoIntensity !== null) mat.aoMapIntensity = aoIntensity;
  // The same slots, so the program cache finds the program already compiled for this material.
  mat.needsUpdate = true;
  if (renderer?.initTexture) for (const t of made) { try { renderer.initTexture(t); } catch (e) { /* drawn later instead */ } }
  return made;
}

/**
 * Fetch every pack a world names and dress its materials as each arrives.
 *
 * @param {Array<{ name: string, arm?: boolean, mats: Array<[THREE.Material, object]> }>} plan
 *   one entry per pack; `mats` pairs each material with its `dressFromPack` options
 * @param {{ base: string, renderer: THREE.WebGLRenderer, own?: (...t) => void, isLive?: () => boolean }} opts
 *   `isLive` false (the world was disposed while the pack was in flight) skips the dressing
 * @returns {Promise<void>} settles when every pack has landed or failed
 */
export function dressWorld(plan, { base, renderer, own = null, isLive = () => true }) {
  if (!packsAvailable(renderer)) return Promise.resolve();
  return Promise.all(plan.map(entry => loadTexturePack(base, entry.name, { arm: entry.arm !== false }).then(pack => {
    if (!isLive()) return;
    for (const [mat, o] of entry.mats) {
      const made = dressFromPack(mat, pack, { ...o, renderer });
      if (own) own(...made);
    }
  }))).then(() => {});
}
