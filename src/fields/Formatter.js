'use strict';

//
// Formatter class converts (usernames, metanames) to database keys, back an forth.
//

const toArray = (thing) => {
  return Array.isArray(thing)
    ? thing
    : [thing];
};

const crossJoin = (left, right) => {
  return left.reduce((join, leftItem) => {
    join.push(...right.map(rightItem => `${leftItem}:${rightItem}`));
    return join;
  }, []);
};

class Formatter {
  static toKeys (usernames, metanames) {
    return crossJoin(
      toArray(usernames),
      toArray(metanames)
    );
  }

  static toResult (usernames, keys = [], values = []) {
    const result = toArray(usernames).reduce((ref, username) => {
      ref[username] = {};
      return ref;
    }, {});

    keys.forEach((key, index) => {
      const [username, metaname] = key.split(':');
      const value = values[index];

      if (value !== null)
        result[username][metaname] = value;
    });

    return result;
  }
}

module.exports = Formatter;
