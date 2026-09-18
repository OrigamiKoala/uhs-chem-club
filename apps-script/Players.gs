/**
 * Players.gs — Profile, team balancing, and onboarding for Avalon
 */

var VALID_ROLES = [];

var Players = {
  getMe: function(playerId) {
    var player = Db.findOne('Players', function(p) { return p.player_id === playerId; });
    if (!player) throw { code: 'NOT_FOUND', message: 'Player not found.' };

    var progress = Db.find('Progress', function(pr) { return pr.player_id === playerId; });
    var inventory = Db.find('Inventory', function(i) { return i.player_id === playerId && Number(i.qty) > 0; });
    var totalXp = Scoring.computePlayerTotalXp(playerId);
    var level = Scoring.computeLevel(totalXp);

    var team = null;
    if (player.team_id) {
      var normTid = ({ terra: 'earth', zephyr: 'air', ignis: 'fire', thalassa: 'water' }[player.team_id] || player.team_id);
      team = Db.findOne('Teams', function(t) { return t.team_id === normTid || t.team_id === player.team_id; });
    }

    // Learn rows ride along so the client can restore the study road at boot.
    // They carry no XP and are not part of `progress`.
    var learn = [];
    try { learn = Learn.getProgress(playerId).learn; } catch (e) {}

    return {
      player: sanitizePlayer_(player),
      team: team,
      xp: totalXp,
      level: level,
      progress: progress,
      inventory: inventory,
      learn: learn
    };
  },

  claimTeamSlot: function(playerId, roleOrTeamId, teamIdOpt, avatarOpt, backgroundOpt, trinketOpt) {
    var role = '';
    var teamId = roleOrTeamId;
    var avatar = teamIdOpt;

    // Handle legacy signature (playerId, role, teamId, avatar, background, trinket)
    if (teamIdOpt && typeof teamIdOpt === 'string' && teamIdOpt.length > 0 && !teamIdOpt.startsWith('{')) {
      teamId = teamIdOpt;
      avatar = avatarOpt;
    }

    teamId = ({ terra: 'earth', zephyr: 'air', ignis: 'fire', thalassa: 'water' }[String(teamId || '').toLowerCase()] || teamId);

    var team = Db.findOne('Teams', function(t) { return t.team_id === teamId; });
    if (!team) {
      Db.ensureTeamsMigrated();
      team = Db.findOne('Teams', function(t) { return t.team_id === teamId; });
    }
    if (!team) {
      var reverseMap = { earth: 'terra', air: 'zephyr', fire: 'ignis', water: 'thalassa' };
      var legacyId = reverseMap[teamId];
      if (legacyId) {
        team = Db.findOne('Teams', function(t) { return t.team_id === legacyId; });
      }
    }
    if (!team) {
      throw { code: 'INVALID_TEAM', message: 'Invalid team selected.' };
    }

    var lock = LockService.getScriptLock();
    if (!lock.tryLock(20000)) {
      throw { code: 'BUSY', message: 'Team registration is busy. Please retry.' };
    }

    try {
      var player = Db.findOne('Players', function(p) { return p.player_id === playerId; });
      if (!player) throw { code: 'NOT_FOUND', message: 'Player not found.' };

      if (player.team_id) {
        throw { code: 'ALREADY_ASSIGNED', message: 'Player already has a team.' };
      }

      // Read cap
      var cap = 12;
      if (team.slot_cap_override) {
        cap = Number(team.slot_cap_override);
      } else {
        var cfg = Db.findOne('Config', function(c) { return c.key === 'team_slot_cap'; });
        if (cfg && cfg.value) cap = Number(cfg.value);
      }

      // Count existing members
      var members = Db.find('Players', function(p) { return p.team_id === teamId && p.status !== 'banned'; });
      if (members.length >= cap) {
        throw { code: 'TEAM_FULL', message: team.ship_name + ' is full (' + members.length + '/' + cap + '). Pick another ship.' };
      }

      var avatarStr = typeof avatar === 'object' ? JSON.stringify(avatar) : (avatar || player.avatar_json);

      var patch = {
        role: role,
        team_id: teamId,
        avatar_json: avatarStr,
        last_seen_at: isoNow()
      };
      if (backgroundOpt) patch.background = backgroundOpt;
      if (trinketOpt) {
        patch.trinket = trinketOpt;
        var existingTrinket = Db.findOne('Inventory', function(i) {
          return i.player_id === playerId && i.item_id === trinketOpt;
        });
        if (!existingTrinket) {
          Db.append('Inventory', {
            inv_id: generateId('inv'),
            player_id: playerId,
            item_id: trinketOpt,
            qty: 1,
            acquired_at: isoNow()
          });
        }
      }

      Db.update('Players', function(p) { return p.player_id === playerId; }, patch);

      Cache.drop('teams:slots');

      return Players.getMe(playerId);
    } finally {
      lock.releaseLock();
    }
  },

  rename: function(playerId, newDisplayName) {
    var player = Db.findOne('Players', function(p) { return p.player_id === playerId; });
    if (!player) throw { code: 'NOT_FOUND', message: 'Player not found.' };

    var val = validateDisplayName(newDisplayName);
    if (!val.valid) throw { code: 'INVALID_DISPLAY_NAME', message: val.message };

    var newTrimmed = newDisplayName.trim();
    var newLc = newTrimmed.toLowerCase();
    var newNorm = normalizeConfusables(newTrimmed);

    // Check cooldown
    var cooldownDays = 7;
    var cfg = Db.findOne('Config', function(c) { return c.key === 'name_change_cooldown_days'; });
    if (cfg && cfg.value) cooldownDays = Number(cfg.value);

    if (player.name_changed_at) {
      var lastChange = new Date(player.name_changed_at).getTime();
      var diffDays = (Date.now() - lastChange) / (1000 * 60 * 60 * 24);
      if (diffDays < cooldownDays) {
        var daysLeft = Math.ceil(cooldownDays - diffDays);
        throw { code: 'COOLDOWN_ACTIVE', message: 'You can change your name again in ' + daysLeft + ' day(s).' };
      }
    }

    // Check collision
    var existing = Db.findOne('Players', function(p) {
      if (p.player_id === playerId) return false;
      if (p.display_name_lc === newLc) return true;
      if (normalizeConfusables(p.display_name) === newNorm) return true;
      return false;
    });
    if (existing) {
      throw { code: 'NAME_TAKEN', message: 'That display name is already taken or too similar.' };
    }

    var oldName = player.display_name;
    var now = isoNow();

    Db.update('Players', function(p) { return p.player_id === playerId; }, {
      display_name: newTrimmed,
      display_name_lc: newLc,
      name_changed_at: now
    });

    Db.append('NameHistory', {
      ts: now,
      player_id: playerId,
      old_name: oldName,
      new_name: newTrimmed,
      changed_by: 'self',
      reason: 'Player rename'
    });

    return Players.getMe(playerId);
  },

  updateSettings: function(playerId, updates) {
    var patch = {};
    if (updates.avatar_json) patch.avatar_json = typeof updates.avatar_json === 'object' ? JSON.stringify(updates.avatar_json) : updates.avatar_json;
    if (updates.gfxTierPref) patch.gfx_tier_pref = updates.gfxTierPref;
    patch.last_seen_at = isoNow();

    Db.update('Players', function(p) { return p.player_id === playerId; }, patch);
    return Players.getMe(playerId);
  },

  getTeamSlots: function() {
    var cached = Cache.get('teams:slots');
    if (cached) return cached;

    var teams = Db.getAll('Teams');
    var hasLegacy = false;
    for (var lt = 0; lt < teams.length; lt++) {
      var checkTid = String(teams[lt].team_id || '').toLowerCase();
      if (checkTid === 'terra' || checkTid === 'zephyr' || checkTid === 'ignis' || checkTid === 'thalassa') {
        hasLegacy = true;
        break;
      }
    }
    if (hasLegacy || teams.length === 0) {
      Db.ensureTeamsMigrated();
      teams = Db.getAll('Teams');
    }

    var players = Db.getAll('Players');
    var cfgCap = 12;
    var cfg = Db.findOne('Config', function(c) { return c.key === 'team_slot_cap'; });
    if (cfg && cfg.value) cfgCap = Number(cfg.value);

    var counts = {};
    for (var i = 0; i < players.length; i++) {
      var tId = players[i].team_id;
      if (tId && players[i].status !== 'banned') {
        var normT = ({ terra: 'earth', zephyr: 'air', ignis: 'fire', thalassa: 'water' }[String(tId).toLowerCase()] || tId);
        counts[normT] = (counts[normT] || 0) + 1;
      }
    }

    var properNames = { earth: 'Earth', air: 'Air', fire: 'Fire', water: 'Water' };

    var result = teams.map(function(t) {
      var normId = ({ terra: 'earth', zephyr: 'air', ignis: 'fire', thalassa: 'water' }[String(t.team_id).toLowerCase()] || t.team_id);
      var cap = t.slot_cap_override ? Number(t.slot_cap_override) : cfgCap;
      var count = counts[normId] || counts[t.team_id] || 0;
      var displayName = properNames[normId] || t.name || normId;

      return {
        team_id: normId,
        name: displayName,
        corp_name: displayName,
        ship_name: displayName,
        color_hex: t.color_hex,
        accent_hex: t.accent_hex,
        lore: t.lore,
        emblem: t.emblem,
        cap: cap,
        count: count,
        available: Math.max(0, cap - count)
      };
    });

    Cache.put('teams:slots', result, 15);
    return result;
  },

  getTeamRoster: function(teamId) {
    var normId = ({ terra: 'earth', zephyr: 'air', ignis: 'fire', thalassa: 'water' }[String(teamId || '').toLowerCase()] || teamId || 'fire');
    try {
      var members = Db.find('Players', function(p) {
        var pTid = ({ terra: 'earth', zephyr: 'air', ignis: 'fire', thalassa: 'water' }[String(p.team_id || '').toLowerCase()] || p.team_id);
        return pTid === normId && p.status !== 'banned';
      });
      return {
        team_id: normId,
        members: (members || []).map(function(m) {
          return {
            display_name: m.display_name,
            trinket: m.trinket || ''
          };
        })
      };
    } catch (e) {
      return {
        team_id: normId,
        members: []
      };
    }
  }
};
