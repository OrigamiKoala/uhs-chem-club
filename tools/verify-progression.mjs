/**
 * verify-progression.mjs — Comprehensive verification of Avalon progression system:
 * - Level curve consistency (levels.js, proxy, Scoring.gs)
 * - Requisitions unlock table and whitelisted kinds
 * - Commendations registry (~40 badges, 5 roads, zero XP, zero meeting badges)
 * - Clean marks and Field Manual entries
 * - Weekly Watch streak & forgiveness logic
 * - Contracts calculation
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { LEVEL_THRESHOLDS, LEVEL_TITLES, levelForXp, levelTitle, levelProgress, MAX_LEVEL } from '../src/progression/levels.js';
import { REQUISITION_TABLE, HELD_KINDS, heldRequisitions, nextLevelRequisition } from '../src/progression/requisitions.js';
import { ALL_COMMENDATIONS, COMMENDATIONS_BY_ID } from '../src/progression/commendations.js';
import { isStageClean, recordStageMark, countCleanStages } from '../src/progression/marks.js';
import { calculateWatchStreak, isForgivenessAvailable } from '../src/progression/watch.js';
import { getContractForWeek, scaleContractGoal, evaluateContribution } from '../src/progression/contracts.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
let failures = 0;

function check(label, condition, detail = '') {
  if (condition) {
    console.log(`  ok   ${label}`);
  } else {
    console.error(`  FAIL ${label} ${detail}`);
    failures++;
  }
}

console.log('Level Curve & Thresholds');

// Test level thresholds
check('max level is 12', MAX_LEVEL === 12);
check('level 1 at 0 XP', levelForXp(0) === 1);
check('level 2 at 60 XP', levelForXp(60) === 2);
check('level 2 at 59 XP is still level 1', levelForXp(59) === 1);
check('level 6 at 715 XP (Quest 1 yield)', levelForXp(715) === 6);
check('level 12 at 2520 XP', levelForXp(2520) === 12);
check('level capped at 12 for high XP', levelForXp(10000) === 12);

// Test level titles
check('title for level 1 is Cadet', levelTitle(1) === 'Cadet');
check('title for level 2 is Cadet', levelTitle(2) === 'Cadet');
check('title for level 3 is Scout', levelTitle(3) === 'Scout');
check('title for level 5 is Navigator', levelTitle(5) === 'Navigator');
check('title for level 11 is Starmarshal', levelTitle(11) === 'Starmarshal');
check('title for level 12 is Starmarshal', levelTitle(12) === 'Starmarshal');

// Compare with apps-script/Scoring.gs
const scoringGsPath = path.resolve(__dirname, '../apps-script/Scoring.gs');
const scoringGs = fs.readFileSync(scoringGsPath, 'utf8');
check('Scoring.gs contains LEVEL_THRESHOLDS', scoringGs.includes('LEVEL_THRESHOLDS'));
check('Scoring.gs max level is 12', scoringGs.includes('MAX_LEVEL = 12'));
check('Scoring.gs threshold 2520 present', scoringGs.includes('2520'));

console.log('\nRequisitions & Unlocks');
check('requisitions table has entries', Array.isArray(REQUISITION_TABLE) && REQUISITION_TABLE.length >= 12);

const invalidKinds = REQUISITION_TABLE.filter(r => !HELD_KINDS.includes(r.kind));
check('all requisition kinds are whitelisted', invalidKinds.length === 0, JSON.stringify(invalidKinds));

const xpLeakingReqs = REQUISITION_TABLE.filter(r => 'xp' in r || 'xp_bonus' in r || 'hint' in r);
check('requisitions carry zero XP or hint perks', xpLeakingReqs.length === 0);

const lvl1Reqs = heldRequisitions(1);
check('level 1 holds initial requisitions', lvl1Reqs.length > 0);
const lvl12Reqs = heldRequisitions(12);
const levelBasedReqs = REQUISITION_TABLE.filter(r => r.source?.level !== undefined);
check('level 12 holds all level-based requisitions', lvl12Reqs.length === levelBasedReqs.length);
check('nextLevelRequisition at level 1 returns level 2', nextLevelRequisition(1)?.level === 2);
check('nextLevelRequisition at level 12 returns null', nextLevelRequisition(12) === null);

console.log('\nCommendations Registry');
check('commendations count >= 35', ALL_COMMENDATIONS.length >= 35, `count=${ALL_COMMENDATIONS.length}`);

const uniqueIds = new Set(ALL_COMMENDATIONS.map(c => c.id));
check('commendation IDs are unique', uniqueIds.size === ALL_COMMENDATIONS.length);

const roads = new Set(ALL_COMMENDATIONS.map(c => c.road));
check('5 roads present: campaign, craft, learn, crew, season',
  roads.has('campaign') && roads.has('craft') && roads.has('learn') && roads.has('crew') && roads.has('season'));

const meetingBadges = ALL_COMMENDATIONS.filter(c =>
  c.id.includes('attendance') || c.id.includes('meeting') || c.title.toLowerCase().includes('meeting')
);
check('zero meeting code badges', meetingBadges.length === 0, JSON.stringify(meetingBadges));

const xpCommendations = ALL_COMMENDATIONS.filter(c => 'xp' in c || 'xp_bonus' in c);
check('zero XP attached to any commendation', xpCommendations.length === 0);

console.log('\nClean Marks & Field Manual');
const progRecord = recordStageMark({}, 0, true);
check('isStageClean returns true for recorded clean stage', isStageClean(progRecord, 0) === true);
check('isStageClean returns false for unrecorded stage', isStageClean(progRecord, 1) === false);
check('countCleanStages counts correctly', countCleanStages(progRecord) === 1);

const dupRecord = recordStageMark(progRecord, 0, true);
check('recordStageMark is idempotent', countCleanStages(dupRecord) === 1);

console.log('\nWeekly Watch & Contracts');
// 6 weeks stood earns 1 forgiveness
check('streak calculation: consecutive weeks', calculateWatchStreak([1, 2, 3], 3) === 3);
check('streak calculation: 1 forgiveness used when missed 1 week with >= 6 stood',
  calculateWatchStreak([1, 2, 3, 4, 5, 6, 8], 8) === 8);
check('forgiveness available after 6 stood', isForgivenessAvailable(6, 0) === true);
check('forgiveness not available before 6 stood', isForgivenessAvailable(5, 0) === false);
check('forgiveness not available if already used', isForgivenessAvailable(6, 1) === false);

const contract = getContractForWeek('2026-W01');
const goal = scaleContractGoal(contract.baseGoal, 10);
check('contract returns goal', goal > 0);
check('evaluateContribution returns ratio', evaluateContribution(5, 10) === 0.5);

console.log(`\n${failures === 0 ? 'PROGRESSION OK' : failures + ' CHECK(S) FAILED'}`);
process.exit(failures === 0 ? 0 : 1);
