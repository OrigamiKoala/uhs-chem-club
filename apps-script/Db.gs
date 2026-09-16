/**
 * Db.gs — Sheet DAO for Avalon
 * ONLY file that touches SpreadsheetApp.
 * Row 1 is headers; maps header names -> column indices dynamically.
 */

var DB_SCHEMA = {
  Config: ['key', 'value'],
  Teams: ['team_id', 'name', 'corp_name', 'ship_name', 'color_hex', 'accent_hex', 'slot_cap_override', 'lore', 'emblem'],
  Players: ['player_id', 'email_lc', 'pw_hash', 'pw_salt', 'pw_algo', 'display_name', 'display_name_lc', 'name_changed_at', 'role', 'team_id', 'avatar_json', 'created_at', 'last_seen_at', 'status', 'gfx_tier_pref', 'notes'],
  Quests: ['quest_id', 'title', 'world', 'blurb', 'scene_id', 'cover_image', 'release_at', 'close_at', 'status', 'base_xp', 'stage_count', 'item_pool'],
  QuestStages: ['quest_id', 'stage_index', 'kind', 'xp', 'max_attempts', 'hint_text', 'hint_cost', 'answer_json', 'tolerance', 'reveal_text', 'scene_config'],
  Submissions: ['submission_id', 'ts', 'player_id', 'quest_id', 'stage_index', 'attempt_no', 'payload_json', 'correct', 'xp_awarded', 'elapsed_ms', 'hint_used', 'gfx_tier', 'ip_hash'],
  Progress: ['player_id', 'quest_id', 'stage_reached', 'completed_at', 'xp_earned', 'hints_used', 'items_awarded', 'updated_at'],
  Items: ['item_id', 'name', 'flavor', 'model_id', 'rarity', 'effect_code', 'consumable', 'max_stack'],
  Inventory: ['inv_id', 'player_id', 'item_id', 'qty', 'acquired_at', 'source'],
  Events: ['event_id', 'name', 'description', 'weight', 'effect_code', 'duration_quests', 'polarity', 'art'],
  EventLog: ['roll_id', 'quest_id', 'team_id', 'roll_value', 'event_id', 'seed', 'rolled_at'],
  Sessions: ['jti', 'player_id', 'revoked_at', 'reason'],
  NameHistory: ['ts', 'player_id', 'old_name', 'new_name', 'changed_by', 'reason'],
  AuditLog: ['ts', 'actor', 'action', 'target', 'detail_json']
};

var _sheetCache = {};
var _headerIndexCache = {};

