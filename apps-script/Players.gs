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

    return {
      player: sanitizePlayer_(player),
      team: team,
      xp: totalXp,
      level: level,
      progress: progress,
      inventory: inventory
    };
  },

  claimTeamSlot: function(playerId, roleOrTeamId, teamIdOpt, avatarOpt) {
    var role = '';
    var teamId = roleOrTeamId;
    var avatar = teamIdOpt;

    // Handle legacy signature (playerId, role, teamId, avatar)
    if (teamIdOpt && typeof teamIdOpt === 'string' && teamIdOpt.length > 0 && !teamIdOpt.startsWith('{')) {
      teamId = teamIdOpt;
      avatar = avatarOpt;
    }

    teamId = ({ terra: 'earth', zephyr: 'air', ignis: 'fire', thalassa: 'water' }[teamId] || teamId);

    var team = Db.findOne('Teams', function(t) { return t.team_id === teamId; });
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

      Db.update('Players', function(p) { return p.player_id === playerId; }, {
        role: role,
        team_id: teamId,
        avatar_json: avatarStr,
        last_seen_at: isoNow()
      });

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
    var players = Db.getAll('Players');
    var cfgCap = 12;
    var cfg = Db.findOne('Config', function(c) { return c.key === 'team_slot_cap'; });
    if (cfg && cfg.value) cfgCap = Number(cfg.value);

    var counts = {};
    for (var i = 0; i < players.length; i++) {
      var tId = players[i].team_id;
      if (tId && players[i].status !== 'banned') {
        counts[tId] = (counts[tId] || 0) + 1;
      }
    }

    var result = teams.map(function(t) {
      var cap = t.slot_cap_override ? Number(t.slot_cap_override) : cfgCap;
      var count = counts[t.team_id] || 0;
      return {
        team_id: t.team_id,
        name: t.name,
        corp_name: t.corp_name,
        ship_name: t.ship_name,
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
  }
};
