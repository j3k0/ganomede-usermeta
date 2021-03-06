'use strict';

describe('Formatter', () => {

  const Formatter = require('../../src/fields/Formatter');

  describe('.toKeys()', () => {
    it('converts single userId and single meta', () => {
      expect(Formatter.toKeys('alice', 'country')).to.eql(['alice:country']);
    });

    it('converts multiple userIds and single meta', () => {
      expect(Formatter.toKeys(['alice', 'bob'], ['country'])).to.eql([
        'alice:country',
        'bob:country'
      ]);
    });

    it('converts single userId and multiple metas', () => {
      expect(Formatter.toKeys(['alice'], ['country', 'email'])).to.eql([
        'alice:country',
        'alice:email'
      ]);
    });

    it('converts multiple userIds and multiple metas', () => {
      expect(Formatter.toKeys(['alice', 'bob'], ['country', 'email'])).to.eql([
        'alice:country',
        'alice:email',
        'bob:country',
        'bob:email'
      ]);
    });

    it('empty userIds mean empty keys', () => {
      expect(Formatter.toKeys([], ['x', 'y'])).to.eql([]);
    });

    it('empty metanames mean empty keys', () => {
      expect(Formatter.toKeys(['alice', 'bob'], [])).to.eql([]);
    });
  });

  describe('.toResult()', () => {
    it('converts .toKeys() and their results to object', () => {
      const keys = [
        'alice:country',
        'alice:email',
        'bob:country',
        'bob:email'
      ];

      const values = [
        'USA',
        'alice@example.com',
        'Russia',
        'bob@example.com'
      ];

      expect(Formatter.toResult(['alice', 'bob'], keys, values)).to.eql({
        alice: {
          country: 'USA',
          email: 'alice@example.com'
        },

        bob: {
          country: 'Russia',
          email: 'bob@example.com'
        }
      });
    });

    it('missing redis keys are not included to result', () => {
      const keys = ['alice:country', 'alice:email'];
      const values = ['USA', null];
      expect(Formatter.toResult(['alice', 'bob'], keys, values)).to.eql({
        alice: {country: 'USA'},
        bob: {}
      });
    });

    it('outputs empty object for userIds with no metas', () => {
      expect(Formatter.toResult(['alice'], ['alice:missing'], [null])).to.eql({alice: {}});
    });
  });
});
