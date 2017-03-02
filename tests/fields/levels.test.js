'use strict';

const levels = require('../../src/fields/levels');

describe('levels', () => {
  const parse = levels.parse;

  it('public < protected < private < internal', () => {
    expect(levels.protected).to.be.greaterThan(levels.public);
    expect(levels.private).to.be.greaterThan(levels.protected);
    expect(levels.internal).to.be.greaterThan(levels.private);
  });

  it('public — no username and no secret', () => {
    expect(parse({secretMatches: false})).to.equal(levels.public);
  });

  it('public — secret without username makes no sense', () => {
    expect(parse({secretMatches: true})).to.equal(levels.public);
  });

  it('private — username but no secret', () => {
    expect(parse({secretMatches: false, username: 'joe'})).to.equal(levels.private);
  });

  it('internal — username and secret', () => {
    expect(parse({secretMatches: true, username: 'joe'})).to.equal(levels.internal);
  });
});
