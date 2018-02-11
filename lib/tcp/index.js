const { createServer } = require('./server');
const configureTcp = (port, hostame) => (system) => {
  return Object.assign(system, { tcpServer: createServer(system, port, hostame) });
};

module.exports.configureTcp = configureTcp;
