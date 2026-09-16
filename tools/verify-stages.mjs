/**
 * verify-stages.mjs — Static integrity check for Quest 1.
 *
 * Catches the class of bug that makes a stage unwinnable: an expected anchor id
 * that the molecule never renders, a solution the grader rejects, or client and
 * server disagreeing about the answer. Run with `npm run verify:quest`.
 */

import { STAGE_CONFIGS, evaluateStageLocally, diagnoseMiss, TOTAL_STAGES, TOTAL_QUEST_XP } from '../src/quest3d/evaluator.js';
import { MOLECULE_DATA } from '../src/quest3d/molecule.js';
import { CANONICAL_STAGES_20 } from '../api/[...route].js';

let failures = 0;
const fail = (msg) => { console.log(`  FAIL ${msg}`); failures++; };
const ok = (msg) => console.log(`  ok   ${msg}`);

console.log(`Quest 1 — ${TOTAL_STAGES} stages, ${TOTAL_QUEST_XP} XP\n`);

if (STAGE_CONFIGS.length !== CANONICAL_STAGES_20.length) {
  fail(`client has ${STAGE_CONFIGS.length} stages, proxy has ${CANONICAL_STAGES_20.length}`);
}

STAGE_CONFIGS.forEach((cfg, i) => {
  const label = `stage ${i + 1}`;
  const mol = MOLECULE_DATA[cfg.moleculeId];
  const remote = CANONICAL_STAGES_20[i];

  if (!mol) { fail(`${label}: molecule "${cfg.moleculeId}" does not exist`); return; }

  const regionIds = (mol.regions || []).map(r => r.id);
  if (regionIds.length === 0) fail(`${label}: molecule has no pickable regions`);

  // Every anchor the grader expects must actually be rendered in the scene.
  const expected = cfg.multiArrow
    ? (cfg.steps || []).flatMap(s => [s.expectedFrom, s.expectedTo])
    : [cfg.expectedFrom, cfg.expectedTo];

  for (const a of expected) {
    if (!a) { fail(`${label}: missing expected anchor in config`); continue; }
    if (!regionIds.includes(a)) fail(`${label}: expects anchor "${a}" which ${cfg.moleculeId} never renders`);
  }

  // The intended solution must grade as correct.
  if (cfg.multiArrow) {
    const payload = {
      arrows: (cfg.steps || []).map(s => ({ from: s.expectedFrom, to: s.expectedTo, order: s.order }))
    };
    const res = evaluateStageLocally(i, payload);
    if (!res.correct) fail(`${label}: intended multi-arrow solution graded incorrect`);
    if (res.xpAwarded !== cfg.xp) fail(`${label}: awarded ${res.xpAwarded} XP, config says ${cfg.xp}`);

    // Shuffled order must be reported as wrong order, not as a generic miss.
    if ((cfg.steps || []).length > 1) {
      const reversed = {
        arrows: cfg.steps.map((s, idx) => ({
          from: s.expectedFrom,
          to: s.expectedTo,
          order: cfg.steps.length - idx
        }))
      };
      const rev = evaluateStageLocally(i, reversed);
      if (rev.correct) fail(`${label}: accepts the steps in the wrong order`);
      else if (!rev.wrongOrder) fail(`${label}: wrong order not reported as wrongOrder`);
    }
  } else {
    const res = evaluateStageLocally(i, { from: cfg.expectedFrom, to: cfg.expectedTo });
    if (!res.correct) fail(`${label}: intended solution graded incorrect`);
    if (res.xpAwarded !== cfg.xp) fail(`${label}: awarded ${res.xpAwarded} XP, config says ${cfg.xp}`);

    // Reversed arrow (blue to red) must never pass.
    const back = evaluateStageLocally(i, { from: cfg.expectedTo, to: cfg.expectedFrom });
    if (back.correct) fail(`${label}: accepts a backwards arrow`);

    // Proximity grading must accept the documented solution coordinates.
    if (cfg.sourcePos && cfg.targetPos) {
      const byPos = evaluateStageLocally(i, { startPos: cfg.sourcePos, endPos: cfg.targetPos });
      if (!byPos.correct) fail(`${label}: solution coordinates rejected by proximity check`);
    }

    // A blocked target must be reported as blocked so the player gets the real reason.
    if (cfg.blockedAnchor) {
      const blocked = evaluateStageLocally(i, { from: cfg.expectedFrom, to: cfg.blockedAnchor });
      if (!blocked.blocked) fail(`${label}: blocked anchor not flagged as blocked`);
    }
  }

  // Player-facing copy must exist and stay free of the vocabulary the quest withholds.
  if (!cfg.title) fail(`${label}: no title`);
  if (!cfg.prompt) fail(`${label}: no prompt`);
  if (!cfg.hint) fail(`${label}: no hint`);
  if (!cfg.shape) fail(`${label}: no stage shape kicker`);
  if (!cfg.reaction) fail(`${label}: no reaction animation config`);

  // The hint ladder: three rungs, free nudge first, solution last. A stage with
  // fewer rungs would strand a player who has missed twice.
  if (!Array.isArray(cfg.hints) || cfg.hints.length !== 3) {
    fail(`${label}: expected 3 hint rungs, found ${cfg.hints?.length ?? 0}`);
  } else {
    cfg.hints.forEach((h, r) => { if (!h || h.length < 20) fail(`${label}: hint rung ${r + 1} is empty or too terse`); });
    if (new Set(cfg.hints).size !== cfg.hints.length) fail(`${label}: hint rungs repeat themselves`);
    if (cfg.hint !== cfg.hints[0]) fail(`${label}: legacy hint field is out of sync with rung 1`);
  }

  // The scanner is the only way a player learns anything about a site, so every
  // region the chamber renders must be scannable. A site with no readout reads as
  // a broken instrument.
  const scans = cfg.scans || {};
  for (const id of regionIds) {
    const sc = scans[id];
    if (!sc) { fail(`${label}: region "${id}" is rendered but has no scan readout`); continue; }
    if (!sc.site) fail(`${label}: scan "${id}" has no site letter`);
    if (sc.polarity !== 'giver' && sc.polarity !== 'taker') fail(`${label}: scan "${id}" has polarity "${sc.polarity}"`);
    for (const k of ['strength', 'clearance']) {
      if (typeof sc[k] !== 'number' || sc[k] < 0 || sc[k] > 10) fail(`${label}: scan "${id}" ${k} is not a 0-10 reading`);
    }
    if (!sc.note || sc.note.length < 15) fail(`${label}: scan "${id}" has no readable note`);
  }
  for (const id of Object.keys(scans)) {
    if (!regionIds.includes(id)) fail(`${label}: scan "${id}" describes a site ${cfg.moleculeId} never renders`);
  }
  const letters = Object.values(scans).map(s => s.site);
  if (new Set(letters).size !== letters.length) fail(`${label}: two sites share a scanner letter`);

  // Scan readings must agree with the answer, or the readout lies to the player:
  // the expected giver has to be the strongest giver, and the expected taker the
  // strongest *reachable* taker.
  const REACHABLE = 4;
  const expectedSet = new Set(expected);
  for (const [id, sc] of Object.entries(scans)) {
    if (expectedSet.has(id) || sc.polarity !== 'giver') continue;
    const rival = expected.map(e => scans[e]).find(e => e && e.polarity === 'giver');
    if (rival && sc.strength > rival.strength) {
      fail(`${label}: decoy giver "${id}" scans stronger (${sc.strength}) than the answer (${rival.strength})`);
    }
  }
  for (const [id, sc] of Object.entries(scans)) {
    if (expectedSet.has(id) || sc.polarity !== 'taker' || sc.clearance < REACHABLE) continue;
    const rival = expected.map(e => scans[e]).find(e => e && e.polarity === 'taker');
    if (rival && rival.clearance >= REACHABLE && sc.strength > rival.strength) {
      fail(`${label}: reachable decoy taker "${id}" scans hungrier (${sc.strength}) than the answer (${rival.strength})`);
    }
  }
  if (cfg.blockedAnchor && scans[cfg.blockedAnchor] && scans[cfg.blockedAnchor].clearance > 3) {
    fail(`${label}: blocked site "${cfg.blockedAnchor}" scans ${scans[cfg.blockedAnchor].clearance}/10 clearance — the readout contradicts the grader`);
  }

  // A miss has to say something more useful than "not quite".
  const giverIds = Object.keys(scans).filter(id => scans[id].polarity === 'giver');
  if (giverIds.length >= 2) {
    const bad = cfg.multiArrow
      ? { arrows: [{ from: giverIds[0], to: giverIds[1], order: 1 }, { from: giverIds[0], to: giverIds[1], order: 2 }] }
      : { from: giverIds[0], to: giverIds[1] };
    const d = diagnoseMiss(i, bad, evaluateStageLocally(i, bad));
    if (d.title !== 'TWO GIVERS') fail(`${label}: giver-to-giver miss diagnosed as "${d.title}"`);
  }

  const copy = [cfg.title, cfg.prompt, ...(cfg.hints || [cfg.hint]), cfg.reaction?.explanation,
    cfg.concept?.intro, cfg.concept?.action,
    ...Object.values(scans).map(sc => sc.note)].filter(Boolean).join(' ').toLowerCase();
  const banned = ['electron', 'nucleophile', 'electrophile', 'carbonyl', 'carbocation',
    'alkyl', 'ester', 'epoxide', 'isopropyl'];
  for (const word of banned) {
    if (copy.includes(word)) fail(`${label}: player-facing copy contains "${word}"`);
  }

  // Client and proxy must describe the same stage.
  if (remote) {
    if (remote.xp !== cfg.xp) fail(`${label}: xp differs (client ${cfg.xp}, proxy ${remote.xp})`);
    if (remote.scene_config?.moleculeId !== cfg.moleculeId) {
      fail(`${label}: molecule differs (client ${cfg.moleculeId}, proxy ${remote.scene_config?.moleculeId})`);
    }
    if (remote.scene_config?.title !== cfg.title) fail(`${label}: title differs between client and proxy`);
    if (remote.scene_config?.prompt !== cfg.prompt) fail(`${label}: prompt differs between client and proxy`);
  }
});

if (failures === 0) ok(`all ${TOTAL_STAGES} stages solvable, scannable, consistent and jargon-free`);

console.log(`\n${failures === 0 ? 'QUEST 1 OK' : failures + ' PROBLEM(S) FOUND'}`);
process.exit(failures === 0 ? 0 : 1);
