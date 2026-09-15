/**
 * Util.gs — Avalon helper utilities
 */

var PROFANITY_LIST = [
  'fuck', 'shit', 'bitch', 'asshole', 'cunt', 'dick', 'cock', 'pussy', 
  'bastard', 'nigger', 'nigga', 'faggot', 'retard', 'whore', 'slut', 'chink', 'kike'
];

var RESERVED_PREFIXES = ['admin', 'mod', 'avalon', 'staff', 'terra', 'zephyr', 'ignis', 'thalassa'];

function generateId(prefix) {
  var ts = Date.now().toString(36);
  var rand = Math.random().toString(36).substring(2, 8);
  return (prefix ? prefix + '_' : '') + ts + rand;
}

function isoNow() {
  return new Date().toISOString();
}

function sha256Hex(str) {
  var raw = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, str, Utilities.Charset.UTF_8);
  var out = '';
  for (var i = 0; i < raw.length; i++) {
    var b = raw[i];
    if (b < 0) b += 256;
    var h = b.toString(16);
    if (h.length === 1) out += '0';
    out += h;
  }
  return out;
}

function hmacSha256(str, key) {
  var sig = Utilities.computeHmacSha256Signature(str, key, Utilities.Charset.UTF_8);
  return Utilities.base64EncodeWebSafe(sig);
}

function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  var diff = 0;
  for (var i = 0; i < a.length; i++) {
    diff |= (a.charCodeAt(i) ^ b.charCodeAt(i));
  }
  return diff === 0;
}

function base64UrlEncode(str) {
  var b64 = Utilities.base64Encode(str, Utilities.Charset.UTF_8);
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(str) {
  var base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  var decodedBytes = Utilities.base64Decode(base64, Utilities.Charset.UTF_8);
  return Utilities.newBlob(decodedBytes).getDataAsString('UTF-8');
}

function normalizeConfusables(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[0]/g, 'o')
    .replace(/[1l|!]/g, 'i')
    .replace(/[5$]/g, 's')
    .replace(/[3]/g, 'e')
    .replace(/[4@]/g, 'a')
    .replace(/[8]/g, 'b')
    .replace(/[^a-z0-9]/g, '');
}

function validateDisplayName(name) {
  if (!name || typeof name !== 'string') return { valid: false, message: 'Display name is required.' };
  var trimmed = name.trim();
  if (trimmed !== name) return { valid: false, message: 'Name cannot have leading or trailing spaces.' };
  if (name.length < 3 || name.length > 20) return { valid: false, message: 'Name must be between 3 and 20 characters.' };
  if (/\s{2,}/.test(name)) return { valid: false, message: 'Name cannot contain consecutive spaces.' };
  if (!/^[a-zA-Z0-9 _-]+$/.test(name)) return { valid: false, message: 'Name can only contain letters, numbers, spaces, underscores, and hyphens.' };

  var lower = name.toLowerCase();
  for (var i = 0; i < RESERVED_PREFIXES.length; i++) {
    var p = RESERVED_PREFIXES[i];
    if (lower === p || lower.indexOf(p + ' ') === 0 || lower.indexOf(p + '_') === 0 || lower.indexOf(p + '-') === 0) {
      return { valid: false, message: 'Name starts with reserved prefix "' + p + '".' };
    }
  }

  var normalized = normalizeConfusables(name);
  for (var j = 0; j < PROFANITY_LIST.length; j++) {
    if (normalized.indexOf(PROFANITY_LIST[j]) !== -1) {
      return { valid: false, message: 'Name violates community guidelines.' };
    }
  }

  return { valid: true };
}

function validateEmail(email) {
  if (!email || typeof email !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
