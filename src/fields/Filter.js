'use strict';

const {debugInspect} = require('../utils');
const levels = require('./levels');

const LEVELS = Object.keys(levels);
const LEVEL_DOES_NOT_EXIST = NaN;

const throwOnIntersection = (...levels) => {
  const sizes = {
    total: levels.length,
    unique: new Set(levels).size
  };

  if (sizes.total !== sizes.unique)
    throw new Error(`Intersection between different key levels ${debugInspect(sizes)}`);
};

class Filter {
  constructor ({publicKeys, protectedKeys, privateKeys, internalKeys}) {
    this.public = new Set(publicKeys);
    this.protected = new Set(protectedKeys);
    this.private = new Set(privateKeys);
    this.internal = new Set(internalKeys);

    throwOnIntersection(...publicKeys, ...protectedKeys, ...privateKeys, ...internalKeys);
  }

  _levelOf (key) {
    const levelKey = LEVELS.find(level => this[level].has(key));

    return levelKey
      ? levels[levelKey]
      : LEVEL_DOES_NOT_EXIST;
  }

  canWrite (level, key) {
    switch (this._levelOf(key)) {
      case levels.public:
      case levels.protected:
        return level >= levels.protected;

      case levels.private:
      case levels.internal:
        return level >= levels.internal;

      default:
        return false;
    }
  }

  canRead (level, key) {
    const keyLevel = this._levelOf(key);

    return Number.isNaN(keyLevel)
      ? false
      : level >= keyLevel;
  }
}

module.exports = Filter;
