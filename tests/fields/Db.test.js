'use strict';

const Db = require('../../src/fields/Db');

describe('Db', () => {
  describe('#getKeys()', () => {
    it('calls mget', (done) => {
      const redisClient = td.object(['mget']);
      const db = new Db({redisClient});

      td.when(redisClient.mget(['a', 'b', 'c'], td.callback))
        .thenCallback(null, ['1', '2', null]);

      db.getKeys(['a', 'b', 'c'], (err, values) => {
        expect(err).to.be.null;
        expect(values).to.eql(['1', '2', null]);
        done();
      });
    });

    it('fetching empty keys is fine', (done) => {
      new Db({}).getKeys([], (err, values) => {
        expect(err).to.be.null;
        expect(values).to.eql([]);
        done();
      });
    });
  });

  it('#setKeys() calls mset with JSON strings', (done) => {
    const redisClient = td.object(['mset']);
    const db = new Db({redisClient});
    const keys = ['a', 'b', 'c', 'd'];
    const values = [null, {x: true}, 3, ['f']];

    td.when(redisClient.mset(['a', 'null', 'b', '{"x":true}', 'c', '3', 'd', '["f"]'], td.callback))
      .thenCallback(null, 'OK');

    db.setKeys(keys, values, (err, reply) => {
      expect(err).to.be.null;
      expect(reply).to.be.equal('OK');
      done();
    });
  });
});
