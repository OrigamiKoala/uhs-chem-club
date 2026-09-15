/**
 * api.js — API client for Avalon
 */

import { session } from './session.js';
import { showToast } from './ui/toast.js';

export async function apiCall(route, body = {}) {
  const payload = { ...body };
  if (session.token && payload.token === undefined) {
    payload.token = session.token;
  }

  try {
    const res = await fetch(`/api/${route}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await res.json();
    if (!result.ok) {
      if (result.error?.code === 'UNAUTHORIZED') {
        session.clear();
      }
      throw result.error || { code: 'UNKNOWN_ERROR', message: 'An unknown error occurred.' };
    }
    return result.data !== undefined ? result.data : result;
  } catch (err) {
    if (err.message && err.code !== 'RATE_LIMITED') {
      // Don't auto-toast if callers want to handle it
    }
    throw err;
  }
}

export const api = {
  bootstrap: () => apiCall('bootstrap'),
  login: (identifier, password) => apiCall('auth/login', { identifier, password }),
  register: (email, password, displayName) => apiCall('auth/register', { email, password, displayName }),
  changePassword: (oldPassword, newPassword) => apiCall('auth/change-password', { oldPassword, newPassword }),
  claimTeam: (teamId, avatar) => apiCall('player/create', { role: '', teamId, avatar }),
  claimRoleAndTeam: (role, teamId, avatar) => apiCall('player/create', { role: role || '', teamId, avatar }),
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
  getLeaderboards: () => apiCall('leaderboard'),
  useItem: (itemId, context) => apiCall('inventory/use', { itemId, context }),
  getEvents: () => apiCall('events/current'),
  
  // Admin
  adminResetPassword: (targetPlayerId, newPassword) => apiCall('admin/reset-password', { targetPlayerId, newPassword }),
  adminForceRename: (targetPlayerId, newDisplayName, reason) => apiCall('admin/force-rename', { targetPlayerId, newDisplayName, reason }),
  adminGrantXp: (targetPlayerId, amount, reason) => apiCall('admin/grant-xp', { targetPlayerId, amount, reason }),
  adminStats: () => apiCall('admin/stats')
};
