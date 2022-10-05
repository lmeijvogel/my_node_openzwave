assert               = require('assert')
Node                 = require('../node')
_                    = require('lodash')

NextProgrammeChooser = require('../next_programme_chooser')
TimeStateMachine     = require('../time_state_machine')
EventProcessor       = require('../event_processor')

describe "integration", ->
  before ->
    @myZWave = {
      onNodeEvent: (handler) => @handler = handler
    }

    @timeService = {
      getPeriod: -> "evening"
    }

    stateMachines = { evening: new TimeStateMachine(
      on: {
        evening: "dimmed"
        default: "evening"
      }
    )}

    programmes = {}

    _(['evening', 'dimmed', 'off']).each( (name) =>
      programmes[name] = { name: name, apply: => @programme = name}
    )

    @nextProgrammeChooser = new NextProgrammeChooser(@timeService, stateMachines)

    @eventProcessor = new EventProcessor(@myZWave, programmes, @nextProgrammeChooser)

    @switchOff = =>
      @handler.call @myZWave, new Node(3), 0

    @switchOn  = =>
      @handler.call @myZWave, new Node(3), 255

  context "when switching the lights off and on", ->
    it "ends up in 'evening' state", ->
      @switchOff()
      assert.equal(@programme, "off")

      @switchOn()
      assert.equal(@programme, "evening")

  context "when alternating between programmes", ->
    it "works", ->
      @switchOff()

      @switchOn()
      assert.equal(@programme, "evening")

      @switchOn()
      assert.equal(@programme, "dimmed")

      @switchOn()
      assert.equal(@programme, "evening")
