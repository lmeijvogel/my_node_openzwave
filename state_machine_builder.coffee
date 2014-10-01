_ = require('lodash')
TimeStateMachine = require("./time_state_machine")
Logger = require('./logger')

class StateMachineBuilder
  constructor: (@config) ->

  call: ->
    result = {}

    _(_.keys(@config.transitions)).each((period) =>
      result[period] = new TimeStateMachine(on: @config.transitions[period].on)
    )

    result

module.exports = StateMachineBuilder
