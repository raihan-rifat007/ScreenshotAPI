const env = require("../config/env");

const store = new Map();

function prune() {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.expiresAt <= now) store.delete(key);
  }
}

function get(key) {
  const entry = store.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    store.delete(key);
    return null;
  }
  store.delete(key);
  store.set(key, entry);
  return entry.value;
}

function set(key, value, ttlSeconds = env.cacheTtlSeconds) {
  if (ttlSeconds <= 0) return;
  prune();
  while (store.size >= env.cacheMaxItems) {
    const oldestKey = store.keys().next().value;
    store.delete(oldestKey);
  }
  store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
}

function stats() {
  prune();
  return { items: store.size, maxItems: env.cacheMaxItems, ttlSeconds: env.cacheTtlSeconds };
}

function clear() {
  store.clear();
}

module.exports = { get, set, stats, clear };
