'use strict';

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

  static toResult (keys, values) {
    return keys.reduce((ref, key, index) => {
      const value = values[index];

      if (value !== null) {
        const [username, metaname] = key.split(':');
        ref[username] = ref[username] || {};
        ref[username][metaname] = value;
      }

      return ref;
    }, {});
  }
}

module.exports = Formatter;