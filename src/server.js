'use strict';

const restify = require('restify');
const logger = require('./logger');
const config = require('../config');

const matchSecret = (obj, prop) => {
  if (!config.secret)
    return false;

  const has = obj && obj[prop] && Object.hasOwnProperty.call(obj[prop], 'secret');
  const match = has && (typeof obj[prop].secret === 'string')
    && (obj[prop].secret.length > 0) && (obj[prop].secret === config.secret);

  if (has)
    delete obj[prop].secret;

  return match;
};

// Init object to dump our stuff into.
const initReqGanomede = (req, res, next) => {
  req.ganomede = {
    secretMatches: matchSecret(req, 'body') || matchSecret(req, 'query')
  };

  next();
};

// Automatically add a request-id to the response
const setRequestId = (req, res, next) => {
  res.setHeader('x-request-id', req.id());
  req.log = req.log.child({req_id: req.id()});
  next();
};

const shouldLogRequest = (req) =>
  (req.url !== `/${config.http.prefix}/ping/_health_check`);

const shouldLogResponse = (res) =>
  (res && res.statusCode >= 500);

const filteredLogger = (errorsOnly, logger) => (req, res, next) => {
  const logError = errorsOnly && shouldLogResponse(res);
  const logInfo = !errorsOnly && (
    shouldLogRequest(req) || shouldLogResponse(res));
  if (logError || logInfo)
    logger(req, res);
  if (next && typeof next === 'function')
    next();
};

const requestLogger = filteredLogger(false, (req) =>
  req.log.info({req_id: req.id()}, `${req.method} ${req.url}`));

const createServer = () => {
  const server = restify.createServer({
    handleUncaughtExceptions: true,
    log: logger
  });

  server.use(requestLogger);
  server.use(restify.queryParser());
  server.use(restify.bodyParser());
  server.use(initReqGanomede);
  server.use(setRequestId);

  // Audit requests
  server.on('after', filteredLogger(process.env.NODE_ENV === 'production',
    restify.auditLogger({log: logger, body: true})));

  return server;
};

module.exports = {createServer};
