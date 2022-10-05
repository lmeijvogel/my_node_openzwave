_ = require("lodash")
EventEmitter = require("events").EventEmitter

class CommandParser extends EventEmitter
  constructor: ->
    programmeRegex = /programme (.*)/
    getNeighborsRegex = /neighbors (.*)/
    healNetworkRegex = /healNetwork/

    @handlers = [
      [programmeRegex, @programmeChosen]
      [getNeighborsRegex, @neighborsRequested],
      [healNetworkRegex, @healNetworkRequested]
    ]

  parse: (command) ->
    _.each(@handlers, (handler) =>
      [key, value] = handler
      match = command.match(key)

      if match
        value.call(this, match)
        return
    )

  programmeChosen: (match) ->
    programmeName = match[1]
    @emit("programmeChosen", programmeName)

  neighborsRequested: (match) ->
    nodeId = parseInt(match[1], 10)
    @emit("neighborsRequested", nodeId)

  healNetworkRequested: ->
    @emit("healNetworkRequested")

module.exports = CommandParser
