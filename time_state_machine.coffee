_ = require("lodash")
Logger = require('./logger')

class TimeStateMachine
  transitions: null
  state: null
  constructor: (transitions) ->
    @transitions = _.defaults(transitions,
      off:
        default: "off"
    )

  handle: (event) ->
    currentTransitions = @transitions[event]

    unless currentTransitions
      Logger.warn("No transition from ", @state, " for event ", event)
      return

    newState = currentTransitions[@state]
    newState = currentTransitions["default"]  unless newState

    Logger.verbose("TimeStateMachine: Transition to", newState)
    @setState newState
    newState

  setState: (newState) ->
    @state = newState

module.exports = TimeStateMachine
