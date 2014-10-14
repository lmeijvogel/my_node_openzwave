Redis = require("redis")
_ = require("lodash")
Logger = require('./logger')
EventEmitter = require("events").EventEmitter

class RedisInterface extends EventEmitter
  subscriptionRedis: null
  dataRedis: null
  commandChannel: null

  constructor: (@commandChannel) ->

  start: ->
    @subscriptionRedis = Redis.createClient()
    @dataRedis = Redis.createClient()
    @subscriptionRedis.on "message", (channel, message) =>
      Logger.verbose("Message received: " + channel + ": '" + message + "'")
      if channel == @commandChannel
        @emit "commandReceived", message

    @subscriptionRedis.subscribe @commandChannel

  programmeChanged: (name) ->
    Logger.verbose("Storing new programme in Redis: '%s'", name)
    @dataRedis.set "zwave_programme", name

  storeValue: (lightName, commandClass, value) ->
    @dataRedis.hset("node_#{lightName}", "class_#{commandClass}", value.value)

    Logger.debug("Stored in Redis: ", lightName, commandClass, value.value)

  cleanUp: ->
    @subscriptionRedis.unsubscribe()
    @subscriptionRedis.end()
    @dataRedis.end()

module.exports = RedisInterface
