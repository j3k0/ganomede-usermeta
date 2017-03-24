'use strict';

describe('usermeta.router', () => {

  const redis = require('fakeredis');
  const authdb = require('authdb');
  const supertest = require('supertest');
  const ReadWrite = require('../src/fields/ReadWrite');
  const {createServer} = require('../src/server');
  const {createRouter} = require('../src/usermeta.router');

  let server;
  let redisClient;
  const go = () => supertest(server);

  beforeEach(done => {

    server = createServer();
    redisClient = redis.createClient();
    const usermetaRouter = createRouter({
      secret: 'api_secret',
      authdbClient: authdb.createClient({redisClient}),
      readWrite: new ReadWrite({
        redisClient: redisClient,
        fieldsConfig: {
          public: ['country', 'no_one_has_this_one'],
          protected: ['email'],
          private: ['private-field'],
          internal: ['key'],
          maxBytes: 200
        }
      })
    });
    usermetaRouter.addRoutes('', server);

    redisClient.multi()
    .flushdb()
    .mset([
      // tokens
      'alice_token', '"alice"',
      'bob_token', JSON.stringify({username: 'bob'}),
      // some metdata
      'alice:country', 'USA',
      'alice:email', 'alice@example.com',
      'alice:key', 'alice-key',
      'bob:country', 'Russia',
      'bob:email', 'bob@example.com'
    ])
    .exec(done);
  });

  afterEach(done => redisClient.flushdb(done));
  afterEach(done => redisClient.quit(done));

  describe('GET /:userIds/:metanames', () => {
    it('works for public fields', (done) => {
      go()
        .get('/alice,bob/country,email,key,no_one_has_this_one')
        .expect(200, {
          alice: {country: 'USA'},
          bob: {country: 'Russia'}
        }, done);
    });

    it('secret works', (done) => {
      go()
        .get('/alice/email')
        .query({secret: 'api_secret'})
        .expect(200, {alice: {email: 'alice@example.com'}}, done);
    });

    it('empty objects', (done) => {
      go()
        .get('/alice,some-random-guy/no-such-field')
        .expect(200, {
          alice: {},
          'some-random-guy': {}
        }, done);
    });
  });

  describe('GET /auth/:token/:metanames', () => {
    it('works with token', (done) => {
      go()
        .get('/auth/alice_token/country,email,key,no_one_has_this_one')
        .expect(200, {
          alice: {
            country: 'USA',
            email: 'alice@example.com'
          },
        }, done);
    });

    it('works with secret', (done) => {
      go()
        .get('/auth/api_secret.alice/country,email,key,no_one_has_this_one')
        .expect(200, {
          alice: {
            country: 'USA',
            email: 'alice@example.com',
            key: 'alice-key'
          },
        }, done);
    });
  });

  describe('POST /auth/:token/:metaname', () => {
    it('works with token', (done) => {
      go()
        .post('/auth/bob_token/email')
        .send({value: 'new-bob@example.com'})
        .expect(200, {})
        .end((err, res) => {
          expect(err).to.be.null;
          redisClient.get('bob:email', (err, val) => {
            expect(err).to.be.null;
            expect(val).to.equal('new-bob@example.com');
            done();
          });
        });
    });

    it('works with secret', (done) => {
      go()
        .post('/auth/api_secret.bob/key')
        .send({value: 'bob-key'})
        .expect(200, {})
        .end((err, res) => {
          expect(err).to.be.null;
          redisClient.get('bob:key', (err, val) => {
            expect(err).to.be.null;
            expect(val).to.equal('bob-key');
            done();
          });
        });
    });

    it('returns 401 on trying to write private field with token', (done) => {
      go()
        .post('/auth/alice_token/private-field')
        .send({value: 'w/ever'})
        .expect(401)
        .end((err, res) => {
          expect(err).to.be.null;
          redisClient.exists('alice:private-field', (err, exists) => {
            expect(err).to.be.null;
            expect(exists).to.equal(0);
            done();
          });
        });
    });
  });

  describe('POST /auth/:token', () => {
    it('works with token', (done) => {
      go()
        .post('/auth/bob_token')
        .send({
          email: 'this',
          country: 'that'
        })
        .expect(200, {})
        .end((err, res) => {
          expect(err).to.be.null;
          redisClient.mget('bob:email', 'bob:country', (err, val) => {
            expect(err).to.be.null;
            expect(val).to.eql(['this', 'that']);
            done();
          });
        });
    });

    it('works with secret', (done) => {
      go()
        .post('/auth/api_secret.bob')
        .send({
          email: 'xxx',
          key: 'yyy'
        })
        .expect(200, {})
        .end((err, res) => {
          expect(err).to.be.null;
          redisClient.mget('bob:email', 'bob:key', (err, val) => {
            expect(err).to.be.null;
            expect(val).to.eql(['xxx', 'yyy']);
            done();
          });
        });
    });

    it('errors on non-flat objects', (done) => {
      go()
        .post('/auth/bob_token')
        .send({
          email: 'xxx',
          strings: {only: ['pretty', 'please']}
        })
        .expect(400, /Invalid value/, done);
    });

    it('errors on single field error', (done) => {
      go()
        .post('/auth/bob_token')
        .send({
          email: 'xxx',
          'wierd-uknown-key': 'yyy'
        })
        .expect(401, done);
    });
  });
});
