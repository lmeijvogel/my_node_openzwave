_ = require("lodash")
EventEmitter = require("events").EventEmitter

class CommandParser extends EventEmitter
  constructor: ->
    nodeValueRegex    = /get (\w+) (\w+) (\w+)/
    programmeRegex    = /programme (.*)/
    getNeighborsRegex = /neighbors (.*)/
    healNetworkRegex  = /healNetwork/

    @handlers = [
      [nodeValueRegex,    @nodeValueRequested]
      [programmeRegex,    @programmeChosen]
      [getNeighborsRegex, @neighborsRequested]
      [healNetworkRegex,  @healNetworkRequested]
    ]

  parse: (command) ->
    _.each(@handlers, (handler) =>
      [key, value] = handler
      match = command.match(key)

      if match
        value.call(this, match)
        return
    )

  nodeValueRequested: (match) ->
    [x, nodeId, commandClass, index] = match

    @emit("nodeValueRequested", nodeId, commandClass, index)

  programmeChosen: (match) ->
    programmeName = match[1]
    @emit("programmeChosen", programmeName)

  neighborsRequested: (match) ->
    nodeId = parseInt(match[1], 10)
    @emit("neighborsRequested", nodeId)

  healNetworkRequested: ->
    @emit("healNetworkRequested")

module.exports = CommandParser
