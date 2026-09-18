/**
 * progress.js — Where a player has got to on the Learn track.
 *
 * The Learn track keeps its own books. It never calls session.addXp, never writes
 * a Submission and never appears in Standings: a student who works through Tallow
 * three times is not thereby ahead of one who did it once, and a student who skips
 * it entirely is not behind. Progress here is stages cleared and quests finished.
 *
 * Gating is what makes the track a road:
 *   - World 1 is always open. World N opens when world N-1 is complete.
 *   - Inside a world, quest 1 is open and quest N opens when quest N-1 is complete.
 *   - A quest with no module yet is 'charted' and never opens; a world whose
 *     quests are all charted is charted too.
 */

import { session } from '../session.js';
import { WORLDS, getWorld, previousWorld } from './curriculum.js';

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

/** Quest N is open once quest N-1 is complete. Quest 1 is open with the world. */
export function isQuestOpen(world, quest) {
  if (!world || !quest) return false;
  if (quest.status !== 'live') return false;
  if (!isWorldOpen(world)) return false;
  if (quest.index === 0) return true;
  const prev = world.quests[quest.index - 1];
  // A charted quest cannot block the road behind it — if the one before this has
  // not been built yet, this one opens as soon as the world does.
  if (prev.status !== 'live') return true;
  return isQuestComplete(prev);
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
  return {
    questsComplete,
    questTotal: world.questCount,
    liveTotal: live.length,
    pct: live.length ? Math.round((questsComplete / live.length) * 100) : 0,
    // A world counts as complete when every quest that exists in it is finished.
    // Quests still to be written do not hold the road shut, or world 2 could
    // never open until the whole curriculum shipped.
    complete: live.length > 0 && questsComplete >= live.length
  };
}

export function isWorldComplete(world) {
  // No built world before this one means nothing is holding it shut.
  if (!world) return true;
  return worldProgress(world).complete;
}

export function isWorldOpen(world) {
  if (!world) return false;
  if (world.status !== 'live') return false;
  // Charted worlds are transparent: an unbuilt world between two built ones must
  // not seal the road, so the gate is the last BUILT world before this one.
  return isWorldComplete(lastBuiltBefore(world));
}

/** The nearest built world ahead of this one on the road, or null. */
function lastBuiltBefore(world) {
  let prev = previousWorld(world.id);
  while (prev && prev.status !== 'live') prev = previousWorld(prev.id);
  return prev;
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
  return world.quests.find(q => q.status === 'live' && !isQuestComplete(q)) || null;
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
