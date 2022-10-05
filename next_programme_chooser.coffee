_ = require('lodash')
Logger = require('./logger')

class NextProgrammeChooser
  programme: null
  stateMachines: null
  timeService: null
  currentState: null

  constructor: (@timeService, @stateMachines) ->

  setProgramme: (programme) ->
    @programme = programme

  handle: (event) ->
    currentStateMachine = @chooseStateMachine()
    currentStateMachine.setState @currentState
    @currentState = currentStateMachine.handle(event)
    Logger.verbose("Entering state", @currentState)
    @currentState

  chooseStateMachine: ->
    now = new Date()
    currentPeriod = @timeService.getPeriod(now)

    stateMachine = @stateMachines[currentPeriod]

    return stateMachine if stateMachine

    Logger.error("NextProgrammeChooser#chooseStateMachine: Unknown time")
    @stateMachines.morning

module.exports = NextProgrammeChooser
