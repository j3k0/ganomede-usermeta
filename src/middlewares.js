'use strict';

const restify = require('restify');
const {sendHttpError} = require('./errors');

const requireSecret = (req, res, next) => {
  return req.ganomede.secretMatches
    ? next()
    : sendHttpError(next, new restify.NotAuthorizedError());
};

module.exports = {requireSecret};
