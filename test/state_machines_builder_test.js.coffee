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
            },

            off: {
              default: "tree",
              tree: "off"
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
          default: "tree",
          tree: "off"
      )

      assert.deepEqual(eveningTSMachine._getTransitions(), result.evening._getTransitions())
