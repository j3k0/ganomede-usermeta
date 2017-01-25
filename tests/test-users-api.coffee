assert = require "assert"
superagent = require 'superagent'
fakeRedis = require "fakeredis"
fakeAuthdb = require "./fake-authdb"
fakeUsermeta = require "./fake-usermeta"
restify = require 'restify'
api = require '../src/users-api'
{expect} = require 'chai'

PREFIX = 'usermeta/v1'

VALID_AUTH_TOKEN = 'deadbeef'
VALID_USERNAME = 'jeko'
VALID_KEY = 'mydata'
VALID_VALUE = 'myvalue'

INVALID_AUTH_TOKEN = 'invalid-token'
INVALID_USERNAME = 'invalid'
INVALID_KEY = 'nodata'

POST_KEY = 'postdata'
POST_VALUE = '123456'

describe 'users-api', ->

  server = null
  authdb = null

  endpoint = (token, path) ->
    if !path
      path = token
      token = null
    host = "http://localhost:#{server.address().port}"
    if token
      return "#{host}/#{PREFIX}/auth/#{token}#{path}"
    else
      return "#{host}/#{PREFIX}#{path}"

  usermeta = null

  beforeEach (done) ->
    @timeout 10000
    server = restify.createServer()
    authdb = fakeAuthdb.createClient()
    usermeta = fakeUsermeta.createClient()

    authdb.addAccount VALID_AUTH_TOKEN,
      username: VALID_USERNAME

    api.initialize (err) ->
      if err
        throw err
      server.use(restify.bodyParser())
      api.addRoutes(PREFIX, server)
      server.listen 1337, ->
        usermeta.set VALID_USERNAME, VALID_KEY, VALID_VALUE, done
    ,
      authdbClient: authdb
      usermetaClient: usermeta

  afterEach (done) ->
    server.close()
    done()

  publicEndpoint = (username, token, key) ->
    endpoint "/#{username}/#{key}"

  protectedEndpoint = (username, token, key) ->
    endpoint "/auth/#{token}/#{key}"

  testGet = (endpoint) -> () ->

    expectGetResponse = (err, res) ->
      expect(err).to.be.null
      expect(res.status).to.equal 200
      expect(res.body).to.be.instanceof Object
      expect(res.body).to.be.ok

    testNullEndpoint = (username, token, key) -> (done) ->
      superagent
        .get endpoint username, token, key
        .end (err, res) ->
          if endpoint == protectedEndpoint and token != VALID_AUTH_TOKEN
            expect(err).to.be.ok
            expect(res.status).to.equal 401
          else
            expectGetResponse err, res
            expect(res.body.key).to.equal key
            expect(res.body.value).to.equal null
          done()
      return

    it 'returns null value for non-existing metadata',
      testNullEndpoint VALID_USERNAME, VALID_AUTH_TOKEN, INVALID_KEY

    it 'returns null value for non-existing users',
      testNullEndpoint INVALID_USERNAME, INVALID_AUTH_TOKEN, VALID_KEY

    it 'returns existing metadata\'s value', (done) ->
      superagent
        .get endpoint VALID_USERNAME, VALID_AUTH_TOKEN, VALID_KEY
        .end (err, res) ->
          expectGetResponse err, res
          expect(res.body.key).to.equal VALID_KEY
          expect(res.body.value).to.equal VALID_VALUE
          done()
      return

  describe 'GET /usermeta/v1/:username/:key',
    testGet publicEndpoint
  describe 'GET /usermeta/v1/auth/:token/:key',
    testGet protectedEndpoint

  describe 'POST /usermeta/v1/auth/:token/:key', () ->

    it 'rejects invalid auth tokens', (done) ->
      superagent
        .post protectedEndpoint INVALID_USERNAME, INVALID_AUTH_TOKEN, POST_KEY
        .send value: POST_VALUE
        .end (err, res) ->
          expect(err).to.be.ok
          expect(res.status).to.equal 401
          done()
      return

    it 'stores user metadata\'s value', (done) ->
      superagent
        .post protectedEndpoint VALID_USERNAME, VALID_AUTH_TOKEN, POST_KEY
        .send value: POST_VALUE
        .end (err, res) ->
          expect(err).to.be.null
          expect(res.status).to.equal 200
          usermeta.get VALID_USERNAME, VALID_KEY, (err, value) ->
            expect(value).to.equal VALID_VALUE
            done()
      return

# vim: ts=2:sw=2:et:
