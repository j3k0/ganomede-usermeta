'use strict';

const lodash = require('lodash');
const restify = require('restify');
const {InvalidAuthTokenError, InvalidCredentialsError, sendHttpError} = require('./errors');

const requireSecret = (req, res, next) => {
  return req.ganomede.secretMatches
    ? next()
    : sendHttpError(next, new InvalidCredentialsError());
};

const parseUserIdFromSecretToken = (secret, token) => {
  return secret && token && token.startsWith(secret) && (token.length > secret.length + 1)
    ? token.slice(secret.length + 1)
    : false;
};

// Retieve the account from authdb. Retry multiple times in case of a connection problem.
// Because we've seen this error in prod...
const retryGetAccount = (authdbClient, token, maxRetries, cb) => {
  authdbClient.getAccount(token, (err, redisResult) => {
    if (maxRetries > 0 && err && err.body && err.body.code == 'ECONNRESET') {
      setTimeout(() => {
        logger.warn({token, err, maxRetries}, 'authdbClient.getAccount() failed... retrying.');
        retryGetAccount(authdbClient, token, maxRetries - 1, cb);
      }, 100); // retry after 100ms
    }
    else {
      cb(err, redisResult);
    }
  });
};

const requireAuth = ({authdbClient, secret = false, paramName = 'token'} = {}) => (req, res, next) => {
  const token = lodash.get(req, `params.${paramName}`);
  if (!token)
    return sendHttpError(next, new InvalidAuthTokenError());

  const spoofed = secret && parseUserIdFromSecretToken(secret, token);
  if (spoofed) {
    req.ganomede.secretMatches = true;
    req.ganomede.userId = spoofed;
    return next();
  }

  retryGetAccount(authdbClient, token, 3, (err, redisResult) => {
    if (err) {
      if (err.body && err.body.code == 'ResourceNotFound') {
        req.log.info({token}, 'authdbClient account token not found');
        return sendHttpError(next, new restify.NotAuthorizedError());
      }
      else {
        req.log.error({token, err}, 'authdbClient.getAccount("%j") failed');
        return sendHttpError(next, new restify.InternalServerError());
      }
    }

    if (!redisResult)
      return sendHttpError(next, new InvalidCredentialsError());

    // Authdb already JSON.parsed redisResult for us,
    // but sometimes it is a string with user id,
    // and sometimes it is account object with {username, email, etc...}
    const userId = (typeof redisResult === 'string')
      ? redisResult
      : redisResult.username; // userId used to be username from profile

    if (!redisResult)
      return sendHttpError(next, new InvalidCredentialsError());

    req.ganomede.userId = userId;
    return next();
  });
};

module.exports = {
  requireSecret,
  requireAuth
};
