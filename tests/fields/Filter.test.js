'use strict';

const Filter = require('../../src/fields/Filter');
const levels = require('../../src/fields/levels');

describe('Filter', () => {
  const filter = new Filter({
    publicKeys: ['public', 'pub01'],
    protectedKeys: ['protected', 'pro01'],
    privateKeys: ['private', 'pri01'],
    internalKeys: ['internal', 'int01']
  });

  describe('new Filter()', () => {
    it('throws on key intersection', () => {
      const create = () => new Filter({
        publicKeys: ['same key'],
        protectedKeys: ['same key'],
        privateKeys: ['different'],
        internalKeys: ['i am unique']
      });

      expect(create).to.throw(/^Intersection between different key levels/);
    });
  });

  describe('#canRead()', () => {
    it('public can be read by any level', () => {
      expect(filter.canRead(levels.public, 'pub01')).to.be.true;
    });

    it('protected can be read by protected and up', () => {
      expect(filter.canRead(levels.public, 'pro01')).to.be.false;
      expect(filter.canRead(levels.protected, 'pro01')).to.be.true;
    });

    it('private can be read by private and up', () => {
      expect(filter.canRead(levels.protected, 'pri01')).to.be.false;
      expect(filter.canRead(levels.private, 'pri01')).to.be.true;
    });

    it('internal can be read by internal and up', () => {
      expect(filter.canRead(levels.private, 'int01')).to.be.false;
      expect(filter.canRead(levels.internal, 'int01')).to.be.true;
    });

    it('no one can read uknown keys', () => {
      expect(filter.canRead(levels.internal, 'missing')).to.be.false;
    });
  });

  describe('#canWrite()', () => {
    it('public can be written by protected and up', () => {
      expect(filter.canWrite(levels.public, 'pub01')).to.be.false;
      expect(filter.canWrite(levels.protected, 'pub01')).to.be.true;
    });

    it('protected can be written by protected and up', () => {
      expect(filter.canWrite(levels.public, 'pro01')).to.be.false;
      expect(filter.canWrite(levels.protected, 'pro01')).to.be.true;
    });

    it('private can be written by internal and up', () => {
      expect(filter.canWrite(levels.private, 'pri01')).to.be.false;
      expect(filter.canWrite(levels.internal, 'pri01')).to.be.true;
    });

    it('internal can be written by internal and up', () => {
      expect(filter.canWrite(levels.private, 'int01')).to.be.false;
      expect(filter.canWrite(levels.internal, 'int01')).to.be.true;
    });

    it('no one can write uknown keys', () => {
      expect(filter.canWrite(levels.internal, 'missing')).to.be.false;
    });
  });
});
