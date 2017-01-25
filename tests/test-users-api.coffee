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
data =
  tokens: [{
    key: 'valid'
    token: VALID_AUTH_TOKEN
  }]
  accounts:
    invalid: username: 'café'
    valid: username: 'jeko'

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

  beforeEach (done) ->
    @timeout 10000
    server = restify.createServer()
    authdb = fakeAuthdb.createClient()
    usermeta = fakeUsermeta.createClient()

    data.tokens.forEach (info) ->
      authdb.addAccount(info.token, {
        username: data.accounts[info.key].username
      })

    api.initialize (err) ->
      if err
        throw err
      server.use(restify.bodyParser())
      api.addRoutes(PREFIX, server)
      server.listen 1337, ->
        usermeta.set "valid", "mydata", "myvalue", done
    ,
      authdbClient: authdb
      usermetaClient: usermeta

  afterEach (done) ->
    server.close()
    done()

  describe 'GET /usermeta/v1/:username/:key', ->

    expectGetResponse = (err, res) ->
      expect(err).to.be.null
      expect(res.status).to.equal(200)
      expect(res.body).to.be.instanceof(Object)
      expect(res.body).to.be.ok

    testNullEndpoint = (username, key) -> (done) ->
      superagent
        .get endpoint "/#{username}/#{key}"
        .end (err, res) ->
          expectGetResponse err, res
          expect(res.body.key).to.equal key
          expect(res.body.value).to.equal null
          done()
      return

    it 'returns null value for non-existing metadata',
      testNullEndpoint 'valid', 'nodata'

    it 'returns null value for non-existing users',
      testNullEndpoint 'invalid', 'mydata'

    it 'returns existing metadata\'s value', (done) ->
      superagent
        .get endpoint '/valid/mydata'
        .end (err, res) ->
          expectGetResponse err, res
          expect(res.body.key).to.equal 'mydata'
          expect(res.body.value).to.equal 'myvalue'
          done()
      return

# vim: ts=2:sw=2:et:
