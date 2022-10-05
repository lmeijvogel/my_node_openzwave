_ = require("lodash")

class CommandParser
  programmeSelectedCallbacks: null

  constructor: ->
    @programmeSelectedCallbacks = []
    @programmeRegex = /programme (.*)/


  parse: (command) ->
    match = command.match(@programmeRegex)
    if match
      programmeName = match[1]
      @callProgrammeSelectedCallbacks programmeName

  onProgrammeSelected: (handler) ->
    @programmeSelectedCallbacks.push handler

  callProgrammeSelectedCallbacks: (programmeName) ->
    _.each @programmeSelectedCallbacks, (handler) ->
      handler.call(this, programmeName)

module.exports = CommandParser
