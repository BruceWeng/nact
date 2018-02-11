const { decode } = require('./protocol');
const { dispatch } = require('./remote-dispatch');
const { spawnStateless, start } = require('../index');

const net = require('net');

const createServer = (system, port, host) => {
  const server = net.createServer(connection => {
    decode(connection).then(({ msg, sender, recipient }) => {
      const concreteRecipient = system.find(recipient);
      if (concreteRecipient && concreteRecipient.dispatch && concreteRecipient.isPublic) {
        concreteRecipient.dispatch(msg, sender);
      }
      connection.end();
    }).catch(err => console.warn('Encoding error: ', err));
  });
  return new Promise((resolve, reject) => {
    server.listen({ port, host }, () => {
      resolve(server);
    });
  });
};

let testF = async () => {
  const system = start();
  const actor = spawnStateless(system, (msg) => { console.log(msg); });
  createServer(system, 3003).then((server) => {
    dispatch(3003, undefined, 'apricot', actor, actor);
    setTimeout(() => server.close(), 5000);
  });
};

testF();

module.exports.createServer = createServer;
