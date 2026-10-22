/**
 * guest.js — answers the API for a guest, so nothing a guest does reaches the Sheet.
 *
 * A guest plays the whole game from localStorage. `api.js` hands every call
 * made while `session.isGuest` to `guestCall` instead of the network:
 *
 *   - PUBLIC routes (standings, rosters, the quest manifest, public profiles)
 *     go to the server WITHOUT a token, so the guest still sees the real boards.
 *   - Bootstrap goes the same way and has the guest's local profile laid on top,
 *     so `main.js` never reads a missing player as a dead session.
 *   - Profile writes (guild pick, rename, avatar, loadout, quest completion) are
 *     answered here from the session, which already wrote them to localStorage.
 *   - Everything else (grading reports, Learn rows, state sync, admin) is
 *     refused with GUEST_LOCAL. Every such caller is fire-and-forget or already
 *     falls back to its local copy, which is exactly the guest's whole save.
 *
 * Nothing here ever sends `session.token` anywhere.
 */

import { session } from './session.js';

const PUBLIC_ROUTES = new Set([
  'leaderboard',
  'team/roster',
  'quest/manifest',
  'profile/get',
  'guild/feed',
  'events/current',
  'demo/grade'
]);

const QUEST_COMPLETE_ITEM = 'salvage_pylon_insulator';

function guestError(message = 'Guest progress stays on this device.') {
  return { code: 'GUEST_LOCAL', message };
}

/**
 * The guest's profile in the shape player/me returns. It hands back the
 * session's own objects and leaves out xp/level, so a reply that resolves late
 * (after a Promise.all, say) can never roll the guest's XP or progress back.
 */
export function guestProfile() {
  if (!Array.isArray(session.inventory)) session.inventory = [];
  if (!Array.isArray(session.progress)) session.progress = [];
  return {
    player: session.player,
    team: session.team,
    isAdmin: false,
    inventory: session.inventory,
    progress: session.progress
  };
}

function addItem(itemId) {
  if (!itemId) return;
  if (!Array.isArray(session.inventory)) session.inventory = [];
  if (session.inventory.some(i => i.item_id === itemId)) return;
  session.inventory.push({ inv_id: `inv_guest_${Date.now().toString(36)}`, player_id: 'guest', item_id: itemId, qty: 1 });
}

/**
 * @param {string} route
 * @param {object} body the caller's body (never carries the token)
 * @param {(route: string, body: object) => Promise<any>} publicCall a tokenless POST
 */
export async function guestCall(route, body = {}, publicCall) {
  const clean = { ...body };
  delete clean.token;

  if (route === 'bootstrap') {
    const data = await publicCall('bootstrap', {});
    const boot = (data && typeof data === 'object') ? data : {};
    return { ...boot, player: guestProfile() };
  }

  if (PUBLIC_ROUTES.has(route)) return publicCall(route, clean);

  const player = session.player || (session.player = { player_id: 'guest', display_name: 'Guest' });

  switch (route) {
    case 'player/me':
      return guestProfile();

    case 'player/create': {
      const teamId = String(clean.teamId || '').toLowerCase().trim();
      player.team_id = teamId;
      player.role = clean.role || '';
      if (clean.avatar) player.avatar_json = typeof clean.avatar === 'object' ? JSON.stringify(clean.avatar) : clean.avatar;
      if (clean.background) player.background = clean.background;
      if (clean.trinket) {
        player.trinket = clean.trinket;
        addItem(clean.trinket);
      }
      const team = (session.teams || []).find(t => t.team_id === teamId) || { team_id: teamId };
      return { ...guestProfile(), team };
    }

    case 'player/update':
      if (clean.avatar_json) {
        player.avatar_json = typeof clean.avatar_json === 'object' ? JSON.stringify(clean.avatar_json) : clean.avatar_json;
      }
      if (typeof clean.board_optout === 'boolean') player.board_optout = clean.board_optout;
      return guestProfile();

    case 'player/rename':
      if (clean.displayName) {
        player.display_name = String(clean.displayName);
        player.display_name_lc = player.display_name.toLowerCase();
      }
      return guestProfile();

    case 'loadout/set':
      return { loadout: session.loadout || {} };

    case 'quest/complete': {
      // The session pays the completion bonus itself unless this says the quest
      // was already banked, so a guest's replay pays nothing, just like an account's.
      const questId = clean.questId || 'q1';
      if (!Array.isArray(session.progress)) session.progress = [];
      let entry = session.progress.find(p => p.quest_id === questId);
      if (!entry) {
        entry = { quest_id: questId, stage_reached: 0 };
        session.progress.push(entry);
      }
      const alreadyCompleted = Boolean(entry.completed_at);
      if (!alreadyCompleted) {
        entry.completed_at = new Date().toISOString();
        addItem(QUEST_COMPLETE_ITEM);
      }
      session.saveSession();
      return { alreadyCompleted, awardedItem: QUEST_COMPLETE_ITEM, newLevel: session.level };
    }

    case 'auth/change-password':
      throw guestError('A guest has no password. Sign out and create an account to keep progress on the server.');

    case 'inventory/use':
      throw guestError('Items cannot be used as a guest.');

    default:
      // Grading reports, Learn rows, state sync, progression, admin: local only.
      throw guestError();
  }
}
