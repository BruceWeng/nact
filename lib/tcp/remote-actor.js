const assert = require('assert');
const { Deferral } = require('../deferral');
const { Actor } = require('../actor');
const { encode } = require('./protocol');
const net = require('net');
const { TemporaryReference, Nobody } = require('../references');

const dispatch = (port, host, recipient, msg, sender = new Nobody()) => {
  const client = net.createConnection(port, host, () => {
    encode(msg, recipient, sender).pipe(client);
  });
};

const query = (port, host, recipient, message, timeout, system) => {
  assert(timeout !== undefined && timeout !== null);
  const deffered = new Deferral();
  timeout = Actor.getSafeTimeout(timeout);
  const timeoutHandle = setTimeout(() => { deffered.reject(new Error('Query Timeout')); }, timeout);
  const tempReference = new TemporaryReference(system.name);
  system.addTempReference(tempReference, deffered);
  deffered.promise.then(() => {
    clearTimeout(timeoutHandle);
    system.removeTempReference(tempReference);
  }).catch(() => {
    system.removeTempReference(tempReference);
  });

  if (typeof (message) === 'function') {
    message = message(tempReference);
  }
  dispatch(port, host, recipient, message, tempReference);
  return deffered.promise;
};

module.exports.query = query;
module.exports.dispatch = dispatch;
