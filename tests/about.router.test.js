'use strict';

describe('about-router', () => {

  const supertest = require('supertest');
  const pkg = require('../package.json');
  const config = require('../config');
  let server;

  beforeEach(done => {
    server = require('../src/server').createServer();
    const about = require('../src/about.router');
    about.addRoutes(config.http.prefix, server);
    server.listen(done);
  });

  afterEach(done => server.close(done));

  const test = (url) => {
    it(`GET ${url}`, (done) => {
      supertest(server)
        .get(url)
        .expect(200)
        .end((err, res) => {
          expect(err).to.be.null;
          expect(res.body).to.have.property('type', pkg.name);
          done();
        });
    });
  };

  test('/about');
  test(`${config.http.prefix}/about`);
});
