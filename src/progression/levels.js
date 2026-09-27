/**
 * levels.js — Level thresholds, curve, and titles for Avalon progression.
 * Pure data and functions; importable in Node and browser.
 */

export const MAX_LEVEL = 12;

export const LEVEL_THRESHOLDS = [
  0,     // Level 0 (unused, 1-indexed)
  0,     // Level 1: 0 XP
  60,    // Level 2: 60 XP
  150,   // Level 3: 150 XP
  270,   // Level 4: 270 XP
  420,   // Level 5: 420 XP
  600,   // Level 6: 600 XP
  820,   // Level 7: 820 XP
  1080,  // Level 8: 1,080 XP
  1380,  // Level 9: 1,380 XP
  1720,  // Level 10: 1,720 XP
  2100,  // Level 11: 2,100 XP
  2520   // Level 12: 2,520 XP
];

export const LEVEL_TITLES = [
  { maxLevel: 2, title: 'Cadet' },
  { maxLevel: 4, title: 'Scout' },
  { maxLevel: 6, title: 'Navigator' },
  { maxLevel: 8, title: 'Voyager' },
  { maxLevel: 10, title: 'Pathfinder' },
  { maxLevel: 12, title: 'Starmarshal' }
];

export function levelForXp(xp) {
  const total = Math.max(0, xp || 0);
  let lvl = 1;
  for (let i = 1; i <= MAX_LEVEL; i++) {
    if (total >= LEVEL_THRESHOLDS[i]) lvl = i;
    else break;
  }
  return Math.min(MAX_LEVEL, Math.max(1, lvl));
}

export function levelTitle(level) {
  const lvl = Math.min(MAX_LEVEL, Math.max(1, level || 1));
  for (let i = 0; i < LEVEL_TITLES.length; i++) {
    if (lvl <= LEVEL_TITLES[i].maxLevel) return LEVEL_TITLES[i].title;
  }
  return 'Starmarshal';
}

export function levelProgress(xp) {
  const total = Math.max(0, xp || 0);
  const level = levelForXp(total);
  if (level >= MAX_LEVEL) {
    const base = LEVEL_THRESHOLDS[MAX_LEVEL];
    return {
      level: MAX_LEVEL,
      into: total - base,
      needed: 0,
      nextLevelXp: base,
      pct: 100
    };
  }
  const base = LEVEL_THRESHOLDS[level];
  const next = LEVEL_THRESHOLDS[level + 1];
  const into = total - base;
  const needed = Math.max(1, next - base);
  return {
    level,
    into,
    needed,
    nextLevelXp: next,
    pct: Math.min(100, Math.max(0, Math.round((into / needed) * 100)))
  };
}
