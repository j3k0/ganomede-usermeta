'use strict';

describe('Rules', () => {

  const Rules = require('../../src/fields/Rules');
  const levels = require('../../src/fields/levels');

  const rules = new Rules({
    publicKeys: ['public', 'pub01'],
    protectedKeys: ['protected', 'pro01'],
    privateKeys: ['private', 'pri01']
  });

  describe('new Rules()', () => {
    it('throws on key intersection', () => {
      const create = () => new Rules({
        publicKeys: ['same key'],
        protectedKeys: ['same key'],
        privateKeys: ['different']
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

    it('internal can read unspecified keys', () => {
      expect(rules.canRead(levels.private, 'unspecified')).to.be.false;
      expect(rules.canRead(levels.internal, 'unspecified')).to.be.true;
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

    it('internal can write unspecified keys', () => {
      expect(rules.canWrite(levels.private, 'unspecified')).to.be.false;
      expect(rules.canWrite(levels.internal, 'unspecified')).to.be.true;
    });
  });
});
