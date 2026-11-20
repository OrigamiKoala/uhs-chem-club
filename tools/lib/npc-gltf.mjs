/**
 * npc-gltf.mjs — load a crew .glb in plain Node (no DOM, no images) for the checks.
 * Textures are stripped from the JSON before parsing; geometry, skins, nodes and animations are kept.
 */
import { readFileSync } from 'node:fs';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

function stripImages(buf) {
  let off = 12;
  const chunks = [];
  while (off < buf.length) {
    const len = buf.readUInt32LE(off), type = buf.readUInt32LE(off + 4);
    chunks.push({ type, body: buf.subarray(off + 8, off + 8 + len) });
    off += 8 + len;
  }
  const json = JSON.parse(chunks[0].body.toString('utf8'));
  for (const m of json.materials || []) {
    const p = m.pbrMetallicRoughness || {};
    delete p.baseColorTexture; delete p.metallicRoughnessTexture;
    delete m.normalTexture; delete m.occlusionTexture; delete m.emissiveTexture;
  }
  delete json.textures; delete json.images; delete json.samplers;
  json.extensionsUsed = (json.extensionsUsed || []).filter(e => e !== 'EXT_texture_webp');
  json.extensionsRequired = (json.extensionsRequired || []).filter(e => e !== 'EXT_texture_webp');
  return { json, bin: chunks.find(c => c.type === 0x004e4942)?.body };
}

export async function loadNpcGlb(path) {
  const { json, bin } = stripImages(readFileSync(path));
  // Re-pack as a GLB so the parser reads the binary chunk itself (no fetch of a buffer URI in Node).
  let j = Buffer.from(JSON.stringify(json), 'utf8');
  if (j.length % 4) j = Buffer.concat([j, Buffer.alloc(4 - (j.length % 4), 0x20)]);
  const head = Buffer.alloc(12), jh = Buffer.alloc(8), bh = Buffer.alloc(8);
  head.writeUInt32LE(0x46546c67, 0); head.writeUInt32LE(2, 4); head.writeUInt32LE(12 + 8 + j.length + 8 + bin.length, 8);
  jh.writeUInt32LE(j.length, 0); jh.writeUInt32LE(0x4e4f534a, 4);
  bh.writeUInt32LE(bin.length, 0); bh.writeUInt32LE(0x004e4942, 4);
  const glb = Buffer.concat([head, jh, j, bh, bin]);
  const ab = glb.buffer.slice(glb.byteOffset, glb.byteOffset + glb.length);
  return new Promise((resolve, reject) => new GLTFLoader().parse(ab, '', resolve, reject));
}

export { THREE };
