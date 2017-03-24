'use strict';

describe('Filter', () => {

  const {InvalidCredentialsError} = require('../../src/errors');
  const levels = require('../../src/fields/levels');
  const Rules = require('../../src/fields/Rules');
  const Filter = require('../../src/fields/Filter');

  const rules = new Rules({
    publicKeys: ['public', 'pub01'],
    protectedKeys: ['protected', 'pro01'],
    privateKeys: ['private', 'pri01']
  });

  const filter = new Filter({rules, maxPublicBytes: 10});

  describe('#readable()', () => {
    it('removes keys that are unreadable at that level', () => {
      const readables = filter.readable(levels.public, ['public', 'int01', 'pub01']);
      expect(readables).to.eql(['public', 'pub01']);
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

  describe('#allWritable()', () => {
    it('returns true if all fields can be written under level', () => {
      expect(filter.allWritable(levels.private, ['public', 'pub01'], ['small', 'enough']))
        .to.be.true;
    });

    it('returns false if single fields can not be written under level', () => {
      expect(filter.allWritable(levels.private, ['public', 'internal'], ['small', 'enough']))
        .to.be.instanceof(InvalidCredentialsError);
    });

    it('returns first error encountered', () => {
      expect(filter.allWritable(levels.private, ['public', 'pub01', 'internal'], ['x', 'too-big-of-a-string', 'small']))
        .to.be.instanceof(Filter.ValueTooBigError);
    });
  });
});
