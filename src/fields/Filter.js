'use strict';

const {GanomedeError, InvalidCredentialsError} = require('../errors');
const levels = require('./levels');

const bytes = Buffer.byteLength;

class ValueTooBigError extends GanomedeError {
  constructor (byteLimit) {
    super('Value exceeds %d byte limit', byteLimit);
    this.statusCode = 413;
  }
}

class Filter {
  constructor ({rules, maxPublicBytes}) {
    this.rules = rules;
    this.maxPublicBytes = maxPublicBytes;
  }

  readable (level, keys) {
    return keys.map(key => {
      return this.rules.canRead(level, key)
        ? key
        : new InvalidCredentialsError();
    });
  }

  writable (level, key, value) {
    const sizeOk = (level >= levels.internal) || (bytes(value) <= this.maxPublicBytes);
    if (!sizeOk)
      return new ValueTooBigError(this.maxPublicBytes);

    if (!this.rules.canWrite(level, key))
      return new InvalidCredentialsError();

    return true;
  }
}

Filter.ValueTooBigError = ValueTooBigError;

module.exports = Filter;
