winston = require('winston')
moment = require('moment')

class WinstonLogger
  constructor: ->
    @logger = @createLogger()

  # Don't enable logging to file by default since it would then also do
  # that while running tests
  enableLogToFile: (filename) ->
    @logger = @createLogger(filename)

  debug: (str...) ->
    @logger.log("debug", str...)
  verbose: (str...) ->
    @logger.verbose(str...)
  info: (str...) ->
    @logger.log("info", str...)
  error: (str...) ->
    @logger.log("error", str...)
  warn: (str...) ->
    @logger.log("warn", str...)

  createLogger: (filename) ->
    transports = [
        new winston.transports.Console({'timestamp': @timestamp, 'level': 'info'})
    ]

    if filename
      transports.push new winston.transports.File({'filename': 'log/node-zwave.log', 'timestamp': true, 'level': 'verbose'})

    new (winston.Logger)(
      transports: transports
    )

  timestamp: (time) ->
    moment(time).format("YYYY-MM-DD HH:mm:ss")

module.exports = new WinstonLogger()
