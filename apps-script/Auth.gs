/**
 * Auth.gs — Authentication and session management for Avalon
 * Passwords are never hashed in Apps Script; they are hashed in Vercel via scrypt.
 * Apps Script performs constant-time compare against pw_hash.
 */

function getSessionSecret_() {
  var props = PropertiesService.getScriptProperties();
  return props.getProperty('SESSION_SECRET') || 'avalon_default_session_secret_change_in_prod';
}

function getProxySecret_() {
  var props = PropertiesService.getScriptProperties();
  return props.getProperty('PROXY_SECRET') || 'avalon_proxy_secret_change_in_prod';
}

var Auth = {
  createSessionToken: function(playerId) {
    var jti = generateId('jti');
    var exp = Math.floor(Date.now() / 1000) + (90 * 24 * 60 * 60); // 90 days
    var payloadObj = { jti: jti, pid: playerId, exp: exp, v: 1 };
    var payloadStr = JSON.stringify(payloadObj);
    var payloadB64 = base64UrlEncode(payloadStr);
    var sig = hmacSha256(payloadB64, getSessionSecret_());
    return payloadB64 + '.' + sig;
  },

  verifySessionToken: function(token) {
    if (!token || typeof token !== 'string') return null;
    var parts = token.split('.');
    if (parts.length !== 2) return null;
    var payloadB64 = parts[0];
    var sig = parts[1];

    var expectedSig = hmacSha256(payloadB64, getSessionSecret_());
    if (!timingSafeEqual(sig, expectedSig)) return null;

    try {
      var payloadStr = base64UrlDecode(payloadB64);
      var payload = JSON.parse(payloadStr);
      var nowSec = Math.floor(Date.now() / 1000);
      if (!payload.exp || payload.exp < nowSec) return null;

      // Check revocation in Sessions tab
      var revoked = Db.findOne('Sessions', function(s) {
        return s.jti === payload.jti;
      });
      if (revoked) return null;

      var player = Db.findOne('Players', function(p) {
        return p.player_id === payload.pid;
      });
      if (!player || player.status === 'banned') return null;

      return { player: player, jti: payload.jti };
    } catch (e) {
      return null;
    }
  },

  getSalt: function(identifier) {
    if (!identifier || typeof identifier !== 'string') {
      return { salt: hmacSha256('dummy', getProxySecret_()) };
    }
    var idLc = identifier.trim().toLowerCase();
    var cached = Cache.get('salt:' + idLc);
    if (cached) return { salt: cached };

    var player = Db.findOne('Players', function(p) {
      return p.email_lc === idLc || p.display_name_lc === idLc;
    });

    if (player && player.pw_salt) {
      Cache.put('salt:' + idLc, player.pw_salt, 21600);
      return { salt: player.pw_salt };
    }
    // Return deterministic dummy salt for nonexistent account
    return { salt: hmacSha256(idLc, getProxySecret_()) };
  },

  login: function(identifier, dk) {
    if (!identifier || !dk) {
      throw { code: 'INVALID_CREDENTIALS', message: 'Identifier and password are required.' };
    }
    var idLc = identifier.trim().toLowerCase();
    var player = Db.findOne('Players', function(p) {
      return p.email_lc === idLc || p.display_name_lc === idLc;
    });

    if (!player || !player.pw_hash) {
      throw { code: 'INVALID_CREDENTIALS', message: 'Invalid credentials.' };
    }

    if (!timingSafeEqual(String(dk), String(player.pw_hash))) {
      throw { code: 'INVALID_CREDENTIALS', message: 'Invalid credentials.' };
    }

    if (player.status === 'banned') {
      throw { code: 'ACCOUNT_BANNED', message: 'This account is suspended.' };
    }

    // Cache salt for future logins
    if (player.pw_salt) {
      Cache.put('salt:' + idLc, player.pw_salt, 21600);
    }

    var token = Auth.createSessionToken(player.player_id);
    var profile = null;
    try {
      profile = Players.getMe(player.player_id);
    } catch (e) {}

    return {
      token: token,
      player: profile ? profile.player : sanitizePlayer_(player),
      team: profile ? profile.team : null,
      xp: profile ? profile.xp : 0,
      level: profile ? profile.level : 1,
      inventory: profile ? profile.inventory : []
    };
  },

  register: function(email, pwHash, pwSalt, pwAlgo, displayName) {
    if (!validateEmail(email)) {
      throw { code: 'INVALID_EMAIL', message: 'A valid email address is required.' };
    }
    var nameValidation = validateDisplayName(displayName);
    if (!nameValidation.valid) {
      throw { code: 'INVALID_DISPLAY_NAME', message: nameValidation.message };
    }

    var emailLc = email.trim().toLowerCase();
    var nameTrimmed = displayName.trim();
    var nameLc = nameTrimmed.toLowerCase();
    var nameNormalized = normalizeConfusables(nameTrimmed);

    // Check email uniqueness
    var existingEmail = Db.findOne('Players', function(p) {
      return p.email_lc === emailLc;
    });
    if (existingEmail) {
      throw { code: 'EMAIL_IN_USE', message: 'An account with this email already exists.' };
    }

    // Check display name uniqueness and confusable collisions
    var existingName = Db.findOne('Players', function(p) {
      if (p.display_name_lc === nameLc) return true;
      if (normalizeConfusables(p.display_name) === nameNormalized) return true;
      return false;
    });
    if (existingName) {
      throw { code: 'NAME_TAKEN', message: 'That display name is too similar to an existing player.' };
    }

    var playerId = generateId('p');
    var now = isoNow();

    var playerRow = {
      player_id: playerId,
      email_lc: emailLc,
      pw_hash: pwHash,
      pw_salt: pwSalt,
      pw_algo: pwAlgo || 'scrypt-16384-8-1-64',
      display_name: nameTrimmed,
      display_name_lc: nameLc,
      name_changed_at: now,
      role: '',
      team_id: '',
      avatar_json: JSON.stringify({ suitColor: 'default', helmet: 'mark1', visor: 'gold', skin: 'medium' }),
      created_at: now,
      last_seen_at: now,
      status: 'active',
      gfx_tier_pref: 'auto',
      notes: ''
    };

    Db.append('Players', playerRow);
    var token = Auth.createSessionToken(playerId);

    return {
      token: token,
      player: sanitizePlayer_(playerRow),
      next: 'onboarding'
    };
  },

  changePassword: function(playerId, oldDk, newHash, newSalt, newAlgo) {
    var player = Db.findOne('Players', function(p) { return p.player_id === playerId; });
    if (!player) throw { code: 'NOT_FOUND', message: 'Player not found.' };

    if (!timingSafeEqual(String(oldDk), String(player.pw_hash))) {
      throw { code: 'INVALID_CREDENTIALS', message: 'Current password incorrect.' };
    }

    Db.update('Players', function(p) { return p.player_id === playerId; }, {
      pw_hash: newHash,
      pw_salt: newSalt,
      pw_algo: newAlgo || 'scrypt-16384-8-1-64',
      last_seen_at: isoNow()
    });

    Db.append('AuditLog', {
      ts: isoNow(),
      actor: playerId,
      action: 'CHANGE_PASSWORD',
      target: playerId,
      detail_json: JSON.stringify({ self: true })
    });

    return { ok: true };
  },

  revokeSession: function(jti, playerId, reason) {
    Db.append('Sessions', {
      jti: jti,
      player_id: playerId,
      revoked_at: isoNow(),
      reason: reason || 'logout'
    });
  }
};

function sanitizePlayer_(p) {
  return {
    player_id: p.player_id,
    display_name: p.display_name,
    role: p.role,
    team_id: p.team_id,
    avatar_json: p.avatar_json,
    gfx_tier_pref: p.gfx_tier_pref || 'auto',
    background: p.background || '',
    trinket: p.trinket || '',
    status: p.status,
    created_at: p.created_at
  };
}
