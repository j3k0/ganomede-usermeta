'use strict';

const {InvalidCredentialsError} = require('../../src/errors');
const levels = require('../../src/fields/levels');
const Rules = require('../../src/fields/Rules');
const Filter = require('../../src/fields/Filter');

describe('Filter', () => {
  const rules = new Rules({
    publicKeys: ['public', 'pub01'],
    protectedKeys: ['protected', 'pro01'],
    privateKeys: ['private', 'pri01'],
    internalKeys: ['internal', 'int01']
  });

  const filter = new Filter({rules, maxPublicBytes: 10});

  describe('#readable()', () => {
    it('turns unreadable keys into errors, leaves readbale as is', () => {
      const readables = filter.readable(levels.public, ['public', 'int01', 'pub01']);

      expect(readables).to.eql([
        'public',
        new InvalidCredentialsError(),
        'pub01'
      ]);
    });
  });

  describe('#writable()', () => {
    it('returns true if level can set key to a value', () => {
      expect(filter.writable(levels.protected, 'public', '0xdeadbeef')).to.be.true;
    });

    it('returns error if level is not high enough to write value', () => {
      expect(filter.writable(levels.public, 'public', '0xdeadbeef'))
        .to.be.instanceof(InvalidCredentialsError);
    });

    it('levels under internal can not write values over byte limit', () => {
      expect(filter.writable(levels.protected, 'protected', 'too-long-of-a-stirng'))
        .to.be.instanceof(Filter.ValueTooBigError);
    });

    it('internal can write values of any size', () => {
      expect(filter.writable(levels.internal, 'protected', 'too-long-of-a-stirng'))
        .to.be.true;
    });
  });
});
