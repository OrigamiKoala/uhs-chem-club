#!/usr/bin/env node
/**
 * glsl-check.mjs — Do a world's patched materials compile? A reading aid, not a check (it needs `glslangValidator`, which
 * not every machine has, so no `verify:*` script calls it).
 *
 * A world patches its materials' shaders in JavaScript (`onBeforeCompile`: the cover mask in `lib/cover.js`, Ligar's
 * cover, Lodestone's banded rock in `lodestone/rock.js`). No Node check runs a GPU, so a typo in that GLSL is first met
 * by the owner as a black or missing world. This builds the world headlessly, takes every material with a patch, runs the
 * patch over three's standard shaders, resolves the chunks the way three does (includes, light counts, unrolled loops),
 * writes WebGL 2 (`#version 300 es`) vertex and fragment shaders and compiles them with `glslangValidator`.
 *
 * What it cannot see: three's own prefix is approximated (common defines: a map, a normal map, roughness and AO maps,
 * fog, a shadow map, a cube-UV environment, one directional, one hemisphere and three point lights); a define this
 * leaves out is not compiled. A failure here is real; a pass is good evidence, not proof.
 *
 *   node tools/glsl-check.mjs <world> [ClassName]     e.g. node tools/glsl-check.mjs lodestone
 */

import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execSync } from 'node:child_process';
import { installDomShim } from './lib/dom-shim.mjs';
installDomShim({ tier: 'T4' });
const THREE = await import('three');

const CLASSES = {
  tallow: 'TallowWorld', lanternfall: 'LanternfallWorld', ligar: 'LigarWorld', bellows: 'BellowsWorld', ember: 'EmberReachWorld',
  mirrowen: 'MirrowenWorld', kettle: 'KettleWorld', teeter: 'TeeterWorld', verdigris: 'VerdigrisWorld', brinewire: 'BrinewireWorld',
  quicklight: 'QuicklightWorld', lodestone: 'LodestoneWorld', thornmere: 'ThornmereWorld'
};
const name = process.argv[2];
const cls = process.argv[3] || CLASSES[name];
if (!name || !cls) { console.log('usage: node tools/glsl-check.mjs <world> [ClassName]'); process.exit(2); }
try { execSync('glslangValidator --version', { stdio: 'pipe' }); } catch { console.log('glslangValidator is not installed: nothing compiled.'); process.exit(0); }

const mod = await import(`../src/three/${name}.js`);
const world = new mod[cls](null);

const resolve = s => s.replace(/^[ \t]*#include +<([\w\d./]+)>/gm, (m, n) => {
  if (THREE.ShaderChunk[n] === undefined) throw new Error(`no shader chunk ${n}`);
  return resolve(THREE.ShaderChunk[n]);
});
const unroll = s => s.replace(/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g,
  (m, a, b, snip) => { let o = ''; for (let i = +a; i < +b; i++) o += snip.replace(/\[\s*i\s*\]/g, `[ ${i} ]`).replace(/UNROLLED_LOOP_INDEX/g, i); return o; });
const COUNTS = [['NUM_DIR_LIGHT_SHADOWS', 1], ['NUM_DIR_LIGHTS', 1], ['NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS', 0], ['NUM_SPOT_LIGHT_MAPS', 0], ['NUM_SPOT_LIGHT_COORDS', 0],
  ['NUM_SPOT_LIGHT_SHADOWS', 0], ['NUM_SPOT_LIGHTS', 0], ['NUM_RECT_AREA_LIGHTS', 0], ['NUM_POINT_LIGHT_SHADOWS', 0], ['NUM_POINT_LIGHTS', 3], ['NUM_HEMI_LIGHTS', 1],
  ['UNION_CLIPPING_PLANES', 0], ['NUM_CLIPPING_PLANES', 0]];
