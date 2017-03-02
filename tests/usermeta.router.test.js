'use strict';

const redis = require('redis');
const authdb = require('authdb');
const supertest = require('supertest');
const ReadWrite = require('../src/fields/ReadWrite');
const createServer = require('../src/server');
const usermetaRouter = require('../src/usermeta.router');

describe('usermeta.router', () => {
  const server = createServer();
  const go = () => supertest(server);
  const redisClient = redis.createClient();
  const usermeta = usermetaRouter({
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

  usermeta('', server);

  before(done => redisClient.multi()
    .flushdb()
    .mset([
      // tokens
      'alice_token', '"alice"',
      // some metdata
      'alice:country', '"USA"',
      'alice:email', '"alice@example.com"',
      'alice:key', '"alice-key"',
      'bob:country', '"Russia"',
      'bob:email', '"bob@example.com"',
      'bob:key', 'null',
    ])
    .exec(done)
  );

  after(done => redisClient.flushdb(done));
  after(done => redisClient.quit(done));

  describe('GET /:usernames/:metanames', () => {
    it('works for public fields', (done) => {
      go()
        .get('/alice,bob/country,email,key,no_one_has_this_one')
        .expect(200, {
          alice: {country: 'USA'},
          bob: {country: 'Russia'}
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
        .get('/auth/api_secret.bob/country,email,key,no_one_has_this_one')
        .expect(200, {
          bob: {
            country: 'Russia',
            email: 'bob@example.com',
            key: null
          },
        }, done);
    });
  });

  describe('POST /auth/:token/:metaname', () => {
    it('works with token', (done) => {
      go()
        .post('/auth/alice_token/email')
        .send({value: 'new-alice@example.com'})
        .expect(200)
        .end((err, res) => {
          expect(err).to.be.null;
          redisClient.get('alice:email', (err, val) => {
            expect(err).to.be.null;
            expect(val).to.equal('"new-alice@example.com"');
            done();
          });
        });
    });

    it('works with secret', (done) => {
      go()
        .post('/auth/api_secret.bob/key')
        .send({value: 'bob-key'})
        .expect(200)
        .end((err, res) => {
          expect(err).to.be.null;
          redisClient.get('bob:key', (err, val) => {
            expect(err).to.be.null;
            expect(val).to.equal('"bob-key"');
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
});