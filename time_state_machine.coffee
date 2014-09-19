classy = require("classy")
_ = require("lodash")
TimeStateMachine = classy.define(
  transitions: null
  state: null
  init: (transitions) ->
    @transitions = _.defaults(transitions,
      off:
        default: "off"
    )
    return

  handle: (event) ->
    currentTransitions = @transitions[event]
    return  unless currentTransitions
    newState = currentTransitions[@state]
    newState = currentTransitions["default"]  unless newState
    @setState newState
    newState

  setState: (newState) ->
    @state = newState
    return
)
module.exports = TimeStateMachine
