'use strict';

const Db = require('./Db');
const Filter = require('./Filter');
const Formatter = require('./Formatter');
const Rules = require('./Rules');

// 0 logic, just tiyng up all the dependencies, nice :)
// let's keep it this way

class ReadWrite {
  // fieldsConfig are the same format as in config.js
  constructor ({redisClient, fieldsConfig}) {
    const rules = new Rules({
      publicKeys: fieldsConfig.public,
      protectedKeys: fieldsConfig.protected,
      privateKeys: fieldsConfig.private,
      internalKeys: fieldsConfig.internal
    });

    this.filter = new Filter({rules, maxPublicBytes: fieldsConfig.maxBytes});
    this.db = new Db({redisClient});
  }

  read (level, usernames, metadatas, callback) {
    const readables = this.filter.readable(level, metadatas);
    const keys = Formatter.toKeys(usernames, readables);

    this.db.getKeys(keys, (err, values) => {
      return err
        ? callback(err)
        : callback(null, Formatter.toResult(keys, values));
    });
  }

  write (level, username, metadata, value, callback) {
    const writable = this.filter.writable(level, metadata, value);
    if (writable instanceof Error)
      return setImmediate(callback, writable);

    this.db.setKeys(
      Formatter.toKeys(username, metadata),
      [value],
      callback
    );
  }
}

module.exports = ReadWrite;
