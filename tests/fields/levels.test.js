'use strict';

describe('levels', () => {

  const levels = require('../../src/fields/levels');

  const parse = levels.parse;

  it('public < protected < private < internal', () => {
    expect(levels.protected).to.be.greaterThan(levels.public);
    expect(levels.private).to.be.greaterThan(levels.protected);
    expect(levels.internal).to.be.greaterThan(levels.private);
  });

  it('public — no userId and no secret', () => {
    expect(parse({secretMatches: false})).to.equal(levels.public);
  });

  it('private — userId but no secret', () => {
    expect(parse({secretMatches: false, userId: 'joe'})).to.equal(levels.private);
  });

  it('internal — secret without userId', () => {
    expect(parse({secretMatches: true})).to.equal(levels.internal);
  });

  it('internal — userId and secret', () => {
    expect(parse({secretMatches: true, userId: 'joe'})).to.equal(levels.internal);
  });
});
