'use strict';

const assert = require('assert');

const StateMachineBuilder = require('../state_machine_builder');
const TimeStateMachine = require('../time_state_machine');

describe('StateMachineBuilder', function () {
  describe('call', function () {
    it('builds the expected TimeStateMachines', function () {
      const input = {
        transitions: {
          evening: {
            on: {
              default: 'evening',
              evening: 'dimmed'
            },

            off: {
              default: 'tree',
              tree: 'off'
            }
          },

          morning: {
            on: {
              default: 'morning'
            }
          }
        }
      };

      const result = StateMachineBuilder(input).call();

      const eveningTSMachine = new TimeStateMachine({
        on: {
          default: 'evening',
          evening: 'dimmed'
        },
        off: {
          default: 'tree',
          tree: 'off'
        }
      });

      assert.deepEqual(eveningTSMachine._getTransitions(), result.evening._getTransitions());
    });

    it('sets a default "off" transition if it is not specified', function () {
      const input = {
        transitions: {
          evening: {
            on: {
              default: 'evening'
            }
          },

          morning: {
            on: {
              default: 'morning'
            }
          }
        }
      };

      const result = StateMachineBuilder(input).call();

      const eveningTSMachine = new TimeStateMachine({
        on: {
          default: 'evening'
        },
        off: {
          default: 'off'
        }
      });

      const morningTSMachine = new TimeStateMachine({
        on: {
          default: 'morning'
        },
        off: {
          default: 'off'
        }
      });

      assert.deepEqual(morningTSMachine._getTransitions(), result.morning._getTransitions());
      assert.deepEqual(eveningTSMachine._getTransitions(), result.evening._getTransitions());
    });
  });
});
