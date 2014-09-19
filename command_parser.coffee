classy = require("classy")
_ = require("lodash")
CommandParser = classy.define(
  programmeSelectedCallbacks: null
  init: ->
    @programmeSelectedCallbacks = []
    return

  parse: (command) ->
    programmeRegex = /programme (.*)/
    match = command.match(programmeRegex)
    if match
      programmeName = match[1]
      @callProgrammeSelectedCallbacks programmeName
    return

  onProgrammeSelected: (handler) ->
    @programmeSelectedCallbacks.push handler
    return

  callProgrammeSelectedCallbacks: (programmeName) ->
    _.each @programmeSelectedCallbacks, (handler) ->
      handler.call this, programmeName
      return

    return
)
module.exports = CommandParser
