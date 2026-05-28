const { getDB, saveDB } = require('./db');

class SqliteStore {
  constructor(prefix = '') {
    this.prefix = prefix ? `${prefix}:` : '';
  }

  init(options) {
    this.windowMs = options.windowMs;
  }

  _key(raw) {
    return this.prefix + raw;
  }

  increment(key) {
    const db = getDB();
    const now = Date.now();
    const expiresAt = now + this.windowMs;
    const pk = this._key(key);

    const stmt = db.prepare('SELECT hits, expires_at FROM rate_limits WHERE key = ?');
    stmt.bind([pk]);

    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();

      if (row.expires_at > now) {
        db.run('UPDATE rate_limits SET hits = ? WHERE key = ?', [row.hits + 1, pk]);
        this.ensureSaved();
        return { totalHits: row.hits + 1, resetTime: new Date(row.expires_at) };
      }
    } else {
      stmt.free();
    }

    db.run('INSERT OR REPLACE INTO rate_limits (key, hits, expires_at) VALUES (?, 1, ?)', [pk, expiresAt]);
    this.ensureSaved();
    return { totalHits: 1, resetTime: new Date(expiresAt) };
  }

  decrement(key) {
    const db = getDB();
    db.run('UPDATE rate_limits SET hits = hits - 1 WHERE key = ? AND hits > 0', [this._key(key)]);
  }

  resetKey(key) {
    const db = getDB();
    db.run('DELETE FROM rate_limits WHERE key = ?', [this._key(key)]);
    this.ensureSaved();
  }
}

let saveTimeout = null;
function ensureSaved() {
  if (saveTimeout) return;
  saveTimeout = setTimeout(() => {
    saveDB();
    saveTimeout = null;
  }, 3000);
}

SqliteStore.prototype.ensureSaved = ensureSaved;

module.exports = SqliteStore;
