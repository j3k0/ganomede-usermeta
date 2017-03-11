'use strict';

const Db = require('./Db');
const Filter = require('./Filter');
const Formatter = require('./Formatter');
const Rules = require('./Rules');

class ReadWrite {
  // fieldsConfig are the same format as in config.js
  constructor ({redisClient, fieldsConfig}) {
    const rules = new Rules({
      publicKeys: fieldsConfig.public,
      protectedKeys: fieldsConfig.protected,
      privateKeys: fieldsConfig.private
    });

    this.filter = new Filter({rules, maxPublicBytes: fieldsConfig.maxBytes});
    this.db = new Db({redisClient});
  }

  read (level, userIds, metadatas, callback) {
    const readables = this.filter.readable(level, metadatas);
    const keys = Formatter.toKeys(userIds, readables);

    this.db.getKeys(keys, (err, values) =>
      callback(err, Formatter.toResult(userIds, keys, values)));
  }

  write (level, userId, metadata, value, callback) {
    const writable = this.filter.writable(level, metadata, value);
    if (writable instanceof Error)
      return setImmediate(callback, writable);

    this.db.setKeys(
      Formatter.toKeys(userId, metadata),
      [value],
      callback
    );
  }
}

module.exports = ReadWrite;
