'use strict';

// The reason for a wierd export, is that we don't want parse to be enumerable.

class Levels {
  // There are no `protected` access level.
  static parse ({secretMatches, username}) {
    if (secretMatches)
      return Levels.internal;

    return username
      ? Levels.private
      : Levels.public;
  }
}

module.exports = Object.assign(Levels, {
  public: 10,
  protected: 20,
  private: 30,
  internal: 40
});
