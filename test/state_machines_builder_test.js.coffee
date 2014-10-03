assert = require('assert')

StateMachineBuilder = require('../state_machine_builder')
TimeStateMachine = require('../time_state_machine')

describe 'StateMachineBuilder', ->
  describe 'call', ->
    it "builds the expected TimeStateMachines", ->
      input = {
        transitions: {
          evening: {
            on: {
              default: "evening"
              evening: "dimmed"
            }
          }

          morning: {
            on: {
              default: "morning"
            }
          }
        }
      }

      result = new StateMachineBuilder(input).call()

      eveningTSMachine = new TimeStateMachine(
        on:
          default: "evening"
          evening: "dimmed"
        off:
          default: "off"
      )

      assert.deepEqual(eveningTSMachine, result.evening)