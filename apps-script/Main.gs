/**
 * Main.gs — Avalon Apps Script Web App router and entry point
 * Handles doPost, auth gating, admin verification, and structured JSON envelopes.
 */

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function props(key) {
  var p = PropertiesService.getScriptProperties();
  return p.getProperty(key) || ('avalon_dev_' + key.toLowerCase());
}

function isAdminEmail(emailLc) {
  if (!emailLc) return false;
  var cfg = Db.findOne('Config', function(c) { return c.key === 'admin_emails'; });
  var adminList = (cfg && cfg.value ? cfg.value : '').toLowerCase().split(',');
  for (var i = 0; i < adminList.length; i++) {
    if (adminList[i].trim() === emailLc) return true;
  }
  return false;
}

var ROUTES = {
  'auth/salt': {
    auth: false,
    fn: function(body) {
      return Auth.getSalt(body.identifier);
    }
  },

  'auth/login': {
    auth: false,
    fn: function(body) {
      return Auth.login(body.identifier, body.dk);
    }
  },

  'auth/register': {
    auth: false,
    fn: function(body) {
      return Auth.register(body.email, body.pwHash, body.pwSalt, body.pwAlgo, body.displayName);
    }
  },

  'auth/change-password': {
    auth: true,
    fn: function(body, ctx) {
      return Auth.changePassword(ctx.player.player_id, body.oldDk, body.newHash, body.newSalt, body.newAlgo);
    }
  },

  'bootstrap': {
    auth: false,
    fn: function(body) {
      var publicData = Cache.get('bootstrap:public');
      if (!publicData) {
        var configRows = Db.getAll('Config');
        var config = {};
        for (var i = 0; i < configRows.length; i++) {
          config[configRows[i].key] = configRows[i].value;
        }

        var teams = Players.getTeamSlots();
        var activeQuest = config.active_quest || 'q1';
        var questManifest = null;
        try {
          questManifest = Quests.getManifest(activeQuest);
        } catch (e) {}

        publicData = {
          config: config,
          teams: teams,
          activeQuest: questManifest,
          events: Events.getActiveEvents()
        };
        Cache.put('bootstrap:public', publicData, 60);
      }

      var playerSession = null;
      if (body.token) {
        var verified = Auth.verifySessionToken(body.token);
        if (verified) {
          playerSession = Players.getMe(verified.player.player_id);
          playerSession.isAdmin = isAdminEmail(verified.player.email_lc);
        }
      }

      return {
        config: publicData.config,
        teams: publicData.teams,
        activeQuest: publicData.activeQuest,
        events: publicData.events,
        player: playerSession
      };
    }
  },

  'player/create': {
    auth: true,
    fn: function(body, ctx) {
      return Players.claimTeamSlot(ctx.player.player_id, body.role, body.teamId, body.avatar, body.background, body.trinket);
    }
  },

  'team/roster': {
    auth: false,
    fn: function(body) {
      return Players.getTeamRoster(body.teamId);
    }
  },

  'player/me': {
    auth: true,
    fn: function(body, ctx) {
      var me = Players.getMe(ctx.player.player_id);
      me.isAdmin = isAdminEmail(ctx.player.email_lc);
      return me;
    }
  },

  'player/rename': {
    auth: true,
    fn: function(body, ctx) {
      return Players.rename(ctx.player.player_id, body.displayName);
    }
  },

  'player/update': {
    auth: true,
    fn: function(body, ctx) {
      return Players.updateSettings(ctx.player.player_id, body);
    }
  },

  /* -----------------------------------------------------------------
     LEARN TRACK — progress only, no XP, invisible to Standings.
     ----------------------------------------------------------------- */
  'learn/progress': {
    auth: true,
    fn: function(body, ctx) {
      return Learn.getProgress(ctx.player.player_id);
    }
  },

  'learn/stage': {
    auth: true,
    fn: function(body, ctx) {
      return Learn.recordStage(ctx.player.player_id, body.worldId, body.questId, body.stageIndex);
    }
  },

  'learn/complete': {
    auth: true,
    fn: function(body, ctx) {
      return Learn.completeQuest(ctx.player.player_id, body.worldId, body.questId);
    }
  },

  'quest/manifest': {
    auth: true,
    fn: function(body) {
      return Quests.getManifest(body.questId || 'q1');
    }
  },

  'quest/start': {
    auth: true,
    fn: function(body, ctx) {
      return Quests.startQuest(ctx.player.player_id, body.questId || 'q1');
    }
  },

  'quest/grade': {
    auth: true,
    fn: function(body, ctx) {
      return Quests.gradeStage(
        ctx.player.player_id,
        body.questId || 'q1',
        body.stageIndex,
        body.payload,
        body.elapsedMs,
        body.hintUsed,
        body.gfxTier
      );
    }
  },

  'quest/hint': {
    auth: true,
    fn: function(body, ctx) {
      return Quests.getHint(ctx.player.player_id, body.questId || 'q1', body.stageIndex);
    }
  },

  'quest/complete': {
    auth: true,
    fn: function(body, ctx) {
      return Quests.completeQuest(ctx.player.player_id, body.questId || 'q1');
    }
  },

  'demo/grade': {
    auth: false,
    fn: function(body) {
      return Quests.gradeDemo(body.stageIndex, body.payload);
    }
  },

  'leaderboard': {
    auth: false,
    fn: function(body) {
      var pid = null;
      if (body.token) {
        var v = Auth.verifySessionToken(body.token);
        if (v) pid = v.player.player_id;
      }
      return Scoring.getLeaderboards(pid);
    }
  },

  'inventory/use': {
    auth: true,
    fn: function(body, ctx) {
      return Items.useItem(ctx.player.player_id, body.itemId, body.context);
    }
  },

  'events/current': {
    auth: false,
    fn: function() {
      return Events.getActiveEvents();
    }
  },

  // Admin routes
  'admin/reset-password': {
    auth: true,
    admin: true,
    fn: function(body, ctx) {
      var targetPlayer = Db.findOne('Players', function(p) {
        return p.player_id === body.targetPlayerId || p.email_lc === (body.targetIdentifier || '').toLowerCase() || p.display_name_lc === (body.targetIdentifier || '').toLowerCase();
      });
      if (!targetPlayer) throw { code: 'NOT_FOUND', message: 'Target player not found.' };

      Db.update('Players', function(p) { return p.player_id === targetPlayer.player_id; }, {
        pw_hash: body.newHash,
        pw_salt: body.newSalt,
        pw_algo: body.newAlgo || 'scrypt-16384-8-1-64'
      });

      Db.append('AuditLog', {
        ts: isoNow(),
        actor: ctx.player.player_id,
        action: 'ADMIN_RESET_PASSWORD',
        target: targetPlayer.player_id,
        detail_json: JSON.stringify({ admin: ctx.player.display_name })
      });

      return { ok: true, targetPlayerId: targetPlayer.player_id };
    }
  },

  'admin/force-rename': {
    auth: true,
    admin: true,
    fn: function(body, ctx) {
      var targetPlayer = Db.findOne('Players', function(p) { return p.player_id === body.targetPlayerId; });
      if (!targetPlayer) throw { code: 'NOT_FOUND', message: 'Target player not found.' };

      var oldName = targetPlayer.display_name;
      var newName = body.newDisplayName.trim();

      Db.update('Players', function(p) { return p.player_id === targetPlayer.player_id; }, {
        display_name: newName,
        display_name_lc: newName.toLowerCase(),
        name_changed_at: isoNow()
      });

      Db.append('NameHistory', {
        ts: isoNow(),
        player_id: targetPlayer.player_id,
        old_name: oldName,
        new_name: newName,
        changed_by: 'admin:' + ctx.player.player_id,
        reason: body.reason || 'Admin intervention'
      });

      Db.append('AuditLog', {
        ts: isoNow(),
        actor: ctx.player.player_id,
        action: 'ADMIN_FORCE_RENAME',
        target: targetPlayer.player_id,
        detail_json: JSON.stringify({ oldName: oldName, newName: newName, reason: body.reason })
      });

      return { ok: true };
    }
  },

  'admin/grant-xp': {
    auth: true,
    admin: true,
    fn: function(body, ctx) {
      var subId = generateId('sub');
      Db.append('Submissions', {
        submission_id: subId,
        ts: isoNow(),
        player_id: body.targetPlayerId,
        quest_id: 'admin_grant',
        stage_index: 0,
        attempt_no: 1,
        payload_json: JSON.stringify({ reason: body.reason }),
        correct: 'TRUE',
        xp_awarded: Number(body.amount),
        elapsed_ms: 0,
        hint_used: 'FALSE',
        gfx_tier: 'T2',
        ip_hash: ''
      });

      Db.append('AuditLog', {
        ts: isoNow(),
        actor: ctx.player.player_id,
        action: 'ADMIN_GRANT_XP',
        target: body.targetPlayerId,
        detail_json: JSON.stringify({ amount: body.amount, reason: body.reason })
      });

      Cache.drop('lb:all');
      return { ok: true };
    }
  },

  'admin/stats': {
    auth: true,
    admin: true,
    fn: function() {
      var players = Db.getAll('Players');
      var subs = Db.getAll('Submissions');
      var progs = Db.find('Progress', function(p) { return p.completed_at; });

      var gfxTiers = { T1: 0, T2: 0, T3: 0 };
      for (var i = 0; i < subs.length; i++) {
        var tier = subs[i].gfx_tier || 'T2';
        gfxTiers[tier] = (gfxTiers[tier] || 0) + 1;
      }

      return {
        totalPlayers: players.length,
        totalSubmissions: subs.length,
        completions: progs.length,
        gfxTiers: gfxTiers
      };
    }
  }
};

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return json({ ok: false, error: { code: 'BAD_REQUEST', message: 'No request payload' } });
    }
    var req = JSON.parse(e.postData.contents);

    // Verify proxy secret
    var expectedSecret = props('PROXY_SECRET');
    if (req.k !== expectedSecret) {
      return json({ ok: false, error: { code: 'FORBIDDEN', message: 'Invalid proxy authentication.' } });
    }

    var route = req.route;
    var handler = ROUTES[route];
    if (!handler) {
      return json({ ok: false, error: { code: 'NO_ROUTE', message: 'Route ' + route + ' not found.' } });
    }

    var ctx = null;
    if (handler.auth) {
      var token = req.body ? req.body.token : null;
      // verifySessionToken throws BACKEND_BUSY when the lookup itself failed,
      // which the catch below reports as retryable. Only a null return means
      // the token is actually dead, and only that may answer UNAUTHORIZED —
      // the client signs the player out on it.
      var session = Auth.verifySessionToken(token);
      if (!session) {
        return json({ ok: false, error: { code: 'UNAUTHORIZED', message: 'Session invalid or expired.' } });
      }
      ctx = session;
      if (handler.admin && !isAdminEmail(ctx.player.email_lc)) {
        return json({ ok: false, error: { code: 'FORBIDDEN', message: 'Admin access required.' } });
      }
    }

    var resultData = handler.fn(req.body || {}, ctx);
    return json({ ok: true, data: resultData });
  } catch (err) {
    var code = err && err.code ? err.code : 'INTERNAL_ERROR';
    var message = err && err.message ? err.message : String(err);

    // Sheets and the other Google services fail transiently under load, with
    // "timed out", "Internal error" or a lock message. Those are retryable and
    // are labelled as such, so the proxy retries and the client leaves the
    // player signed in instead of treating it as a dead session.
    if (code === 'INTERNAL_ERROR' && isTransientServiceError_(message)) {
      code = 'BACKEND_BUSY';
      message = 'The server is busy. Try that again in a moment.';
    }

    return json({ ok: false, error: { code: code, message: message } });
  }
}

/** True for the Google service failures that are worth retrying rather than showing. */
function isTransientServiceError_(message) {
  var m = String(message || '').toLowerCase();
  return m.indexOf('timed out') !== -1
    || m.indexOf('timeout') !== -1
    || m.indexOf('internal error') !== -1
    || m.indexOf('try again') !== -1
    || m.indexOf('temporarily unavailable') !== -1
    || m.indexOf('service invoked too many times') !== -1
    || m.indexOf('too many simultaneous') !== -1
    || m.indexOf('server error') !== -1
    || m.indexOf('lock') !== -1;
}

function doGet(e) {
  return json({ ok: true, message: 'Avalon Apps Script Backend operational.' });
}

function setup() {
  Db.initDb();
  Db.ensureTeamsMigrated();
  Quests.seedQuestsIfEmpty();
  Cache.drop('teams:slots');
  Cache.drop('bootstrap:public');
  Logger.log('Avalon DB initialized and teams migrated successfully.');
}
