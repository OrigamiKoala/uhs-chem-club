#!/usr/bin/env node
/**
 * build-models.mjs — turn the Rocketbox sources into the crew's glTF files.
 *
 *   node tools/npc/build-models.mjs --src <Microsoft-Rocketbox checkout or download> [--blender <path>] [--missing]
 *
 * The sources are NOT in the repo (about 600 MB of FBX and TGA). The files used are listed in
 * `src/npc/models.js` (bodies under Assets/Avatars/Professions/<source>, clips under Assets/Animations)
 * and come from https://github.com/microsoft/Microsoft-Rocketbox (MIT). Keep a copy outside the repo,
 * or under `assets-src/` (git-ignored).
 *
 * Needs Blender (4.4+; built with 5.0) and Python 3 with Pillow. Writes into public/models/npc/:
 * one desktop and one handset .glb per body, clips-m.glb and clips-f.glb, manifest.json, and the
 * Rocketbox licence notice.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, writeFileSync, readFileSync, copyFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { NPC_MODELS, NPC_CLIPS } from '../../src/npc/models.js';
import { slimClips } from './slim-clips.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const arg = name => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : null;
};
const src = arg('src');
const blender = arg('blender') || '/Applications/Blender.app/Contents/MacOS/Blender';
if (!src || !existsSync(join(src, 'Assets'))) {
  console.error('usage: node tools/npc/build-models.mjs --src <Rocketbox root (holds Assets/ and LICENSE.md)>');
  process.exit(2);
}
// --missing builds only what public/models/npc lacks (new bodies, or clip files), keeping the rest and their manifest entries.
const missingOnly = process.argv.includes('--missing');
const out = join(root, 'public/models/npc');
mkdirSync(out, { recursive: true });
const work = mkdtempSync(join(tmpdir(), 'npc-build-'));
const script = join(root, 'tools/npc/build_glb.py');

const run = (cmd, args) => execFileSync(cmd, args, { encoding: 'utf8', maxBuffer: 64 << 20 });
const blend = args => run(blender, ['-b', '--factory-startup', '--python', script, '--', ...args]);
const kb = f => `${Math.round(statSync(f).size / 1024)} KB`;

const manifestFile = join(out, 'manifest.json');
const manifest = missingOnly && existsSync(manifestFile)
  ? JSON.parse(readFileSync(manifestFile, 'utf8'))
  : { source: 'Microsoft Rocketbox (MIT)', models: {}, clips: {} };

for (const m of NPC_MODELS) {
  if (missingOnly && existsSync(join(out, `${m.id}.glb`)) && existsSync(join(out, `${m.id}.lite.glb`))) continue;
  const base = join(src, 'Assets/Avatars', m.group || 'Professions', m.source);
  const prep = join(work, m.id);
  console.log(run('python3', [join(root, 'tools/npc/prep_textures.py'), join(base, 'Textures'), prep, m.prefix]).trim());
  const full = join(out, `${m.id}.glb`);
  const lite = join(out, `${m.id}.lite.glb`);
  const log = blend(['avatar', join(base, 'Export', `${m.source}.fbx`), prep, m.prefix, full, lite]);
  const tris = [...log.matchAll(/^MESH \S+ tris=(\d+) lite=(\w+)/gm)];
  if (!existsSync(full) || !existsSync(lite)) { console.error(log); process.exit(1); }
  manifest.models[m.id] = {
    skeleton: m.skeleton,
    tris: tris.filter(t => t[2] === 'False').reduce((s, t) => s + Number(t[1]), 0),
    liteTris: tris.filter(t => t[2] === 'True').reduce((s, t) => s + Number(t[1]), 0)
  };
  console.log(`${m.id}: ${kb(full)} / lite ${kb(lite)}`);
  writeFileSync(manifestFile, JSON.stringify(manifest, null, 2) + '\n');
}

for (const [skeleton, clips] of Object.entries(NPC_CLIPS)) {
  const file = join(out, `clips-${skeleton}.glb`);
  if (missingOnly && existsSync(file) && manifest.clips[skeleton]) continue;
  const raw = join(work, `clips-${skeleton}.raw.glb`);
  const pairs = Object.entries(clips).map(([name, rel]) => `${name}=${join(src, 'Assets/Animations', `${rel}.max.fbx`)}`);
  const log = blend(['clips', raw, ...pairs]);
  if (!existsSync(raw)) { console.error(log); process.exit(1); }
  const slim = slimClips(raw, file, 'Bip01');
  console.log(`clips-${skeleton}: ${kb(raw)} -> ${kb(file)} (${slim.kept} channels kept, ${slim.dropped} dropped)`);
  const entry = {};
  for (const [, name, s] of log.matchAll(/^CLIP (\S+) ([\d.]+)/gm)) entry[name] = { seconds: Number(s) };
  for (const [, name, v] of log.matchAll(/^SPEED (\S+) ([\d.]+)/gm)) entry[name].speed = Number(v);
  manifest.clips[skeleton] = entry;
  console.log(entry);
}

writeFileSync(manifestFile, JSON.stringify(manifest, null, 2) + '\n');
copyFileSync(join(src, 'LICENSE.md'), join(out, 'LICENSE-rocketbox.txt'));
console.log(`wrote ${out}`);
