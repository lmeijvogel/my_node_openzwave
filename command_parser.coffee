_ = require("lodash")

class CommandParser
  programmeSelectedCallbacks: null

  constructor: ->
    @programmeSelectedCallbacks = []

  parse: (command) ->
    programmeRegex = /programme (.*)/
    match = command.match(programmeRegex)
    if match
      programmeName = match[1]
      @callProgrammeSelectedCallbacks programmeName

  onProgrammeSelected: (handler) ->
    @programmeSelectedCallbacks.push handler

  callProgrammeSelectedCallbacks: (programmeName) ->
    _.each @programmeSelectedCallbacks, (handler) ->
      handler.call this, programmeName

module.exports = CommandParser
