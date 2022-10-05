_ = require("lodash")

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
    return  unless currentTransitions
    newState = currentTransitions[@state]
    newState = currentTransitions["default"]  unless newState
    @setState newState
    newState

  setState: (newState) ->
    @state = newState

module.exports = TimeStateMachine
