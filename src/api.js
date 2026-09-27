/**
 * api.js — API client for Avalon
 */

import { session } from './session.js';

/**
 * Signing a player out is destructive — it drops their token, their cached
 * profile and whatever screen they were on — so it takes two consecutive
 * UNAUTHORIZED replies, not one. A single rejected call can be a backend
 * hiccup that only *looked* like an expired token, and students were being
 * thrown back to the login screen mid-quest because of it. Any successful
 * call resets the count.
 */
let unauthorizedStrikes = 0;
const UNAUTHORIZED_STRIKES_TO_SIGN_OUT = 2;

export async function apiCall(route, body = {}) {
  const payload = { ...body };
  if (session.token && payload.token === undefined) {
    payload.token = session.token;
  }

  let res;
  try {
    res = await fetch(`/api/${route}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (netErr) {
    // Offline, DNS, a dropped connection. Says nothing about the session.
    throw { code: 'NETWORK', message: 'No connection to the server. Try again in a moment.' };
  }

  let result;
  try {
    result = await res.json();
  } catch (parseErr) {
    throw { code: 'BACKEND_UNAVAILABLE', message: 'The server is busy. Try that again in a moment.' };
  }

  if (!result.ok) {
    if (result.error?.code === 'UNAUTHORIZED') {
      unauthorizedStrikes++;
      if (unauthorizedStrikes >= UNAUTHORIZED_STRIKES_TO_SIGN_OUT) {
        unauthorizedStrikes = 0;
        session.clear();
      }
    }
    throw result.error || { code: 'UNKNOWN_ERROR', message: 'An unknown error occurred.' };
  }

  unauthorizedStrikes = 0;
  return result.data !== undefined ? result.data : result;
}

export const api = {
  bootstrap: () => apiCall('bootstrap'),
  login: (identifier, password, cachedSalt) => apiCall('auth/login', { identifier, password, cachedSalt }),
  register: (email, password, displayName) => apiCall('auth/register', { email, password, displayName }),
  changePassword: (oldPassword, newPassword) => apiCall('auth/change-password', { oldPassword, newPassword }),
  claimTeam: (teamId, avatar, background, trinket) => apiCall('player/create', { role: '', teamId, avatar, background, trinket }),
  claimRoleAndTeam: (role, teamId, avatar, background, trinket) => apiCall('player/create', { role: role || '', teamId, avatar, background, trinket }),
  getTeamRoster: (teamId) => apiCall('team/roster', { teamId }),
  getMe: () => apiCall('player/me'),
  rename: (displayName) => apiCall('player/rename', { displayName }),
  updateSettings: (updates) => apiCall('player/update', updates),
  getQuestManifest: (questId) => apiCall('quest/manifest', { questId }),
  startQuest: (questId) => apiCall('quest/start', { questId }),
  gradeStage: (questId, stageIndex, payload, elapsedMs, hintUsed, gfxTier) =>
    apiCall('quest/grade', { questId, stageIndex, payload, elapsedMs, hintUsed, gfxTier }),
  getHint: (questId, stageIndex) => apiCall('quest/hint', { questId, stageIndex }),
  completeQuest: (questId) => apiCall('quest/complete', { questId }),
  gradeDemo: (stageIndex, payload) => apiCall('demo/grade', { stageIndex, payload }),

  /**
   * Learn track. These endpoints record progress and pay NO XP: nothing they
   * return may be handed to session.addXp, and nothing they write is read by
   * Scoring, so the Learn track can never move a player up the leaderboard.
   */
  getLearnProgress: () => apiCall('learn/progress'),
  learnStage: (worldId, questId, stageIndex) => apiCall('learn/stage', { worldId, questId, stageIndex }),
  learnComplete: (worldId, questId) => apiCall('learn/complete', { worldId, questId }),
  getLeaderboards: (scope) => apiCall('leaderboard', scope ? { scope } : {}),
  getProgression: () => apiCall('progression/me'),
  setLoadout: (loadout) => apiCall('loadout/set', loadout),
  getProfile: (playerId) => apiCall('profile/get', { playerId }),
  getGuildFeed: (teamId) => apiCall('guild/feed', { teamId }),
  useItem: (itemId, context) => apiCall('inventory/use', { itemId, context }),
  getEvents: () => apiCall('events/current'),
  
  // Admin
  adminResetPassword: (targetPlayerId, newPassword) => apiCall('admin/reset-password', { targetPlayerId, newPassword }),
  adminForceRename: (targetPlayerId, newDisplayName, reason) => apiCall('admin/force-rename', { targetPlayerId, newDisplayName, reason }),
  adminGrantXp: (targetPlayerId, amount, reason) => apiCall('admin/grant-xp', { targetPlayerId, amount, reason }),
  adminStats: () => apiCall('admin/stats')
};
