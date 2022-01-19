const { ENV, HOST, PORT } = process.env;

const SERVER_CONFIG = {
  port: PORT || 8000,
  env: ENV,
  hostname: HOST,
};

module.exports = SERVER_CONFIG;


