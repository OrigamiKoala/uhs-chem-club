/**
 * watch.js — Weekly streak tracking and forgiveness rule.
 * Pure functions; importable in Node and browser.
 */

/**
 * Returns ISO week string "YYYY-Www" for a Date or ISO timestamp.
 */
export function getIsoWeek(dateInput) {
  const date = typeof dateInput === 'string' || typeof dateInput === 'number'
    ? new Date(dateInput)
    : (dateInput || new Date());
  if (isNaN(date.getTime())) return '';

  const target = new Date(date.valueOf());
  const dayNr = (date.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setUTCMonth(0, 1);
  if (target.getUTCDay() !== 4) {
    target.setUTCMonth(0, 1 + ((4 - target.getUTCDay()) + 7) % 7);
  }
  const weekNum = 1 + Math.ceil((firstThursday - target) / 604800000);
  const year = target.getUTCFullYear();
  return `${year}-W${String(weekNum).padStart(2, '0')}`;
}

/**
 * Compares two ISO weeks: returns number of weeks difference (b - a).
 */
export function diffIsoWeeks(weekA, weekB) {
  if (!weekA || !weekB) return 0;
  const parse = (w) => {
    const parts = w.split('-W');
    return { year: parseInt(parts[0], 10), week: parseInt(parts[1], 10) };
  };
  const a = parse(weekA);
  const b = parse(weekB);
  return (b.year - a.year) * 52 + (b.week - a.week);
}

/**
 * Computes watch count from timestamps, applying the 1 forgiveness per 6 stood rule.
 * @param {Array<string|number>} timestamps — all activity timestamps (Submissions, Learn progress)
 * @param {string|Date} [now] — current reference time
 * @returns {{ watchCount: number, activeThisWeek: boolean, weeks: string[] }}
 */
export function computeWatch(timestamps = [], now = new Date()) {
  if (!Array.isArray(timestamps) || timestamps.length === 0) {
    return { watchCount: 0, activeThisWeek: false, weeks: [] };
  }

  const weekSet = new Set();
  for (const ts of timestamps) {
    const wk = getIsoWeek(ts);
    if (wk) weekSet.add(wk);
  }

  const currentWeek = getIsoWeek(now);
  const activeThisWeek = weekSet.has(currentWeek);

  const sortedWeeks = Array.from(weekSet).sort();
  if (sortedWeeks.length === 0) {
    return { watchCount: 0, activeThisWeek: false, weeks: [] };
  }

  // Count backwards from current week (or latest active week if before current)
  // Forgiveness: 1 missed week forgiven per 6 stood.
  let watchCount = 0;
  let forgivenessPool = 0;

  // Walk backwards from current week
  // If active this week, start from currentWeek. If not active this week,
  // we check if last week was active (allowing the current week to still be in progress).
  let targetWeek = currentWeek;
  if (!weekSet.has(targetWeek)) {
    // If not active this week, check previous week:
    const prevWeek = getIsoWeek(new Date(new Date(now).getTime() - 7 * 86400000));
    if (weekSet.has(prevWeek)) {
      targetWeek = prevWeek;
    } else {
      // Streak broken
      return { watchCount: 0, activeThisWeek: false, weeks: sortedWeeks };
    }
  }

  // Count contiguous or forgiven weeks going backward
  let cursor = new Date(now);
  if (targetWeek !== currentWeek) {
    cursor = new Date(cursor.getTime() - 7 * 86400000);
  }

  while (true) {
    const wk = getIsoWeek(cursor);
    if (weekSet.has(wk)) {
      watchCount++;
      if (watchCount % 6 === 0) {
        forgivenessPool++;
      }
    } else {
      if (forgivenessPool > 0) {
        forgivenessPool--;
        // Missed week forgiven, continue backward
      } else {
        break; // Streak ends
      }
    }
    // Step back 7 days
    cursor = new Date(cursor.getTime() - 7 * 86400000);
    // Don't walk further than earliest sorted week
    if (diffIsoWeeks(sortedWeeks[0], getIsoWeek(cursor)) < 0) break;
  }

  return {
    watchCount,
    activeThisWeek,
    weeks: sortedWeeks
  };
}

/**
 * Checks if a forgiveness credit is available based on 1 forgiveness per 6 stood.
 */
export function isForgivenessAvailable(stoodCount, forgivenessUsed = 0) {
  const earned = Math.floor(Number(stoodCount || 0) / 6);
  return earned > Number(forgivenessUsed || 0);
}

/**
 * Calculates watch streak from week numbers or timestamps with forgiveness.
 */
export function calculateWatchStreak(weeks, currentWeek = null) {
  if (Array.isArray(weeks) && weeks.length > 0 && typeof weeks[0] === 'number') {
    const set = new Set(weeks);
    const curr = currentWeek !== null ? currentWeek : Math.max(...weeks);
    const sorted = [...set].filter(w => w <= curr).sort((a, b) => a - b);
    if (sorted.length === 0) return 0;

    let streak = 0;
    let pool = 0;
    const minW = sorted[0];
    for (let w = minW; w <= curr; w++) {
      if (set.has(w)) {
        streak++;
        if (streak % 6 === 0) pool++;
      } else {
        if (pool > 0) {
          pool--;
          streak++;
        } else {
          streak = 0;
        }
      }
    }
    return streak;
  }
  return computeWatch(weeks).watchCount;
}
