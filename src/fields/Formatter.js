'use strict';

//
// Formatter class converts (userIds, metanames) to database keys, back an forth.
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
  static toKeys (userIds, metanames) {
    return crossJoin(
      toArray(userIds),
      toArray(metanames)
    );
  }

  static toResult (userIds, keys = [], values = []) {
    const result = toArray(userIds).reduce((ref, userId) => {
      ref[userId] = {};
      return ref;
    }, {});

    keys.forEach((key, index) => {
      const [userId, metaname] = key.split(':');
      const value = values[index];

      if (value !== null)
        result[userId][metaname] = value;
    });

    return result;
  }
}

module.exports = Formatter;
