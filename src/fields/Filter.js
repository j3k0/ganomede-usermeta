'use strict';

//
// Filter class decides when a metadata can be read or writen
// based on its key and value.
//
// It enforce the size limit for non-internal metadata.
// It delegates keys access-control filtering to the Rules class.
//

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
    return keys.filter(key => this.rules.canRead(level, key));
  }

  writable (level, key, value) {
    const sizeOk = (level >= levels.internal) || (bytes(value) <= this.maxPublicBytes);
    if (!sizeOk)
      return new ValueTooBigError(this.maxPublicBytes);

    if (!this.rules.canWrite(level, key))
      return new InvalidCredentialsError();

    return true;
  }

  allWritable (level, keys, values) {
    let error = null;

    keys.every((key, idx) => {
      const val = values[idx];
      const can = this.writable(level, key, val);
      const fail = can instanceof Error;

      if (fail)
        error = can;

      return !fail;
    });

    return error || true;
  }
}

Filter.ValueTooBigError = ValueTooBigError;

module.exports = Filter;
