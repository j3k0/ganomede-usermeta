# Users API
#
# Implements the users API using Stormpath
#

authdb = require "authdb"
restify = require "restify"
log = require "./log"
helpers = require "ganomede-helpers"
usermeta = require "./usermeta"
stats = require('./statsd-wrapper')

serviceConfig = helpers.links.ServiceEnv.config

sendError = (err, next) ->
  log.error err
  next err

# Retrieve Stormpath configuration from environment
apiSecret = process.env.API_SECRET || null

# Connection to AuthDB
authdbClient = null

# Connection to usermeta database
usermetaClient = null

# Generate a random token
rand = ->
  Math.random().toString(36).substr(2)
genToken = -> rand() + rand()

# Add authentication token in authDB, save 'auth' metadata.
addAuth = (account) ->

  # Generate and save the token
  token = account.token || genToken()
  authdbClient.addAccount token,
    username: account.username
    email: account.email

  # Store the auth date (in parallel, ignoring the outcome)
  timestamp = "" + (new Date().getTime())
  usermetaClient.set account.username, "auth", timestamp, (err, reply) ->

  # Return REST-ready authentication data
  {
    username: account.username
    email: account.email
    token: token
  }

# callback(error, isBannedBoolean)
checkBan = (username, callback) ->
  bans.get username, (err, ban) ->
    if (err)
      log.error('checkBan() failed', {err, username})
      return callback(err)

    callback(null, ban.exists)

# next() - no error, no ban
# next(err) - error
# res.send(403) - no error, ban
checkBanMiddleware = (req, res, next) ->
  username = (req.params && req.params.username) ||
             (req.body && req.body.username) ||
             null

  if (!username)
    return sendError(new restify.BadRequestError, next)

  checkBan username, (err, exists) ->
    if (err)
      return next(err)

    if (exists)
      # Remove authToken of banned accounts
      if (req.params.authToken)
        authdbClient.addAccount(req.params.authToken, null, () ->)

      return res.send(403)

    next()

authMiddleware = (req, res, next) ->
  authToken = req.params.authToken
  if !authToken
    return sendError(new restify.InvalidContentError('invalid content'), next)

  if apiSecret
    separatorIndex = authToken.indexOf ":"
    if separatorIndex > 0
      reqApiSecret = authToken.substr(0, separatorIndex)
      username = authToken.substr(separatorIndex + 1, authToken.length)
      if apiSecret == reqApiSecret
        req.params.user =
          username: username
      next()
      return

  authdbClient.getAccount authToken, (err, account) ->
    if err || !account
      return sendError(new restify.UnauthorizedError('not authorized'), next)

    req.params.user = account
    next()

# Set metadata
postMetadata = (req, res, next) ->
  username = req.params.user.username
  key = req.params.key
  value = req.body.value
  usermetaClient.set username, key, value, (err, reply) ->
    if (err)
      log.error
        err:err
        reply:reply
    res.send ok:!err
    next()

# Get metadata
getMetadata = (req, res, next) ->
  username = req.params.username || req.params.user.username
  key = req.params.key
  usermetaClient.get username, key, (err, reply) ->
    res.send
      key: key
      value: reply
    next()

# Initialize the module
initialize = (cb, options = {}) ->

  # initialize authdbClient
  if options.authdbClient
    authdbClient = options.authdbClient
  else
    redisAuthConfig = serviceConfig 'REDIS_AUTH', 6379
    if !redisAuthConfig.exists
      msg = "can't create authdb client, no REDIS_AUTH database"
      return cb(new Error(msg))
    log.info authdbConfig: redisAuthConfig
    authdbClient = authdb.createClient
      host: redisAuthConfig.host
      port: redisAuthConfig.port

  # initialize usermetaClient
  if options.usermetaClient
    usermetaClient = options.usermetaClient
  else
    redisUsermetaConfig = serviceConfig 'REDIS_USERMETA', 6379
    if !redisUsermetaConfig.exists
      msg = "can't create usermeta client, no REDIS_USERMETA database"
      return cb(new Error(msg))
    redisUsermetaConfig.options =
      no_ready_check: true
    log.info usermetaConfig:redisUsermetaConfig
    usermetaClient = usermeta.create redisUsermetaConfig

  cb()

# Register routes in the server
addRoutes = (prefix, server) ->
  server.post "/#{prefix}/auth/:authToken/:key",
    authMiddleware, postMetadata
  server.get "/#{prefix}/auth/:authToken/:key",
    authMiddleware, getMetadata
  server.get "/#{prefix}/:username/:key", getMetadata

module.exports =
  initialize: initialize
  addRoutes: addRoutes

# vim: ts=2:sw=2:et:
