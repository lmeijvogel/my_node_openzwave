_ = require("lodash")
EventEmitter = require("events").EventEmitter

class CommandParser extends EventEmitter
  constructor: ->
    @programmeRegex = /programme (.*)/

  parse: (command) ->
    match = command.match(@programmeRegex)
    if match
      programmeName = match[1]
      @emit("programmeChosen", programmeName)

module.exports = CommandParser
