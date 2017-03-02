'use strict';

class Db {
  constructor ({redisClient}) {
    this.redis = redisClient;
  }

  // Note how this does not parse JSON.
  // We do so in Formatter, because that way we can distinguish between
  // missing redis keys and redis key set to null.
  getKeys (keys, callback) {
    return (keys.length === 0)
      ? setImmediate(callback, null, [])
      : this.redis.mget(keys, callback);
  }

  setKeys (keys, values, callback) {
    const args = [];

    for (let index = 0; index < keys.length; ++index) {
      const key = keys[index];
      const value = JSON.stringify(values[index]);
      args.push(key, value);
    }

    return this.redis.mset(args, callback);
  }
}

module.exports = Db;
