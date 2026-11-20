#!/usr/bin/env node
/**
 * verify-all.mjs — Runs every `verify:*` script in package.json in parallel across CPU cores,
 * then runs `npm run build`. Buffers per-task output and prints full logs on any failure.
 */

import { readFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { cpus } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const verbose = process.argv.includes('--verbose') || process.env.VERIFY_VERBOSE === '1';

const jobs = [];
for (const [name, cmd] of Object.entries(pkg.scripts)) {
  if (!name.startsWith('verify:')) continue;
  const parts = cmd.split('&&').map(s => s.trim()).filter(Boolean);
  if (parts.length === 1) {
    jobs.push({ name, cmd: parts[0] });
  } else {
    parts.forEach((p, i) => jobs.push({ name: `${name}#${i + 1}`, cmd: p }));
  }
}

// Start the slowest checks first so they overlap with the rest of the suite.
const PRIORITY = new Map([['verify:npc', -1], ['verify:bench', 0], ['verify:run', 1], ['verify:arena', 2], ['verify:table', 3], ['verify:thornmere', 4], ['verify:lodestone', 5], ['verify:voyage', 6], ['verify:learn', 7]]);
jobs.sort((a, b) => (PRIORITY.get(a.name) ?? 99) - (PRIORITY.get(b.name) ?? 99));

function runCommand(cmd) {
  return new Promise(resolve => {
    const t0 = performance.now();
    const child = spawn(cmd, { cwd: root, shell: true, stdio: ['ignore', 'pipe', 'pipe'] });
    const out = [];
    child.stdout.on('data', d => out.push(d));
    child.stderr.on('data', d => out.push(d));
    child.on('close', code => {
      resolve({
        code: code ?? 1,
        ms: performance.now() - t0,
        output: Buffer.concat(out).toString('utf8')
      });
    });
  });
}

const tStart = performance.now();
const concurrency = Math.max(1, cpus().length);
let next = 0;
const results = new Array(jobs.length);

async function worker() {
  while (true) {
    const idx = next++;
    if (idx >= jobs.length) return;
    const job = jobs[idx];
    const res = await runCommand(job.cmd);
    results[idx] = { ...job, ...res };
    const secs = (res.ms / 1000).toFixed(2);
    if (res.code === 0) {
      console.log(`  ok   ${job.name} (${secs}s)`);
      if (verbose && res.output.trim()) console.log(res.output);
    } else {
      console.log(`  FAIL ${job.name} (${secs}s)`);
    }
  }
}

console.log(`Running ${jobs.length} verification checks across ${concurrency} workers...\n`);
await Promise.all(Array.from({ length: concurrency }, () => worker()));

const failed = results.filter(r => r.code !== 0);
if (failed.length) {
  console.log(`\n${failed.length} check(s) failed:\n`);
  for (const f of failed) {
    console.log(`=== ${f.name} (${f.cmd}) ===`);
    console.log(f.output);
  }
  process.exit(1);
}

console.log('\nRunning production build...');
const build = await runCommand(pkg.scripts.build);
console.log(`  ${build.code === 0 ? 'ok  ' : 'FAIL'} build (${(build.ms / 1000).toFixed(2)}s)`);
if (build.code !== 0) {
  console.log(build.output);
  process.exit(1);
}

const total = ((performance.now() - tStart) / 1000).toFixed(2);
console.log(`\nALL ${jobs.length} CHECKS + BUILD OK in ${total}s`);
