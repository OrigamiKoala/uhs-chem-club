/**
 * Events.gs — Deterministic weighted random events for Avalon
 */

function getSeasonSalt_() {
  var props = PropertiesService.getScriptProperties();
  return props.getProperty('SEASON_SALT') || 'avalon_season_1_long_dark_salt_2026';
}

var Events = {
  rollEventForTeam: function(questId, teamId) {
    var salt = getSeasonSalt_();
    var hashHex = sha256Hex(questId + '|' + teamId + '|' + salt);
    // Take first 8 hex chars (4 bytes)
    var num = parseInt(hashHex.substring(0, 8), 16);
    var rollValue = num % 110;

    var events = Db.getAll('Events');
    // Ensure stable order
    events.sort(function(a, b) { return a.event_id.localeCompare(b.event_id); });

    var accumulated = 0;
    var selectedEvent = events[0];
    for (var i = 0; i < events.length; i++) {
      accumulated += Number(events[i].weight || 0);
      if (rollValue < accumulated) {
        selectedEvent = events[i];
        break;
      }
    }

    var rollId = generateId('roll');

    return {
      roll_id: rollId,
      quest_id: questId,
      team_id: teamId,
      roll_value: rollValue,
      event: selectedEvent
    };
  },

  getActiveEvents: function() {
    var cfg = Db.findOne('Config', function(c) { return c.key === 'active_quest'; });
    var questId = (cfg && cfg.value) ? cfg.value : 'q1';
    var teams = Db.getAll('Teams');

    var results = {};
    for (var i = 0; i < teams.length; i++) {
      var tId = teams[i].team_id;
      var rollResult = Events.rollEventForTeam(questId, tId);
      results[tId] = rollResult.event;
    }
    return results;
  },

  getTeamActiveEvent: function(teamId) {
    if (!teamId) return null;
    var all = Events.getActiveEvents();
    return all[teamId] || null;
  }
};
