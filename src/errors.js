'use strict';

const util = require('util');
const restify = require('restify');
const logger = require('./logger');

// The way to distinguish our app's logic-level errors from others.
// (Like `socket hang up` vs `user already exists`.)
//
// So the basic idea is to create things like @UserNotFoundError (see below),
// define appropriate statusCode and message on it (maybe some params),
// and return those from lower-level places. Then:
//
//   app.get('/users/:id', (req, res) => {
//     if (req.params.id.lengt < 3) // some check
//       return sendHttpError(new restify.BadRequestError());
//
//     orm.findUser(req.params.id, (err, user) => {
//       return err
//         ? sendHttpError(next, err) // this would be instance of UserNotFoundError
//                                    // or perhaps some other GanomedeError, so it'll
//                                    // get converted via #toRestError().
//                                    // Otherwise it'll be passed to default handler.
//         : res.json(user);
//     });
//   })
//
// It can also be sometimes useful to add error classes for driver's errors.
// This way we push mapping between some obscure error codes and stuff closer
// to our app into the wrapper. For example:
//
//    // db-wrapper.js
//    class Db {}
//    Db.MissingDocumentError = class MissingDocument extends GanomedeError {};
//    module.exports = Db;
//
//    // orm.js
//    const findUser = (userId, callback) => {
//      new Db().fetchDocument(userId, (err, json) => {
//        if (err instanceof Db.MissingDocumentError) {
//          // here we now what missing document means
//          // (and DB knows how to distinguish missing document errors
//          // from, say, "cannot connect to hostname")
//          return callback(new UserNotFoundError(userId));
//
//        // …
//      });
//    };

class GanomedeError extends Error {
  constructor (...messageArgs) {
    super();
    this.name = this.constructor.name;

    if (messageArgs.length > 0)
      this.message = util.format.apply(util, messageArgs);

    Error.captureStackTrace(this, this.constructor);
  }
}

// This is for validation errors (like missing `body` or certain parts of it),
// same as base error except it allows to specify custom restCode
// via changing instance's .name (see GanomedeError#toRestError()).
//
// Use like this:
//
//   if (!req.body.userId) {
//     const err = new RequestValidationError('BadUserId', 'Invalid or missing User ID');
//     return sendHttpError(next, err);
//   }
//
//   // will result in http 404 with json body:
//   // { "code": "BadUserId",
//   //   "message": "Invalid or missing User ID" }
class RequestValidationError extends GanomedeError {
  constructor (name, ...messageArgs) {
    super(...messageArgs);
    this.name = name;
    this.statusCode = 400;
  }
}

class InvalidAuthTokenError extends GanomedeError {
  constructor () {
    super('Invalid auth token');
    this.statusCode = 401;
  }
}

class InvalidCredentialsError extends GanomedeError {
  constructor () {
    super('Invalid credentials');
    this.statusCode = 401;
  }
}

const toRestError = (error) => {
  if (!error.statusCode)
    throw new Error(`Please define "statusCode" prop for ${error.constructor.name}`);

  return new restify.RestError({
    restCode: error.name,
    statusCode: error.statusCode,
    message: error.message
  });
};

// Kept forgetting `next` part, so let's change this to (next, err).
const sendHttpError = (next, err) => {
  // When we have an instance of GanomedeError, it means stuff that's defined here, in this file.
  // So those have `statusCode` and convertable to rest errors.
  // In case they don't, we die (because programmers error ("upcast" it) not runtime's).
  //
  // We also don't need to log them, because these are normal situations
  // (like UserNotFound or BadRequest, though, feel free to change this.)
  if (err instanceof GanomedeError) {
    logger.debug(err);
    return next(toRestError(err));
  }

  logger.error(err);
  next(err);
};

module.exports = {
  GanomedeError,
  RequestValidationError,
  InvalidAuthTokenError,
  InvalidCredentialsError,
  sendHttpError
};
