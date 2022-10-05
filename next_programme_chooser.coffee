classy = require("classy")
TimeService = require("./time_service")
TimeStateMachine = require("./time_state_machine")
NextProgrammeChooser = classy.define(
  programme: null
  stateMachines: null
  timeService: null
  currentState: null
  init: ->
    @stateMachines = @buildStateMachines()
    @timeService = new TimeService()
    return

  setProgramme: (programme) ->
    @programme = programme
    return

  handle: (event) ->
    currentStateMachine = @chooseStateMachine()
    currentStateMachine.setState @currentState
    @currentState = currentStateMachine.handle(event)
    console.log "Entering state", @currentState
    @currentState

  chooseStateMachine: ->
    if @timeService.isEvening()
      @stateMachines.evening
    else if @timeService.isMorning()
      @stateMachines.morning
    else if @timeService.isNight()
      @stateMachines.night
    else
      console.log "WARNING: Unknown time"
      @stateMachines.morning

  buildStateMachines: ->
    result = {}
    result.evening = new TimeStateMachine(on:
      default: "evening"
      evening: "dimmed"
    )
    result.morning = new TimeStateMachine(on:
      default: "morning"
    )
    result.night = new TimeStateMachine(on:
      default: "night"
    )
    result
)
module.exports = NextProgrammeChooser
