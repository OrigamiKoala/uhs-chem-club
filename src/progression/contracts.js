/**
 * contracts.js — Weekly guild contract rotation and scaling goals.
 * Pure functions; importable in Node and browser.
 */

import { getIsoWeek } from './watch.js';

export const CONTRACT_ROTATION = [
  {
    id: 'contract_stages',
    title: 'Grid Restoration',
    line: 'Clear campaign and bench stages across the sector.',
    baseGoal: 10,
    metric: 'stages',
    description: 'Clear stages as a guild this week.'
  },
  {
    id: 'contract_watches',
    title: 'Watch Standing',
    line: 'Maintain active weekly watches across the guild roster.',
    baseGoal: 3,
    metric: 'watches',
    description: 'Guild members standing active watch this week.'
  },
  {
    id: 'contract_learn',
    title: 'Planetary Survey',
    line: 'Work instrument stages on Learn worlds.',
    baseGoal: 8,
    metric: 'learn_stages',
    description: 'Complete Learn stages as a guild.'
  },
  {
    id: 'contract_clean',
    title: 'Precision Run',
    line: 'Complete stages on the first attempt without method rungs.',
    baseGoal: 6,
    metric: 'clean_stages',
    description: 'Solve stages clean without solution rungs.'
  }
];

/**
 * Returns the active contract for a given ISO week or Date.
 */
export function getContractForWeek(dateOrIsoWeek = new Date()) {
  const iso = typeof dateOrIsoWeek === 'string' && dateOrIsoWeek.includes('-W')
    ? dateOrIsoWeek
    : getIsoWeek(dateOrIsoWeek);

  const parts = iso.split('-W');
  const weekNum = parseInt(parts[1] || '1', 10);
  const idx = Math.abs(weekNum - 1) % CONTRACT_ROTATION.length;
  return CONTRACT_ROTATION[idx];
}

/**
 * Scales a contract goal to the guild's active roster size.
 * Minimum 1, scaled so goals are achievable by small or large guilds.
 */
export function scaleContractGoal(baseGoal, activeRosterSize = 1) {
  const size = Math.max(1, activeRosterSize);
  return Math.max(baseGoal, Math.round(baseGoal * (0.8 + 0.3 * size)));
}

/**
 * Evaluates contract status for a guild.
 * @param {object} params
 * @param {string} params.week
 * @param {number} params.activeRosterSize
 * @param {number} params.guildProgress
 * @param {number} params.playerContribution
 * @returns {object}
 */
export function evaluateGuildContract({
  week = getIsoWeek(),
  activeRosterSize = 1,
  guildProgress = 0,
  playerContribution = 0
}) {
  const contract = getContractForWeek(week);
  const goal = scaleContractGoal(contract.baseGoal, activeRosterSize);
  const progress = Math.max(0, guildProgress || 0);
  const isComplete = progress >= goal;
  const pct = Math.min(100, Math.round((progress / goal) * 100));
  const hasContributed = (playerContribution || 0) > 0;

  return {
    week,
    contract,
    goal,
    progress,
    isComplete,
    pct,
    playerContribution,
    hasContributed,
    rewardEligible: isComplete && hasContributed
  };
}

/**
 * Returns contribution ratio between player contribution and target goal.
 */
export function evaluateContribution(contribution, target) {
  if (!target || target <= 0) return 0;
  return Math.min(1.0, Math.max(0, (contribution || 0) / target));
}
