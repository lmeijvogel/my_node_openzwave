Redis = require("redis")
_ = require("lodash")

class RedisInterface
  subscriptionRedis: null
  dataRedis: null
  commandReceivedHandlers: null
  commandChannel: null

  constructor: (@commandChannel) ->
    @commandReceivedHandlers = []

  start: ->
    @subscriptionRedis = Redis.createClient()
    @dataRedis = Redis.createClient()
    @subscriptionRedis.on "message", (channel, message) =>
      console.log "Message received: " + channel + ": '" + message + "'"
      if channel == @commandChannel
        _.each @commandReceivedHandlers, (handler) ->
          handler.call this, message

    @subscriptionRedis.subscribe @commandChannel

  programmeChanged: (name) ->
    @dataRedis.set "zwave_programme", name

  onCommandReceived: (handler) ->
    @commandReceivedHandlers.push handler

  storeValue: (lightName, commandClass, value) ->
    @dataRedis.hset("node_#{lightName}", "class_#{commandClass}", value.value)

    console.log(lightName, commandClass, value.value)

  cleanUp: ->
    @subscriptionRedis.unsubscribe()
    @subscriptionRedis.end()
    @dataRedis.end()

module.exports = RedisInterface
