/**
 * PlayerState.gs — everything a player has done that is not XP.
 *
 * The master copy of the state a client otherwise keeps in localStorage:
 * story flags, the lore notebook, practice results, loadout, marks,
 * commendations and settings. One row per player, one JSON cell. The client
 * plays from localStorage and reconciles with this row in the background, so a
 * slow Sheets read never holds a player up and a second device picks up where
 * the first left off.
 *
 * Like Learn.gs, nothing here touches Submissions or Progress, returns an xp
 * field, or can move the leaderboard.
 *
 * The merge below is a line-for-line copy of src/shared/statemerge.js;
 * tools/verify-sync.mjs evaluates this file and fails if the two disagree.
 */

var STATE_VERSION = 1;
var STATE_MAX_CHARS = 42000;

function stateIsPlainObject_(x) {
  return x !== null && typeof x === 'object' && !Array.isArray(x);
}

function stateStable_(x) {
  if (Array.isArray(x)) return '[' + x.map(stateStable_).join(',') + ']';
  if (stateIsPlainObject_(x)) {
    return '{' + Object.keys(x).sort().map(function(k) { return JSON.stringify(k) + ':' + stateStable_(x[k]); }).join(',') + '}';
  }
  return JSON.stringify(x === undefined ? null : x);
}

function stateItemKey_(x) {
  return (typeof x === 'object' && x !== null) ? 'o:' + stateStable_(x) : (typeof x) + ':' + String(x);
}

function stateUnion_(a, b) {
  if (a === undefined || a === null) return b === undefined ? null : b;
  if (b === undefined || b === null) return a;
  if (Array.isArray(a) && Array.isArray(b)) {
    var seen = {};
    var out = [];
    var all = a.concat(b);
    for (var i = 0; i < all.length; i++) {
      var k = stateItemKey_(all[i]);
      if (!Object.prototype.hasOwnProperty.call(seen, k)) {
        seen[k] = true;
        out.push(all[i]);
      }
    }
    if (out.length && out.every(function(v) { return typeof v === 'number'; })) out.sort(function(x, y) { return x - y; });
    return out;
  }
  if (stateIsPlainObject_(a) && stateIsPlainObject_(b)) {
    var o = {};
    var keys = Object.keys(a).concat(Object.keys(b));
    for (var j = 0; j < keys.length; j++) {
      var key = keys[j];
      if (Object.prototype.hasOwnProperty.call(o, key)) continue;
      o[key] = stateUnion_(a[key], b[key]);
    }
    return o;
  }
  if (typeof a === 'boolean' && typeof b === 'boolean') return a || b;
  if (typeof a === 'number' && typeof b === 'number') return a > b ? a : b;
  if (typeof a === 'string' && typeof b === 'string') return a > b ? a : b;
  return stateStable_(a) >= stateStable_(b) ? a : b;
}

function stateMergeSection_(a, b) {
  if (!a) return b || null;
  if (!b) return a;
  var mode = (a.mode === 'latest' || b.mode === 'latest') ? 'latest' : 'union';
  var atA = Number(a.at) || 0;
  var atB = Number(b.at) || 0;
  if (mode === 'latest') {
    var pick;
    if (atA !== atB) pick = atA > atB ? a : b;
    else pick = stateStable_(a.v) >= stateStable_(b.v) ? a : b;
    return { at: Math.max(atA, atB), mode: mode, v: pick.v };
  }
  return { at: Math.max(atA, atB), mode: mode, v: stateUnion_(a.v, b.v) };
}

function stateMergeDocs_(a, b) {
  var out = { v: STATE_VERSION, sections: {} };
  var sa = (a && a.sections) || {};
  var sb = (b && b.sections) || {};
  var names = Object.keys(sa).concat(Object.keys(sb));
  for (var i = 0; i < names.length; i++) {
    var n = names[i];
    if (Object.prototype.hasOwnProperty.call(out.sections, n)) continue;
    out.sections[n] = stateMergeSection_(sa[n], sb[n]);
  }
  return out;
}

var PlayerState = {

  _parse: function(row) {
    if (!row || !row.data) return { v: STATE_VERSION, sections: {} };
    try {
      var d = JSON.parse(row.data);
      return (d && d.sections) ? d : { v: STATE_VERSION, sections: {} };
    } catch (e) {
      return { v: STATE_VERSION, sections: {} };
    }
  },

  _row: function(playerId) {
    return Db.findOne('PlayerState', function(r) { return r.player_id === playerId; });
  },

  /** The stored document, or an empty one for a player who has never saved. */
  get: function(playerId) {
    return this._parse(this._row(playerId));
  },

  /**
   * Merge a client's document into the stored one and return the result.
   * Merging on the server as well as the client is what lets two devices
   * save at once without either overwriting the other.
   */
  save: function(playerId, incoming) {
    if (!incoming || !stateIsPlainObject_(incoming.sections)) {
      throw { code: 'BAD_REQUEST', message: 'A state document is required.' };
    }
    var row = this._row(playerId);
    var merged = stateMergeDocs_(this._parse(row), incoming);
    var text = JSON.stringify(merged);
    if (text.length > STATE_MAX_CHARS) {
      throw { code: 'BAD_REQUEST', message: 'Saved state is too large.' };
    }
    var now = new Date().toISOString();
    if (!row) {
      Db.append('PlayerState', { player_id: playerId, data: text, updated_at: now });
    } else {
      Db.update('PlayerState', function(r) { return r.player_id === playerId; }, { data: text, updated_at: now });
    }
    return merged;
  }
};
