'use strict';

const ganomedeDirectory = require('ganomede-directory');
const redis = require('redis');
const {sendHttpError, RequestValidationError} = require('./errors');
const middlewares = require('./middlewares');
const ReadWrite = require('./fields/ReadWrite');
const {parse} = require('./fields/levels');
const {hasOwnProperty} = require('./utils');
const config = require('../config');

const createRouter = ({
  secret = config.secret,
  authdbClient = ganomedeDirectory.createAuthdbClient({}),
  readWrite = new ReadWrite({
    redisClient: redis.createClient(config.redisUsermeta),
    fieldsConfig: config.fields
  })
} = {}) => {
  const requireAuth = middlewares.requireAuth({authdbClient, secret});

  const parseLevel = (req, res, next) => {
    req.ganomede.accessLevel = parse(req.ganomede);
    next();
  };

  const normalizeCSV = (reqParams, param) => {
    const error = () => new RequestValidationError(
      `Invalid${param[0].toUpperCase()}${param.slice(1)}`,
      `Parameter :${param} is invalid or missing.`
    );

    if (!hasOwnProperty(reqParams, param) || !reqParams[param])
      return error();

    const parts = String(reqParams[param]).split(',');
    const values = parts
      .map(val => val.trim())
      .filter(val => !!val);

    return ((values.length === 0) || (values.length !== parts.length))
      ? error()
      : values;
  };

  const parseCsvParam = (paramKey) => (req, res, next) => {
    const values = normalizeCSV(req.params, paramKey);

    if (values instanceof Error)
      return sendHttpError(next, values);

    req.ganomede[paramKey] = values;
    next();
  };

  const readMetas = (userIdsKey) => (req, res, next) => {
    const {accessLevel, metanames} = req.ganomede;
    const userIds = req.ganomede[userIdsKey];
    readWrite.read(accessLevel, userIds, metanames, (err, result) => {
      if (err)
        return sendHttpError(next, err);

      res.json(result);
      next();
    });
  };

  const hasBody = (req) => req.body && (typeof req.body === 'object') && (Object.keys(req.body).length > 0);
  const hasBodyKey = (body, key) => hasOwnProperty(body, key) && (typeof body[key] === 'string');

  const addRoutes = (prefix, server) => {
    server.get(`${prefix}/:userIds/:metanames`,
      parseLevel, parseCsvParam('userIds'), parseCsvParam('metanames'), readMetas('userIds'));

    server.get(`${prefix}/auth/:token/:metanames`,
      requireAuth, parseLevel, parseCsvParam('metanames'), readMetas('userId'));

    server.post(`${prefix}/auth/:token`, requireAuth, parseLevel, (req, res, next) => {
      const ok = hasBody(req) && Object.keys(req.body).every(key => hasBodyKey(req.body, key));
      if (!ok)
        return sendHttpError(next, new RequestValidationError('InvalidValue', 'Invalid value'));

      readWrite.writeMulti(
        req.ganomede.accessLevel,
        req.ganomede.userId,
        req.body,
        (err) => {
          if (err)
            return sendHttpError(next, err);

          res.json({});
          next();
        }
      );
    });

    server.post(`${prefix}/auth/:token/:metaname`, requireAuth, parseLevel, (req, res, next) => {
      if (!(hasBody(req) && hasBodyKey(req.body, 'value')))
        return sendHttpError(next, new RequestValidationError('InvalidValue', 'Invalid value'));

      readWrite.write(
        req.ganomede.accessLevel,
        req.ganomede.userId,
        req.params.metaname,
        req.body.value,
        (err) => {
          if (err)
            return sendHttpError(next, err);

          res.json({});
          next();
        }
      );
    });
  };
  return {addRoutes};
};

module.exports = {createRouter};
