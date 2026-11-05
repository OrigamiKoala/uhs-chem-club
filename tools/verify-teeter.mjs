#!/usr/bin/env node
/** verify:teeter — Teeter (unit08). Phase 1: planner data checks. The world checks are added with the 3D world (not built yet). */
import { checkTeeterData } from './lib/teeter-data-checks.mjs';
let fails = 0;
const ok = m => console.log(`  ok   ${m}`);
const bad = m => { fails++; console.log(`  FAIL ${m}`); };
checkTeeterData(ok, bad);
console.log(fails ? `\nTEETER FAILED (${fails})` : '\nTEETER OK');
process.exit(fails ? 1 : 0);