const lights = s => COUNTS.reduce((t, [k, v]) => t.replace(new RegExp(k, 'g'), v), s);
const DEFINES = ['USE_MAP', 'USE_UV', 'USE_NORMALMAP', 'USE_NORMALMAP_TANGENTSPACE', 'USE_ROUGHNESSMAP', 'USE_AOMAP', 'USE_FOG', 'USE_SHADOWMAP', 'USE_ENVMAP',
  'ENVMAP_TYPE_CUBE_UV', 'ENVMAP_MODE_REFLECTION', 'STANDARD'].map(d => `#define ${d}\n`).join('') +
  '#define MAP_UV uv\n#define NORMALMAP_UV uv\n#define ROUGHNESSMAP_UV uv\n#define AOMAP_UV uv1\n#define CUBEUV_TEXEL_WIDTH 0.0013\n#define CUBEUV_TEXEL_HEIGHT 0.0006\n' +
  '#define CUBEUV_MAX_MIP 8.0\n#define SHADOWMAP_TYPE_PCF_SOFT\n' +
  // glslangValidator reserves `average`; three's common chunk declares one.
  '#define average threeAverage\n';
const VS_HEAD = '#version 300 es\nprecision highp float;\nprecision highp int;\n#define attribute in\n#define varying out\n#define texture2D texture\n' + DEFINES +
  'uniform mat4 modelMatrix;\nuniform mat4 modelViewMatrix;\nuniform mat4 projectionMatrix;\nuniform mat4 viewMatrix;\nuniform mat3 normalMatrix;\nuniform vec3 cameraPosition;\n' +
  'uniform bool isOrthographic;\nin vec3 position;\nin vec3 normal;\nin vec2 uv;\nin vec2 uv1;\n';
const FS_HEAD = '#version 300 es\nprecision highp float;\nprecision highp int;\nprecision highp sampler2D;\n#define varying in\nlayout(location = 0) out highp vec4 pc_fragColor;\n' +
  '#define gl_FragColor pc_fragColor\n#define texture2D texture\n' + DEFINES + 'uniform mat4 viewMatrix;\nuniform vec3 cameraPosition;\nuniform bool isOrthographic;\n' +
  'vec4 linearToOutputTexel(vec4 v) { return v; }\n#define toneMapping(x) (x)\n';

const mats = new Map();
world.scene.traverse(o => {
  if (!o.isMesh) return;
  for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
    if (!m || !m.isMeshStandardMaterial || !m.onBeforeCompile || mats.has(m.customProgramCacheKey?.())) continue;
    if (m.onBeforeCompile === THREE.Material.prototype.onBeforeCompile) continue;
    mats.set(m.customProgramCacheKey?.() || m.uuid, { m, label: o.name || m.type });
  }
});
const dir = mkdtempSync(join(tmpdir(), 'glsl-'));
let bad = 0, n = 0;
for (const [key, { m, label }] of mats) {
  const sh = { uniforms: {}, vertexShader: THREE.ShaderLib.standard.vertexShader, fragmentShader: THREE.ShaderLib.physical.fragmentShader, defines: {} };
  m.onBeforeCompile(sh, null);
  const files = { vert: VS_HEAD + unroll(lights(resolve(sh.vertexShader))), frag: FS_HEAD + unroll(lights(resolve(sh.fragmentShader))) };
  for (const [ext, src] of Object.entries(files)) {
    const f = join(dir, `m${n}.${ext}`);
    writeFileSync(f, src);
    try { execSync(`glslangValidator ${f}`, { stdio: 'pipe' }); }
    catch (e) { bad++; console.log(`  FAIL ${label} (${key}) ${ext}:\n${String(e.stdout).split('\n').filter(l => /ERROR/.test(l)).slice(0, 6).map(l => `         ${l}`).join('\n')}`); }
  }
  n++;
}
console.log(`${name}: ${n} patched material program(s), ${bad ? `${bad} shader(s) failed` : 'every vertex and fragment shader compiles'} (glslangValidator, WebGL 2)`);
world.dispose?.();
process.exit(bad ? 1 : 0);
