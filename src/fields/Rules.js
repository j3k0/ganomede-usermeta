'use strict';

//
// Rules class controls the access rights based on metadata's keys.
//
// It's provided with the sets of known keys for each level.
//
// It checks that:
// - Key is present in one set.
// - Caller has the required access level to read or write a metadata.
//

const {debugInspect} = require('../utils');
const levels = require('./levels');

// I am wondering whether we should check higher level first.
// Though since we test for intersection, it's fine.
const KEY_LOOKUP_ORDER = [
  'public',
  'protected',
  'private',
  'internal'
];

const throwOnIntersection = (...levels) => {
  const sizes = {
    total: levels.length,
    unique: new Set(levels).size
  };

  if (sizes.total !== sizes.unique)
    throw new Error(`Intersection between different key levels ${debugInspect(sizes)}`);
};

class Rules {
  constructor ({publicKeys, protectedKeys, privateKeys}) {
    this.public = new Set(publicKeys);
    this.protected = new Set(protectedKeys);
    this.private = new Set(privateKeys);
    this.internal = {has: () => true}; // Any key that is not specifed above.

    throwOnIntersection(...publicKeys, ...protectedKeys, ...privateKeys);
  }

  _levelOf (key) {
    const level = KEY_LOOKUP_ORDER.find(level => this[level].has(key));
    return levels[level];
  }

  canWrite (level, key) {
    switch (this._levelOf(key)) {
      case levels.public:
      case levels.protected:
        return level >= levels.protected;

      default:
        return level >= levels.internal;
    }
  }

  canRead (level, key) {
    return level >= this._levelOf(key);
  }
}

module.exports = Rules;
