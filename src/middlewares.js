'use strict';

const lodash = require('lodash');
const restify = require('restify');
const {InvalidAuthTokenError, InvalidCredentialsError, sendHttpError} = require('./errors');
const logger = require('./logger');

const requireSecret = (req, res, next) => {
  return req.ganomede.secretMatches
    ? next()
    : sendHttpError(next, new InvalidCredentialsError());
};

const parseUsernameFromSecretToken = (secret, token) => {
  return secret && token && token.startsWith(secret) && (token.length > secret.length + 1)
    ? token.slice(secret.length + 1)
    : false;
};

const requireAuth = ({authdbClient, secret = false, paramName = 'token'} = {}) => (req, res, next) => {
  const token = lodash.get(req, `params.${paramName}`);
  if (!token)
    return sendHttpError(next, new InvalidAuthTokenError());

  const spoofed = secret && parseUsernameFromSecretToken(secret, token);
  if (spoofed) {
    req.ganomede.secretMatches = true;
    req.ganomede.username = spoofed;
    return next();
  }

  authdbClient.getAccount(token, (err, username) => {
    if (err) {
      logger.error('authdbClient.getAccount("%j") failed', token, err);
      return sendHttpError(next, new restify.InternalServerError());
    }

    if (!username)
      return sendHttpError(next, new InvalidCredentialsError());

    req.ganomede.username = username;
    return next();
  });
};

module.exports = {
  requireSecret,
  requireAuth
};
