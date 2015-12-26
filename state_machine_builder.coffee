_ = require('lodash')
TimeStateMachine = require("./time_state_machine")
Logger = require('./logger')

class StateMachineBuilder
  constructor: (@config) ->

  call: ->
    result = {}

    _(_.keys(@config.transitions)).each((period) =>
      result[period] = new TimeStateMachine(@config.transitions[period])
    )

    result

module.exports = StateMachineBuilder
