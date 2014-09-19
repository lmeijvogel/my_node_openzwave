classy = require("classy")
Redis = require("redis")
_ = require("lodash")
RedisInterface = classy.define(
  subscriptionRedis: null
  dataRedis: null
  commandReceivedHandlers: null
  commandChannel: null
  init: (commandChannel) ->
    @commandChannel = commandChannel
    @commandReceivedHandlers = []
    return

  start: ->
    self = this
    @subscriptionRedis = Redis.createClient()
    @dataRedis = Redis.createClient()
    @subscriptionRedis.on "message", (channel, message) ->
      console.log "Message received: " + channel + ": '" + message + "'"
      if channel is self.commandChannel
        _.each self.commandReceivedHandlers, (handler) ->
          handler.call this, message
          return

      return

    @subscriptionRedis.subscribe @commandChannel
    return

  programmeChanged: (name) ->
    @dataRedis.set "zwave_programme", name
    return

  onCommandReceived: (handler) ->
    @commandReceivedHandlers.push handler
    return

  storeValue: (lightName, commandClass, value) ->
    @dataRedis.hset("node_#{lightName}", "class_#{commandClass}", value.value)

    console.log(lightName, commandClass, value.value)

  cleanUp: ->
    @subscriptionRedis.unsubscribe()
    @subscriptionRedis.end()
    @dataRedis.end()
    return
)
module.exports = RedisInterface
