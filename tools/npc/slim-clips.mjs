/**
 * slim-clips.mjs — shrink a clip file Blender exported (called by build-models.mjs).
 *
 * Blender samples translation, rotation and scale for every bone of every clip. The crew plays clips
 * on bodies whose bones differ in length from the captured skeleton, so the runtime only ever applies
 * ROTATIONS to bones (a translation track would stretch a limb to the capture actor's length); the root
 * node keeps its translation (the walk's bob and the pelvis height). Everything else is dropped here,
 * and rotations are stored as normalized 16-bit integers (allowed by glTF 2.0 for rotation outputs),
 * which three's GLTFLoader reads back to floats.
 *
 *   slimClips(inputGlbPath, outputGlbPath, rootName)
 */
import { readFileSync, writeFileSync } from 'node:fs';

const FLOAT = 5126, SHORT = 5122;
const NCOMP = { SCALAR: 1, VEC3: 3, VEC4: 4 };

function readGlb(path) {
  const buf = readFileSync(path);
  if (buf.readUInt32LE(0) !== 0x46546c67) throw new Error(`${path}: not a GLB`);
  let off = 12, json = null, bin = null;
  while (off < buf.length) {
    const len = buf.readUInt32LE(off), type = buf.readUInt32LE(off + 4);
    const body = buf.subarray(off + 8, off + 8 + len);
    if (type === 0x4e4f534a) json = JSON.parse(body.toString('utf8'));
    else if (type === 0x004e4942) bin = body;
    off += 8 + len;
  }
  return { json, bin };
}

function writeGlb(path, json, bin) {
  const pad = (b, fill) => {
    const n = (4 - (b.length % 4)) % 4;
    return n ? Buffer.concat([b, Buffer.alloc(n, fill)]) : b;
  };
  const j = pad(Buffer.from(JSON.stringify(json), 'utf8'), 0x20);
  const b = pad(bin, 0);
  const head = Buffer.alloc(12);
  head.writeUInt32LE(0x46546c67, 0);
  head.writeUInt32LE(2, 4);
  head.writeUInt32LE(12 + 8 + j.length + 8 + b.length, 8);
  const ch = (len, type) => { const h = Buffer.alloc(8); h.writeUInt32LE(len, 0); h.writeUInt32LE(type, 4); return h; };
  writeFileSync(path, Buffer.concat([head, ch(j.length, 0x4e4f534a), j, ch(b.length, 0x004e4942), b]));
}

function floatsOf(json, bin, index) {
  const acc = json.accessors[index];
  const view = json.bufferViews[acc.bufferView];
  if (acc.componentType !== FLOAT) throw new Error('expected float accessor');
  const n = acc.count * NCOMP[acc.type];
  const start = (view.byteOffset || 0) + (acc.byteOffset || 0);
  const stride = view.byteStride || 0;
  if (stride && stride !== NCOMP[acc.type] * 4) throw new Error('interleaved accessor');
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = bin.readFloatLE(start + i * 4);
  return out;
}

export function slimClips(input, output, rootName) {
  const { json, bin } = readGlb(input);
  const chunks = [];
  let size = 0;
  const views = [];
  const accessors = [];
  const push = (bytes, accessor) => {
    const pad = (4 - (size % 4)) % 4;
    if (pad) { chunks.push(Buffer.alloc(pad)); size += pad; }
    views.push({ buffer: 0, byteOffset: size, byteLength: bytes.length });
    chunks.push(bytes);
    size += bytes.length;
    accessors.push({ ...accessor, bufferView: views.length - 1 });
    return accessors.length - 1;
  };
  const timeCache = new Map();
  const timeAccessor = old => {
    if (timeCache.has(old)) return timeCache.get(old);
    const a = json.accessors[old];
    const f = floatsOf(json, bin, old);
    const b = Buffer.alloc(f.length * 4);
    f.forEach((v, i) => b.writeFloatLE(v, i * 4));
    const idx = push(b, { componentType: FLOAT, count: a.count, type: 'SCALAR', min: a.min, max: a.max });
    timeCache.set(old, idx);
    return idx;
  };

  const rootNode = json.nodes.findIndex(n => n.name === rootName);
  let kept = 0, dropped = 0;
  for (const anim of json.animations || []) {
    const samplers = [];
    const channels = [];
    for (const ch of anim.channels) {
      const s = anim.samplers[ch.sampler];
      const path = ch.target.path;
      const isRoot = ch.target.node === rootNode;
      // Biped's "Nub" end-markers are not exported with the bodies; their tracks would bind to nothing.
      const nub = /Nub$/.test(json.nodes[ch.target.node]?.name || '');
      if (nub || !(path === 'rotation' || (path === 'translation' && isRoot))) { dropped++; continue; }
      const out = json.accessors[s.output];
      const f = floatsOf(json, bin, s.output);
      let outIdx;
      if (path === 'rotation') {
        const b = Buffer.alloc(f.length * 2);
        f.forEach((v, i) => b.writeInt16LE(Math.round(Math.max(-1, Math.min(1, v)) * 32767), i * 2));
        outIdx = push(b, { componentType: SHORT, normalized: true, count: out.count, type: 'VEC4' });
      } else {
        const b = Buffer.alloc(f.length * 4);
        f.forEach((v, i) => b.writeFloatLE(v, i * 4));
        outIdx = push(b, { componentType: FLOAT, count: out.count, type: out.type });
      }
      samplers.push({ input: timeAccessor(s.input), output: outIdx, interpolation: s.interpolation || 'LINEAR' });
      channels.push({ sampler: samplers.length - 1, target: ch.target });
      kept++;
    }
    anim.samplers = samplers;
    anim.channels = channels;
  }
  const newBin = Buffer.concat(chunks);
  json.accessors = accessors;
  json.bufferViews = views;
  json.buffers = [{ byteLength: newBin.length }];
  delete json.images; delete json.textures; delete json.samplers; delete json.materials; delete json.meshes; delete json.skins;
  for (const n of json.nodes) { delete n.mesh; delete n.skin; }
  writeGlb(output, json, newBin);
  return { kept, dropped, bytes: newBin.length };
}
