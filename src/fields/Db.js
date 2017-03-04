'use strict';

class Db {
  constructor ({redisClient}) {
    this.redis = redisClient;
  }

  getKeys (keys, callback) {
    return (keys.length === 0)
      ? setImmediate(callback, null, [])
      : this.redis.mget(keys, callback);
  }

  setKeys (keys, values, callback) {
    const args = [];

    for (let index = 0; index < keys.length; ++index)
      args.push(keys[index], values[index]);

    return this.redis.mset(args, callback);
  }
}

module.exports = Db;
