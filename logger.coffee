winston = require('winston')
moment = require('moment')

class Logger
  constructor: ->
    @winston = new WinstonLogger()

  debug: (str...) ->
    @winston.debug(str...)
  verbose: (str...) ->
    @winston.verbose(str...)
  info: (str...) ->
    @winston.info(str...)
  error: (str...) ->
    @winston.error(str...)
  warn: (str...) ->
    @winston.warn(str...)

class WinstonLogger
  constructor: ->
    @logger = new (winston.Logger)(
      transports: [
        new (winston.transports.Console)({'timestamp': @timestamp, 'level': 'info'})
      ]
    )

  timestamp: (time) ->
    moment(time).format("YYYY-MM-DD HH:mm:ss")

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

module.exports = new Logger()
