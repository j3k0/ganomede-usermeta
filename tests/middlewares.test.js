'use strict';

const restify = require('restify');
const middlewares = require('../src/middlewares');

describe('Middlewares', () => {
  describe('requireSecret()', () => {
    it('calls next() if req.ganomede.secretMatches', (done) => {
      middlewares.requireSecret({ganomede: {secretMatches: true}}, {}, done);
    });

    it('calls next(error) if secret was not matched', (done) => {
      middlewares.requireSecret({ganomede: {secretMatches: false}}, {}, (err) => {
        expect(err).to.be.instanceof(restify.RestError);
        expect(err).to.have.property('restCode', 'InvalidCredentialsError');
        done();
      });
    });
  });

  describe('requireAuth()', () => {
    const authdbClient = td.object(['getAccount']);
    const mw = middlewares.requireAuth({authdbClient, secret: '42'});

    it('token is valid', (done) => {
      const req = {
        params: {token: 'token'},
        ganomede: {}
      };

      td.when(authdbClient.getAccount('token', td.callback))
        .thenCallback(null, 'user');

      mw(req, {}, (err) => {
        expect(err).to.not.be.ok;
        expect(req.ganomede).to.have.property('userId', 'user');
        expect(req.ganomede).to.not.have.property('secretMatches');
        done();
      });
    });

    it('spoofing secret is valid', (done) => {
      const req = {
        params: {token: '42.user'},
        ganomede: {}
      };

      mw(req, {}, (err) => {
        expect(err).to.not.be.ok;
        expect(req.ganomede).to.have.property('userId', 'user');
        expect(req.ganomede).to.have.property('secretMatches', true);
        done();
      });
    });

    it('token is invalid', (done) => {
      const req = {
        params: {token: 'oops'},
        ganomede: {}
      };

      td.when(authdbClient.getAccount('oops', td.callback))
        .thenCallback(null, null);

      mw(req, {}, (err) => {
        expect(err).to.be.instanceof(restify.RestError);
        expect(err).to.have.property('restCode', 'InvalidCredentialsError');
        expect(req.ganomede).to.not.have.property('secretMatches');
        done();
      });
    });

    it('spoofing secret is invalid', (done) => {
      const req = {
        params: {token: 'not-42.oops'},
        ganomede: {}
      };

      td.when(authdbClient.getAccount('not-42.oops'))
        .thenCallback(null, null);

      mw(req, {}, (err) => {
        expect(err).to.be.instanceof(restify.RestError);
        expect(err).to.have.property('restCode', 'InvalidCredentialsError');
        expect(req.ganomede).to.not.have.property('secretMatches');
        done();
      });
    });

    it('token is missing', (done) => {
      mw({params: Object.create(null)}, {}, (err) => {
        expect(err).to.be.instanceof(restify.RestError);
        expect(err).to.have.property('restCode', 'InvalidAuthTokenError');
        done();
      });
    });
  });
});
