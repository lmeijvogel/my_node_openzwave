var winston = require('winston');
var moment  = require('moment');
var _       = require('lodash');

function WinstonLogger() {
  var logger = createLogger();

  // Don't enable logging to file by default since it would then also do
  // that while running tests
  function enableLogToFile(filename) {
    logger = createLogger(filename);
  }

  function setSilent(silent) {
    _.each(logger.transports, function (transport) {
      transport.silent = silent;
    });
  }

  function debug() {
    _log("debug", arguments);
  }
  function verbose() {
    _log("verbose", arguments);
  }
  function info() {
    _log("info", arguments);
  }
  function warn() {
    _log("warn", arguments);
  }
  function error() {
    _log("error", arguments);
  }

  function _log(level, params) {
    var args = [level].concat(_.values(params));

    logger.log.apply(logger, args);
  }

  function createLogger(filename) {
    var transports = [
        new winston.transports.Console({'timestamp': timestamp, 'level': 'info'})
    ];

    if (filename) {
      transports.push(new winston.transports.File({'filename': filename, 'timestamp': true, 'level': 'verbose'}));
    }

    return new (winston.Logger)({
      transports: transports
    });
  }

  function timestamp(time) {
    return moment(time).format("YYYY-MM-DD HH:mm:ss");
  }

  return {
    enableLogToFile: enableLogToFile,
    setSilent: setSilent,
    debug: debug,
    verbose: verbose,
    info: info,
    warn: warn,
    error: error
  };
}

module.exports = new WinstonLogger();
