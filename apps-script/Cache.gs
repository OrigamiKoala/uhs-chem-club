/**
 * Cache.gs — CacheService wrapper for Avalon
 */

var Cache = {
  get: function(key) {
    try {
      var c = CacheService.getScriptCache();
      var val = c.get(key);
      if (!val) return null;
      return JSON.parse(val);
    } catch (e) {
      return null;
    }
  },

  put: function(key, value, ttlSeconds) {
    try {
      var c = CacheService.getScriptCache();
      var str = JSON.stringify(value);
      var ttl = Math.min(ttlSeconds || 60, 21600);
      c.put(key, str, ttl);
    } catch (e) {
      // Ignore cache put failures (e.g. key > 100KB)
    }
  },

  drop: function(key) {
    try {
      var c = CacheService.getScriptCache();
      c.remove(key);
    } catch (e) {}
  }
};
