/**
 * progress.js — Where a player has got to on the Learn track.
 *
 * The Learn track keeps its own books. It never calls session.addXp, never writes
 * a Submission and never appears in Standings: a student who works through Tallow
 * three times is not thereby ahead of one who did it once, and a student who skips
 * it entirely is not behind. Progress here is stages cleared and quests finished.
 *
 * Gating:
 *   - Every built world is open from the start. The road has an order, but a
 *     student should be able to go straight to the unit their class is on.
 *   - Inside a world, quest 1 is open and quest N opens when quest N-1 is complete,
 *     because each bench builds on the one before it.
 *   - A quest with no module yet is 'charted' and never opens; a world whose
 *     quests are all charted is charted too.
 */

import { session } from '../session.js';
import { WORLDS, getWorld } from './curriculum.js';

export function questKey(worldId, questId) {
  return `${worldId}/${questId}`;
}

/** Raw record for one quest, always a usable object. */
export function questRecord(worldId, questId) {
  const rec = session.learn ? session.learn[questKey(worldId, questId)] : null;
  return {
    stages: Array.isArray(rec?.stages) ? rec.stages : [],
    completedAt: rec?.completedAt || null
  };
}

export function stagesCleared(quest) {
  if (!quest) return 0;
  return questRecord(quest.worldId, quest.id).stages.length;
}

export function isQuestComplete(quest) {
  if (!quest) return false;
  return Boolean(questRecord(quest.worldId, quest.id).completedAt);
}

/** {cleared, total, pct, complete} for one quest. */
export function questProgress(quest) {
  if (!quest) return { cleared: 0, total: 0, pct: 0, complete: false };
  const total = quest.stageCount || 0;
  const cleared = Math.min(stagesCleared(quest), total || Infinity);
  const complete = isQuestComplete(quest);
  return {
    cleared: complete && total ? total : cleared,
    total,
    pct: total ? Math.round((Math.min(cleared, total) / total) * 100) : 0,
    complete
  };
}

/** Quest N is open once quest N-1 is complete. Quest 1 is open with the world. A boss opens once every required bench is complete. */
export function isQuestOpen(world, quest) {
  if (!world || !quest) return false;
  if (quest.status !== 'live') return false;
  if (!isWorldOpen(world)) return false;
  if (quest.arena === 'boss') {
    const requiredBenches = world.quests.filter(q => q.status === 'live' && q.arena !== 'boss' && !q.optional);
    return requiredBenches.length > 0 && requiredBenches.every(isQuestComplete);
  }
  if (quest.index === 0) return true;
  // An optional quest never holds the one after it shut.
  let prevIdx = quest.index - 1;
  while (prevIdx >= 0) {
    const prev = world.quests[prevIdx];
    if (prev.status !== 'live') {
      prevIdx--;
      continue;
    }
    if (isQuestComplete(prev)) return true;
    if (prev.optional) {
      prevIdx--;
      continue;
    }
    return false;
  }
  return true;
}

/** 'complete' | 'open' | 'locked' | 'charted' — one word for the map badge. */
export function questStatus(world, quest) {
  if (!quest) return 'charted';
  if (quest.status !== 'live') return 'charted';
  if (isQuestComplete(quest)) return 'complete';
  if (isQuestOpen(world, quest)) return 'open';
  return 'locked';
}

export function worldProgress(world) {
  if (!world) return { questsComplete: 0, questTotal: 0, liveTotal: 0, pct: 0, complete: false };
  const live = world.quests.filter(q => q.status === 'live');
  const questsComplete = live.filter(isQuestComplete).length;
  const requiredBenches = live.filter(q => q.arena !== 'boss' && !q.optional);
  const benchesComplete = requiredBenches.filter(isQuestComplete).length;
  return {
    questsComplete,
    questTotal: world.questCount,
    liveTotal: live.length,
    pct: live.length ? Math.round((questsComplete / live.length) * 100) : 0,
    // A boss gates only story; world completion & practice sets open once all required benches are finished.
    complete: requiredBenches.length > 0 && benchesComplete >= requiredBenches.length
  };
}

export function isWorldComplete(world) {
  // No world at all is trivially complete.
  if (!world) return true;
  return worldProgress(world).complete;
}

export function isWorldOpen(world) {
  if (!world) return false;
  // Every built world is open. A world with nothing built is charted, not locked.
  return world.status === 'live';
}

/** 'complete' | 'open' | 'locked' | 'charted' — one word for the map badge. */
export function worldStatus(world) {
  if (!world) return 'locked';
  if (world.status !== 'live') return 'charted';
  if (isWorldComplete(world)) return 'complete';
  if (isWorldOpen(world)) return 'open';
  return 'locked';
}

/** The quest the player should walk into next, or null if the world is done. */
export function nextQuest(world) {
  if (!world) return null;
  const uncompleted = world.quests.filter(q => q.status === 'live' && !isQuestComplete(q));
  const openRequired = uncompleted.find(q => !q.optional && isQuestOpen(world, q));
  if (openRequired) return openRequired;
  return uncompleted.find(q => isQuestOpen(world, q)) || null;
}

/** The world the "Continue" key points at. */
export function currentWorld() {
  return WORLDS.find(w => worldStatus(w) === 'open')
    || WORLDS.find(w => worldStatus(w) === 'complete')
    || WORLDS[0]
    || null;
}

/** Track-wide tally for the Learn index header. */
export function trackProgress() {
  const live = WORLDS.filter(w => w.status === 'live');
  const questTotal = WORLDS.reduce((n, w) => n + w.questCount, 0);
  const liveQuests = WORLDS.reduce((n, w) => n + w.liveQuestCount, 0);
  const questsComplete = live.reduce((n, w) => n + worldProgress(w).questsComplete, 0);
  return {
    worldsComplete: live.filter(isWorldComplete).length,
    worldsLive: live.length,
    worldsCharted: WORLDS.length,
    questsComplete,
    questsLive: liveQuests,
    questsCharted: questTotal,
    pct: liveQuests ? Math.round((questsComplete / liveQuests) * 100) : 0
  };
}

/* ------------------------------------------------------------------
   WRITES — no XP is awarded here, or anywhere else on this track.
   ------------------------------------------------------------------ */
export function markStage(worldId, questId, stageIndex) {
  session.recordLearnStage(worldId, questId, stageIndex);
}

export function markQuestComplete(worldId, questId) {
  session.markLearnQuestComplete(worldId, questId);
}

/** Look up a world with its gating resolved, for the screens. */
export function worldView(worldId) {
  const world = getWorld(worldId);
  if (!world) return null;
  return { world, status: worldStatus(world), progress: worldProgress(world) };
}
