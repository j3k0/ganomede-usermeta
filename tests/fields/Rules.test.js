'use strict';

const Rules = require('../../src/fields/Rules');
const levels = require('../../src/fields/levels');

describe('Rules', () => {
  const rules = new Rules({
    publicKeys: ['public', 'pub01'],
    protectedKeys: ['protected', 'pro01'],
    privateKeys: ['private', 'pri01'],
    internalKeys: ['internal', 'int01']
  });

  describe('new Rules()', () => {
    it('throws on key intersection', () => {
      const create = () => new Rules({
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
      expect(rules.canRead(levels.public, 'pub01')).to.be.true;
    });

    it('protected can be read by protected and up', () => {
      expect(rules.canRead(levels.public, 'pro01')).to.be.false;
      expect(rules.canRead(levels.protected, 'pro01')).to.be.true;
    });

    it('private can be read by private and up', () => {
      expect(rules.canRead(levels.protected, 'pri01')).to.be.false;
      expect(rules.canRead(levels.private, 'pri01')).to.be.true;
    });

    it('internal can be read by internal and up', () => {
      expect(rules.canRead(levels.private, 'int01')).to.be.false;
      expect(rules.canRead(levels.internal, 'int01')).to.be.true;
    });

    it('no one can read uknown keys', () => {
      expect(rules.canRead(levels.internal, 'missing')).to.be.false;
    });
  });

  describe('#canWrite()', () => {
    it('public can be written by protected and up', () => {
      expect(rules.canWrite(levels.public, 'pub01')).to.be.false;
      expect(rules.canWrite(levels.protected, 'pub01')).to.be.true;
    });

    it('protected can be written by protected and up', () => {
      expect(rules.canWrite(levels.public, 'pro01')).to.be.false;
      expect(rules.canWrite(levels.protected, 'pro01')).to.be.true;
    });

    it('private can be written by internal and up', () => {
      expect(rules.canWrite(levels.private, 'pri01')).to.be.false;
      expect(rules.canWrite(levels.internal, 'pri01')).to.be.true;
    });

    it('internal can be written by internal and up', () => {
      expect(rules.canWrite(levels.private, 'int01')).to.be.false;
      expect(rules.canWrite(levels.internal, 'int01')).to.be.true;
    });

    it('no one can write uknown keys', () => {
      expect(rules.canWrite(levels.internal, 'missing')).to.be.false;
    });
  });
});
