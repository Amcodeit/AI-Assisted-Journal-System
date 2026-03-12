const crypto = require('crypto');

class CacheService {
  constructor() {
    // In-memory cache (use Redis in production)
    this.cache = new Map();
    this.TTL = 24 * 60 * 60 * 1000; // 24 hours
    this.MAX_SIZE = 1000;
  }

  /**
   * Generate a cache key from text by normalizing and hashing.
   */
  _generateKey(text) {
    const normalized = text.toLowerCase().trim().replace(/\s+/g, ' ');
    return crypto.createHash('sha256').update(normalized).digest('hex');
  }

  /**
   * Get cached analysis result, or null if not found/expired.
   */
  get(text) {
    const key = this._generateKey(text);
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > this.TTL) {
      this.cache.delete(key);
      return null;
    }

    console.log('Cache hit for analysis');
    return entry.data;
  }

  /**
   * Store analysis result in cache.
   */
  set(text, data) {
    const key = this._generateKey(text);
    this.cache.set(key, { data, timestamp: Date.now() });

    // Evict oldest entries if cache exceeds max size
    if (this.cache.size > this.MAX_SIZE) {
      const oldest = this.cache.keys().next().value;
      this.cache.delete(oldest);
    }
  }

  /**
   * Get cache stats.
   */
  stats() {
    return { size: this.cache.size, maxSize: this.MAX_SIZE, ttlMs: this.TTL };
  }
}

module.exports = new CacheService();
