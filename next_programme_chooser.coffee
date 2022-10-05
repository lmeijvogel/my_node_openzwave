TimeService = require("./time_service")
TimeStateMachine = require("./time_state_machine")

class NextProgrammeChooser
  programme: null
  stateMachines: null
  timeService: null
  currentState: null

  constructor: ->
    @stateMachines = @buildStateMachines()
    @timeService = new TimeService()

  setProgramme: (programme) ->
    @programme = programme

  handle: (event) ->
    currentStateMachine = @chooseStateMachine()
    currentStateMachine.setState @currentState
    @currentState = currentStateMachine.handle(event)
    console.log "Entering state", @currentState
    @currentState

  chooseStateMachine: ->
    if      @timeService.isEvening() then @stateMachines.evening
    else if @timeService.isMorning() then @stateMachines.morning
    else if @timeService.isNight()   then @stateMachines.night
    else
      console.log "WARNING: Unknown time"
      @stateMachines.morning

  buildStateMachines: ->
    {
      evening: new TimeStateMachine(on:
        default: "evening"
        evening: "dimmed"
      )
      morning: new TimeStateMachine(on:
        default: "morning"
      )
      night: new TimeStateMachine(on:
        default: "night"
      )
    }

module.exports = NextProgrammeChooser