function getDb_() {
  var props = PropertiesService.getScriptProperties();
  var sheetId = props.getProperty('SPREADSHEET_ID');
  if (sheetId) {
    return SpreadsheetApp.openById(sheetId);
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

function getSheet_(tabName) {
  if (_sheetCache[tabName]) return _sheetCache[tabName];
  var ss = getDb_();
  var sheet = ss.getSheetByName(tabName);
  if (!sheet) {
    sheet = ss.insertSheet(tabName);
    var headers = DB_SCHEMA[tabName] || [];
    if (headers.length > 0) {
      sheet.appendRow(headers);
    }
  }
  _sheetCache[tabName] = sheet;
  return sheet;
}

function getHeaderMap_(tabName) {
  if (_headerIndexCache[tabName]) return _headerIndexCache[tabName];
  var sheet = getSheet_(tabName);
  var lastCol = Math.max(sheet.getLastColumn(), 1);
  var row1 = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var map = {};
  for (var i = 0; i < row1.length; i++) {
    var h = String(row1[i]).trim();
    if (h) map[h] = i;
  }
  _headerIndexCache[tabName] = map;
  return map;
}

var Db = {
  initDb: function() {
    var ss = getDb_();
    var tabNames = Object.keys(DB_SCHEMA);
    for (var i = 0; i < tabNames.length; i++) {
      var tab = tabNames[i];
      var s = ss.getSheetByName(tab);
      if (!s) {
        s = ss.insertSheet(tab);
        s.appendRow(DB_SCHEMA[tab]);
      } else {
        if (s.getLastRow() === 0) {
          s.appendRow(DB_SCHEMA[tab]);
        }
      }
    }
    Db.seedDefaultsIfEmpty();
  },

  seedDefaultsIfEmpty: function() {
    // Config
    var config = Db.getAll('Config');
    if (config.length === 0) {
      var defaultConfigs = [
        { key: 'season_name', value: 'Season I: The Long Dark' },
        { key: 'active_quest', value: 'q1' },
        { key: 'team_slot_cap', value: '12' },
        { key: 'signups_open', value: 'TRUE' },
        { key: 'admin_emails', value: 'admin@uhschem.club' },
        { key: 'xp_multiplier_global', value: '1.0' },
        { key: 'demo_mode_enabled', value: 'TRUE' },
        { key: 'min_password_len', value: '8' },
        { key: 'name_change_cooldown_days', value: '7' },
        { key: 'maintenance_message', value: '' }
      ];
      for (var c = 0; c < defaultConfigs.length; c++) {
        Db.append('Config', defaultConfigs[c]);
      }
    }

    // Teams
    Db.ensureTeamsMigrated();
  },

  ensureTeamsMigrated: function() {
    var defaultTeams = [
      { team_id: 'earth', name: 'Earth', corp_name: 'Earth', ship_name: 'Earth', color_hex: '#241f14', accent_hex: '#8a7148', slot_cap_override: '', lore: '', emblem: 'geo' },
      { team_id: 'air', name: 'Air', corp_name: 'Air', ship_name: 'Air', color_hex: '#1a2226', accent_hex: '#75818a', slot_cap_override: '', lore: '', emblem: 'aero' },
      { team_id: 'fire', name: 'Fire', corp_name: 'Fire', ship_name: 'Fire', color_hex: '#2a1a0f', accent_hex: '#9c5423', slot_cap_override: '', lore: '', emblem: 'pyro' },
      { team_id: 'water', name: 'Water', corp_name: 'Water', ship_name: 'Water', color_hex: '#12231f', accent_hex: '#3f7d76', slot_cap_override: '', lore: '', emblem: 'hydro' }
    ];

    var aliasMap = {
      terra: 'earth',
      zephyr: 'air',
      ignis: 'fire',
      thalassa: 'water'
    };

    var properNames = {
      earth: 'Earth',
      air: 'Air',
      fire: 'Fire',
      water: 'Water'
    };

    var teams = Db.getAll('Teams');
    if (teams.length === 0) {
      for (var t = 0; t < defaultTeams.length; t++) {
        Db.append('Teams', defaultTeams[t]);
      }
    } else {
      var needsCacheDrop = false;
      for (var i = 0; i < teams.length; i++) {
        var row = teams[i];
        var oldId = String(row.team_id || '').toLowerCase().trim();
        var newId = aliasMap[oldId] || oldId;
        var targetName = properNames[newId] || properNames[oldId];

        if (aliasMap[oldId] || (targetName && row.name !== targetName)) {
          Db.update('Teams', function(r) { return r.team_id === row.team_id; }, {
            team_id: newId,
            name: targetName || properNames[newId],
            corp_name: targetName || properNames[newId],
            ship_name: targetName || properNames[newId]
          });
          needsCacheDrop = true;
        }
      }

      // Ensure all 4 teams exist
      var updatedTeams = Db.getAll('Teams');
      var existingIds = {};
      for (var j = 0; j < updatedTeams.length; j++) {
        existingIds[String(updatedTeams[j].team_id || '').toLowerCase()] = true;
      }
      for (var k = 0; k < defaultTeams.length; k++) {
        if (!existingIds[defaultTeams[k].team_id]) {
          Db.append('Teams', defaultTeams[k]);
          needsCacheDrop = true;
        }
      }

      // Migrate any legacy team IDs in Players
      var players = Db.getAll('Players');
      for (var p = 0; p < players.length; p++) {
        var pTid = String(players[p].team_id || '').toLowerCase().trim();
        if (aliasMap[pTid]) {
          Db.update('Players', function(pl) { return pl.player_id === players[p].player_id; }, {
            team_id: aliasMap[pTid]
          });
          needsCacheDrop = true;
        }
      }

      if (needsCacheDrop) {
        Cache.drop('teams:slots');
        Cache.drop('bootstrap:public');
      }
    }

    // Items
    var items = Db.getAll('Items');
    if (items.length === 0) {
      var defaultItems = [
        { item_id: 'hint_chip', name: 'Hint Chip', flavor: 'Decompiled scanner diagnostic module.', model_id: 'chip', rarity: 'common', effect_code: 'free_hint', consumable: 'TRUE', max_stack: 10 },
        { item_id: 'spare_coolant', name: 'Spare Coolant', flavor: 'Cryogenic reserve canister.', model_id: 'canister', rarity: 'common', effect_code: 'restore_attempt', consumable: 'TRUE', max_stack: 5 },
        { item_id: 'overclock_module', name: 'Overclock Module', flavor: 'Bypasses standard safety thresholds.', model_id: 'cube', rarity: 'rare', effect_code: 'xp_boost_25', consumable: 'TRUE', max_stack: 3 },
        { item_id: 'deflector_plate', name: 'Deflector Plate', flavor: 'Ablative particle shield segment.', model_id: 'shield', rarity: 'rare', effect_code: 'negate_bad_event', consumable: 'TRUE', max_stack: 2 },
        { item_id: 'scanner_upgrade', name: 'Scanner Upgrade', flavor: 'Wideband spectrographic lens.', model_id: 'lens', rarity: 'rare', effect_code: 'reveal_legend', consumable: 'TRUE', max_stack: 1 },
        { item_id: 'star_chart', name: 'Star Chart', flavor: 'Navigational survey of abandoned sectors.', model_id: 'scroll', rarity: 'epic', effect_code: 'skip_stage_half_xp', consumable: 'TRUE', max_stack: 1 },
        { item_id: 'resonance_key', name: 'Resonance Key', flavor: 'Vibrating crystal matrix attuned to alien locks.', model_id: 'key', rarity: 'epic', effect_code: 'flat_50_xp', consumable: 'TRUE', max_stack: 1 }
      ];
      for (var it = 0; it < defaultItems.length; it++) {
        Db.append('Items', defaultItems[it]);
      }
    }

    // Events
    var events = Db.getAll('Events');
    if (events.length === 0) {
      var defaultEvents = [
        { event_id: 'quiet_space', name: 'Quiet Space', description: 'Clear skies across the local sector. Normal operations.', weight: 30, effect_code: 'none', duration_quests: 1, polarity: 'neutral', art: 'stars' },
        { event_id: 'slipstream', name: 'Slipstream Current', description: 'Gravitational wave accelerates telemetry (+15% XP).', weight: 12, effect_code: 'xp_plus_15', duration_quests: 1, polarity: 'good', art: 'stream' },
        { event_id: 'derelict_cache', name: 'Derelict Cache', description: 'Scanners spot an abandoned cargo buoy (+1 random item).', weight: 10, effect_code: 'give_common_item', duration_quests: 1, polarity: 'good', art: 'box' },
        { event_id: 'stellar_wind', name: 'Stellar Wind', description: 'Sensor interference cleared (Hints free this quest).', weight: 8, effect_code: 'hints_free', duration_quests: 1, polarity: 'good', art: 'wind' },
        { event_id: 'salvage_rights', name: 'Salvage Rights', description: 'First 3 team finishers earn +25 bonus XP.', weight: 6, effect_code: 'speed_bonus_25', duration_quests: 1, polarity: 'good', art: 'trophy' },
        { event_id: 'solar_flare', name: 'Solar Flare', description: 'Radiation noise degrades sensor readouts (-10% XP).', weight: 12, effect_code: 'xp_minus_10', duration_quests: 1, polarity: 'bad', art: 'flare' },
        { event_id: 'ion_storm', name: 'Ion Storm', description: 'Static charge overloads hint relays (Hint cost doubled).', weight: 10, effect_code: 'hints_double_cost', duration_quests: 1, polarity: 'bad', art: 'lightning' },
        { event_id: 'hull_breach', name: 'Hull Breach', description: 'Micro-meteorite punctured storage (-1 item).', weight: 7, effect_code: 'lose_item', duration_quests: 1, polarity: 'bad', art: 'hole' },
        { event_id: 'comms_blackout', name: 'Comms Blackout', description: 'Transponder offline (No leaderboard until finished).', weight: 5, effect_code: 'hide_leaderboard', duration_quests: 1, polarity: 'bad', art: 'dish' },
        { event_id: 'rival_signal', name: 'Rival Signal', description: 'Crossed frequencies swap an item with rival crew.', weight: 5, effect_code: 'swap_item', duration_quests: 1, polarity: 'chaotic', art: 'cross' },
        { event_id: 'anomaly', name: 'Anomaly', description: 'Quantum flux! XP will double or halve when quest closes.', weight: 3, effect_code: 'gamble_xp', duration_quests: 1, polarity: 'chaotic', art: 'portal' },
        { event_id: 'derelict_beacon', name: 'Derelict Beacon', description: 'Ancient signal unlocks an epic prototype cache.', weight: 2, effect_code: 'give_epic_item', duration_quests: 1, polarity: 'epic', art: 'beacon' }
      ];
      for (var ev = 0; ev < defaultEvents.length; ev++) {
        Db.append('Events', defaultEvents[ev]);
      }
    }
  },

  getAll: function(tabName) {
    var sheet = getSheet_(tabName);
    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();
    if (lastRow <= 1 || lastCol === 0) return [];
    var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    var data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
    var results = [];
    for (var r = 0; r < data.length; r++) {
      var obj = {};
      for (var c = 0; c < headers.length; c++) {
        var h = headers[c];
        if (h) obj[h] = data[r][c];
      }
      results.push(obj);
    }
    return results;
  },

  find: function(tabName, predicate) {
    var all = Db.getAll(tabName);
    return all.filter(predicate);
  },

  findOne: function(tabName, predicate) {
    var all = Db.getAll(tabName);
    for (var i = 0; i < all.length; i++) {
      if (predicate(all[i])) return all[i];
    }
    return null;
  },

  append: function(tabName, rowObj) {
    var sheet = getSheet_(tabName);
    var headerMap = getHeaderMap_(tabName);
    var keys = Object.keys(headerMap);
    var lastCol = Math.max(sheet.getLastColumn(), keys.length);
    var row = new Array(lastCol);
    for (var i = 0; i < lastCol; i++) row[i] = '';
    
    for (var k in rowObj) {
      if (headerMap.hasOwnProperty(k)) {
        var colIdx = headerMap[k];
        row[colIdx] = rowObj[k] !== undefined && rowObj[k] !== null ? rowObj[k] : '';
      }
    }
    sheet.appendRow(row);
    return rowObj;
  },

  update: function(tabName, predicate, updateObj) {
    var sheet = getSheet_(tabName);
    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();
    if (lastRow <= 1) return 0;

    var headerMap = getHeaderMap_(tabName);
    var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    var data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();

    var updatedCount = 0;
    for (var r = 0; r < data.length; r++) {
      var rowObj = {};
      for (var c = 0; c < headers.length; c++) {
        var h = headers[c];
        if (h) rowObj[h] = data[r][c];
      }
      if (predicate(rowObj)) {
        for (var k in updateObj) {
          if (headerMap.hasOwnProperty(k)) {
            var colIdx = headerMap[k];
            sheet.getRange(r + 2, colIdx + 1).setValue(updateObj[k]);
          }
        }
        updatedCount++;
      }
    }
    return updatedCount;
  }
};
