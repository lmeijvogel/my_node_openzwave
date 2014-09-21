_ = require("lodash")

class CommandParser

  constructor: ->
    @programmeRegex = /programme (.*)/

  parse: (command, onProgrammeSelected) ->
    match = command.match(@programmeRegex)
    if match
      programmeName = match[1]
      onProgrammeSelected(programmeName)

module.exports = CommandParser
