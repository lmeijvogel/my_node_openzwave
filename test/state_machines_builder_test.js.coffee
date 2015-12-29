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

      result = StateMachineBuilder(input).call()

      eveningTSMachine = new TimeStateMachine(
        on:
          default: "evening"
          evening: "dimmed"
        off:
          default: "tree",
          tree: "off"
      )

      assert.deepEqual(eveningTSMachine._getTransitions(), result.evening._getTransitions())

    it "sets a default 'off' transition if it is not specified", ->
      input = {
        transitions: {
          evening: {
            on: {
              default: "evening"
            }
          }

          morning: {
            on: {
              default: "morning"
            }
          }
        }
      }

      result = StateMachineBuilder(input).call()

      eveningTSMachine = new TimeStateMachine(
        on:
          default: "evening"
        off:
          default: "off"
      )

      morningTSMachine = new TimeStateMachine(
        on:
          default: "morning"
        off:
          default: "off"
      )
      assert.deepEqual(morningTSMachine._getTransitions(), result.morning._getTransitions())
      assert.deepEqual(eveningTSMachine._getTransitions(), result.evening._getTransitions())
