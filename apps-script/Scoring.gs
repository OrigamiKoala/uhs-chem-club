var MAX_LEVEL = 12;

var LEVEL_THRESHOLDS = [
  0,
  0,
  60,
  150,
  270,
  420,
  600,
  820,
  1080,
  1380,
  1720,
  2100,
  2520
];

var LEVEL_TITLES = [
  { maxLevel: 2, title: 'Cadet' },
  { maxLevel: 4, title: 'Scout' },
  { maxLevel: 6, title: 'Navigator' },
  { maxLevel: 8, title: 'Voyager' },
  { maxLevel: 10, title: 'Pathfinder' },
  { maxLevel: 12, title: 'Starmarshal' }
];

var Scoring = {
  computeLevel: function(totalXp) {
    if (!totalXp || totalXp <= 0) return 1;
    var lvl = 1;
    for (var i = 1; i <= MAX_LEVEL; i++) {
      if (totalXp >= LEVEL_THRESHOLDS[i]) lvl = i;
      else break;
    }
    return Math.min(MAX_LEVEL, Math.max(1, lvl));
  },

  getLevelTitle: function(level) {
    var lvl = Math.min(MAX_LEVEL, Math.max(1, level || 1));
    for (var i = 0; i < LEVEL_TITLES.length; i++) {
      if (lvl <= LEVEL_TITLES[i].maxLevel) return LEVEL_TITLES[i].title;
    }
    return 'Starmarshal';
  },

  /**
   * Total XP for one player. Reads Submissions and Progress only — the Learn
   * track writes to neither, which is what keeps the study road out of the
   * leaderboard. Do not widen this to LearnProgress.
   */
  computePlayerTotalXp: function(playerId) {
    var subs = Db.find('Submissions', function(s) {
      return s.player_id === playerId && isTrueFlag(s.correct);
    });
    var total = 0;
    // Track best XP per stage to avoid duplicate awarding on replay
    var stageBest = {};
    for (var i = 0; i < subs.length; i++) {
      var key = subs[i].quest_id + ':' + subs[i].stage_index;
      var xp = Number(subs[i].xp_awarded || 0);
      if (!stageBest[key] || xp > stageBest[key]) {
        stageBest[key] = xp;
      }
    }
    for (var k in stageBest) {
      total += stageBest[k];
    }

    // Add completion bonuses
    var progs = Db.find('Progress', function(p) {
      return p.player_id === playerId && p.completed_at;
    });
    for (var j = 0; j < progs.length; j++) {
      total += 40 + 25; // Completion + on-time bonus
    }

    return total;
  },

  computePlayerWeekXp: function(playerId, cutoffIso) {
    var subs = Db.find('Submissions', function(s) {
      return s.player_id === playerId && isTrueFlag(s.correct) && s.ts && s.ts >= cutoffIso;
    });
    var stageBest = {};
    for (var i = 0; i < subs.length; i++) {
      var key = subs[i].quest_id + ':' + subs[i].stage_index;
      var xp = Number(subs[i].xp_awarded || 0);
      if (!stageBest[key] || xp > stageBest[key]) {
        stageBest[key] = xp;
      }
    }
    var total = 0;
    for (var k in stageBest) {
      total += stageBest[k];
    }
    return total;
  },

  getLeaderboards: function(requestingPlayerId, scope) {
    var sc = scope || 'all';
    var cached = Cache.get('lb:' + sc);
    if (cached) {
      if (requestingPlayerId) {
        cached.myRank = findMyRank_(cached.fullIndividual || cached.individual, requestingPlayerId);
      }
      return cached;
    }

    var players = Db.getAll('Players');
    var teams = Db.getAll('Teams');

    var now = new Date();
    var cutoff = new Date(now.getTime() - 7 * 86400000).toISOString();

    var requestingPlayer = requestingPlayerId
      ? Db.findOne('Players', function(p) { return p.player_id === requestingPlayerId; })
      : null;

    // Calculate individual XP
    var individual = [];
    var teamMembers = {};
    var teamActiveMembers = {};
    var teamXpMap = {};

    for (var t = 0; t < teams.length; t++) {
      var tId = teams[t].team_id;
      teamMembers[tId] = 0;
      teamActiveMembers[tId] = 0;
      teamXpMap[tId] = [];
    }

    for (var p = 0; p < players.length; p++) {
      var player = players[p];
      if (player.status === 'banned') continue;

      var xp = sc === 'week'
        ? Scoring.computePlayerWeekXp(player.player_id, cutoff)
        : Scoring.computePlayerTotalXp(player.player_id);
      var lvl = Scoring.computeLevel(xp);

      var loadout = {};
      try {
        if (player.loadout_json) loadout = JSON.parse(player.loadout_json);
      } catch (e) {}

      var isMe = requestingPlayerId && player.player_id === requestingPlayerId;
      var displayName = player.display_name;
      if (player.board_optout && !isMe) {
        displayName = 'Crew · ' + String(player.team_id || 'avalon').toUpperCase();
      }

      individual.push({
        player_id: player.player_id,
        display_name: displayName,
        team_id: player.team_id,
        role: player.role,
        xp: xp,
        level: lvl,
        level_title: Scoring.getLevelTitle(lvl),
        nameplate: loadout.nameplate || 'default',
        title: loadout.title || '',
        pinned_plates: Array.isArray(loadout.pinnedPlates) ? loadout.pinnedPlates : []
      });

      if (player.team_id && teamMembers.hasOwnProperty(player.team_id)) {
        teamMembers[player.team_id]++;
        if (xp > 0) {
          teamActiveMembers[player.team_id]++;
          teamXpMap[player.team_id].push(xp);
        }
      }
    }

    if (sc === 'guild' && requestingPlayer && requestingPlayer.team_id) {
      individual = individual.filter(function(r) { return r.team_id === requestingPlayer.team_id; });
    }

    individual.sort(function(a, b) { return b.xp - a.xp; });

    // Assign rank
    for (var r = 0; r < individual.length; r++) {
      individual[r].rank = r + 1;
    }

    // Team Leaderboard calculation (§4.4)
    var teamScores = teams.map(function(tm) {
      var tId = tm.team_id;
      var rosterSize = teamMembers[tId] || 0;
      var activeCount = teamActiveMembers[tId] || 0;
      var xpList = teamXpMap[tId] || [];

      var meanXp = 0;
      if (xpList.length > 0) {
        var sum = 0;
        for (var i = 0; i < xpList.length; i++) sum += xpList[i];
        meanXp = sum / xpList.length;
      }

      var partMult = 1.0;
      if (rosterSize > 0) {
        partMult = 0.75 + (0.5 * (activeCount / rosterSize));
      }

      var finalScore = Math.round(meanXp * partMult);

      return {
        team_id: tm.team_id,
        name: tm.name,
        corp_name: tm.corp_name,
        ship_name: tm.ship_name,
        color_hex: tm.color_hex,
        accent_hex: tm.accent_hex,
        emblem: tm.emblem,
        roster_size: rosterSize,
        active_members: activeCount,
        team_score: finalScore
      };
    });

    teamScores.sort(function(a, b) { return b.team_score - a.team_score; });
    for (var tr = 0; tr < teamScores.length; tr++) {
      teamScores[tr].rank = tr + 1;
    }

    var top50 = individual.slice(0, 50);

    var result = {
      individual: top50,
      fullIndividual: individual,
      teams: teamScores
    };

    Cache.put('lb:' + sc, result, 60);

    if (requestingPlayerId) {
      result.myRank = findMyRank_(individual, requestingPlayerId);
    }

    return result;
  }
};

function findMyRank_(fullList, requestingPlayerId) {
  for (var i = 0; i < fullList.length; i++) {
    if (fullList[i].player_id === requestingPlayerId) {
      return {
        rank: fullList[i].rank,
        display_name: fullList[i].display_name,
        xp: fullList[i].xp,
        level: fullList[i].level
      };
    }
  }
  return null;
}

