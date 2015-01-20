_ = require("lodash")
EventEmitter = require("events").EventEmitter

class CommandParser extends EventEmitter
  constructor: ->
    @programmeRegex = /programme (.*)/
    @getNeighborsRegex = /neighbors (.*)/

  parse: (command) ->
    match = command.match(@programmeRegex)
    if match
      programmeName = match[1]
      @emit("programmeChosen", programmeName)

    neighborsMatch = command.match(@getNeighborsRegex)
    if neighborsMatch
      nodeId = parseInt(neighborsMatch[1], 10)
      @emit("neighborsRequested", nodeId)

module.exports = CommandParser
