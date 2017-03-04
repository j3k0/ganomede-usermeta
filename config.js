'use strict';

const util = require('util');
const bunyan = require('bunyan');
const {ServiceEnv} = require('ganomede-helpers').links;
const pkg = require('./package.json');

const parseLogLevel = (envValue) => {
  const defaultLevel = 'INFO';
  const desiredLevel = envValue ? String(envValue) : defaultLevel;
  const levels = [
    'FATAL',
    'ERROR',
    'WARN',
    'INFO',
    'DEBUG',
    'TRACE'
  ];

  const hasMatch = levels.includes(desiredLevel);
  const level = hasMatch ? desiredLevel : defaultLevel;

  if (!hasMatch) {
    const available = `Please specify one of ${util.inspect(levels)}.`;
    const message = `Uknown log level "${desiredLevel}". ${available}`;
    throw new Error(message);
  }

  return bunyan[level];
};

const parseApiSecret = () => {
  const valid = process.env.hasOwnProperty('API_SECRET')
    && (typeof process.env.API_SECRET === 'string')
    && (process.env.API_SECRET.length > 0);

  if (!valid)
    throw new Error('API_SECRET must be non-empty string');

  return process.env.API_SECRET;
};

const parseMaxBytes = () => {
  if (!process.env.hasOwnProperty('USERMETA_MAX_LENGTH'))
    return 200;

  const val = String(process.env.USERMETA_MAX_LENGTH);
  const int = parseInt(val, 10);
  if (String(int) !== val)
    throw new Error('Invalid integer format on env var USERMETA_MAX_LENGTH');

  return int;
};

const parseFields = (envName) => {
  if (!process.env.hasOwnProperty(envName))
    throw new Error(`Missing env var with keys ${envName}, provide empty string for []`);

  const val = process.env[envName];
  if (val === '')
    return [];

  return val
    .split(',')
    .map(key => {
      if (key.trim() !== key)
        throw new Error(`Invalid key ${key} inside ${envName} (whitespace)`);

      if (!parseFields.validKeyRegexp.test(key))
        throw new Error(`Invalid key ${key} inside ${envName} (regex)`);

      return key;
    });
};

parseFields.validKeyRegexp = /^[a-z0-9_$]+$/i;

module.exports = {
  name: pkg.name,
  logLevel: parseLogLevel(process.env.BUNYAN_LEVEL),
  secret: parseApiSecret(),

  fields: global.__ganomedeTest ? {} : {
    public: parseFields('USERMETA_PUBLIC_KEYS'),
    protected: parseFields('USERMETA_PROTECTED_KEYS'),
    private: parseFields('USERMETA_PRIVATE_KEYS'),
    internal: parseFields('USERMETA_INTERNAL_KEYS'),
    maxBytes: parseMaxBytes() // for non-internal fields
  },

  http: {
    host: process.env.HOST || '0.0.0.0',
    port: process.env.hasOwnProperty('PORT')
      ? parseInt(process.env.PORT, 10)
      : 8000,
    prefix: `/${pkg.api}`
  },

  redisAuthdb: {
    hostname: ServiceEnv.host('REDIS_AUTH', 6379),
    port: ServiceEnv.port('REDIS_AUTH', 6379)
  },

  redisUsermeta: {
    hostname: ServiceEnv.host('REDIS_USERMETA', 6379),
    port: ServiceEnv.port('REDIS_USERMETA', 6379)
  }
};

if (!module.parent)
  require('./src/utils').debugPrint(module.exports);
