'use strict';

const util = require('util');

const debugInspect = (what, {json = false} = {}) => {
  return json
    ? JSON.stringify(what, null, 2)
    : util.inspect(what, {depth: null, maxArrayLength: null});
};

const debugPrint = (what, {
  printFn = console.log, // eslint-disable-line no-console
  json = false
} = {}) => {
  const message = debugInspect(what, {json});
  printFn(message);
};

module.exports = {
  debugInspect,
  debugPrint,
  hasOwnProperty: (obj, prop) => Object.hasOwnProperty.call(obj, prop)
};
