'use strict';

describe('ping-router', () => {

  const supertest = require('supertest');
  const config = require('../config');

  let server;
  const go = () => supertest(server);
  const url = `${config.http.prefix}/ping/something`;

  beforeEach(done => {
    const {createServer} = require('../src/server');
    const {addRoutes} = require('../src/ping.router');
    server = createServer();
    addRoutes(config.http.prefix, server);
    server.listen(done);
  });

  afterEach(done => server.close(done));

  it('GET /ping/:token', (done) => {
    go()
      .get(url)
      .expect(200, '"pong/something"', done);
  });

  it('HEAD /ping/:token', (done) => {
    go()
      .head(url)
      .expect(200, done);
  });
});
