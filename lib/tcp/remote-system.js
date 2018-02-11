const systemMap = require('../system-map');
const { dispatch, query } = require('./remote-actor');
class RemoteActorSystem {
  constructor (systemId, port, host) {
    this.name = systemId;
    this.systemId = systemId;
    this.host = host;
    this.port = port;
    this.tempReferences = new Map();
    systemMap.add(this);
  }

  addTempReference (reference, deferral) {
    this.tempReferences.set(reference.id, deferral);
  }

  removeTempReference (reference) {
    this.tempReferences.delete(reference.id);
  }

  find (recipient) {
    return {
      dispatch: (msg, sender) => dispatch(this.port, this.host, recipient, msg, sender),
      query: (msg, sender, timeout) => query(this.port, this.host, recipient, msg, timeout, this)
    };
  }
}

module.exports.RemoteActorSystem = RemoteActorSystem;
