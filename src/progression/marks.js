/**
 * marks.js — Cleared and Clean stage marks (first-try solves without solution rung 3).
 * Pure functions; importable in Node and browser.
 */

/**
 * Checks whether a stage has the Clean mark.
 * @param {object} progressRecord — Progress or Learn progress entry
 * @param {number} stageIndex
 * @returns {boolean}
 */
export function isStageClean(progressRecord, stageIndex) {
  if (!progressRecord) return false;
  // Support array of indices, bitmask, or array of objects { i, clean }
  if (Array.isArray(progressRecord.clean_stages)) {
    return progressRecord.clean_stages.includes(stageIndex);
  }
  if (typeof progressRecord.clean_bitmask === 'number') {
    return Boolean(progressRecord.clean_bitmask & (1 << stageIndex));
  }
  if (Array.isArray(progressRecord.stages)) {
    const item = progressRecord.stages.find(s => s === stageIndex || (s && s.i === stageIndex));
    if (item && typeof item === 'object') return Boolean(item.clean);
  }
  return false;
}

/**
 * Records a stage solve, updating clean marks if eligible.
 * @param {object} progressRecord
 * @param {number} stageIndex
 * @param {boolean} wasClean
 * @returns {object} updated progressRecord
 */
export function recordStageMark(progressRecord = {}, stageIndex, wasClean) {
  const updated = { ...progressRecord };
  const cleanList = Array.isArray(updated.clean_stages) ? [...updated.clean_stages] : [];
  if (wasClean && !cleanList.includes(stageIndex)) {
    cleanList.push(stageIndex);
    cleanList.sort((a, b) => a - b);
  }
  updated.clean_stages = cleanList;
  return updated;
}

/**
 * Counts total clean stages in a progress record.
 */
export function countCleanStages(progressRecord) {
  if (!progressRecord) return 0;
  if (Array.isArray(progressRecord.clean_stages)) {
    return progressRecord.clean_stages.length;
  }
  if (typeof progressRecord.clean_bitmask === 'number') {
    let count = 0;
    let b = progressRecord.clean_bitmask;
    while (b > 0) {
      if (b & 1) count++;
      b >>= 1;
    }
    return count;
  }
  return 0;
}
